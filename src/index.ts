import { ed25519 } from '@noble/curves/ed25519.js';
import { base58, base64, hex, type TArg, type TRet } from '@scure/base';
import * as P from 'micro-packed';
import {
  type AccountDefinitions,
  type CoderType as IDLCoderType,
  Decimal,
  type GetDefinedTypes,
  type GetInstructionArgs,
  type GetTypeIDL,
  PRECISION,
  type ParsedInstructions,
  deepFreeze,
  defineIDL,
  isOnCurve,
  programAddress,
  pubKey,
  shortU16,
} from './idl/index.ts';
// System: solana IDLs
import ALTIDL from './idl/alt.ts';
import ComputeBudgetIDL from './idl/computeBudget.ts';
import ConfigIDL from './idl/config.ts';
import MemoIDL from './idl/memo.ts';
import SystemIDL from './idl/system.ts';
import TokenIDL from './idl/token.ts';
import Token2022IDL from './idl/token2022.ts';
export { Offchain } from './offchain.ts';
export { Decimal, PRECISION, isOnCurve, programAddress, pubKey, shortU16 };
export type { AccountDefinitions, GetDefinedTypes, GetInstructionArgs, ParsedInstructions };
/** Generic byte-array type used by the public API. */
export type Bytes = Uint8Array;

// RFC 8200 sections 3/5 and RFC 768 leave 1232 bytes for UDP payload:
// 1280 - 40-byte IPv6 header - 8-byte UDP header.
const MAX_TX_SIZE = /* @__PURE__ */ (() => 1280 - 40 - 8)();

function removeUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  // bytesTypeNode decodes to Uint8Array; generic object handling corrupts bytes into records.
  if (obj instanceof Uint8Array) return obj;
  if (Array.isArray(obj)) return obj.map((item) => removeUndefined(item)) as unknown as T;
  const res: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    res[key] = removeUndefined(value);
  }
  return res as T;
}

/**
 * Validates a base58-encoded Solana address.
 * @param address - Address string to validate.
 * @throws On non-string input. {@link TypeError}
 * @throws On malformed or wrong-length Solana addresses. {@link RangeError}
 * @example
 * Reject malformed base58 addresses before building instructions.
 * ```ts
 * import { validateAddress } from 'micro-sol-signer';
 * validateAddress('11111111111111111111111111111111');
 * ```
 */
export function validateAddress(address: string) {
  if (typeof address !== 'string') throw new TypeError('Expected string');
  // Check syntax and 32-byte size only; program-derived addresses are intentionally off-curve.
  try {
    const pubkey = base58.decode(address);
    if (pubkey.length !== 32) throw new RangeError('Invalid Solana address');
  } catch (error) {
    // Preserve type failures; flatten malformed or wrong-length addresses into one value error.
    if (error instanceof TypeError || error instanceof RangeError) throw error;
    throw new RangeError('Invalid Solana address');
  }
}

/** Transaction account metadata. */
export type Account = {
  /** Base58 account address. */
  address: string;
  /** Whether the account must sign the transaction. */
  sign: boolean;
  /** Whether the account is writable for the instruction. */
  write: boolean;
};
/** Decoded instruction shape used by transaction builders. */
export type Instruction = {
  /** Program id that owns the instruction. */
  program: string;
  /** Ordered account metas passed to the instruction. */
  keys: Account[];
  /** Raw instruction data bytes. */
  data: Bytes;
};
const instructionInput = (inst: TArg<Instruction>): TRet<Instruction> => {
  // Public helpers share this root guard, rejecting malformed instructions before property reads.
  if (!inst || typeof inst !== 'object') throw new Error('SOL.tx: instruction must be an object');
  if (typeof inst.program !== 'string')
    throw new Error('SOL.tx: instruction program must be a string');
  if (!Array.isArray(inst.keys)) throw new Error('SOL.tx: instruction keys must be an array');
  if (!(inst.data instanceof Uint8Array)) throw new Error('SOL.tx: instruction data must be bytes');
  return inst as TRet<Instruction>;
};

/** High-level Solana message representation. */
export type Message = {
  // First signer pays fees; require an explicit feePayer because the implicit rule is easy to miss.
  /** Address that pays transaction fees. */
  feePayer: string;
  /** Recent blockhash attached to the message. */
  blockhash: string;
  /** Ordered instruction list. */
  instructions: Instruction[];
};
type MessageHeaderType = {
  requiredSignatures: number;
  readSigned: number;
  readUnsigned: number;
};
type RawInstruction = {
  programIdx: number;
  keys: number[];
  data: Bytes;
};
type MessageLegacyType = {
  header: MessageHeaderType;
  keys: string[];
  blockhash: string;
  instructions: RawInstruction[];
};
type MessageAddressTableLookupType = {
  account: string;
  writableIndexes: number[];
  readonlyIndexes: number[];
};
type MessageV0Type = MessageLegacyType & {
  ALT: MessageAddressTableLookupType[];
};
type MessageRawType = { TAG: 'legacy'; data: MessageLegacyType } | { TAG: 0; data: MessageV0Type };

// Message header counts mark read-only accounts at the tail of the signed and unsigned key groups.
const keyParams = (i: number, req: number, signed: number, unsigned: number, total: number) => ({
  sign: i < req ? true : false,
  write: i < req - signed || (i >= req && i < total - unsigned) ? true : false,
});

// Header bytes are required signatures, read-only signed accounts, and read-only unsigned accounts.
const MessageHeader: P.CoderType<MessageHeaderType> = /* @__PURE__ */ (() =>
  P.struct({
    requiredSignatures: P.U8,
    readSigned: P.U8,
    readUnsigned: P.U8,
  }))();

// Wire instructions store account-key indexes; MessageCoder maps them to address metas.
// Keep private coder aliases on broad `Bytes`; micro-packed currently infers narrower buffers.
const InstructionStruct: P.CoderType<RawInstruction> = /* @__PURE__ */ (() =>
  P.struct({
    programIdx: P.U8,
    keys: P.array(shortU16, P.U8),
    data: P.bytes(shortU16),
  }) as unknown as P.CoderType<RawInstruction>)();
const Instruction: P.CoderType<RawInstruction> = /* @__PURE__ */ P.apply(InstructionStruct, {
  encode(from) {
    // P.bytes(shortU16) may decode a view into caller bytes; raw messages must own data.
    // Buffer.slice() aliases memory, so force a fresh Uint8Array copy.
    return { ...from, data: Uint8Array.from(from.data) };
  },
  decode: (to) => to,
}) as unknown as P.CoderType<RawInstruction>;

// Legacy messages have no MessageVersion prefix.
// They contain only header, keys, blockhash, and instructions.
const MessageLegacy: P.CoderType<MessageLegacyType> = /* @__PURE__ */ (() =>
  P.struct({
    header: MessageHeader,
    keys: P.array(shortU16, pubKey),
    blockhash: pubKey,
    instructions: P.array(shortU16, Instruction),
  }))();

// Address-table lookups store the table account, then writable and readonly u8 indexes.
const MessageAddressTableLookup: P.CoderType<MessageAddressTableLookupType> = /* @__PURE__ */ (() =>
  P.struct({
    account: pubKey,
    writableIndexes: P.array(shortU16, P.U8),
    readonlyIndexes: P.array(shortU16, P.U8),
  }))();

// Version-0 messages append address-table lookups after the legacy-style message body.
const MessageV0: P.CoderType<MessageV0Type> = /* @__PURE__ */ (() =>
  P.struct({
    header: MessageHeader,
    keys: P.array(shortU16, pubKey),
    blockhash: pubKey,
    instructions: P.array(shortU16, Instruction),
    ALT: P.array(shortU16, MessageAddressTableLookup),
  }))();

// The high bit marks versioned messages; legacy decode peeks without consuming its header byte.
const MessageVersion: P.CoderType<number | 'legacy'> = /* @__PURE__ */ P.wrap({
  encodeStream(w, value) {
    if (value === 'legacy') {
      // legacy is empty!
    } else if (typeof value === 'number') {
      if (value < 0 || value > 127) throw new Error('Invalid message version');
      w.byte(0x80 | value);
    } else throw new Error('Invalid message version type');
  },
  decodeStream(r) {
    const b = r.byte(true);
    if ((b & 0x80) === 0) return 'legacy';
    r.byte(); // move cursor
    return b & 0x7f;
  },
});

/**
 * Low-level coder for Solana messages.
 * @example
 * Serialize the low-level wire format that Solana expects on the network.
 * ```ts
 * import { MessageRaw } from 'micro-sol-signer';
 * const bytes = MessageRaw.encode({
 *   TAG: 'legacy',
 *   data: {
 *     header: { requiredSignatures: 0, readSigned: 0, readUnsigned: 0 },
 *     keys: [],
 *     blockhash: '11111111111111111111111111111111',
 *     instructions: [],
 *   },
 * });
 * ```
 */
// This wire-level union only selects the body; higher-level helpers enforce account indexes.
const MessageRawCoder: P.CoderType<MessageRawType> = /* @__PURE__ */ P.tag(MessageVersion, {
  legacy: MessageLegacy,
  0: MessageV0,
}) as P.CoderType<MessageRawType>;
/**
 * Low-level coder for Solana messages.
 * @example
 * Serialize the low-level wire format that Solana expects on the network.
 * ```ts
 * import { MessageRaw } from 'micro-sol-signer';
 * const bytes = MessageRaw.encode({
 *   TAG: 'legacy',
 *   data: {
 *     header: { requiredSignatures: 0, readSigned: 0, readUnsigned: 0 },
 *     keys: [],
 *     blockhash: '11111111111111111111111111111111',
 *     instructions: [],
 *   },
 * });
 * ```
 */
export const MessageRaw: TRet<IDLCoderType<MessageRawType>> = /* @__PURE__ */ deepFreeze(
  MessageRawCoder as IDLCoderType<MessageRawType>
);

type Version = MessageRawType['TAG'];

const getAccountKeys = (msg: TArg<MessageRawType>) => {
  msg = msg as MessageRawType;
  const accounts: Account[] = [];
  const keys = msg.data.keys;
  const header = msg.data.header;
  if (!keys.length) throw new Error('SOL.tx: empty accounts array');
  // Raw message headers cannot mark more signer slots than the static account-key list contains.
  if (header.requiredSignatures > keys.length)
    throw new Error('SOL.tx: required signatures exceed account keys');
  if (header.readSigned > header.requiredSignatures)
    throw new Error('SOL.tx: readonly signed accounts exceed required signatures');
  if (header.readUnsigned > keys.length - header.requiredSignatures)
    throw new Error('SOL.tx: readonly unsigned accounts exceed unsigned accounts');
  for (let i = 0; i < keys.length; i++) {
    accounts.push({
      address: keys[i],
      ...keyParams(
        i,
        header.requiredSignatures,
        header.readSigned,
        header.readUnsigned,
        keys.length
      ),
    });
  }
  if (msg.TAG !== 'legacy') {
    for (const alt of msg.data.ALT) {
      for (const idx of alt.writableIndexes)
        accounts.push({ address: `${alt.account}:${idx}`, write: true, sign: false });
    }
    for (const alt of msg.data.ALT) {
      for (const idx of alt.readonlyIndexes)
        accounts.push({ address: `${alt.account}:${idx}`, write: false, sign: false });
    }
  }
  return accounts;
};

type MessageType = {
  version: P.UnwrapCoder<typeof MessageVersion>;
  feePayer: string;
  blockhash: string;
  instructions: Instruction[];
};

const MessageCoder: P.Coder<MessageRawType, MessageType> = {
  encode(msg) {
    const accounts: Account[] = getAccountKeys(msg);
    const account = (idx: number, kind: string) => {
      const acc = accounts[idx];
      // Raw compiled indexes must resolve before exposing public metas; otherwise malformed
      // messages leak undefined keys.
      if (acc === undefined) throw new Error(`SOL.tx: ${kind} index exceeds account keys`);
      return acc;
    };
    return {
      version: msg.TAG,
      feePayer: accounts[0].address,
      blockhash: msg.data.blockhash,
      instructions: msg.data.instructions.map((i: any) => ({
        program: account(i.programIdx, 'program').address,
        keys: i.keys.map((j: any) => {
          // Duplicate compiled indexes must not share mutable public account-meta objects.
          return { ...account(j, 'instruction key') };
        }),
        // MessageRaw.decode can return a view into caller-owned bytes; copy before exposing mutable
        // instruction data.
        data: Uint8Array.from(i.data),
      })),
    };
  },
  decode(to) {
    if (!to || typeof to !== 'object' || Array.isArray(to))
      throw new Error('SOL.tx: message must be an object');
    const { version, feePayer, blockhash, instructions } = to;
    // Only legacy and v0 raw coders exist here; reject bad public versions before P.tag errors.
    if (version !== 'legacy' && version !== 0)
      throw new Error('SOL.tx: unsupported message version');
    const accounts: Map<string, { sign: boolean; write: boolean }> = new Map();
    // contract -> idx -> isWrite
    const ALTaccounts: Record<string, Map<string, boolean>> = {};
    const addressString = (address: any, name: string) => {
      if (typeof address !== 'string') throw new Error(`SOL.tx: ${name} must be a string`);
      return address;
    };
    const boolFlag = (value: any, name: string) => {
      if (typeof value !== 'boolean') throw new Error(`SOL.tx: ${name} must be boolean`);
      return value;
    };
    const payer = addressString(feePayer, 'feePayer');
    const hash = addressString(blockhash, 'blockhash');
    if (!Array.isArray(instructions)) throw new Error('SOL.tx: instructions must be an array');
    const add = (addressValue: string, sign: boolean, write: boolean) => {
      // Direct Instruction callers can bypass IDL validation, so check public metas before ALT
      // parsing.
      const address = addressString(addressValue, 'account address');
      if (address.includes(':')) {
        if (version === 'legacy')
          throw new Error('SOL.tx: cannot use AddressLookupTable addresses in legacy tx');
        if (sign) throw new Error('SOL.tx: cannot sign with address for AddressLookupTable');
        const [contract, idx] = address.split(':');
        if (!ALTaccounts[contract]) ALTaccounts[contract] = new Map();
        // JS quirk: Object keys is always insert order unless they are "numeric" (even if string!)
        // so '1' will always be on top, breaking insert order guarantees and introducing
        // fingerprinting in tx
        // This also breaks encode(decode). Fortunately we have Map-s
        // Duplicate ALT entries share one lookup entry, so any writable use upgrades earlier
        // readonly sightings.
        ALTaccounts[contract].set(idx, ALTaccounts[contract].get(idx) || false || write);
        return;
      }
      if (!accounts.has(address)) accounts.set(address, { sign: false, write: false });
      const acc = accounts.get(address)!;
      acc.write ||= write;
      acc.sign ||= sign;
    };
    add(payer, true, true);
    for (const raw of instructions) {
      const i = instructionInput(raw);
      add(i.program, false, false);
      for (const k of i.keys) {
        if (!k || typeof k !== 'object') throw new Error('SOL.tx: account meta must be an object');
        add(
          k.address,
          boolFlag(k.sign, 'account sign flag'),
          boolFlag(k.write, 'account write flag')
        );
      }
    }
    const _keys = Array.from(accounts.keys());
    // [feePayer, ...sign+write, ...sign+read, ...nosign+write, ...nosign+read]
    const keys = [
      payer,
      ..._keys.filter((i) => accounts.get(i)!.sign && accounts.get(i)!.write && i !== payer),
      ..._keys.filter((i) => accounts.get(i)!.sign && !accounts.get(i)!.write),
      ..._keys.filter((i) => !accounts.get(i)!.sign && accounts.get(i)!.write),
      ..._keys.filter((i) => !accounts.get(i)!.sign && !accounts.get(i)!.write),
    ];
    let requiredSignatures = 0;
    let readSigned = 0;
    let readUnsigned = 0;
    for (let k of keys) {
      if (accounts.get(k)!.sign) requiredSignatures++;
      if (accounts.get(k)!.write) continue;
      if (accounts.get(k)!.sign) readSigned++;
      else readUnsigned++;
    }
    const header = { requiredSignatures, readSigned, readUnsigned };
    const ALT: MessageAddressTableLookupType[] = [];
    if (version !== 'legacy') {
      const contractNames = Object.keys(ALTaccounts).sort();
      for (const account of contractNames) {
        const writableIndexes: number[] = [];
        const readonlyIndexes: number[] = [];
        for (const k of ALTaccounts[account].keys()) {
          (ALTaccounts[account].get(k) ? writableIndexes : readonlyIndexes).push(+k);
        }
        ALT.push({ account, writableIndexes, readonlyIndexes });
      }
    }
    const accountKeys = getAccountKeys({ TAG: version, data: { header, keys, ALT } } as any);
    const accountMap = Object.fromEntries(accountKeys.map((i, j) => [i.address, j]));
    const getKey = (address: string) => {
      const value = accountMap[address];
      if (value === undefined) throw new Error('SOL.tx: unknown address: ' + address);
      return value;
    };
    return {
      TAG: version,
      data: {
        header,
        keys,
        instructions: instructions.map((i: any) => ({
          programIdx: getKey(i.program),
          keys: i.keys.map((i: any) => getKey(i.address)),
          data: i.data,
        })),
        blockhash: hash,
        ALT: ALT,
      },
    } as MessageRawType;
  },
};

/**
 * High-level Solana message coder.
 * @example
 * Work with the friendlier message shape and let the coder map it to raw wire fields.
 * ```ts
 * import { Message } from 'micro-sol-signer';
 * const bytes = Message.encode({
 *   version: 'legacy',
 *   feePayer: '11111111111111111111111111111111',
 *   blockhash: '11111111111111111111111111111111',
 *   instructions: [],
 * });
 * ```
 */
const MessageCodec: P.CoderType<MessageType> = /* @__PURE__ */ P.apply(MessageRaw, MessageCoder);
export const Message: TRet<IDLCoderType<P.UnwrapCoder<typeof MessageCodec>>> =
  /* @__PURE__ */ deepFreeze(MessageCodec as IDLCoderType<P.UnwrapCoder<typeof MessageCodec>>);

// Ed25519 transaction signatures are fixed 64-byte R||S values on the wire.
const SignatureStruct: P.CoderType<Bytes> = /* @__PURE__ */ P.bytes(
  64
) as unknown as P.CoderType<Bytes>;
const Signature: P.CoderType<Bytes> = /* @__PURE__ */ P.apply(SignatureStruct, {
  encode(from) {
    // P.bytes(64) can decode a view into the raw transaction buffer; decoded transactions must own
    // signature bytes. Buffer.slice() aliases memory, so force a fresh Uint8Array copy.
    return Uint8Array.from(from);
  },
  decode: (to) => to,
}) as unknown as P.CoderType<Bytes>;
// Raw transactions prefix the fixed-size signatures with a shortvec count.
const Signatures: P.CoderType<Bytes[]> = /* @__PURE__ */ P.array(shortU16, Signature);
type TransactionRawType = {
  signatures: Bytes[];
  msg: MessageRawType;
};
const TransactionRawStruct: P.CoderType<TransactionRawType> = /* @__PURE__ */ P.struct({
  signatures: Signatures,
  msg: MessageRaw,
}) as unknown as P.CoderType<TransactionRawType>;
const checkSignatureCount = (tx: TArg<TransactionRawType>): TRet<TransactionRawType> => {
  tx = tx as TransactionRawType;
  // Raw transactions serialize exactly one signature slot for each required signer, even when
  // unsigned slots are zero-filled.
  if (tx.signatures.length !== tx.msg.data.header.requiredSignatures)
    throw new Error('SOL.tx: signatures length does not match required signatures');
  // Raw transaction helpers bypass Message, so validate embedded message headers and compiled
  // indexes here.
  MessageCoder.encode(tx.msg);
  return tx as TRet<TransactionRawType>;
};
/**
 * Low-level coder for raw transactions.
 * @example
 * Serialize the raw transaction wrapper with explicit signatures and raw message payload.
 * ```ts
 * import { TransactionRaw } from 'micro-sol-signer';
 * const bytes = TransactionRaw.encode({
 *   signatures: [],
 *   msg: {
 *     TAG: 'legacy',
 *     data: {
 *       header: { requiredSignatures: 0, readSigned: 0, readUnsigned: 1 },
 *       keys: ['11111111111111111111111111111111'],
 *       blockhash: '11111111111111111111111111111111',
 *       instructions: [],
 *     },
 *   },
 * });
 * ```
 */
const TransactionRawCodec: P.CoderType<TransactionRawType> = /* @__PURE__ */ P.apply(
  TransactionRawStruct,
  {
    encode: checkSignatureCount,
    decode: checkSignatureCount,
  }
);
/**
 * Low-level coder for raw transactions.
 * @example
 * Serialize the raw transaction wrapper with explicit signatures and raw message payload.
 * ```ts
 * import { TransactionRaw } from 'micro-sol-signer';
 * const bytes = TransactionRaw.encode({
 *   signatures: [],
 *   msg: {
 *     TAG: 'legacy',
 *     data: {
 *       header: { requiredSignatures: 0, readSigned: 0, readUnsigned: 1 },
 *       keys: ['11111111111111111111111111111111'],
 *       blockhash: '11111111111111111111111111111111',
 *       instructions: [],
 *     },
 *   },
 * });
 * ```
 */
export const TransactionRaw: TRet<IDLCoderType<P.UnwrapCoder<typeof TransactionRawCodec>>> =
  /* @__PURE__ */ deepFreeze(
    TransactionRawCodec as IDLCoderType<P.UnwrapCoder<typeof TransactionRawCodec>>
  );

/**
 * High-level Solana transaction coder.
 * @example
 * Encode a transaction from the high-level `{ msg, signatures }` shape used by the package API.
 * ```ts
 * import { Transaction } from 'micro-sol-signer';
 * const bytes = Transaction.encode({
 *   msg: {
 *     version: 'legacy',
 *     feePayer: '11111111111111111111111111111111',
 *     blockhash: '11111111111111111111111111111111',
 *     instructions: [],
 *   },
 *   signatures: {},
 * });
 * ```
 */
type TransactionType = {
  signatures: Record<string, Bytes>;
  msg: MessageType;
};
// P.apply sees the raw coder's narrower byte details; the public shape stays on `Bytes`.
const TransactionCodec: P.CoderType<TransactionType> = /* @__PURE__ */ P.apply(TransactionRaw, {
  encode(from: TArg<TransactionRawType>): TRet<TransactionType> {
    from = from as TransactionRawType;
    const { signatures, msg } = from;
    if (signatures.length !== msg.data.header.requiredSignatures)
      throw new Error('SOL.tx: not enough signatures');
    return {
      signatures: Object.fromEntries(signatures.map((i, j) => [msg.data.keys[j], i])),
      msg: MessageCoder.encode(msg),
    } as TRet<TransactionType>;
  },
  decode(to: TArg<TransactionType>): TRet<TransactionRawType> {
    to = to as TransactionType;
    if (!to || typeof to !== 'object' || Array.isArray(to))
      throw new Error('SOL.tx: transaction must be an object');
    const raw = MessageCoder.decode(to.msg);
    // High-level callers pass an address-keyed signature map; arrays otherwise look like every
    // signer is missing.
    if (!to.signatures || typeof to.signatures !== 'object' || Array.isArray(to.signatures))
      throw new Error('SOL.tx: signatures must be an object');
    const signatures: Bytes[] = [];
    // Only required signer slots are serialized here; omitted entries become 64 zero bytes and
    // non-signer map entries are ignored.
    for (let i = 0; i < raw.data.header.requiredSignatures; i++) {
      const address = raw.data.keys[i];
      const sig = to.signatures[address];
      // NOTE: this will break on unsigned transactions! Where we can check this?
      // if (sig === undefined) throw new Error('SOL.tx: missing signature for address: ' +
      // address);
      signatures.push(sig === undefined ? new Uint8Array(64) : sig);
    }
    return { signatures, msg: raw } as TRet<TransactionRawType>;
  },
} as any) as unknown as P.CoderType<TransactionType>;
/**
 * High-level Solana transaction coder.
 * @example
 * Encode a transaction from the high-level `{ msg, signatures }` shape used by the package API.
 * ```ts
 * import { Transaction } from 'micro-sol-signer';
 * const bytes = Transaction.encode({
 *   msg: {
 *     version: 'legacy',
 *     feePayer: '11111111111111111111111111111111',
 *     blockhash: '11111111111111111111111111111111',
 *     instructions: [],
 *   },
 *   signatures: {},
 * });
 * ```
 */
export const Transaction: TRet<IDLCoderType<P.UnwrapCoder<typeof TransactionCodec>>> =
  /* @__PURE__ */ deepFreeze(
    TransactionCodec as IDLCoderType<P.UnwrapCoder<typeof TransactionCodec>>
  );

type LookupTransaction = P.UnwrapCoder<typeof Transaction>;
type AddressLookupTableHelpers = {
  resolve: (tx: LookupTransaction) => LookupTransaction;
  compress: (tx: LookupTransaction) => LookupTransaction;
};
// Tables is like {contract: [addr1, addr2]} (from archive.getAddressLookupTable().addresses)
/**
 * Builds helpers that resolve or compress Address Lookup Table references.
 * @param tables - Mapping from lookup table account to ordered addresses.
 * @returns Object with `resolve()` and `compress()` helpers.
 * @throws If lookup table metadata is malformed. {@link Error}
 * @example
 * Replace full addresses with lookup-table references before serializing a transaction.
 * ```ts
 * import { base64 } from '@scure/base';
 * import { hex } from '@scure/base';
 * import { AddressLookupTables, Transaction, createTransferSol, getAddress } from
 * 'micro-sol-signer';
 * const privateKey =
 * hex.decode('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f');
 * const from = getAddress(privateKey);
 * const to = 'FDwkzWGxx6LfCfzcmVVLEk3QUMxNhuFuKEMRwzR4Dtys';
 * const blockhash = 'J2BjKU6L83eehHVgoze6uTXGCBu6nbxsqEro9QvWpU52';
 * const tx = Transaction.decode(base64.decode(createTransferSol(from, to, 1n, blockhash)));
 * const tables = AddressLookupTables({ table: [to] });
 * tables.compress(tx).msg.instructions[0].keys[1].address;
 * ```
 */
export function AddressLookupTables(tables: Record<string, string[]>): AddressLookupTableHelpers {
  // Malformed roots otherwise build an empty mapper and silently skip ALT validation.
  if (!tables || typeof tables !== 'object' || Array.isArray(tables))
    throw new Error('SOL.tx: address tables must be an object');
  // XXX:1 -> YYY
  const direct = new Map();
  // YYY -> XXX:1
  const reverse = new Map();
  for (const k in tables) {
    const t = tables[k];
    // Table values are indexed address lists; strings are iterable too, so reject non-arrays before
    // iterating characters.
    if (!Array.isArray(t)) throw new Error(`SOL.tx: address table ${k} must be an array`);
    for (let i = 0; i < t.length; i++) {
      const contract = `${k}:${i}`;
      const address = t[i];
      if (typeof address !== 'string')
        throw new Error(`SOL.tx: address table ${k} entry ${i} must be a string`);
      direct.set(contract, address);
      // Order of contracts == priority
      if (!reverse.has(address)) reverse.set(address, contract);
    }
  }
  const mapInstructions = (
    tx: LookupTransaction,
    fn: (address: string) => string
  ): LookupTransaction => {
    // Only addresses are remapped; byte values are copied so mapped transactions do not alias
    // caller buffers.
    const signatures = Object.fromEntries(
      Object.entries(tx.signatures).map(([address, signature]) => [
        address,
        Uint8Array.from(signature),
      ])
    );
    const instructions = tx.msg.instructions.map((i) => ({
      program: fn(i.program),
      keys: i.keys.map((j) => ({ ...j, address: fn(j.address) })),
      data: Uint8Array.from(i.data),
    }));
    return { signatures, msg: { ...tx.msg, instructions } };
  };
  const checkLookupTx = (tx: LookupTransaction): void => {
    if (!P.utils.isPlainObject(tx)) throw new TypeError('SOL.tx: tx must be an object');
    if (!P.utils.isPlainObject(tx.signatures))
      throw new TypeError('SOL.tx: tx.signatures must be an object');
    if (!P.utils.isPlainObject(tx.msg))
      throw new TypeError('SOL.tx: tx.msg must be an object');
    if (!Array.isArray(tx.msg.instructions))
      throw new TypeError('SOL.tx: tx.msg.instructions must be an array');
  };
  return {
    // resolve addresses in transaction using provided tables
    resolve: (tx: LookupTransaction) => {
      checkLookupTx(tx);
      return mapInstructions(tx, (k) => (direct.has(k) ? direct.get(k)! : k));
    },
    // compresses addresses using tables
    compress(tx: LookupTransaction) {
      checkLookupTx(tx);
      if (typeof tx.msg.feePayer !== 'string')
        throw new TypeError('SOL.tx: tx.msg.feePayer must be a string');
      // The fee payer and signer metas stay as direct addresses; only nonsigner entries are
      // compressed.
      const blacklist = new Set();
      blacklist.add(tx.msg.feePayer);
      for (const i of tx.msg.instructions) {
        for (const k of i.keys) if (k.sign) blacklist.add(k.address);
      }
      return mapInstructions(tx, (k) =>
        !reverse.has(k) || blacklist.has(k) ? k : reverse.get(k)!
      );
    },
  };
}

// Build the bundled namespace once so the shorthand exports below all point into the same generated
// IDL objects.
type ProgramsBase = GetTypeIDL<typeof SystemIDL> &
  GetTypeIDL<typeof TokenIDL> &
  GetTypeIDL<typeof Token2022IDL> &
  GetTypeIDL<typeof ALTIDL> &
  GetTypeIDL<typeof ComputeBudgetIDL> &
  GetTypeIDL<typeof ConfigIDL> &
  GetTypeIDL<typeof MemoIDL>;
interface Programs extends TRet<ProgramsBase> {}
type SystemEncoders = Programs['system']['program']['instructions']['encoders'];
type TokenEncoders = Programs['token']['program']['instructions']['encoders'];
type Token2022Encoders = Programs['token-2022']['program']['instructions']['encoders'];
type AssociatedTokenEncoders =
  Programs['token']['additionalPrograms']['associatedToken']['instructions']['encoders'];
type TokenAddressHelper =
  Programs['token']['additionalPrograms']['associatedToken']['pdas']['associatedToken'];
type TokenAccountDecoder = Programs['token']['program']['accounts']['decoder'];
type AddressTableLookupDecoder = Programs['addressLookupTable']['program']['accounts']['decoder'];
/**
 * Typed helpers for bundled Solana program IDLs.
 * @example
 * Reach for the generated instruction helpers instead of hand-writing raw instruction data.
 * ```ts
 * import { PROGRAMS } from 'micro-sol-signer';
 * const transfer = PROGRAMS.system.program.instructions.encoders.transferSol({
 *   source: '11111111111111111111111111111111',
 *   destination: 'FDwkzWGxx6LfCfzcmVVLEk3QUMxNhuFuKEMRwzR4Dtys',
 *   amount: 1n,
 * });
 * ```
 */
export const PROGRAMS: Programs = /* @__PURE__ */ (() =>
  deepFreeze({
    ...defineIDL(SystemIDL),
    ...defineIDL(TokenIDL),
    ...defineIDL(Token2022IDL),
    ...defineIDL(ALTIDL),
    ...defineIDL(ComputeBudgetIDL),
    ...defineIDL(ConfigIDL),
    ...defineIDL(MemoIDL),
  }))();
// Old API compat
/**
 * System program instruction encoders.
 * @example
 * Use the prebuilt system instruction encoders for low-level instruction creation.
 * ```ts
 * import { sys } from 'micro-sol-signer';
 * const instruction = sys.transferSol({
 *   source: '11111111111111111111111111111111',
 *   destination: 'FDwkzWGxx6LfCfzcmVVLEk3QUMxNhuFuKEMRwzR4Dtys',
 *   amount: 1n,
 * });
 * ```
 */
export const sys: SystemEncoders = /* @__PURE__ */ (() =>
  PROGRAMS.system.program.instructions.encoders)();
/**
 * SPL Token program instruction encoders.
 * @example
 * Build SPL Token instructions without manually packing instruction bytes.
 * ```ts
 * import { token } from 'micro-sol-signer';
 * const instruction = token.transfer({
 *   source: '11111111111111111111111111111111',
 *   destination: 'FDwkzWGxx6LfCfzcmVVLEk3QUMxNhuFuKEMRwzR4Dtys',
 *   authority: '11111111111111111111111111111111',
 *   amount: 1n,
 * });
 * ```
 */
export const token: TokenEncoders = /* @__PURE__ */ (() =>
  PROGRAMS.token.program.instructions.encoders)();
// TODO: The inferred type of this node exceeds the maximum length the compiler will serialize. An
// explicit type annotation is needed.
/**
 * SPL Token 2022 instruction encoders.
 * @example
 * Use the Token-2022 helpers when the mint lives under the newer program id.
 * ```ts
 * import { TOKEN_PROGRAM2022, token2022, tokenAddress } from 'micro-sol-signer';
 * const owner = '11111111111111111111111111111111';
 * const recipient = 'FDwkzWGxx6LfCfzcmVVLEk3QUMxNhuFuKEMRwzR4Dtys';
 * const mint = 'So11111111111111111111111111111111111111112';
 * const instruction = token2022.transferChecked({
 *   source: tokenAddress({ mint, owner, tokenProgram: TOKEN_PROGRAM2022 }),
 *   destination: tokenAddress({ mint, owner: recipient, tokenProgram: TOKEN_PROGRAM2022 }),
 *   authority: owner,
 *   amount: 1n,
 *   decimals: 9,
 *   mint,
 * });
 * ```
 */
export const token2022: Token2022Encoders = /* @__PURE__ */ (() =>
  PROGRAMS['token-2022'].program.instructions.encoders)();
/**
 * Associated token program instruction encoders.
 * @example
 * Build ATA creation instructions from the generated associated-token helpers.
 * ```ts
 * import { TOKEN_PROGRAM, associatedToken, tokenAddress } from 'micro-sol-signer';
 * const owner = '11111111111111111111111111111111';
 * const mint = 'So11111111111111111111111111111111111111112';
 * const instruction = associatedToken.createAssociatedToken({
 *   payer: owner,
 *   ata: tokenAddress({ mint, owner, tokenProgram: TOKEN_PROGRAM }),
 *   owner,
 *   mint,
 * });
 * ```
 */
export const associatedToken: AssociatedTokenEncoders = /* @__PURE__ */ (() =>
  PROGRAMS.token.additionalPrograms.associatedToken.instructions.encoders)();

/**
 * System program address.
 * @example
 * Use the program id to look up the matching typed registry entry.
 * ```ts
 * import { CONTRACTS, SYS_PROGRAM } from 'micro-sol-signer';
 * const program = CONTRACTS[SYS_PROGRAM];
 * program.instructions.encoders.transferSol({
 *   source: '11111111111111111111111111111111',
 *   destination: 'FDwkzWGxx6LfCfzcmVVLEk3QUMxNhuFuKEMRwzR4Dtys',
 *   amount: 1n,
 * });
 * ```
 */
export const SYS_PROGRAM: '11111111111111111111111111111111' = /* @__PURE__ */ (() =>
  PROGRAMS.system.program.contract)();
/**
 * SPL Token program address.
 * @example
 * Pass the token-program id when deriving an owner's associated token account.
 * ```ts
 * import { TOKEN_PROGRAM, tokenAddress } from 'micro-sol-signer';
 * const ata = tokenAddress({
 *   mint: 'So11111111111111111111111111111111111111112',
 *   owner: '11111111111111111111111111111111',
 *   tokenProgram: TOKEN_PROGRAM,
 * });
 * ```
 */
export const TOKEN_PROGRAM: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' = /* @__PURE__ */ (() =>
  PROGRAMS.token.program.contract)();
/**
 * SPL Token 2022 program address.
 * @example
 * Token-2022 uses a different program id, so pass it explicitly when deriving token accounts.
 * ```ts
 * import { TOKEN_PROGRAM2022, tokenAddress } from 'micro-sol-signer';
 * const ata = tokenAddress({
 *   mint: 'So11111111111111111111111111111111111111112',
 *   owner: '11111111111111111111111111111111',
 *   tokenProgram: TOKEN_PROGRAM2022,
 * });
 * ```
 */
export const TOKEN_PROGRAM2022: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb' =
  /* @__PURE__ */ (() => PROGRAMS['token-2022'].program.contract)();
/**
 * Associated token program address.
 * @example
 * Build ATA creation instructions via the registry entry for the ATA program.
 * ```ts
 * import { ASSOCIATED_TOKEN_PROGRAM, CONTRACTS, TOKEN_PROGRAM, tokenAddress } from
 * 'micro-sol-signer';
 * const owner = '11111111111111111111111111111111';
 * const mint = 'So11111111111111111111111111111111111111112';
 * const instruction =
 * CONTRACTS[ASSOCIATED_TOKEN_PROGRAM].instructions.encoders.createAssociatedToken(
 *   {
 *     payer: owner,
 *     ata: tokenAddress({ mint, owner, tokenProgram: TOKEN_PROGRAM }),
 *     owner,
 *     mint,
 *   }
 * );
 * ```
 */
export const ASSOCIATED_TOKEN_PROGRAM: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL' =
  /* @__PURE__ */ (() => PROGRAMS.token.additionalPrograms.associatedToken.contract)();

/**
 * Derives the associated token account address.
 * @param value - PDA input fields such as mint, owner, and token program.
 * @param args - PDA input fields such as mint, owner, and token program.
 * @returns Base58-encoded associated token account address.
 * The ATA seed tuple is [owner, tokenProgram, mint], so callers must pass TOKEN_PROGRAM or
 * TOKEN_PROGRAM2022 explicitly; there is no default token program here.
 * @example
 * Derive the owner's associated token account for a mint.
 * ```ts
 * import { TOKEN_PROGRAM, tokenAddress } from 'micro-sol-signer';
 * const ata = tokenAddress({
 *   mint: 'So11111111111111111111111111111111111111112',
 *   owner: '11111111111111111111111111111111',
 *   tokenProgram: TOKEN_PROGRAM,
 * });
 * ```
 */
export const tokenAddress: TokenAddressHelper = /* @__PURE__ */ (() =>
  PROGRAMS.token.additionalPrograms.associatedToken.pdas.associatedToken)();
/**
 * Decoder for SPL token accounts.
 * @param data - Raw account bytes.
 * @param opts - Optional reader settings. See {@link P.ReaderOpts}.
 * @returns Decoded token account payload.
 * This alias only covers the fixed 165-byte base token-account layout shared by Token and
 * Token-2022; trailing extension bytes are rejected.
 * @example
 * Encode a token account payload with the bundled IDL helpers, then decode it back.
 * ```ts
 * import { PROGRAMS, TokenAccount } from 'micro-sol-signer';
 * const data = PROGRAMS.token.program.accounts.coders.token.encode({
 *   mint: 'So11111111111111111111111111111111111111112',
 *   owner: '11111111111111111111111111111111',
 *   amount: 1n,
 *   delegate: undefined,
 *   state: { TAG: 'initialized' },
 *   isNative: undefined,
 *   delegatedAmount: 0n,
 *   closeAuthority: undefined,
 * });
 * const parsed = TokenAccount(data);
 * ```
 */
export const TokenAccount: TokenAccountDecoder = /* @__PURE__ */ (() =>
  PROGRAMS.token.program.accounts.decoder)();
/**
 * Decoder for address lookup table accounts.
 * @param data - Raw account bytes.
 * @param opts - Optional reader settings. See {@link P.ReaderOpts}.
 * @returns Decoded address lookup table payload.
 * Remaining bytes after the fixed header are interpreted as 32-byte addresses, so only partial
 * tails are rejected.
 * @example
 * Decode raw bytes from an address lookup table account payload.
 * ```ts
 * import { base64 } from '@scure/base';
 * import { AddressTableLookupData } from 'micro-sol-signer';
 * const data = base64.decode(
 *   'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
 *     'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=='
 * );
 * const table = AddressTableLookupData(data);
 * ```
 */
export const AddressTableLookupData: AddressTableLookupDecoder = /* @__PURE__ */ (() =>
  PROGRAMS.addressLookupTable.program.accounts.decoder)();

// createTokenTransfer* only dispatch plain Token / Token-2022 transfer encoders.
const TOKENS_ENCODE: Record<string, any> = /* @__PURE__ */ (() => ({
  [TOKEN_PROGRAM]: PROGRAMS.token.program.instructions.encoders,
  [TOKEN_PROGRAM2022]: PROGRAMS['token-2022'].program.instructions.encoders,
}))();

// Keep bundled contracts here even when the current IDL exposes no account layouts.
const ACCOUNTS_DECODE: Record<string, any> = /* @__PURE__ */ (() => ({
  [SYS_PROGRAM]: PROGRAMS.system.program.accounts.decoder,
  [TOKEN_PROGRAM]: PROGRAMS.token.program.accounts.decoder,
  [TOKEN_PROGRAM2022]: PROGRAMS['token-2022'].program.accounts.decoder,
  [ASSOCIATED_TOKEN_PROGRAM]: PROGRAMS.token.additionalPrograms.associatedToken.accounts.decoder,
  [PROGRAMS.addressLookupTable.program.contract]:
    PROGRAMS.addressLookupTable.program.accounts.decoder,
  [PROGRAMS.computeBudget.program.contract]: PROGRAMS.computeBudget.program.accounts.decoder,
  [PROGRAMS.solanaConfig.program.contract]: PROGRAMS.solanaConfig.program.accounts.decoder,
  [PROGRAMS.memo.program.contract]: PROGRAMS.memo.program.accounts.decoder,
}))();
/**
 * Decodes an account using the known public program registry.
 * @param contract - Program address that owns the account.
 * @param data - Raw account bytes.
 * @returns Decoded account payload.
 * @throws If the program is unknown or the account payload cannot be decoded. {@link Error}
 * @example
 * Use the owning program id to route raw bytes through the right account decoder.
 * ```ts
 * import { PROGRAMS, SYS_PROGRAM, decodeAccount } from 'micro-sol-signer';
 * const data = PROGRAMS.system.program.accounts.coders.nonce.encode({
 *   version: { TAG: 'current' },
 *   state: { TAG: 'initialized' },
 *   authority: '11111111111111111111111111111111',
 *   blockhash: '11111111111111111111111111111111',
 *   lamportsPerSignature: 5000n,
 * });
 * const parsed = decodeAccount(SYS_PROGRAM, data);
 * ```
 */
export function decodeAccount(contract: string, data: TArg<Bytes>): unknown {
  if (ACCOUNTS_DECODE[contract] === undefined) throw new Error('unknown contract');
  return removeUndefined(ACCOUNTS_DECODE[contract](data));
}

// parseInstruction routes known program ids to the bundled instruction decoders.
const REGISTRY: Record<string, any> = /* @__PURE__ */ (() => ({
  [SYS_PROGRAM]: PROGRAMS.system.program.instructions.decoder,
  [TOKEN_PROGRAM]: PROGRAMS.token.program.instructions.decoder,
  [TOKEN_PROGRAM2022]: PROGRAMS['token-2022'].program.instructions.decoder,
  [ASSOCIATED_TOKEN_PROGRAM]:
    PROGRAMS.token.additionalPrograms.associatedToken.instructions.decoder,
  [PROGRAMS.addressLookupTable.program.contract]:
    PROGRAMS.addressLookupTable.program.instructions.decoder,
  [PROGRAMS.computeBudget.program.contract]: PROGRAMS.computeBudget.program.instructions.decoder,
  [PROGRAMS.solanaConfig.program.contract]: PROGRAMS.solanaConfig.program.instructions.decoder,
  [PROGRAMS.memo.program.contract]: PROGRAMS.memo.program.instructions.decoder,
}))();
/**
 * Parses a known instruction into its typed payload.
 * @param instruction - Instruction to decode.
 * @returns Decoded instruction payload.
 * @throws If the program is unknown or the instruction payload cannot be decoded. {@link Error}
 * @example
 * Decode a known instruction back into its typed payload.
 * ```ts
 * import { parseInstruction, sys } from 'micro-sol-signer';
 * const parsed = parseInstruction(
 *   sys.transferSol({
 *     source: '11111111111111111111111111111111',
 *     destination: 'FDwkzWGxx6LfCfzcmVVLEk3QUMxNhuFuKEMRwzR4Dtys',
 *     amount: 1n,
 *   })
 * );
 * ```
 */
export function parseInstruction(instruction: TArg<Instruction>): unknown {
  instruction = instructionInput(instruction);
  if (REGISTRY[instruction.program] === undefined) throw new Error('unknown contract');
  return removeUndefined(REGISTRY[instruction.program](instruction));
}

/** Registry of known public Solana programs and their typed helpers. */
// Re-export the same bundled helper objects under contract-address keys for public lookup.
export const CONTRACTS: Record<string, any> = /* @__PURE__ */ (() =>
  deepFreeze({
    [SYS_PROGRAM]: PROGRAMS.system.program,
    [TOKEN_PROGRAM]: PROGRAMS.token.program,
    [TOKEN_PROGRAM2022]: PROGRAMS['token-2022'].program,
    [ASSOCIATED_TOKEN_PROGRAM]: PROGRAMS.token.additionalPrograms.associatedToken,
    [PROGRAMS.addressLookupTable.program.contract]: PROGRAMS.addressLookupTable.program,
    [PROGRAMS.computeBudget.program.contract]: PROGRAMS.computeBudget.program,
    [PROGRAMS.solanaConfig.program.contract]: PROGRAMS.solanaConfig.program,
    [PROGRAMS.memo.program.contract]: PROGRAMS.memo.program,
  }))();

// Basic tx stuff
type TxData = Bytes | string;
/**
 * Verifies transaction signatures and size limits.
 * @param tx - Raw transaction bytes or base64 string.
 * @throws If the transaction is too large or any required signature is invalid. {@link Error}
 * @example
 * Sign a transfer first, then verify the finished transaction blob before broadcasting it.
 * ```ts
 * import { hex } from '@scure/base';
 * import { createTransferSol, getAddress, signTx, verifyTx } from 'micro-sol-signer';
 * const privateKey =
 * hex.decode('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f');
 * const from = getAddress(privateKey);
 * const recipient = 'FDwkzWGxx6LfCfzcmVVLEk3QUMxNhuFuKEMRwzR4Dtys';
 * const tx = createTransferSol(
 *   from,
 *   recipient,
 *   1n,
 *   '11111111111111111111111111111111'
 * );
 * verifyTx(signTx(privateKey, tx)[1]);
 * ```
 */
export function verifyTx(tx: TArg<TxData>) {
  if (typeof tx === 'string') tx = base64.decode(tx);
  if (tx.length > MAX_TX_SIZE) throw new Error('sol: transaction too big');
  const raw = TransactionRaw.decode(tx);
  const msg = MessageRaw.encode(raw.msg);
  for (let i = 0; i < raw.msg.data.header.requiredSignatures; i++) {
    const address = raw.msg.data.keys[i];
    const pubKey = base58.decode(address);
    const sig = raw.signatures[i];
    if (!ed25519.verify(sig, msg, pubKey))
      throw new Error(`sol: invalid signature sig=${sig} msg=${msg}`);
  }
}

/**
 * Derives the Ed25519 public key for a private key.
 * @param privateKey - 32-byte private key.
 * Callers must pass the 32-byte Ed25519 secret seed, not a 64-byte secret/public keypair blob.
 * @returns Public key bytes.
 * @example
 * Derive the 32-byte public key from a local signer secret.
 * ```ts
 * import { hex } from '@scure/base';
 * import { getPublicKey } from 'micro-sol-signer';
 * const publicKey = getPublicKey(
 *   hex.decode('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f')
 * );
 * ```
 */
export function getPublicKey(privateKey: TArg<Bytes>): TRet<Bytes> {
  return ed25519.getPublicKey(privateKey);
}

/**
 * Derives the Solana address for a private key.
 * @param privateKey - 32-byte private key.
 * Solana addresses are the base58 encoding of the 32-byte Ed25519 public key, with no extra
 * checksum or version byte.
 * @returns Base58-encoded Solana address.
 * @example
 * Convert the signer secret key into the base58 address used in RPC and wallets.
 * ```ts
 * import { hex } from '@scure/base';
 * import { getAddress } from 'micro-sol-signer';
 * getAddress(hex.decode('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f'));
 * ```
 */
export function getAddress(privateKey: TArg<Bytes>): string {
  const publicKey = getPublicKey(privateKey);
  return base58.encode(publicKey);
}

type PrivateKeyFormat = 'base58' | 'hex' | 'array';

/**
 * Formats a private key together with its public key companion.
 * @param privateKey - 32-byte private key.
 * @param format - Output format for the combined key material.
 * This returns the 64-byte Solana-style secret/public bundle:
 * `privateKey || getPublicKey(privateKey)`,
 * not the standalone 32-byte RFC 8032 private key seed.
 * @returns Formatted private key payload.
 * @throws If the requested private-key output format is unsupported. {@link Error}
 * @example
 * Export the combined secret+public key payload in the format another tool expects.
 * ```ts
 * import { hex } from '@scure/base';
 * import { formatPrivate } from 'micro-sol-signer';
 * formatPrivate(
 *   hex.decode('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f'),
 *   'hex'
 * );
 * ```
 */
export function formatPrivate(
  privateKey: TArg<Bytes>,
  format: PrivateKeyFormat = 'base58'
): string | number[] {
  const publicKey = getPublicKey(privateKey);
  const fullKey = P.utils.concatBytes(privateKey, publicKey);
  switch (format) {
    case 'base58': {
      return base58.encode(fullKey);
    }
    case 'hex': {
      return hex.encode(fullKey);
    }
    case 'array': {
      return Array.from(fullKey);
    }
    default: {
      throw new Error('sol: unsupported format');
    }
  }
}

/**
 * Formats a public key as a base58 Solana address.
 * @param publicKey - Public key bytes.
 * This helper only base58-encodes the provided bytes; callers that need a canonical Solana
 * address should pass a validated 32-byte Ed25519 public key.
 * @returns Base58-encoded address.
 * @example
 * Convert the raw public key bytes into the address string shown in wallets.
 * ```ts
 * import { hex } from '@scure/base';
 * import { formatPublic, getPublicKey } from 'micro-sol-signer';
 * formatPublic(
 *   getPublicKey(hex.decode('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f'))
 * );
 * ```
 */
export function formatPublic(publicKey: TArg<Bytes>): string {
  return base58.encode(publicKey);
}

/**
 * Parses a base58 Solana address into bytes.
 * @param address - Base58-encoded address.
 * This helper only base58-decodes the provided string; callers that need a canonical Solana
 * address should validate the decoded length separately.
 * @returns Public key bytes.
 * @example
 * Decode the base58 address back into the 32-byte public key form.
 * ```ts
 * import { parseAddress } from 'micro-sol-signer';
 * const publicKey = parseAddress('11111111111111111111111111111111');
 * ```
 */
export function parseAddress(address: string): TRet<Bytes> {
  return base58.decode(address) as TRet<Bytes>;
}

/**
 * Creates an unsigned transaction from instructions.
 * @param address - Fee payer address.
 * @param instructions - Instructions to include.
 * @param blockhash - Recent blockhash.
 * @param version - Message version to use.
 * Defaults to version `0`; pass `'legacy'` to build the pre-v0 message format.
 * @returns Base64-encoded unsigned transaction.
 * @throws If the instruction list is empty or message encoding fails validation. {@link Error}
 * @example
 * Assemble a raw transaction from explicit low-level instructions.
 * ```ts
 * import { createTx, sys } from 'micro-sol-signer';
 * const feePayer = '11111111111111111111111111111111';
 * const recipient = 'FDwkzWGxx6LfCfzcmVVLEk3QUMxNhuFuKEMRwzR4Dtys';
 * const tx = createTx(
 *   feePayer,
 *   [
 *     sys.transferSol({
 *       source: feePayer,
 *       destination: recipient,
 *       amount: 1n,
 *     }),
 *   ],
 *   '11111111111111111111111111111111'
 * );
 * ```
 */
export function createTx(
  address: string,
  instructions: TArg<Instruction[]>,
  blockhash: string,
  version: TArg<Version> = 0
): string {
  // createTx checks emptiness before Message.encode, so malformed lists need the same
  // public-boundary guard here.
  if (!Array.isArray(instructions)) throw new Error('SOL.tx: instructions must be an array');
  if (!instructions.length) throw new Error('SOLPublic: empty instructions array');
  return base64.encode(
    Transaction.encode({
      msg: { version, feePayer: address, blockhash, instructions },
      signatures: {},
    })
  );
}

/**
 * Creates an unsigned native SOL transfer transaction.
 * @param from - Sender address.
 * @param to - Recipient address.
 * @param amount - Lamports to transfer.
 * @param blockhash - Recent blockhash.
 * @param version - Message version to use.
 * Uses `from` as both the fee payer and the System Program transfer source; build the
 * instruction manually with `createTx(...)` if those roles need to differ.
 * @returns Base64-encoded unsigned transaction.
 * @throws If the derived transfer instruction or enclosing transaction is invalid. {@link Error}
 * @example
 * Build the simplest lamport transfer without writing the instruction by hand.
 * ```ts
 * import { createTransferSol } from 'micro-sol-signer';
 * const sender = '11111111111111111111111111111111';
 * const recipient = 'FDwkzWGxx6LfCfzcmVVLEk3QUMxNhuFuKEMRwzR4Dtys';
 * const tx = createTransferSol(
 *   sender,
 *   recipient,
 *   1n,
 *   '11111111111111111111111111111111'
 * );
 * ```
 */
export function createTransferSol(
  from: string,
  to: string,
  amount: bigint,
  blockhash: string,
  version: TArg<Version> = 0
): string {
  return createTx(
    from,
    [sys.transferSol({ source: from, destination: to, amount })],
    blockhash,
    version
  );
}

/**
 * Creates an unsigned SPL token transfer transaction.
 * @param mint - Token mint address.
 * @param from - Sender owner address.
 * @param to - Recipient owner address.
 * @param amount - Raw token amount.
 * @param blockhash - Recent blockhash.
 * @param tokenProgram - Token program address to target.
 * @param version - Message version to use.
 * Defaults to `TOKEN_PROGRAM` and derives both token accounts from the owner addresses;
 * build the instruction manually with `createTx(...)` if you need explicit token accounts or a
 * different authority/fee payer.
 * @returns Base64-encoded unsigned transaction.
 * @throws If the token program is unknown or the derived transaction is invalid. {@link Error}
 * @example
 * Build an SPL token transfer between the owners' associated token accounts.
 * ```ts
 * import { createTokenTransfer } from 'micro-sol-signer';
 * const owner = '11111111111111111111111111111111';
 * const recipient = 'FDwkzWGxx6LfCfzcmVVLEk3QUMxNhuFuKEMRwzR4Dtys';
 * const tx = createTokenTransfer(
 *   'So11111111111111111111111111111111111111112',
 *   owner,
 *   recipient,
 *   1n,
 *   '11111111111111111111111111111111'
 * );
 * ```
 */
export function createTokenTransfer(
  mint: string,
  from: string,
  to: string,
  amount: bigint,
  blockhash: string,
  tokenProgram: string = TOKEN_PROGRAM,
  version: TArg<Version> = 0
): string {
  if (TOKENS_ENCODE[tokenProgram] === undefined) throw new Error('unknown program');
  return createTx(
    from,
    [
      TOKENS_ENCODE[tokenProgram].transfer({
        source: tokenAddress({
          mint,
          owner: from,
          tokenProgram,
        }),
        destination: tokenAddress({
          mint,
          owner: to,
          tokenProgram,
        }),
        authority: from,
        amount,
      }),
    ],
    blockhash,
    version
  );
}

/**
 * Creates an unsigned SPL token transferChecked transaction.
 * @param mint - Token mint address.
 * @param from - Sender owner address.
 * @param to - Recipient owner address.
 * @param amount - Raw token amount.
 * @param decimals - Mint decimal count.
 * @param blockhash - Recent blockhash.
 * @param tokenProgram - Token program address to target.
 * @param version - Message version to use.
 * Defaults to `TOKEN_PROGRAM`, derives both token accounts from the owner addresses, and embeds the
 * supplied mint decimals in the instruction; build the instruction manually with `createTx(...)` if
 * you need explicit token accounts or a different authority/fee payer.
 * @returns Base64-encoded unsigned transaction.
 * @throws If the token program is unknown or the derived transaction is invalid. {@link Error}
 * @example
 * Use `transferChecked` when the mint decimals are part of the instruction payload.
 * ```ts
 * import * as P from 'micro-packed';
 * import { createTokenTransferChecked } from 'micro-sol-signer';
 * const tx = createTokenTransferChecked(
 *   'So11111111111111111111111111111111111111112',
 *   '11111111111111111111111111111111',
 *   'FDwkzWGxx6LfCfzcmVVLEk3QUMxNhuFuKEMRwzR4Dtys',
 *   P.coders.decimal(4).decode('1.2345'),
 *   4,
 *   'J2BjKU6L83eehHVgoze6uTXGCBu6nbxsqEro9QvWpU52'
 * );
 * ```
 */
export function createTokenTransferChecked(
  mint: string,
  from: string,
  to: string,
  amount: bigint,
  decimals: number,
  blockhash: string,
  tokenProgram: string = TOKEN_PROGRAM,
  version: TArg<Version> = 0
): string {
  if (TOKENS_ENCODE[tokenProgram] === undefined) throw new Error('unknown program');
  return createTx(
    from,
    [
      TOKENS_ENCODE[tokenProgram].transferChecked({
        source: tokenAddress({
          mint,
          owner: from,
          tokenProgram,
        }),
        amount,
        decimals,
        mint,
        authority: from,
        destination: tokenAddress({
          mint,
          owner: to,
          tokenProgram,
        }),
      }),
    ],
    blockhash,
    version
  );
}

/**
 * Signs a transaction with the provided private key.
 * @param privateKey - 32-byte private key.
 * @param data - Raw transaction bytes or base64 string.
 * @returns Tuple of the produced signature and signed transaction.
 * The first tuple item only matches the transaction's first signature / tx id when this signer
 * occupies the first required-signature slot.
 * @throws If the transaction does not require this signer or cannot be decoded and signed. {@link
 * Error}
 * @example
 * Build the transfer first, then sign it with the fee payer's private key.
 * ```ts
 * import { hex } from '@scure/base';
 * import { createTransferSol, getAddress, signTx } from 'micro-sol-signer';
 * const privateKey =
 * hex.decode('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f');
 * const from = getAddress(privateKey);
 * const recipient = 'FDwkzWGxx6LfCfzcmVVLEk3QUMxNhuFuKEMRwzR4Dtys';
 * const tx = createTransferSol(
 *   from,
 *   recipient,
 *   1n,
 *   '11111111111111111111111111111111'
 * );
 * const [sig, signedTx] = signTx(privateKey, tx);
 * ```
 */
export function signTx(privateKey: TArg<Bytes>, data: TArg<TxData>): [string, string] {
  if (typeof data === 'string') data = base64.decode(data);
  const address = getAddress(privateKey);
  const raw = TransactionRaw.decode(data);
  const reqSignatures = raw.msg.data.keys.slice(0, raw.msg.data.header.requiredSignatures);
  if (!reqSignatures.filter((i) => i == address).length)
    throw new Error(`SOLPrivate: tx doesn't require signature for address=${address}`);
  const sig = ed25519.sign(MessageRaw.encode(raw.msg), privateKey);
  for (let i = 0; i < reqSignatures.length; i++)
    if (reqSignatures[i] === address) raw.signatures[i] = sig;
  // Base58 encoding for tx is deprecated
  const tx = base64.encode(TransactionRaw.encode(raw));
  // This is the detached signature we just produced, not always the tx's first signature / tx id.
  return [base58.encode(sig), tx];
}

/**
 * Warning: It is NOT secure to sign random msgs,
 * because someone can create a message which is an encoded transaction.
 * This signs the raw bytes exactly as provided; callers that need wallet-specific
 * prefixes or domain separation must add them before calling.
 * @param privateKey - 32-byte private key.
 * @param msg - Message bytes to sign.
 * @returns Base58-encoded signature.
 * @example
 * Detached signing is for off-transaction payloads only.
 * ```ts
 * import { hex } from '@scure/base';
 * import { signBytes } from 'micro-sol-signer';
 * const msg = new TextEncoder().encode('hello solana');
 * signBytes(
 *   hex.decode('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f'),
 *   msg
 * );
 * ```
 */
export function signBytes(privateKey: TArg<Uint8Array>, msg: TArg<Uint8Array>): string {
  return base58.encode(ed25519.sign(msg, privateKey));
}
/**
 * Verifies a detached Ed25519 signature over arbitrary bytes.
 * This verifies the raw bytes exactly as provided; callers using prefixed or
 * domain-separated formats must pass the transformed bytes here too.
 * @param signature - Base58-encoded signature.
 * @param publicKey - Public key bytes or base58 string.
 * @param msg - Message bytes that were signed.
 * @returns `true` when the signature is valid.
 * @example
 * Pair detached verification with the same raw bytes and signer public key.
 * ```ts
 * import { hex } from '@scure/base';
 * import { getPublicKey, signBytes, verifyBytes } from 'micro-sol-signer';
 * const privateKey =
 * hex.decode('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f');
 * const msg = new TextEncoder().encode('hello solana');
 * const sig = signBytes(privateKey, msg);
 * verifyBytes(sig, getPublicKey(privateKey), msg);
 * ```
 */
export function verifyBytes(
  signature: string,
  publicKey: TArg<Uint8Array | string>,
  msg: TArg<Uint8Array>
): boolean {
  if (typeof publicKey === 'string') publicKey = base58.decode(publicKey);
  return ed25519.verify(base58.decode(signature), msg, publicKey);
}

/**
 * Extracts the encoded message bytes from a serialized transaction.
 * @param tx - Base64-encoded transaction.
 * @returns Base64-encoded message bytes.
 * @example
 * Pull out the canonical message bytes before signing or hashing them elsewhere.
 * ```ts
 * import { createTransferSol, getMessageFromTransaction } from 'micro-sol-signer';
 * const sender = '11111111111111111111111111111111';
 * const recipient = 'FDwkzWGxx6LfCfzcmVVLEk3QUMxNhuFuKEMRwzR4Dtys';
 * const tx = createTransferSol(
 *   sender,
 *   recipient,
 *   1n,
 *   '11111111111111111111111111111111'
 * );
 * const msg = getMessageFromTransaction(tx);
 * ```
 */
export function getMessageFromTransaction(tx: string): string {
  const raw = TransactionRaw.decode(base64.decode(tx));
  return base64.encode(MessageRaw.encode(raw.msg));
}
