import { describe, should } from '@paulmillr/jsbt/test.js';
import * as mftch from 'micro-ftch';
import { deepStrictEqual, rejects, throws } from 'node:assert';
import { COMMON_TOKENS } from '../src/hint.ts';
import * as sol from '../src/index.ts';
import { ArchiveNodeProvider, calcTransfersDiff, URL } from '../src/net.ts';
import { default as NET_BASIC } from './vectors/net_basic.mjs';
import { default as NET_TOKEN_VALID } from './vectors/net_token_valid.mjs';
import { default as NET_TRANSFERS } from './vectors/net_transfers.mjs';

const getKey = (url, opt) => JSON.stringify({ url: 'https://NODE_URL/', opt });

describe('Net', () => {
  should('validators', async () => {
    const archive = new ArchiveNodeProvider({
      call: async () => ({ value: undefined, context: { slot: 0 } }),
    });
    throws(() => archive.minBalance('1000' as any), TypeError);
    throws(() => archive.minBalance(-1), RangeError);
    throws(() => archive.minBalance(1.5), RangeError);
    await rejects(archive.accountInfo(1 as any), TypeError);
    await rejects(archive.unspent(1 as any), TypeError);
    await rejects(archive.tokenBalances(1 as any, COMMON_TOKENS), TypeError);
    await rejects(archive.transfers(1 as any), TypeError);
    await rejects(archive.transfers('11111111111111111111111111111111', '20' as any), TypeError);
    await rejects(archive.transfers('11111111111111111111111111111111', 0), RangeError);
    await rejects(archive.transfers('11111111111111111111111111111111', 1.5), RangeError);
  });
  should('accountInfo rejects unsafe lamport balances', async () => {
    const address = '11111111111111111111111111111111';
    const archive = new ArchiveNodeProvider({
      async call(method: string) {
        if (method === 'getAccountInfo') {
          return {
            value: {
              lamports: 9007199254740993,
              owner: '11111111111111111111111111111111',
              rentEpoch: 0,
              data: ['', 'base64'],
              executable: false,
            },
          };
        }
        if (method === 'getRecentBlockhash')
          return { value: { blockhash: '11111111111111111111111111111111' } };
        throw new Error(`unexpected ${method}`);
      },
    });
    await rejects(archive.accountInfo(address), /accountInfo: lamports exceeds safe integer range/);
    await rejects(archive.unspent(address), /accountInfo: lamports exceeds safe integer range/);
  });
  should(
    'RPC binary data parsing rejects parsed payloads where raw bytes are required',
    async () => {
      const address = '11111111111111111111111111111111';
      const archiveAccount = new ArchiveNodeProvider({
        async call(method: string) {
          if (method === 'getAccountInfo') {
            return {
              value: {
                lamports: 0,
                owner: address,
                rentEpoch: 0,
                data: { parsed: {} },
                executable: false,
              },
            };
          }
          throw new Error(`unexpected ${method}`);
        },
      });
      await rejects(archiveAccount.accountInfo(address), /accountInfo: expected binary data/);
      const archiveTx = new ArchiveNodeProvider({
        async call(method: string, ...args: any[]) {
          if (method === 'getTokenAccountsByOwner') return { value: [] };
          if (method === 'getSignaturesForAddress')
            return args[1].before ? [] : [{ signature: 'sig1' }];
          if (method === 'getTransaction') {
            return {
              blockTime: 1,
              slot: 1,
              transaction: { parsed: {} },
              meta: {
                err: null,
                fee: 5000,
                innerInstructions: [],
                logMessages: [],
                postBalances: [],
                preBalances: [],
                postTokenBalances: [],
                preTokenBalances: [],
                rewards: [],
                status: { Ok: null },
              },
            };
          }
          throw new Error(`unexpected ${method}`);
        },
      });
      await rejects(archiveTx.transfers(address, 10), /txInfo: transaction expected binary data/);
      await rejects((archiveTx as any).txInfo('sig1'), /txInfo: transaction expected binary data/);
    }
  );
  should('accountInfo rejects malformed account metadata', async () => {
    const address = '11111111111111111111111111111111';
    const accounts = [
      undefined,
      1,
      [],
      { owner: 1, rentEpoch: 0, executable: false },
      { owner: address, rentEpoch: '0', executable: false },
      { owner: address, rentEpoch: 0, executable: 'false' },
    ];
    const archive = new ArchiveNodeProvider({
      async call(method: string) {
        if (method === 'getAccountInfo') {
          const account = accounts.shift();
          return {
            value:
              account && typeof account === 'object' && !Array.isArray(account)
                ? {
                    ...account,
                    lamports: 0,
                    data: ['', 'base64'],
                  }
                : account,
          };
        }
        throw new Error(`unexpected ${method}`);
      },
    });
    await rejects(archive.accountInfo(address), /accountInfo: expected account object/);
    await rejects(archive.accountInfo(address), /accountInfo: expected account object/);
    await rejects(archive.accountInfo(address), /accountInfo: expected account object/);
    await rejects(archive.accountInfo(address), /accountInfo: owner must be a string/);
    await rejects(archive.accountInfo(address), /accountInfo: rentEpoch must be a number/);
    await rejects(archive.accountInfo(address), /accountInfo: executable must be boolean/);
    deepStrictEqual(accounts, []);
  });
  should('RPC value helpers reject malformed result wrappers', async () => {
    const address = '11111111111111111111111111111111';
    const archive = new ArchiveNodeProvider({
      async call() {
        return undefined;
      },
    });
    await rejects(archive.accountInfo(address), /getAccountInfo: expected RPC value wrapper/);
    await rejects(
      archive.tokenBalances(address, COMMON_TOKENS),
      /getTokenAccountsByOwner: expected RPC value wrapper/
    );
    await rejects(archive.recentBlockHash(), /getRecentBlockhash: expected RPC value wrapper/);
  });
  should('token amount parsing rejects malformed RPC amount strings', async () => {
    const privateKey = new Uint8Array(32).fill(8);
    const source = sol.getAddress(privateKey);
    const mint = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';
    const tokenAccount = '11111111111111111111111111111111';
    const archiveBalances = new ArchiveNodeProvider({
      async call(method: string) {
        if (method === 'getTokenAccountsByOwner') {
          return {
            value: [
              {
                pubkey: tokenAccount,
                account: {
                  data: {
                    parsed: {
                      info: {
                        isNative: false,
                        mint,
                        owner: source,
                        state: 'initialized',
                        tokenAmount: {
                          amount: '',
                          decimals: 6,
                          uiAmount: 0,
                          uiAmountString: '0',
                        },
                      },
                      type: 'account',
                    },
                    program: 'spl-token',
                    space: 165,
                  },
                  executable: false,
                  lamports: 0,
                  owner: sol.TOKEN_PROGRAM,
                  rentEpoch: 0,
                  space: 165,
                },
              },
            ],
          };
        }
        throw new Error(`unexpected ${method}`);
      },
    });
    await rejects(
      archiveBalances.tokenBalances(source, COMMON_TOKENS),
      /tokenBalances: token amount must be an unsigned integer string/
    );
    const [, raw] = sol.signTx(
      privateKey,
      sol.TransactionRaw.encode({
        signatures: [new Uint8Array(64)],
        msg: {
          TAG: 'legacy',
          data: {
            header: { requiredSignatures: 1, readSigned: 0, readUnsigned: 1 },
            keys: [source, '11111111111111111111111111111111'],
            blockhash: 'EETubP5AKHgjPAhzPAFcb8BAY1hMH639CWCFTqi3hq1k',
            instructions: [],
          },
        },
      })
    );
    const tx = {
      blockTime: 1,
      slot: 1,
      transaction: [raw, 'base64'],
      meta: {
        err: null,
        fee: 5000,
        innerInstructions: [],
        logMessages: [],
        postBalances: [0, 0],
        preBalances: [0, 0],
        postTokenBalances: [
          {
            accountIndex: 0,
            mint,
            owner: source,
            uiTokenAmount: {
              amount: '-1',
              decimals: 6,
              uiAmount: -0.000001,
              uiAmountString: '-0.000001',
            },
          },
        ],
        preTokenBalances: [],
        rewards: [],
        status: { Ok: null },
      },
    };
    const archiveTx = new ArchiveNodeProvider({
      async call(method: string, ...args: any[]) {
        if (method === 'getTokenAccountsByOwner') return { value: [] };
        if (method === 'getSignaturesForAddress')
          return args[1].before ? [] : [{ signature: 'sig1' }];
        if (method === 'getTransaction') return tx;
        throw new Error(`unexpected ${method}`);
      },
    });
    await rejects(
      archiveTx.transfers(source, 10),
      /txInfo: token amount must be an unsigned integer string/
    );
    await rejects(
      (archiveTx as any).txInfo('sig1'),
      /txInfo: token amount must be an unsigned integer string/
    );
  });
  should('token metadata parsing rejects invalid RPC decimals', async () => {
    const privateKey = new Uint8Array(32).fill(8);
    const source = sol.getAddress(privateKey);
    const mint = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';
    const tokenAccount = '11111111111111111111111111111111';
    const archiveBalances = new ArchiveNodeProvider({
      async call(method: string) {
        if (method === 'getTokenAccountsByOwner') {
          return {
            value: [
              {
                pubkey: tokenAccount,
                account: {
                  data: {
                    parsed: {
                      info: {
                        isNative: false,
                        mint,
                        owner: source,
                        state: 'initialized',
                        tokenAmount: {
                          amount: '1',
                          decimals: -1,
                          uiAmount: 0,
                          uiAmountString: '0',
                        },
                      },
                      type: 'account',
                    },
                    program: 'spl-token',
                    space: 165,
                  },
                  executable: false,
                  lamports: 0,
                  owner: sol.TOKEN_PROGRAM,
                  rentEpoch: 0,
                  space: 165,
                },
              },
            ],
          };
        }
        throw new Error(`unexpected ${method}`);
      },
    });
    await rejects(
      archiveBalances.tokenBalances(source, COMMON_TOKENS),
      /tokenBalances: token decimals must be an unsigned 8-bit integer/
    );
    const [, raw] = sol.signTx(
      privateKey,
      sol.TransactionRaw.encode({
        signatures: [new Uint8Array(64)],
        msg: {
          TAG: 'legacy',
          data: {
            header: { requiredSignatures: 1, readSigned: 0, readUnsigned: 1 },
            keys: [source, '11111111111111111111111111111111'],
            blockhash: 'EETubP5AKHgjPAhzPAFcb8BAY1hMH639CWCFTqi3hq1k',
            instructions: [],
          },
        },
      })
    );
    const tx = {
      blockTime: 1,
      slot: 1,
      transaction: [raw, 'base64'],
      meta: {
        err: null,
        fee: 5000,
        innerInstructions: [],
        logMessages: [],
        postBalances: [0, 0],
        preBalances: [0, 0],
        postTokenBalances: [
          {
            accountIndex: 0,
            mint,
            owner: source,
            uiTokenAmount: {
              amount: '1',
              decimals: 256,
              uiAmount: 0.000001,
              uiAmountString: '0.000001',
            },
          },
        ],
        preTokenBalances: [],
        rewards: [],
        status: { Ok: null },
      },
    };
    const archiveTx = new ArchiveNodeProvider({
      async call(method: string, ...args: any[]) {
        if (method === 'getTokenAccountsByOwner') return { value: [] };
        if (method === 'getSignaturesForAddress')
          return args[1].before ? [] : [{ signature: 'sig1' }];
        if (method === 'getTransaction') return tx;
        throw new Error(`unexpected ${method}`);
      },
    });
    await rejects(
      archiveTx.transfers(source, 10),
      /txInfo: token decimals must be an unsigned 8-bit integer/
    );
    await rejects(
      (archiveTx as any).txInfo('sig1'),
      /txInfo: token decimals must be an unsigned 8-bit integer/
    );
  });
  should('tokenBalances rejects malformed token account entries', async () => {
    const source = sol.getAddress(new Uint8Array(32).fill(8));
    const mint = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';
    const account = {
      data: {
        parsed: {
          info: {
            mint,
            tokenAmount: {
              amount: '1',
              decimals: 6,
              uiAmount: 0.000001,
              uiAmountString: '0.000001',
            },
          },
          type: 'account',
        },
        program: 'spl-token',
        space: 165,
      },
      executable: false,
      lamports: 0,
      owner: sol.TOKEN_PROGRAM,
      rentEpoch: 0,
      space: 165,
    };
    const archivePubkey = new ArchiveNodeProvider({
      async call(method: string) {
        if (method === 'getTokenAccountsByOwner') return { value: [{ pubkey: 1, account }] };
        throw new Error(`unexpected ${method}`);
      },
    });
    await rejects(
      archivePubkey.tokenBalances(source, COMMON_TOKENS),
      /tokenBalances: token account pubkey must be a string/
    );
    const archiveInfo = new ArchiveNodeProvider({
      async call(method: string) {
        if (method === 'getTokenAccountsByOwner') {
          return { value: [{ pubkey: '11111111111111111111111111111111', account: {} }] };
        }
        throw new Error(`unexpected ${method}`);
      },
    });
    await rejects(
      archiveInfo.tokenBalances(source, COMMON_TOKENS),
      /tokenBalances: expected parsed token account info/
    );
  });
  should('transfer parsing rejects malformed token balance metadata', async () => {
    const privateKey = new Uint8Array(32).fill(8);
    const source = sol.getAddress(privateKey);
    const [, raw] = sol.signTx(
      privateKey,
      sol.TransactionRaw.encode({
        signatures: [new Uint8Array(64)],
        msg: {
          TAG: 'legacy',
          data: {
            header: { requiredSignatures: 1, readSigned: 0, readUnsigned: 1 },
            keys: [source, '11111111111111111111111111111111'],
            blockhash: 'EETubP5AKHgjPAhzPAFcb8BAY1hMH639CWCFTqi3hq1k',
            instructions: [],
          },
        },
      })
    );
    const tx = {
      blockTime: 1,
      slot: 1,
      transaction: [raw, 'base64'],
      meta: {
        err: null,
        fee: 5000,
        innerInstructions: [],
        logMessages: [],
        postBalances: [0, 0],
        preBalances: [0, 0],
        postTokenBalances: [
          {
            accountIndex: 0,
            owner: source,
            uiTokenAmount: {
              amount: '1',
              decimals: 6,
              uiAmount: 0.000001,
              uiAmountString: '0.000001',
            },
          },
        ],
        preTokenBalances: [],
        rewards: [],
        status: { Ok: null },
      },
    };
    const archive = new ArchiveNodeProvider({
      async call(method: string, ...args: any[]) {
        if (method === 'getTokenAccountsByOwner') return { value: [] };
        if (method === 'getSignaturesForAddress')
          return args[1].before ? [] : [{ signature: 'sig1' }];
        if (method === 'getTransaction') return tx;
        throw new Error(`unexpected ${method}`);
      },
    });
    await rejects(archive.transfers(source, 10), /txInfo: token mint must be a string/);
    await rejects((archive as any).txInfo('sig1'), /txInfo: token mint must be a string/);
  });
  should('transfer parsing rejects invalid token balance account indexes', async () => {
    const privateKey = new Uint8Array(32).fill(8);
    const source = sol.getAddress(privateKey);
    const [, raw] = sol.signTx(
      privateKey,
      sol.TransactionRaw.encode({
        signatures: [new Uint8Array(64)],
        msg: {
          TAG: 'legacy',
          data: {
            header: { requiredSignatures: 1, readSigned: 0, readUnsigned: 1 },
            keys: [source, '11111111111111111111111111111111'],
            blockhash: 'EETubP5AKHgjPAhzPAFcb8BAY1hMH639CWCFTqi3hq1k',
            instructions: [],
          },
        },
      })
    );
    const tx = {
      blockTime: 1,
      slot: 1,
      transaction: [raw, 'base64'],
      meta: {
        err: null,
        fee: 5000,
        innerInstructions: [],
        logMessages: [],
        postBalances: [0, 0],
        preBalances: [0, 0],
        postTokenBalances: [
          {
            accountIndex: 99,
            mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
            owner: source,
            uiTokenAmount: {
              amount: '7',
              decimals: 6,
              uiAmount: 0.000007,
              uiAmountString: '0.000007',
            },
          },
        ],
        preTokenBalances: [],
        rewards: [],
        status: { Ok: null },
      },
    };
    const archive = new ArchiveNodeProvider({
      async call(method: string, ...args: any[]) {
        if (method === 'getTokenAccountsByOwner') return { value: [] };
        if (method === 'getSignaturesForAddress')
          return args[1].before ? [] : [{ signature: 'sig1' }];
        if (method === 'getTransaction') return tx;
        throw new Error(`unexpected ${method}`);
      },
    });
    await rejects(archive.transfers(source, 10), /token balance accountIndex exceeds account keys/);
    await rejects(
      (archive as any).txInfo('sig1'),
      /token balance accountIndex exceeds account keys/
    );
  });
  should('transfer parsing treats missing post token balance as debit', async () => {
    const privateKey = new Uint8Array(32).fill(8);
    const source = sol.getAddress(privateKey);
    const tokenAccount = '11111111111111111111111111111111';
    const mint = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';
    const [, raw] = sol.signTx(
      privateKey,
      sol.TransactionRaw.encode({
        signatures: [new Uint8Array(64)],
        msg: {
          TAG: 'legacy',
          data: {
            header: { requiredSignatures: 1, readSigned: 0, readUnsigned: 1 },
            keys: [source, tokenAccount],
            blockhash: 'EETubP5AKHgjPAhzPAFcb8BAY1hMH639CWCFTqi3hq1k',
            instructions: [],
          },
        },
      })
    );
    const archive = new ArchiveNodeProvider({
      async call(method: string, ...args: any[]) {
        if (method === 'getTokenAccountsByOwner') return { value: [] };
        if (method === 'getSignaturesForAddress')
          return args[1].before ? [] : [{ signature: 'sig1' }];
        if (method === 'getTransaction') {
          return {
            blockTime: 1,
            slot: 1,
            transaction: [raw, 'base64'],
            meta: {
              err: null,
              fee: 5000,
              innerInstructions: [],
              logMessages: [],
              postBalances: [0, 0],
              preBalances: [0, 0],
              postTokenBalances: [],
              preTokenBalances: [
                {
                  accountIndex: 1,
                  mint,
                  owner: source,
                  uiTokenAmount: {
                    amount: '7',
                    decimals: 6,
                    uiAmount: 0.000007,
                    uiAmountString: '0.000007',
                  },
                },
              ],
              rewards: [],
              status: { Ok: null },
            },
          };
        }
        throw new Error(`unexpected ${method}`);
      },
    });
    deepStrictEqual(await (archive as any).txInfo('sig1'), {
      hash: 'sig1',
      timestamp: 1000,
      block: 1,
      transfers: [],
      tokenTransfers: [
        { from: tokenAccount, value: 7n, contract: mint, owner: source, decimals: 6 },
      ],
      reverted: false,
      info: { log: [], raw, fee: 5000n },
    });
  });
  should('transfer parsing rejects duplicate token balance entries', async () => {
    const privateKey = new Uint8Array(32).fill(8);
    const source = sol.getAddress(privateKey);
    const tokenAccount = '11111111111111111111111111111111';
    const mint = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';
    const [, raw] = sol.signTx(
      privateKey,
      sol.TransactionRaw.encode({
        signatures: [new Uint8Array(64)],
        msg: {
          TAG: 'legacy',
          data: {
            header: { requiredSignatures: 1, readSigned: 0, readUnsigned: 1 },
            keys: [source, tokenAccount],
            blockhash: 'EETubP5AKHgjPAhzPAFcb8BAY1hMH639CWCFTqi3hq1k',
            instructions: [],
          },
        },
      })
    );
    const balance = {
      accountIndex: 1,
      mint,
      owner: source,
      uiTokenAmount: {
        amount: '7',
        decimals: 6,
        uiAmount: 0.000007,
        uiAmountString: '0.000007',
      },
    };
    const snapshots = [
      { preTokenBalances: [balance, balance], postTokenBalances: [] },
      { preTokenBalances: [], postTokenBalances: [balance, balance] },
    ];
    const archive = new ArchiveNodeProvider({
      async call(method: string) {
        if (method === 'getTransaction') {
          const snapshot = snapshots.shift();
          return {
            blockTime: 1,
            slot: 1,
            transaction: [raw, 'base64'],
            meta: {
              err: null,
              fee: 5000,
              innerInstructions: [],
              logMessages: [],
              postBalances: [0, 0],
              preBalances: [0, 0],
              ...snapshot,
              rewards: [],
              status: { Ok: null },
            },
          };
        }
        throw new Error(`unexpected ${method}`);
      },
    });
    await rejects(
      (archive as any).txInfo('sig1'),
      /txInfo: duplicate preTokenBalances accountIndex/
    );
    await rejects(
      (archive as any).txInfo('sig1'),
      /txInfo: duplicate postTokenBalances accountIndex/
    );
    deepStrictEqual(snapshots, []);
  });
  should('transfer parsing rejects unsafe SOL balance numbers', async () => {
    const privateKey = new Uint8Array(32).fill(8);
    const source = sol.getAddress(privateKey);
    const [, raw] = sol.signTx(
      privateKey,
      sol.TransactionRaw.encode({
        signatures: [new Uint8Array(64)],
        msg: {
          TAG: 'legacy',
          data: {
            header: { requiredSignatures: 1, readSigned: 0, readUnsigned: 1 },
            keys: [source, '11111111111111111111111111111111'],
            blockhash: 'EETubP5AKHgjPAhzPAFcb8BAY1hMH639CWCFTqi3hq1k',
            instructions: [],
          },
        },
      })
    );
    const tx = {
      blockTime: 1,
      slot: 1,
      transaction: [raw, 'base64'],
      meta: {
        err: null,
        fee: 5000,
        innerInstructions: [],
        logMessages: [],
        postBalances: [9007199254740993, 0],
        preBalances: [0, 0],
        postTokenBalances: [],
        preTokenBalances: [],
        rewards: [],
        status: { Ok: null },
      },
    };
    const archive = new ArchiveNodeProvider({
      async call(method: string, ...args: any[]) {
        if (method === 'getTokenAccountsByOwner') return { value: [] };
        if (method === 'getSignaturesForAddress')
          return args[1].before ? [] : [{ signature: 'sig1' }];
        if (method === 'getTransaction') return tx;
        throw new Error(`unexpected ${method}`);
      },
    });
    await rejects(archive.transfers(source, 10), /balance exceeds safe integer range/);
    await rejects((archive as any).txInfo('sig1'), /balance exceeds safe integer range/);
    tx.meta.postBalances = [0, 0];
    tx.meta.fee = 9007199254740993;
    await rejects(archive.transfers(source, 10), /fee exceeds safe integer range/);
    await rejects((archive as any).txInfo('sig1'), /fee exceeds safe integer range/);
    tx.meta.fee = 5000;
    tx.slot = 9007199254740993;
    await rejects(archive.transfers(source, 10), /slot exceeds safe integer range/);
    await rejects((archive as any).txInfo('sig1'), /slot exceeds safe integer range/);
  });
  should('transfer parsing handles nullable block times', async () => {
    const privateKey = new Uint8Array(32).fill(8);
    const source = sol.getAddress(privateKey);
    const [, raw] = sol.signTx(
      privateKey,
      sol.TransactionRaw.encode({
        signatures: [new Uint8Array(64)],
        msg: {
          TAG: 'legacy',
          data: {
            header: { requiredSignatures: 1, readSigned: 0, readUnsigned: 1 },
            keys: [source, '11111111111111111111111111111111'],
            blockhash: 'EETubP5AKHgjPAhzPAFcb8BAY1hMH639CWCFTqi3hq1k',
            instructions: [],
          },
        },
      })
    );
    const tx = {
      blockTime: null as number | null,
      slot: 1,
      transaction: [raw, 'base64'],
      meta: {
        err: null,
        fee: 5000,
        innerInstructions: [],
        logMessages: [],
        postBalances: [0, 0],
        preBalances: [0, 0],
        postTokenBalances: [],
        preTokenBalances: [],
        rewards: [],
        status: { Ok: null },
      },
    };
    const archive = new ArchiveNodeProvider({
      async call(method: string, ...args: any[]) {
        if (method === 'getTokenAccountsByOwner') return { value: [] };
        if (method === 'getSignaturesForAddress')
          return args[1].before ? [] : [{ signature: 'sig1' }];
        if (method === 'getTransaction') return tx;
        throw new Error(`unexpected ${method}`);
      },
    });
    deepStrictEqual(await (archive as any).txInfo('sig1'), {
      hash: 'sig1',
      block: 1,
      transfers: [],
      tokenTransfers: [],
      reverted: false,
      info: { log: [], raw, fee: 5000n },
    });
    tx.blockTime = 9007199254740993;
    await rejects((archive as any).txInfo('sig1'), /blockTime exceeds safe integer range/);
  });
  should('transfer parsing handles nullable log and token balance metadata', async () => {
    const privateKey = new Uint8Array(32).fill(8);
    const source = sol.getAddress(privateKey);
    const [, raw] = sol.signTx(
      privateKey,
      sol.TransactionRaw.encode({
        signatures: [new Uint8Array(64)],
        msg: {
          TAG: 'legacy',
          data: {
            header: { requiredSignatures: 1, readSigned: 0, readUnsigned: 1 },
            keys: [source, '11111111111111111111111111111111'],
            blockhash: 'EETubP5AKHgjPAhzPAFcb8BAY1hMH639CWCFTqi3hq1k',
            instructions: [],
          },
        },
      })
    );
    const tx = {
      blockTime: 1,
      slot: 1,
      transaction: [raw, 'base64'],
      meta: {
        err: null,
        fee: 5000,
        innerInstructions: [],
        logMessages: null,
        postBalances: [1, 0],
        preBalances: [0, 0],
        postTokenBalances: null,
        preTokenBalances: null,
        rewards: [],
        status: { Ok: null },
      },
    };
    const archive = new ArchiveNodeProvider({
      async call(method: string, ...args: any[]) {
        if (method === 'getTokenAccountsByOwner') return { value: [] };
        if (method === 'getSignaturesForAddress')
          return args[1].before ? [] : [{ signature: 'sig1' }];
        if (method === 'getTransaction') return tx;
        throw new Error(`unexpected ${method}`);
      },
    });
    const parsed = {
      hash: 'sig1',
      timestamp: 1000,
      block: 1,
      transfers: [{ to: source, value: 1n }],
      tokenTransfers: [],
      reverted: false,
      info: { log: [], raw, fee: 5000n },
    };
    deepStrictEqual(await (archive as any).txInfo('sig1'), parsed);
    deepStrictEqual(await archive.transfers(source, 10), [parsed]);
    tx.meta.logMessages = [1] as any;
    await rejects((archive as any).txInfo('sig1'), /txInfo: logMessages item must be a string/);
    tx.meta.logMessages = [];
    delete (tx.meta as any).err;
    await rejects((archive as any).txInfo('sig1'), /txInfo: transaction error status missing/);
  });
  should('airdrop rejects unsafe lamport amounts', async () => {
    const address = '11111111111111111111111111111111';
    const calls: any[][] = [];
    const archive = new ArchiveNodeProvider({
      async call(method: string, ...args: any[]) {
        calls.push([method, ...args]);
        return { value: 'ok' };
      },
    });
    deepStrictEqual(await archive.airdrop(address, 9007199254740991n), 'ok');
    deepStrictEqual(calls, [
      [
        'requestAirdrop',
        address,
        9007199254740991,
        {
          encoding: 'base64',
          commitment: 'confirmed',
        },
      ],
    ]);
    await rejects(
      archive.airdrop(address, 9007199254740993n),
      /airdrop: amount exceeds safe integer range/
    );
    await rejects(archive.airdrop(address, -1n), /airdrop: amount must be non-negative/);
    await rejects(archive.airdrop(1 as any, 1n), /airdrop: expected address string/);
    deepStrictEqual(calls.length, 1);
  });
  should('height rejects unsafe slot numbers', async () => {
    const slots = [271227303, 9007199254740993];
    const archive = new ArchiveNodeProvider({
      async call() {
        return { context: { slot: slots.shift() } };
      },
    });
    deepStrictEqual(await archive.height(), 271227303);
    await rejects(archive.height(), /height: slot exceeds safe integer range/);
    deepStrictEqual(slots, []);
  });
  should('height rejects malformed response metadata', async () => {
    const responses = [undefined, {}, { context: null }, { context: { slot: '1' } }];
    const archive = new ArchiveNodeProvider({
      async call() {
        return responses.shift();
      },
    });
    await rejects(archive.height(), /height: expected context object/);
    await rejects(archive.height(), /height: expected context object/);
    await rejects(archive.height(), /height: expected context object/);
    await rejects(archive.height(), /height: slot must be a number/);
    deepStrictEqual(responses, []);
  });
  should('fee rejects unsafe lamports per signature', async () => {
    const fees = [5000, 9007199254740993];
    const archive = new ArchiveNodeProvider({
      async call() {
        return {
          value: {
            blockhash: '11111111111111111111111111111111',
            feeCalculator: { lamportsPerSignature: fees.shift() },
          },
        };
      },
    });
    deepStrictEqual(await archive.fee(), 5000n);
    await rejects(archive.fee(), /fee: lamportsPerSignature exceeds safe integer range/);
    deepStrictEqual(fees, []);
  });
  should('recentBlockHash rejects malformed response metadata', async () => {
    const responses = [
      { blockhash: 1, feeCalculator: { lamportsPerSignature: 5000 } },
      { blockhash: '11111111111111111111111111111111', feeCalculator: undefined },
      {
        blockhash: '11111111111111111111111111111111',
        feeCalculator: { lamportsPerSignature: '5000' },
      },
      {
        blockhash: '11111111111111111111111111111111',
        feeCalculator: { lamportsPerSignature: -1 },
      },
      {
        blockhash: '11111111111111111111111111111111',
        feeCalculator: { lamportsPerSignature: 9007199254740993 },
      },
    ];
    const archive = new ArchiveNodeProvider({
      async call() {
        return { value: responses.shift() };
      },
    });
    await rejects(archive.recentBlockHash(), /recentBlockHash: blockhash must be a string/);
    await rejects(archive.recentBlockHash(), /recentBlockHash: feeCalculator must be an object/);
    await rejects(
      archive.recentBlockHash(),
      /recentBlockHash: lamportsPerSignature must be a number/
    );
    await rejects(
      archive.recentBlockHash(),
      /recentBlockHash: lamportsPerSignature must be non-negative/
    );
    await rejects(
      archive.recentBlockHash(),
      /recentBlockHash: lamportsPerSignature exceeds safe integer range/
    );
    deepStrictEqual(responses, []);
  });
  should('RPC integer parsing rejects negative values', async () => {
    const privateKey = new Uint8Array(32).fill(8);
    const source = sol.getAddress(privateKey);
    const archiveAccount = new ArchiveNodeProvider({
      async call(method: string) {
        if (method === 'getAccountInfo') {
          return {
            value: {
              lamports: -1,
              owner: '11111111111111111111111111111111',
              rentEpoch: 0,
              data: ['', 'base64'],
              executable: false,
            },
          };
        }
        throw new Error(`unexpected ${method}`);
      },
    });
    await rejects(archiveAccount.accountInfo(source), /accountInfo: lamports must be non-negative/);
    const archiveHeight = new ArchiveNodeProvider({
      async call() {
        return { context: { slot: -1 } };
      },
    });
    await rejects(archiveHeight.height(), /height: slot must be non-negative/);
    const archiveFee = new ArchiveNodeProvider({
      async call() {
        return {
          value: {
            blockhash: '11111111111111111111111111111111',
            feeCalculator: { lamportsPerSignature: -1 },
          },
        };
      },
    });
    await rejects(archiveFee.fee(), /fee: lamportsPerSignature must be non-negative/);
    const [, raw] = sol.signTx(
      privateKey,
      sol.TransactionRaw.encode({
        signatures: [new Uint8Array(64)],
        msg: {
          TAG: 'legacy',
          data: {
            header: { requiredSignatures: 1, readSigned: 0, readUnsigned: 1 },
            keys: [source, '11111111111111111111111111111111'],
            blockhash: 'EETubP5AKHgjPAhzPAFcb8BAY1hMH639CWCFTqi3hq1k',
            instructions: [],
          },
        },
      })
    );
    const archiveTx = new ArchiveNodeProvider({
      async call(method: string) {
        if (method === 'getTransaction') {
          return {
            blockTime: 1,
            slot: 1,
            transaction: [raw, 'base64'],
            meta: {
              err: null,
              fee: 5000,
              innerInstructions: [],
              logMessages: [],
              postBalances: [-1, 0],
              preBalances: [0, 0],
              postTokenBalances: [],
              preTokenBalances: [],
              rewards: [],
              status: { Ok: null },
            },
          };
        }
        throw new Error(`unexpected ${method}`);
      },
    });
    await rejects((archiveTx as any).txInfo('sig1'), /txInfo: post balance must be non-negative/);
    const archiveLength = new ArchiveNodeProvider({
      async call(method: string) {
        if (method === 'getTransaction') {
          return {
            blockTime: 1,
            slot: 1,
            transaction: [raw, 'base64'],
            meta: {
              err: null,
              fee: 5000,
              innerInstructions: [],
              logMessages: [],
              postBalances: [0, 0, 1],
              preBalances: [0, 0, 0],
              postTokenBalances: [],
              preTokenBalances: [],
              rewards: [],
              status: { Ok: null },
            },
          };
        }
        throw new Error(`unexpected ${method}`);
      },
    });
    await rejects(
      (archiveLength as any).txInfo('sig1'),
      /txInfo: postBalances length does not match account keys/
    );
  });
  should('transfers rejects malformed RPC list responses', async () => {
    const address = '11111111111111111111111111111111';
    const archiveTokens = new ArchiveNodeProvider({
      async call(method: string) {
        if (method === 'getSignaturesForAddress') return [];
        if (method === 'getTokenAccountsByOwner') return { value: {} };
        throw new Error(`unexpected ${method}`);
      },
    });
    await rejects(archiveTokens.transfers(address, 10), /transfers: incorrect tokens value/);
    const archiveSignatures = new ArchiveNodeProvider({
      async call(method: string) {
        if (method === 'getSignaturesForAddress') return {};
        if (method === 'getTokenAccountsByOwner') return { value: [] };
        throw new Error(`unexpected ${method}`);
      },
    });
    await rejects(
      archiveSignatures.transfers(address, 10),
      /addressTransactions: incorrect signatures value/
    );
  });
  should('transfer parsing rejects missing transactions', async () => {
    const address = '11111111111111111111111111111111';
    const archive = new ArchiveNodeProvider({
      async call(method: string, ...args: any[]) {
        if (method === 'getTokenAccountsByOwner') return { value: [] };
        if (method === 'getSignaturesForAddress')
          return args[1].before ? [] : [{ signature: 'sig1' }];
        if (method === 'getTransaction') return null;
        throw new Error(`unexpected ${method}`);
      },
    });
    await rejects(archive.transfers(address, 10), /txInfo: missing transaction/);
    await rejects((archive as any).txInfo('sig1'), /txInfo: missing transaction/);
  });
  should('transfer parsing rejects missing transaction metadata', async () => {
    const privateKey = new Uint8Array(32).fill(8);
    const source = sol.getAddress(privateKey);
    const [, raw] = sol.signTx(
      privateKey,
      sol.TransactionRaw.encode({
        signatures: [new Uint8Array(64)],
        msg: {
          TAG: 'legacy',
          data: {
            header: { requiredSignatures: 1, readSigned: 0, readUnsigned: 1 },
            keys: [source, '11111111111111111111111111111111'],
            blockhash: 'EETubP5AKHgjPAhzPAFcb8BAY1hMH639CWCFTqi3hq1k',
            instructions: [],
          },
        },
      })
    );
    const archive = new ArchiveNodeProvider({
      async call(method: string, ...args: any[]) {
        if (method === 'getTokenAccountsByOwner') return { value: [] };
        if (method === 'getSignaturesForAddress')
          return args[1].before ? [] : [{ signature: 'sig1' }];
        if (method === 'getTransaction') {
          return {
            blockTime: 1,
            slot: 1,
            transaction: [raw, 'base64'],
            meta: null,
          };
        }
        throw new Error(`unexpected ${method}`);
      },
    });
    await rejects(archive.transfers(source, 10), /txInfo: missing transaction metadata/);
    await rejects((archive as any).txInfo('sig1'), /txInfo: missing transaction metadata/);
  });
  should('transfers rejects malformed signature entries', async () => {
    const address = '11111111111111111111111111111111';
    let calls = 0;
    const archiveSignatures = new ArchiveNodeProvider({
      async call(method: string, ...args: any[]) {
        if (method === 'getSignaturesForAddress') {
          calls++;
          return calls === 1 ? [{ slot: 1, blockTime: 1 }] : [];
        }
        if (method === 'getTokenAccountsByOwner') return { value: [] };
        throw new Error(`unexpected ${method} ${args[0]}`);
      },
    });
    await rejects(
      archiveSignatures.transfers(address, 10),
      /addressTransactions: expected signature string/
    );
  });
  should('transfers rejects malformed token account entries', async () => {
    const address = '11111111111111111111111111111111';
    const archiveTokens = new ArchiveNodeProvider({
      async call(method: string, ...args: any[]) {
        if (method === 'getSignaturesForAddress') {
          if (args[0] !== address) throw new Error(`unexpected token address ${args[0]}`);
          return [];
        }
        if (method === 'getTokenAccountsByOwner') return { value: [{ pubkey: 1 }] };
        throw new Error(`unexpected ${method}`);
      },
    });
    await rejects(
      archiveTokens.transfers(address, 10),
      /transfers: token account pubkey must be a string/
    );
  });
  should('calcTransfersDiff does not mutate caller transactions', () => {
    const txs = [
      {
        hash: 'tx',
        transfers: [{ to: 'alice', value: 2n }],
        tokenTransfers: [{ contract: 'mint', to: 'token-alice', value: 5n, decimals: 6 }],
        reverted: false,
        info: { raw: '', log: [], fee: 0n },
      },
    ];
    const out = calcTransfersDiff(txs);
    deepStrictEqual(out, [
      {
        hash: 'tx',
        transfers: [{ to: 'alice', value: 2n }],
        tokenTransfers: [{ contract: 'mint', to: 'token-alice', value: 5n, decimals: 6 }],
        reverted: false,
        info: { raw: '', log: [], fee: 0n },
        balances: { alice: 2n },
        tokenBalances: { mint: { 'token-alice': 5n } },
      },
    ]);
    out[0].transfers[0].value = 3n;
    out[0].tokenTransfers[0].value = 7n;
    out[0].info.log.push('changed');
    deepStrictEqual(txs, [
      {
        hash: 'tx',
        transfers: [{ to: 'alice', value: 2n }],
        tokenTransfers: [{ contract: 'mint', to: 'token-alice', value: 5n, decimals: 6 }],
        reverted: false,
        info: { raw: '', log: [], fee: 0n },
      },
    ]);
  });
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
    const USDT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';
    const USDT_ACCOUNT = '3VDHywae15vgbG2euNPpwoHTEr2eyGLuS6EoF74kDkp4';
    const USDC = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    const USDC_ACCOUNT = 'HE3htr6RNwRfdW7nSbg4vHj2uyMvyyZrdNTB9muUn1on';
    const replay = mftch.replayable(fetch, NET_TRANSFERS, { getKey, offline: true });
    const ftch = mftch.ftch(replay, { concurrencyLimit: 1 });
    const archive = new ArchiveNodeProvider(
      mftch.jsonrpc(ftch, URL, {
        batchSize: 20,
      })
    );
    const res = await archive.transfers(addr, 20);
    const diff = calcTransfersDiff(res);
    const mins = { sol: 0n, usdt: 0n, usdc: 0n };
    for (const tx of diff) {
      const sol = tx.balances[addr] || 0n;
      const usdt = tx.tokenBalances[USDT]?.[USDT_ACCOUNT] || 0n;
      const usdc = tx.tokenBalances[USDC]?.[USDC_ACCOUNT] || 0n;
      if (sol < mins.sol) mins.sol = sol;
      if (usdt < mins.usdt) mins.usdt = usdt;
      if (usdc < mins.usdc) mins.usdc = usdc;
    }
    deepStrictEqual(mins, { sol: 0n, usdt: 0n, usdc: 0n });
    const diffLast = diff[diff.length - 1];
    // 0.00109
    //     1090000n
    deepStrictEqual(diffLast.balances[addr], 1090000n);
    // USDT
    deepStrictEqual(diffLast.tokenBalances[USDT][USDT_ACCOUNT], 0n);
    // USDC
    deepStrictEqual(diffLast.tokenBalances[USDC][USDC_ACCOUNT], 0n);
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
