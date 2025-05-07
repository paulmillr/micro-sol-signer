import { ed25519 } from '@noble/curves/ed25519';
import { base58, utf8 } from '@scure/base';
import * as P from 'micro-packed';

// Offchain Messages: ttps://docs.anza.xyz/cli/examples/sign-offchain-message/
// This is compatible with solana-cli sign-offchain-message

const isAscii = (data: Uint8Array) => data.every((b) => b >= 0x20 && b <= 0x7e);
const MAX_LEN_LEDGER = 1212;

const MessageV0 = P.struct({
  format: P.map(P.U8, {
    ascii: 0,
    utf8: 1,
    utf8ext: 2,
  }),
  // NOTE: we use bytes here because we need to check ascii-utf8 stuff
  msg: P.prefix(P.U16LE, P.bytes(null)),
});

const MessageRaw = P.validate(
  P.struct({
    // NOTE: we cannot encode 0xff as string (not valid utf8)
    magic: P.magicBytes(
      P.utils.concatBytes(new Uint8Array([0xff]), P.string(null).encode('solana offchain'))
    ),
    version: P.tag(P.U8, { 0: MessageV0 }),
  }),
  (msg) => {
    if (msg.version.TAG !== 0) throw new Error('Offchain.MessageRaw: unknown version');
    if (msg.version.data.msg.length > 65515) throw new Error('Offchain.MessageRaw: size limit');
    return msg;
  }
);

const Message = P.apply(MessageRaw, {
  encode(from) {
    const { msg, format } = from.version.data;
    if (isAscii(msg) && format !== 'ascii')
      throw new Error('Offchain.Message: non-ascii encoding of ascii message');
    if (msg.length > MAX_LEN_LEDGER && format !== 'utf8ext')
      throw new Error('Offchain.Message: non-extended utf8 message');
    return { version: from.version.TAG, msg: utf8.encode(from.version.data.msg) };
  },
  decode(to) {
    // no need to check for utf8 here, since decoder will fail otherwise
    const bytes = utf8.decode(to.msg);
    if (!bytes.length) throw new Error('Empty message');
    const format = bytes.length > MAX_LEN_LEDGER ? 'utf8ext' : isAscii(bytes) ? 'ascii' : 'utf8';
    return { version: { TAG: 0 as const, data: { format, msg: bytes } } };
  },
});

export const Offchain = {
  Message,
  MessageRaw,
  sign(privateKey: Uint8Array, msg: string, version: 0 = 0) {
    return base58.encode(ed25519.sign(Message.encode({ version, msg }), privateKey));
  },
  verify(sigature: string, publicKey: Uint8Array | string, msg: string, version: 0 = 0) {
    if (typeof publicKey === 'string') publicKey = base58.decode(publicKey);
    return ed25519.verify(base58.decode(sigature), Message.encode({ version, msg }), publicKey);
  },
};
