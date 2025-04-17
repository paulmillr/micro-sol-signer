import { base58, base64 } from '@scure/base';
import * as sol from './index.js';
import type { TokenInfo } from './hint.js';

// These seem official, but trigger rate-limit easily.
// Paid one starts from $500, self-hosted will require 100+ TBs of storage.
export const URL = 'https://api.mainnet-beta.solana.com';
export const TESTNET_URL = 'https://api.devnet.solana.com';

export type JsonrpcInterface = {
  call: (method: string, ...args: any[]) => Promise<any>;
};

export type AccountInfo = {
  lamports: bigint;
  owner: string;
  rentEpoch: number;
  data: Uint8Array;
  exec: boolean;
};

export type RecentBlockhash = {
  blockhash: string;
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

export type TokenBalance = Partial<TokenInfo> & {
  contract: string; // This is actual 'mint', but for compat with eth-signer lets call it contract (same thing)
  decimals: number;
  balance: bigint;
  tokenAccount: string;
};

export type Unspent = {
  symbol: 'SOL';
  decimals: number;
  balance: bigint;
  blockhash: string;
  // Useful for wallets to know if there are transactions related to wallet
  // Note: even if nonce is zero, there can be transfers to wallet
  // can be used to check before fetching all transactions
  active: boolean;
};

export type Transfer = { from?: string; to?: string; value: bigint };
export type TokenTransfer = Transfer & {
  tokenAccount?: string;
  contract: string;
  owner?: string; // owner of token account
  decimals: number;
};

// The most relevant info about a tx for wallets
export type TxTransfers = {
  hash: string; // this called 'signature' internally
  timestamp?: number;
  block?: number;
  transfers: Transfer[];
  tokenTransfers: TokenTransfer[];
  reverted: boolean;
  // This contains everything about tx in raw format
  info: {
    raw: string;
    log: string[];
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
   * @param to - Solana address
   * @param amount - Lamports amount
   * @returns
   */
  airdrop(to: string, amount: bigint): Promise<any> {
    return this.base64Call('requestAirdrop', to, Number(amount));
  }
  /**
   * Returns all information associated with the account of provided address
   * @param address
   */
  async accountInfo(address: string): Promise<AccountInfo | undefined> {
    if (typeof address !== 'string') throw new Error(`accountInfo: wrong address=${address}`);
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
   * @param mint token contract
   * @param address address to check
   * @param owner check if owner of token account is specific address
   * @returns true if valid
   */
  async isValidTokenAccount(mint: string, address: string, owner?: string): Promise<boolean> {
    const info = await this.accountInfo(address);
    if (!info) return false;
    if (info.owner !== sol.TOKEN_PROGRAM) return false;
    try {
      const dataFull = sol.TokenAccount(info.data);
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
   * @param size - Account data length (bytes)
   * @returns
   */
  minBalance(size: number): Promise<any> {
    if (!Number.isSafeInteger(size)) throw new Error(`minBalance: wrong size=${size}`);
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
    return sol.AddressTableLookupData(res.data);
  }
  /**
   * Returns account balance and latest blockhash (required to create new transaction)
   * @param address - Solana address
   */
  async unspent(address: string): Promise<Unspent> {
    if (typeof address !== 'string') throw new Error(`unspent: wrong address=${address}`);
    const [info, blockHash] = await Promise.all([
      this.accountInfo(address),
      this.recentBlockHash(),
    ]);
    return {
      symbol: 'SOL',
      decimals: sol.PRECISION,
      balance: BigInt(info === undefined ? 0 : info.lamports),
      blockhash: blockHash.blockhash,
      active: info !== undefined,
    };
  }
  /**
   * Returns information about token accounts for address
   * @param address - Solana address
   * @param tokensInfo - Tokens information (sol.COMMON_TOKENS), Record<mintAddress, TokenInfo>
   * @returns
   */
  async tokenBalances(
    address: string,
    tokensInfo: Record<string, TokenInfo>
  ): Promise<TokenBalance[]> {
    if (typeof address !== 'string') throw new Error(`tokenBalance: wrong address=${address}`);
    const tokens: TokenAccountsOwner[] = await this.jsonCall('getTokenAccountsByOwner', address, {
      programId: sol.TOKEN_PROGRAM,
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
    sol.verifyTx(rawBytes);
    const rawTx = sol.TransactionRaw.decode(rawBytes);
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
   * @param address - Solana address
   */
  async transfers(address: string, perRequest = 1000): Promise<TxTransfers[]> {
    if (typeof address !== 'string') throw new Error(`transfers: wrong address=${address}`);
    if (!Number.isSafeInteger(perRequest))
      throw new Error(`transfers: wrong perRequest ${perRequest}, expected integer`);
    const txPromises: Record<string, Promise<TxTransfers>> = {};
    const fetchTx = (signature: string) => {
      if (signature in txPromises) return;
      txPromises[signature] = this.txInfo(signature);
    };
    const pMain = this.addressTransactions(address, fetchTx, perRequest);
    const tokens: TokenAccountsOwner[] = await this.jsonCall('getTokenAccountsByOwner', address, {
      programId: sol.TOKEN_PROGRAM,
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

export type Balances = {
  balances: Record<string, bigint>;
  tokenBalances: Record<string, Record<string, bigint>>;
};
/**
 * Calculates balances at specific point in time after tx.
 * Also, useful as a sanity check in case we've missed something.
 * Info from multiple addresses can be merged (sort everything first).
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
