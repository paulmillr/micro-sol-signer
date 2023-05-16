import * as sol from '../index.js';

// Current blockhash
const blockhash = '9xp5Jz2v7ZsE3Xn5SVGkRisjo7h16vzF1ducwhWnc5n9';
// Sol account which is owner of tokenAccount
const fromAccount = 'EqywLUZcm73PSWri93X3M5TN62iFMsUPMjvWYUq89dKB';

const USDT = sol.tokenFromSymbol('USDT', {
  ...sol.COMMON_TOKENS,
  // You can add custom tokens here
});
// Deriving token account address from solana account address
const fromTokenAccount = sol.tokenAddress(USDT.contract, fromAccount);

// Should be valid token account, not solana account
const toTokenAddress = 'FDwkzWGxx6LfCfzcmVVLEk3QUMxNhuFuKEMRwzR4Dtys';

const amount = '64487.8509';
const tokenSimple = sol.createTxComplex(
  fromAccount, // owner of source token account (solana account)
  [
    sol.token.transferChecked({
      source: fromTokenAccount, // Source token account (not solana account)
      amount: sol.parseDecimal(amount, USDT.decimals),
      decimals: USDT.decimals, // decimals of value
      mint: USDT.contract, // token contract address
      owner: fromAccount, // owner of source token account (solana account)
      destination: toTokenAddress,
    }),
  ],
  blockhash
);
console.log(tokenSimple);
/*
AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAIFzbQwA0gwj3aPV5V86IflZDr3UfOcT1l5B+N5ekM2bR4k8Yk3xWjUHgJESQnn3AeSSRnm/0Ma4+Hacb/Cr/YApdNUgJV/v62jrND/5dq62kX4pJKhnsRJPG/euDzE+rJezgEOYK/tsicXvWMZL1QUWj+WWjO7gtLHAp6yzh4ggmQG3fbh12Whk9nL4UbO63msHLSF7V9bN5E6jPWFfv8AqYUpqsC9KfFD7lsris1C7YZkNRdSH5qix9nMo2igoP0yAQQEAQMCAAoMlIPGAw8AAAAG
*/
