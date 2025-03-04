export default {
  kind: 'rootNode',
  program: {
    kind: 'programNode',
    pdas: [],
    accounts: [],
    instructions: [
      {
        kind: 'instructionNode',
        accounts: [],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            docs: [],
            defaultValue: { kind: 'numberValueNode', number: 0 },
            defaultValueStrategy: 'omitted',
          },
          {
            kind: 'instructionArgumentNode',
            name: 'units',
            type: {
              kind: 'numberTypeNode',
              format: 'u32',
              endian: 'le',
            },
            docs: ['Units to request for transaction-wide compute.'],
          },
          {
            kind: 'instructionArgumentNode',
            name: 'additionalFee',
            type: {
              kind: 'numberTypeNode',
              format: 'u32',
              endian: 'le',
            },
            docs: ['Prioritization fee lamports.'],
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
        name: 'requestUnits',
        idlName: 'requestUnits',
        docs: [],
        optionalAccountStrategy: 'programId',
      },
      {
        kind: 'instructionNode',
        accounts: [],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            docs: [],
            defaultValue: { kind: 'numberValueNode', number: 1 },
            defaultValueStrategy: 'omitted',
          },
          {
            kind: 'instructionArgumentNode',
            name: 'bytes',
            type: {
              kind: 'numberTypeNode',
              format: 'u32',
              endian: 'le',
            },
            docs: [
              'Requested transaction-wide program heap size in bytes.',
              'Must be multiple of 1024. Applies to each program, including CPIs.',
            ],
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
        name: 'requestHeapFrame',
        idlName: 'requestHeapFrame',
        docs: [],
        optionalAccountStrategy: 'programId',
      },
      {
        kind: 'instructionNode',
        accounts: [],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            docs: [],
            defaultValue: { kind: 'numberValueNode', number: 2 },
            defaultValueStrategy: 'omitted',
          },
          {
            kind: 'instructionArgumentNode',
            name: 'units',
            type: {
              kind: 'numberTypeNode',
              format: 'u32',
              endian: 'le',
            },
            docs: ['Transaction-wide compute unit limit.'],
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
        name: 'setComputeUnitLimit',
        idlName: 'setComputeUnitLimit',
        docs: [],
        optionalAccountStrategy: 'programId',
      },
      {
        kind: 'instructionNode',
        accounts: [],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            docs: [],
            defaultValue: { kind: 'numberValueNode', number: 3 },
            defaultValueStrategy: 'omitted',
          },
          {
            kind: 'instructionArgumentNode',
            name: 'microLamports',
            type: {
              kind: 'numberTypeNode',
              format: 'u64',
              endian: 'le',
            },
            docs: ['Transaction compute unit price used for prioritization fees.'],
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
        name: 'setComputeUnitPrice',
        idlName: 'setComputeUnitPrice',
        docs: [],
        optionalAccountStrategy: 'programId',
      },
      {
        kind: 'instructionNode',
        accounts: [],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            docs: [],
            defaultValue: { kind: 'numberValueNode', number: 4 },
            defaultValueStrategy: 'omitted',
          },
          {
            kind: 'instructionArgumentNode',
            name: 'accountDataSizeLimit',
            type: {
              kind: 'numberTypeNode',
              format: 'u32',
              endian: 'le',
            },
            docs: [],
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
        name: 'setLoadedAccountsDataSizeLimit',
        idlName: 'setLoadedAccountsDataSizeLimit',
        docs: [],
        optionalAccountStrategy: 'programId',
      },
    ],
    definedTypes: [],
    errors: [],
    name: 'computeBudget',
    prefix: '',
    publicKey: 'ComputeBudget111111111111111111111111111111',
    version: '0.0.1',
    origin: 'shank',
  },
  additionalPrograms: [],
  standard: 'codama',
  version: '1.0.0',
} as const;
