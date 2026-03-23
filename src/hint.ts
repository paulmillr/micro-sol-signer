import { ASSOCIATED_TOKEN_PROGRAM, Decimal, parseInstruction, SYS_PROGRAM } from './index.ts';
import type { Instruction } from './index.ts';

/** Token metadata used for human-readable instruction hints. */
export type TokenInfo = {
  /** Short ticker symbol such as `SOL` or `USDC`. */
  symbol: string;
  /** Token mint precision in decimal places. */
  decimals: number;
  /** Optional spot price used for fiat-style display hints. */
  price?: number;
};
/** Mapping from token mint address to token metadata. */
export type TokenList = Record<string, TokenInfo>;
const tokenName = (address: string, tl: TokenList) => tl[address]?.symbol || address;
const hints: Record<
  string,
  Record<string, (o: any, tl: TokenList) => string>
> = /* @__PURE__ */ (() => ({
  [SYS_PROGRAM]: {
    createAccount: (o: {
      payer: string;
      newAccount: string;
      lamports: bigint;
      space: bigint;
      programAddress: string;
    }) =>
      `Create new account=${o.newAccount} with balance of ${Decimal.encode(o.lamports)} and owner program ${
        o.programAddress
      }, using funding account ${o.payer}`,
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
}))();

/**
 * Produces a short human-readable description for a known instruction.
 * @param instruction - Parsed Solana instruction input.
 * @param tl - Optional token metadata used to resolve mint symbols.
 * @returns Hint string for recognized instructions, or `undefined`.
 * @example
 * Turn a decoded instruction into wallet-friendly text.
 * ```ts
 * import { sys } from 'micro-sol-signer';
 * import { hintInstruction } from 'micro-sol-signer/hint.js';
 * const hint = hintInstruction(
 *   sys.transferSol({
 *     source: '11111111111111111111111111111111',
 *     destination: 'FDwkzWGxx6LfCfzcmVVLEk3QUMxNhuFuKEMRwzR4Dtys',
 *     amount: 1n,
 *   })
 * );
 * ```
 */
export function hintInstruction(instruction: Instruction, tl: TokenList = {}) {
  const raw = parseInstruction(instruction) as any;
  const hint =
    hints[instruction.program] &&
    hints[instruction.program][raw.TAG] &&
    hints[instruction.program][raw.TAG](raw.data, tl);
  if (hint) return hint;
  return undefined;
}

// https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/solana.tokenlist.json
/** Small built-in token list for common Solana assets. */
export const COMMON_TOKENS: TokenList = {
  So11111111111111111111111111111111111111112: { decimals: 9, symbol: 'SOL' }, // Wrapped SOL
  Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: { decimals: 6, symbol: 'USDT', price: 1 },
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: { decimals: 6, symbol: 'USDC', price: 1 },
  '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo': { decimals: 6, symbol: 'PYUSD', price: 1 }, // PayPal USD
};

/**
 * Resolves a token symbol into token metadata and mint address.
 * @param symbol - Token symbol to look up.
 * @param tokens - Token list to search.
 * @returns Matching token info with `contract`, or `undefined`.
 * @example
 * Resolve a ticker symbol into the mint address and decimals used by transaction builders.
 * ```ts
 * import { tokenFromSymbol } from 'micro-sol-signer/hint.js';
 * tokenFromSymbol('USDC')?.contract;
 * ```
 */
export function tokenFromSymbol(symbol: string, tokens = COMMON_TOKENS) {
  for (let c in tokens) if (tokens[c].symbol === symbol) return { ...tokens[c], contract: c };
  return;
}
