import { concatBytes } from '@noble/hashes/utils';
import { base58, hex, utf8 } from '@scure/base';
import * as P from 'micro-packed';
import { describe, should } from 'micro-should';
import { deepStrictEqual } from 'node:assert';
import * as sol from '../lib/esm/index.js';

// This is compatible with solana-cli sign-offchain-message
// https://docs.anza.xyz/cli/examples/sign-offchain-message/
describe('Offchain messages', () => {
  should('ascii', () => {
    const bytes = new Uint8Array([
      255, 115, 111, 108, 97, 110, 97, 32, 111, 102, 102, 99, 104, 97, 105, 110, 0, 0, 12, 0, 84,
      101, 115, 116, 32, 77, 101, 115, 115, 97, 103, 101,
    ]);
    deepStrictEqual(sol.Offchain.MessageRaw.decode(bytes), {
      magic: undefined,
      version: {
        TAG: 0,
        data: {
          format: 'ascii',
          msg: new Uint8Array([84, 101, 115, 116, 32, 77, 101, 115, 115, 97, 103, 101]),
        },
      },
    });
    deepStrictEqual(sol.Offchain.Message.encode({ version: 0, msg: 'Test Message' }), bytes);
  });
  should('utf8', () => {
    const bytes = new Uint8Array([
      255, 115, 111, 108, 97, 110, 97, 32, 111, 102, 102, 99, 104, 97, 105, 110, 0, 1, 35, 0, 208,
      162, 208, 181, 209, 129, 209, 130, 208, 190, 208, 178, 208, 190, 208, 181, 32, 209, 129, 208,
      190, 208, 190, 208, 177, 209, 137, 208, 181, 208, 189, 208, 184, 208, 181,
    ]);
    deepStrictEqual(sol.Offchain.MessageRaw.decode(bytes), {
      magic: undefined,
      version: {
        TAG: 0,
        data: {
          format: 'utf8',
          msg: new Uint8Array([
            208, 162, 208, 181, 209, 129, 209, 130, 208, 190, 208, 178, 208, 190, 208, 181, 32, 209,
            129, 208, 190, 208, 190, 208, 177, 209, 137, 208, 181, 208, 189, 208, 184, 208, 181,
          ]),
        },
      },
    });
    deepStrictEqual(sol.Offchain.Message.encode({ version: 0, msg: 'Тестовое сообщение' }), bytes);
  });
  should('sign/verify', () => {
    const privateKey = hex.decode(
      '99da9559e15e913ee9ab2e53e3dfad575da33b49be1125bb922e33494f498828'
    );
    const pubKey = base58.decode(sol.getAddress(privateKey));
    const pubKey2 = base58.decode('AqP3MyNwDP4L1GJKYhzmaAUdrjzpqJUZjahM7kHpgavm');
    const VECTORS = [
      {
        msg: 'Hello, World!',
        sig: '4fkQYPZCu9HktkMcA4bXwEMo9Awm6cHLJQdBCQjQMQLPZQvHQPS9hAPXPCL76fhV6CQQR5kHPG8P1qoGp1JBUgRg',
      },
      {
        msg: 'lol',
        sig: '4gLGi4Kb63tk1TDgbPkCvQjUbQYTyW4Eiv9Fw1krmXJnEqJ3k6Q16MQyuhYfpm6jnxdRZuySBJovEqnyXADvBvz3',
      },
      {
        msg: '1'.repeat(2000),
        sig: 'o8NwVKDzKaFumZNsjwv9eys1ZE9FXvYViStgVE1rZSb4yw7uXfjghUXDQSaD52hyTQhZLjKNtwbUbjaNLzo1TtC',
      },
    ];
    for (const { msg, sig } of VECTORS) {
      deepStrictEqual(sol.Offchain.sign(privateKey, msg), sig);
      deepStrictEqual(sol.Offchain.verify(sig, pubKey, msg), true);
      deepStrictEqual(
        sol.Offchain.verify(sig, '2q7pyhPwAwZ3QMfZrnAbDhnh9mDUqycszcpf86VgQxhF', msg),
        true
      );
      deepStrictEqual(sol.Offchain.verify(sig, pubKey2, msg), false);
    }
  });
  should('signBytes', () => {
    // Compat with signBytes/verifySignature in @solana/kit
    // https://solana.com/developers/cookbook/wallets/sign-message
    const privateKey = hex.decode(
      '99da9559e15e913ee9ab2e53e3dfad575da33b49be1125bb922e33494f498828'
    );
    const bytes = utf8.decode('Hello, World!');
    const sig =
      '5ZGZjRyiAtV1HL3fTPGiFPiLR67csjmr3Ti7DocUxghghjkoRhM3WCcQdAthyfWba5j3fSZrAkZWqyJD5dxfDFQx';
    deepStrictEqual(sol.signBytes(privateKey, bytes), sig);
    deepStrictEqual(sol.verifyBytes(sig, sol.getAddress(privateKey), bytes), true);
  });
  should('sol_signMessage (phantom)', () => {
    // 1. Import privateKey 45QmaP6zVBfDPLWrbtaMiVFKbRLPwwAqXHiDkx2FcUHZoV1uU6uB8cZyGBKQbiExXyyzghaE65THFi2h8mSwkFuj to phantom
    // 2.
    // const encodedMessage = new TextEncoder().encode("Message to sign");
    // const signedMessage = await window.solana.request({
    //   method: "signMessage",
    //   params: {
    //     message: encodedMessage,
    //     display: "utf8", //hex,utf8
    //   },
    // });
    deepStrictEqual(
      sol.verifyBytes(
        base58.encode(
          new Uint8Array([
            80, 38, 210, 56, 207, 116, 24, 165, 27, 114, 97, 223, 106, 219, 215, 125, 148, 49, 249,
            62, 51, 61, 130, 107, 154, 135, 226, 183, 113, 25, 175, 235, 214, 181, 241, 187, 47,
            170, 27, 155, 21, 197, 81, 252, 176, 109, 59, 14, 173, 33, 110, 61, 37, 190, 185, 130,
            5, 168, 1, 125, 174, 123, 164, 11,
          ])
        ),
        '2q7pyhPwAwZ3QMfZrnAbDhnh9mDUqycszcpf86VgQxhF',
        new TextEncoder().encode('Message to sign')
      ),
      true
    );
    // https://r3byv.csb.app/ + Sign message
    const privateKey = hex.decode(
      '99da9559e15e913ee9ab2e53e3dfad575da33b49be1125bb922e33494f498828'
    );
    /*
    Logs:
    Message signed: {"signature":{"type":"Buffer","data":[116,88,92,134,23,185,47,194,120,16,122,195,14,90,227,186,182,88,30,141,129,199,2,78,235,92,208,156,162,158,220,167,2,127,183,195,42,239,235,106,160,183,151,80,133,77,236,57,118,183,148,154,154,88,163,132,72,251,99,124,125,126,69,2]},"publicKey":"2q7pyhPwAwZ3QMfZrnAbDhnh9mDUqycszcpf86VgQxhF"}
    */
    deepStrictEqual(
      sol.signBytes(
        privateKey,
        utf8.decode('To avoid digital dognappers, sign below to authenticate with CryptoCorgis.')
      ),
      base58.encode(
        new Uint8Array([
          116, 88, 92, 134, 23, 185, 47, 194, 120, 16, 122, 195, 14, 90, 227, 186, 182, 88, 30, 141,
          129, 199, 2, 78, 235, 92, 208, 156, 162, 158, 220, 167, 2, 127, 183, 195, 42, 239, 235,
          106, 160, 183, 151, 80, 133, 77, 236, 57, 118, 183, 148, 154, 154, 88, 163, 132, 72, 251,
          99, 124, 125, 126, 69, 2,
        ])
      )
    );
  });
  should('solana_signMessage (wallet connect)', () => {
    /*

    // Request
{
"id": 1,
"jsonrpc": "2.0",
"method": "solana_signMessage",
"params": {
"message": "37u9WtQpcm6ULa3VtWDFAWoQc1hUvybPrA3dtx99tgHvvcE7pKRZjuGmn7VX2tC3JmYDYGG7",
"pubkey": "AqP3MyNwDP4L1GJKYhzmaAUdrjzpqJUZjahM7kHpgavm"
}
}
// Result
{
"id": 1,
"jsonrpc": "2.0",
"result": { signature: "2Lb1KQHWfbV3pWMqXZveFWqneSyhH95YsgCENRWnArSkLydjN1M42oB82zSd6BBdGkM9pE6sQLQf1gyBh8KWM2c4" }
}
    */
    const sig =
      '2Lb1KQHWfbV3pWMqXZveFWqneSyhH95YsgCENRWnArSkLydjN1M42oB82zSd6BBdGkM9pE6sQLQf1gyBh8KWM2c4';
    const pubKey = 'AqP3MyNwDP4L1GJKYhzmaAUdrjzpqJUZjahM7kHpgavm';
    const msg = '37u9WtQpcm6ULa3VtWDFAWoQc1hUvybPrA3dtx99tgHvvcE7pKRZjuGmn7VX2tC3JmYDYGG7';
    const result = {
      basic_utf8: sol.verifyBytes(sig, pubKey, utf8.decode(msg)),

      basic_base58: sol.verifyBytes(sig, pubKey, base58.decode(msg)),
      // https://docs.tomo.inc/tomo-sdk/tomo-telegram-sdk/wallet-provider/solana-provider (Sign message)
      basic_tomo: sol.verifyBytes(
        sig,
        pubKey,
        concatBytes(new Uint8Array([0xff]), utf8.decode('solana offchain'), base58.decode(msg))
      ),
      basic_tomo2: sol.verifyBytes(
        sig,
        pubKey,
        concatBytes(utf8.decode('\xffsolana offchain'), base58.decode(msg))
      ),
      basic_tomo3: sol.verifyBytes(
        sig,
        pubKey,
        concatBytes(utf8.decode('\xffsolana offchain' + msg))
      ),
      offchain: sol.Offchain.verify(sig, pubKey, msg),
    };
    // console.log('signMessage', result);

    const msgRaw = base58.decode(msg);

    // console.log('raw', msgRaw);
    const t = P.struct({
      a: P.U32LE,
      b: P.U32LE,
      c: P.U32LE,
      d: P.U32LE,
      e: P.U32LE,
      w: P.bytes(32), // pkey?
      x: P.U8,
    });
    // console.log('decoded', t.decode(msgRaw, {}));
  });
});

should.runWhen(import.meta.url);
