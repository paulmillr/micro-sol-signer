export default {
  kind: 'rootNode',
  program: {
    kind: 'programNode',
    pdas: [],
    accounts: [
      {
        kind: 'accountNode',
        data: {
          kind: 'structTypeNode',
          fields: [
            {
              kind: 'structFieldTypeNode',
              name: 'keys',
              type: {
                kind: 'definedTypeLinkNode',
                name: 'configKeys',
              },
              docs: [
                'List of pubkeys stored in the config account,',
                'and whether each pubkey needs to sign subsequent calls to `store`.',
              ],
            },
            {
              kind: 'structFieldTypeNode',
              name: 'data',
              type: {
                kind: 'bytesTypeNode',
              },
              docs: ['Arbitrary data to store in the config account.'],
            },
          ],
        },
        name: 'config',
        docs: [],
      },
    ],
    instructions: [
      {
        kind: 'instructionNode',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'configAccount',
            isWritable: true,
            isSigner: 'either',
            isOptional: false,
            docs: [
              'The config account to be modified.',
              'Must sign during the first call to `store` to initialize the account,',
              'or if no signers are configured in the config data.',
            ],
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'keys',
            type: {
              kind: 'definedTypeLinkNode',
              name: 'configKeys',
            },
            docs: [
              'List of pubkeys to store in the config account,',
              'and whether each pubkey needs to sign subsequent calls to `store`.',
              'Non-signer pubkeys do not need to be passed to the program as accounts.',
            ],
          },
          {
            kind: 'instructionArgumentNode',
            name: 'data',
            type: {
              kind: 'bytesTypeNode',
            },
            docs: ['Arbitrary data to store in the config account.'],
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            value: {
              kind: 'argumentValueNode',
              name: 'signers',
            },
            isOptional: true,
            isSigner: true,
          },
        ],
        name: 'store',
        docs: [
          'Stores keys and data in a config account.',
          'Keys can be marked as signer or non-signer.',
          'Only non-signer keys and data can be updated. Signer keys are immutable.',
        ],
        optionalAccountStrategy: 'omitted',
      },
    ],
    definedTypes: [
      {
        kind: 'definedTypeNode',
        name: 'configKeys',
        type: {
          kind: 'arrayTypeNode',
          item: {
            kind: 'tupleTypeNode',
            items: [
              {
                kind: 'publicKeyTypeNode',
              },
              {
                kind: 'booleanTypeNode',
                size: {
                  kind: 'numberTypeNode',
                  format: 'u8',
                  endian: 'le',
                },
              },
            ],
          },
          count: {
            kind: 'prefixedCountNode',
            prefix: {
              kind: 'numberTypeNode',
              format: 'shortU16',
              endian: 'le',
            },
          },
        },
        docs: [
          'A collection of keys to be stored in Config account data.',
          'Each key tuple comprises a unique `Pubkey` identifier,',
          'and `bool` whether that key is a signer of the data.',
        ],
      },
    ],
    errors: [],
    name: 'solanaConfig',
    prefix: '',
    publicKey: 'Config1111111111111111111111111111111111111',
    version: '0.0.1',
    origin: 'shank',
  },
  additionalPrograms: [],
  standard: 'codama',
  version: '1.0.0',
} as const;
