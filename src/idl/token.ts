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
              name: 'mintAuthority',
              type: {
                kind: 'optionTypeNode',
                item: { kind: 'publicKeyTypeNode' },
                prefix: {
                  kind: 'numberTypeNode',
                  format: 'u32',
                  endian: 'le',
                },
                fixed: true,
              },
              docs: [
                'Optional authority used to mint new tokens. The mint authority may only',
                'be provided during mint creation. If no mint authority is present',
                'then the mint has a fixed supply and no further tokens may be minted.',
              ],
            },
            {
              kind: 'structFieldTypeNode',
              name: 'supply',
              type: {
                kind: 'numberTypeNode',
                format: 'u64',
                endian: 'le',
              },
              docs: ['Total supply of tokens.'],
            },
            {
              kind: 'structFieldTypeNode',
              name: 'decimals',
              type: {
                kind: 'numberTypeNode',
                format: 'u8',
                endian: 'le',
              },
              docs: ['Number of base 10 digits to the right of the decimal place.'],
            },
            {
              kind: 'structFieldTypeNode',
              name: 'isInitialized',
              type: {
                kind: 'booleanTypeNode',
                size: {
                  kind: 'numberTypeNode',
                  format: 'u8',
                  endian: 'le',
                },
              },
              docs: ['Is `true` if this structure has been initialized.'],
            },
            {
              kind: 'structFieldTypeNode',
              name: 'freezeAuthority',
              type: {
                kind: 'optionTypeNode',
                item: { kind: 'publicKeyTypeNode' },
                prefix: {
                  kind: 'numberTypeNode',
                  format: 'u32',
                  endian: 'le',
                },
                fixed: true,
              },
              docs: ['Optional authority to freeze token accounts.'],
            },
          ],
        },
        discriminators: [
          {
            kind: 'sizeDiscriminatorNode',
            size: 82,
          },
        ],
        name: 'mint',
        docs: [],
        size: 82,
      },
      {
        kind: 'accountNode',
        data: {
          kind: 'structTypeNode',
          fields: [
            {
              kind: 'structFieldTypeNode',
              name: 'mint',
              type: { kind: 'publicKeyTypeNode' },
              docs: ['The mint associated with this account.'],
            },
            {
              kind: 'structFieldTypeNode',
              name: 'owner',
              type: { kind: 'publicKeyTypeNode' },
              docs: ['The owner of this account.'],
            },
            {
              kind: 'structFieldTypeNode',
              name: 'amount',
              type: {
                kind: 'numberTypeNode',
                format: 'u64',
                endian: 'le',
              },
              docs: ['The amount of tokens this account holds.'],
            },
            {
              kind: 'structFieldTypeNode',
              name: 'delegate',
              type: {
                kind: 'optionTypeNode',
                item: { kind: 'publicKeyTypeNode' },
                prefix: {
                  kind: 'numberTypeNode',
                  format: 'u32',
                  endian: 'le',
                },
                fixed: true,
              },
              docs: [
                'If `delegate` is `Some` then `delegated_amount` represents',
                'the amount authorized by the delegate.',
              ],
            },
            {
              kind: 'structFieldTypeNode',
              name: 'state',
              type: { kind: 'definedTypeLinkNode', name: 'accountState' },
              docs: ["The account's state."],
            },
            {
              kind: 'structFieldTypeNode',
              name: 'isNative',
              type: {
                kind: 'optionTypeNode',
                item: {
                  kind: 'numberTypeNode',
                  format: 'u64',
                  endian: 'le',
                },
                prefix: {
                  kind: 'numberTypeNode',
                  format: 'u32',
                  endian: 'le',
                },
                fixed: true,
              },
              docs: [
                'If is_native.is_some, this is a native token, and the value logs the',
                'rent-exempt reserve. An Account is required to be rent-exempt, so',
                'the value is used by the Processor to ensure that wrapped SOL',
                'accounts do not drop below this threshold.',
              ],
            },
            {
              kind: 'structFieldTypeNode',
              name: 'delegatedAmount',
              type: {
                kind: 'numberTypeNode',
                format: 'u64',
                endian: 'le',
              },
              docs: ['The amount delegated.'],
            },
            {
              kind: 'structFieldTypeNode',
              name: 'closeAuthority',
              type: {
                kind: 'optionTypeNode',
                item: { kind: 'publicKeyTypeNode' },
                prefix: {
                  kind: 'numberTypeNode',
                  format: 'u32',
                  endian: 'le',
                },
                fixed: true,
              },
              docs: ['Optional authority to close the account.'],
            },
          ],
        },
        discriminators: [
          {
            kind: 'sizeDiscriminatorNode',
            size: 165,
          },
        ],
        name: 'token',
        docs: [],
        size: 165,
      },
      {
        kind: 'accountNode',
        data: {
          kind: 'structTypeNode',
          fields: [
            {
              kind: 'structFieldTypeNode',
              name: 'm',
              type: {
                kind: 'numberTypeNode',
                format: 'u8',
                endian: 'le',
              },
              docs: ['Number of signers required.'],
            },
            {
              kind: 'structFieldTypeNode',
              name: 'n',
              type: {
                kind: 'numberTypeNode',
                format: 'u8',
                endian: 'le',
              },
              docs: ['Number of valid signers.'],
            },
            {
              kind: 'structFieldTypeNode',
              name: 'isInitialized',
              type: {
                kind: 'booleanTypeNode',
                size: {
                  kind: 'numberTypeNode',
                  format: 'u8',
                  endian: 'le',
                },
              },
              docs: ['Is `true` if this structure has been initialized.'],
            },
            {
              kind: 'structFieldTypeNode',
              name: 'signers',
              type: {
                kind: 'arrayTypeNode',
                item: { kind: 'publicKeyTypeNode' },
                count: { kind: 'fixedCountNode', value: 11 },
              },
              docs: ['Signer public keys.'],
            },
          ],
        },
        discriminators: [
          {
            kind: 'sizeDiscriminatorNode',
            size: 355,
          },
        ],
        name: 'multisig',
        docs: [],
        size: 355,
      },
    ],
    instructions: [
      {
        kind: 'instructionNode',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'mint',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['Token mint account.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'rent',
            isWritable: false,
            isSigner: false,
            isOptional: false,
            docs: ['Rent sysvar.'],
            defaultValue: {
              kind: 'publicKeyValueNode',
              publicKey: 'SysvarRent111111111111111111111111111111111',
            },
          },
        ],
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
            name: 'decimals',
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            docs: ['Number of decimals in token account amounts.'],
          },
          {
            kind: 'instructionArgumentNode',
            name: 'mintAuthority',
            type: { kind: 'publicKeyTypeNode' },
            docs: ['Minting authority.'],
          },
          {
            kind: 'instructionArgumentNode',
            name: 'freezeAuthority',
            type: {
              kind: 'optionTypeNode',
              item: { kind: 'publicKeyTypeNode' },
              prefix: {
                kind: 'numberTypeNode',
                format: 'u8',
                endian: 'le',
              },
              fixed: false,
            },
            defaultValue: {
              kind: 'noneValueNode',
            },
            docs: ['Optional authority that can freeze token accounts.'],
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
        name: 'initializeMint',
        docs: [
          'Initializes a new mint and optionally deposits all the newly minted',
          'tokens in an account.',
          '',
          'The `InitializeMint` instruction requires no signers and MUST be',
          "included within the same Transaction as the system program's",
          '`CreateAccount` instruction that creates the account being initialized.',
          'Otherwise another party can acquire ownership of the uninitialized account.',
        ],
        optionalAccountStrategy: 'programId',
      },
      {
        kind: 'instructionNode',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'account',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The account to initialize.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'mint',
            isWritable: false,
            isSigner: false,
            isOptional: false,
            docs: ['The mint this account will be associated with.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'owner',
            isWritable: false,
            isSigner: false,
            isOptional: false,
            docs: ["The new account's owner/multisignature."],
          },
          {
            kind: 'instructionAccountNode',
            name: 'rent',
            isWritable: false,
            isSigner: false,
            isOptional: false,
            docs: ['Rent sysvar.'],
            defaultValue: {
              kind: 'publicKeyValueNode',
              publicKey: 'SysvarRent111111111111111111111111111111111',
            },
          },
        ],
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
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
        name: 'initializeAccount',
        docs: [
          'Initializes a new account to hold tokens. If this account is associated',
          'with the native mint then the token balance of the initialized account',
          'will be equal to the amount of SOL in the account. If this account is',
          'associated with another mint, that mint must be initialized before this',
          'command can succeed.',
          '',
          'The `InitializeAccount` instruction requires no signers and MUST be',
          "included within the same Transaction as the system program's",
          '`CreateAccount` instruction that creates the account being initialized.',
          'Otherwise another party can acquire ownership of the uninitialized account.',
        ],
        optionalAccountStrategy: 'programId',
      },
      {
        kind: 'instructionNode',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'multisig',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The multisignature account to initialize.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'rent',
            isWritable: false,
            isSigner: false,
            isOptional: false,
            docs: ['Rent sysvar.'],
            defaultValue: {
              kind: 'publicKeyValueNode',
              publicKey: 'SysvarRent111111111111111111111111111111111',
            },
          },
        ],
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
            name: 'm',
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            docs: ['The number of signers (M) required to validate this multisignature account.'],
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            value: {
              kind: 'argumentValueNode',
              name: 'signers',
            },
          },
        ],
        name: 'initializeMultisig',
        docs: [
          'Initializes a multisignature account with N provided signers.',
          '',
          'Multisignature accounts can used in place of any single owner/delegate',
          'accounts in any token instruction that require an owner/delegate to be',
          'present. The variant field represents the number of signers (M)',
          'required to validate this multisignature account.',
          '',
          'The `InitializeMultisig` instruction requires no signers and MUST be',
          "included within the same Transaction as the system program's",
          '`CreateAccount` instruction that creates the account being initialized.',
          'Otherwise another party can acquire ownership of the uninitialized account.',
        ],
        optionalAccountStrategy: 'programId',
      },
      {
        kind: 'instructionNode',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'source',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The source account.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'destination',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The destination account.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'authority',
            isWritable: false,
            isSigner: 'either',
            isOptional: false,
            docs: ["The source account's owner/delegate or its multisignature account."],
            defaultValue: { kind: 'identityValueNode' },
          },
        ],
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
            name: 'amount',
            type: {
              kind: 'numberTypeNode',
              format: 'u64',
              endian: 'le',
            },
            docs: ['The amount of tokens to transfer.'],
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
            isOptional: true,
            isSigner: true,
          },
        ],
        name: 'transfer',
        docs: [
          'Transfers tokens from one account to another either directly or via a delegate.',
          'If this account is associated with the native mint then equal amounts',
          'of SOL and Tokens will be transferred to the destination account.',
        ],
        optionalAccountStrategy: 'programId',
      },
      {
        kind: 'instructionNode',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'source',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The source account.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'delegate',
            isWritable: false,
            isSigner: false,
            isOptional: false,
            docs: ['The delegate.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'owner',
            isWritable: false,
            isSigner: 'either',
            isOptional: false,
            docs: ['The source account owner or its multisignature account.'],
          },
        ],
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
            name: 'amount',
            type: {
              kind: 'numberTypeNode',
              format: 'u64',
              endian: 'le',
            },
            docs: ['The amount of tokens the delegate is approved for.'],
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
            isOptional: true,
            isSigner: true,
          },
        ],
        name: 'approve',
        docs: [
          'Approves a delegate. A delegate is given the authority over tokens on',
          "behalf of the source account's owner.",
        ],
        optionalAccountStrategy: 'programId',
      },
      {
        kind: 'instructionNode',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'source',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The source account.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'owner',
            isWritable: false,
            isSigner: 'either',
            isOptional: false,
            docs: ['The source account owner or its multisignature.'],
          },
        ],
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
            defaultValue: { kind: 'numberValueNode', number: 5 },
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
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
            isOptional: true,
            isSigner: true,
          },
        ],
        name: 'revoke',
        docs: ["Revokes the delegate's authority."],
        optionalAccountStrategy: 'programId',
      },
      {
        kind: 'instructionNode',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'owned',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The mint or account to change the authority of.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'owner',
            isWritable: false,
            isSigner: 'either',
            isOptional: false,
            docs: [
              'The current authority or the multisignature account of the mint or account to update.',
            ],
          },
        ],
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
            defaultValue: { kind: 'numberValueNode', number: 6 },
            defaultValueStrategy: 'omitted',
          },
          {
            kind: 'instructionArgumentNode',
            name: 'authorityType',
            type: { kind: 'definedTypeLinkNode', name: 'authorityType' },
            docs: ['The type of authority to update.'],
          },
          {
            kind: 'instructionArgumentNode',
            name: 'newAuthority',
            type: {
              kind: 'optionTypeNode',
              item: { kind: 'publicKeyTypeNode' },
              prefix: {
                kind: 'numberTypeNode',
                format: 'u8',
                endian: 'le',
              },
              fixed: false,
            },
            docs: ['The new authority'],
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
            isOptional: true,
            isSigner: true,
          },
        ],
        name: 'setAuthority',
        docs: ['Sets a new authority of a mint or account.'],
        optionalAccountStrategy: 'programId',
      },
      {
        kind: 'instructionNode',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'mint',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The mint account.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'token',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The account to mint tokens to.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'mintAuthority',
            isWritable: false,
            isSigner: 'either',
            isOptional: false,
            docs: ["The mint's minting authority or its multisignature account."],
          },
        ],
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
            defaultValue: { kind: 'numberValueNode', number: 7 },
            defaultValueStrategy: 'omitted',
          },
          {
            kind: 'instructionArgumentNode',
            name: 'amount',
            type: {
              kind: 'numberTypeNode',
              format: 'u64',
              endian: 'le',
            },
            docs: ['The amount of new tokens to mint.'],
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
            isOptional: true,
            isSigner: true,
          },
        ],
        name: 'mintTo',
        docs: ['Mints new tokens to an account. The native mint does not support minting.'],
        optionalAccountStrategy: 'programId',
      },
      {
        kind: 'instructionNode',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'account',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The account to burn from.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'mint',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The token mint.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'authority',
            isWritable: false,
            isSigner: 'either',
            isOptional: false,
            docs: ["The account's owner/delegate or its multisignature account."],
            defaultValue: { kind: 'identityValueNode' },
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            docs: ['The amount of tokens to burn.'],
            defaultValue: { kind: 'numberValueNode', number: 8 },
            defaultValueStrategy: 'omitted',
          },
          {
            kind: 'instructionArgumentNode',
            name: 'amount',
            type: {
              kind: 'numberTypeNode',
              format: 'u64',
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
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
            isOptional: true,
            isSigner: true,
          },
        ],
        name: 'burn',
        docs: [
          'Burns tokens by removing them from an account. `Burn` does not support',
          'accounts associated with the native mint, use `CloseAccount` instead.',
        ],
        optionalAccountStrategy: 'programId',
      },
      {
        kind: 'instructionNode',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'account',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The account to close.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'destination',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The destination account.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'owner',
            isWritable: false,
            isSigner: 'either',
            isOptional: false,
            docs: ["The account's owner or its multisignature account."],
          },
        ],
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
            defaultValue: { kind: 'numberValueNode', number: 9 },
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
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
            isOptional: true,
            isSigner: true,
          },
        ],
        name: 'closeAccount',
        docs: [
          'Close an account by transferring all its SOL to the destination account.',
          'Non-native accounts may only be closed if its token amount is zero.',
        ],
        optionalAccountStrategy: 'programId',
      },
      {
        kind: 'instructionNode',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'account',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The account to freeze.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'mint',
            isWritable: false,
            isSigner: false,
            isOptional: false,
            docs: ['The token mint.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'owner',
            isWritable: false,
            isSigner: 'either',
            isOptional: false,
            docs: ['The mint freeze authority or its multisignature account.'],
          },
        ],
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
            defaultValue: { kind: 'numberValueNode', number: 10 },
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
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
            isOptional: true,
            isSigner: true,
          },
        ],
        name: 'freezeAccount',
        docs: ["Freeze an Initialized account using the Mint's freeze_authority (if set)."],
        optionalAccountStrategy: 'programId',
      },
      {
        kind: 'instructionNode',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'account',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The account to thaw.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'mint',
            isWritable: false,
            isSigner: false,
            isOptional: false,
            docs: ['The token mint.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'owner',
            isWritable: false,
            isSigner: 'either',
            isOptional: false,
            docs: ['The mint freeze authority or its multisignature account.'],
          },
        ],
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
            defaultValue: { kind: 'numberValueNode', number: 11 },
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
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
            isOptional: true,
            isSigner: true,
          },
        ],
        name: 'thawAccount',
        docs: ["Thaw a Frozen account using the Mint's freeze_authority (if set)."],
        optionalAccountStrategy: 'programId',
      },
      {
        kind: 'instructionNode',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'source',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The source account.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'mint',
            isWritable: false,
            isSigner: false,
            isOptional: false,
            docs: ['The token mint.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'destination',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The destination account.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'authority',
            isWritable: false,
            isSigner: 'either',
            isOptional: false,
            docs: ["The source account's owner/delegate or its multisignature account."],
            defaultValue: { kind: 'identityValueNode' },
          },
        ],
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
            defaultValue: { kind: 'numberValueNode', number: 12 },
            defaultValueStrategy: 'omitted',
          },
          {
            kind: 'instructionArgumentNode',
            name: 'amount',
            type: {
              kind: 'numberTypeNode',
              format: 'u64',
              endian: 'le',
            },
            docs: ['The amount of tokens to transfer.'],
          },
          {
            kind: 'instructionArgumentNode',
            name: 'decimals',
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            docs: ['Expected number of base 10 digits to the right of the decimal place.'],
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
            isOptional: true,
            isSigner: true,
          },
        ],
        name: 'transferChecked',
        docs: [
          'Transfers tokens from one account to another either directly or via a',
          'delegate. If this account is associated with the native mint then equal',
          'amounts of SOL and Tokens will be transferred to the destination account.',
          '',
          'This instruction differs from Transfer in that the token mint and',
          'decimals value is checked by the caller. This may be useful when',
          'creating transactions offline or within a hardware wallet.',
        ],
        optionalAccountStrategy: 'programId',
      },
      {
        kind: 'instructionNode',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'source',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The source account.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'mint',
            isWritable: false,
            isSigner: false,
            isOptional: false,
            docs: ['The token mint.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'delegate',
            isWritable: false,
            isSigner: false,
            isOptional: false,
            docs: ['The delegate.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'owner',
            isWritable: false,
            isSigner: 'either',
            isOptional: false,
            docs: ['The source account owner or its multisignature account.'],
          },
        ],
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
            defaultValue: { kind: 'numberValueNode', number: 13 },
            defaultValueStrategy: 'omitted',
          },
          {
            kind: 'instructionArgumentNode',
            name: 'amount',
            type: {
              kind: 'numberTypeNode',
              format: 'u64',
              endian: 'le',
            },
            docs: ['The amount of tokens the delegate is approved for.'],
          },
          {
            kind: 'instructionArgumentNode',
            name: 'decimals',
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            docs: ['Expected number of base 10 digits to the right of the decimal place.'],
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
            isOptional: true,
            isSigner: true,
          },
        ],
        name: 'approveChecked',
        docs: [
          'Approves a delegate. A delegate is given the authority over tokens on',
          "behalf of the source account's owner.",
          '',
          'This instruction differs from Approve in that the token mint and',
          'decimals value is checked by the caller. This may be useful when',
          'creating transactions offline or within a hardware wallet.',
        ],
        optionalAccountStrategy: 'programId',
      },
      {
        kind: 'instructionNode',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'mint',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The mint.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'token',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The account to mint tokens to.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'mintAuthority',
            isWritable: false,
            isSigner: 'either',
            isOptional: false,
            docs: ["The mint's minting authority or its multisignature account."],
          },
        ],
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
            defaultValue: { kind: 'numberValueNode', number: 14 },
            defaultValueStrategy: 'omitted',
          },
          {
            kind: 'instructionArgumentNode',
            name: 'amount',
            type: {
              kind: 'numberTypeNode',
              format: 'u64',
              endian: 'le',
            },
            docs: ['The amount of new tokens to mint.'],
          },
          {
            kind: 'instructionArgumentNode',
            name: 'decimals',
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            docs: ['Expected number of base 10 digits to the right of the decimal place.'],
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
            isOptional: true,
            isSigner: true,
          },
        ],
        name: 'mintToChecked',
        docs: [
          'Mints new tokens to an account. The native mint does not support minting.',
          '',
          'This instruction differs from MintTo in that the decimals value is',
          'checked by the caller. This may be useful when creating transactions',
          'offline or within a hardware wallet.',
        ],
        optionalAccountStrategy: 'programId',
      },
      {
        kind: 'instructionNode',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'account',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The account to burn from.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'mint',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The token mint.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'authority',
            isWritable: false,
            isSigner: 'either',
            isOptional: false,
            docs: ["The account's owner/delegate or its multisignature account."],
            defaultValue: { kind: 'identityValueNode' },
          },
        ],
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
            defaultValue: { kind: 'numberValueNode', number: 15 },
            defaultValueStrategy: 'omitted',
          },
          {
            kind: 'instructionArgumentNode',
            name: 'amount',
            type: {
              kind: 'numberTypeNode',
              format: 'u64',
              endian: 'le',
            },
            docs: ['The amount of tokens to burn.'],
          },
          {
            kind: 'instructionArgumentNode',
            name: 'decimals',
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            docs: ['Expected number of base 10 digits to the right of the decimal place.'],
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
            isOptional: true,
            isSigner: true,
          },
        ],
        name: 'burnChecked',
        docs: [
          'Burns tokens by removing them from an account. `BurnChecked` does not',
          'support accounts associated with the native mint, use `CloseAccount` instead.',
          '',
          'This instruction differs from Burn in that the decimals value is checked',
          'by the caller. This may be useful when creating transactions offline or',
          'within a hardware wallet.',
        ],
        optionalAccountStrategy: 'programId',
      },
      {
        kind: 'instructionNode',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'account',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The account to initialize.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'mint',
            isWritable: false,
            isSigner: false,
            isOptional: false,
            docs: ['The mint this account will be associated with.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'rent',
            isWritable: false,
            isSigner: false,
            isOptional: false,
            docs: ['Rent sysvar.'],
            defaultValue: {
              kind: 'publicKeyValueNode',
              publicKey: 'SysvarRent111111111111111111111111111111111',
            },
          },
        ],
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
            defaultValue: { kind: 'numberValueNode', number: 16 },
            defaultValueStrategy: 'omitted',
          },
          {
            kind: 'instructionArgumentNode',
            name: 'owner',
            type: { kind: 'publicKeyTypeNode' },
            docs: ["The new account's owner/multisignature."],
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
        name: 'initializeAccount2',
        docs: [
          'Like InitializeAccount, but the owner pubkey is passed via instruction',
          'data rather than the accounts list. This variant may be preferable',
          'when using Cross Program Invocation from an instruction that does',
          "not need the owner's `AccountInfo` otherwise.",
        ],
        optionalAccountStrategy: 'programId',
      },
      {
        kind: 'instructionNode',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'account',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The native token account to sync with its underlying lamports.'],
          },
        ],
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
            defaultValue: { kind: 'numberValueNode', number: 17 },
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
        name: 'syncNative',
        docs: [
          'Given a wrapped / native token account (a token account containing SOL)',
          "updates its amount field based on the account's underlying `lamports`.",
          'This is useful if a non-wrapped SOL account uses',
          '`system_instruction::transfer` to move lamports to a wrapped token',
          'account, and needs to have its token `amount` field updated.',
        ],
        optionalAccountStrategy: 'programId',
      },
      {
        kind: 'instructionNode',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'account',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The account to initialize.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'mint',
            isWritable: false,
            isSigner: false,
            isOptional: false,
            docs: ['The mint this account will be associated with.'],
          },
        ],
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
            defaultValue: { kind: 'numberValueNode', number: 18 },
            defaultValueStrategy: 'omitted',
          },
          {
            kind: 'instructionArgumentNode',
            name: 'owner',
            type: { kind: 'publicKeyTypeNode' },
            docs: ["The new account's owner/multisignature."],
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
        name: 'initializeAccount3',
        docs: ['Like InitializeAccount2, but does not require the Rent sysvar to be provided.'],
        optionalAccountStrategy: 'programId',
      },
      {
        kind: 'instructionNode',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'multisig',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The multisignature account to initialize.'],
          },
        ],
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
            defaultValue: { kind: 'numberValueNode', number: 19 },
            defaultValueStrategy: 'omitted',
          },
          {
            kind: 'instructionArgumentNode',
            name: 'm',
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            docs: ['The number of signers (M) required to validate this multisignature account.'],
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            value: {
              kind: 'argumentValueNode',
              name: 'signers',
            },
          },
        ],
        name: 'initializeMultisig2',
        docs: ['Like InitializeMultisig, but does not require the Rent sysvar to be provided.'],
        optionalAccountStrategy: 'programId',
      },
      {
        kind: 'instructionNode',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'mint',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The mint to initialize.'],
          },
        ],
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
            defaultValue: { kind: 'numberValueNode', number: 20 },
            defaultValueStrategy: 'omitted',
          },
          {
            kind: 'instructionArgumentNode',
            name: 'decimals',
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            docs: ['Number of base 10 digits to the right of the decimal place.'],
          },
          {
            kind: 'instructionArgumentNode',
            name: 'mintAuthority',
            type: { kind: 'publicKeyTypeNode' },
            docs: ['The authority/multisignature to mint tokens.'],
          },
          {
            kind: 'instructionArgumentNode',
            name: 'freezeAuthority',
            type: {
              kind: 'optionTypeNode',
              item: { kind: 'publicKeyTypeNode' },
              prefix: {
                kind: 'numberTypeNode',
                format: 'u8',
                endian: 'le',
              },
              fixed: false,
            },
            defaultValue: {
              kind: 'noneValueNode',
            },
            docs: ['The optional freeze authority/multisignature of the mint.'],
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
        name: 'initializeMint2',
        docs: ['Like [`InitializeMint`], but does not require the Rent sysvar to be provided.'],
        optionalAccountStrategy: 'programId',
      },
      {
        kind: 'instructionNode',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'mint',
            isWritable: false,
            isSigner: false,
            isOptional: false,
            docs: ['The mint to calculate for.'],
          },
        ],
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
            defaultValue: { kind: 'numberValueNode', number: 21 },
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
        name: 'getAccountDataSize',
        docs: [
          'Gets the required size of an account for the given mint as a',
          'little-endian `u64`.',
          '',
          'Return data can be fetched using `sol_get_return_data` and deserializing',
          'the return data as a little-endian `u64`.',
        ],
        optionalAccountStrategy: 'programId',
      },
      {
        kind: 'instructionNode',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'account',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The account to initialize.'],
          },
        ],
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
            defaultValue: { kind: 'numberValueNode', number: 22 },
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
        name: 'initializeImmutableOwner',
        docs: [
          'Initialize the Immutable Owner extension for the given token account',
          '',
          'Fails if the account has already been initialized, so must be called',
          'before `InitializeAccount`.',
          '',
          'No-ops in this version of the program, but is included for compatibility',
          'with the Associated Token Account program.',
        ],
        optionalAccountStrategy: 'programId',
      },
      {
        kind: 'instructionNode',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'mint',
            isWritable: false,
            isSigner: false,
            isOptional: false,
            docs: ['The mint to calculate for.'],
          },
        ],
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
            defaultValue: { kind: 'numberValueNode', number: 23 },
            defaultValueStrategy: 'omitted',
          },
          {
            kind: 'instructionArgumentNode',
            name: 'amount',
            type: {
              kind: 'numberTypeNode',
              format: 'u64',
              endian: 'le',
            },
            docs: ['The amount of tokens to reformat.'],
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
        name: 'amountToUiAmount',
        docs: [
          'Convert an Amount of tokens to a UiAmount `string`, using the given',
          'mint. In this version of the program, the mint can only specify the',
          'number of decimals.',
          '',
          'Fails on an invalid mint.',
          '',
          'Return data can be fetched using `sol_get_return_data` and deserialized',
          'with `String::from_utf8`.',
        ],
        optionalAccountStrategy: 'programId',
      },
      {
        kind: 'instructionNode',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'mint',
            isWritable: false,
            isSigner: false,
            isOptional: false,
            docs: ['The mint to calculate for.'],
          },
        ],
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
            defaultValue: { kind: 'numberValueNode', number: 24 },
            defaultValueStrategy: 'omitted',
          },
          {
            kind: 'instructionArgumentNode',
            name: 'uiAmount',
            type: {
              kind: 'stringTypeNode',
              encoding: 'utf8',
            },
            docs: ['The ui_amount of tokens to reformat.'],
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
        name: 'uiAmountToAmount',
        docs: [
          'Convert a UiAmount of tokens to a little-endian `u64` raw Amount, using',
          'the given mint. In this version of the program, the mint can only',
          'specify the number of decimals.',
          '',
          'Return data can be fetched using `sol_get_return_data` and deserializing',
          'the return data as a little-endian `u64`.',
        ],
        optionalAccountStrategy: 'programId',
      },
    ],
    definedTypes: [
      {
        kind: 'definedTypeNode',
        name: 'accountState',
        type: {
          kind: 'enumTypeNode',
          variants: [
            { kind: 'enumEmptyVariantTypeNode', name: 'uninitialized' },
            { kind: 'enumEmptyVariantTypeNode', name: 'initialized' },
            { kind: 'enumEmptyVariantTypeNode', name: 'frozen' },
          ],
          size: { kind: 'numberTypeNode', format: 'u8', endian: 'le' },
        },
        docs: [],
      },
      {
        kind: 'definedTypeNode',
        name: 'authorityType',
        type: {
          kind: 'enumTypeNode',
          variants: [
            { kind: 'enumEmptyVariantTypeNode', name: 'mintTokens' },
            { kind: 'enumEmptyVariantTypeNode', name: 'freezeAccount' },
            { kind: 'enumEmptyVariantTypeNode', name: 'accountOwner' },
            { kind: 'enumEmptyVariantTypeNode', name: 'closeAccount' },
          ],
          size: { kind: 'numberTypeNode', format: 'u8', endian: 'le' },
        },
        docs: [],
      },
    ],
    errors: [
      {
        kind: 'errorNode',
        name: 'notRentExempt',
        code: 0,
        message: 'Lamport balance below rent-exempt threshold',
        docs: ['NotRentExempt: Lamport balance below rent-exempt threshold'],
      },
      {
        kind: 'errorNode',
        name: 'insufficientFunds',
        code: 1,
        message: 'Insufficient funds',
        docs: ['InsufficientFunds: Insufficient funds'],
      },
      {
        kind: 'errorNode',
        name: 'invalidMint',
        code: 2,
        message: 'Invalid Mint',
        docs: ['InvalidMint: Invalid Mint'],
      },
      {
        kind: 'errorNode',
        name: 'mintMismatch',
        code: 3,
        message: 'Account not associated with this Mint',
        docs: ['MintMismatch: Account not associated with this Mint'],
      },
      {
        kind: 'errorNode',
        name: 'ownerMismatch',
        code: 4,
        message: 'Owner does not match',
        docs: ['OwnerMismatch: Owner does not match'],
      },
      {
        kind: 'errorNode',
        name: 'fixedSupply',
        code: 5,
        message: 'Fixed supply',
        docs: ['FixedSupply: Fixed supply'],
      },
      {
        kind: 'errorNode',
        name: 'alreadyInUse',
        code: 6,
        message: 'Already in use',
        docs: ['AlreadyInUse: Already in use'],
      },
      {
        kind: 'errorNode',
        name: 'invalidNumberOfProvidedSigners',
        code: 7,
        message: 'Invalid number of provided signers',
        docs: ['InvalidNumberOfProvidedSigners: Invalid number of provided signers'],
      },
      {
        kind: 'errorNode',
        name: 'invalidNumberOfRequiredSigners',
        code: 8,
        message: 'Invalid number of required signers',
        docs: ['InvalidNumberOfRequiredSigners: Invalid number of required signers'],
      },
      {
        kind: 'errorNode',
        name: 'uninitializedState',
        code: 9,
        message: 'State is unititialized',
        docs: ['UninitializedState: State is unititialized'],
      },
      {
        kind: 'errorNode',
        name: 'nativeNotSupported',
        code: 10,
        message: 'Instruction does not support native tokens',
        docs: ['NativeNotSupported: Instruction does not support native tokens'],
      },
      {
        kind: 'errorNode',
        name: 'nonNativeHasBalance',
        code: 11,
        message: 'Non-native account can only be closed if its balance is zero',
        docs: ['NonNativeHasBalance: Non-native account can only be closed if its balance is zero'],
      },
      {
        kind: 'errorNode',
        name: 'invalidInstruction',
        code: 12,
        message: 'Invalid instruction',
        docs: ['InvalidInstruction: Invalid instruction'],
      },
      {
        kind: 'errorNode',
        name: 'invalidState',
        code: 13,
        message: 'State is invalid for requested operation',
        docs: ['InvalidState: State is invalid for requested operation'],
      },
      {
        kind: 'errorNode',
        name: 'overflow',
        code: 14,
        message: 'Operation overflowed',
        docs: ['Overflow: Operation overflowed'],
      },
      {
        kind: 'errorNode',
        name: 'authorityTypeNotSupported',
        code: 15,
        message: 'Account does not support specified authority type',
        docs: ['AuthorityTypeNotSupported: Account does not support specified authority type'],
      },
      {
        kind: 'errorNode',
        name: 'mintCannotFreeze',
        code: 16,
        message: 'This token mint cannot freeze accounts',
        docs: ['MintCannotFreeze: This token mint cannot freeze accounts'],
      },
      {
        kind: 'errorNode',
        name: 'accountFrozen',
        code: 17,
        message: 'Account is frozen',
        docs: ['AccountFrozen: Account is frozen'],
      },
      {
        kind: 'errorNode',
        name: 'mintDecimalsMismatch',
        code: 18,
        message: 'The provided decimals value different from the Mint decimals',
        docs: [
          'MintDecimalsMismatch: The provided decimals value different from the Mint decimals',
        ],
      },
      {
        kind: 'errorNode',
        name: 'nonNativeNotSupported',
        code: 19,
        message: 'Instruction does not support non-native tokens',
        docs: ['NonNativeNotSupported: Instruction does not support non-native tokens'],
      },
    ],
    name: 'token',
    prefix: '',
    publicKey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    version: '3.3.0',
    origin: 'shank',
  },
  additionalPrograms: [
    {
      kind: 'programNode',
      pdas: [
        {
          kind: 'pdaNode',
          name: 'associatedToken',
          seeds: [
            {
              kind: 'variablePdaSeedNode',
              name: 'owner',
              docs: ['The wallet address of the associated token account.'],
              type: {
                kind: 'publicKeyTypeNode',
              },
            },
            {
              kind: 'variablePdaSeedNode',
              name: 'tokenProgram',
              docs: ['The address of the token program to use.'],
              type: {
                kind: 'publicKeyTypeNode',
              },
            },
            {
              kind: 'variablePdaSeedNode',
              name: 'mint',
              docs: ['The mint address of the associated token account.'],
              type: {
                kind: 'publicKeyTypeNode',
              },
            },
          ],
        },
      ],
      accounts: [],
      instructions: [
        {
          kind: 'instructionNode',
          accounts: [
            {
              kind: 'instructionAccountNode',
              name: 'payer',
              isWritable: true,
              isSigner: true,
              isOptional: false,
              docs: ['Funding account (must be a system account).'],
              defaultValue: { kind: 'payerValueNode' },
            },
            {
              kind: 'instructionAccountNode',
              name: 'ata',
              isWritable: true,
              isSigner: false,
              isOptional: false,
              docs: ['Associated token account address to be created.'],
              defaultValue: {
                kind: 'pdaValueNode',
                pda: {
                  kind: 'pdaLinkNode',
                  name: 'associatedToken',
                },
                seeds: [
                  {
                    kind: 'pdaSeedValueNode',
                    name: 'owner',
                    value: {
                      kind: 'accountValueNode',
                      name: 'owner',
                    },
                  },
                  {
                    kind: 'pdaSeedValueNode',
                    name: 'tokenProgram',
                    value: {
                      kind: 'accountValueNode',
                      name: 'tokenProgram',
                    },
                  },
                  {
                    kind: 'pdaSeedValueNode',
                    name: 'mint',
                    value: {
                      kind: 'accountValueNode',
                      name: 'mint',
                    },
                  },
                ],
              },
            },
            {
              kind: 'instructionAccountNode',
              name: 'owner',
              isWritable: false,
              isSigner: false,
              isOptional: false,
              docs: ['Wallet address for the new associated token account.'],
            },
            {
              kind: 'instructionAccountNode',
              name: 'mint',
              isWritable: false,
              isSigner: false,
              isOptional: false,
              docs: ['The token mint for the new associated token account.'],
            },
            {
              kind: 'instructionAccountNode',
              name: 'systemProgram',
              isWritable: false,
              isSigner: false,
              isOptional: false,
              docs: ['System program.'],
              defaultValue: {
                kind: 'publicKeyValueNode',
                publicKey: '11111111111111111111111111111111',
              },
            },
            {
              kind: 'instructionAccountNode',
              name: 'tokenProgram',
              isWritable: false,
              isSigner: false,
              isOptional: false,
              docs: ['SPL Token program.'],
              defaultValue: {
                kind: 'publicKeyValueNode',
                publicKey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              },
            },
          ],
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
          ],
          discriminators: [
            {
              kind: 'fieldDiscriminatorNode',
              name: 'discriminator',
              offset: 0,
            },
          ],
          name: 'createAssociatedToken',
          docs: [
            'Creates an associated token account for the given wallet address and',
            'token mint Returns an error if the account exists.',
          ],
          optionalAccountStrategy: 'programId',
        },
        {
          kind: 'instructionNode',
          accounts: [
            {
              kind: 'instructionAccountNode',
              name: 'payer',
              isWritable: true,
              isSigner: true,
              isOptional: false,
              docs: ['Funding account (must be a system account).'],
              defaultValue: { kind: 'payerValueNode' },
            },
            {
              kind: 'instructionAccountNode',
              name: 'ata',
              isWritable: true,
              isSigner: false,
              isOptional: false,
              docs: ['Associated token account address to be created.'],
              defaultValue: {
                kind: 'pdaValueNode',
                pda: {
                  kind: 'pdaLinkNode',
                  name: 'associatedToken',
                },
                seeds: [
                  {
                    kind: 'pdaSeedValueNode',
                    name: 'owner',
                    value: {
                      kind: 'accountValueNode',
                      name: 'owner',
                    },
                  },
                  {
                    kind: 'pdaSeedValueNode',
                    name: 'tokenProgram',
                    value: {
                      kind: 'accountValueNode',
                      name: 'tokenProgram',
                    },
                  },
                  {
                    kind: 'pdaSeedValueNode',
                    name: 'mint',
                    value: {
                      kind: 'accountValueNode',
                      name: 'mint',
                    },
                  },
                ],
              },
            },
            {
              kind: 'instructionAccountNode',
              name: 'owner',
              isWritable: false,
              isSigner: false,
              isOptional: false,
              docs: ['Wallet address for the new associated token account.'],
            },
            {
              kind: 'instructionAccountNode',
              name: 'mint',
              isWritable: false,
              isSigner: false,
              isOptional: false,
              docs: ['The token mint for the new associated token account.'],
            },
            {
              kind: 'instructionAccountNode',
              name: 'systemProgram',
              isWritable: false,
              isSigner: false,
              isOptional: false,
              docs: ['System program.'],
              defaultValue: {
                kind: 'publicKeyValueNode',
                publicKey: '11111111111111111111111111111111',
              },
            },
            {
              kind: 'instructionAccountNode',
              name: 'tokenProgram',
              isWritable: false,
              isSigner: false,
              isOptional: false,
              docs: ['SPL Token program.'],
              defaultValue: {
                kind: 'publicKeyValueNode',
                publicKey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              },
            },
          ],
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
          ],
          discriminators: [
            {
              kind: 'fieldDiscriminatorNode',
              name: 'discriminator',
              offset: 0,
            },
          ],
          name: 'createAssociatedTokenIdempotent',
          docs: [
            'Creates an associated token account for the given wallet address and',
            "token mint, if it doesn't already exist. Returns an error if the",
            'account exists, but with a different owner.',
          ],
          optionalAccountStrategy: 'programId',
        },
        {
          kind: 'instructionNode',
          accounts: [
            {
              kind: 'instructionAccountNode',
              name: 'nestedAssociatedAccountAddress',
              isWritable: true,
              isSigner: false,
              isOptional: false,
              docs: [
                'Nested associated token account, must be owned by `ownerAssociatedAccountAddress`.',
              ],
              defaultValue: {
                kind: 'pdaValueNode',
                pda: {
                  kind: 'pdaLinkNode',
                  name: 'associatedToken',
                },
                seeds: [
                  {
                    kind: 'pdaSeedValueNode',
                    name: 'owner',
                    value: {
                      kind: 'accountValueNode',
                      name: 'ownerAssociatedAccountAddress',
                    },
                  },
                  {
                    kind: 'pdaSeedValueNode',
                    name: 'tokenProgram',
                    value: {
                      kind: 'accountValueNode',
                      name: 'tokenProgram',
                    },
                  },
                  {
                    kind: 'pdaSeedValueNode',
                    name: 'mint',
                    value: {
                      kind: 'accountValueNode',
                      name: 'nestedTokenMintAddress',
                    },
                  },
                ],
              },
            },
            {
              kind: 'instructionAccountNode',
              name: 'nestedTokenMintAddress',
              isWritable: false,
              isSigner: false,
              isOptional: false,
              docs: ['Token mint for the nested associated token account.'],
            },
            {
              kind: 'instructionAccountNode',
              name: 'destinationAssociatedAccountAddress',
              isWritable: true,
              isSigner: false,
              isOptional: false,
              docs: ["Wallet's associated token account."],
              defaultValue: {
                kind: 'pdaValueNode',
                pda: {
                  kind: 'pdaLinkNode',
                  name: 'associatedToken',
                },
                seeds: [
                  {
                    kind: 'pdaSeedValueNode',
                    name: 'owner',
                    value: {
                      kind: 'accountValueNode',
                      name: 'walletAddress',
                    },
                  },
                  {
                    kind: 'pdaSeedValueNode',
                    name: 'tokenProgram',
                    value: {
                      kind: 'accountValueNode',
                      name: 'tokenProgram',
                    },
                  },
                  {
                    kind: 'pdaSeedValueNode',
                    name: 'mint',
                    value: {
                      kind: 'accountValueNode',
                      name: 'nestedTokenMintAddress',
                    },
                  },
                ],
              },
            },
            {
              kind: 'instructionAccountNode',
              name: 'ownerAssociatedAccountAddress',
              isWritable: false,
              isSigner: false,
              isOptional: false,
              docs: ['Owner associated token account address, must be owned by `walletAddress`.'],
              defaultValue: {
                kind: 'pdaValueNode',
                pda: {
                  kind: 'pdaLinkNode',
                  name: 'associatedToken',
                },
                seeds: [
                  {
                    kind: 'pdaSeedValueNode',
                    name: 'owner',
                    value: {
                      kind: 'accountValueNode',
                      name: 'walletAddress',
                    },
                  },
                  {
                    kind: 'pdaSeedValueNode',
                    name: 'tokenProgram',
                    value: {
                      kind: 'accountValueNode',
                      name: 'tokenProgram',
                    },
                  },
                  {
                    kind: 'pdaSeedValueNode',
                    name: 'mint',
                    value: {
                      kind: 'accountValueNode',
                      name: 'ownerTokenMintAddress',
                    },
                  },
                ],
              },
            },
            {
              kind: 'instructionAccountNode',
              name: 'ownerTokenMintAddress',
              isWritable: false,
              isSigner: false,
              isOptional: false,
              docs: ['Token mint for the owner associated token account.'],
            },
            {
              kind: 'instructionAccountNode',
              name: 'walletAddress',
              isWritable: true,
              isSigner: true,
              isOptional: false,
              docs: ['Wallet address for the owner associated token account.'],
            },
            {
              kind: 'instructionAccountNode',
              name: 'tokenProgram',
              isWritable: false,
              isSigner: false,
              isOptional: false,
              docs: ['SPL Token program.'],
              defaultValue: {
                kind: 'publicKeyValueNode',
                publicKey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              },
            },
          ],
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
          ],
          discriminators: [
            {
              kind: 'fieldDiscriminatorNode',
              name: 'discriminator',
              offset: 0,
            },
          ],
          name: 'recoverNestedAssociatedToken',
          docs: [
            'Transfers from and closes a nested associated token account: an',
            'associated token account owned by an associated token account.',
            '',
            'The tokens are moved from the nested associated token account to the',
            "wallet's associated token account, and the nested account lamports are",
            'moved to the wallet.',
            '',
            'Note: Nested token accounts are an anti-pattern, and almost always',
            'created unintentionally, so this instruction should only be used to',
            'recover from errors.',
          ],
          optionalAccountStrategy: 'programId',
        },
      ],
      definedTypes: [],
      errors: [
        {
          kind: 'errorNode',
          name: 'invalidOwner',
          code: 0,
          message: 'Associated token account owner does not match address derivation',
          docs: ['InvalidOwner: Associated token account owner does not match address derivation'],
        },
      ],
      name: 'associatedToken',
      prefix: '',
      publicKey: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
      version: '1.1.1',
      origin: 'shank',
    },
  ],
  standard: 'codama',
  version: '1.0.0',
} as const;
