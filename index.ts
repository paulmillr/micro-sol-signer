import * as ed25519 from '@noble/ed25519';
import { base58, base64, utf8 } from '@scure/base';
import { sha256 } from '@noble/hashes/sha256';
import * as P from 'micro-packed';

export type Bytes = Uint8Array;

export function formatDecimal(n: bigint, precision: number): string {
  let s = (n < 0n ? -n : n).toString(10);
  let sep = s.length - precision;
  if (sep < 0) {
    s = s.padStart(s.length - sep, '0');
    sep = 0;
  }
  let i = s.length - 1;
  for (; i >= sep && s[i] === '0'; i--);
  let [int, frac] = [s.slice(0, sep), s.slice(sep, i + 1)];
  if (!int) int = '0';
  if (n < 0n) int = '-' + int;
  if (!frac) return int;
  return `${int}.${frac}`;
}

export function parseDecimal(s: string, precision: number): bigint {
  let neg = false;
  if (s.startsWith('-')) {
    neg = true;
    s = s.slice(1);
  }
  let sep = s.indexOf('.');
  sep = sep === -1 ? s.length : sep;
  const [intS, fracS] = [s.slice(0, sep), s.slice(sep + 1)];
  const int = BigInt(intS) * 10n ** BigInt(precision);
  const fracLen = Math.min(fracS.length, precision);
  const frac = BigInt(fracS.slice(0, fracLen)) * 10n ** BigInt(precision - fracLen);
  const value = int + frac;
  return neg ? -value : value;
}

export function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  if (arrays.length === 1) return arrays[0];
  const length = arrays.reduce((a, arr) => a + arr.length, 0);
  const result = new Uint8Array(length);
  for (let i = 0, pad = 0; i < arrays.length; i++) {
    const arr = arrays[i];
    result.set(arr, pad);
    pad += arr.length;
  }
  return result;
}

// first bit -- terminator (1 -- continue, 0 -- last)
export const shortVec = P.wrap({
  encodeStream: (w: P.Writer, value: number) => {
    if (!value) return w.byte(0);
    for (; value; value >>= 7) {
      w.bits(value > 0x7f ? 1 : 0, 1);
      w.bits(value & 0x7f, 7);
    }
  },
  decodeStream: (r: P.Reader): number => {
    let len = 0;
    for (let pos = 0; !r.isEnd(); pos++) {
      const last = !r.bits(1);
      len |= r.bits(7) << (pos * 7);
      if (last) break;
    }
    return len;
  },
});

export const SOL_PRECISION = 9;

const rustString = P.string(P.padRight(8, P.U32LE, undefined));
const pubKey = P.bytesFormatted(32, 'base58');

export const Message = P.struct({
  requiredSignatures: P.U8,
  readSigned: P.U8,
  readUnsigned: P.U8,
  keys: P.array(shortVec, pubKey),
  blockhash: pubKey,
  instructions: P.array(
    shortVec,
    P.struct({ programIdx: P.U8, keys: P.array(shortVec, P.U8), data: P.bytes(shortVec) })
  ),
});

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

export const TransactionRaw = P.struct({
  signatures: P.array(shortVec, P.bytes(64)),
  msg: Message,
});
// doesn't verify signatures, just parses them
export type Tx = { msg: Message; signatures: Record<string, Bytes> };
// Keys position is implementation specific, Transaction.encode(Transaction.decode(tx)) not neccessary equals to tx,
// since there is information loss for readability purposes. Use TransactionRaw in case you need exactly same encoding
export const Transaction = P.wrap({
  encodeStream: (w: P.Writer, value: Tx) => {
    const { msg, signatures } = value;
    const accounts: Record<string, { sign: boolean; write: boolean }> = {};
    const add = (address: string, sign: boolean, write: boolean) => {
      let acc = accounts[address] || (accounts[address] = { sign: false, write: false });
      acc.write ||= write;
      acc.sign ||= sign;
    };
    add(msg.feePayer, true, true);
    for (let i of msg.instructions) for (let k of i.keys) add(k.address, k.sign, k.write);
    // Same loop as above, but cannot be merged since it will change implementation specific key positions inside transaction.
    // This doesn't invalidate transaction, but can be used for fingerprinting.
    for (let i of msg.instructions) add(i.program, false, false);
    const _keys = Object.keys(accounts);
    // [feePayer, ...sign+write, ...sign+read, ...nosign+write, ...nosign+read]
    const keys = [
      msg.feePayer,
      ..._keys.filter((i) => accounts[i].sign && accounts[i].write && i !== msg.feePayer),
      ..._keys.filter((i) => accounts[i].sign && !accounts[i].write),
      ..._keys.filter((i) => !accounts[i].sign && accounts[i].write),
      ..._keys.filter((i) => !accounts[i].sign && !accounts[i].write),
    ];
    let requiredSignatures = 0;
    let readSigned = 0;
    let readUnsigned = 0;
    for (let k of keys) {
      if (accounts[k].sign) requiredSignatures++;
      if (accounts[k].write) continue;
      if (accounts[k].sign) readSigned++;
      else readUnsigned++;
    }
    TransactionRaw.encodeStream(w, {
      signatures: keys
        .filter((i) => accounts[i].sign)
        .map((i) => signatures[i] || new Uint8Array(64)),
      msg: {
        requiredSignatures,
        readSigned,
        readUnsigned,
        keys,
        // indexOf potentially can be slow, but for most tx there will be ~3-5 keys, so doesn't matter much
        instructions: msg.instructions.map((i) => ({
          programIdx: keys.indexOf(i.program),
          keys: i.keys.map((j) => keys.indexOf(j.address)),
          data: i.data,
        })),
        blockhash: msg.blockhash,
      },
    });
  },
  decodeStream: (r: P.Reader): Tx => {
    const { signatures, msg } = TransactionRaw.decodeStream(r);
    if (signatures.length !== msg.requiredSignatures)
      throw new Error('SOL.tx: wrong signatures length');
    if (msg.keys.length < signatures.length) throw new Error('SOL.tx: invalid keys length');
    const sigs: Tx['signatures'] = {};
    for (let i = 0; i < signatures.length; i++) sigs[msg.keys[i]] = signatures[i];
    let accounts: Account[] = [];
    for (let i = 0; i < msg.keys.length; i++) {
      accounts.push({
        address: msg.keys[i],
        ...keyParams(i, msg.requiredSignatures, msg.readSigned, msg.readUnsigned, msg.keys.length),
      });
    }
    if (!accounts.length) throw new Error('SOL.tx: empty accounts array');
    return {
      msg: {
        feePayer: accounts[0].address,
        blockhash: msg.blockhash,
        instructions: msg.instructions.map((i) => ({
          program: accounts[i.programIdx].address,
          keys: i.keys.map((j) => accounts[j]),
          data: i.data,
        })),
      },
      signatures: sigs,
    };
  },
});

type KeyOpt = { sign: boolean; write: boolean; address?: string };
// Sort of ABI stuff, which allows to define encode/decode for programs easily
type Method<T, K extends Record<string, KeyOpt>> = {
  coder: P.BytesCoder<T>;
  keys: K;
};

export type TokenInfo = {
  symbol: string;
  decimals: number;
  price?: number;
};

export type TokenList = Record<string, TokenInfo>;

type MethodHint<T extends Method<any, any>> = T & {
  hint?: (o: MethodData<T>, t: TokenList) => string;
};

// Remove keys with value 'never'
type FilterKeys<T> = Pick<T, { [K in keyof T]: T[K] extends never ? never : K }[keyof T]>;

type MethodData<T extends Method<any, any>> = P.UnwrapCoder<T['coder']> &
  FilterKeys<{ [A in keyof T['keys']]: T['keys'][A]['address'] extends string ? never : string }>;

type Program<T extends Record<string, Method<any, any>>> = {
  [K in keyof T]: (data: MethodData<T[K]>) => Instruction;
};

const registry: Record<string, (instr: Instruction, tl: TokenList) => MethodData<any>> = {};
// Basic ABI thing. There is IDL which is kinda ABI, but not official and system accounts doesn't have offical types for it.
// Later we can add support to conversion IDL -> defineProgram
export function defineProgram<T extends Record<string, MethodHint<any>>>(
  address: string,
  tagType: P.CoderType<number>,
  methods: T
): Program<T> {
  if (registry[address]) throw new Error('SOL: program for this address already defined');
  const variants = P.map(
    tagType,
    Object.keys(methods).reduce((acc, k, i) => ({ ...acc, [k]: i }), {})
  );
  const coders: any = Object.keys(methods).reduce(
    (acc, k) => ({ ...acc, [k]: methods[k].coder }),
    {}
  );
  const mainCoder = P.tag(variants, coders);
  registry[address] = (instr: Instruction, tl: TokenList): MethodData<any> => {
    if (instr.program !== address)
      throw new Error('SOL.parseInstruction: Wrong instruction program address');
    const { TAG, data } = mainCoder.decode(instr.data);
    // Should be close to node parser (https://github.com/solana-labs/solana/tree/master/transaction-status/src)
    const res: Record<string, any> = { type: TAG, info: data };
    const keys = Object.keys(methods[TAG].keys);
    if (keys.length !== instr.keys.length)
      throw new Error('SOL.parseInstruction: Keys length mismatch');
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (methods[TAG].keys[key].address) {
        if (methods[TAG].keys[key].address !== instr.keys[i].address) {
          throw new Error(
            `SOL.parseInstruction(${address}/${TAG}): Invalid constant address for key exp=${methods[TAG].keys[key].address} got=${instr.keys[i].address}`
          );
        }
        continue;
      }
      res.info[keys[i]] = instr.keys[i].address;
    }
    if (methods[TAG].hint) res.hint = methods[TAG].hint(data, tl);
    return res as MethodData<any>;
  };
  const program: Program<T> = {} as Program<T>;
  for (const m in methods) {
    program[m] = (data: MethodData<typeof methods[typeof m]>): Instruction => ({
      program: address,
      data: mainCoder.encode({ TAG: m, data }),
      keys: Object.keys(methods[m].keys).map((name) => {
        let { sign, write, address } = methods[m].keys[name];
        address ||= (data as any)[name];
        validateAddress(address);
        return { address, sign, write };
      }),
    });
  }
  return program;
}

export function parseInstruction(instr: Instruction, tl: TokenList): any {
  if (!registry[instr.program]) return;
  return registry[instr.program](instr, tl);
}

export const SYS_RECENT_BLOCKHASHES = 'SysvarRecentB1ockHashes11111111111111111111';
export const SYS_RENT = 'SysvarRent111111111111111111111111111111111';
export const SYS_PROGRAM = '11111111111111111111111111111111';
export const sys = defineProgram(SYS_PROGRAM, P.U32LE, {
  createAccount: {
    coder: P.struct({ lamports: P.U64LE, space: P.U64LE, owner: pubKey }),
    keys: {
      source: { sign: true, write: true },
      newAccount: { sign: true, write: true },
    },
    hint: (o: {
      source: string;
      newAccount: string;
      lamports: bigint;
      space: bigint;
      owner: string;
    }) =>
      `Create new account=${o.newAccount} with balance of ${formatDecimal(
        o.lamports,
        SOL_PRECISION
      )} and owner program ${o.owner}, using funding account ${o.source}`,
  },
  assign: {
    coder: P.struct({ owner: pubKey }),
    keys: { account: { sign: true, write: true } },
    hint: (o: { account: string; owner: string }) =>
      `Assign account=${o.account} to owner program=${o.owner}`,
  },
  transfer: {
    coder: P.struct({ lamports: P.U64LE }),
    keys: { source: { sign: true, write: true }, destination: { sign: false, write: true } },
    hint: (o: { lamports: bigint; source: string; destination: string }) =>
      `Transfer ${formatDecimal(o.lamports, SOL_PRECISION)} SOL from ${o.source} to ${
        o.destination
      }`,
  },
  createAccountWithSeed: {
    coder: P.struct({
      base: pubKey,
      seed: rustString,
      lamports: P.U64LE,
      space: P.U64LE,
      owner: pubKey,
    }),
    keys: {
      source: { sign: true, write: true },
      newAccount: { sign: false, write: true },
      base: { sign: true, write: false },
    },
  },
  advanceNonce: {
    coder: P.struct({}),
    keys: {
      nonceAccount: { sign: false, write: true },
      _recent_bh: { address: SYS_RECENT_BLOCKHASHES, sign: false, write: false },
      nonceAuthority: { sign: true, write: false },
    },
    hint: (o: { nonceAccount: string; nonceAuthority: string }) =>
      `Consume nonce in nonce account=${o.nonceAccount} (owner: ${o.nonceAuthority})`,
  },
  withdrawFromNonce: {
    coder: P.struct({ lamports: P.U64LE }),
    keys: {
      nonceAccount: { sign: false, write: true },
      destination: { sign: false, write: true },
      _recent_bh: { address: SYS_RECENT_BLOCKHASHES, sign: false, write: false },
      _rent: { address: SYS_RENT, sign: false, write: false },
      nonceAuthority: { sign: true, write: false },
    },
    hint: (o: {
      lamports: bigint;
      destination: string;
      nonceAccount: string;
      nonceAuthority: string;
    }) =>
      `Withdraw ${formatDecimal(o.lamports, SOL_PRECISION)} SOL from nonce account=${
        o.nonceAccount
      } (owner: ${o.nonceAuthority}) to ${o.destination}`,
  },
  initializeNonce: {
    coder: P.struct({ nonceAuthority: pubKey }),
    keys: {
      nonceAccount: { sign: false, write: true },
      _recent_bh: { address: SYS_RECENT_BLOCKHASHES, sign: false, write: false },
      _rent: { address: SYS_RENT, sign: false, write: false },
    },
  },
  authorizeNonce: {
    coder: P.struct({ newAuthorized: pubKey }),
    keys: {
      nonceAccount: { sign: false, write: true },
      nonceAuthority: { sign: true, write: false },
    },
    hint: (o: { nonceAccount: string; nonceAuthority: string; newAuthorized: string }) =>
      `Change owner of nonce account=${o.nonceAccount} from ${o.nonceAuthority} to ${o.newAuthorized}`,
  },
  allocate: {
    coder: P.struct({ space: P.U64LE }),
    keys: {
      account: { sign: true, write: true },
    },
  },
  allocateWithSeed: {
    coder: P.struct({
      base: pubKey,
      seed: rustString,
      space: P.U64LE,
      owner: pubKey,
    }),
    keys: {
      account: { sign: false, write: true },
      base: { sign: true, write: false },
    },
  },
  assignWithSeed: {
    coder: P.struct({
      base: pubKey,
      seed: rustString,
      owner: pubKey,
    }),
    keys: {
      account: { sign: false, write: true },
      base: { sign: true, write: false },
    },
  },
  transferWithSeed: {
    coder: P.struct({
      lamports: P.U64LE,
      sourceSeed: rustString,
      sourceOwner: pubKey,
    }),
    keys: {
      source: { sign: false, write: true },
      sourceBase: { sign: true, write: false },
      destination: { sign: false, write: true },
    },
  },
});

// Type tests
const assertType = <T>(value: T) => {};
assertType<(o: { lamports: bigint; source: string; destination: string }) => Instruction>(
  sys.transfer
);
assertType<(o: { lamports: bigint; nonceAccount: string; nonceAuthority: string }) => Instruction>(
  sys.advanceNonce
);

const authorityType = P.map(P.U8, {
  MintTokens: 0,
  FreezeAccount: 1,
  AccountOwner: 2,
  CloseAccount: 3,
});

const tokenName = (address: string, tl: TokenList) => tl[address]?.symbol || address;

export const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
export const token = defineProgram(TOKEN_PROGRAM, P.U8, {
  initializeMint: {
    coder: P.struct({
      decimals: P.U8,
      mintAuthority: pubKey,
      freezeAuthority: P.optional(P.bool, pubKey, '11111111111111111111111111111111'),
    }),
    keys: {
      mint: { sign: false, write: true },
      _rent: { address: SYS_RENT, sign: false, write: false },
    },
  },
  initializeAccount: {
    coder: P.struct({}),
    keys: {
      account: { sign: false, write: true },
      mint: { sign: false, write: false },
      owner: { sign: false, write: false },
      _rent: { address: SYS_RENT, sign: false, write: false },
    },
    hint: (o: { owner: string; account: string; mint: string }, tl: TokenList) =>
      `Initialize token account=${o.account} with owner=${o.owner} token=${tokenName(o.mint, tl)}`,
  },
  // TODO: multisig support?
  initializeMultisig: {
    coder: P.struct({ m: P.U8 }),
    keys: {
      account: { sign: false, write: true },
      _rent: { address: SYS_RENT, sign: false, write: false },
    },
    hint: (o: { account: string; m: number }, tl: TokenList) =>
      `Initialize multi-sig token account=${o.account} with signatures=${o.m}`,
  },
  transfer: {
    coder: P.struct({ amount: P.U64LE }),
    keys: {
      source: { sign: false, write: true },
      destination: { sign: false, write: true },
      owner: { sign: true, write: false },
    },
    hint: (
      o: { amount: bigint; source: string; destination: number; owner: string },
      tl: TokenList
    ) =>
      `Transfer ${o.amount} from token account=${o.source} of owner=${o.owner} to ${o.destination}`,
  },
  approve: {
    coder: P.struct({ amount: P.U64LE }),
    keys: {
      account: { sign: false, write: true },
      delegate: { sign: false, write: false },
      owner: { sign: true, write: false },
    },
    hint: (
      o: { amount: bigint; account: string; delegate: number; owner: string },
      tl: TokenList
    ) =>
      `Approve authority of delegate=${o.delegate} over tokens on account=${o.account} on behalf of owner=${o.owner}`,
  },
  revoke: {
    coder: P.struct({}),
    keys: {
      account: { sign: false, write: true },
      owner: { sign: true, write: false },
    },
    hint: (o: { amount: bigint; account: string; owner: string }, tl: TokenList) =>
      `Revoke delegate's authority over tokens on account=${o.account} on behalf of owner=${o.owner}`,
  },
  setAuthority: {
    coder: P.struct({
      authorityType,
      newAuthority: P.optional(P.bool, pubKey, '11111111111111111111111111111111'),
    }),
    keys: {
      account: { sign: false, write: true },
      currentAuthority: { sign: true, write: false },
    },
    hint: (
      o: { newAuthority: string; account: string; currentAuthority: string; authorityType: string },
      tl: TokenList
    ) =>
      `Sets a new authority=${o.newAuthority} of a mint or account=${o.account}. Current authority=${o.currentAuthority}. Authority Type: ${o.authorityType}`,
  },
  mintTo: {
    coder: P.struct({ amount: P.U64LE }),
    keys: {
      mint: { sign: false, write: true },
      dest: { sign: false, write: true },
      authority: { sign: true, write: false },
    },
  },
  burn: {
    coder: P.struct({ amount: P.U64LE }),
    keys: {
      account: { sign: false, write: true },
      mint: { sign: false, write: true },
      owner: { sign: true, write: false },
    },
    hint: (o: { amount: bigint; account: string; mint: string; owner: string }, tl: TokenList) =>
      `Burn ${o.amount} tokens from account=${o.account} of owner=${o.owner} mint=${o.mint}`,
  },
  closeAccount: {
    coder: P.struct({}),
    keys: {
      account: { sign: false, write: true },
      dest: { sign: false, write: true },
      owner: { sign: true, write: false },
    },
    hint: (o: { account: string; dest: string; owner: string }, tl: TokenList) =>
      `Close token account=${o.account} of owner=${o.owner}, transferring all its SOL to destionation account=${o.dest}`,
  },
  freezeAccount: {
    coder: P.struct({}),
    keys: {
      account: { sign: false, write: true },
      mint: { sign: false, write: true },
      authority: { sign: true, write: false },
    },
    hint: (o: { account: string; authority: string; mint: string }, tl: TokenList) =>
      `Freeze token account=${o.account} of mint=${o.mint} using freeze_authority=${o.authority}`,
  },
  thawAccount: {
    coder: P.struct({}),
    keys: {
      account: { sign: false, write: true },
      mint: { sign: false, write: false },
      authority: { sign: true, write: false },
    },
    hint: (o: { account: string; authority: string; mint: string }, tl: TokenList) =>
      `Thaw a frozne token account=${o.account} of mint=${o.mint} using freeze_authority=${o.authority}`,
  },
  transferChecked: {
    coder: P.struct({ amount: P.U64LE, decimals: P.U8 }),
    keys: {
      source: { sign: false, write: true },
      mint: { sign: false, write: false },
      destination: { sign: false, write: true },
      owner: { sign: true, write: false },
    },
    hint: (
      o: {
        amount: bigint;
        source: string;
        destination: number;
        owner: string;
        decimals: number;
        mint: string;
      },
      tl: TokenList
    ) =>
      `Transfer ${formatDecimal(o.amount, o.decimals)} ${tokenName(
        o.mint,
        tl
      )} from token account=${o.source} of owner=${o.owner} to ${o.destination}`,
  },
  approveChecked: {
    coder: P.struct({ amount: P.U64LE, decimals: P.U8 }),
    keys: {
      source: { sign: false, write: true },
      mint: { sign: false, write: false },
      delegate: { sign: false, write: false },
      owner: { sign: true, write: false },
    },
    hint: (
      o: {
        amount: bigint;
        source: string;
        delegate: number;
        owner: string;
        decimals: number;
        mint: string;
      },
      tl: TokenList
    ) =>
      `Approve delgate=${o.delegate} authority on behalf account=${o.source} owner=${
        o.owner
      } over ${formatDecimal(o.amount, o.decimals)} ${tokenName(o.mint, tl)}`,
  },
  mintToChecked: {
    coder: P.struct({ amount: P.U64LE, decimals: P.U8 }),
    keys: {
      mint: { sign: false, write: true },
      dest: { sign: false, write: true },
      authority: { sign: true, write: false },
    },
    hint: (
      o: {
        amount: bigint;
        dest: string;
        authority: string;
        mint: string;
        decimals: number;
      },
      tl: TokenList
    ) =>
      `Mint new tokens (${formatDecimal(o.amount, o.decimals)} ${tokenName(
        o.mint,
        tl
      )}) to account=${o.dest} using authority=${o.authority}`,
  },
  burnChecked: {
    coder: P.struct({ amount: P.U64LE, decimals: P.U8 }),
    keys: {
      mint: { sign: false, write: true },
      account: { sign: false, write: true },
      owner: { sign: true, write: false },
    },
    hint: (
      o: {
        amount: bigint;
        account: string;
        owner: string;
        mint: string;
        decimals: number;
      },
      tl: TokenList
    ) =>
      `Burn tokens (${formatDecimal(o.amount, o.decimals)} ${tokenName(o.mint, tl)}) on account=${
        o.account
      } of owner=${o.owner}`,
  },
  initializeAccount2: {
    coder: P.struct({ owner: pubKey }),
    keys: {
      account: { sign: false, write: true },
      mint: { sign: false, write: false },
      _rent: { address: SYS_RENT, sign: false, write: false },
    },
    hint: (o: { owner: string; account: string; mint: string }, tl: TokenList) =>
      `Initialize token account=${o.account} with owner=${o.owner} token=${tokenName(o.mint, tl)}`,
  },
  syncNative: {
    coder: P.struct({}),
    keys: { nativeAccount: { sign: false, write: true } },
    hint: (o: { nativeAccount: string }) =>
      `Sync SOL balance for wrapped account ${o.nativeAccount}`,
  },
});

export const NonceAccount = P.struct({
  version: P.U32LE,
  state: P.U32LE,
  authority: pubKey,
  nonce: pubKey,
  lamportPerSignature: P.U64LE,
});

function mod(a: bigint, b: bigint = ed25519.CURVE.P) {
  const res = a % b;
  return res >= 0n ? res : b + res;
}

export function isOnCurve(bytes: Bytes | string) {
  if (typeof bytes === 'string') bytes = base58.decode(bytes);
  try {
    // noble-ed25519 checks that publicKey is < P, but dalek (ed25519-dalek.CompressedEdwardsY) is not, so we do modulo here.
    // first bit in last byte is x oddity flag
    const last = bytes[31];
    const normedLast = last & ~0x80;
    const normed = Uint8Array.from(Array.from(bytes.slice(0, 31)).concat(normedLast));
    const modBytes = P.U256LE.encode(mod(P.U256LE.decode(normed)));
    if ((last & 0x80) !== 0) modBytes[31] |= 0x80;
    ed25519.Point.fromHex(modBytes);
    return true;
  } catch (e) {
    return false;
  }
}

export function programAddress(program: string, ...seeds: Bytes[]) {
  let seed = concatBytes(...seeds);
  const noncePos = seed.length;
  seed = concatBytes(
    seed,
    new Uint8Array([0]),
    base58.decode(program),
    utf8.decode('ProgramDerivedAddress')
  );
  for (let i = 255; i >= 0; i--) {
    seed[noncePos] = i;
    const hash = sha256(seed);
    if (isOnCurve(hash)) continue;
    return base58.encode(hash);
  }
  throw new Error('SOL.programAddress: nonce exhausted, cannot find program address');
}

export const ASSOCIATED_TOKEN_PROGRAM = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';

export const associatedToken = defineProgram(ASSOCIATED_TOKEN_PROGRAM, P.constant(0), {
  create: {
    coder: P.struct({}),
    keys: {
      source: { sign: true, write: true },
      account: { sign: false, write: true },
      wallet: { sign: false, write: false },
      mint: { sign: false, write: false },
      _sys: { address: SYS_PROGRAM, sign: false, write: false },
      _token: { address: TOKEN_PROGRAM, sign: false, write: false },
      _rent: { address: SYS_RENT, sign: false, write: false },
    },
    hint: (o: { account: string; wallet: string; mint: string; source: string }, tl: TokenList) =>
      `Initialize associated token account=${o.account} with owner=${
        o.wallet
      } for token=${tokenName(o.mint, tl)}, payed by ${o.source}`,
  },
});

export function tokenAddress(mint: string, owner: string, allowOffCurveOwner = false) {
  if (!allowOffCurveOwner && !isOnCurve(owner)) throw new Error('Owner is off curve (cannot sign)');
  return programAddress(
    ASSOCIATED_TOKEN_PROGRAM,
    ...[owner, TOKEN_PROGRAM, mint].map((i) => base58.decode(i))
  );
}

// https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/solana.tokenlist.json
export const COMMON_TOKENS: TokenList = {
  So11111111111111111111111111111111111111112: { decimals: 9, symbol: 'SOL' }, // Wrapped SOL
  Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: { decimals: 6, symbol: 'USDT', price: 1 },
};

export function tokenFromSymbol(symbol: string, tokens = COMMON_TOKENS) {
  for (let c in tokens) if (tokens[c].symbol === symbol) return { ...tokens[c], contract: c };
}

// [1, 0, 0, 0] -> true
// [0, 0, 0, 0] -> false
const U32LEBOOL = P.padRight(4, P.bool, () => 0);
export const TokenAccount = P.struct({
  mint: pubKey,
  owner: pubKey,
  amount: P.U64LE,
  delegate: P.optional(U32LEBOOL, pubKey, '11111111111111111111111111111111'),
  state: P.map(P.U8, {
    uninitialized: 0,
    initialized: 1,
    frozen: 2,
  }),
  isNative: P.optional(U32LEBOOL, P.U64LE, 0n),
  delegateAmount: P.U64LE,
  closeAuthority: P.optional(U32LEBOOL, pubKey, '11111111111111111111111111111111'),
});

export const swapProgram = 'SwaPpA9LAaLfeLi3a68M4DjnLqgtticKg6CnyNwgAC8';

type TxData = Bytes | string;

export async function verifyTx(tx: TxData) {
  if (typeof tx === 'string') tx = base64.decode(tx);
  if (tx.length > 1280 - 40 - 8) throw new Error('sol: transaction too big');
  const parsed = Transaction.decode(tx);
  const raw = TransactionRaw.decode(tx);
  const msg = Message.encode(TransactionRaw.decode(tx).msg);
  for (let i = 0; i < raw.msg.requiredSignatures; i++) {
    const address = raw.msg.keys[i];
    const pubKey = base58.decode(address);
    const sig = parsed.signatures[address];
    if (!(await ed25519.verify(sig, msg, pubKey)))
      throw new Error(`sol: invalid signature sig=${sig} msg=${msg}`);
  }
}

export async function getAddress(privateKey: Bytes) {
  return base58.encode(await ed25519.getPublicKey(privateKey));
}

export async function formatPrivate(privateKey: Bytes) {
  const publicKey = await ed25519.getPublicKey(privateKey);
  return base58.encode(concatBytes(privateKey, publicKey));
}

export function createTxComplex(address: string, instructions: Instruction[], blockhash: string) {
  if (!instructions.length) throw new Error('SOLPublic: empty instructions array');
  return base64.encode(
    Transaction.encode({
      msg: { feePayer: address, blockhash, instructions },
      signatures: {},
    })
  );
}

export function createTx(from: string, to: string, amount: string, fee: bigint, blockhash: string) {
  const amountNum = parseDecimal(amount, SOL_PRECISION);
  return createTxComplex(
    from,
    [sys.transfer({ source: from, destination: to, lamports: amountNum })],
    blockhash
  );
}

export async function signTx(privateKey: Bytes, data: TxData): Promise<[string, string]> {
  if (typeof data === 'string') data = base64.decode(data);
  const address = await getAddress(privateKey);
  const raw = TransactionRaw.decode(data);
  const reqSignatures = raw.msg.keys.slice(0, raw.msg.requiredSignatures);
  if (!reqSignatures.filter((i) => i == address).length)
    throw new Error(`SOLPrivate: tx doesn't require signature for address=${address}`);
  const sig = await ed25519.sign(Message.encode(raw.msg), privateKey);
  for (let i = 0; i < reqSignatures.length; i++)
    if (reqSignatures[i] === address) raw.signatures[i] = sig;
  // Base58 encoding for tx is deprecated
  const tx = base64.encode(TransactionRaw.encode(raw));
  // first signature is txHash
  return [base58.encode(sig), tx];
}
