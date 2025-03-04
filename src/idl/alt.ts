export default {
  kind: 'rootNode',
  program: {
    kind: 'programNode',
    pdas: [
      {
        kind: 'pdaNode',
        name: 'addressLookupTable',
        seeds: [
          {
            kind: 'variablePdaSeedNode',
            name: 'authority',
            type: { kind: 'publicKeyTypeNode' },
            docs: ["The address of the LUT's authority"],
          },
          {
            kind: 'variablePdaSeedNode',
            name: 'recentSlot',
            type: {
              kind: 'numberTypeNode',
              format: 'u64',
              endian: 'le',
            },
            docs: ['The recent slot associated with the LUT'],
          },
        ],
      },
    ],
    accounts: [
      {
        kind: 'accountNode',
        data: {
          kind: 'structTypeNode',
          fields: [
            {
              kind: 'structFieldTypeNode',
              name: 'discriminator',
              type: {
                kind: 'numberTypeNode',
                format: 'u32',
                endian: 'le',
              },
              docs: [],
              defaultValue: { kind: 'numberValueNode', number: 1 },
              defaultValueStrategy: 'omitted',
            },
            {
              kind: 'structFieldTypeNode',
              name: 'deactivationSlot',
              type: {
                kind: 'numberTypeNode',
                format: 'u64',
                endian: 'le',
              },
              docs: [],
            },
            {
              kind: 'structFieldTypeNode',
              name: 'lastExtendedSlot',
              type: {
                kind: 'numberTypeNode',
                format: 'u64',
                endian: 'le',
              },
              docs: [],
            },
            {
              kind: 'structFieldTypeNode',
              name: 'lastExtendedSlotStartIndex',
              type: {
                kind: 'numberTypeNode',
                format: 'u8',
                endian: 'le',
              },
              docs: [],
            },
            {
              kind: 'structFieldTypeNode',
              name: 'authority',
              type: {
                kind: 'optionTypeNode',
                item: { kind: 'publicKeyTypeNode' },
                prefix: {
                  kind: 'numberTypeNode',
                  format: 'u8',
                  endian: 'le',
                },
                fixed: true,
                idlOption: 'option',
              },
              docs: [],
            },
            {
              kind: 'structFieldTypeNode',
              name: 'padding',
              type: {
                kind: 'numberTypeNode',
                format: 'u16',
                endian: 'le',
              },
              docs: [],
              defaultValue: { kind: 'numberValueNode', number: 0 },
              defaultValueStrategy: 'omitted',
            },
            {
              kind: 'structFieldTypeNode',
              name: 'addresses',
              type: {
                kind: 'arrayTypeNode',
                item: { kind: 'publicKeyTypeNode' },
                count: { kind: 'remainderCountNode' },
              },
              docs: [],
            },
          ],
        },
        pda: { kind: 'pdaLinkNode', name: 'addressLookupTable' },
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
        name: 'addressLookupTable',
        idlName: 'AddressLookupTable',
        docs: [],
      },
    ],
    instructions: [
      {
        kind: 'instructionNode',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'address',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: [],
            defaultValue: {
              kind: 'pdaValueNode',
              pda: { kind: 'pdaLinkNode', name: 'addressLookupTable' },
              seeds: [
                {
                  kind: 'pdaSeedValueNode',
                  name: 'authority',
                  value: { kind: 'accountValueNode', name: 'authority' },
                },
                {
                  kind: 'pdaSeedValueNode',
                  name: 'recentSlot',
                  value: { kind: 'argumentValueNode', name: 'recentSlot' },
                },
              ],
            },
          },
          {
            kind: 'instructionAccountNode',
            name: 'authority',
            isWritable: false,
            isSigner: true,
            isOptional: false,
            docs: [],
            defaultValue: { kind: 'identityValueNode' },
          },
          {
            kind: 'instructionAccountNode',
            name: 'payer',
            isWritable: true,
            isSigner: true,
            isOptional: false,
            docs: [],
            defaultValue: { kind: 'accountValueNode', name: 'authority' },
          },
          {
            kind: 'instructionAccountNode',
            name: 'systemProgram',
            isWritable: false,
            isSigner: false,
            isOptional: false,
            docs: [],
            defaultValue: {
              kind: 'publicKeyValueNode',
              publicKey: '11111111111111111111111111111111',
              identifier: 'splSystem',
            },
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            type: {
              kind: 'numberTypeNode',
              format: 'u32',
              endian: 'le',
            },
            docs: [],
            defaultValue: { kind: 'numberValueNode', number: 0 },
            defaultValueStrategy: 'omitted',
          },
          {
            kind: 'instructionArgumentNode',
            name: 'recentSlot',
            type: {
              kind: 'numberTypeNode',
              format: 'u64',
              endian: 'le',
            },
            docs: [],
          },
          {
            kind: 'instructionArgumentNode',
            name: 'bump',
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            docs: [],
            defaultValue: {
              kind: 'accountBumpValueNode',
              name: 'address',
            },
          },
        ],
        byteDeltas: [
          {
            kind: 'instructionByteDeltaNode',
            value: { kind: 'numberValueNode', number: 56 },
            withHeader: true,
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
        name: 'createLookupTable',
        idlName: 'CreateLookupTable',
        docs: [],
        optionalAccountStrategy: 'programId',
      },
      {
        kind: 'instructionNode',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'address',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: [],
          },
          {
            kind: 'instructionAccountNode',
            name: 'authority',
            isWritable: false,
            isSigner: true,
            isOptional: false,
            docs: [],
            defaultValue: { kind: 'identityValueNode' },
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            type: {
              kind: 'numberTypeNode',
              format: 'u32',
              endian: 'le',
            },
            docs: [],
            defaultValue: { kind: 'numberValueNode', number: 1 },
            defaultValueStrategy: 'omitted',
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
        name: 'freezeLookupTable',
        idlName: 'FreezeLookupTable',
        docs: [],
        optionalAccountStrategy: 'programId',
      },
      {
        kind: 'instructionNode',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'address',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: [],
          },
          {
            kind: 'instructionAccountNode',
            name: 'authority',
            isWritable: false,
            isSigner: true,
            isOptional: false,
            docs: [],
            defaultValue: { kind: 'identityValueNode' },
          },
          {
            kind: 'instructionAccountNode',
            name: 'payer',
            isWritable: true,
            isSigner: true,
            isOptional: false,
            docs: [],
            defaultValue: { kind: 'payerValueNode' },
          },
          {
            kind: 'instructionAccountNode',
            name: 'systemProgram',
            isWritable: false,
            isSigner: false,
            isOptional: false,
            docs: [],
            defaultValue: {
              kind: 'publicKeyValueNode',
              publicKey: '11111111111111111111111111111111',
              identifier: 'splSystem',
            },
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            type: {
              kind: 'numberTypeNode',
              format: 'u32',
              endian: 'le',
            },
            docs: [],
            defaultValue: { kind: 'numberValueNode', number: 2 },
            defaultValueStrategy: 'omitted',
          },
          {
            kind: 'instructionArgumentNode',
            name: 'addresses',
            type: {
              kind: 'arrayTypeNode',
              item: { kind: 'publicKeyTypeNode' },
              count: {
                kind: 'prefixedCountNode',
                prefix: {
                  kind: 'numberTypeNode',
                  format: 'u64',
                  endian: 'le',
                },
              },
            },
            docs: [],
          },
        ],
        byteDeltas: [
          {
            kind: 'instructionByteDeltaNode',
            value: {
              kind: 'resolverValueNode',
              name: 'resolveExtendLookupTableBytes',
              dependsOn: [{ kind: 'argumentValueNode', name: 'addresses' }],
            },
            withHeader: false,
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
        name: 'extendLookupTable',
        idlName: 'ExtendLookupTable',
        docs: [],
        optionalAccountStrategy: 'programId',
      },
      {
        kind: 'instructionNode',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'address',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: [],
          },
          {
            kind: 'instructionAccountNode',
            name: 'authority',
            isWritable: false,
            isSigner: true,
            isOptional: false,
            docs: [],
            defaultValue: { kind: 'identityValueNode' },
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            type: {
              kind: 'numberTypeNode',
              format: 'u32',
              endian: 'le',
            },
            docs: [],
            defaultValue: { kind: 'numberValueNode', number: 3 },
            defaultValueStrategy: 'omitted',
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
        name: 'deactivateLookupTable',
        idlName: 'DeactivateLookupTable',
        docs: [],
        optionalAccountStrategy: 'programId',
      },
      {
        kind: 'instructionNode',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'address',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: [],
          },
          {
            kind: 'instructionAccountNode',
            name: 'authority',
            isWritable: false,
            isSigner: true,
            isOptional: false,
            docs: [],
            defaultValue: { kind: 'identityValueNode' },
          },
          {
            kind: 'instructionAccountNode',
            name: 'recipient',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: [],
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            type: {
              kind: 'numberTypeNode',
              format: 'u32',
              endian: 'le',
            },
            docs: [],
            defaultValue: { kind: 'numberValueNode', number: 4 },
            defaultValueStrategy: 'omitted',
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
        name: 'closeLookupTable',
        idlName: 'CloseLookupTable',
        docs: [],
        optionalAccountStrategy: 'programId',
      },
    ],
    definedTypes: [],
    errors: [],
    name: 'addressLookupTable',
    prefix: '',
    publicKey: 'AddressLookupTab1e1111111111111111111111111',
    version: '0.0.1',
    origin: 'shank',
  },
  additionalPrograms: [],
  standard: 'codama',
  version: '1.0.0',
} as const;
