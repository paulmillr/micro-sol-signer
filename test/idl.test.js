import { deepStrictEqual, throws } from 'node:assert';
import { describe, should } from 'micro-should';
import { hex, base64 } from '@scure/base';
import * as sol from '../lib/esm/index.js';
import * as idl from '../lib/esm/idl/index.js';
import { hintInstruction } from '../lib/esm/hint.js';

describe('Solana', () => {
  describe('mapType', () => {
    should('Basic', () => {
      const VECTORS = [
        {
          type: {
            kind: 'amountTypeNode',
            decimals: 2,
            unit: 'USD',
            number: { kind: 'numberTypeNode', format: 'u32', endian: 'le' },
          },
          values: {
            '01000000': '0.01 USD',
            E8030000: '10 USD',
            '7C9C0000': '400.6 USD', // NOTE: was 400.60 in original, not sure which behaviour is best?
          },
        },
        {
          type: {
            kind: 'structFieldTypeNode',
            name: 'discriminator',
            type: { kind: 'numberTypeNode', format: 'u32', endian: 'le' },
            docs: [],
            defaultValue: { kind: 'numberValueNode', number: 1 },
            defaultValueStrategy: 'omitted',
          },
          values: {
            '01000000': undefined,
          },
        },
        {
          type: {
            kind: 'hiddenPrefixTypeNode',
            type: { kind: 'fixedSizeTypeNode', size: 5, type: { kind: 'stringTypeNode' } },
            prefix: [
              {
                kind: 'constantValueNode',
                type: { kind: 'numberTypeNode', format: 'u64', endian: 'le' },
                value: { kind: 'numberValueNode', number: 42 },
              },
            ],
          },
          values: {
            '2a00000000000000416c696365': 'Alice',
          },
        },
        {
          type: {
            kind: 'hiddenSuffixTypeNode',
            type: { kind: 'fixedSizeTypeNode', size: 5, type: { kind: 'stringTypeNode' } },
            suffix: [
              {
                kind: 'constantValueNode',
                type: { kind: 'numberTypeNode', format: 'u64', endian: 'le' },
                value: { kind: 'numberValueNode', number: 42 },
              },
            ],
          },
          values: {
            '416c6963652a00000000000000': 'Alice',
          },
        },
        {
          type: {
            kind: 'tupleTypeNode',
            items: [
              { kind: 'fixedSizeTypeNode', size: 3, type: { kind: 'stringTypeNode' } },
              { kind: 'numberTypeNode', format: 'u16', endian: 'le' },
            ],
          },
          values: {
            '666f6f2a00': ['foo', 42],
          },
        },
        // {
        //   type: {
        //     kind: 'tupleTypeNode',
        //     items: [
        //       {
        //         kind: 'preOffsetTypeNode',
        //         offset: 1,
        //         strategy: 'relative',
        //         type: { kind: 'numberTypeNode', format: 'u8', endian: 'le' },
        //       },
        //       {
        //         kind: 'preOffsetTypeNode',
        //         offset: -2,
        //         strategy: 'relative',
        //         type: { kind: 'numberTypeNode', format: 'u8', endian: 'le' },
        //       },
        //     ],
        //   },
        //   values: {
        //     ffaa: [0xaan, 0xffn],
        //   },
        // },
        // {
        //   type: {
        //     kind: 'tupleTypeNode',
        //     items: [
        //       {
        //         kind: 'preOffsetTypeNode',
        //         offset: 1,
        //         strategy: 'relative',
        //         type: { kind: 'numberTypeNode', format: 'u8', endian: 'le' },
        //       },
        //       {
        //         kind: 'preOffsetTypeNode',
        //         offset: 0,
        //         strategy: 'absolute',
        //         type: { kind: 'numberTypeNode', format: 'u8', endian: 'le' },
        //       },
        //     ],
        //   },
        //   values: {
        //     ffaa: [0xaan, 0xffn],
        //   },
        // },

        // Padding
        {
          type: {
            kind: 'tupleTypeNode',
            items: [
              {
                kind: 'preOffsetTypeNode',
                offset: 4,
                strategy: 'padded',
                type: { kind: 'numberTypeNode', format: 'u8', endian: 'le' },
              },
              { kind: 'numberTypeNode', format: 'u8', endian: 'le' },
            ],
          },
          values: {
            '00000000aaff': [0xaa, 0xff],
          },
        },
        {
          type: {
            kind: 'tupleTypeNode',
            items: [
              {
                kind: 'postOffsetTypeNode',
                offset: 4,
                strategy: 'padded',
                type: { kind: 'numberTypeNode', format: 'u8', endian: 'le' },
              },
              { kind: 'numberTypeNode', format: 'u8', endian: 'le' },
            ],
          },
          values: {
            aa00000000ff: [0xaa, 0xff],
          },
        },
        {
          type: {
            kind: 'constantValueNode',
            type: {
              kind: 'preOffsetTypeNode',
              offset: 83,
              strategy: 'padded',
              type: { kind: 'numberTypeNode', format: 'u8', endian: 'le' },
            },
            value: { kind: 'numberValueNode', number: 1 },
          },
          values: {
            '000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001':
              undefined,
          },
        },
        {
          type: {
            kind: 'optionTypeNode',
            item: { kind: 'stringTypeNode' },
            prefix: {
              kind: 'numberTypeNode',
              format: 'u16',
              endian: 'le',
            },
            fixed: false,
          },
          values: {
            '0000': undefined,
            '010048656C6C6F': 'Hello',
          },
        },
        {
          type: {
            kind: 'optionTypeNode',
            item: { kind: 'numberTypeNode', format: 'u16', endian: 'le' },
          },
          values: {
            '00': undefined,
            '012a00': 42,
          },
        },
        {
          type: {
            kind: 'optionTypeNode',
            item: { kind: 'numberTypeNode', format: 'u16', endian: 'le' },
            prefix: { kind: 'numberTypeNode', format: 'u32', endian: 'le' },
          },
          values: {
            '00000000': undefined,
            '010000002a00': 42,
          },
        },
        {
          type: {
            kind: 'optionTypeNode',
            item: { kind: 'numberTypeNode', format: 'u16', endian: 'le' },
            fixed: true,
          },
          values: {
            '000000': undefined,
            '012a00': 42,
          },
        },
        {
          type: {
            kind: 'optionTypeNode',
            item: { kind: 'numberTypeNode', format: 'u32', endian: 'le' },
            fixed: true,
          },
          values: {
            '0000000000': undefined,
            '012A000000': 42,
          },
        },
        {
          type: {
            kind: 'mapTypeNode',
            key: { kind: 'fixedSizeTypeNode', size: 3, type: { kind: 'stringTypeNode' } },
            value: { kind: 'numberTypeNode', format: 'u16', endian: 'le' },
            count: {
              kind: 'prefixedCountNode',
              prefix: { kind: 'numberTypeNode', format: 'u32', endian: 'le' },
            },
          },
          values: {
            '03000000666f6f2a00626172630062617a8a02': { foo: 42, bar: 99, baz: 650 },
          },
        },
        {
          type: {
            kind: 'mapTypeNode',
            key: { kind: 'fixedSizeTypeNode', size: 3, type: { kind: 'stringTypeNode' } },
            value: { kind: 'numberTypeNode', format: 'u16', endian: 'le' },
            count: {
              kind: 'prefixedCountNode',
              prefix: { kind: 'numberTypeNode', format: 'u64', endian: 'le' },
            },
          },
          values: {
            '0300000000000000666f6f2a00626172630062617a8a02': { foo: 42, bar: 99, baz: 650 },
          },
        },
        {
          type: {
            kind: 'mapTypeNode',
            key: { kind: 'fixedSizeTypeNode', size: 3, type: { kind: 'stringTypeNode' } },
            value: { kind: 'numberTypeNode', format: 'u16', endian: 'le' },
            count: { kind: 'fixedCountNode', value: 3 },
          },
          values: {
            '666f6f2a00626172630062617a8a02': { foo: 42, bar: 99, baz: 650 },
          },
        },
        {
          type: {
            kind: 'mapTypeNode',
            key: { kind: 'fixedSizeTypeNode', size: 3, type: { kind: 'stringTypeNode' } },
            value: { kind: 'numberTypeNode', format: 'u16', endian: 'le' },
            count: { kind: 'remainderCountNode' },
          },
          values: {
            '666f6f2a00626172630062617a8a02': { foo: 42, bar: 99, baz: 650 },
          },
        },
        {
          type: {
            kind: 'mapTypeNode',
            key: { kind: 'fixedSizeTypeNode', size: 3, type: { kind: 'stringTypeNode' } },
            value: { kind: 'numberTypeNode', format: 'u64', endian: 'le' },
            count: { kind: 'remainderCountNode' },
          },
          values: {
            '666f6f2a00000000000000626172630000000000000062617a8a02000000000000': {
              foo: 42n,
              bar: 99n,
              baz: 650n,
            },
          },
        },
        {
          type: {
            kind: 'enumTypeNode',
            variants: [
              { kind: 'enumEmptyVariantTypeNode', name: 'flip' },
              {
                kind: 'enumTupleVariantTypeNode',
                name: 'rotate',
                tuple: {
                  kind: 'tupleTypeNode',
                  items: [{ kind: 'numberTypeNode', format: 'u32', endian: 'le' }],
                },
              },
              {
                kind: 'enumStructVariantTypeNode',
                name: 'move',
                struct: {
                  kind: 'structTypeNode',
                  fields: [
                    {
                      kind: 'structFieldTypeNode',
                      name: 'x',
                      type: { kind: 'numberTypeNode', format: 'u16', endian: 'le' },
                    },
                    {
                      kind: 'structFieldTypeNode',
                      name: 'y',
                      type: { kind: 'numberTypeNode', format: 'u16', endian: 'le' },
                    },
                  ],
                },
              },
            ],
            size: { kind: 'numberTypeNode', format: 'u8', endian: 'le' },
          },
          values: {
            '00': { TAG: 'flip', data: undefined },
            '012A000000': { TAG: 'rotate', data: [42] },
            '0201000200': { TAG: 'move', data: { x: 1, y: 2 } },
          },
        },
      ];
      for (const { type, values } of VECTORS) {
        const t = idl.mapType(type);
        for (const h in values) {
          const value = values[h];
          const bytes = hex.decode(h);
          deepStrictEqual(t.encode(value), bytes);
          deepStrictEqual(t.decode(bytes), value);
        }
      }
    });
  });
  should('parseAccountData', () => {
    const VECTORS = [
      {
        contract: 'AddressLookupTab1e1111111111111111111111111',
        data: 'AQAAAP//////////hOwLEwAAAAAjAfDa2nx3jyuxB0i8o/Dat66czDl9pdFpAwxQ3YDJKOPxAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAbd9uHXZaGT2cvhRs7reawctIXtX1s3kTqM9YV+/wCpjJclj04kifG7PRApFI4NgwtaE5na/xCEBI572Nvp+FkCxMfq5YbvIYlOJqRnxp9wdfV2MXlrqEkjxpxv11PrsKkqWotPKVlShCVQqpP9W5W1rOao65IMk5QuQ2kMIOxz6wDZ9bKStCFKx9A3tNbwZFC5ZGAN83MFK7XoTy+OmmezIT+6i/nIf6keR4GWKMOD4AvqfpjHoD4DuhBpz8P28zZ/QknMUa26C/frtvzbNTKhqKkIXQHZPgO9WMBFsdLX6erQPjt7Wh/i5IT7a2G02UUtwvsqyhKyXt5j+QnpYVQpeWB+/EpXB4G88xCs6JkfLfwWWf6v1x+VUY1RXdMQmwabiFf+q4GE+2h/Y0YYwDXaxDncGus7VZig8AAAAAABFBYgdtocZuZlHsx3jsI7hKrKg3eWEfl2kB9PkSFmI5cE6eEvvIToJskyzOniZAzOFVkMHGJzsJJXCLo7hSCwvG74jVhdOGIBYCix+ujJKnULL5J6rWJ7kit6aMaBwTvNX5Lc1R7yPT6KwMHazTBnE1sTWC221VKi5hjKimtmZ2kQHQ8ZU3ueNKUAXYpShbbKFMyP5nZhhgDJXcbQl1/kA7bA/FnRq/eXQkSy2UiROdnjxEjqDa2OnQn3JM6y6WJIsnDWf6mMUc8CEwUTWJYrrzV0K+1ZydlEXpwNDIXHzZH93Hnll00Afku8/sv9QtG2u+rjcskOxDmdbSGnzzXfvPeCsXhvwvPldrcgikyC5Uan049vGX1PN8tMponHVmhBo6KqF/UCEBvDNea+RVSV7M/tLxphEW2kRV5Cd1MthHrCqpcC/klCWl0SrxQWz1hKJQru5P/QM1Oyx964EecdBMz4AtTMzITX+yG19ztJ2BoWxbTIjuMjlOHJHTWIzECAj38At9TyK64j9BvHmRbeSMQouubVKrIP7825+6tvsSHrRubPWq4cEhOLfCh1kD2H/nU5+LfFXaSvate64og/ddN0IXa4nF4UyWt0iZhCHzgQHgnlxZMxsWi2Jc0nFbsmduAQiJAdruMEeHdC4J08wE10ANS0AB1AFzEYCsUPUjj2F81FEK9wx2GSBJn4/pfVsjEaaeGaF2g8oqqki+yafd620yNV8P1o3lkyEhodlDcimU+IimfJzA+zzGmeWB2O2E4SkMGY54i6DhFPA4IUZ5YI2ij80goWMe/Dk/u/aSr3Yckr6OHkCzlFlWyaK2xknFEGtvfoSK7KmMqUNCDDrtYW5WMzOLVlvQG9Anngzn2OmUIqoOReR7Dr0izAoMgiGj29i5bnx81OHaTBsvdONSnOOJqstgtOGdwPVmtwO/yhr2ElCp49g6hTOacPIlBei7iL9j5CpOyT7o7b43G0+w+/6IRtaFy9xizKfgTH6PaNzDE6sxJ34uARKi7A4FLlpdXKngTPXbWQtxS6L+MssVkTP8HBkrciV/0H05ywQB7Cc6QQ85odeIjFHKOlRlJyeSXVJmL8vb1UgOzsbJPVP0W7A8TIrrr6tmJIqjv5dVJCO/Ty17OnUJdaNUE1BqQy9IvsHWIPP2A5n79eY/6aj3q1kegKQwlv1hSJOnc5I+8xGDRxz452lvTeqRKj8jJEtb+o+UAkYGEmbw22FtBFr02+x/WP8A90NNchz/mLVODRQ+tKeOrKZ7WHrPFyC3FtpXl3z1dqPS2AjO3EcWRPyCTAeMnNam1eFF0N2nLdTY0=',
        exp: {
          TAG: 'addressLookupTable',
          data: {
            deactivationSlot: 18446744073709551615n,
            lastExtendedSlot: 319548548n,
            lastExtendedSlotStartIndex: 35,
            authority: 'HDCQMFxao4QUYKkn2rnzQSBbjkkh5UPX1b2UTqZF7vji',
            addresses: [
              '11111111111111111111111111111111',
              'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
              'BorGY4ub2Fz4RLboGxnuxWdZts7EKhUTB624AFmfCgX',
              'CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C',
              'GpMZbSM2GgvTKHJirzeGfMFoaZ8UR2X7F4v8vHTvxFbL',
              'D4FPEruKEHrG5TenZ2mpDGEfu1iUvTiqBxvpU8HLBvC2',
              '4fjZijSG3utBwadTKxd1HtTeJuUs87jng3Bq2Jfe4nFG',
              'Gk7fVy8rcvyyqm4pDCn6iMyG75AtxP6fRTebgwz89eX5',
              '3nu4bXSZmCnbJhsyydGByeeR5c7eQVW7UswSQz8kKoiz',
              'So11111111111111111111111111111111111111112',
              '2MQiwF8VzLUhYuZVAGz3noBjgU1KEReovgh17DeDswZG',
              'LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo',
              '8UBfiXc5ThqZCEh3GUKdDt8ZQJ8S6ctRP4VRfjN8UaNY',
              '7S5cojGaCKnJr34mBaM3qjEFyjfgGzSNndZTycx4auag',
              '25uDwRLEQTLgVTuFSuTMcXqhbMRct6fPQTSQ5wcN55Er',
              'DJPsxVRPSEJoujmxVJmZ82KHftvvND6jp47HrdjVVxS3',
              'D1ZN9Wj1fRSUQfCjhvnu1hqDMT7hzjzBBpi12nVniYD6',
              'J5y8zSx1t3dxBrQBf1DACJFxbcTecNkxW5LH37J4R7Sj',
              'HfBHerVP9RQw7KudEfvqbURbd3nprYFd1Cm8UjXcMLLx',
              'C1mKKxTs8avQEUSwVGJAjncadKd1mXEDavDwPUhSsrGH',
              'E6txuf3yyVSfR5t6tRSHpDUJnEZbFCTA6rANvRYaC9hm',
              'Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB',
              'Af9d7n7f2he64YqCxWWHYGY1aqS23HeSvbshqqckTLfz',
              'GqRWrV2rkanm2WLPq3wiPLFtNNfV7RyMnBKSyjdgG3Qp',
              'FERjPVNEa7Udq8CEv68h6tPL46Tq7ieE49HrE2wea3XT',
              '913GneTUBcyRLYFRSePZKN6VMbzQxqGgs5Lp5VNzGsKM',
              'HZeLxbZ9uHtSpwZC3LBr4Nubd14iHwz7bRSghRZf5VCG',
              'FzPCbxKaMGbRxRP2A7D6bzsRygQuNurBeBM1b6bi4ASR',
              'FZN7QZ8ZUUAxMPfxYEYkH3cXUASzH8EqA6B4tyCL8f1j',
              'HegBeivhdosqnhHE6v2ShkZkKPR1bige5redRQCMCBau',
              'FQiVotxSpqjRsusQpXbZ2E3FgDAB2wwP4CMmfjoEPUuF',
              '2mSCpALBqVDYwGdTLg9jijv9Hw1MmFM9wP2Bkytf333q',
              'Bt9kFz1EtqQHNQedFeb2QiFNDp3aedx1ixyTufsFwicz',
              '24Uqj9JCLxUeoC3hGfh5W3s9FM9uCHDS2SG3LYwBpyTi',
              'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK',
              'E64NGkDLLCdQ2yFNPcavaKptrEgmiQaNykUuLC1Qgwyp',
              '5hCXcuCk8NNpKLuzJgj9VqVAf6JcXRThUc9rxRP8Gotd',
              'HTcE8ABQodpAv8qKzPsgGdkkUyjqyHKMhJ1qKGEZvzDC',
              '4JePH65ZV7C8ey33mU87tCgDG7UKbiT7d6dgaPi5fjkz',
              '6EV7zLKU8kaDRC4ANy3hgrKMZQCWzVkB5k4RHmN7Prxc',
              'C8whRtFoZsu97xmLYmESJ1q4LxsiQbG37QJr995ULgbv',
            ],
          },
        },
      },
      {
        contract: 'AddressLookupTab1e1111111111111111111111111',
        data: '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',
        exp: {
          TAG: 'addressLookupTable',
          data: {
            deactivationSlot: 18446744073709551615n,
            lastExtendedSlot: 301517194n,
            lastExtendedSlotStartIndex: 22,
            authority: '9RAufBfjGQjDfrwxeyKmZWPADHSb8HcoqCdrmpqvCr1g',
            addresses: [
              '9Yycgce8GkfNiBgm9ubVXckNkW6xn66LPsqmCJo3zHHY',
              '5JCSBX7uvR1Jz7k6EjqeH3g4d1WfnqS9n9pYbiQ67GHS',
              '9N5Hk7QYHtiSJ8QJJwj5B7aUa5xEZp6s6iZhq5QnWFB6',
              'C8wWT2QF4AKDpqHLAPu561Kiey9wqyv8T6n4HmMrqyuG',
              'Hb8seBCHxdY19AygARPGLcSfFwBDMTf2ruvREhyCay86',
              '4sLTvAy5nHsGHkuV62T58UGd1ciWyWvRJyFZ1VriBiDq',
              '5H4LrwgLQoZYtogdg34quxVo8LpbSiFVFaq345ypmisW',
              'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
              'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
              'MEANeD3XDdUmNMsRGjASkSWdC8prLYsoRJ61pPeHctD',
              '5CETJEHkxe6P1fTNmEdHQA4K4hQrydv2T3knUMFDEB5L',
              'So11111111111111111111111111111111111111112',
              'HPDmrszxyuTTh6HYEuhmaUNN3x3hCKeoT5157iaaLdUY',
              'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
              'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
              'FdpkrK7yTVgGuu5LkQftSTmRGAwFupfh7sH5tM3dTVqW',
              '5v9jgJKgnqsQvx3k35fnKMmpqzHM6fJ1gYyYvGSNff1s',
              'CAZf14BFNtcFdn88P39pHhC2VHJT6MqCmUuui9sSTs5n',
              'QS3kYHhQSL1RrUPrSiB42yCTehN97YaLiAB6uW2Pp5u',
              'A6A3okEYEkvL5vbLn3Sijm1c3B1KGDQMEZ5Lh3g77TKZ',
              '2bGLMWuUV7THM6KwCa5GiEm5Pzai8Dkb4AnLzyCbefAw',
              '8HSUY6JZW1BV4f7umwu7u3P3Y1ow6ShjjDYzz4kvuB6i',
              'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              'H2d7E2Jg7FYMZkNY27MuZVqsFmoSQK942AezzHbvspZh',
              'Ae2beQBzQKJNbAjVbTbebyXXRtQF6eu4deUWgwaxUvhN',
              'So11111111111111111111111111111111111111112',
              'G9hNGtyyNdMgw8T7r5vieZL65rqyx26VApXS6hbe7BiY',
              'DNLT5TzY4eGfKvhog7hfSy1TLzLjDQSxkN824E4UbHMh',
              'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
              'EopRwtMp9LNy1n8qxray4iEBKRfgDYieoERXqACVsnzX',
              '64pPMU9kN2AYUCDe5g1nEL4PGvJJGkptmPbedUb583RJ',
              '93xHGXmMckeqH2NwUVjz7Z24Y1mDd253sVoMYvYwkgiy',
              'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
              'SFSwBSj5mc5fzGaLqqN1H6wkrcMz3Q46wdSXTVCDKWe',
              'So11111111111111111111111111111111111111112',
              '3DzHLUwqUnqRUjzL4dLaKNx5DGqGk33Zxq3zNji5HmPE',
              'B9yhLm9r6NrhEU5yTM5oWQjvntDkDc7d7h6XazmsmWqo',
              'CP9wiGir8ySQG3M5aGRC6aLrvL7PYBFSYPue7VVvSiyt',
              '76Xtj4SFmnSHJzvahcXacqYw8awPcmKjiAjGFpA7kKt7',
              'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              'BoaPLYaZGnezbEMiZow3X5LNyhUm6UfLkKtXNLbazaQH',
              '7wmfMimVenJGMfBvzvd14m3GqufdEEjrg64QvNtpdxEP',
              'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
              '8A8uiLMermNd4vJKQxk4jX6gPSwycpZXKzUXcGzUeeWb',
              'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
              'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              '71UksJvtHfEbSghasGG8g9DpGBqg1iPNns6US6KMnKa6',
              'HU5kJQHkrzTPCiyVTJdC2NELBAscE68EdswPhx3KvAuK',
              '4UR7QX5AwE5k72pFG8yf2AevxPJVPoAAWLCriZBC7eyU',
              '3zfDMCZqSEdAmxYGGfz71YxKpAFZM78EcRo7ULnxKZ88',
              'J3go4djfgcj9tqcGL7VKhQHYoJ3fPXkCgvvVFpTJu85W',
              'DrhrJoSAovc3g7vBvj6kKoqYtWY669E8SYaiHEVn8Rwd',
              'FXzTzy1bn4TA5vjgmjnitapPY2rnxqE2ujmTQiUW6Yt',
              'EM6V32WYCo24cBvQFpqVGyZfraSLJwRi7RyA7ZyJx5bj',
              '3BDab2PmahPKXYoeW3eHpHtmFANL7rERvcRo6N1TQ7f8',
              '3KWAQnMy8XhL79CuFwtosNoGibqptcKsLLhd9THh7Xmh',
              '5dSPhoUSxwSDkKN7QGY6NciQq9JGyNVd3aqqAf1ChWfq',
              'ESuvecCpZTfBzGynSuAFn3EcpL8Wd5aX2R23z6U7sHWq',
              '2aSnueMVH6HsGc9wrfeJgkXLdp4YPZZRAsGqA2AM8V8m',
              'CRaHepXh7qDMcX2BfM7aHrRvx8NJAJXuubosmqPzcja3',
              'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
              'Ht5tqAkESJBU94a55bQVpgDKNUziLCs9suR5wtnPsi2o',
              'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
              'AcXBCSNwVhcttX5fUYkGeW8jKxqKSXCpRWk3ahKkpG42',
              'So11111111111111111111111111111111111111112',
              'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              'Hbod9KvKYXmqwgPoa6HW1ghy6LN2KEFi8khBmt8jwRjL',
              '6ErekkvRPNL2zEfcv97zyfhn2F1u81r1qdodQFGkYdwp',
              'ErQBjcd7pcVsGQc2hcGJva793NxL7cMBiy7feWEDJcWz',
              '24XKy4px7RbcerTbZDwRiXecm1Gk53outvqgkS3VdcY1',
              'YYzH9wuQqbSbmsCANHyCgsFtxHFZTnVamNPBZruyMMw',
              'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
              '6DNSN2BJsaPFdFFc1zP37kkeNe4Usc1Sqkzr9C9vPWcU',
              '2QN4R3uX95DHczZHp5pMYeNTdaEAjZVWyvCP2bGgwQNS',
              '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs',
              'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              'BZFRQEQvpJsuoGk9Mdks2xJACgqcxP3pQnNGcCZDvEh1',
              '7LjMUwmDei9yW9TxFwubv2zzBCTWjbq6cPvBsDAPYPFW',
              'So11111111111111111111111111111111111111112',
              'BEhVyL6NWNoydqHBrHNpjYBJh35Jv3tandtpMoBuCgMh',
              'DXeqRa5rq6zC9Wfb7wB7639xXghKp4MUBG5WPB6wzbmv',
              '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr',
              'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
              'C3YdzJXWwCbRVaQUkUqAdnJCBioMEXHKKegVXi7GnfNN',
              'HVLg6GVkymX7jFHoKhV4V2gphEDfbP6x2by3f9yy5bgw',
              'BDKviy43Mq4GfNGKaEJsdHWDXrLdYf2Pf553g43ucr9Q',
              'FkUskRWuW8ENUKoK4nYX9ZWAcn2t5dD65XGkuFkHCKGv',
              '6ud9Kg2Y1ZpjdJmyJehnviJLhmwkcxgZFTq6N31KJhE4',
              'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
              'ED5nyyWEzpPPiWimP8vYm7sD7TD3LAt3Q3gRTWHzPJBY',
              '6tSVz2hFw7dC4w3KkVpbiiDiauvb4rnZ1sTznKbjqpvN',
              'CgNHvZMHaNpiXgxQRXZh6qAzQVkGGnF87Cirhnya97ae',
              'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              '5snXmW2LjMzCH9EAvyGRn4vCimWVS2dbkGLasup9xhJh',
              'FU1Xud4f7f3t7MvLjww57fUchDYrgem27U2ZQciKCQos',
              '3kgwjLwEbwdb6JgpUaiXY3bALdoLh1ZmWncRJbgp7iUZ',
              'ABdxcR1XYXNoJfRzNbExU2Kh6VcH1E9kWraUWLxe6XZN',
              'So11111111111111111111111111111111111111112',
              'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
              '5KHMGLzd7yn5R1ZesAGY1cg5ycZrr64mSoXqiZ4yxT2e',
              'GAUd6TgdYJwwFWyqEJykU5n5Swa3m4igFoY5QAnyGc4t',
              'C9WeGYPV6jWtCoNs1GjMnCV2d1913FGJhPYHwmWLNQtG',
              'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
              'LAinEtNLgpmCP9Rvsf5Hn8W6EhNiKLZQti1xfWMLy6X',
              'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              '6MZtFqRM5tHSUyU4eUEEEfXuxZEkHHvtPUbKtkhXENvi',
              '7CdSyhyETDz12uaSifCuhT1C8sKQNJGbdn5hMHBB2RQP',
              'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
              '2VTy9k3GhvmmG1rgFVtEYwNJ92bjvzECPQUdZ8npLenY',
              '55bdwA5K2p5FCQoBP4xzxes9etRYDBswFNbhY6CRrH6u',
              '49kaHvpYtVg9V3NsrVCdcSSn7nveMNEN7z66YqGBtbbv',
              'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
              'E8Tme2kwd2sxy9tAweindjFwhYrRxFQseYb2AUAUHRHv',
              'C5Mn8PoV4M8BP8VRAizAqDg1Wmx2iEU8ZdppnEeez79y',
              'G9Q49eG1vSREKiX3SHgXuNr9k2DrfQRWb5t4eyHBWwmT',
              '7E2xYbnTt8TccfPToUaRu6wcrZx7WxDsSSHEGV7eLZvW',
              '5vdraKS1RnQeCAQp3KL1KUvMfyHKFqq49CtZvxPnuREG',
              'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
              'F7CqqLMsEC1UeiafJkafZqpRR6saEQNCtnFNZgcmXLJQ',
              '7mB3dpzQNU4tsvgZ7K259xDFJdQixhVBooFC11hRc4Mz',
              'So11111111111111111111111111111111111111112',
              'CVLEzcSpyNS9rLZgNRNq729VvYh6LAimN6nXnRUdWdT9',
              '4xq64mrdGjKXwppWZgG3fnn4w8PUXUE7C9DAs2D7bhem',
              '3dQTr7ror2QPKQ3GbBCokJUmjErGg8kTJzdnYjNfvi3Z',
              'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
              'Gmq37iLA4r8JoZ2wPRnqoGdBD2ibX9pxWmfiziKfDkGT',
              '9q6Xf2WNdcHmdsX7AshezFr4nJWP2oaHfgjVXWXwmbGS',
              'DGjzp5iYwitHNgTxGEyUxweaCXvtpusRQWG4uUoTWZ8M',
              'KLkoFSdCpC523EmmGyJxmLv1A3itv8ZNiMZwjPmFXuk',
              '8nmVKV6JbY2KqH9XH4KizBsPznJnVro27V7rgYk3RoQd',
              'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
              '23vV22QL4kiNfYBediXNL5NX6wPEZbU9rpFtSFAR4F4X',
              'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
              'edge86g9cVz87xcpKpy3J77vbp4wYd9idEV562CCntt',
              '9AF5YANHLXRFU8WzZ1T73XaccEKA6o21QPGipPaeKavb',
              'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              'E24q6ffZXWowgVh89QYpqrSaBKUtWLtPJqcdnDHexz5D',
              'HkhP2fXBFCQbCKiubD56nTDMVsBxZFxVqHFGWfz59wfV',
              'So11111111111111111111111111111111111111112',
              'F4WdCfJYRtr9hjti4dNbtQHy6qy41S2TtANmAPJrgVph',
              'BUjvvRp9T2yjAJ4NXW995R98b6BuwQdCSeh1cinBwxGf',
              'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
              'CYZvSmkNcoUaP4rigxKfNGc1cxAJqK7E97fYXtHGD9aQ',
              'Gw9JTSwWmZEuGTzBzuKw3AVNikGMfTr1pn9aSNgofjyv',
              'CzLSujWBLFsSjncfkh59rUFqvafWcY5tzedWJSuypump',
              'BnPLMsw8As2C1W8A51cG55ZZcVHkmaqypdK11cLQb8tv',
              'DCj3GajmiyfhNP8KDVRQA7A2Cwh45iUj6Jomfk4tRcNm',
              'So11111111111111111111111111111111111111112',
              'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
              'FNHsXTPvcpVTVyR1QbWX3ZBSDaFBouPagDG8CrGTtJHF',
              'EJgv6jeKV21bbyBRLrd1dno5EhqL7GMRZn1atpVfYCgk',
              'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
              'HbYT8tvymox6vtrYwsiJkCorkKQS9cDdYtFM7YM8UHRs',
              '7xyr9nmxiyMbBDFfMjXnDwk4x2AV83RyLkF6W4CZR1g5',
              '9GTL52E8the6oCQrmaHq5cvywYFQ3Qt6w3V7HeAsw6nJ',
              '91UDHMHgrc4MU6cCkSf6KLgmL9krZ5WgyPVuNLkjwtzu',
              'So11111111111111111111111111111111111111112',
              'Ri3wGfBkYDdVpxtKMGWymJZj1MGNrU8b4UrPEgNFMn2',
              'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              'EWuE6twbWC9MMpo4HNL3soLenNhjSyhS51f1j7MhgLkp',
              'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
              'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
              'EB6RbGWBsMUbGEior1bjpQPAfEfAfMuvGuQgGp2HyyBP',
              '8EXVrjjuph2QesAcNL2AU2Y6iZA6jifjD73E4wb7sff5',
              'DGj6jKiBb1wurf1ABbwuVGG4kyjFJPpYX9MTGK8vL4jy',
              '2z9yNsW2BHENuqgK8CfjMz3EW7CMKVZKQpPTDENqZiJh',
              'CvPECcDzUN9Qz5a1tZvxPjSSveSii99kSs6KnPREJL8J',
              'USDH1SM1ojwWUga67PGrgFWUHibbjqMvuMaDkRJTgkX',
              'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
              'GHQjuFa7XY4GXPYHZ1cWtkqcCqxMQ6eNt4op7dhaVnSd',
              'DzQCnk3CXbeFYSuqdkMHTApACsAJsECAx1JKgECDKsWz',
              'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              'B7BqZ3i3crL3UjJ3G2uQcrzuRoP8QCbojsLcfEqPVavj',
              'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
              '5ZngEYAc6sasPpysJS7eNJqKM9MgVNkrMK6eXGDcDU3A',
              '8UtrSZ5yDrniY4TGJbfeNuN7RxUKNpGZM5uEzyN2CnVG',
              '4WuB7EYM6N42583EnFkWPusbWUZB5X9ESErUU5gQ5dra',
              'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
              'HPy3CwER9dZPiV8WKgQyRVdFthDMRHBLrBJviFWKKkg1',
              'Fvtf8VCjnkqbETA6KtyHYqHm26ut6w184Jqm4MQjPvv7',
              '3x9StJDG1SQfNok8sEc6TNdcF7eu1rcnGXTQA9QBP7Nz',
              '2nfo8oC657yrEgUz3QTozHGdUp776BXGWamA9uHpXD4k',
              '3tXBtcSDGG7RyH67qMYcmWRxEtW8ZuzBh4SKgjgZWZFe',
              'A9uAmRB2yqjkcnY7ruUXE7um4Qu6rSM3AuWuVJwXVT2H',
              'AYFATgSefDs9otK8yiNWT7YtyQePh1tUp6SzSzC7RiER',
              'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
              '2sjrFgug45a12XeN8Hi2e1VpVMeGoW31PHosQGXXphfb',
              'So11111111111111111111111111111111111111112',
              '2qEHjDLDLbuBgRYvsxhc5D6uDWAivNFZGan56P1tpump',
              'fmeChsVH1jMTqDM6UWkK3ZABhY1YxnBkFadmq3SppXo',
              '2DoLzCu36vVuBukX6yde4XNNiBAczQWr9arhpK3yPv81',
              'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              '51xvmEMQ7vfkEhYrgsXd11ut5GsXSFHw685bFS16t3ao',
              'CqAL2QcZaJsSDRKVVGmfL9jky6Wx2MZV7NnQiTfpFLit',
              '8qKRjvEy2pef3qJaCf3uSnEY8anBgbujK87B1HvMtBDZ',
              '7MLPdsMMV36z4gjHR9M77vr9Qhy7eGh8NMeXEsQPjDWs',
              'FS4mnapk5XTcXWQQ4mKmENFWxLpzE7N7nsF1jNzK5sto',
              'CyK24PvSmBiWnAzMFYqo2or6igRHYrWhDGMGymSkTmwW',
              '5X9Zfk5iGvxkmT3KzTy2EMidPNDQ49m41D3HwHQMgEpp',
              'So11111111111111111111111111111111111111112',
              'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
              'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
              'GXrb8TxTdNXgnfd19rE5jyCAsQJV2zpSFEjJkDdrrnJf',
              'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              'HJ9Jbqxh9QtpY1TJVc4W9ECXjYKQSH7F6XoHwXneJ2oH',
              '3zfiMmhFWgzqhYyZKXYeTeAxt51hvsTUdJAte6BPsDfK',
              '3MhXh7XR6mLzXzcxpAsj9qLzdmoKs7txbD5KsKbZ741b',
              '4gEhwPizkeyb7X5gMbhVmJXHyKPMbrxD8qG2zWjTwxg8',
              'Ey2LJ7afFcLbDivcSR4orCa5o7ScWZAXzihYJWuA6WMF',
              '5NWcmG3p6TizrwMJrcJahmuSvqHVAvVw7PRxnvdSAcoy',
              '8K83AosCyk2ndCM7n53v3MLvT4ZV1iBqEsyXFQd3EQg1',
              'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
              'BCvmWaVEkewZ6tHiYAMQdyB1u7zH5qX8ocNBRXYA3hTt',
              'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
              'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              '2ss2J63dg6FHez7DyUbsCPLu2tA4LbgHF3tiNF9PTmDP',
              'EL3ZKQSMRCTYWrqt7hiLP6PYCD1DRxP9CtEPg4UMaMTJ',
              '9UybEsmvaKfwd4DgjcdhD8U4RkfHnt1UWkH2qye83iHs',
              '5Kc9dqxNXYhYJ3ZhgsDczyjXAx6RaCCQLVHB1G19f54e',
              'DcMSCo82gJLmJTbzJeecBSEUcYYGHA6mWf1AAaScqwRJ',
              '7tAYUgs62Ww5ofc8QTbQR5E3ZBBswPsnCDbiv4w3dTCY',
              'BqnLBzV3mjsjWBqSyPaC5BHHfdx2tjTRSKL7NJ7TXpUU',
              'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
              'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
              'FWm7VPPTQ9DSweg5YV2XNo3aDWdd9QFaeNzyAvFPdymc',
              '9hYFBAezcqp8z7wB53BYHWhrTNFzwCrju983MCaXxasn',
              'FvWwAmWLVe57KnRvghBZru5ZhPAch51udyj311ibKDcq',
              'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              'medsxcj69LYPBe64Haby6mXAcXt8FUqDWMmpfX1JeJe',
              '5FQzUrrybgQRXjVPr6CP8bEQw6DvsYiYdFsuRTfZXhpd',
              'FkhRRSQDynPTqpbVnJeqSBTZcHXTMQcqyjGs1zcgJUgr',
              'JADNAKV1d2cjxfTzzaAKyaRmfwFMr4Su2P9zR9MBwUtw',
              'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
              '2SnGK29uGnPB64eJq6jdqoBemuBNuFtx4UezkEj4g2SU',
              '5xN6NgrYytpxXEinGqrsnNwRJJSMKDC1EbTBDygA7HxG',
              'uya4meXsExThM2eqsvcpNj6d7RAnMysS9R7rVeJ9FsF',
              'J6315H5sQiWkNZtN4X53DgBwaxFfnDT8TFJncTrXuTHL',
              'AL6VrnKHmJUcqJLTaC3RVJmw9LziyUQ5GNfZSYmZC6eR',
              'B5pietg36jMksbF4yc21fCDxG2T4pbkPFkTk8Qctjk6k',
              'CBdCxKo9QavR9hfShgpEBG3zekorAeD7W1jfq2o3pump',
              'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
              '5aZVocM8MdHpDYzeifMr2HFbzKBFSm6x9zwCct8RofTQ',
              'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              'ED5nyyWEzpPPiWimP8vYm7sD7TD3LAt3Q3gRTWHzPJBY',
              'GaeR8FLGQ8Sg1TmrJiMZfYMFxdG7EXsGfYwXs2BLe7mF',
              'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
              '6KBjtmwhkx2FmMFRFPYPw2fHocv4qr9DcHVtjn6AUSeH',
              '8whSnPVnuKuZnm2ednPUbAvn998nkEXmJV7qoDxrfKQ4',
              '91rBt9rL9ujJSG9HeSZhqNwzHCTvQKuAe6zjCnAMyiHs',
            ],
          },
        },
      },
    ];
    for (const { contract, data, exp } of VECTORS) {
      const dataBytes = base64.decode(data);
      deepStrictEqual(sol.decodeAccount(contract, dataBytes), exp);
      const program = sol.CONTRACTS[contract];
      deepStrictEqual(program.accounts.coders[exp.TAG].encode(exp.data), dataBytes);
    }
  });
  should('parseInstructions', () => {
    const VECTORS = [
      // Create account (1)
      {
        data: {
          program: '11111111111111111111111111111111',
          keys: [
            { address: '73c3aLQxue8M6Kj9Y3gxhkxzFeyB8vxYJLTw7Z8RxstQ', sign: true, write: true },
            { address: 'BvMRjBKGsr8NiAkRKC3h7tu1xvJQ2LK9hpQP783sNdQf', sign: true, write: true },
          ],
          data: hex.decode(
            '000000007b0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
          ),
        },
        exp: {
          TAG: 'createAccount',
          data: {
            lamports: 123n,
            space: 0n,
            programAddress: '11111111111111111111111111111111',
            payer: '73c3aLQxue8M6Kj9Y3gxhkxzFeyB8vxYJLTw7Z8RxstQ',
            newAccount: 'BvMRjBKGsr8NiAkRKC3h7tu1xvJQ2LK9hpQP783sNdQf',
          },
        },
        expHint:
          'Create new account=BvMRjBKGsr8NiAkRKC3h7tu1xvJQ2LK9hpQP783sNdQf with balance of 0.000000123 and owner program 11111111111111111111111111111111, using funding account 73c3aLQxue8M6Kj9Y3gxhkxzFeyB8vxYJLTw7Z8RxstQ',
      },
      // sys/transfer (123)
      {
        data: {
          program: '11111111111111111111111111111111',
          keys: [
            { address: '9zM2WpVSyTKBmjpMiG7JTkmyRBdPVcKqCLQPnhMLqTxr', sign: true, write: true },
            { address: '3gqrRcuQ8xprBhymXS1FctNxi8hbw3bz5EgKBUgSWiQH', sign: false, write: true },
          ],
          data: hex.decode('020000007b00000000000000'),
        },
        exp: {
          TAG: 'transferSol',
          data: {
            amount: 123n,
            source: '9zM2WpVSyTKBmjpMiG7JTkmyRBdPVcKqCLQPnhMLqTxr',
            destination: '3gqrRcuQ8xprBhymXS1FctNxi8hbw3bz5EgKBUgSWiQH',
          },
        },
        expHint:
          'Transfer 0.000000123 SOL from 9zM2WpVSyTKBmjpMiG7JTkmyRBdPVcKqCLQPnhMLqTxr to 3gqrRcuQ8xprBhymXS1FctNxi8hbw3bz5EgKBUgSWiQH',
      },
      // sys/transfer (2**53)
      {
        data: {
          program: '11111111111111111111111111111111',
          keys: [
            { address: 'DV8e8SwcZEaPEGDsLEh3HmXySxbMGaC2TSVCh2Pz6UF1', sign: true, write: true },
            { address: '6y6nyKZKU3kuhSHdGT9YQ63DSj2tWoqKB8xui2cofqqj', sign: false, write: true },
          ],
          data: hex.decode('020000000000000000002000'),
        },
        exp: {
          TAG: 'transferSol',
          data: {
            amount: 9007199254740992n,
            source: 'DV8e8SwcZEaPEGDsLEh3HmXySxbMGaC2TSVCh2Pz6UF1',
            destination: '6y6nyKZKU3kuhSHdGT9YQ63DSj2tWoqKB8xui2cofqqj',
          },
        },
        expEnc: sol.sys.transferSol({
          source: 'DV8e8SwcZEaPEGDsLEh3HmXySxbMGaC2TSVCh2Pz6UF1',
          destination: '6y6nyKZKU3kuhSHdGT9YQ63DSj2tWoqKB8xui2cofqqj',
          amount: 2n ** 53n,
        }),
      },
      // sys/transfer (2**53-1)
      {
        data: {
          program: '11111111111111111111111111111111',
          keys: [
            { address: 'DV8e8SwcZEaPEGDsLEh3HmXySxbMGaC2TSVCh2Pz6UF1', sign: true, write: true },
            { address: '6y6nyKZKU3kuhSHdGT9YQ63DSj2tWoqKB8xui2cofqqj', sign: false, write: true },
          ],
          data: hex.decode('02000000ffffffffffff1f00'),
        },
        exp: {
          TAG: 'transferSol',
          data: {
            amount: 9007199254740991n,
            source: 'DV8e8SwcZEaPEGDsLEh3HmXySxbMGaC2TSVCh2Pz6UF1',
            destination: '6y6nyKZKU3kuhSHdGT9YQ63DSj2tWoqKB8xui2cofqqj',
          },
        },
        expEnc: sol.sys.transferSol({
          source: 'DV8e8SwcZEaPEGDsLEh3HmXySxbMGaC2TSVCh2Pz6UF1',
          destination: '6y6nyKZKU3kuhSHdGT9YQ63DSj2tWoqKB8xui2cofqqj',
          amount: BigInt(2 ** 53 - 1),
        }),
      },
      // sys/transfer (2**54-1)
      {
        data: {
          program: '11111111111111111111111111111111',
          keys: [
            { address: 'DV8e8SwcZEaPEGDsLEh3HmXySxbMGaC2TSVCh2Pz6UF1', sign: true, write: true },
            { address: '6y6nyKZKU3kuhSHdGT9YQ63DSj2tWoqKB8xui2cofqqj', sign: false, write: true },
          ],
          data: hex.decode('020000000000000000004000'),
        },
        exp: {
          TAG: 'transferSol',
          data: {
            amount: 18014398509481984n,
            source: 'DV8e8SwcZEaPEGDsLEh3HmXySxbMGaC2TSVCh2Pz6UF1',
            destination: '6y6nyKZKU3kuhSHdGT9YQ63DSj2tWoqKB8xui2cofqqj',
          },
        },
        expEnc: sol.sys.transferSol({
          source: 'DV8e8SwcZEaPEGDsLEh3HmXySxbMGaC2TSVCh2Pz6UF1',
          destination: '6y6nyKZKU3kuhSHdGT9YQ63DSj2tWoqKB8xui2cofqqj',
          amount: BigInt(2 ** 54 - 1),
        }),
      },
    ];
    for (const { data, exp, expEnc, expHint } of VECTORS) {
      deepStrictEqual(sol.parseInstruction(data), exp);
      if (expHint) deepStrictEqual(hintInstruction(data), expHint);
      if (expEnc) deepStrictEqual(expEnc, data);
      const c = sol.CONTRACTS[data.program];
      deepStrictEqual(c.instructions.encoders[exp.TAG](exp.data), data);
    }
  });
  should('basic tx', async () => {
    const VECTORS = [
      // Official docs txs: https://solana.com/docs/core/tokens
      {
        tx: 'Apk3fKzUwguQ0Q1IF2aCqaj87cEVSAHoHw7O0Y/H6qdp1FvaTkwGAUbadNnEfcLXdt55D5v8YzYX3EW+sBhQpgQVBLR8Wk2o591q3bkFy9TMjobyc1ZndzV/MoEnUczL+ra9cuMfb+zALUi90TtQv8O/PmGBc4TL8VFd+5oom8EEAgADBSxbkLJCDImo/Dsv1hWonR5UT1lJ6J41j6uIZJ9b25x0eSuJgsH0qjdvDOP8rD6nkRNz/3I96dbeTNbsV+hHfI8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAan1RcZLFxRIYzJTD1K8X9Y2u4Im6H9ROPb2YoAAAAABt324ddloZPZy+FGzut5rBy0he1fWzeROoz1hX7/AKlzIFJT+O+2lkFhvvElYU83/0QmttbPZJbXWM72DoIYxwICAgABNAAAAABgTRYAAAAAAFIAAAAAAAAABt324ddloZPZy+FGzut5rBy0he1fWzeROoz1hX7/AKkEAgEDIwAJLFuQskIMiaj8Oy/WFaidHlRPWUnonjWPq4hkn1vbnHQA',
        exp: [
          {
            TAG: 'createAccount',
            data: {
              lamports: 1461600n,
              space: 82n,
              programAddress: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              payer: '3z9vL1zjN6qyAFHhHQdWYRTFAcy69pJydkZmSFBKHg1R',
              newAccount: '99zqUzQGohamfYxyo8ykTEbi91iom3CLmwCA75FK5zTg',
            },
          },
          {
            TAG: 'initializeMint',
            data: {
              decimals: 9,
              mintAuthority: '3z9vL1zjN6qyAFHhHQdWYRTFAcy69pJydkZmSFBKHg1R',
              mint: '99zqUzQGohamfYxyo8ykTEbi91iom3CLmwCA75FK5zTg',
            },
          },
        ],
        expHints: [
          'Create new account=99zqUzQGohamfYxyo8ykTEbi91iom3CLmwCA75FK5zTg with balance of 0.0014616 and owner program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA, using funding account 3z9vL1zjN6qyAFHhHQdWYRTFAcy69pJydkZmSFBKHg1R',
          undefined,
        ],
      },
      {
        tx: 'ATtpZiSRCLfziaeUatK0ADHOhKauppOswOMMohRHWafXx4LEY+LOOtzedd/FFb4jQynft8ToQxKtU79eJrRhdwYBAAQGLFuQskIMiaj8Oy/WFaidHlRPWUnonjWPq4hkn1vbnHSPgLHjoEEfVvBZHY8z4qSSYL0cwD2JEARR3T8B3mFwsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABt324ddloZPZy+FGzut5rBy0he1fWzeROoz1hX7/AKl5K4mCwfSqN28M4/ysPqeRE3P/cj3p1t5M1uxX6Ed8j4yXJY9OJInxuz0QKRSODYMLWhOZ2v8QhASOe9jb6fhZrikQEvF5Zp9/zjXMgRq4U4Lbe+aBJAyL8HxEaaa6UsMBBQYAAQAEAgMBAA==',
        exp: [
          {
            TAG: 'createAssociatedToken',
            data: {
              payer: '3z9vL1zjN6qyAFHhHQdWYRTFAcy69pJydkZmSFBKHg1R',
              ata: 'AfB7uwBEsGtrrBqPTVqEgzWed5XdYfM1psPNLmf7EeX9',
              owner: '3z9vL1zjN6qyAFHhHQdWYRTFAcy69pJydkZmSFBKHg1R',
              mint: '99zqUzQGohamfYxyo8ykTEbi91iom3CLmwCA75FK5zTg',
            },
          },
        ],
        expHints: [
          'Initialize associated token account=AfB7uwBEsGtrrBqPTVqEgzWed5XdYfM1psPNLmf7EeX9 with owner=3z9vL1zjN6qyAFHhHQdWYRTFAcy69pJydkZmSFBKHg1R for token=99zqUzQGohamfYxyo8ykTEbi91iom3CLmwCA75FK5zTg, payed by 3z9vL1zjN6qyAFHhHQdWYRTFAcy69pJydkZmSFBKHg1R',
        ],
      },
      {
        tx: 'AZlwQM9W2Op/CCyn/lYAXcSwrytT5+iGK+/LuWZJ/RfFquiVyuLGjFzIyu1QebBKPAxedEGSZsDSfmr8jR4kyQ0BAAUHLFuQskIMiaj8Oy/WFaidHlRPWUnonjWPq4hkn1vbnHT5QLRxpBvSzC/hNa0VaaR9P9eKEuXi2YcQGLQsEsFJ8wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABt324ddloZPZy+FGzut5rBy0he1fWzeROoz1hX7/AKkZXyFmpmcpze2ukmaRcxpDxtR7XfJoUU6wqxU2MJ9DOnkriYLB9Ko3bwzj/Kw+p5ETc/9yPenW3kzW7FfoR3yPjJclj04kifG7PRApFI4NgwtaE5na/xCEBI572Nvp+Fmor83yzqDb/bgHX6OQsThdSMC5WwmW+dTOf1tskfnz7QEGBgABBAUCAwEA',
        exp: [
          {
            TAG: 'createAssociatedToken',
            data: {
              payer: '3z9vL1zjN6qyAFHhHQdWYRTFAcy69pJydkZmSFBKHg1R',
              ata: 'Hmyk3FSw4cfsuAes7sanp2oxSkE9ivaH6pMzDzbacqmt',
              owner: '2i3KvjDCZWxBsqcxBHpdEaZYQwQSYE6LXUMx5VjY5XrR',
              mint: '99zqUzQGohamfYxyo8ykTEbi91iom3CLmwCA75FK5zTg',
            },
          },
        ],
        expHints: [
          'Initialize associated token account=Hmyk3FSw4cfsuAes7sanp2oxSkE9ivaH6pMzDzbacqmt with owner=2i3KvjDCZWxBsqcxBHpdEaZYQwQSYE6LXUMx5VjY5XrR for token=99zqUzQGohamfYxyo8ykTEbi91iom3CLmwCA75FK5zTg, payed by 3z9vL1zjN6qyAFHhHQdWYRTFAcy69pJydkZmSFBKHg1R',
        ],
      },
      {
        tx: 'AURhKq6gvwj0TrZ4SLAnar1z+1WNvk8l/oLaLHU+sydfyTv8kZV8V9xEVblE9QeoEfBSFZgvrlA4AV2DTQT61gMBAAEELFuQskIMiaj8Oy/WFaidHlRPWUnonjWPq4hkn1vbnHR5K4mCwfSqN28M4/ysPqeRE3P/cj3p1t5M1uxX6Ed8j4+AseOgQR9W8FkdjzPipJJgvRzAPYkQBFHdPwHeYXCwBt324ddloZPZy+FGzut5rBy0he1fWzeROoz1hX7/AKl/NElmROqjk0gZlDcSBoLMV4SDbJBRenJx+PseWNmzvwEDAwECAAoOAOh2SBcAAAAJ',
        exp: [
          {
            TAG: 'mintToChecked',
            data: {
              amount: 100000000000n,
              decimals: 9,
              mint: '99zqUzQGohamfYxyo8ykTEbi91iom3CLmwCA75FK5zTg',
              token: 'AfB7uwBEsGtrrBqPTVqEgzWed5XdYfM1psPNLmf7EeX9',
              mintAuthority: '3z9vL1zjN6qyAFHhHQdWYRTFAcy69pJydkZmSFBKHg1R',
            },
          },
        ],
      },
      {
        tx: 'AXny3f5b65+QIxtn7f9eUS3nbEUJmindmT787RH2e/h7zSxIcOtvuN0BFfv8p1eOdXeK+TR/JdGava0Z0UfQ9wYBAAEELFuQskIMiaj8Oy/WFaidHlRPWUnonjWPq4hkn1vbnHR5K4mCwfSqN28M4/ysPqeRE3P/cj3p1t5M1uxX6Ed8j/lAtHGkG9LML+E1rRVppH0/14oS5eLZhxAYtCwSwUnzBt324ddloZPZy+FGzut5rBy0he1fWzeROoz1hX7/AKkWUcQ9kKtprzGWWb1V00jORI0DDZxTqbadRe18VHqX1gEDAwECAAoOAOh2SBcAAAAJ',
        exp: [
          {
            TAG: 'mintToChecked',
            data: {
              amount: 100000000000n,
              decimals: 9,
              mint: '99zqUzQGohamfYxyo8ykTEbi91iom3CLmwCA75FK5zTg',
              token: 'Hmyk3FSw4cfsuAes7sanp2oxSkE9ivaH6pMzDzbacqmt',
              mintAuthority: '3z9vL1zjN6qyAFHhHQdWYRTFAcy69pJydkZmSFBKHg1R',
            },
          },
        ],
      },
      {
        tx: 'AfhwV78LfaDKAGIuVlBTvD3LRtdeN0mp1VCw/HEZmLhLKQOEY/h6YjPxucRv4NwUKzaPf87WOG2D8UC2yx37dw4BAAIFLFuQskIMiaj8Oy/WFaidHlRPWUnonjWPq4hkn1vbnHSPgLHjoEEfVvBZHY8z4qSSYL0cwD2JEARR3T8B3mFwsPlAtHGkG9LML+E1rRVppH0/14oS5eLZhxAYtCwSwUnzBt324ddloZPZy+FGzut5rBy0he1fWzeROoz1hX7/AKl5K4mCwfSqN28M4/ysPqeRE3P/cj3p1t5M1uxX6Ed8jyF1YBckSSuREgKc5e+TvTJ4JilllzywAEztm4Rg9WYNAQMEAQQCAAoMAOh2SBcAAAAJ',
        exp: [
          {
            TAG: 'transferChecked',
            data: {
              amount: 100000000000n,
              decimals: 9,
              source: 'AfB7uwBEsGtrrBqPTVqEgzWed5XdYfM1psPNLmf7EeX9',
              mint: '99zqUzQGohamfYxyo8ykTEbi91iom3CLmwCA75FK5zTg',
              destination: 'Hmyk3FSw4cfsuAes7sanp2oxSkE9ivaH6pMzDzbacqmt',
              authority: '3z9vL1zjN6qyAFHhHQdWYRTFAcy69pJydkZmSFBKHg1R',
            },
          },
        ],
      },
      {
        tx: 'AuvHXXD/LegvEHdWy+sey2sq6bgpuKPQ1KZRMJjf4VSdxizW5WOi/AYiAZ3XxqAhCQ0uBgjjGhCALL59gJ3HeQvMZTvsU0n8/v9V1xdUsNsxyii8j/0fb9jQ6nzwI1l6C+Yhkz2wP7BMbGKKGYCeeXADN+T2DO2ncrL1zjaZ9skGAgAEBjfEXexaW5u9jE/XRbYGcFTHFKfJ3qwdRq9/Munbw1pgnfwiRaMblhE/thMQ6fsnk9fxTUFZkcewsJxRBSmNMrQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMGRm/lIRcy/+ytunLDm+e8jOW7xfcSayxDmzpAAAAABqfVFxksXFEhjMlMPUrxf1ja7gibof1E49vZigAAAAAG3fbh7nWP3hhCXbzkbM3athr8TYO5DSf+vfko2KGL/Mlk1sZUDjt4mNIvY36HxmJxJseOKEZcKYnX2eCwUzl2BAICAAE0AAAAAOBxJgAAAAAA6gAAAAAAAAAG3fbh7nWP3hhCXbzkbM3athr8TYO5DSf+vfko2KGL/AUBAUInADfEXexaW5u9jE/XRbYGcFTHFKfJ3qwdRq9/Munbw1pgnfwiRaMblhE/thMQ6fsnk9fxTUFZkcewsJxRBSmNMrQFAgEEIwAJN8Rd7Fpbm72MT9dFtgZwVMcUp8nerB1Gr38y6dvDWmAAAwAFAlUaAAA=',
        exp: [
          {
            TAG: 'createAccount',
            data: {
              lamports: 2519520n,
              space: 234n,
              programAddress: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
              payer: '4kh6HxYZiAebF8HWLsUWod2EaQQ6iWHpHYCz8UcmFbM1',
              newAccount: 'BdhzpzhTD1MFqBiwNdrRy4jFo2FHFufw3n9e8sVjJczP',
            },
          },
          {
            TAG: 'initializeMetadataPointer',
            data: {
              authority: '4kh6HxYZiAebF8HWLsUWod2EaQQ6iWHpHYCz8UcmFbM1',
              metadataAddress: 'BdhzpzhTD1MFqBiwNdrRy4jFo2FHFufw3n9e8sVjJczP',
              mint: 'BdhzpzhTD1MFqBiwNdrRy4jFo2FHFufw3n9e8sVjJczP',
            },
          },
          {
            TAG: 'initializeMint',
            data: {
              decimals: 9,
              mintAuthority: '4kh6HxYZiAebF8HWLsUWod2EaQQ6iWHpHYCz8UcmFbM1',
              mint: 'BdhzpzhTD1MFqBiwNdrRy4jFo2FHFufw3n9e8sVjJczP',
            },
          },
          { TAG: 'setComputeUnitLimit', data: { units: 6741 } },
        ],
        expHints: [
          'Create new account=BdhzpzhTD1MFqBiwNdrRy4jFo2FHFufw3n9e8sVjJczP with balance of 0.00251952 and owner program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb, using funding account 4kh6HxYZiAebF8HWLsUWod2EaQQ6iWHpHYCz8UcmFbM1',
          undefined,
          undefined,
          undefined,
        ],
      },
      // Various interactions from owner of PayPal USD
      {
        tx: 'AVvIWSf3GAI4dYhQpXgeDxxIPAQXjSdFbM0PnR4k+YVxxjyCAYMHI9B1cNF1twKMNsdaR1dXMDx6wkuCMsOxbwABAAYIjvc5WL3sWd8tmpOTRWY3eJU2wKttQVR1975ZJYyFAkxFXOQhzEYjH8VwYGyssyS+LLX24/cruHyO87eVOy1/AgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwZGb+UhFzL/7K26csOb57yM5bvF9xJrLEObOkAAAAAG3fbh7nWP3hhCXbzkbM3athr8TYO5DSf+vfko2KGL/BeFMmHvarhTKmfwU4ZarTEpP88HzxIKtbmhVwZUjcArHC7mfxJN9u3yqdK/XjpTPHcBtY+NqpVyEKHlsGGM0r6MlyWPTiSJ8bs9ECkUjg2DC1oTmdr/EIQEjnvY2+n4WdGUX7GQqmqBDDSnGFanqm98qp0c4v4HDujVb2JKwSiAAgcGAAEFBgIEAQADAAUCqksAAA==',
        exp: [
          {
            TAG: 'createAssociatedToken',
            data: {
              payer: 'Ad5YH3AoPHXeHxxWt5uFTZHw9HFGKV9wDfQCV19wN4dH',
              ata: '5fmHWCRD1QvHqB4ZQP7PRWcoPR8nSNJyNaPF5iAzz13w',
              owner: '2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk',
              mint: '2u1tszSeqZ3qBWF3uNGPFc8TzMk2tdiwknnRMWGWjGWH',
              tokenProgram: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
            },
          },
          { TAG: 'setComputeUnitLimit', data: { units: 19370 } },
        ],
        expHints: [
          'Initialize associated token account=5fmHWCRD1QvHqB4ZQP7PRWcoPR8nSNJyNaPF5iAzz13w with owner=2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk for token=2u1tszSeqZ3qBWF3uNGPFc8TzMk2tdiwknnRMWGWjGWH, payed by Ad5YH3AoPHXeHxxWt5uFTZHw9HFGKV9wDfQCV19wN4dH',
          undefined,
        ],
      },
      {
        tx: 'AVRXqhkYDcrv8k1FSYMLY4Y/BZx6lAwSBmcb5AIz1ujeEN1nNrbiLBkEmH1JTS7jDQiKePbKFfgPJkH54nuolAUBAAMHF4UyYe9quFMqZ/BThlqtMSk/zwfPEgq1uaFXBlSNwCsXkkg7bIoqh7dHHYFPlZH5OVyECpzj2fTVun06S4p0nsFD3yzy+h+TmgQ+OBdM2MSuOr0P0krLPZaTvpIdz+IMxNdPEryA6Wm6OLWXZdej6gLk8axqPexj0zzelZEVJu8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAan1RcZLFaO4IqEX3PSl4jPA1wxRbIas0TYBi6pQAAABt324e51j94YQl285GzN2rYa/E2DuQ0n/r35KNihi/w+HvV69JOXuXODgQXMc2t0EH4qpwyiz3TYOjyMhCQPpwIEAwIFAAQEAAAABgMDAQAKD0BCDwAAAAAABg==',
        exp: [
          {
            TAG: 'advanceNonceAccount',
            data: {
              nonceAccount: 'E1RiHYRyLpGL3cyFcG83vX5rGRM69XB32RSgQTfvBRmM',
              nonceAuthority: '2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk',
            },
          },
          {
            TAG: 'burnChecked',
            data: {
              amount: 1000000n,
              decimals: 6,
              account: 'EFPL5qtehMfDump11iGjgqjyfdFnY7qGk6gg4DdzxC6S',
              mint: '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo',
              authority: '2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk',
            },
          },
        ],
        expHints: [
          'Consume nonce in nonce account=E1RiHYRyLpGL3cyFcG83vX5rGRM69XB32RSgQTfvBRmM (owner: 2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk)',
          undefined,
        ],
      },
      {
        tx: 'AXA0HTBrGH7iXGBGk3caE4qZeWJMqdKuwrKhkCG3Xm/EGCccLcUQ7y8x16OGSVXQhe65JY8pbXcE8izPV4KYrAwBAAQHF4UyYe9quFMqZ/BThlqtMSk/zwfPEgq1uaFXBlSNwCuFcfC3PxPWcmdgVHknqcqkWIssXfezo9NWjnaMB0+//sTXTxK8gOlpuji1l2XXo+oC5PGsaj3sY9M83pWRFSbvAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGp9UXGSxWjuCKhF9z0peIzwNcMUWyGrNE2AYuqUAAAAbd9uHudY/eGEJdvORszdq2GvxNg7kNJ/69+SjYoYv8F5JIO2yKKoe3Rx2BT5WR+TlchAqc49n01bp9OkuKdJ4SMT8pGkjyUZYaWBO0Kh+e99ZhbbJiOisZqN4bQ2yO8gIDAwEEAAQEAAAABQMCBgABCw==',
        exp: [
          {
            TAG: 'advanceNonceAccount',
            data: {
              nonceAccount: '9yuzc3tvAAcnsWxmVModBqPNxrU1mRK8LJ5VvjB1mLvq',
              nonceAuthority: '2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk',
            },
          },
          {
            TAG: 'thawAccount',
            data: {
              account: 'EFPL5qtehMfDump11iGjgqjyfdFnY7qGk6gg4DdzxC6S',
              mint: '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo',
              owner: '2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk',
            },
          },
        ],
        expHints: [
          'Consume nonce in nonce account=9yuzc3tvAAcnsWxmVModBqPNxrU1mRK8LJ5VvjB1mLvq (owner: 2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk)',
          undefined,
        ],
      },
      {
        tx: 'AS/A80W/ZwdtsZMRW93ixqSVrQZcCpiWOFA1K3WjC7phZnPxHfUOB4wk18apvGCcOXP3tueKzyjVEuwe4KDC/gQBAAQHF4UyYe9quFMqZ/BThlqtMSk/zwfPEgq1uaFXBlSNwCtHv3jqWulNN8/27BwP2WEL6vlcIlDUnoEJ7DXbJHvOT8TXTxK8gOlpuji1l2XXo+oC5PGsaj3sY9M83pWRFSbvAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGp9UXGSxWjuCKhF9z0peIzwNcMUWyGrNE2AYuqUAAAAbd9uHudY/eGEJdvORszdq2GvxNg7kNJ/69+SjYoYv8F5JIO2yKKoe3Rx2BT5WR+TlchAqc49n01bp9OkuKdJ5bqr4t4Z7rj4TOhyllbNWPkOR3J0XIJSDfnmvITrXfDgIDAwEEAAQEAAAABQMCBgABCg==',
        exp: [
          {
            TAG: 'advanceNonceAccount',
            data: {
              nonceAccount: '5q5HZtAZUNr6BAv92icSaV3C46a7Hn4W1TaR9wZ27Fg2',
              nonceAuthority: '2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk',
            },
          },
          {
            TAG: 'freezeAccount',
            data: {
              account: 'EFPL5qtehMfDump11iGjgqjyfdFnY7qGk6gg4DdzxC6S',
              mint: '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo',
              owner: '2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk',
            },
          },
        ],
        expHints: [
          'Consume nonce in nonce account=5q5HZtAZUNr6BAv92icSaV3C46a7Hn4W1TaR9wZ27Fg2 (owner: 2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk)',
          undefined,
        ],
      },
      {
        tx: 'AVvIWSf3GAI4dYhQpXgeDxxIPAQXjSdFbM0PnR4k+YVxxjyCAYMHI9B1cNF1twKMNsdaR1dXMDx6wkuCMsOxbwABAAYIjvc5WL3sWd8tmpOTRWY3eJU2wKttQVR1975ZJYyFAkxFXOQhzEYjH8VwYGyssyS+LLX24/cruHyO87eVOy1/AgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwZGb+UhFzL/7K26csOb57yM5bvF9xJrLEObOkAAAAAG3fbh7nWP3hhCXbzkbM3athr8TYO5DSf+vfko2KGL/BeFMmHvarhTKmfwU4ZarTEpP88HzxIKtbmhVwZUjcArHC7mfxJN9u3yqdK/XjpTPHcBtY+NqpVyEKHlsGGM0r6MlyWPTiSJ8bs9ECkUjg2DC1oTmdr/EIQEjnvY2+n4WdGUX7GQqmqBDDSnGFanqm98qp0c4v4HDujVb2JKwSiAAgcGAAEFBgIEAQADAAUCqksAAA==',
        exp: [
          {
            TAG: 'createAssociatedToken',
            data: {
              payer: 'Ad5YH3AoPHXeHxxWt5uFTZHw9HFGKV9wDfQCV19wN4dH',
              ata: '5fmHWCRD1QvHqB4ZQP7PRWcoPR8nSNJyNaPF5iAzz13w',
              owner: '2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk',
              mint: '2u1tszSeqZ3qBWF3uNGPFc8TzMk2tdiwknnRMWGWjGWH',
              tokenProgram: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
            },
          },
          { TAG: 'setComputeUnitLimit', data: { units: 19370 } },
        ],
        expHints: [
          'Initialize associated token account=5fmHWCRD1QvHqB4ZQP7PRWcoPR8nSNJyNaPF5iAzz13w with owner=2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk for token=2u1tszSeqZ3qBWF3uNGPFc8TzMk2tdiwknnRMWGWjGWH, payed by Ad5YH3AoPHXeHxxWt5uFTZHw9HFGKV9wDfQCV19wN4dH',
          undefined,
        ],
      },
      {
        tx: 'Adu2InIIDagwBZPrIJNsd17VE8f8dhkj1I5dpZ6bRuo8imSD6v9LvGr+BLuWPaE45OMU8cFoJffLpuKCGhJQGg0BAAUHLyeAYsM6cMrp7/Sk6auRPE2zgWWVKawFBShkiN8lD9z4rPOqJRLIREELMPsSIg6HeSXfsS1zD6ym4nPRHuaffQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABt324e51j94YQl285GzN2rYa/E2DuQ0n/r35KNihi/wXhTJh72q4Uypn8FOGWq0xKT/PB88SCrW5oVcGVI3AKxeSSDtsiiqHt0cdgU+Vkfk5XIQKnOPZ9NW6fTpLinSejJclj04kifG7PRApFI4NgwtaE5na/xCEBI572Nvp+FmVVnmPT9ptUjC0+Hm2up9MZMQDKNKee9SkarXxflK7xwEGBgABBAUCAwEA',
        exp: [
          {
            TAG: 'createAssociatedToken',
            data: {
              payer: '4B56djoYCRdBSqnyEycUfSLQt7Xbq5uA74wt8K1boMMu',
              ata: 'Hjj4yTUikj19ebuYPpMTr2AKsuiMc57w7shSbbL9w86G',
              owner: '2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk',
              mint: '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo',
              tokenProgram: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
            },
          },
        ],
        expHints: [
          'Initialize associated token account=Hjj4yTUikj19ebuYPpMTr2AKsuiMc57w7shSbbL9w86G with owner=2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk for token=2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo, payed by 4B56djoYCRdBSqnyEycUfSLQt7Xbq5uA74wt8K1boMMu',
        ],
      },
      {
        tx: 'AUQP6XwffCGFpjJ+0HfFN2s44HOz5vlT+vWSL2IEYthWMURjVua5mspoUC2B6ghZ6+xymcFvjzorMDaKozL+gAcBAAUHLyeAYsM6cMrp7/Sk6auRPE2zgWWVKawFBShkiN8lD9z8BZQ0KU9w1RNszuH5XXZEwQ7S1thN+qStuDUzJcnoHwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABt324e51j94YQl285GzN2rYa/E2DuQ0n/r35KNihi/wXhTJh72q4Uypn8FOGWq0xKT/PB88SCrW5oVcGVI3AK4yXJY9OJInxuz0QKRSODYMLWhOZ2v8QhASOe9jb6fhZ9Q6ekr4sJUfqVG8afcxuVXSrfCvM78pGNjtoEIVC9+bc9AhpqldybxUr0bcjwhiNmKXzpq2tIKhGcLfTQ77unwEFBgABBAYCAwEA',
        exp: [
          {
            TAG: 'createAssociatedToken',
            data: {
              payer: '4B56djoYCRdBSqnyEycUfSLQt7Xbq5uA74wt8K1boMMu',
              ata: 'Hxng5sX7D1a2LyZonHabdXhrTySXbrLK4q2taKuhGtCW',
              owner: '2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk',
              mint: 'HVbpJAQGNpkgBaYBZQBR1t7yFdvaYVp2vCQQfKKEN4tM',
              tokenProgram: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
            },
          },
        ],
        expHints: [
          'Initialize associated token account=Hxng5sX7D1a2LyZonHabdXhrTySXbrLK4q2taKuhGtCW with owner=2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk for token=HVbpJAQGNpkgBaYBZQBR1t7yFdvaYVp2vCQQfKKEN4tM, payed by 4B56djoYCRdBSqnyEycUfSLQt7Xbq5uA74wt8K1boMMu',
        ],
      },
    ];
    const count = { ok: 0, failed: 0 };
    for (const { tx, exp, expHints } of VECTORS) {
      const parsed = sol.Transaction.decode(base64.decode(tx));
      const instr = parsed.msg.instructions.map(sol.parseInstruction);
      deepStrictEqual(instr, exp);
      if (expHints) deepStrictEqual(parsed.msg.instructions.map(hintInstruction), expHints);
      // Try to re-build
      for (let i = 0; i < parsed.msg.instructions.length; i++) {
        const info = instr[i];
        const data = parsed.msg.instructions[i];
        const c = sol.CONTRACTS[data.program];
        // Multi-sig stuff
        try {
          deepStrictEqual(c.instructions.encoders[info.TAG](info.data), data);
          count.ok++;
        } catch (e) {
          count.failed++;
        }
      }
    }
    deepStrictEqual(count, { ok: 10, failed: 13 });
  });
  should('IDL type size (token)', () => {
    deepStrictEqual(sol.PROGRAMS.token.program.accounts.coders.token.size, 165);
  });
  should('IDL type size (token-2022)', () => {
    deepStrictEqual(sol.PROGRAMS['token-2022'].program.accounts.coders.token.size, 165);
  });
});

should.runWhen(import.meta.url);
