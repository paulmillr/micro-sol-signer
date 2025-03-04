import { ed25519 } from '@noble/curves/ed25519';
import { base58, base64, hex } from '@scure/base';
import * as P from 'micro-packed';
import * as idl from './idl/index.js';
import { Decimal, PRECISION, pubKey, shortU16 } from './idl/index.js';
// System: solana IDLs
import ALTIDL from './idl/alt.js';
import ComputeBudgetIDL from './idl/computeBudget.js';
import ConfigIDL from './idl/config.js';
import MemoIDL from './idl/memo.js';
import SystemIDL from './idl/system.js';
import TokenIDL from './idl/token.js';
import Token2022IDL from './idl/token2022.js';

export type Bytes = Uint8Array;
export { Decimal, PRECISION, pubKey, shortU16 };

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
  System: idl.defineIDL(SystemIDL),
  Token: idl.defineIDL(TokenIDL),
  Token2022: idl.defineIDL(Token2022IDL),
  ALT: idl.defineIDL(ALTIDL),
  ComputeBudget: idl.defineIDL(ComputeBudgetIDL),
  Config: idl.defineIDL(ConfigIDL),
  Memo: idl.defineIDL(MemoIDL),
};
// Old API compat
export const sys = PROGRAMS.System.system.instructions.encoders;
export const token = PROGRAMS.Token.token.instructions.encoders;
// TODO: The inferred type of this node exceeds the maximum length the compiler will serialize. An explicit type annotation is needed.
export const token2022 = PROGRAMS.Token2022['token-2022'].instructions.encoders as any;
export const associatedToken = PROGRAMS.Token.associatedToken.instructions.encoders;

export const SYS_PROGRAM = PROGRAMS.System.system.contract;
export const TOKEN_PROGRAM = PROGRAMS.Token.token.contract;
export const TOKEN_PROGRAM2022 = PROGRAMS.Token2022['token-2022'].contract;
export const ASSOCIATED_TOKEN_PROGRAM = PROGRAMS.Token.associatedToken.contract;

export const tokenAddress = PROGRAMS.Token.associatedToken.pdas.associatedToken;
export const TokenAccount = PROGRAMS.Token.token.accounts.decoder;
export const AddressTableLookupData = PROGRAMS.ALT.addressLookupTable.accounts.decoder;

export const isOnCurve = idl.isOnCurve;
export const programAddress = idl.programAddress;

const ACCOUNTS_DECODE: Record<string, any> = {
  [SYS_PROGRAM]: PROGRAMS.System.system.accounts.decoder,
  [TOKEN_PROGRAM]: PROGRAMS.Token.token.accounts.decoder,
  [TOKEN_PROGRAM2022]: PROGRAMS.Token2022['token-2022'].accounts.decoder,
  [ASSOCIATED_TOKEN_PROGRAM]: PROGRAMS.Token.associatedToken.accounts.decoder,
  [PROGRAMS.ALT.addressLookupTable.contract]: PROGRAMS.ALT.addressLookupTable.accounts.decoder,
  [PROGRAMS.ComputeBudget.computeBudget.contract]:
    PROGRAMS.ComputeBudget.computeBudget.accounts.decoder,
  [PROGRAMS.Config.solanaConfig.contract]: PROGRAMS.Config.solanaConfig.accounts.decoder,
  [PROGRAMS.Memo.memo.contract]: PROGRAMS.Memo.memo.accounts.decoder,
};
export function decodeAccount(contract: string, data: Bytes): unknown {
  if (ACCOUNTS_DECODE[contract] === undefined) throw new Error('unknown contract');
  return removeUndefined(ACCOUNTS_DECODE[contract](data));
}

const REGISTRY: Record<string, any> = {
  [SYS_PROGRAM]: PROGRAMS.System.system.instructions.decoder,
  [TOKEN_PROGRAM]: PROGRAMS.Token.token.instructions.decoder,
  [TOKEN_PROGRAM2022]: PROGRAMS.Token2022['token-2022'].instructions.decoder,
  [ASSOCIATED_TOKEN_PROGRAM]: PROGRAMS.Token.associatedToken.instructions.decoder,
  [PROGRAMS.ALT.addressLookupTable.contract]: PROGRAMS.ALT.addressLookupTable.instructions.decoder,
  [PROGRAMS.ComputeBudget.computeBudget.contract]:
    PROGRAMS.ComputeBudget.computeBudget.instructions.decoder,
  [PROGRAMS.Config.solanaConfig.contract]: PROGRAMS.Config.solanaConfig.instructions.decoder,
  [PROGRAMS.Memo.memo.contract]: PROGRAMS.Memo.memo.instructions.decoder,
};
export function parseInstructionRaw(instruction: Instruction): unknown {
  if (REGISTRY[instruction.program] === undefined) throw new Error('unknown contract');
  return removeUndefined(REGISTRY[instruction.program](instruction));
}

export const CONTRACTS: Record<string, any> = {
  [SYS_PROGRAM]: PROGRAMS.System.system,
  [TOKEN_PROGRAM]: PROGRAMS.Token.token,
  [TOKEN_PROGRAM2022]: PROGRAMS.Token2022['token-2022'],
  [ASSOCIATED_TOKEN_PROGRAM]: PROGRAMS.Token.associatedToken,
  [PROGRAMS.ALT.addressLookupTable.contract]: PROGRAMS.ALT.addressLookupTable,
  [PROGRAMS.ComputeBudget.computeBudget.contract]: PROGRAMS.ComputeBudget.computeBudget,
  [PROGRAMS.Config.solanaConfig.contract]: PROGRAMS.Config.solanaConfig,
  [PROGRAMS.Memo.memo.contract]: PROGRAMS.Memo.memo,
};

export type TokenInfo = {
  symbol: string;
  decimals: number;
  price?: number;
};
export type TokenList = Record<string, TokenInfo>;
const tokenName = (address: string, tl: TokenList) => tl[address]?.symbol || address;
const hints: Record<string, Record<string, (o: any, tl: TokenList) => string>> = {
  [SYS_PROGRAM]: {
    createAccount: (o: {
      payer: string;
      newAccount: string;
      lamports: bigint;
      space: bigint;
      programAddress: string;
    }) =>
      `Create new account=${o.newAccount} with balance of ${Decimal.encode(
        o.lamports
      )} and owner program ${o.programAddress}, using funding account ${o.payer}`,
    assign: (o: { account: string; programAddress: string }) =>
      `Assign account=${o.account} to owner program=${o.programAddress}`,
    transferSol: (o: { amount: bigint; source: string; destination: string }) =>
      `Transfer ${Decimal.encode(o.amount)} SOL from ${o.source} to ${o.destination}`,
    advanceNonceAccount: (o: { nonceAccount: string; nonceAuthority: string }) =>
      `Consume nonce in nonce account=${o.nonceAccount} (owner: ${o.nonceAuthority})`,
    withdrawNonceAccount: (o: {
      withdrawAmount: bigint;
      recipientAccount: string;
      nonceAccount: string;
      nonceAuthority: string;
    }) =>
      `Withdraw ${Decimal.encode(o.withdrawAmount)} SOL from nonce account=${o.nonceAccount} (owner: ${
        o.nonceAuthority
      }) to ${o.recipientAccount}`,
    authorizeNonceAccount: (o: {
      nonceAccount: string;
      nonceAuthority: string;
      newNonceAuthority: string;
    }) =>
      `Change owner of nonce account=${o.nonceAccount} from ${o.nonceAuthority} to ${o.newNonceAuthority}`,
  },
  [ASSOCIATED_TOKEN_PROGRAM]: {
    createAssociatedToken: (
      o: { ata: string; owner: string; mint: string; payer: string },
      tl: TokenList
    ) =>
      `Initialize associated token account=${o.ata} with owner=${
        o.owner
      } for token=${tokenName(o.mint, tl)}, payed by ${o.payer}`,
  },
};

export function parseInstruction(instruction: Instruction, tl: TokenList = {}) {
  const raw = parseInstructionRaw(instruction) as any;
  const hint =
    hints[instruction.program] &&
    hints[instruction.program][raw.TAG] &&
    hints[instruction.program][raw.TAG](raw.data, tl);
  const res = { type: raw.TAG, info: raw.data };
  if (hint) (res as any).hint = hint;
  return res;
}

// https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/solana.tokenlist.json
export const COMMON_TOKENS: TokenList = {
  So11111111111111111111111111111111111111112: { decimals: 9, symbol: 'SOL' }, // Wrapped SOL
  Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: { decimals: 6, symbol: 'USDT', price: 1 },
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: { decimals: 6, symbol: 'USDC', price: 1 },
  '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo': { decimals: 6, symbol: 'PYUSD', price: 1 }, // PayPal USD
};

export function tokenFromSymbol(symbol: string, tokens = COMMON_TOKENS) {
  for (let c in tokens) if (tokens[c].symbol === symbol) return { ...tokens[c], contract: c };
  return;
}

// Basic tx stuff
type TxData = Bytes | string;
export function verifyTx(tx: TxData) {
  if (typeof tx === 'string') tx = base64.decode(tx);
  if (tx.length > MAX_TX_SIZE) throw new Error('sol: transaction too big');
  const parsed = Transaction.decode(tx);
  const raw = TransactionRaw.decode(tx);
  const msg = MessageRaw.encode(raw.msg);
  for (let i = 0; i < raw.msg.data.header.requiredSignatures; i++) {
    const address = raw.msg.data.keys[i];
    const pubKey = base58.decode(address);
    const sig = parsed.signatures[address];
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

export function getAddressFromPublicKey(publicKey: Bytes) {
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

export function createTxComplex(
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

export function createTx(
  from: string,
  to: string,
  amount: string,
  _fee: bigint,
  blockhash: string
): string {
  const amountNum = Decimal.decode(amount);
  return createTxComplex(
    from,
    [sys.transferSol({ source: from, destination: to, amount: amountNum })],
    blockhash
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
