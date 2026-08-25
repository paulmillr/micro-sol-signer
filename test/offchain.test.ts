import { concatBytes } from '@noble/hashes/utils.js';
import { describe, it } from '@paulmillr/jsbt/test.js';
import { base58, hex, utf8 } from '@scure/base';
import * as P from 'micro-packed';
import { deepStrictEqual, throws } from 'node:assert';
import * as sol from '../src/index.ts';

// This is compatible with solana-cli sign-offchain-message
// https://docs.anza.xyz/cli/examples/sign-offchain-message/
describe('Offchain messages', () => {
  it('ascii', () => {
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
  it('MessageRaw.decode does not alias decoded message bytes', () => {
    const raw = new Uint8Array([
      255, 115, 111, 108, 97, 110, 97, 32, 111, 102, 102, 99, 104, 97, 105, 110, 0, 0, 1, 0, 65,
    ]);
    const out = sol.Offchain.MessageRaw.decode(raw);
    out.version.data.msg[0] = 66;
    deepStrictEqual(
      raw,
      new Uint8Array([
        255, 115, 111, 108, 97, 110, 97, 32, 111, 102, 102, 99, 104, 97, 105, 110, 0, 0, 1, 0, 65,
      ])
    );
  });
  it('MessageRaw rejects malformed display preambles', () => {
    const raw = (format: number, msg: Uint8Array) =>
      concatBytes(
        Uint8Array.of(0xff),
        utf8.decode('solana offchain'),
        Uint8Array.of(0, format, msg.length & 0xff, msg.length >>> 8),
        msg
      );
    const malformed = [
      ['ascii', 0, new Uint8Array()],
      ['ascii', 0, utf8.decode('Approve\nTransfer 1000')],
      ['ascii', 0, utf8.decode('é')],
      ['ascii', 0, new Uint8Array(1213).fill(0x41)],
      ['utf8', 1, new Uint8Array()],
      ['utf8', 1, Uint8Array.of(0xc3, 0x28)],
      ['utf8', 1, new Uint8Array(1213).fill(0x41)],
      ['utf8ext', 2, new Uint8Array()],
      ['utf8ext', 2, Uint8Array.of(0xed, 0xa0, 0x80)],
      ['utf8ext', 2, new Uint8Array(65516).fill(0x41)],
    ] as const;
    for (const [format, tag, msg] of malformed) {
      const value = { magic: undefined, version: { TAG: 0, data: { format, msg } } } as any;
      const encoded = raw(tag, msg);
      throws(() => sol.Offchain.MessageRaw.encode(value), /invalid message preamble/);
      throws(() => sol.Offchain.MessageRaw.decode(encoded), /invalid message preamble/);
      throws(() => sol.Offchain.Message.decode(encoded), /invalid message preamble/);
    }
  });
  it('Message round-trips long ascii messages', () => {
    const msg = '1'.repeat(1213);
    const raw = sol.Offchain.Message.encode({ version: 0, msg });
    deepStrictEqual(sol.Offchain.MessageRaw.decode(raw), {
      magic: undefined,
      version: {
        TAG: 0,
        data: {
          format: 'utf8ext',
          msg: new Uint8Array(1213).fill(49),
        },
      },
    });
    deepStrictEqual(sol.Offchain.Message.decode(raw), { version: 0, msg });
  });
  it('Message rejects malformed high-level inputs', () => {
    throws(() => sol.Offchain.Message.encode(undefined as any), /message must be an object/);
    throws(() => sol.Offchain.Message.encode(null as any), /message must be an object/);
    throws(() => sol.Offchain.Message.encode([] as any), /message must be an object/);
    throws(() => sol.Offchain.Message.encode({ version: 1, msg: 'x' } as any), /unknown version/);
    throws(
      () => sol.Offchain.Message.encode({ version: 0, msg: 1 } as any),
      /msg must be a string/
    );
  });
  it('utf8', () => {
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
  it('sign/verify', () => {
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
  it('rejects low-order public-key signature forgeries', () => {
    const publicKey = new Uint8Array(32);
    publicKey[0] = 1; // Ed25519 identity point
    const signature = new Uint8Array(64);
    signature[0] = 1; // R = identity, S = 0
    const encodedSignature = base58.encode(signature);

    deepStrictEqual(sol.verifyBytes(encodedSignature, publicKey, utf8.decode('authorize')), false);
    deepStrictEqual(sol.Offchain.verify(encodedSignature, publicKey, 'authorize'), false);

    const tx = sol.TransactionRaw.encode({
      signatures: [signature],
      msg: {
        TAG: 'legacy',
        data: {
          header: { requiredSignatures: 1, readSigned: 0, readUnsigned: 0 },
          keys: [base58.encode(publicKey)],
          blockhash: '11111111111111111111111111111111',
          instructions: [],
        },
      },
    });
    throws(() => sol.verifyTx(tx), /invalid signature/);
  });
  it('signBytes', () => {
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
  it('sol_signMessage (phantom)', () => {
    // 1. Import privateKey
    // 45QmaP6zVBfDPLWrbtaMiVFKbRLPwwAqXHiDkx2FcUHZoV1uU6uB8cZyGBKQbiExXyyzghaE65THFi2h8mSwkFuj to
    // phantom
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
  it('solana_signMessage (wallet connect)', () => {
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

it.runWhen(import.meta.url);
