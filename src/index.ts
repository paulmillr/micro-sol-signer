import { ed25519 } from '@noble/curves/ed25519';
import { base58, base64, hex } from '@scure/base';
import * as P from 'micro-packed';
import * as idl from './idl/index.ts';
import { Decimal, PRECISION, pubKey, shortU16 } from './idl/index.ts';
// System: solana IDLs
import ALTIDL from './idl/alt.ts';
import ComputeBudgetIDL from './idl/computeBudget.ts';
import ConfigIDL from './idl/config.ts';
import MemoIDL from './idl/memo.ts';
import SystemIDL from './idl/system.ts';
import TokenIDL from './idl/token.ts';
import Token2022IDL from './idl/token2022.ts';
export { Offchain } from './offchain.ts';
export { Decimal, PRECISION, pubKey, shortU16 };
export type Bytes = Uint8Array;

const MAX_TX_SIZE = 1280 - 40 - 8;

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

export function validateAddress(address: string) {
  const pubkey = base58.decode(address);
  if (pubkey.length !== 32) throw new Error('Invalid Solana address');
}

export type Account = { address: string; sign: boolean; write: boolean };
export type Instruction = { program: string; keys: Account[]; data: Bytes };

export type Message = {
  // First account in list of signers pays fee, however it is easy to make mistake, so we force user to specify feePayer manually.
  feePayer: string;
  blockhash: string;
  instructions: Instruction[];
};

const keyParams = (i: number, req: number, signed: number, unsigned: number, total: number) => ({
  sign: i < req ? true : false,
  write: i < req - signed || (i >= req && i < total - unsigned) ? true : false,
});

const MessageHeader = P.struct({
  requiredSignatures: P.U8,
  readSigned: P.U8,
  readUnsigned: P.U8,
});

const Instruction = P.struct({
  programIdx: P.U8,
  keys: P.array(shortU16, P.U8),
  data: P.bytes(shortU16),
});

const MessageLegacy = P.struct({
  header: MessageHeader,
  keys: P.array(shortU16, pubKey),
  blockhash: pubKey,
  instructions: P.array(shortU16, Instruction),
});

const MessageAddressTableLookup = P.struct({
  account: pubKey,
  writableIndexes: P.array(shortU16, P.U8),
  readonlyIndexes: P.array(shortU16, P.U8),
});

const MessageV0 = P.struct({
  header: MessageHeader,
  keys: P.array(shortU16, pubKey),
  blockhash: pubKey,
  instructions: P.array(shortU16, Instruction),
  ALT: P.array(shortU16, MessageAddressTableLookup),
});

const MessageVersion: P.CoderType<number | 'legacy'> = P.wrap({
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

export const MessageRaw = P.tag(MessageVersion, {
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

export const Message = P.apply(MessageRaw, MessageCoder);

export const TransactionRaw = P.struct({
  signatures: P.array(shortU16, P.bytes(64)),
  msg: MessageRaw,
});

export const Transaction = P.apply(TransactionRaw, {
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

export const PROGRAMS = {
  ...idl.defineIDL(SystemIDL),
  ...idl.defineIDL(TokenIDL),
  ...idl.defineIDL(Token2022IDL),
  ...idl.defineIDL(ALTIDL),
  ...idl.defineIDL(ComputeBudgetIDL),
  ...idl.defineIDL(ConfigIDL),
  ...idl.defineIDL(MemoIDL),
};
// Old API compat
export const sys = PROGRAMS.system.program.instructions.encoders;
export const token = PROGRAMS.token.program.instructions.encoders;
// TODO: The inferred type of this node exceeds the maximum length the compiler will serialize. An explicit type annotation is needed.
export const token2022 = PROGRAMS['token-2022'].program.instructions.encoders as any;
export const associatedToken =
  PROGRAMS.token.additionalPrograms.associatedToken.instructions.encoders;

export const SYS_PROGRAM = PROGRAMS.system.program.contract;
export const TOKEN_PROGRAM = PROGRAMS.token.program.contract;
export const TOKEN_PROGRAM2022 = PROGRAMS['token-2022'].program.contract;
export const ASSOCIATED_TOKEN_PROGRAM = PROGRAMS.token.additionalPrograms.associatedToken.contract;

export const tokenAddress = PROGRAMS.token.additionalPrograms.associatedToken.pdas.associatedToken;
export const TokenAccount = PROGRAMS.token.program.accounts.decoder;
export const AddressTableLookupData = PROGRAMS.addressLookupTable.program.accounts.decoder;

export const isOnCurve = idl.isOnCurve;
export const programAddress = idl.programAddress;

const TOKENS_ENCODE: Record<string, any> = {
  [TOKEN_PROGRAM]: PROGRAMS.token.program.instructions.encoders,
  [TOKEN_PROGRAM2022]: PROGRAMS['token-2022'].program.instructions.encoders,
};

const ACCOUNTS_DECODE: Record<string, any> = {
  [SYS_PROGRAM]: PROGRAMS.system.program.accounts.decoder,
  [TOKEN_PROGRAM]: PROGRAMS.token.program.accounts.decoder,
  [TOKEN_PROGRAM2022]: PROGRAMS['token-2022'].program.accounts.decoder,
  [ASSOCIATED_TOKEN_PROGRAM]: PROGRAMS.token.additionalPrograms.associatedToken.accounts.decoder,
  [PROGRAMS.addressLookupTable.program.contract]:
    PROGRAMS.addressLookupTable.program.accounts.decoder,
  [PROGRAMS.computeBudget.program.contract]: PROGRAMS.computeBudget.program.accounts.decoder,
  [PROGRAMS.solanaConfig.program.contract]: PROGRAMS.solanaConfig.program.accounts.decoder,
  [PROGRAMS.memo.program.contract]: PROGRAMS.memo.program.accounts.decoder,
};
export function decodeAccount(contract: string, data: Bytes): unknown {
  if (ACCOUNTS_DECODE[contract] === undefined) throw new Error('unknown contract');
  return removeUndefined(ACCOUNTS_DECODE[contract](data));
}

const REGISTRY: Record<string, any> = {
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
};
export function parseInstruction(instruction: Instruction): unknown {
  if (REGISTRY[instruction.program] === undefined) throw new Error('unknown contract');
  return removeUndefined(REGISTRY[instruction.program](instruction));
}

export const CONTRACTS: Record<string, any> = {
  [SYS_PROGRAM]: PROGRAMS.system.program,
  [TOKEN_PROGRAM]: PROGRAMS.token.program,
  [TOKEN_PROGRAM2022]: PROGRAMS['token-2022'].program,
  [ASSOCIATED_TOKEN_PROGRAM]: PROGRAMS.token.additionalPrograms.associatedToken,
  [PROGRAMS.addressLookupTable.program.contract]: PROGRAMS.addressLookupTable.program,
  [PROGRAMS.computeBudget.program.contract]: PROGRAMS.computeBudget.program,
  [PROGRAMS.solanaConfig.program.contract]: PROGRAMS.solanaConfig.program,
  [PROGRAMS.memo.program.contract]: PROGRAMS.memo.program,
};

// Basic tx stuff
type TxData = Bytes | string;
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

export function getPublicKey(privateKey: Bytes) {
  return ed25519.getPublicKey(privateKey);
}

export function getAddress(privateKey: Bytes) {
  const publicKey = getPublicKey(privateKey);
  return base58.encode(publicKey);
}

type PrivateKeyFormat = 'base58' | 'hex' | 'array';

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

export function formatPublic(publicKey: Bytes) {
  return base58.encode(publicKey);
}

export function parseAddress(address: string) {
  return base58.decode(address);
}

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

export function createTokenTransferChecked(
  mint: string,
  from: string,
  to: string,
  amount: bigint,
  decimals: bigint,
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
 */
export function signBytes(privateKey: Uint8Array, msg: Uint8Array) {
  return base58.encode(ed25519.sign(msg, privateKey));
}
export function verifyBytes(sigature: string, publicKey: Uint8Array | string, msg: Uint8Array) {
  if (typeof publicKey === 'string') publicKey = base58.decode(publicKey);
  return ed25519.verify(base58.decode(sigature), msg, publicKey);
}

export function getMessageFromTransaction(tx: string) {
  const raw = TransactionRaw.decode(base64.decode(tx));
  return base64.encode(MessageRaw.encode(raw.msg));
}
