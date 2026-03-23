import { ed25519 } from '@noble/curves/ed25519.js';
import { base58, base64, hex } from '@scure/base';
import * as P from 'micro-packed';
import {
  Decimal,
  PRECISION,
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
/** Generic byte-array type used by the public API. */
export type Bytes = Uint8Array;

const MAX_TX_SIZE = /* @__PURE__ */ (() => 1280 - 40 - 8)();

function removeUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
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
 * @throws On malformed or wrong-length Solana addresses. {@link RangeError}
 * @example
 * Reject malformed base58 addresses before building instructions.
 * ```ts
 * import { validateAddress } from 'micro-sol-signer';
 * validateAddress('11111111111111111111111111111111');
 * ```
 */
export function validateAddress(address: string) {
  try {
    const pubkey = base58.decode(address);
    if (pubkey.length !== 32) throw new RangeError('Invalid Solana address');
  } catch (error) {
    // Preserve type failures from the base58 coder, but flatten malformed/wrong-length addresses into one value error.
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

/** High-level Solana message representation. */
export type Message = {
  // First account in list of signers pays fee, however it is easy to make mistake, so we force user to specify feePayer manually.
  /** Address that pays transaction fees. */
  feePayer: string;
  /** Recent blockhash attached to the message. */
  blockhash: string;
  /** Ordered instruction list. */
  instructions: Instruction[];
};

const keyParams = (i: number, req: number, signed: number, unsigned: number, total: number) => ({
  sign: i < req ? true : false,
  write: i < req - signed || (i >= req && i < total - unsigned) ? true : false,
});

const MessageHeader = /* @__PURE__ */ (() =>
  P.struct({
    requiredSignatures: P.U8,
    readSigned: P.U8,
    readUnsigned: P.U8,
  }))();

const Instruction = /* @__PURE__ */ (() =>
  P.struct({
    programIdx: P.U8,
    keys: P.array(shortU16, P.U8),
    data: P.bytes(shortU16),
  }))();

const MessageLegacy = /* @__PURE__ */ (() =>
  P.struct({
    header: MessageHeader,
    keys: P.array(shortU16, pubKey),
    blockhash: pubKey,
    instructions: P.array(shortU16, Instruction),
  }))();

const MessageAddressTableLookup = /* @__PURE__ */ (() =>
  P.struct({
    account: pubKey,
    writableIndexes: P.array(shortU16, P.U8),
    readonlyIndexes: P.array(shortU16, P.U8),
  }))();

const MessageV0 = /* @__PURE__ */ (() =>
  P.struct({
    header: MessageHeader,
    keys: P.array(shortU16, pubKey),
    blockhash: pubKey,
    instructions: P.array(shortU16, Instruction),
    ALT: P.array(shortU16, MessageAddressTableLookup),
  }))();

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
export const MessageRaw = /* @__PURE__ */ P.tag(MessageVersion, {
  legacy: MessageLegacy,
  0: MessageV0,
});

type Version = P.UnwrapCoder<typeof MessageRaw>['TAG'];

const getAccountKeys = (msg: P.UnwrapCoder<typeof MessageRaw>) => {
  const accounts: Account[] = [];
  for (let i = 0; i < msg.data.keys.length; i++) {
    accounts.push({
      address: msg.data.keys[i],
      ...keyParams(
        i,
        msg.data.header.requiredSignatures,
        msg.data.header.readSigned,
        msg.data.header.readUnsigned,
        msg.data.keys.length
      ),
    });
  }
  if (!accounts.length) throw new Error('SOL.tx: empty accounts array');
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

const MessageCoder: P.Coder<P.UnwrapCoder<typeof MessageRaw>, MessageType> = {
  encode(msg) {
    const accounts: Account[] = getAccountKeys(msg);
    return {
      version: msg.TAG,
      feePayer: accounts[0].address,
      blockhash: msg.data.blockhash,
      instructions: msg.data.instructions.map((i: any) => ({
        program: accounts[i.programIdx].address,
        keys: i.keys.map((j: any) => accounts[j]),
        data: i.data,
      })),
    };
  },
  decode(to) {
    const { version, feePayer, blockhash, instructions } = to;
    const accounts: Map<string, { sign: boolean; write: boolean }> = new Map();
    // contract -> idx -> isWrite
    const ALTaccounts: Record<string, Map<string, boolean>> = {};
    const add = (address: string, sign: boolean, write: boolean) => {
      if (address.includes(':')) {
        if (version === 'legacy')
          throw new Error('SOL.tx: cannot use AddressLookupTable addresses in legacy tx');
        if (sign) throw new Error('SOL.tx: cannot sign with address for AddressLookupTable');
        const [contract, idx] = address.split(':');
        if (!ALTaccounts[contract]) ALTaccounts[contract] = new Map();
        // JS quirk: Object keys is always insert order unless they are "numeric" (even if string!)
        // so '1' will always be on top, breaking insert order guarantess and introducing fingerprinting in tx
        // This also breaks encode(decode). Fortunately we have Map-s
        if (!ALTaccounts[contract].has(idx)) ALTaccounts[contract].set(idx, write);
        return;
      }
      if (!accounts.has(address)) accounts.set(address, { sign: false, write: false });
      const acc = accounts.get(address)!;
      acc.write ||= write;
      acc.sign ||= sign;
    };
    add(feePayer, true, true);
    for (const i of instructions) {
      add(i.program, false, false);
      for (let k of i.keys) add(k.address, k.sign, k.write);
    }
    const _keys = Array.from(accounts.keys());
    // [feePayer, ...sign+write, ...sign+read, ...nosign+write, ...nosign+read]
    const keys = [
      feePayer,
      ..._keys.filter((i) => accounts.get(i)!.sign && accounts.get(i)!.write && i !== feePayer),
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
    const ALT: P.UnwrapCoder<typeof MessageAddressTableLookup>[] = [];
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
        blockhash,
        ALT: ALT,
      },
    } as P.UnwrapCoder<typeof MessageRaw>;
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
export const Message = /* @__PURE__ */ P.apply(MessageRaw, MessageCoder);

const Signature = /* @__PURE__ */ P.bytes(64);
const Signatures = /* @__PURE__ */ P.array(shortU16, Signature);
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
 *       header: { requiredSignatures: 0, readSigned: 0, readUnsigned: 0 },
 *       keys: [],
 *       blockhash: '11111111111111111111111111111111',
 *       instructions: [],
 *     },
 *   },
 * });
 * ```
 */
export const TransactionRaw = /* @__PURE__ */ P.struct({
  signatures: Signatures,
  msg: MessageRaw,
});

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
export const Transaction = /* @__PURE__ */ P.apply(TransactionRaw, {
  encode(from) {
    const { signatures, msg } = from;
    if (signatures.length !== msg.data.header.requiredSignatures)
      throw new Error('SOL.tx: not enough signatures');
    return {
      signatures: Object.fromEntries(signatures.map((i, j) => [msg.data.keys[j], i])),
      msg: MessageCoder.encode(msg),
    };
  },
  decode(to) {
    const raw = MessageCoder.decode(to.msg);
    const signatures = [];
    for (let i = 0; i < raw.data.header.requiredSignatures; i++) {
      const address = raw.data.keys[i];
      const sig = to.signatures[address];
      // NOTE: this will break on unsigned transactions! Where we can check this?
      // if (sig === undefined) throw new Error('SOL.tx: missing signature for address: ' + address);
      signatures.push(sig === undefined ? new Uint8Array(64) : sig);
    }
    return { signatures, msg: raw };
  },
});

// Tables is like {contract: [addr1, addr2]} (from archive.getAddressLookupTable().addresses)
/**
 * Builds helpers that resolve or compress Address Lookup Table references.
 * @param tables - Mapping from lookup table account to ordered addresses.
 * @returns Object with `resolve()` and `compress()` helpers.
 * @example
 * Replace full addresses with lookup-table references before serializing a transaction.
 * ```ts
 * import { base64 } from '@scure/base';
 * import { hex } from '@scure/base';
 * import { AddressLookupTables, Transaction, createTransferSol, getAddress } from 'micro-sol-signer';
 * const privateKey = hex.decode('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f');
 * const from = getAddress(privateKey);
 * const to = 'FDwkzWGxx6LfCfzcmVVLEk3QUMxNhuFuKEMRwzR4Dtys';
 * const blockhash = 'J2BjKU6L83eehHVgoze6uTXGCBu6nbxsqEro9QvWpU52';
 * const tx = Transaction.decode(base64.decode(createTransferSol(from, to, 1n, blockhash)));
 * const tables = AddressLookupTables({ table: [to] });
 * tables.compress(tx).msg.instructions[0].keys[1].address;
 * ```
 */
export function AddressLookupTables(tables: Record<string, string[]>) {
  // XXX:1 -> YYY
  const direct = new Map();
  // YYY -> XXX:1
  const reverse = new Map();
  for (const k in tables) {
    const t = tables[k];
    for (let i = 0; i < t.length; i++) {
      const contract = `${k}:${i}`;
      const address = t[i];
      direct.set(contract, address);
      // Order of contracts == priority
      if (!reverse.has(address)) reverse.set(address, contract);
    }
  }
  const mapInstructions = (
    tx: P.UnwrapCoder<typeof Transaction>,
    fn: (address: string) => string
  ) => {
    const instructions = tx.msg.instructions.map((i) => ({
      program: fn(i.program),
      keys: i.keys.map((j) => ({ ...j, address: fn(j.address) })),
      data: i.data,
    }));
    return { signatures: tx.signatures, msg: { ...tx.msg, instructions } };
  };
  return {
    // resolve addresses in transaction using provided tables
    resolve: (tx: P.UnwrapCoder<typeof Transaction>) =>
      mapInstructions(tx, (k) => (direct.has(k) ? direct.get(k)! : k)),
    // compresses addresses using tables
    compress(tx: P.UnwrapCoder<typeof Transaction>) {
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
export const PROGRAMS = /* @__PURE__ */ (() => ({
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
export const sys = /* @__PURE__ */ (() => PROGRAMS.system.program.instructions.encoders)();
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
export const token = /* @__PURE__ */ (() => PROGRAMS.token.program.instructions.encoders)();
// TODO: The inferred type of this node exceeds the maximum length the compiler will serialize. An explicit type annotation is needed.
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
export const token2022 = /* @__PURE__ */ (() =>
  PROGRAMS['token-2022'].program.instructions.encoders as any)();
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
export const associatedToken = /* @__PURE__ */ (() =>
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
export const SYS_PROGRAM = /* @__PURE__ */ (() => PROGRAMS.system.program.contract)();
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
export const TOKEN_PROGRAM = /* @__PURE__ */ (() => PROGRAMS.token.program.contract)();
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
export const TOKEN_PROGRAM2022 = /* @__PURE__ */ (() => PROGRAMS['token-2022'].program.contract)();
/**
 * Associated token program address.
 * @example
 * Build ATA creation instructions via the registry entry for the ATA program.
 * ```ts
 * import { ASSOCIATED_TOKEN_PROGRAM, CONTRACTS, TOKEN_PROGRAM, tokenAddress } from 'micro-sol-signer';
 * const owner = '11111111111111111111111111111111';
 * const mint = 'So11111111111111111111111111111111111111112';
 * const instruction = CONTRACTS[ASSOCIATED_TOKEN_PROGRAM].instructions.encoders.createAssociatedToken(
 *   {
 *     payer: owner,
 *     ata: tokenAddress({ mint, owner, tokenProgram: TOKEN_PROGRAM }),
 *     owner,
 *     mint,
 *   }
 * );
 * ```
 */
export const ASSOCIATED_TOKEN_PROGRAM = /* @__PURE__ */ (() =>
  PROGRAMS.token.additionalPrograms.associatedToken.contract)();

/**
 * Derives the associated token account address.
 * @param value - PDA input fields such as mint, owner, and token program.
 * @returns Base58-encoded associated token account address.
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
export const tokenAddress = /* @__PURE__ */ (() =>
  PROGRAMS.token.additionalPrograms.associatedToken.pdas.associatedToken)();
/**
 * Decoder for SPL token accounts.
 * @param data - Raw account bytes.
 * @param opts - Optional reader settings. See {@link P.ReaderOpts}.
 * @returns Decoded token account payload.
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
export const TokenAccount = /* @__PURE__ */ (() => PROGRAMS.token.program.accounts.decoder)();
/**
 * Decoder for address lookup table accounts.
 * @param data - Raw account bytes.
 * @param opts - Optional reader settings. See {@link P.ReaderOpts}.
 * @returns Decoded address lookup table payload.
 * @example
 * Decode raw bytes from an address lookup table account payload.
 * ```ts
 * import { base64 } from '@scure/base';
 * import { AddressTableLookupData } from 'micro-sol-signer';
 * const data = base64.decode('AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==');
 * const table = AddressTableLookupData(data);
 * ```
 */
export const AddressTableLookupData = /* @__PURE__ */ (() =>
  PROGRAMS.addressLookupTable.program.accounts.decoder)();

const TOKENS_ENCODE: Record<string, any> = /* @__PURE__ */ (() => ({
  [TOKEN_PROGRAM]: PROGRAMS.token.program.instructions.encoders,
  [TOKEN_PROGRAM2022]: PROGRAMS['token-2022'].program.instructions.encoders,
}))();

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
export function decodeAccount(contract: string, data: Bytes): unknown {
  if (ACCOUNTS_DECODE[contract] === undefined) throw new Error('unknown contract');
  return removeUndefined(ACCOUNTS_DECODE[contract](data));
}

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
export function parseInstruction(instruction: Instruction): unknown {
  if (REGISTRY[instruction.program] === undefined) throw new Error('unknown contract');
  return removeUndefined(REGISTRY[instruction.program](instruction));
}

/** Registry of known public Solana programs and their typed helpers. */
export const CONTRACTS: Record<string, any> = /* @__PURE__ */ (() => ({
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
 * const privateKey = hex.decode('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f');
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
export function verifyTx(tx: TxData) {
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
export function getPublicKey(privateKey: Bytes): Bytes {
  return ed25519.getPublicKey(privateKey);
}

/**
 * Derives the Solana address for a private key.
 * @param privateKey - 32-byte private key.
 * @returns Base58-encoded Solana address.
 * @example
 * Convert the signer secret key into the base58 address used in RPC and wallets.
 * ```ts
 * import { hex } from '@scure/base';
 * import { getAddress } from 'micro-sol-signer';
 * getAddress(hex.decode('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f'));
 * ```
 */
export function getAddress(privateKey: Bytes) {
  const publicKey = getPublicKey(privateKey);
  return base58.encode(publicKey);
}

type PrivateKeyFormat = 'base58' | 'hex' | 'array';

/**
 * Formats a private key together with its public key companion.
 * @param privateKey - 32-byte private key.
 * @param format - Output format for the combined key material.
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
export function formatPrivate(privateKey: Bytes, format: PrivateKeyFormat = 'base58') {
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
export function formatPublic(publicKey: Bytes) {
  return base58.encode(publicKey);
}

/**
 * Parses a base58 Solana address into bytes.
 * @param address - Base58-encoded address.
 * @returns Public key bytes.
 * @example
 * Decode the base58 address back into the 32-byte public key form.
 * ```ts
 * import { parseAddress } from 'micro-sol-signer';
 * const publicKey = parseAddress('11111111111111111111111111111111');
 * ```
 */
export function parseAddress(address: string): Bytes {
  return base58.decode(address);
}

/**
 * Creates an unsigned transaction from instructions.
 * @param address - Fee payer address.
 * @param instructions - Instructions to include.
 * @param blockhash - Recent blockhash.
 * @param version - Message version to use.
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
  instructions: Instruction[],
  blockhash: string,
  version: Version = 0
) {
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
  version: Version = 0
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
  version: Version = 0
) {
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
  version: Version = 0
) {
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
 * @returns Tuple of transaction signature and signed transaction.
 * @throws If the transaction does not require this signer or cannot be decoded and signed. {@link Error}
 * @example
 * Build the transfer first, then sign it with the fee payer's private key.
 * ```ts
 * import { hex } from '@scure/base';
 * import { createTransferSol, getAddress, signTx } from 'micro-sol-signer';
 * const privateKey = hex.decode('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f');
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
export function signTx(privateKey: Bytes, data: TxData): [string, string] {
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
  // first signature is txHash
  return [base58.encode(sig), tx];
}

/**
 * Warning: It is NOT secure to sign random msgs,
 * because someone can create a message which is an encoded transaction.
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
export function signBytes(privateKey: Uint8Array, msg: Uint8Array) {
  return base58.encode(ed25519.sign(msg, privateKey));
}
/**
 * Verifies a detached Ed25519 signature over arbitrary bytes.
 * @param sigature - Base58-encoded signature.
 * @param publicKey - Public key bytes or base58 string.
 * @param msg - Message bytes that were signed.
 * @returns `true` when the signature is valid.
 * @example
 * Pair detached verification with the same raw bytes and signer public key.
 * ```ts
 * import { hex } from '@scure/base';
 * import { getPublicKey, signBytes, verifyBytes } from 'micro-sol-signer';
 * const privateKey = hex.decode('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f');
 * const msg = new TextEncoder().encode('hello solana');
 * const sig = signBytes(privateKey, msg);
 * verifyBytes(sig, getPublicKey(privateKey), msg);
 * ```
 */
export function verifyBytes(sigature: string, publicKey: Uint8Array | string, msg: Uint8Array) {
  if (typeof publicKey === 'string') publicKey = base58.decode(publicKey);
  return ed25519.verify(base58.decode(sigature), msg, publicKey);
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
export function getMessageFromTransaction(tx: string) {
  const raw = TransactionRaw.decode(base64.decode(tx));
  return base64.encode(MessageRaw.encode(raw.msg));
}
