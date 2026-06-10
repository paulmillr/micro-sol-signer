import { abool, anumber } from '@noble/curves/utils.js';
import { base58, base64 } from '@scure/base';
import type { TokenInfo } from './hint.ts';
import {
  AddressTableLookupData,
  PRECISION,
  TOKEN_PROGRAM,
  TokenAccount,
  TransactionRaw,
  verifyTx,
} from './index.ts';
import { aarray, astring, validateObject } from './utils.ts';

const _0n = /* @__PURE__ */ BigInt(0);

// These seem official, but trigger rate-limit easily.
// Paid one starts from $500, self-hosted will require 100+ TBs of storage.
/** Default Solana mainnet RPC URL. */
export const URL = 'https://api.mainnet-beta.solana.com';
/** Default Solana devnet RPC URL. */
export const TESTNET_URL = 'https://api.devnet.solana.com';

/** Minimal JSON-RPC transport used by the archive provider. */
export type JsonrpcInterface = {
  /**
   * Performs one JSON-RPC request.
   * @param method - JSON-RPC method name.
   * @param args - Positional JSON-RPC params.
   * @returns Raw JSON-RPC result payload.
   */
  call: (method: string, ...args: any[]) => Promise<any>;
};

/** Basic account data returned from RPC. */
export type AccountInfo = {
  /** Lamport balance of the account. */
  lamports: bigint;
  /** Owning program address. */
  owner: string;
  /** Rent epoch from RPC. Large sentinel epochs may already be rounded by JSON parsing. */
  rentEpoch: number;
  /** Raw account data bytes. */
  data: Uint8Array;
  /** Whether the account is executable. */
  exec: boolean;
};

/** Recent blockhash response with fee information. */
export type RecentBlockhash = {
  /** Recent blockhash string. */
  blockhash: string;
  /** Fee calculator returned by RPC. */
  feeCalculator: { lamportsPerSignature: number };
};

type TokenAccountsOwner = {
  account: {
    data: {
      parsed: {
        info: {
          isNative: boolean;
          mint: string;
          owner: string;
          state: string;
          tokenAmount: {
            amount: string;
            decimals: number;
            uiAmount: number;
            uiAmountString: string;
          };
        };
        type: string;
      };
      program: string;
      space: number;
    };
    executable: boolean;
    lamports: number;
    owner: string;
    rentEpoch: number;
    space: number;
  };
  pubkey: string;
};

type ConfirmedSignature = {
  blockTime: number | null;
  confirmationStatus: string | null; // 'processed' | 'confirmed' | 'finalized' | null
  err: object | null;
  memo: string | null;
  signature: string;
  slot: number;
};

type RawReward = {
  pubkey: string;
  lamports: number;
  postBalance: number;
  rewardType: string;
  comission?: number;
};

type RawTokenBalance = {
  accountIndex: number; // Index of the account in which the token balance is provided for.
  mint: string; // Pubkey of the token's mint.
  owner?: string; // Pubkey of token balance's owner.
  programId?: string; // Pubkey of the Token program that owns the account.
  uiTokenAmount: {
    amount: string; // Raw amount of tokens as a string, ignoring decimals.
    decimals: number; // Number of decimals configured for token's mint.
    uiAmount: number | null; // [DEPRECATED] Token amount as a float, accounting for decimals
    uiAmountString: string; // Token amount as a string, accounting for decimals.
  };
};

function mapToken(item: RawTokenBalance, keys: string[]) {
  if (!item || typeof item !== 'object') throw new Error('txInfo: expected token balance object');
  // RPC token balances point into raw transaction keys; reject malformed metadata first.
  if (
    !Number.isSafeInteger(item.accountIndex) ||
    item.accountIndex < 0 ||
    item.accountIndex >= keys.length
  ) {
    throw new Error('txInfo: token balance accountIndex exceeds account keys');
  }
  if (typeof item.mint !== 'string') throw new Error('txInfo: token mint must be a string');
  if (item.owner !== undefined && typeof item.owner !== 'string')
    throw new Error('txInfo: token owner must be a string');
  const uiTokenAmount = item.uiTokenAmount;
  if (!uiTokenAmount || typeof uiTokenAmount !== 'object')
    throw new Error('txInfo: expected token amount object');
  return {
    address: keys[item.accountIndex],
    contract: item.mint,
    owner: item.owner,
    amount: safeRpcBigint(uiTokenAmount.amount, 'txInfo: token amount'),
    decimals: safeRpcTokenDecimals(uiTokenAmount.decimals, 'txInfo: token decimals'),
  };
}

function safeRpcInteger(value: number, name: string) {
  // These RPC fields are non-negative counters/balances; reject bad signs before bigint conversion.
  if (value < 0) throw new Error(`${name} must be non-negative`);
  // RPC JSON integers above JS's safe range may already be rounded before bigint conversion.
  if (!Number.isSafeInteger(value)) throw new Error(`${name} exceeds safe integer range`);
  return value;
}

function safeRpcBigint(value: string, name: string) {
  // RPC token amounts are decimal strings; BigInt() also accepts empty, signed, and whitespace
  // strings.
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    throw new Error(`${name} must be an unsigned integer string`);
  }
  return BigInt(value);
}

function safeRpcTokenDecimals(value: number, name: string) {
  // SPL token decimals are stored as a u8 mint field; reject malformed parsed-RPC metadata.
  if (!Number.isSafeInteger(value) || value < 0 || value > 255) {
    throw new Error(`${name} must be an unsigned 8-bit integer`);
  }
  return value;
}

function tokenAccountPubkey(item: any, name: string) {
  if (!item || typeof item !== 'object') throw new Error(`${name}: expected token account object`);
  // Parsed token-account entries are later used as addresses, so reject bad pubkeys before RPC
  // calls or public balances.
  if (typeof item.pubkey !== 'string')
    throw new Error(`${name}: token account pubkey must be a string`);
  return item.pubkey;
}

type RawTxInfo = {
  blockTime: number | null;
  meta: {
    logMessages: string[] | null;
    err: object | null;
    fee: number;
    innerInstructions: [];
    postBalances: number[];
    postTokenBalances: RawTokenBalance[] | null;
    preBalances: number[];
    preTokenBalances: RawTokenBalance[] | null;
    rewards: RawReward[];
    status: { Ok: null }; // Deprecated
  };
  slot: number;
  transaction: Data;
};

function rpcValue(res: any, method: string) {
  // These RPC helpers intentionally return result.value; missing wrappers should not fail as raw
  // property reads.
  if (!res || typeof res !== 'object' || !('value' in res))
    throw new Error(`${method}: expected RPC value wrapper`);
  return res.value;
}

/** Token balance info for a wallet-owned token account. */
export type TokenBalance = Partial<TokenInfo> & {
  /** Mint address. */
  contract: string; // This is actual 'mint', but for compat with eth-signer lets call it contract (same thing)
  /** Mint precision in decimal places. */
  decimals: number;
  /** Raw token amount. */
  balance: bigint;
  /** Token-account address holding the balance. */
  tokenAccount: string;
};

/** Native SOL balance state used for new transactions. */
export type Unspent = {
  /** Native symbol. Always `SOL`. */
  symbol: 'SOL';
  /** Native SOL precision. */
  decimals: number;
  /** Current lamport balance. */
  balance: bigint;
  /** Recent blockhash to use for a new transaction. */
  blockhash: string;
  // Useful for wallets to know if there are transactions related to wallet
  // Note: even if nonce is zero, there can be transfers to wallet
  // can be used to check before fetching all transactions
  /** Whether the address has an on-chain account yet. */
  active: boolean;
};

/** One native SOL transfer delta. */
export type Transfer = {
  /** Source address when lamports left an account. */
  from?: string;
  /** Destination address when lamports reached an account. */
  to?: string;
  /** Lamport delta. */
  value: bigint;
};
/** One SPL token transfer delta. */
export type TokenTransfer = Transfer & {
  /** Token-account address that moved the tokens. */
  tokenAccount?: string;
  /** Token mint address. */
  contract: string;
  /** Owner of the token account when known. */
  owner?: string; // owner of token account
  /** Mint precision in decimal places. */
  decimals: number;
};

// The most relevant info about a tx for wallets
/** Wallet-oriented transaction summary. */
export type TxTransfers = {
  /** Transaction signature hash. */
  hash: string;
  /** Block time in UNIX milliseconds. */
  timestamp?: number;
  /** Slot height. */
  block?: number;
  /** Native SOL transfer deltas. */
  transfers: Transfer[];
  /** SPL token transfer deltas. */
  tokenTransfers: TokenTransfer[];
  /** Whether the transaction reverted on chain. */
  reverted: boolean;
  // This contains everything about tx in raw format
  /** Raw transaction bytes, logs, and network fee for deeper debugging. */
  info: {
    /** Raw base64 transaction bytes. */
    raw: string;
    /** Runtime log messages. */
    log: string[];
    /** Network fee in lamports. */
    fee: bigint;
  };
};

// smallest first
function sortMulti<T>(lst: T[], ...keys: (keyof T)[]): T[] {
  // Sort in place; current callers hand over fresh arrays right before normalizing RPC order.
  return lst.sort((a, b) => {
    for (const k of keys) {
      if (a[k] < b[k]) return -1;
      if (a[k] > b[k]) return 1;
    }
    return 0;
  });
}

type Encoding = 'base58' | 'base64' | 'base64+zstd' | 'jsonParsed';
type Data = [string, Encoding] | object;

function decodeData(data: Data) {
  // jsonParsed payloads are already structured objects; tuple payloads are only decoded for
  // base64/base58 because current RPC callers never request base64+zstd.
  if (!Array.isArray(data)) return data; // json
  const [_data, encoding] = data;
  if (encoding === 'base64') return base64.decode(_data);
  if (encoding === 'base58') return base58.decode(_data);
  throw new Error('unsupported encoding');
}
function decodeBytes(data: Data, name: string) {
  const bytes = decodeData(data);
  // These callers requested binary RPC data; parsed objects would violate the public Uint8Array
  // contract.
  if (!(bytes instanceof Uint8Array)) throw new Error(`${name} expected binary data`);
  return bytes;
}
function optionalRpcArray<T>(value: T[] | null | undefined, name: string): T[] {
  // Agave/Solana can emit null for optional transaction metadata arrays when recording is disabled.
  if (value === null || value === undefined) return [];
  if (!Array.isArray(value)) throw new Error(`${name} must be an array`);
  return value;
}

/**
 * High-level Solana RPC wrapper for balances, transfers, and transaction helpers.
 * @param rpc - JSON-RPC transport implementation.
 * @example
 * Wrap the JSON-RPC transport once, then use the helper for higher-level account queries.
 * ```ts
 * import * as mftch from 'micro-ftch';
 * import { ArchiveNodeProvider, URL } from 'micro-sol-signer/net.js';
 * const ftch = mftch.ftch(fetch, { concurrencyLimit: 1 });
 * const archive = new ArchiveNodeProvider(mftch.jsonrpc(ftch, URL, { batchSize: 5 }));
 * await archive.accountInfo('11111111111111111111111111111111');
 * ```
 */
export class ArchiveNodeProvider {
  private rpc: JsonrpcInterface;
  constructor(rpc: JsonrpcInterface) {
    // Keep the caller's transport object by reference so every helper shares the same batching,
    // retry, and caching policy.
    this.rpc = rpc;
  }
  private async base64Call(method: string, ...params: any[]): Promise<any | undefined> {
    const res = await this.rpc.call(method, ...params, {
      encoding: 'base64',
      commitment: 'confirmed',
    });
    // This helper intentionally returns only result.value; callers that need RPC context metadata
    // (for example slot) must use rpc.call directly.
    return rpcValue(res, method);
  }
  private async jsonCall(method: string, ...params: any[]): Promise<any | undefined> {
    const res = await this.rpc.call(method, ...params, {
      encoding: 'jsonParsed',
      commitment: 'confirmed',
    });
    // Request parsed account JSON and return only result.value; callers that need RPC context
    // metadata must use rpc.call directly.
    return rpcValue(res, method);
  }
  /**
   * Requests airdrop SOL for tests (testnet)
   * @param to - Solana address.
   * @param amount - Lamport amount.
   * @returns RPC airdrop result.
   */
  async airdrop(to: string, amount: bigint): Promise<any> {
    // Keep validation failures as promise rejections, matching the other async provider helpers.
    if (typeof to !== 'string')
      throw new TypeError(`airdrop: expected address string, got ${typeof to}`);
    // RPC requests still need JSON numbers; reject bigint values that would round during
    // Number(...).
    if (amount < _0n) throw new Error('airdrop: amount must be non-negative');
    const num = Number(amount);
    if (!Number.isSafeInteger(num) || BigInt(num) !== amount) {
      throw new Error('airdrop: amount exceeds safe integer range');
    }
    return this.base64Call('requestAirdrop', to, num);
  }
  /**
   * Returns all information associated with the account of provided address
   * @param address - Solana address.
   */
  async accountInfo(address: string): Promise<AccountInfo | undefined> {
    if (typeof address !== 'string')
      throw new TypeError(`accountInfo: expected address string, got ${typeof address}`);
    const res = await this.base64Call('getAccountInfo', address);
    if (res === null) return undefined;
    // Null is the only valid missing-account sentinel; other malformed values must not be
    // dereferenced.
    if (!res || typeof res !== 'object' || Array.isArray(res))
      throw new Error('accountInfo: expected account object');
    const data = decodeBytes(res.data, 'accountInfo:');
    // AccountInfo is a public typed object; reject malformed RPC metadata instead of coercing it.
    if (typeof res.owner !== 'string') throw new Error('accountInfo: owner must be a string');
    if (typeof res.rentEpoch !== 'number')
      throw new Error('accountInfo: rentEpoch must be a number');
    if (typeof res.executable !== 'boolean')
      throw new Error('accountInfo: executable must be boolean');
    return {
      // Lamports are wallet/accounting data; reject unsafe JSON numbers before bigint conversion.
      lamports: BigInt(safeRpcInteger(res.lamports, 'accountInfo: lamports')),
      owner: res.owner,
      // Keep rentEpoch as RPC metadata; Solana sentinel epochs can exceed JS's safe range and
      // arrive already rounded.
      rentEpoch: res.rentEpoch,
      data,
      exec: !!res.executable,
    };
  }
  /**
   * Checks if account is valid token account (required to send tokens)
   * @param mint - Token mint address.
   * @param address - Token-account address to check.
   * @param owner - Optional owner address that must match the token account.
   * @returns `true` only for initialized legacy `TOKEN_PROGRAM` accounts in the fixed 165-byte base
   * layout; Token-2022, extension-bearing, or frozen accounts return `false`.
   */
  async isValidTokenAccount(mint: string, address: string, owner?: string): Promise<boolean> {
    const info = await this.accountInfo(address);
    if (!info) return false;
    if (info.owner !== TOKEN_PROGRAM) return false;
    try {
      const dataFull = TokenAccount(info.data);
      if (dataFull.TAG !== 'token') return false;
      const data = dataFull.data;
      if (data.mint !== mint) return false;
      if (data.state.TAG !== 'initialized') return false;
      if (owner !== undefined && data.owner !== owner) return false;
      return true;
    } catch (e) {
      return false;
    }
  }
  /**
   * Returns minimum balance required to make account rent exempt.
   * @param size - Account data length in bytes.
   * @returns Minimum lamport balance required for rent exemption exactly as returned by the
   * JSON-RPC transport; this helper validates `size` but does not normalize the RPC result to
   * `bigint`.
   */
  minBalance(size: number): Promise<any> {
    if (typeof size !== 'number')
      throw new TypeError(`minBalance: expected size number, got ${typeof size}`);
    if (!Number.isSafeInteger(size) || size < 0)
      throw new RangeError(`minBalance: wrong size=${size}`);
    return this.rpc.call('getMinimumBalanceForRentExemption', size);
  }
  private async recentBlockHashInfo(name: string): Promise<RecentBlockhash> {
    const res = await this.base64Call('getRecentBlockhash');
    // This response feeds public transaction construction, so reject malformed metadata before
    // callers consume it.
    if (!res || typeof res !== 'object') throw new Error(`${name}: expected object`);
    if (typeof res.blockhash !== 'string') throw new Error(`${name}: blockhash must be a string`);
    if (!res.feeCalculator || typeof res.feeCalculator !== 'object')
      throw new Error(`${name}: feeCalculator must be an object`);
    if (typeof res.feeCalculator.lamportsPerSignature !== 'number')
      throw new Error(`${name}: lamportsPerSignature must be a number`);
    // This public response exposes fee metadata directly, so apply the same non-negative
    // safe-integer guard as fee().
    safeRpcInteger(res.feeCalculator.lamportsPerSignature, `${name}: lamportsPerSignature`);
    return res;
  }
  /**
   * Recent blockhash and fee information
   * @returns Legacy `getRecentBlockhash` response with `blockhash` and `feeCalculator`; callers
   * that need newer fields such as `lastValidBlockHeight` or RPC context metadata must use
   * `rpc.call(...)` directly.
   */
  async recentBlockHash(): Promise<RecentBlockhash> {
    return this.recentBlockHashInfo('recentBlockHash');
  }
  /**
   * Returns `context.slot` from a raw `getRecentBlockhash` call because `recentBlockHash()`
   * intentionally drops the surrounding RPC metadata; malformed unsafe slot numbers are rejected.
   */
  async height(): Promise<number> {
    const res = await this.rpc.call('getRecentBlockhash');
    // This path consumes raw RPC context metadata rather than result.value; guard it before reading
    // slot.
    if (!res || typeof res !== 'object' || !res.context || typeof res.context !== 'object')
      throw new Error('height: expected context object');
    if (typeof res.context.slot !== 'number') throw new Error('height: slot must be a number');
    return safeRpcInteger(res.context.slot, 'height: slot');
  }
  /**
   * Latest fee (lamports per signature)
   * Converts the legacy `recentBlockHash().feeCalculator.lamportsPerSignature` number into
   * `bigint`; malformed unsafe fee numbers are rejected before conversion.
   */
  async fee(): Promise<bigint> {
    const fee = (await this.recentBlockHashInfo('fee')).feeCalculator.lamportsPerSignature;
    return BigInt(fee);
  }
  /**
   * @returns Decoded lookup-table account data. Missing accounts and non-ALT owners both throw
   * `wrong contract`; callers that need to distinguish the cases must use `accountInfo()` directly.
   */
  async getAddressLookupTable(address: string): Promise<ReturnType<typeof AddressTableLookupData>> {
    const res = await this.accountInfo(address);
    if (!res || res.owner !== 'AddressLookupTab1e1111111111111111111111111')
      throw new Error('wrong contract');
    return AddressTableLookupData(res.data);
  }
  /**
   * Returns account balance and latest blockhash (required to create new transaction)
   * @param address - Solana address.
   * @returns Native SOL balance state for `address`; missing accounts still return `balance: 0n`,
   * `active: false`, and a fresh blockhash so callers can fund or create the account.
   */
  async unspent(address: string): Promise<Unspent> {
    if (typeof address !== 'string')
      throw new TypeError(`unspent: expected address string, got ${typeof address}`);
    const [info, blockHash] = await Promise.all([
      this.accountInfo(address),
      this.recentBlockHash(),
    ]);
    return {
      symbol: 'SOL',
      decimals: PRECISION,
      balance: BigInt(info === undefined ? 0 : info.lamports),
      blockhash: blockHash.blockhash,
      active: info !== undefined,
    };
  }
  /**
   * Returns information about token accounts for address
   * @param address - Solana address.
   * @param tokensInfo - Token metadata keyed by mint address, such as `COMMON_TOKENS`.
   * @returns Legacy SPL Token balances for the owner's token accounts, sorted by mint and
   * token-account address. Token-2022 accounts are not included, and unknown mints keep metadata
   * fields undefined.
   */
  async tokenBalances(
    address: string,
    tokensInfo: Record<string, TokenInfo>
  ): Promise<TokenBalance[]> {
    if (typeof address !== 'string')
      throw new TypeError(`tokenBalance: expected address string, got ${typeof address}`);
    const tokens: TokenAccountsOwner[] = await this.jsonCall('getTokenAccountsByOwner', address, {
      programId: TOKEN_PROGRAM,
    });
    if (!Array.isArray(tokens)) throw new Error('sol.unspent: incorrect tokens value');
    const res: TokenBalance[] = [];
    for (const t of tokens) {
      const pubkey = tokenAccountPubkey(t, 'tokenBalances');
      const account = t.account;
      const data = account && account.data;
      const parsed = data && data.parsed;
      const i = parsed && parsed.info;
      if (!i || typeof i !== 'object')
        throw new Error('tokenBalances: expected parsed token account info');
      if (typeof i.mint !== 'string') throw new Error('tokenBalances: token mint must be a string');
      if (!i.tokenAmount || typeof i.tokenAmount !== 'object')
        throw new Error('tokenBalances: expected token amount object');
      res.push({
        ...tokensInfo[i.mint],
        contract: i.mint,
        decimals: safeRpcTokenDecimals(i.tokenAmount.decimals, 'tokenBalances: token decimals'),
        balance: safeRpcBigint(i.tokenAmount.amount, 'tokenBalances: token amount'),
        tokenAccount: pubkey,
      });
    }
    return sortMulti(res, 'contract', 'tokenAccount'); // node returns random order by default
  }
  /**
   * @returns Transfer view reconstructed from raw transaction bytes plus RPC balance metadata. RPC
   * token-balance `accountIndex` values must resolve against the raw message keys, and lamport
   * balance numbers must fit JS's safe integer range before bigint conversion.
   */
  private async txInfo(signature: string): Promise<TxTransfers> {
    // json and jsonParsed returns parsed instructions data, it is hard to re-build actual raw tx
    // from it
    // base64 doesn't return accountKeys (needed for balances), but we can get it from parsing raw
    // tx
    // NOTE: we support only legacy transactions for now (no versioned).
    const tx: RawTxInfo = await this.rpc.call('getTransaction', signature, {
      encoding: 'base64',
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });
    // Archive providers may return null for pruned or unavailable transactions; fail before
    // dereferencing the RPC result.
    if (!tx || typeof tx !== 'object') throw new Error('txInfo: missing transaction');
    // Some RPC responses can carry raw transaction bytes without balance metadata; this parser
    // needs both.
    if (!tx.meta || typeof tx.meta !== 'object')
      throw new Error('txInfo: missing transaction metadata');
    const rawBytes = decodeBytes(tx.transaction, 'txInfo: transaction');
    verifyTx(rawBytes);
    const rawTx = TransactionRaw.decode(rawBytes);
    const keys = rawTx.msg.data.keys;
    // Slot and fee are accounting metadata too; unsafe JSON numbers may already be rounded.
    const block = safeRpcInteger(tx.slot, 'txInfo: slot');
    const fee = safeRpcInteger(tx.meta.fee, 'txInfo: fee');
    const timestamp =
      // `getTransaction.blockTime` is nullable; keep an absent RPC timestamp absent instead of
      // turning it into UNIX epoch 0.
      tx.blockTime === null
        ? undefined
        : safeRpcInteger(
            safeRpcInteger(tx.blockTime, 'txInfo: blockTime') * 1000,
            'txInfo: timestamp'
          );
    const logMessages = optionalRpcArray(tx.meta.logMessages, 'txInfo: logMessages');
    for (const msg of logMessages) {
      // `info.log` is public `string[]`; malformed RPC arrays must not leak non-string entries.
      if (typeof msg !== 'string') throw new Error('txInfo: logMessages item must be a string');
    }
    // Missing status metadata would otherwise be misreported as a reverted transaction.
    if (tx.meta.err === undefined) throw new Error('txInfo: transaction error status missing');
    const reverted = tx.meta.err !== null;
    const preTokenBalances = optionalRpcArray(tx.meta.preTokenBalances, 'txInfo: preTokenBalances');
    const postTokenBalances = optionalRpcArray(
      tx.meta.postTokenBalances,
      'txInfo: postTokenBalances'
    );
    // Balance metadata is account-key indexed; extra entries would be silently dropped by the
    // transfer diff loop.
    if (!Array.isArray(tx.meta.postBalances) || tx.meta.postBalances.length !== keys.length)
      throw new Error('txInfo: postBalances length does not match account keys');
    if (!Array.isArray(tx.meta.preBalances) || tx.meta.preBalances.length !== keys.length)
      throw new Error('txInfo: preBalances length does not match account keys');
    const transfers = [];
    for (let i = 0; i < keys.length; i++) {
      const address = keys[i];
      const post = safeRpcInteger(tx.meta.postBalances[i], 'txInfo: post balance');
      const pre = safeRpcInteger(tx.meta.preBalances[i], 'txInfo: pre balance');
      const diff = BigInt(post) - BigInt(pre);
      if (diff === _0n) continue;
      transfers.push(diff < _0n ? { from: address, value: -diff } : { to: address, value: diff });
    }
    const tokenBalances: Record<string, Omit<ReturnType<typeof mapToken>, 'address'>> = {};
    const seenTokenIndex = (seen: Set<number>, item: RawTokenBalance, name: string) => {
      // Each RPC token-balance snapshot is keyed by transaction accountIndex; duplicates would
      // overwrite or double-count deltas.
      if (seen.has(item.accountIndex)) throw new Error(`txInfo: duplicate ${name} accountIndex`);
      seen.add(item.accountIndex);
    };
    const preTokenIndexes = new Set<number>();
    for (const pre of preTokenBalances) {
      const { address, ...rest } = mapToken(pre, keys);
      seenTokenIndex(preTokenIndexes, pre, 'preTokenBalances');
      // Token deltas are post - pre; pre-only balances are debits when token accounts disappear.
      tokenBalances[address] = { ...rest, amount: -rest.amount };
    }
    const postTokenIndexes = new Set<number>();
    for (const post of postTokenBalances) {
      const { address, ...rest } = mapToken(post, keys);
      seenTokenIndex(postTokenIndexes, post, 'postTokenBalances');
      if (!tokenBalances[address]) tokenBalances[address] = rest;
      else {
        const pre = tokenBalances[address];
        // Should not happen
        if (pre.contract !== rest.contract) throw new Error('txInfo: token contract changed');
        if (pre.owner !== rest.owner) throw new Error('txInfo: token owner changed');
        if (pre.decimals !== rest.decimals) throw new Error('txInfo: token decimals changed');
        pre.amount += rest.amount;
      }
    }
    const tokenTransfers = [];
    for (const tokenAccount in tokenBalances) {
      const { amount, ...rest } = tokenBalances[tokenAccount];
      if (amount === _0n) continue;

      tokenTransfers.push(
        amount < _0n
          ? { from: tokenAccount, value: -amount, ...rest }
          : { to: tokenAccount, value: amount, ...rest }
      );
    }
    return {
      hash: signature,
      ...(timestamp === undefined ? {} : { timestamp }),
      block,
      transfers,
      tokenTransfers,
      reverted,
      info: {
        log: logMessages,
        raw: base64.encode(rawBytes),
        fee: BigInt(fee),
      },
    };
  }
  // Only returns transactions for address, but not for owned accounts (tokens)
  /**
   * Pages `getSignaturesForAddress` by advancing `before` with the oldest signature from each
   * fetched batch. Callbacks therefore observe signatures sorted within each batch, but not
   * necessarily in one global chronological order across multiple pages.
   */
  private async addressTransactions(
    address: string,
    cb: (signature: string) => void,
    perRequest = 1000
  ) {
    let lastTx: string | undefined = undefined;
    for (;;) {
      const data: ConfirmedSignature[] = await this.rpc.call('getSignaturesForAddress', address, {
        encoding: 'jsonParsed',
        commitment: 'confirmed',
        limit: perRequest,
        before: lastTx,
      });
      // A malformed list must not look like a clean pagination terminator.
      if (!Array.isArray(data)) throw new Error('addressTransactions: incorrect signatures value');
      if (!data.length) break;
      for (const item of data) {
        // Missing signatures leave before=undefined, which can make pagination repeat forever.
        if (!item || typeof item.signature !== 'string')
          throw new Error('addressTransactions: expected signature string');
      }
      sortMulti(data, 'slot', 'blockTime');
      lastTx = data[0].signature;
      for (const { signature } of data) cb(signature);
    }
  }
  /**
   * Returns all transaction information for address.
   * @param address - Solana address.
   * @returns Transfer summaries for `address` plus any legacy SPL Token accounts returned by
   * `getTokenAccountsByOwner`. Duplicate signatures are fetched once and the final array is
   * sorted by `block`/`hash`; transaction parsing still inherits `txInfo()`'s RPC-metadata
   * validation and numeric limits.
   */
  async transfers(address: string, perRequest = 1000): Promise<TxTransfers[]> {
    if (typeof address !== 'string')
      throw new TypeError(`transfers: expected address string, got ${typeof address}`);
    if (typeof perRequest !== 'number')
      throw new TypeError(`transfers: expected perRequest number, got ${typeof perRequest}`);
    if (!Number.isSafeInteger(perRequest) || perRequest <= 0)
      throw new RangeError(`transfers: wrong perRequest ${perRequest}, expected positive integer`);
    const txPromises: Record<string, Promise<TxTransfers>> = {};
    const fetchTx = (signature: string) => {
      if (signature in txPromises) return;
      txPromises[signature] = this.txInfo(signature);
    };
    const pMain = this.addressTransactions(address, fetchTx, perRequest);
    const tokens: TokenAccountsOwner[] = await this.jsonCall('getTokenAccountsByOwner', address, {
      programId: TOKEN_PROGRAM,
    });
    if (!Array.isArray(tokens)) {
      await pMain;
      throw new Error('transfers: incorrect tokens value');
    }
    const tokenAddresses = [];
    for (const token of tokens) {
      try {
        tokenAddresses.push(tokenAccountPubkey(token, 'transfers'));
      } catch (e) {
        await pMain;
        throw e;
      }
    }
    await Promise.all([
      pMain,
      ...tokenAddresses.map((token) => this.addressTransactions(token, fetchTx, perRequest)),
    ]);
    const txs = await Promise.all(Object.values(txPromises));
    sortMulti(txs, 'block', 'hash');
    return txs;
  }
  /**
   * Broadcasts an already-base64-encoded transaction string.
   * @param tx - Base64 transaction bytes, usually from `createTx()` or `signTx()`.
   * @returns Raw `sendTransaction` result from the transport. The helper forwards `tx`
   * unchanged with `encoding: 'base64'` and does not run local preflight or runtime validation.
   */
  async sendTx(tx: string): Promise<any> {
    return await this.rpc.call('sendTransaction', tx, { encoding: 'base64' });
  }
}

/** Running balance snapshots derived from transfers. */
export type Balances = {
  /** Native SOL balances keyed by address. */
  balances: Record<string, bigint>;
  /** Token balances keyed by mint and then address. */
  tokenBalances: Record<string, Record<string, bigint>>;
};
const abigint = (value: unknown, title: string): bigint => {
  if (typeof value !== 'bigint')
    throw new TypeError(`"${title}" expected bigint, got type=${typeof value}`);
  return value;
};

const checkTransfer = (it: Transfer, title: string): void => {
  validateObject(it as Record<string, any>, {}, {}, title);
  if (it.from !== undefined) astring(it.from, title + '.from');
  if (it.to !== undefined) astring(it.to, title + '.to');
  abigint(it.value, title + '.value');
};
const checkTokenTransfer = (it: TokenTransfer, title: string): void => {
  checkTransfer(it, title);
  astring(it.contract, title + '.contract');
  if (it.tokenAccount !== undefined) astring(it.tokenAccount, title + '.tokenAccount');
  if (it.owner !== undefined) astring(it.owner, title + '.owner');
  anumber(it.decimals, title + '.decimals');
};
const checkTxTransfers = (tx: TxTransfers, title: string): void => {
  validateObject(tx as Record<string, any>, {}, {}, title);
  astring(tx.hash, title + '.hash');
  aarray(tx.transfers, title + '.transfers', checkTransfer);
  aarray(tx.tokenTransfers, title + '.tokenTransfers', checkTokenTransfer);
  abool(tx.reverted, title + '.reverted');
  validateObject(tx.info as Record<string, any>, {}, {}, title + '.info');
  astring(tx.info.raw, title + '.info.raw');
  aarray(tx.info.log, title + '.info.log', (log, logTitle) => astring(log, logTitle));
  abigint(tx.info.fee, title + '.info.fee');
};
/**
 * Calculates balances at specific point in time after tx.
 * Also, useful as a sanity check in case we've missed something.
 * Info from multiple addresses can be merged (sort everything first).
 * @param transfers - Sorted transaction summaries.
 * @returns New transaction objects annotated with running balances. The helper leaves the
 * caller's transaction entries unchanged.
 * @example
 * Fold sorted transfers into running native and token balances.
 * ```ts
 * import { calcTransfersDiff } from 'micro-sol-signer/net.js';
 * const [tx] = calcTransfersDiff([
 *   {
 *     hash: 'tx',
 *     transfers: [{ to: 'alice', value: 2n }],
 *     tokenTransfers: [],
 *     reverted: false,
 *     info: { raw: '', log: [], fee: 0n },
 *   },
 * ]);
 * ```
 */
export function calcTransfersDiff(transfers: TxTransfers[]): (TxTransfers & Balances)[] {
  transfers = aarray(transfers, 'transfers', checkTxTransfers);
  const balances: Record<string, bigint> = {};
  const tokenBalances: Record<string, Record<string, bigint>> = {};
  const res: (TxTransfers & Balances)[] = [];
  for (const t of transfers) {
    for (const it of t.transfers) {
      if (it.from) {
        if (balances[it.from] === undefined) balances[it.from] = _0n;
        balances[it.from] -= it.value;
      }
      if (it.to) {
        if (balances[it.to] === undefined) balances[it.to] = _0n;
        balances[it.to] += it.value;
      }
    }
    for (const tt of t.tokenTransfers) {
      if (!tokenBalances[tt.contract]) tokenBalances[tt.contract] = {};
      const token = tokenBalances[tt.contract];
      if (tt.from) {
        if (token[tt.from] === undefined) token[tt.from] = _0n;
        token[tt.from] -= tt.value;
      }
      if (tt.to) {
        if (token[tt.to] === undefined) token[tt.to] = _0n;
        token[tt.to] += tt.value;
      }
    }
    // Keep caller transactions immutable; only the derived snapshot annotations are new.
    res.push({
      ...t,
      // Returned annotations should not expose nested caller-owned arrays for later mutation.
      transfers: t.transfers.map((transfer) => ({ ...transfer })),
      tokenTransfers: t.tokenTransfers.map((transfer) => ({ ...transfer })),
      info: { ...t.info, log: t.info.log.slice() },
      balances: { ...balances },
      // deep copy
      tokenBalances: Object.fromEntries(
        Object.entries(tokenBalances).map(([k, v]) => [k, { ...v }])
      ),
    });
  }
  return res;
}
