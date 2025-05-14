import * as mftch from 'micro-ftch';
import { describe, should } from 'micro-should';
import { deepStrictEqual } from 'node:assert';
import { COMMON_TOKENS } from '../lib/esm/hint.js';
import { ArchiveNodeProvider, calcTransfersDiff, URL } from '../lib/esm/net.js';
import { default as NET_BASIC } from './vectors/net_basic.mjs';
import { default as NET_TOKEN_VALID } from './vectors/net_token_valid.mjs';
import { default as NET_TRANSFERS } from './vectors/net_transfers.mjs';

const getKey = (url, opt) => JSON.stringify({ url: 'https://NODE_URL/', opt });

describe('Net', () => {
  should('Basic', async () => {
    const addr = 'EqywLUZcm73PSWri93X3M5TN62iFMsUPMjvWYUq89dKB'; // some account from tests
    const addr2 = '6y6nyKZKU3kuhSHdGT9YQ63DSj2tWoqKB8xui2cofqqj'; // non existent account
    const replay = mftch.replayable(fetch, NET_BASIC, { getKey, offline: true });
    const ftch = mftch.ftch(replay, { concurrencyLimit: 1 });
    const archive = new ArchiveNodeProvider(mftch.jsonrpc(ftch, URL, { batchSize: 5 }));
    deepStrictEqual(await archive.accountInfo(addr), {
      lamports: 1090000n,
      owner: '11111111111111111111111111111111',
      rentEpoch: 18446744073709552000,
      data: Uint8Array.of(),
      exec: false,
    });
    deepStrictEqual(await archive.accountInfo(addr2), undefined);
    deepStrictEqual(await archive.minBalance(1000), 7850880);
    deepStrictEqual(await archive.height(), 271227303);
    deepStrictEqual(await archive.recentBlockHash(), {
      blockhash: 'BHxoqtTZqnQdpLXyZu9SGpBMKPcaoipVX9NYQfJXuXKf',
      feeCalculator: {
        lamportsPerSignature: 5000,
      },
    });
    deepStrictEqual(await archive.fee(), 5000n);
    // Unspent
    deepStrictEqual(await archive.unspent(addr2), {
      active: false,
      balance: 0n,
      blockhash: 'ByXexSo4s9qMX5yPUzXrfdVZs4FxQ7RrdBAgtMbfwqaq',
      decimals: 9,
      symbol: 'SOL',
    });
    deepStrictEqual(await archive.unspent(addr), {
      symbol: 'SOL',
      decimals: 9,
      balance: 1090000n,
      blockhash: '2S4rrrQjjp1KApWNn5wrekmut1EQXGkDApWarjtiGZxf',
      active: true,
    });
    deepStrictEqual(await archive.tokenBalances(addr, COMMON_TOKENS), [
      {
        contract: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        symbol: 'USDC',
        price: 1,
        decimals: 6,
        balance: 0n,
        tokenAccount: 'HE3htr6RNwRfdW7nSbg4vHj2uyMvyyZrdNTB9muUn1on',
      },
      {
        decimals: 6,
        symbol: 'USDT',
        price: 1,
        contract: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
        balance: 0n,
        tokenAccount: '3VDHywae15vgbG2euNPpwoHTEr2eyGLuS6EoF74kDkp4',
      },
    ]);
  });
  should('Transfers', async () => {
    const addr = 'EqywLUZcm73PSWri93X3M5TN62iFMsUPMjvWYUq89dKB'; // some account from tests
    const replay = mftch.replayable(fetch, NET_TRANSFERS, { getKey, offline: true });
    const ftch = mftch.ftch(replay, { concurrencyLimit: 1 });
    const archive = new ArchiveNodeProvider(
      mftch.jsonrpc(ftch, URL, {
        batchSize: 20,
      })
    );
    const res = await archive.transfers(addr, 20);
    const diff = calcTransfersDiff(res);
    const diffLast = diff[diff.length - 1];
    // 0.00109
    //     1090000n
    deepStrictEqual(diffLast.balances[addr], 1090000n);
    // USDT
    deepStrictEqual(
      diffLast.tokenBalances['Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'][
        '3VDHywae15vgbG2euNPpwoHTEr2eyGLuS6EoF74kDkp4'
      ],
      0n
    );
    // USDC
    deepStrictEqual(
      diffLast.tokenBalances['EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'][
        'HE3htr6RNwRfdW7nSbg4vHj2uyMvyyZrdNTB9muUn1on'
      ],
      0n
    );
    deepStrictEqual(diffLast, {
      hash: '36BXkxUfaaShbH8noAiLNvTZvzbdhuwr2xhvJoNMPY33TthZunEWUmxDfZf6mR6CbfvmMXqLMUTLZ7aKyp1sfFrk',
      timestamp: 1715590756000,
      block: 265505420,
      transfers: [
        {
          from: 'EqywLUZcm73PSWri93X3M5TN62iFMsUPMjvWYUq89dKB',
          value: 17140000n,
        },
        {
          to: 'BY4StcU9Y2BpgH8quZzorg31EGE4L1rjomN8FNsCBEcx',
          value: 17130000n,
        },
      ],
      tokenTransfers: [],
      reverted: false,
      info: {
        log: [
          'Program 11111111111111111111111111111111 invoke [1]',
          'Program 11111111111111111111111111111111 success',
          'Program 11111111111111111111111111111111 invoke [1]',
          'Program 11111111111111111111111111111111 success',
        ],
        raw: 'AmiAm6Oye8PPwy40NHdgCpFaYYUfmt9KwspqRo4XYrpy+TCcWj+0CMEdZ1PRNdMBH9WI+yPLcc5ScQlB22mmGA1yjBUfBd2eulCn2w/avpmFthY4MEEGD8syZ8bdmUyhUA37mF/bxKnDkwaMU62k+Qzy4lEiSKXmXPtlIrxfuDwHAgECBs20MANIMI92j1eVfOiH5WQ691HznE9ZeQfjeXpDNm0eH5z5eohWokD+6H+jjnZ/KFqkCmlEdPrk6HCx+mOgjTBLTsXiBXDQyjJK004siicCXQ50wWoVT9tVGJzzwn1wz5yJxWvCFRtg/cMp7PQROE8hbLdEjBemor+xMvx682C5BqfVFxksVo7gioRfc9KXiM8DXDFFshqzRNgGLqlAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALLz1iokTljleFx8B+Da31L93iSuXbBoGxEYKZAWDnLnAgUDAgQBBAQAAAAFAgADDAIAAAAQYgUBAAAAAA==',
        fee: 10000n,
      },
      balances: {
        '3jBvAWQjLAGedNb2PR4WE8TJG5FuMojPqKPZKGLNaZ3z': -4468560n,
        '3VDHywae15vgbG2euNPpwoHTEr2eyGLuS6EoF74kDkp4': 2039280n,
        '38QU8LKVK1Ew5uzsqttamNTTFxvnfzgi2ACQvj3ekuom': -19010000n,
        EqywLUZcm73PSWri93X3M5TN62iFMsUPMjvWYUq89dKB: 1090000n,
        HE3htr6RNwRfdW7nSbg4vHj2uyMvyyZrdNTB9muUn1on: 2039280n,
        DbF7cjsq6aBifX9ogr2JMAqfbHVhXvNJSzm7nXc3SMq1: -5000n,
        BY4StcU9Y2BpgH8quZzorg31EGE4L1rjomN8FNsCBEcx: 17130000n,
      },
      tokenBalances: {
        Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: {
          '5S5wMh5YaudPu3jgep1JFSdxipoKN7xjKwQw6WQ9deDR': -6471217225878n,
          '3VDHywae15vgbG2euNPpwoHTEr2eyGLuS6EoF74kDkp4': 0n,
          '3feqC1fmo5YHMh2iw7X9kGE9F8P147hiiDQqC5xtSbpN': 6471217225878n,
        },
        EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: {
          '2kvY2Tr8JuPmrviqQeoLpXhVv8nRvKNp4FMZnkyrJpnM': -758056007642n,
          HE3htr6RNwRfdW7nSbg4vHj2uyMvyyZrdNTB9muUn1on: 0n,
          DJHWHYozFSgoCvET6SoTfdhh1YQQeuBbgT5JkdXVWTgL: 758056007642n,
        },
      },
    });
  });
  should('isValidTokenAccount', async () => {
    const addr = 'EqywLUZcm73PSWri93X3M5TN62iFMsUPMjvWYUq89dKB'; // some account from tests
    const addr2 = '6y6nyKZKU3kuhSHdGT9YQ63DSj2tWoqKB8xui2cofqqj'; // non existent account
    const replay = mftch.replayable(fetch, NET_TOKEN_VALID, { getKey, offline: true });
    const ftch = mftch.ftch(replay, { concurrencyLimit: 1 });
    const archive = new ArchiveNodeProvider(
      mftch.jsonrpc(ftch, URL, {
        batchSize: 20,
      })
    );
    const USDT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';
    const USDC = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    // Basic account, cannot be used for tokens
    deepStrictEqual(await archive.isValidTokenAccount(USDT, addr), false);
    deepStrictEqual(await archive.isValidTokenAccount(USDC, addr), false);
    deepStrictEqual(await archive.isValidTokenAccount(USDC, addr2), false);
    // Valid token accounts
    deepStrictEqual(
      await archive.isValidTokenAccount(USDT, '3VDHywae15vgbG2euNPpwoHTEr2eyGLuS6EoF74kDkp4'),
      true
    );
    deepStrictEqual(
      await archive.isValidTokenAccount(USDC, 'HE3htr6RNwRfdW7nSbg4vHj2uyMvyyZrdNTB9muUn1on'),
      true
    );
    // Valid token accounts, invalid mint
    deepStrictEqual(
      await archive.isValidTokenAccount(USDC, '3VDHywae15vgbG2euNPpwoHTEr2eyGLuS6EoF74kDkp4'),
      false
    );
    deepStrictEqual(
      await archive.isValidTokenAccount(USDT, 'HE3htr6RNwRfdW7nSbg4vHj2uyMvyyZrdNTB9muUn1on'),
      false
    );
    // Check owner
    deepStrictEqual(
      await archive.isValidTokenAccount(USDT, '3VDHywae15vgbG2euNPpwoHTEr2eyGLuS6EoF74kDkp4', addr),
      true
    );
    deepStrictEqual(
      await archive.isValidTokenAccount(USDC, 'HE3htr6RNwRfdW7nSbg4vHj2uyMvyyZrdNTB9muUn1on', addr),
      true
    );
    // Valid account, wrong owner
    deepStrictEqual(
      await archive.isValidTokenAccount(
        USDT,
        '3VDHywae15vgbG2euNPpwoHTEr2eyGLuS6EoF74kDkp4',
        addr2
      ),
      false
    );
    deepStrictEqual(
      await archive.isValidTokenAccount(
        USDC,
        'HE3htr6RNwRfdW7nSbg4vHj2uyMvyyZrdNTB9muUn1on',
        addr2
      ),
      false
    );
  });
});

should.runWhen(import.meta.url);
