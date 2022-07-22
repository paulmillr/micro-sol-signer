# micro-sol-signer

Create, sign & decode Solana transactions with minimum deps.

- Tiny: 674 LOC, 3K LOC with all deps bundled
- No network code in main package: allows simpler audits and offline usage
- Can be used for transaction decoding in offline wallet. Solana web node could decode transactions, but can we trust it?

*Check out all web3 utility libraries:* [micro-eth-signer](https://github.com/paulmillr/micro-eth-signer), [micro-sol-signer](https://github.com/paulmillr/micro-sol-signer), [micro-web3](https://github.com/paulmillr/micro-web3), [tx-tor-broadcaster](https://github.com/paulmillr/tx-tor-broadcaster)

## Usage

> npm install micro-sol-signer

```ts
import * as sol from 'micro-sol-signer';
```

Specific features:

- [Create and sign simple transaction](#create-and-sign-simple-transaction)
- [Decode transaction](#decode-transaction)
- [Create complex transactions and send tokens](#create-complex-transactions-and-send-tokens)
- [ABI / API](#abiapi)

### Create and sign simple transaction

```js
// 11111111... private key
const privKey = new Uint8Array(32).fill(0x01);
// Get address of private key
const address = await sol.getAddress(privKey);
// AKnL4NNf3DGWZJS6cPknBuEGnVsV4A4m5tgebLHaRSZ9

// Format private key
const privFormatted = await sol.formatPrivate(privKey);
// 2AXDGYSE4f2sz7tvMMzyHvUfcoJmxudvdhBcmiUSo6iuCXagjUCKEQF21awZnUGxmwD4m9vGXuC3qieHXJQHAcT

// Simple tx (transfer some sol's from one account to another)
const toAddress = 'FDwkzWGxx6LfCfzcmVVLEk3QUMxNhuFuKEMRwzR4Dtys';
const blockhash = 'J2BjKU6L83eehHVgoze6uTXGCBu6nbxsqEro9QvWpU52';
const amount = '10.1';
const fee = '1.2';
const tx0 = sol.createTx(address, toAddress, amount, fee, blockhash);
// AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEDiojj3XQJ8ZX9UtstPLpdcspnCb8dlBIb83SIAbQPb1zTVICVf7+to6zQ/+XautpF+KSSoZ7ESTxv3rg8xPqyXgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/ORj/WtXHGLCh9wC0eGkf26qTFR5x3nCqwXXmoVtZb0BAgIAAQwCAAAAAMUBWgIAAAA=
const [txHash0, signedTx0] = await sol.signTx(privKey, tx0);
/*
{
  txHash0: '3wL4PdgBr3J2r4uuUrf4MU7HhgrJg6re2YRBeAwsZpYZRHgSgUAJymLRu6GcnKk7ZuR3F5UgPRTNj1mbzv966PTy',
  signedTx0: 'AZLiibj05SPRhNU/o3ntK/7+aNQ8H/3HGLdh6zjxZKdyrKJEhjUjWDlMnEF2x0U/8JsKYsMMiYvQShkuNfpYdAwBAAEDiojj3XQJ8ZX9UtstPLpdcspnCb8dlBIb83SIAbQPb1zTVICVf7+to6zQ/+XautpF+KSSoZ7ESTxv3rg8xPqyXgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/ORj/WtXHGLCh9wC0eGkf26qTFR5x3nCqwXXmoVtZb0BAgIAAQwCAAAAAMUBWgIAAAA='
}
  */
```

### Decode transaction

```js
const { base64 } = require('@scure/base');
const sol = require('../lib');

// Random USDT tx from explorer:
// https://explorer.solana.com/tx/5Nnhjv1GVB8T1k8MguUGHQw5zQQQsWET1f1zzj8azRhnVoYQPoZPtkscPCKy6FisP2eVWehjU1EYV8zywqKm5if4
const tx =
  'Atrba9P4rJ4tA3fMXioF+LBR5Y397TCaCC7o/JsViIFxDQ+FOpW2/I+DGMtapWPmrRJ3KDEaYa21YbpUcXaygQPKXDfudpRNZKsMsjhhH018U2YKTAJoqu6Jr1jASfnV98/65boYyPzPujo4YMKnIaCjrt1EsvnPNCuoBMXUEzYAAgEECc20MANIMI92j1eVfOiH5WQ691HznE9ZeQfjeXpDNm0eH5z5eohWokD+6H+jjnZ/KFqkCmlEdPrk6HCx+mOgjTAJUM/3r5vR1DjJnZhT6PQK3Z32pIe8MzDmPxe8Ttzy2CTxiTfFaNQeAkRJCefcB5JJGeb/Qxrj4dpxv8Kv9gClJ544V5wdVgmhBbCFO1kSIv6OaEUizyYdqhTUiO8w8XsGp9UXGSxWjuCKhF9z0peIzwNcMUWyGrNE2AYuqUAAAM4BDmCv7bInF71jGS9UFFo/llozu4LSxwKess4eIIJkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAG3fbh12Whk9nL4UbO63msHLSF7V9bN5E6jPWFfv8AqYUpqsC9KfFD7lsris1C7YZkNRdSH5qix9nMo2igoP0yAgcDAgUBBAQAAAAIBAMGBAAKDJSDxgMPAAAABg==';
const decodedTx = sol.Transaction.decode(base64.decode(tx));

console.log(decodedTx);
/*
{
  msg: {
    feePayer: 'EqywLUZcm73PSWri93X3M5TN62iFMsUPMjvWYUq89dKB',
    blockhash: '9xp5Jz2v7ZsE3Xn5SVGkRisjo7h16vzF1ducwhWnc5n9',
    instructions: [ [Object], [Object] ]
  },
  signatures: {
    EqywLUZcm73PSWri93X3M5TN62iFMsUPMjvWYUq89dKB: Uint8Array(64),
    '38QU8LKVK1Ew5uzsqttamNTTFxvnfzgi2ACQvj3ekuom': Uint8Array(64),
  }
}
*/

console.log(
  decodedTx.msg.instructions.map((i) => {
    return sol.parseInstruction(i, {
      ...sol.COMMON_TOKENS,
      // You can add custom tokens here if needed
    });
  })
);
/*
[
  {
    type: 'advanceNonce',
    info: {
      nonceAccount: 'dN98UQCp6Hq9kedJKEczHt5B53tsC8eENv9cGEVwvuD',
      nonceAuthority: '38QU8LKVK1Ew5uzsqttamNTTFxvnfzgi2ACQvj3ekuom'
    },
    hint: 'Consume nonce in nonce account=dN98UQCp6Hq9kedJKEczHt5B53tsC8eENv9cGEVwvuD (owner: 38QU8LKVK1Ew5uzsqttamNTTFxvnfzgi2ACQvj3ekuom)'
  },
  {
    type: 'transferChecked',
    info: {
      amount: 64487850900n,
      decimals: 6,
      source: '3VDHywae15vgbG2euNPpwoHTEr2eyGLuS6EoF74kDkp4',
      mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
      destination: '3feqC1fmo5YHMh2iw7X9kGE9F8P147hiiDQqC5xtSbpN',
      owner: 'EqywLUZcm73PSWri93X3M5TN62iFMsUPMjvWYUq89dKB'
    },
    hint: 'Transfer 64487.8509 USDT from token account=3VDHywae15vgbG2euNPpwoHTEr2eyGLuS6EoF74kDkp4 of owner=EqywLUZcm73PSWri93X3M5TN62iFMsUPMjvWYUq89dKB to 3feqC1fmo5YHMh2iw7X9kGE9F8P147hiiDQqC5xtSbpN'
  }
]
*/
```

### Create complex transactions and send tokens

Solana is very flexible and has awesome architecture, but it also means there is no
'right' way to send tokens:

- Basic account (ex. EqywLUZcm73PSWri93X3M5TN62iFMsUPMjvWYUq89dKB) cannot have any tokens
- For every token contract you need to create separate token account which will be controlled by token contract
- If a user gives some address to send tokens, it can be:
  - Solana account: which means we need to derive token account address (sol.tokenAddress)
  - Token account: it is possible the token account has not yet been created,
    in this case we can create it for user; but it is not free, and will cost some fee.
  - token account which was derived in a different way from main solana account

The basic token sending example is:

```js
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
```

However, in real world you may need more complex logic, like:

```js
// Check if account is valid token account
function isValidTokenAccount(mint, info, owner) {
  if (!info) return false;
  if (info.owner !== sol.TOKEN_PROGRAM) return false;
  try {
    const data = sol.TokenAccount.decode(info.data);
    if (data.mint !== mint) return false;
    if (data.state !== 'initialized') return false;
    if (owner && data.owner !== owner) return false;
    return true;
  } catch (e) {
    return false;
  }
}

async function solAccountInfo(address) {
  // Network code, outside of scope of this package

  // Call rpc with getAccountInfo
  const res = await rpcCall('getAccountInfo', address, {
    encoding: 'base64',
    commitment: 'confirmed',
  });
  if (res.value === null) return undefined;
  const [data, encoding] = res.value.data;
  if (encoding !== 'base64') throw new Error(`SOL: invalid data encoding=${encoding}`);
  return {
    lamports: BigInt(res.value.lamports),
    owner: res.value.owner,
    rentEpoch: res.value.rentEpoch,
    data: base64.decode(data),
    exec: !!res.value.executable,
  };
}

async function createTx(
  fromAddress, // our address (solana account), from which we will send tokens
  toAddress, // user provided address to send tokens in.
  tokenContract, // token contract address
  decimals, // decimals of contract
  amount, // string with amount of tokens to send
  blockhash // current block hash
) {
  // Derive token account from 'from' address
  const fromTokenAccount = sol.tokenAddress(tokenContract, fromAccount);
  // Common token options
  const tokenOpt = {
    source: fromTokenAccount,
    amount: sol.parseDecimal(amount, decimals),
    decimals,
    mint: tokenContract,
    owner: fromAddress, // owner of source
  };
  // If address is on curve, it is probably not 'associated token contract'
  if (sol.isOnCurve(toAddress)) {
    // Derive token account from solana account
    const toTokenAddress = sol.tokenAddress(tokenContract, toAddress);
    const [addrInfo, assocInfo] = await Promise.all([
      solAccountInfo(toAddress),
      solAccountInfo(toTokenAddress),
    ]);
    // toTokenAddress -- is valid token account, we can send here
    if (isValidTokenAccount(tokenContract, assocInfo, toAddress)) {
      // Associted account is ok, send to toTokenAddress
      return sol.createTxComplex(
        fromAddress,
        [sol.token.transferChecked({ ...tokenOpt, destination: toTokenAddress })],
        blockhash
      );
      // toTokenAddress is not valid token account, but toAddress is (even if it is on-curve)
    } else if (isValidTokenAccount(tokenContract, addrInfo)) {
      // account is actually token account, send to address. But since we don't know
      return sol.createTxComplex(
        fromAddress,
        [sol.token.transferChecked({ ...tokenOpt, destination: toAddress })],
        blockhash
      );
      // There is no valid token accounts, but toAddress is basic solana account and we can create
      // token account for it
    } else if (addrInfo && addrInfo.owner === sol.SYS_PROGRAM) {
      // try to create assoc address and send tokens to it
      return sol.createTxComplex(
        fromAddress,
        [
          sol.associatedToken.create({
            source: fromAddress,
            account: toTokenAddress,
            wallet: toAddress,
            mint: tokenContract,
          }),
          sol.token.transferChecked({ ...tokenOpt, destination: toTokenAddress }),
        ],
        blockhash
      );
    } else {
      // We probably can create associated account here, even if account doesn't exists, but it is probably typo and funds will be lost
      throw new Error(
        `SOL.createTx: invalid token destination address, account=${toAddress} doesn't exists, associated=${assocAddress} doesn't exists`
      );
    }
  } else {
    // Address is off-curve: which means it should be associated token account
    const info = await solAccountInfo(toAddress);
    // We cannot create associated address here, since given address is already off-curve
    if (!isValidTokenAccount(tokenContract, info))
      throw new Error(
        `SOL.createTx: invalid token destination address=${toAddress}, off-curve and invalid`
      );
    // Valid token addr, send to it. Send to address
    return sol.createTxComplex(
      fromAddress,
      [sol.token.transferChecked({ ...tokenOpt, destination: toAddress })],
      blockhash
    );
  }
  throw new Error('SOL.createTx: unexpected case');
}
```

### ABI/API

There is no official ABI for Solana (in comparison with ethereum), but it is actually not big deal,
since you will need to write API on top of raw ABI anyway.
However, we have small DSL here (based on [micro-packed](https://github.com/paulmillr/micro-packed)),
which allows to define ABI easier (look at `sol.token` definition in `index.ts`)

## License

MIT (c) Paul Miller [(https://paulmillr.com)](https://paulmillr.com), see LICENSE file.
