import { base64, hex } from '@scure/base';
import { describe, should } from 'micro-should';
import { deepStrictEqual, throws } from 'node:assert';
import fs from 'node:fs';
import { hintInstruction } from '../lib/esm/hint.js';
import * as sol from '../lib/esm/index.js';

const vectors = JSON.parse(fs.readFileSync(new URL('vectors-sol.json', import.meta.url)));

const shortVecVectors = [
  ['00', 0],
  ['05', 5],
  ['7f', 0x7f],
  ['8001', 0x80],
  ['ff01', 0xff],
  ['8002', 0x100],
  ['ffff01', 0x7fff],
  ['80808001', 0x200000],
];

describe('Solana', () => {
  should('isOnCurve', () => {
    for (let i = 0; i < vectors.isOnCurve.length; i++) {
      const { data, exp } = vectors.isOnCurve[i];
      deepStrictEqual(sol.isOnCurve(hex.decode(data)), exp, `pubKey: ${data}`);
    }
  });

  should('key generation basic', () => {
    const key = hex.decode('99da9559e15e913ee9ab2e53e3dfad575da33b49be1125bb922e33494f498828');
    deepStrictEqual(sol.getAddress(key), '2q7pyhPwAwZ3QMfZrnAbDhnh9mDUqycszcpf86VgQxhF');
  });
  should('public key from private key', () => {
    const key = hex.decode('99da9559e15e913ee9ab2e53e3dfad575da33b49be1125bb922e33494f498828');
    deepStrictEqual(
      sol.getPublicKey(key),
      hex.decode('1b2f49096e3e5dbd0fcfa9c0c0cd92d9ab3b21544b34d5dd4a65d98b878b9922')
    );
  });
  should('address from public key', () => {
    const key = hex.decode('1b2f49096e3e5dbd0fcfa9c0c0cd92d9ab3b21544b34d5dd4a65d98b878b9922');
    deepStrictEqual(sol.formatPublic(key), '2q7pyhPwAwZ3QMfZrnAbDhnh9mDUqycszcpf86VgQxhF');
  });
  should('format private key base58', () => {
    const key = hex.decode('99da9559e15e913ee9ab2e53e3dfad575da33b49be1125bb922e33494f498828');
    deepStrictEqual(
      sol.formatPrivate(key),
      '45QmaP6zVBfDPLWrbtaMiVFKbRLPwwAqXHiDkx2FcUHZoV1uU6uB8cZyGBKQbiExXyyzghaE65THFi2h8mSwkFuj'
    );
  });
  should('format private key hex', () => {
    const key = hex.decode('99da9559e15e913ee9ab2e53e3dfad575da33b49be1125bb922e33494f498828');
    deepStrictEqual(
      sol.formatPrivate(key, 'hex'),
      '99da9559e15e913ee9ab2e53e3dfad575da33b49be1125bb922e33494f4988281b2f49096e3e5dbd0fcfa9c0c0cd92d9ab3b21544b34d5dd4a65d98b878b9922'
    );
  });
  should('format private key array', () => {
    const key = hex.decode('99da9559e15e913ee9ab2e53e3dfad575da33b49be1125bb922e33494f498828');
    deepStrictEqual(
      sol.formatPrivate(key, 'array'),
      [
        153, 218, 149, 89, 225, 94, 145, 62, 233, 171, 46, 83, 227, 223, 173, 87, 93, 163, 59, 73,
        190, 17, 37, 187, 146, 46, 51, 73, 79, 73, 136, 40, 27, 47, 73, 9, 110, 62, 93, 189, 15,
        207, 169, 192, 192, 205, 146, 217, 171, 59, 33, 84, 75, 52, 213, 221, 74, 101, 217, 139,
        135, 139, 153, 34,
      ]
    );
  });
  should('format private key throws', () => {
    const key = hex.decode('99da9559e15e913ee9ab2e53e3dfad575da33b49be1125bb922e33494f498828');
    throws(() => sol.formatPrivate(key, 'foobar'));
  });
  should(`Key generation`, () => {
    for (let i = 0; i < vectors.keypair.length; i++) {
      const { priv, pub } = vectors.keypair[i];
      const address = sol.getAddress(hex.decode(priv).slice(0, 32));
      deepStrictEqual(address, pub);
    }
  });
  should('shortVec encode', () => {
    for (const [_hex, exp] of shortVecVectors) {
      const bytes = hex.decode(_hex);
      deepStrictEqual(sol.shortU16.decode(bytes), exp);
      deepStrictEqual(sol.shortU16.encode(exp), bytes);
    }
    deepStrictEqual(sol.shortU16.decode(new Uint8Array(0)), 0);
  });
  should('message', () => {
    const data = {
      TAG: 'legacy',
      data: {
        header: { requiredSignatures: 2, readSigned: 0, readUnsigned: 1 },
        keys: [
          'tkA8v2UimqAMydd96Bt7eCNRMBj3Y5v2f5ppfSPevGi',
          '8WYTyUSQnjur5LEK2M8Z88KefbmC7BbpyKwCJaKyU1hC',
          '3sNzSjg8pmvbcRb8wgL6SvRqNLbkLha38hRUEWKVdC1M',
        ],
        blockhash: 'J2BjKU6L83eehHVgoze6uTXGCBu6nbxsqEro9QvWpU52',
        instructions: [{ programIdx: 2, keys: [1, 0], data: Uint8Array.of() }],
      },
    };
    deepStrictEqual(
      sol.MessageRaw.encode(data),
      hex.decode(
        '020001030d416b6d000c3755a8f26d60055a55d9c1f9e1c7eb69a26a0f607ae9021181cb6f933ac79a156bbc4c067fc695e1a4711379d4567166f3479dffb1c2258eebd32a9f4768afe2d0e672096a346f64f32736415326a6352a37596e3ceb8e51d200fce463fd6b571c62c287dc02d1e1a47f6eaa4c5479c779c2ab05d79a856d65bd010202010000'
      )
    );
  });
  should('transaction', () => {
    const privKey = new Uint8Array(32).fill(8);
    const source = sol.getAddress(privKey);
    const blockhash = 'EETubP5AKHgjPAhzPAFcb8BAY1hMH639CWCFTqi3hq1k';
    const destination = 'J3dxNj7nDRRqRRXuEMynDG57DkZK4jYRuv3Garmb1i99';
    const expUnsigned = base64.decode(
      `AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEDE5j2LG0aRXxRumpLXz29L2n8qTIWIY3ImX5Ba9F9k8r9Q5/Mtmcn8onFxt47xKj+XdXXd3C8j/FcPu7csUrz/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAxJrndgN4IFTxep3s6kO0ROug7bEsbx0xxuDkqEvwUusBAgIAAQwCAAAAMQAAAAAAAAA=`
    );
    const expSigned = base64.decode(
      `AVuErQHaXv0SG0/PchunfxHKt8wMRfMZzqV0tkC5qO6owYxWU2v871AoWywGoFQr4z+q/7mE8lIufNl/kxj+nQ0BAAEDE5j2LG0aRXxRumpLXz29L2n8qTIWIY3ImX5Ba9F9k8r9Q5/Mtmcn8onFxt47xKj+XdXXd3C8j/FcPu7csUrz/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAxJrndgN4IFTxep3s6kO0ROug7bEsbx0xxuDkqEvwUusBAgIAAQwCAAAAMQAAAAAAAAA=`
    );
    const unsigned = sol.Transaction.encode({
      msg: {
        version: 'legacy',
        feePayer: source,
        blockhash,
        instructions: [sol.sys.transferSol({ source, destination, amount: 49n })],
      },
      signatures: {},
    });
    deepStrictEqual(unsigned, expUnsigned);
    deepStrictEqual(base64.decode(sol.signTx(privKey, unsigned)[1]), expSigned);
    sol.verifyTx(expSigned);
    throws(() => sol.verifyTx(expUnsigned));
    const message = base64.encode(
      sol.Message.encode({
        version: 'legacy',
        feePayer: '2KW2XRd9kwqet15Aha2oK3tYvd3nWbTFH1MBiRAv1BE1',
        blockhash: 'EETubP5AKHgjPAhzPAFcb8BAY1hMH639CWCFTqi3hq1k',
        instructions: [
          {
            program: '11111111111111111111111111111111',
            keys: [
              {
                address: '2KW2XRd9kwqet15Aha2oK3tYvd3nWbTFH1MBiRAv1BE1',
                sign: true,
                write: true,
              },
              {
                address: 'J3dxNj7nDRRqRRXuEMynDG57DkZK4jYRuv3Garmb1i99',
                sign: false,
                write: true,
              },
            ],
            data: new Uint8Array([2, 0, 0, 0, 49, 0, 0, 0, 0, 0, 0, 0]),
          },
        ],
      })
    );
    deepStrictEqual(sol.getMessageFromTransaction(base64.encode(expSigned)), message);
    deepStrictEqual(sol.getMessageFromTransaction(base64.encode(expUnsigned)), message);
  });
  should('sys/createAccount', () => {
    const opt = {
      payer: '73c3aLQxue8M6Kj9Y3gxhkxzFeyB8vxYJLTw7Z8RxstQ',
      newAccount: 'BvMRjBKGsr8NiAkRKC3h7tu1xvJQ2LK9hpQP783sNdQf',
      lamports: 123n,
      space: 0n,
      programAddress: '11111111111111111111111111111111',
    };
    deepStrictEqual(sol.sys.createAccount(opt), {
      program: '11111111111111111111111111111111',
      keys: [
        { address: '73c3aLQxue8M6Kj9Y3gxhkxzFeyB8vxYJLTw7Z8RxstQ', sign: true, write: true },
        { address: 'BvMRjBKGsr8NiAkRKC3h7tu1xvJQ2LK9hpQP783sNdQf', sign: true, write: true },
      ],
      data: hex.decode(
        '000000007b0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
      ),
    });
    deepStrictEqual(sol.parseInstruction(sol.sys.createAccount(opt)), {
      TAG: 'createAccount',
      data: opt,
    });
    deepStrictEqual(
      hintInstruction(sol.sys.createAccount(opt)),
      'Create new account=BvMRjBKGsr8NiAkRKC3h7tu1xvJQ2LK9hpQP783sNdQf with balance of 0.000000123 and owner program 11111111111111111111111111111111, using funding account 73c3aLQxue8M6Kj9Y3gxhkxzFeyB8vxYJLTw7Z8RxstQ'
    );
  });
  should('sys/transfer (123)', () => {
    const opt = {
      source: '9zM2WpVSyTKBmjpMiG7JTkmyRBdPVcKqCLQPnhMLqTxr',
      destination: '3gqrRcuQ8xprBhymXS1FctNxi8hbw3bz5EgKBUgSWiQH',
      amount: 123n,
    };
    deepStrictEqual(sol.sys.transferSol(opt), {
      program: '11111111111111111111111111111111',
      keys: [
        { address: '9zM2WpVSyTKBmjpMiG7JTkmyRBdPVcKqCLQPnhMLqTxr', sign: true, write: true },
        { address: '3gqrRcuQ8xprBhymXS1FctNxi8hbw3bz5EgKBUgSWiQH', sign: false, write: true },
      ],
      data: hex.decode('020000007b00000000000000'),
    });
    deepStrictEqual(sol.parseInstruction(sol.sys.transferSol(opt)), {
      TAG: 'transferSol',
      data: opt,
    });
    deepStrictEqual(
      hintInstruction(sol.sys.transferSol(opt)),
      'Transfer 0.000000123 SOL from 9zM2WpVSyTKBmjpMiG7JTkmyRBdPVcKqCLQPnhMLqTxr to 3gqrRcuQ8xprBhymXS1FctNxi8hbw3bz5EgKBUgSWiQH'
    );
  });
  should('sys/transfer (2**53)', () => {
    const opt = {
      source: 'DV8e8SwcZEaPEGDsLEh3HmXySxbMGaC2TSVCh2Pz6UF1',
      destination: '6y6nyKZKU3kuhSHdGT9YQ63DSj2tWoqKB8xui2cofqqj',
      amount: 2n ** 53n,
    };
    deepStrictEqual(sol.sys.transferSol(opt), {
      program: '11111111111111111111111111111111',
      keys: [
        { address: 'DV8e8SwcZEaPEGDsLEh3HmXySxbMGaC2TSVCh2Pz6UF1', sign: true, write: true },
        { address: '6y6nyKZKU3kuhSHdGT9YQ63DSj2tWoqKB8xui2cofqqj', sign: false, write: true },
      ],
      data: hex.decode('020000000000000000002000'),
    });
  });
  should('sys/transfer (2**53-1)', () => {
    const opt = {
      source: 'DV8e8SwcZEaPEGDsLEh3HmXySxbMGaC2TSVCh2Pz6UF1',
      destination: '6y6nyKZKU3kuhSHdGT9YQ63DSj2tWoqKB8xui2cofqqj',
      amount: BigInt(2 ** 53 - 1),
    };
    deepStrictEqual(sol.sys.transferSol(opt), {
      program: '11111111111111111111111111111111',
      keys: [
        { address: 'DV8e8SwcZEaPEGDsLEh3HmXySxbMGaC2TSVCh2Pz6UF1', sign: true, write: true },
        { address: '6y6nyKZKU3kuhSHdGT9YQ63DSj2tWoqKB8xui2cofqqj', sign: false, write: true },
      ],
      data: hex.decode('02000000ffffffffffff1f00'),
    });
  });
  should('sys/transfer (2**54-1)', () => {
    // JS related stuff, 2**54-1 is 2**54. It is broken, but compatible with official sdk.
    // NOTE: for safety it is better to always use bigint here
    const opt = {
      source: 'DV8e8SwcZEaPEGDsLEh3HmXySxbMGaC2TSVCh2Pz6UF1',
      destination: '6y6nyKZKU3kuhSHdGT9YQ63DSj2tWoqKB8xui2cofqqj',
      amount: BigInt(2 ** 54 - 1),
    };
    deepStrictEqual(sol.sys.transferSol(opt), {
      program: '11111111111111111111111111111111',
      keys: [
        { address: 'DV8e8SwcZEaPEGDsLEh3HmXySxbMGaC2TSVCh2Pz6UF1', sign: true, write: true },
        { address: '6y6nyKZKU3kuhSHdGT9YQ63DSj2tWoqKB8xui2cofqqj', sign: false, write: true },
      ],
      data: hex.decode('020000000000000000004000'),
    });
  });
  should('sys/transfer (2**54-1)', () => {
    const opt = {
      source: 'DV8e8SwcZEaPEGDsLEh3HmXySxbMGaC2TSVCh2Pz6UF1',
      destination: '6y6nyKZKU3kuhSHdGT9YQ63DSj2tWoqKB8xui2cofqqj',
      amount: 2n ** 54n,
    };
    deepStrictEqual(sol.sys.transferSol(opt), {
      program: '11111111111111111111111111111111',
      keys: [
        { address: 'DV8e8SwcZEaPEGDsLEh3HmXySxbMGaC2TSVCh2Pz6UF1', sign: true, write: true },
        { address: '6y6nyKZKU3kuhSHdGT9YQ63DSj2tWoqKB8xui2cofqqj', sign: false, write: true },
      ],
      data: hex.decode('020000000000000000004000'),
    });
  });
  should('sys/transferWithSeed', () => {
    const opt = {
      source: 'Bb8JGELn5e5qRwqemmrA8xvT6gcv8ztWmFeQWwiLYGnP',
      baseAccount: 'BFwz5Z8JaBWsBuGryY825efJ4kbPja4RQERiE9DiAi5v',
      destination: 'GDw2Qb8r5k1sgGAsgCfyhGyXSJcgYemyRAydGv9suY44',
      amount: 123n,
      fromSeed: '你好',
      fromOwner: '2aMNa8LhHAaNmYmFgfMwFmCJ5EwtGoLCfnLyTD9GzfWQ',
    };
    deepStrictEqual(sol.sys.transferSolWithSeed(opt), {
      program: '11111111111111111111111111111111',
      keys: [
        { address: 'Bb8JGELn5e5qRwqemmrA8xvT6gcv8ztWmFeQWwiLYGnP', sign: false, write: true },
        { address: 'BFwz5Z8JaBWsBuGryY825efJ4kbPja4RQERiE9DiAi5v', sign: true, write: false },
        { address: 'GDw2Qb8r5k1sgGAsgCfyhGyXSJcgYemyRAydGv9suY44', sign: false, write: true },
      ],
      data: hex.decode(
        '0b0000007b000000000000000600000000000000e4bda0e5a5bd1766e362b7b878195712f96df720a3da61df014d0033ba212305d2f4247b33d9'
      ),
    });
    deepStrictEqual(sol.parseInstruction(sol.sys.transferSolWithSeed(opt)), {
      TAG: 'transferSolWithSeed',
      data: opt,
    });
  });
  should('sys/allocate', () => {
    const opt = {
      newAccount: 'J8djW2D33VPaNonXZVrbF1vQGne2GP777dTbHoTMg9sD',
      space: 42n,
    };
    deepStrictEqual(sol.sys.allocate(opt), {
      program: '11111111111111111111111111111111',
      keys: [{ address: 'J8djW2D33VPaNonXZVrbF1vQGne2GP777dTbHoTMg9sD', sign: true, write: true }],
      data: hex.decode('080000002a00000000000000'),
    });
    deepStrictEqual(sol.parseInstruction(sol.sys.allocate(opt)), {
      TAG: 'allocate',
      data: opt,
    });
  });
  should('sys/allocateWithSeed', () => {
    const opt = {
      newAccount: '2c78yokQde2r2GptX4Vnp7yZCpSAvjvvzYf2cHes3bTB',
      baseAccount: 'DrHjam4NZ4fuPyQwBWf739jvuwsgxrDhMuARN22R6KhP',
      seed: '你好',
      space: 42n,
      base: 'CdJ5MP9tSABwMutQY351jFwRhCbFi1wUtG6Py7nVYRku',
      programAddress: 'CdJ5MP9tSABwMutQY351jFwRhCbFi1wUtG6Py7nVYRku',
    };
    deepStrictEqual(sol.sys.allocateWithSeed(opt), {
      program: '11111111111111111111111111111111',
      keys: [
        { address: '2c78yokQde2r2GptX4Vnp7yZCpSAvjvvzYf2cHes3bTB', sign: false, write: true },
        { address: 'DrHjam4NZ4fuPyQwBWf739jvuwsgxrDhMuARN22R6KhP', sign: true, write: false },
      ],
      data: hex.decode(
        '09000000acbcc5a8e19d39623ab882def3ab9da4bd418ffb9cb683c517cc400a8245d88a0600000000000000e4bda0e5a5bd2a00000000000000acbcc5a8e19d39623ab882def3ab9da4bd418ffb9cb683c517cc400a8245d88a'
      ),
    });
    deepStrictEqual(sol.parseInstruction(sol.sys.allocateWithSeed(opt)), {
      TAG: 'allocateWithSeed',
      data: opt,
    });
  });
  should('sys/assign', () => {
    const opt = {
      programAddress: '7WCuK6QTsBTaunr9aTmfwxRjmMA7ahsHxJgdGt4sV2SH',
      account: '3RDNFUs75piNzG65Fpa6bRXP6F53MKg7dMVegSHGnUwD',
    };
    deepStrictEqual(sol.sys.assign(opt), {
      program: '11111111111111111111111111111111',
      keys: [{ address: '3RDNFUs75piNzG65Fpa6bRXP6F53MKg7dMVegSHGnUwD', sign: true, write: true }],
      data: hex.decode('0100000060a16c2dfc05d5a4512b63d104e28fa9681ac21403d9f0190316fe0e40e1ef7e'),
    });
    deepStrictEqual(sol.parseInstruction(sol.sys.assign(opt)), {
      TAG: 'assign',
      data: opt,
    });
    deepStrictEqual(
      hintInstruction(sol.sys.assign(opt)),
      'Assign account=3RDNFUs75piNzG65Fpa6bRXP6F53MKg7dMVegSHGnUwD to owner program=7WCuK6QTsBTaunr9aTmfwxRjmMA7ahsHxJgdGt4sV2SH'
    );
  });
  should('sys/assignWithSeed', () => {
    const opt = {
      account: 'Gp1NpkLNDp4e3JAhLA2an6Rz3ymLFUXaGFzRd1nmUa2s',
      baseAccount: 'FTHMr5U69DcAh4LJBvT4wow2TzDV2yzDbMY1mdbKYdfQ',
      seed: '你好',
      base: '2eJvfLDzajKacGgWd6ud1xV5ksuv1Zeu6amhVUhTCqUL',
      programAddress: '2eJvfLDzajKacGgWd6ud1xV5ksuv1Zeu6amhVUhTCqUL',
    };
    deepStrictEqual(sol.sys.assignWithSeed(opt), {
      program: '11111111111111111111111111111111',
      keys: [
        { address: 'Gp1NpkLNDp4e3JAhLA2an6Rz3ymLFUXaGFzRd1nmUa2s', sign: false, write: true },
        { address: 'FTHMr5U69DcAh4LJBvT4wow2TzDV2yzDbMY1mdbKYdfQ', sign: true, write: false },
      ],
      data: hex.decode(
        '0a000000186a71e75b8674a108b9c3c54255253e82979ba8165391cefe676be4a0404c090600000000000000e4bda0e5a5bd186a71e75b8674a108b9c3c54255253e82979ba8165391cefe676be4a0404c09'
      ),
    });
    deepStrictEqual(sol.parseInstruction(sol.sys.assignWithSeed(opt)), {
      TAG: 'assignWithSeed',
      data: opt,
    });
  });
  should('sys/createAccountWithSeed', () => {
    const opt = {
      payer: 'GEzF93wbgs9uPNahfuuTLGywp2LzVUgT72rMwCYj5hm9',
      newAccount: 'FDwkzWGxx6LfCfzcmVVLEk3QUMxNhuFuKEMRwzR4Dtys',
      baseAccount: 'CYqupYdRbLwG1evQBGppZfTcDU2GZWBhKTXmYMkcjm4r',
      seed: 'hi there',
      amount: 123n,
      space: 0n,
      base: '11111111111111111111111111111111',
      programAddress: 'GEzF93wbgs9uPNahfuuTLGywp2LzVUgT72rMwCYj5hm9',
    };
    deepStrictEqual(sol.sys.createAccountWithSeed(opt), {
      program: '11111111111111111111111111111111',
      keys: [
        { address: 'GEzF93wbgs9uPNahfuuTLGywp2LzVUgT72rMwCYj5hm9', sign: true, write: true },
        { address: 'FDwkzWGxx6LfCfzcmVVLEk3QUMxNhuFuKEMRwzR4Dtys', sign: false, write: true },
        { address: 'CYqupYdRbLwG1evQBGppZfTcDU2GZWBhKTXmYMkcjm4r', sign: true, write: false },
      ],
      data: hex.decode(
        '030000000000000000000000000000000000000000000000000000000000000000000000080000000000000068692074686572657b000000000000000000000000000000e2749484eb4668457e8845f7c4935834e00d939594210d07e5cb1bf4d7a0c100'
      ),
    });
    deepStrictEqual(sol.parseInstruction(sol.sys.createAccountWithSeed(opt)), {
      TAG: 'createAccountWithSeed',
      data: opt,
    });
  });
  should('sys/initializeNonce', () => {
    const opt = {
      nonceAccount: '5HqyqjsFMX2tfGGDpGUwqr7dq4nA9V5xLJ1kPkHgF4uC',
      nonceAuthority: 'BVnmvPc91Gd23uzKJuPrxqFqaDN6zx74PxKDemF7LsbL',
    };
    deepStrictEqual(sol.sys.initializeNonceAccount(opt), {
      program: '11111111111111111111111111111111',
      keys: [
        { address: '5HqyqjsFMX2tfGGDpGUwqr7dq4nA9V5xLJ1kPkHgF4uC', sign: false, write: true },
        { address: 'SysvarRecentB1ockHashes11111111111111111111', sign: false, write: false },
        { address: 'SysvarRent111111111111111111111111111111111', sign: false, write: false },
      ],
      data: hex.decode('060000009bf4e3a92effc58cde859bd7b7a3cdd2f9b2f17d9882d4578ea2006def215a67'),
    });
    deepStrictEqual(sol.parseInstruction(sol.sys.initializeNonceAccount(opt)), {
      TAG: 'initializeNonceAccount',
      data: opt,
    });
  });
  should('sys/advanceNonce', () => {
    const opt = {
      nonceAccount: 'BkbGz5uBKb7F5v21PUe9AWpRg7JyAZp7wmPywUkMZuA3',
      nonceAuthority: '3ECJhLBQ9DAuKBKNjQGLEk3YqoFcF1YvhdayQ2C96eXF',
    };
    deepStrictEqual(sol.sys.advanceNonceAccount(opt), {
      program: '11111111111111111111111111111111',
      keys: [
        { address: 'BkbGz5uBKb7F5v21PUe9AWpRg7JyAZp7wmPywUkMZuA3', sign: false, write: true },
        { address: 'SysvarRecentB1ockHashes11111111111111111111', sign: false, write: false },
        { address: '3ECJhLBQ9DAuKBKNjQGLEk3YqoFcF1YvhdayQ2C96eXF', sign: true, write: false },
      ],
      data: hex.decode('04000000'),
    });
    deepStrictEqual(sol.parseInstruction(sol.sys.advanceNonceAccount(opt)), {
      TAG: 'advanceNonceAccount',
      data: opt,
    });
    deepStrictEqual(
      hintInstruction(sol.sys.advanceNonceAccount(opt)),
      'Consume nonce in nonce account=BkbGz5uBKb7F5v21PUe9AWpRg7JyAZp7wmPywUkMZuA3 (owner: 3ECJhLBQ9DAuKBKNjQGLEk3YqoFcF1YvhdayQ2C96eXF)'
    );
  });
  should('sys/withdrawFromNonce', () => {
    const opt = {
      nonceAccount: 'FThSRTXNUEseFA7ZVPUAVbjAS3dWUtzyehnYxERgSy8K',
      nonceAuthority: '7ssLmqfddcmkY5yTGFR1QHi6asuL15LyBnTG5GSSxiXN',
      recipientAccount: 'FwRPnndp5M5N6aLLZr6Dx9XMbLMQoJ9zLk2cB3easfej',
      withdrawAmount: 123n,
    };
    deepStrictEqual(sol.sys.withdrawNonceAccount(opt), {
      program: '11111111111111111111111111111111',
      keys: [
        { address: 'FThSRTXNUEseFA7ZVPUAVbjAS3dWUtzyehnYxERgSy8K', sign: false, write: true },
        { address: 'FwRPnndp5M5N6aLLZr6Dx9XMbLMQoJ9zLk2cB3easfej', sign: false, write: true },
        { address: 'SysvarRecentB1ockHashes11111111111111111111', sign: false, write: false },
        { address: 'SysvarRent111111111111111111111111111111111', sign: false, write: false },
        { address: '7ssLmqfddcmkY5yTGFR1QHi6asuL15LyBnTG5GSSxiXN', sign: true, write: false },
      ],
      data: hex.decode('050000007b00000000000000'),
    });
    deepStrictEqual(sol.parseInstruction(sol.sys.withdrawNonceAccount(opt)), {
      TAG: 'withdrawNonceAccount',
      data: opt,
    });
    deepStrictEqual(
      hintInstruction(sol.sys.withdrawNonceAccount(opt)),
      'Withdraw 0.000000123 SOL from nonce account=FThSRTXNUEseFA7ZVPUAVbjAS3dWUtzyehnYxERgSy8K (owner: 7ssLmqfddcmkY5yTGFR1QHi6asuL15LyBnTG5GSSxiXN) to FwRPnndp5M5N6aLLZr6Dx9XMbLMQoJ9zLk2cB3easfej'
    );
  });
  should('sys/authorizeNonce', () => {
    const opt = {
      nonceAccount: 'Hozo7TadHq6PMMiGLGNvgk79Hvj5VTAM7Ny2bamQ2m8q',
      nonceAuthority: 'gyUeBThw5uL4PXSjSAtCUFnL4LtRXZf87NXGgxT6eNs',
      newNonceAuthority: '4WmPCPTYwtMS7eM6WbfRd21H6VAA8eubEPzEDdt5WKfT',
    };
    deepStrictEqual(sol.sys.authorizeNonceAccount(opt), {
      program: '11111111111111111111111111111111',
      keys: [
        { address: 'Hozo7TadHq6PMMiGLGNvgk79Hvj5VTAM7Ny2bamQ2m8q', sign: false, write: true },
        { address: 'gyUeBThw5uL4PXSjSAtCUFnL4LtRXZf87NXGgxT6eNs', sign: true, write: false },
      ],
      data: hex.decode('0700000034331681a7865c8f592f712e17a7120f65c3c4172fd5293108847b4a46a1e4e6'),
    });
    deepStrictEqual(sol.parseInstruction(sol.sys.authorizeNonceAccount(opt)), {
      TAG: 'authorizeNonceAccount',
      data: opt,
    });
    deepStrictEqual(
      hintInstruction(sol.sys.authorizeNonceAccount(opt)),
      'Change owner of nonce account=Hozo7TadHq6PMMiGLGNvgk79Hvj5VTAM7Ny2bamQ2m8q from gyUeBThw5uL4PXSjSAtCUFnL4LtRXZf87NXGgxT6eNs to 4WmPCPTYwtMS7eM6WbfRd21H6VAA8eubEPzEDdt5WKfT'
    );
  });
  should('programAddress', () => {
    let p = sol.programAddress('BPFLoader1111111111111111111111111111111111', new Uint8Array([]));
    deepStrictEqual(p, 'EXWkUCz3YJU9TDVk39ogA4TwoVsUi75ZDhH6yT7acPgQ');
  });
  should('tokenAddress', () => {
    const tokenA = sol.tokenAddress({
      mint: '7o36UsWR1JQLpZ9PE2gn9L4SQ69CNNiWAXd4Jt7rqz9Z',
      owner: 'B8UwBUUnKwCyKuGMbFKWaG7exYdDk2ozZrPg72NyVbfj',
      tokenProgram: sol.TOKEN_PROGRAM,
    });
    deepStrictEqual(tokenA, 'DShWnroshVbeUp28oopA3Pu7oFPDBtC1DBmPECXXAQ9n');
    // Top holders of PYUSD
    const tokenB = sol.tokenAddress({
      mint: '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo',
      owner: '22Wnk8PwyWZV7BfkZGJEKT9jGGdtvu7xY6EXeRh7zkBa',
      tokenProgram: sol.TOKEN_PROGRAM2022,
    });
    deepStrictEqual(tokenB, '5nu6HDY7t1Ds8oPNsArrhb1rzvRqmGubyteyAUncFyNb');
    const tokenC = sol.tokenAddress({
      mint: '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo',
      owner: 'BNXnu85Kt1VXSYYYNMXtRfRrscyETxcdsEiTLSToQYZa',
      tokenProgram: sol.TOKEN_PROGRAM2022,
    });
    deepStrictEqual(tokenC, '8Ycmt6GTtXcmaTXXRZVLATBQHKKFRaFpD6DD4wx81M4');
    // TODO: how to check? It is kinda nice check, but IDL is more flexible here.
    // Do we even need that check?
    // throws(() =>
    //   sol.tokenAddress2({
    //     mint: '7o36UsWR1JQLpZ9PE2gn9L4SQ69CNNiWAXd4Jt7rqz9Z',
    //     tokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    //     owner: tokenA,
    //   })
    // );
  });
  describe('token', () => {
    should('initializeMint', () => {
      const t = sol.token.initializeMint({
        mint: '7o36UsWR1JQLpZ9PE2gn9L4SQ69CNNiWAXd4Jt7rqz9Z',
        decimals: 2,
        mintAuthority: 'DShWnroshVbeUp28oopA3Pu7oFPDBtC1DBmPECXXAQ9n',
        freezeAuthority: 'DShWnroshVbeUp28oopA3Pu7oFPDBtC1DBmPECXXAQ9n',
      });
      deepStrictEqual(t, {
        program: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        keys: [
          { address: '7o36UsWR1JQLpZ9PE2gn9L4SQ69CNNiWAXd4Jt7rqz9Z', sign: false, write: true },
          { address: 'SysvarRent111111111111111111111111111111111', sign: false, write: false },
        ],
        data: hex.decode(
          '0002b8e1927f2da9f65b5f42129930d617974313b6a198e03b6f2ce83bf714d78f8101b8e1927f2da9f65b5f42129930d617974313b6a198e03b6f2ce83bf714d78f81'
        ),
      });
    });
    should('initializeMint (optional)', () => {
      const t = sol.token.initializeMint({
        mint: '7o36UsWR1JQLpZ9PE2gn9L4SQ69CNNiWAXd4Jt7rqz9Z',
        decimals: 2,
        mintAuthority: 'DShWnroshVbeUp28oopA3Pu7oFPDBtC1DBmPECXXAQ9n',
      });
      deepStrictEqual(t, {
        program: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        keys: [
          { address: '7o36UsWR1JQLpZ9PE2gn9L4SQ69CNNiWAXd4Jt7rqz9Z', sign: false, write: true },
          { address: 'SysvarRent111111111111111111111111111111111', sign: false, write: false },
        ],
        // NOTE: verified with original implementation
        data: hex.decode('0002b8e1927f2da9f65b5f42129930d617974313b6a198e03b6f2ce83bf714d78f8100'),
      });
    });
    should('initializeAccount', () => {
      const t = sol.token.initializeAccount({
        mint: '7o36UsWR1JQLpZ9PE2gn9L4SQ69CNNiWAXd4Jt7rqz9Z',
        account: 'DShWnroshVbeUp28oopA3Pu7oFPDBtC1DBmPECXXAQ9n',
        owner: 'Hozo7TadHq6PMMiGLGNvgk79Hvj5VTAM7Ny2bamQ2m8q',
      });
      deepStrictEqual(t, {
        program: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        keys: [
          { address: 'DShWnroshVbeUp28oopA3Pu7oFPDBtC1DBmPECXXAQ9n', sign: false, write: true },
          { address: '7o36UsWR1JQLpZ9PE2gn9L4SQ69CNNiWAXd4Jt7rqz9Z', sign: false, write: false },
          { address: 'Hozo7TadHq6PMMiGLGNvgk79Hvj5VTAM7Ny2bamQ2m8q', sign: false, write: false },
          { address: 'SysvarRent111111111111111111111111111111111', sign: false, write: false },
        ],
        data: hex.decode('01'),
      });
    });
    should('transfer', () => {
      const t = sol.token.transfer({
        source: '7o36UsWR1JQLpZ9PE2gn9L4SQ69CNNiWAXd4Jt7rqz9Z',
        destination: 'DShWnroshVbeUp28oopA3Pu7oFPDBtC1DBmPECXXAQ9n',
        authority: 'Hozo7TadHq6PMMiGLGNvgk79Hvj5VTAM7Ny2bamQ2m8q',
        amount: 123n,
      });
      deepStrictEqual(t, {
        program: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        keys: [
          { address: '7o36UsWR1JQLpZ9PE2gn9L4SQ69CNNiWAXd4Jt7rqz9Z', sign: false, write: true },
          { address: 'DShWnroshVbeUp28oopA3Pu7oFPDBtC1DBmPECXXAQ9n', sign: false, write: true },
          { address: 'Hozo7TadHq6PMMiGLGNvgk79Hvj5VTAM7Ny2bamQ2m8q', sign: true, write: false },
        ],
        data: hex.decode('037b00000000000000'),
      });
    });
    should('transfer (2**53-1)', () => {
      const t = sol.token.transfer({
        source: '7o36UsWR1JQLpZ9PE2gn9L4SQ69CNNiWAXd4Jt7rqz9Z',
        destination: 'DShWnroshVbeUp28oopA3Pu7oFPDBtC1DBmPECXXAQ9n',
        authority: 'Hozo7TadHq6PMMiGLGNvgk79Hvj5VTAM7Ny2bamQ2m8q',
        amount: 2n ** 53n - 1n,
      });
      deepStrictEqual(t, {
        program: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        keys: [
          { address: '7o36UsWR1JQLpZ9PE2gn9L4SQ69CNNiWAXd4Jt7rqz9Z', sign: false, write: true },
          { address: 'DShWnroshVbeUp28oopA3Pu7oFPDBtC1DBmPECXXAQ9n', sign: false, write: true },
          { address: 'Hozo7TadHq6PMMiGLGNvgk79Hvj5VTAM7Ny2bamQ2m8q', sign: true, write: false },
        ],
        data: hex.decode('03ffffffffffff1f00'),
      });
    });
    should('approve', () => {
      const t = sol.token.approve({
        source: '7o36UsWR1JQLpZ9PE2gn9L4SQ69CNNiWAXd4Jt7rqz9Z',
        delegate: 'DShWnroshVbeUp28oopA3Pu7oFPDBtC1DBmPECXXAQ9n',
        owner: 'Hozo7TadHq6PMMiGLGNvgk79Hvj5VTAM7Ny2bamQ2m8q',
        amount: 123n,
      });
      deepStrictEqual(t, {
        program: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        keys: [
          { address: '7o36UsWR1JQLpZ9PE2gn9L4SQ69CNNiWAXd4Jt7rqz9Z', sign: false, write: true },
          { address: 'DShWnroshVbeUp28oopA3Pu7oFPDBtC1DBmPECXXAQ9n', sign: false, write: false },
          { address: 'Hozo7TadHq6PMMiGLGNvgk79Hvj5VTAM7Ny2bamQ2m8q', sign: true, write: false },
        ],
        data: hex.decode('047b00000000000000'),
      });
    });
    should('revoke', () => {
      const t = sol.token.revoke({
        source: '7o36UsWR1JQLpZ9PE2gn9L4SQ69CNNiWAXd4Jt7rqz9Z',
        owner: 'DShWnroshVbeUp28oopA3Pu7oFPDBtC1DBmPECXXAQ9n',
      });
      deepStrictEqual(t, {
        program: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        keys: [
          { address: '7o36UsWR1JQLpZ9PE2gn9L4SQ69CNNiWAXd4Jt7rqz9Z', sign: false, write: true },
          { address: 'DShWnroshVbeUp28oopA3Pu7oFPDBtC1DBmPECXXAQ9n', sign: true, write: false },
        ],
        data: hex.decode('05'),
      });
    });
    should('setAuthority (new)', () => {
      const t = sol.token.setAuthority({
        owned: '7o36UsWR1JQLpZ9PE2gn9L4SQ69CNNiWAXd4Jt7rqz9Z',
        newAuthority: 'DShWnroshVbeUp28oopA3Pu7oFPDBtC1DBmPECXXAQ9n',
        authorityType: { TAG: 'freezeAccount' },
        owner: 'Hozo7TadHq6PMMiGLGNvgk79Hvj5VTAM7Ny2bamQ2m8q',
      });
      deepStrictEqual(t, {
        program: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        keys: [
          { address: '7o36UsWR1JQLpZ9PE2gn9L4SQ69CNNiWAXd4Jt7rqz9Z', sign: false, write: true },
          { address: 'Hozo7TadHq6PMMiGLGNvgk79Hvj5VTAM7Ny2bamQ2m8q', sign: true, write: false },
        ],
        data: hex.decode('060101b8e1927f2da9f65b5f42129930d617974313b6a198e03b6f2ce83bf714d78f81'),
      });
    });
    should('setAuthority', () => {
      const t = sol.token.setAuthority({
        owned: '7o36UsWR1JQLpZ9PE2gn9L4SQ69CNNiWAXd4Jt7rqz9Z',
        authorityType: { TAG: 'closeAccount' },
        owner: 'Hozo7TadHq6PMMiGLGNvgk79Hvj5VTAM7Ny2bamQ2m8q',
      });
      deepStrictEqual(t, {
        program: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        keys: [
          { address: '7o36UsWR1JQLpZ9PE2gn9L4SQ69CNNiWAXd4Jt7rqz9Z', sign: false, write: true },
          { address: 'Hozo7TadHq6PMMiGLGNvgk79Hvj5VTAM7Ny2bamQ2m8q', sign: true, write: false },
        ],
        //     data: Uint8Array(3) [ 6, 3, 0 ]
        data: hex.decode('060300'),
      });
    });
    should('mintTo', () => {
      const t = sol.token.mintTo({
        mint: '7o36UsWR1JQLpZ9PE2gn9L4SQ69CNNiWAXd4Jt7rqz9Z',
        token: 'DShWnroshVbeUp28oopA3Pu7oFPDBtC1DBmPECXXAQ9n',
        mintAuthority: 'Hozo7TadHq6PMMiGLGNvgk79Hvj5VTAM7Ny2bamQ2m8q',
        amount: 123n,
      });
      deepStrictEqual(t, {
        program: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        keys: [
          { address: '7o36UsWR1JQLpZ9PE2gn9L4SQ69CNNiWAXd4Jt7rqz9Z', sign: false, write: true },
          { address: 'DShWnroshVbeUp28oopA3Pu7oFPDBtC1DBmPECXXAQ9n', sign: false, write: true },
          { address: 'Hozo7TadHq6PMMiGLGNvgk79Hvj5VTAM7Ny2bamQ2m8q', sign: true, write: false },
        ],
        data: hex.decode('077b00000000000000'),
      });
    });
    should('burn', () => {
      const t = sol.token.burn({
        mint: '7o36UsWR1JQLpZ9PE2gn9L4SQ69CNNiWAXd4Jt7rqz9Z',
        account: 'DShWnroshVbeUp28oopA3Pu7oFPDBtC1DBmPECXXAQ9n',
        authority: 'Hozo7TadHq6PMMiGLGNvgk79Hvj5VTAM7Ny2bamQ2m8q',
        amount: 123n,
      });
      deepStrictEqual(t, {
        program: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        keys: [
          { address: 'DShWnroshVbeUp28oopA3Pu7oFPDBtC1DBmPECXXAQ9n', sign: false, write: true },
          { address: '7o36UsWR1JQLpZ9PE2gn9L4SQ69CNNiWAXd4Jt7rqz9Z', sign: false, write: true },
          { address: 'Hozo7TadHq6PMMiGLGNvgk79Hvj5VTAM7Ny2bamQ2m8q', sign: true, write: false },
        ],
        data: hex.decode('087b00000000000000'),
      });
    });
    should('closeAccount', () => {
      const t = sol.token.closeAccount({
        account: '7o36UsWR1JQLpZ9PE2gn9L4SQ69CNNiWAXd4Jt7rqz9Z',
        destination: 'DShWnroshVbeUp28oopA3Pu7oFPDBtC1DBmPECXXAQ9n',
        owner: 'Hozo7TadHq6PMMiGLGNvgk79Hvj5VTAM7Ny2bamQ2m8q',
        amount: 123n,
      });
      deepStrictEqual(t, {
        program: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        keys: [
          { address: '7o36UsWR1JQLpZ9PE2gn9L4SQ69CNNiWAXd4Jt7rqz9Z', sign: false, write: true },
          { address: 'DShWnroshVbeUp28oopA3Pu7oFPDBtC1DBmPECXXAQ9n', sign: false, write: true },
          { address: 'Hozo7TadHq6PMMiGLGNvgk79Hvj5VTAM7Ny2bamQ2m8q', sign: true, write: false },
        ],
        data: hex.decode('09'),
      });
    });
    should('freezeAccount', () => {
      const t = sol.token.freezeAccount({
        account: '7o36UsWR1JQLpZ9PE2gn9L4SQ69CNNiWAXd4Jt7rqz9Z',
        mint: 'DShWnroshVbeUp28oopA3Pu7oFPDBtC1DBmPECXXAQ9n',
        owner: 'Hozo7TadHq6PMMiGLGNvgk79Hvj5VTAM7Ny2bamQ2m8q',
      });
      deepStrictEqual(t, {
        program: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        keys: [
          { address: '7o36UsWR1JQLpZ9PE2gn9L4SQ69CNNiWAXd4Jt7rqz9Z', sign: false, write: true },
          { address: 'DShWnroshVbeUp28oopA3Pu7oFPDBtC1DBmPECXXAQ9n', sign: false, write: false },
          { address: 'Hozo7TadHq6PMMiGLGNvgk79Hvj5VTAM7Ny2bamQ2m8q', sign: true, write: false },
        ],
        data: hex.decode('0a'),
      });
    });
    should('thawAccount', () => {
      const t = sol.token.thawAccount({
        account: '7o36UsWR1JQLpZ9PE2gn9L4SQ69CNNiWAXd4Jt7rqz9Z',
        mint: 'DShWnroshVbeUp28oopA3Pu7oFPDBtC1DBmPECXXAQ9n',
        owner: 'Hozo7TadHq6PMMiGLGNvgk79Hvj5VTAM7Ny2bamQ2m8q',
      });
      deepStrictEqual(t, {
        program: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        keys: [
          { address: '7o36UsWR1JQLpZ9PE2gn9L4SQ69CNNiWAXd4Jt7rqz9Z', sign: false, write: true },
          { address: 'DShWnroshVbeUp28oopA3Pu7oFPDBtC1DBmPECXXAQ9n', sign: false, write: false },
          { address: 'Hozo7TadHq6PMMiGLGNvgk79Hvj5VTAM7Ny2bamQ2m8q', sign: true, write: false },
        ],
        data: hex.decode('0b'),
      });
    });
    should('transferChecked', () => {
      const t = sol.token.transferChecked({
        source: '7o36UsWR1JQLpZ9PE2gn9L4SQ69CNNiWAXd4Jt7rqz9Z',
        mint: 'DShWnroshVbeUp28oopA3Pu7oFPDBtC1DBmPECXXAQ9n',
        destination: 'Hozo7TadHq6PMMiGLGNvgk79Hvj5VTAM7Ny2bamQ2m8q',
        authority: '3ECJhLBQ9DAuKBKNjQGLEk3YqoFcF1YvhdayQ2C96eXF',
        amount: 123n,
        decimals: 10,
      });
      deepStrictEqual(t, {
        program: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        keys: [
          { address: '7o36UsWR1JQLpZ9PE2gn9L4SQ69CNNiWAXd4Jt7rqz9Z', sign: false, write: true },
          { address: 'DShWnroshVbeUp28oopA3Pu7oFPDBtC1DBmPECXXAQ9n', sign: false, write: false },
          { address: 'Hozo7TadHq6PMMiGLGNvgk79Hvj5VTAM7Ny2bamQ2m8q', sign: false, write: true },
          { address: '3ECJhLBQ9DAuKBKNjQGLEk3YqoFcF1YvhdayQ2C96eXF', sign: true, write: false },
        ],
        data: hex.decode('0c7b000000000000000a'),
      });
    });
    should('approveChecked', () => {
      const t = sol.token.approveChecked({
        source: '7o36UsWR1JQLpZ9PE2gn9L4SQ69CNNiWAXd4Jt7rqz9Z',
        mint: 'DShWnroshVbeUp28oopA3Pu7oFPDBtC1DBmPECXXAQ9n',
        delegate: 'Hozo7TadHq6PMMiGLGNvgk79Hvj5VTAM7Ny2bamQ2m8q',
        owner: '3ECJhLBQ9DAuKBKNjQGLEk3YqoFcF1YvhdayQ2C96eXF',
        amount: 123n,
        decimals: 10,
      });
      deepStrictEqual(t, {
        program: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        keys: [
          { address: '7o36UsWR1JQLpZ9PE2gn9L4SQ69CNNiWAXd4Jt7rqz9Z', sign: false, write: true },
          { address: 'DShWnroshVbeUp28oopA3Pu7oFPDBtC1DBmPECXXAQ9n', sign: false, write: false },
          { address: 'Hozo7TadHq6PMMiGLGNvgk79Hvj5VTAM7Ny2bamQ2m8q', sign: false, write: false },
          { address: '3ECJhLBQ9DAuKBKNjQGLEk3YqoFcF1YvhdayQ2C96eXF', sign: true, write: false },
        ],
        data: hex.decode('0d7b000000000000000a'),
      });
    });
    should('mintToChecked', () => {
      const t = sol.token.mintToChecked({
        mint: '7o36UsWR1JQLpZ9PE2gn9L4SQ69CNNiWAXd4Jt7rqz9Z',
        token: 'DShWnroshVbeUp28oopA3Pu7oFPDBtC1DBmPECXXAQ9n',
        mintAuthority: 'Hozo7TadHq6PMMiGLGNvgk79Hvj5VTAM7Ny2bamQ2m8q',
        amount: 123n,
        decimals: 10,
      });
      deepStrictEqual(t, {
        program: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        keys: [
          { address: '7o36UsWR1JQLpZ9PE2gn9L4SQ69CNNiWAXd4Jt7rqz9Z', sign: false, write: true },
          { address: 'DShWnroshVbeUp28oopA3Pu7oFPDBtC1DBmPECXXAQ9n', sign: false, write: true },
          { address: 'Hozo7TadHq6PMMiGLGNvgk79Hvj5VTAM7Ny2bamQ2m8q', sign: true, write: false },
        ],
        data: hex.decode('0e7b000000000000000a'),
      });
    });
    should('burnChecked', () => {
      const t = sol.token.burnChecked({
        account: '7o36UsWR1JQLpZ9PE2gn9L4SQ69CNNiWAXd4Jt7rqz9Z',
        mint: 'DShWnroshVbeUp28oopA3Pu7oFPDBtC1DBmPECXXAQ9n',
        authority: 'Hozo7TadHq6PMMiGLGNvgk79Hvj5VTAM7Ny2bamQ2m8q',
        amount: 123n,
        decimals: 10,
      });
      deepStrictEqual(t, {
        program: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        keys: [
          { address: '7o36UsWR1JQLpZ9PE2gn9L4SQ69CNNiWAXd4Jt7rqz9Z', sign: false, write: true },
          { address: 'DShWnroshVbeUp28oopA3Pu7oFPDBtC1DBmPECXXAQ9n', sign: false, write: true },
          { address: 'Hozo7TadHq6PMMiGLGNvgk79Hvj5VTAM7Ny2bamQ2m8q', sign: true, write: false },
        ],
        data: hex.decode('0f7b000000000000000a'),
      });
    });
    should('syncNative', () => {
      const t = sol.token.syncNative({
        account: '7o36UsWR1JQLpZ9PE2gn9L4SQ69CNNiWAXd4Jt7rqz9Z',
      });
      deepStrictEqual(t, {
        program: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        keys: [
          { address: '7o36UsWR1JQLpZ9PE2gn9L4SQ69CNNiWAXd4Jt7rqz9Z', sign: false, write: true },
        ],
        data: hex.decode('11'),
      });
    });

    should('associatedToken', () => {
      const t = sol.associatedToken.createAssociatedToken({
        mint: '7o36UsWR1JQLpZ9PE2gn9L4SQ69CNNiWAXd4Jt7rqz9Z',
        ata: 'DShWnroshVbeUp28oopA3Pu7oFPDBtC1DBmPECXXAQ9n',
        owner: 'Hozo7TadHq6PMMiGLGNvgk79Hvj5VTAM7Ny2bamQ2m8q',
        payer: '3ECJhLBQ9DAuKBKNjQGLEk3YqoFcF1YvhdayQ2C96eXF',
      });
      deepStrictEqual(t, {
        program: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
        keys: [
          { address: '3ECJhLBQ9DAuKBKNjQGLEk3YqoFcF1YvhdayQ2C96eXF', sign: true, write: true },
          { address: 'DShWnroshVbeUp28oopA3Pu7oFPDBtC1DBmPECXXAQ9n', sign: false, write: true },
          { address: 'Hozo7TadHq6PMMiGLGNvgk79Hvj5VTAM7Ny2bamQ2m8q', sign: false, write: false },
          { address: '7o36UsWR1JQLpZ9PE2gn9L4SQ69CNNiWAXd4Jt7rqz9Z', sign: false, write: false },
          { address: '11111111111111111111111111111111', sign: false, write: false },
          { address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', sign: false, write: false },
          //       { address: 'SysvarRent111111111111111111111111111111111', sign: false, write: false },
        ],
        data: new Uint8Array([0]),
      });
      deepStrictEqual(
        sol.parseInstruction(t, {
          '7o36UsWR1JQLpZ9PE2gn9L4SQ69CNNiWAXd4Jt7rqz9Z': { symbol: 'USDT' },
        }),
        {
          TAG: 'createAssociatedToken',
          data: {
            payer: '3ECJhLBQ9DAuKBKNjQGLEk3YqoFcF1YvhdayQ2C96eXF',
            ata: 'DShWnroshVbeUp28oopA3Pu7oFPDBtC1DBmPECXXAQ9n',
            owner: 'Hozo7TadHq6PMMiGLGNvgk79Hvj5VTAM7Ny2bamQ2m8q',
            mint: '7o36UsWR1JQLpZ9PE2gn9L4SQ69CNNiWAXd4Jt7rqz9Z',
          },
        }
      );
      deepStrictEqual(
        hintInstruction(t, {
          '7o36UsWR1JQLpZ9PE2gn9L4SQ69CNNiWAXd4Jt7rqz9Z': { symbol: 'USDT' },
        }),
        'Initialize associated token account=DShWnroshVbeUp28oopA3Pu7oFPDBtC1DBmPECXXAQ9n with owner=Hozo7TadHq6PMMiGLGNvgk79Hvj5VTAM7Ny2bamQ2m8q for token=USDT, payed by 3ECJhLBQ9DAuKBKNjQGLEk3YqoFcF1YvhdayQ2C96eXF'
      );
      // Unknown token!
      deepStrictEqual(sol.parseInstruction({ ...t, data: new Uint8Array([0]) }, {}), {
        TAG: 'createAssociatedToken',
        data: {
          payer: '3ECJhLBQ9DAuKBKNjQGLEk3YqoFcF1YvhdayQ2C96eXF',
          ata: 'DShWnroshVbeUp28oopA3Pu7oFPDBtC1DBmPECXXAQ9n', // ata should be optional and derived from mint+owner
          owner: 'Hozo7TadHq6PMMiGLGNvgk79Hvj5VTAM7Ny2bamQ2m8q',
          mint: '7o36UsWR1JQLpZ9PE2gn9L4SQ69CNNiWAXd4Jt7rqz9Z',
        },
      });
      deepStrictEqual(
        hintInstruction({ ...t, data: new Uint8Array([0]) }, {}),
        'Initialize associated token account=DShWnroshVbeUp28oopA3Pu7oFPDBtC1DBmPECXXAQ9n with owner=Hozo7TadHq6PMMiGLGNvgk79Hvj5VTAM7Ny2bamQ2m8q for token=7o36UsWR1JQLpZ9PE2gn9L4SQ69CNNiWAXd4Jt7rqz9Z, payed by 3ECJhLBQ9DAuKBKNjQGLEk3YqoFcF1YvhdayQ2C96eXF'
      );
    });
  });
});

should.runWhen(import.meta.url);
