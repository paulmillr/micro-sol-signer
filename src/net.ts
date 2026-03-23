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
  /** Rent epoch from RPC. */
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
  return {
    address: keys[item.accountIndex],
    contract: item.mint,
    owner: item.owner,
    amount: BigInt(item.uiTokenAmount.amount),
    decimals: item.uiTokenAmount.decimals,
  };
}

type RawTxInfo = {
  blockTime: number;
  meta: {
    logMessages: string[];
    err: object | null;
    fee: number;
    innerInstructions: [];
    postBalances: number[];
    postTokenBalances: RawTokenBalance[];
    preBalances: number[];
    preTokenBalances: RawTokenBalance[];
    rewards: RawReward[];
    status: { Ok: null }; // Deprecated
  };
  slot: number;
  transaction: Data;
};

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
  if (!Array.isArray(data)) return data; // json
  const [_data, encoding] = data;
  if (encoding === 'base64') return base64.decode(_data);
  if (encoding === 'base58') return base58.decode(_data);
  throw new Error('unsupported encoding');
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
    this.rpc = rpc;
  }
  private async base64Call(method: string, ...params: any[]): Promise<any | undefined> {
    const res = await this.rpc.call(method, ...params, {
      encoding: 'base64',
      commitment: 'confirmed',
    });
    return res.value;
  }
  private async jsonCall(method: string, ...params: any[]): Promise<any | undefined> {
    const res = await this.rpc.call(method, ...params, {
      encoding: 'jsonParsed',
      commitment: 'confirmed',
    });
    return res.value;
  }
  /**
   * Requests airdrop SOL for tests (testnet)
   * @param to - Solana address.
   * @param amount - Lamport amount.
   * @returns RPC airdrop result.
   */
  airdrop(to: string, amount: bigint): Promise<any> {
    return this.base64Call('requestAirdrop', to, Number(amount));
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
    const data = decodeData(res.data);
    return {
      lamports: BigInt(res.lamports),
      owner: res.owner,
      rentEpoch: res.rentEpoch,
      data: data as Uint8Array,
      exec: !!res.executable,
    };
  }
  /**
   * Checks if account is valid token account (required to send tokens)
   * @param mint - Token mint address.
   * @param address - Token-account address to check.
   * @param owner - Optional owner address that must match the token account.
   * @returns `true` when the account matches the expected token-account shape.
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
   * @returns Minimum lamport balance required for rent exemption.
   */
  minBalance(size: number): Promise<any> {
    if (typeof size !== 'number')
      throw new TypeError(`minBalance: expected size number, got ${typeof size}`);
    if (!Number.isSafeInteger(size) || size < 0)
      throw new RangeError(`minBalance: wrong size=${size}`);
    return this.rpc.call('getMinimumBalanceForRentExemption', size);
  }
  /**
   * Recent blockhash and fee information
   */
  recentBlockHash(): Promise<RecentBlockhash> {
    return this.base64Call('getRecentBlockhash');
  }
  async height(): Promise<number> {
    const res = await this.rpc.call('getRecentBlockhash');
    return res.context.slot;
  }
  /**
   * Latest fee (lamports per signature)
   */
  async fee(): Promise<bigint> {
    return BigInt((await this.recentBlockHash()).feeCalculator.lamportsPerSignature);
  }
  async getAddressLookupTable(address: string) {
    const res = await this.accountInfo(address);
    if (!res || res.owner !== 'AddressLookupTab1e1111111111111111111111111')
      throw new Error('wrong contract');
    return AddressTableLookupData(res.data);
  }
  /**
   * Returns account balance and latest blockhash (required to create new transaction)
   * @param address - Solana address.
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
   * @returns Token balances for the owner's token accounts.
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
      const i = t.account.data.parsed.info;
      res.push({
        ...tokensInfo[i.mint],
        contract: i.mint,
        decimals: i.tokenAmount.decimals,
        balance: BigInt(i.tokenAmount.amount),
        tokenAccount: t.pubkey,
      });
    }
    return sortMulti(res, 'contract', 'tokenAccount'); // node returns random order by default
  }
  private async txInfo(signature: string): Promise<TxTransfers> {
    // json and jsonParsed returns parsed instructions data, it is hard to re-build actual raw tx from it
    // base64 doesn't return accountKeys (needed for balances), but we can get it from parsing raw tx
    // NOTE: we support only legacy transactions for now (no versioned).
    const tx: RawTxInfo = await this.rpc.call('getTransaction', signature, {
      encoding: 'base64',
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });
    const rawBytes = decodeData(tx.transaction) as Uint8Array;
    verifyTx(rawBytes);
    const rawTx = TransactionRaw.decode(rawBytes);
    const keys = rawTx.msg.data.keys;
    const transfers = [];
    for (let i = 0; i < keys.length; i++) {
      const address = keys[i];
      const diff = BigInt(tx.meta.postBalances[i] - tx.meta.preBalances[i]);
      if (diff === 0n) continue;
      transfers.push(diff < 0n ? { from: address, value: -diff } : { to: address, value: diff });
    }
    const tokenBalances: Record<string, Omit<ReturnType<typeof mapToken>, 'address'>> = {};
    for (const pre of tx.meta.preTokenBalances) {
      const { address, ...rest } = mapToken(pre, keys);
      tokenBalances[address] = rest;
    }
    for (const post of tx.meta.postTokenBalances) {
      const { address, ...rest } = mapToken(post, keys);
      if (!tokenBalances[address]) tokenBalances[address] = rest;
      else {
        const pre = tokenBalances[address];
        // Should not happen
        if (pre.contract !== rest.contract) throw new Error('txInfo: token contract changed');
        if (pre.owner !== rest.owner) throw new Error('txInfo: token owner changed');
        if (pre.decimals !== rest.decimals) throw new Error('txInfo: token decimals changed');
        pre.amount = rest.amount - pre.amount;
      }
    }
    const tokenTransfers = [];
    for (const tokenAccount in tokenBalances) {
      const { amount, ...rest } = tokenBalances[tokenAccount];
      if (amount === 0n) continue;

      tokenTransfers.push(
        amount < 0n
          ? { from: tokenAccount, value: -amount, ...rest }
          : { to: tokenAccount, value: amount, ...rest }
      );
    }
    return {
      hash: signature,
      timestamp: tx.blockTime * 1000,
      block: tx.slot,
      transfers,
      tokenTransfers,
      reverted: tx.meta.err !== null,
      info: {
        log: tx.meta.logMessages,
        raw: base64.encode(rawBytes),
        fee: BigInt(tx.meta.fee),
      },
    };
  }
  // Only returns transactions for address, but not for owned accounts (tokens)
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
      if (!data.length) break;
      sortMulti(data, 'slot', 'blockTime');
      lastTx = data[0].signature;
      for (const { signature } of data) cb(signature);
    }
  }
  /**
   * Returns all transaction information for address.
   * @param address - Solana address.
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
    await Promise.all([
      pMain,
      ...tokens.map((i) => this.addressTransactions(i.pubkey, fetchTx, perRequest)),
    ]);
    const txs = await Promise.all(Object.values(txPromises));
    sortMulti(txs, 'block', 'hash');
    return txs;
  }
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
/**
 * Calculates balances at specific point in time after tx.
 * Also, useful as a sanity check in case we've missed something.
 * Info from multiple addresses can be merged (sort everything first).
 * @param transfers - Sorted transaction summaries.
 * @returns Transactions annotated with running balances.
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
  const balances: Record<string, bigint> = {};
  const tokenBalances: Record<string, Record<string, bigint>> = {};
  for (const t of transfers) {
    for (const it of t.transfers) {
      if (it.from) {
        if (balances[it.from] === undefined) balances[it.from] = 0n;
        balances[it.from] -= it.value;
      }
      if (it.to) {
        if (balances[it.to] === undefined) balances[it.to] = 0n;
        balances[it.to] += it.value;
      }
    }
    for (const tt of t.tokenTransfers) {
      if (!tokenBalances[tt.contract]) tokenBalances[tt.contract] = {};
      const token = tokenBalances[tt.contract];
      if (tt.from) {
        if (token[tt.from] === undefined) token[tt.from] = 0n;
        token[tt.from] -= tt.value;
      }
      if (tt.to) {
        if (token[tt.to] === undefined) token[tt.to] = 0n;
        token[tt.to] += tt.value;
      }
    }
    Object.assign(t, {
      balances: { ...balances },
      // deep copy
      tokenBalances: Object.fromEntries(
        Object.entries(tokenBalances).map(([k, v]) => [k, { ...v }])
      ),
    });
  }
  return transfers as (TxTransfers & Balances)[];
}
