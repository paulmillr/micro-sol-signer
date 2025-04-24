import * as sol from './index.ts';

export type TokenInfo = {
  symbol: string;
  decimals: number;
  price?: number;
};
export type TokenList = Record<string, TokenInfo>;
const tokenName = (address: string, tl: TokenList) => tl[address]?.symbol || address;
const hints: Record<string, Record<string, (o: any, tl: TokenList) => string>> = {
  [sol.SYS_PROGRAM]: {
    createAccount: (o: {
      payer: string;
      newAccount: string;
      lamports: bigint;
      space: bigint;
      programAddress: string;
    }) =>
      `Create new account=${o.newAccount} with balance of ${sol.Decimal.encode(
        o.lamports
      )} and owner program ${o.programAddress}, using funding account ${o.payer}`,
    assign: (o: { account: string; programAddress: string }) =>
      `Assign account=${o.account} to owner program=${o.programAddress}`,
    transferSol: (o: { amount: bigint; source: string; destination: string }) =>
      `Transfer ${sol.Decimal.encode(o.amount)} SOL from ${o.source} to ${o.destination}`,
    advanceNonceAccount: (o: { nonceAccount: string; nonceAuthority: string }) =>
      `Consume nonce in nonce account=${o.nonceAccount} (owner: ${o.nonceAuthority})`,
    withdrawNonceAccount: (o: {
      withdrawAmount: bigint;
      recipientAccount: string;
      nonceAccount: string;
      nonceAuthority: string;
    }) =>
      `Withdraw ${sol.Decimal.encode(o.withdrawAmount)} SOL from nonce account=${o.nonceAccount} (owner: ${
        o.nonceAuthority
      }) to ${o.recipientAccount}`,
    authorizeNonceAccount: (o: {
      nonceAccount: string;
      nonceAuthority: string;
      newNonceAuthority: string;
    }) =>
      `Change owner of nonce account=${o.nonceAccount} from ${o.nonceAuthority} to ${o.newNonceAuthority}`,
  },
  [sol.ASSOCIATED_TOKEN_PROGRAM]: {
    createAssociatedToken: (
      o: { ata: string; owner: string; mint: string; payer: string },
      tl: TokenList
    ) =>
      `Initialize associated token account=${o.ata} with owner=${
        o.owner
      } for token=${tokenName(o.mint, tl)}, payed by ${o.payer}`,
  },
};

export function hintInstruction(instruction: sol.Instruction, tl: TokenList = {}) {
  const raw = sol.parseInstruction(instruction) as any;
  const hint =
    hints[instruction.program] &&
    hints[instruction.program][raw.TAG] &&
    hints[instruction.program][raw.TAG](raw.data, tl);
  if (hint) return hint;
  return undefined;
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
