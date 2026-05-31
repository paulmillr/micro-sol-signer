import { ed25519 } from '@noble/curves/ed25519.js';
import { base58, utf8, type TArg, type TRet } from '@scure/base';
import * as P from 'micro-packed';
import { deepFreeze, type CoderType as IDLCoderType } from './idl/index.ts';

// Offchain Messages: https://docs.anza.xyz/cli/examples/sign-offchain-message/
// This is compatible with solana-cli sign-offchain-message

// Offchain "ascii" mode is limited to printable bytes; control characters stay in utf8 mode.
const isAscii = (data: TArg<Uint8Array>) => data.every((b) => b >= 0x20 && b <= 0x7e);
// Ledger-compatible cutoff for plain ascii/utf8 display mode; longer messages use utf8ext.
const MAX_LEN_LEDGER = 1212;

type MessageV0Type = {
  format: string;
  msg: Uint8Array;
};
type MessageRawType = {
  magic: undefined;
  version: { TAG: 0; data: MessageV0Type };
};
type MessageType = {
  version: 0;
  msg: string;
};
type OffchainHelpers = {
  Message: IDLCoderType<MessageType>;
  MessageRaw: IDLCoderType<MessageRawType>;
  sign: (privateKey: TArg<Uint8Array>, msg: string, version?: 0) => string;
  verify: (
    signature: string,
    publicKey: TArg<Uint8Array | string>,
    msg: string,
    version?: 0
  ) => boolean;
};

// Keep exported offchain byte inputs broad; micro-packed infers narrower buffers internally.
const MessageV0Struct: P.CoderType<MessageV0Type> = P.struct({
  format: P.map(P.U8, {
    ascii: 0,
    utf8: 1,
    utf8ext: 2,
  }),
  // NOTE: we use bytes here because we need to check ascii-utf8 stuff
  msg: P.prefix(P.U16LE, P.bytes(null)),
}) as unknown as P.CoderType<MessageV0Type>;
const MessageV0Codec: P.CoderType<MessageV0Type> = /* @__PURE__ */ P.apply(MessageV0Struct, {
  encode(from) {
    // P.bytes(null) decodes a view; copy so decoded mutation cannot corrupt caller bytes.
    // Buffer.slice() aliases memory, so force a fresh Uint8Array copy.
    return { ...from, msg: Uint8Array.from(from.msg) };
  },
  decode: (to) => to,
}) as unknown as P.CoderType<MessageV0Type>;
const MessageV0: IDLCoderType<P.UnwrapCoder<typeof MessageV0Codec>> = /* @__PURE__ */ deepFreeze(
  MessageV0Codec as IDLCoderType<P.UnwrapCoder<typeof MessageV0Codec>>
);

const MessageRawCodec: P.CoderType<MessageRawType> = /* @__PURE__ */ P.validate(
  P.struct({
    // NOTE: we cannot encode 0xff as string (not valid utf8)
    magic: P.magicBytes(
      P.utils.concatBytes(new Uint8Array([0xff]), P.string(null).encode('solana offchain'))
    ),
    version: P.tag(P.U8, { 0: MessageV0 }),
  }),
  (msg) => {
    if (msg.version.TAG !== 0) throw new Error('Offchain.MessageRaw: unknown version');
    // 16-byte magic plus version/format/length headers leave 65515 msg bytes in the u16 envelope.
    if (msg.version.data.msg.length > 65515) throw new Error('Offchain.MessageRaw: size limit');
    return msg;
  }
) as unknown as P.CoderType<MessageRawType>;
const MessageRaw: IDLCoderType<P.UnwrapCoder<typeof MessageRawCodec>> = /* @__PURE__ */ deepFreeze(
  MessageRawCodec as IDLCoderType<P.UnwrapCoder<typeof MessageRawCodec>>
);

const MessageCodec: P.CoderType<MessageType> = /* @__PURE__ */ P.apply(MessageRaw, {
  encode(from: TArg<MessageRawType>): TRet<MessageType> {
    from = from as MessageRawType;
    const { msg, format } = from.version.data;
    const long = msg.length > MAX_LEN_LEDGER;
    // Solana SDK uses ascii mode only within the Ledger cutoff; longer printable ASCII is
    // utf8ext.
    if (long && format !== 'utf8ext')
      throw new Error('Offchain.Message: non-extended utf8 message');
    if (!long && isAscii(msg) && format !== 'ascii')
      throw new Error('Offchain.Message: non-ascii encoding of ascii message');
    return { version: from.version.TAG, msg: utf8.encode(msg) } as TRet<MessageType>;
  },
  decode(to: TArg<MessageType>): TRet<MessageRawType> {
    to = to as MessageType;
    // High-level offchain messages only support v0; malformed versions otherwise encode as v0.
    if (!to || typeof to !== 'object' || Array.isArray(to))
      throw new Error('Offchain.Message: message must be an object');
    if (to.version !== 0) throw new Error('Offchain.MessageRaw: unknown version');
    if (typeof to.msg !== 'string') throw new Error('Offchain.Message: msg must be a string');
    // no need to check for utf8 here, since decoder will fail otherwise
    const bytes = utf8.decode(to.msg);
    if (!bytes.length) throw new Error('Empty message');
    const format = bytes.length > MAX_LEN_LEDGER ? 'utf8ext' : isAscii(bytes) ? 'ascii' : 'utf8';
    return {
      magic: undefined,
      version: { TAG: 0 as const, data: { format, msg: new Uint8Array(bytes) } },
    } as TRet<MessageRawType>;
  },
} as any) as unknown as P.CoderType<MessageType>;
const Message: IDLCoderType<P.UnwrapCoder<typeof MessageCodec>> = /* @__PURE__ */ deepFreeze(
  MessageCodec as IDLCoderType<P.UnwrapCoder<typeof MessageCodec>>
);

/**
 * Offchain message coders and sign/verify helpers compatible with the Solana CLI.
 * @example
 * Sign the exact offchain message format that `solana sign-offchain-message` expects.
 * ```ts
 * import { hex } from '@scure/base';
 * import { Offchain } from 'micro-sol-signer/offchain.js';
 * const signature = Offchain.sign(
 *   hex.decode('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f'),
 *   'hello'
 * );
 * ```
 */
export const Offchain: TRet<OffchainHelpers> = /* @__PURE__ */ deepFreeze({
  Message,
  MessageRaw,
  sign(privateKey: TArg<Uint8Array>, msg: string, version: 0 = 0) {
    return base58.encode(ed25519.sign(Message.encode({ version, msg }), privateKey));
  },
  verify(signature: string, publicKey: TArg<Uint8Array | string>, msg: string, version: 0 = 0) {
    // Accept either raw 32-byte public keys or base58-encoded Solana addresses.
    if (typeof publicKey === 'string') publicKey = base58.decode(publicKey);
    return ed25519.verify(base58.decode(signature), Message.encode({ version, msg }), publicKey);
  },
});
