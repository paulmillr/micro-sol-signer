export default {
  kind: 'rootNode',
  standard: 'codama',
  version: '1.0.0',
  program: {
    kind: 'programNode',
    name: 'token-2022',
    publicKey: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
    version: '3.0.2',
    origin: 'shank',
    docs: [],
    accounts: [
      {
        kind: 'accountNode',
        name: 'mint',
        docs: [],
        data: {
          kind: 'structTypeNode',
          fields: [
            {
              kind: 'structFieldTypeNode',
              name: 'mintAuthority',
              docs: [
                'Optional authority used to mint new tokens. The mint authority may only',
                'be provided during mint creation. If no mint authority is present',
                'then the mint has a fixed supply and no further tokens may be minted.',
              ],
              type: {
                kind: 'optionTypeNode',
                fixed: true,
                item: {
                  kind: 'publicKeyTypeNode',
                },
                prefix: {
                  kind: 'numberTypeNode',
                  format: 'u32',
                  endian: 'le',
                },
              },
            },
            {
              kind: 'structFieldTypeNode',
              name: 'supply',
              docs: ['Total supply of tokens.'],
              type: {
                kind: 'numberTypeNode',
                format: 'u64',
                endian: 'le',
              },
            },
            {
              kind: 'structFieldTypeNode',
              name: 'decimals',
              docs: ['Number of base 10 digits to the right of the decimal place.'],
              type: {
                kind: 'numberTypeNode',
                format: 'u8',
                endian: 'le',
              },
            },
            {
              kind: 'structFieldTypeNode',
              name: 'isInitialized',
              docs: ['Is `true` if this structure has been initialized.'],
              type: {
                kind: 'booleanTypeNode',
                size: {
                  kind: 'numberTypeNode',
                  format: 'u8',
                  endian: 'le',
                },
              },
            },
            {
              kind: 'structFieldTypeNode',
              name: 'freezeAuthority',
              docs: ['Optional authority to freeze token accounts.'],
              type: {
                kind: 'optionTypeNode',
                fixed: true,
                item: {
                  kind: 'publicKeyTypeNode',
                },
                prefix: {
                  kind: 'numberTypeNode',
                  format: 'u32',
                  endian: 'le',
                },
              },
            },
            {
              kind: 'structFieldTypeNode',
              name: 'extensions',
              docs: ['The extensions activated on the mint account.'],
              type: {
                kind: 'remainderOptionTypeNode',
                item: {
                  kind: 'hiddenPrefixTypeNode',
                  type: {
                    kind: 'arrayTypeNode',
                    item: {
                      kind: 'definedTypeLinkNode',
                      name: 'extension',
                    },
                    count: {
                      kind: 'remainderCountNode',
                    },
                  },
                  prefix: [
                    {
                      kind: 'constantValueNode',
                      type: {
                        kind: 'preOffsetTypeNode',
                        offset: 83,
                        strategy: 'padded',
                        type: {
                          kind: 'numberTypeNode',
                          format: 'u8',
                          endian: 'le',
                        },
                      },
                      value: {
                        kind: 'numberValueNode',
                        number: 1,
                      },
                    },
                  ],
                },
              },
            },
          ],
        },
        discriminators: [
          {
            kind: 'sizeDiscriminatorNode',
            size: 82,
          },
        ],
      },
      {
        kind: 'accountNode',
        name: 'token',
        docs: [],
        data: {
          kind: 'structTypeNode',
          fields: [
            {
              kind: 'structFieldTypeNode',
              name: 'mint',
              docs: ['The mint associated with this account.'],
              type: {
                kind: 'publicKeyTypeNode',
              },
            },
            {
              kind: 'structFieldTypeNode',
              name: 'owner',
              docs: ['The owner of this account.'],
              type: {
                kind: 'publicKeyTypeNode',
              },
            },
            {
              kind: 'structFieldTypeNode',
              name: 'amount',
              docs: ['The amount of tokens this account holds.'],
              type: {
                kind: 'numberTypeNode',
                format: 'u64',
                endian: 'le',
              },
            },
            {
              kind: 'structFieldTypeNode',
              name: 'delegate',
              docs: [
                'If `delegate` is `Some` then `delegated_amount` represents',
                'the amount authorized by the delegate.',
              ],
              type: {
                kind: 'optionTypeNode',
                fixed: true,
                item: {
                  kind: 'publicKeyTypeNode',
                },
                prefix: {
                  kind: 'numberTypeNode',
                  format: 'u32',
                  endian: 'le',
                },
              },
            },
            {
              kind: 'structFieldTypeNode',
              name: 'state',
              docs: ["The account's state."],
              type: {
                kind: 'definedTypeLinkNode',
                name: 'accountState',
              },
            },
            {
              kind: 'structFieldTypeNode',
              name: 'isNative',
              docs: [
                'If is_native.is_some, this is a native token, and the value logs the',
                'rent-exempt reserve. An Account is required to be rent-exempt, so',
                'the value is used by the Processor to ensure that wrapped SOL',
                'accounts do not drop below this threshold.',
              ],
              type: {
                kind: 'optionTypeNode',
                fixed: true,
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
              },
            },
            {
              kind: 'structFieldTypeNode',
              name: 'delegatedAmount',
              docs: ['The amount delegated.'],
              type: {
                kind: 'numberTypeNode',
                format: 'u64',
                endian: 'le',
              },
            },
            {
              kind: 'structFieldTypeNode',
              name: 'closeAuthority',
              docs: ['Optional authority to close the account.'],
              type: {
                kind: 'optionTypeNode',
                fixed: true,
                item: {
                  kind: 'publicKeyTypeNode',
                },
                prefix: {
                  kind: 'numberTypeNode',
                  format: 'u32',
                  endian: 'le',
                },
              },
            },
            {
              kind: 'structFieldTypeNode',
              name: 'extensions',
              docs: ['The extensions activated on the token account.'],
              type: {
                kind: 'remainderOptionTypeNode',
                item: {
                  kind: 'hiddenPrefixTypeNode',
                  type: {
                    kind: 'arrayTypeNode',
                    item: {
                      kind: 'definedTypeLinkNode',
                      name: 'extension',
                    },
                    count: {
                      kind: 'remainderCountNode',
                    },
                  },
                  prefix: [
                    {
                      kind: 'constantValueNode',
                      type: {
                        kind: 'numberTypeNode',
                        format: 'u8',
                        endian: 'le',
                      },
                      value: {
                        kind: 'numberValueNode',
                        number: 2,
                      },
                    },
                  ],
                },
              },
            },
          ],
        },
        discriminators: [
          {
            kind: 'sizeDiscriminatorNode',
            size: 165,
          },
        ],
      },
      {
        kind: 'accountNode',
        name: 'multisig',
        size: 355,
        docs: [],
        data: {
          kind: 'structTypeNode',
          fields: [
            {
              kind: 'structFieldTypeNode',
              name: 'm',
              docs: ['Number of signers required.'],
              type: {
                kind: 'numberTypeNode',
                format: 'u8',
                endian: 'le',
              },
            },
            {
              kind: 'structFieldTypeNode',
              name: 'n',
              docs: ['Number of valid signers.'],
              type: {
                kind: 'numberTypeNode',
                format: 'u8',
                endian: 'le',
              },
            },
            {
              kind: 'structFieldTypeNode',
              name: 'isInitialized',
              docs: ['Is `true` if this structure has been initialized.'],
              type: {
                kind: 'booleanTypeNode',
                size: {
                  kind: 'numberTypeNode',
                  format: 'u8',
                  endian: 'le',
                },
              },
            },
            {
              kind: 'structFieldTypeNode',
              name: 'signers',
              docs: ['Signer public keys.'],
              type: {
                kind: 'arrayTypeNode',
                item: {
                  kind: 'publicKeyTypeNode',
                },
                count: {
                  kind: 'fixedCountNode',
                  value: 11,
                },
              },
            },
          ],
        },
        discriminators: [
          {
            kind: 'sizeDiscriminatorNode',
            size: 355,
          },
        ],
      },
    ],
    instructions: [
      {
        kind: 'instructionNode',
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
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 0,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'decimals',
            docs: ['Number of decimals in token account amounts.'],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'mintAuthority',
            docs: ['Minting authority.'],
            type: {
              kind: 'publicKeyTypeNode',
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'freezeAuthority',
            docs: ['Optional authority that can freeze token accounts.'],
            type: {
              kind: 'optionTypeNode',
              fixed: false,
              item: {
                kind: 'publicKeyTypeNode',
              },
              prefix: {
                kind: 'numberTypeNode',
                format: 'u8',
                endian: 'le',
              },
            },
            defaultValue: {
              kind: 'noneValueNode',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
      },
      {
        kind: 'instructionNode',
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
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 1,
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
      },
      {
        kind: 'instructionNode',
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
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 2,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'm',
            docs: ['The number of signers (M) required to validate this multisignature account.'],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            docs: [],
            value: {
              kind: 'argumentValueNode',
              name: 'signers',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'transfer',
        docs: [
          'Transfers tokens from one account to another either directly or via a delegate.',
          'If this account is associated with the native mint then equal amounts',
          'of SOL and Tokens will be transferred to the destination account.',
        ],
        optionalAccountStrategy: 'programId',
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
            defaultValue: {
              kind: 'identityValueNode',
            },
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 3,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'amount',
            docs: ['The amount of tokens to transfer.'],
            type: {
              kind: 'numberTypeNode',
              format: 'u64',
              endian: 'le',
            },
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            isOptional: true,
            isSigner: true,
            docs: [],
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'approve',
        docs: [
          'Approves a delegate. A delegate is given the authority over tokens on',
          "behalf of the source account's owner.",
        ],
        optionalAccountStrategy: 'programId',
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
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 4,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'amount',
            docs: ['The amount of tokens the delegate is approved for.'],
            type: {
              kind: 'numberTypeNode',
              format: 'u64',
              endian: 'le',
            },
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            isOptional: true,
            isSigner: true,
            docs: [],
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'revoke',
        docs: ["Revokes the delegate's authority."],
        optionalAccountStrategy: 'programId',
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
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 5,
            },
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            isOptional: true,
            isSigner: true,
            docs: [],
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'setAuthority',
        docs: ['Sets a new authority of a mint or account.'],
        optionalAccountStrategy: 'programId',
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
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 6,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'authorityType',
            docs: ['The type of authority to update.'],
            type: {
              kind: 'definedTypeLinkNode',
              name: 'authorityType',
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'newAuthority',
            docs: ['The new authority'],
            type: {
              kind: 'optionTypeNode',
              fixed: false,
              item: {
                kind: 'publicKeyTypeNode',
              },
              prefix: {
                kind: 'numberTypeNode',
                format: 'u8',
                endian: 'le',
              },
            },
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            isOptional: true,
            isSigner: true,
            docs: [],
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'mintTo',
        docs: ['Mints new tokens to an account. The native mint does not support minting.'],
        optionalAccountStrategy: 'programId',
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
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 7,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'amount',
            docs: ['The amount of new tokens to mint.'],
            type: {
              kind: 'numberTypeNode',
              format: 'u64',
              endian: 'le',
            },
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            isOptional: true,
            isSigner: true,
            docs: [],
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'burn',
        docs: [
          'Burns tokens by removing them from an account. `Burn` does not support',
          'accounts associated with the native mint, use `CloseAccount` instead.',
        ],
        optionalAccountStrategy: 'programId',
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
            defaultValue: {
              kind: 'identityValueNode',
            },
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: ['The amount of tokens to burn.'],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 8,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'amount',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u64',
              endian: 'le',
            },
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            isOptional: true,
            isSigner: true,
            docs: [],
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'closeAccount',
        docs: [
          'Close an account by transferring all its SOL to the destination account.',
          'Non-native accounts may only be closed if its token amount is zero.',
        ],
        optionalAccountStrategy: 'programId',
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
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 9,
            },
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            isOptional: true,
            isSigner: true,
            docs: [],
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'freezeAccount',
        docs: ["Freeze an Initialized account using the Mint's freeze_authority (if set)."],
        optionalAccountStrategy: 'programId',
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
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 10,
            },
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            isOptional: true,
            isSigner: true,
            docs: [],
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'thawAccount',
        docs: ["Thaw a Frozen account using the Mint's freeze_authority (if set)."],
        optionalAccountStrategy: 'programId',
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
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 11,
            },
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            isOptional: true,
            isSigner: true,
            docs: [],
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
      },
      {
        kind: 'instructionNode',
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
            defaultValue: {
              kind: 'identityValueNode',
            },
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 12,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'amount',
            docs: ['The amount of tokens to transfer.'],
            type: {
              kind: 'numberTypeNode',
              format: 'u64',
              endian: 'le',
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'decimals',
            docs: ['Expected number of base 10 digits to the right of the decimal place.'],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            isOptional: true,
            isSigner: true,
            docs: [],
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
      },
      {
        kind: 'instructionNode',
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
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 13,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'amount',
            docs: ['The amount of tokens the delegate is approved for.'],
            type: {
              kind: 'numberTypeNode',
              format: 'u64',
              endian: 'le',
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'decimals',
            docs: ['Expected number of base 10 digits to the right of the decimal place.'],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            isOptional: true,
            isSigner: true,
            docs: [],
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'mintToChecked',
        docs: [
          'Mints new tokens to an account. The native mint does not support minting.',
          '',
          'This instruction differs from MintTo in that the decimals value is',
          'checked by the caller. This may be useful when creating transactions',
          'offline or within a hardware wallet.',
        ],
        optionalAccountStrategy: 'programId',
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
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 14,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'amount',
            docs: ['The amount of new tokens to mint.'],
            type: {
              kind: 'numberTypeNode',
              format: 'u64',
              endian: 'le',
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'decimals',
            docs: ['Expected number of base 10 digits to the right of the decimal place.'],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            isOptional: true,
            isSigner: true,
            docs: [],
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
      },
      {
        kind: 'instructionNode',
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
            defaultValue: {
              kind: 'identityValueNode',
            },
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 15,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'amount',
            docs: ['The amount of tokens to burn.'],
            type: {
              kind: 'numberTypeNode',
              format: 'u64',
              endian: 'le',
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'decimals',
            docs: ['Expected number of base 10 digits to the right of the decimal place.'],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            isOptional: true,
            isSigner: true,
            docs: [],
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'initializeAccount2',
        docs: [
          'Like InitializeAccount, but the owner pubkey is passed via instruction',
          'data rather than the accounts list. This variant may be preferable',
          'when using Cross Program Invocation from an instruction that does',
          "not need the owner's `AccountInfo` otherwise.",
        ],
        optionalAccountStrategy: 'programId',
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
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 16,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'owner',
            docs: ["The new account's owner/multisignature."],
            type: {
              kind: 'publicKeyTypeNode',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'syncNative',
        docs: [
          'Given a wrapped / native token account (a token account containing SOL)',
          "updates its amount field based on the account's underlying `lamports`.",
          'This is useful if a non-wrapped SOL account uses',
          '`system_instruction::transfer` to move lamports to a wrapped token',
          'account, and needs to have its token `amount` field updated.',
        ],
        optionalAccountStrategy: 'programId',
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
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 17,
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'initializeAccount3',
        docs: ['Like InitializeAccount2, but does not require the Rent sysvar to be provided.'],
        optionalAccountStrategy: 'programId',
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
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 18,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'owner',
            docs: ["The new account's owner/multisignature."],
            type: {
              kind: 'publicKeyTypeNode',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'initializeMultisig2',
        docs: ['Like InitializeMultisig, but does not require the Rent sysvar to be provided.'],
        optionalAccountStrategy: 'programId',
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
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 19,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'm',
            docs: ['The number of signers (M) required to validate this multisignature account.'],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            docs: [],
            value: {
              kind: 'argumentValueNode',
              name: 'signers',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'initializeMint2',
        docs: ['Like [`InitializeMint`], but does not require the Rent sysvar to be provided.'],
        optionalAccountStrategy: 'programId',
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
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 20,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'decimals',
            docs: ['Number of base 10 digits to the right of the decimal place.'],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'mintAuthority',
            docs: ['The authority/multisignature to mint tokens.'],
            type: {
              kind: 'publicKeyTypeNode',
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'freezeAuthority',
            docs: ['The optional freeze authority/multisignature of the mint.'],
            type: {
              kind: 'optionTypeNode',
              fixed: false,
              item: {
                kind: 'publicKeyTypeNode',
              },
              prefix: {
                kind: 'numberTypeNode',
                format: 'u8',
                endian: 'le',
              },
            },
            defaultValue: {
              kind: 'noneValueNode',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'getAccountDataSize',
        docs: [
          'Gets the required size of an account for the given mint as a',
          'little-endian `u64`.',
          '',
          'Return data can be fetched using `sol_get_return_data` and deserializing',
          'the return data as a little-endian `u64`.',
        ],
        optionalAccountStrategy: 'programId',
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
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 21,
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
      },
      {
        kind: 'instructionNode',
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
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 22,
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
      },
      {
        kind: 'instructionNode',
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
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 23,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'amount',
            docs: ['The amount of tokens to reformat.'],
            type: {
              kind: 'numberTypeNode',
              format: 'u64',
              endian: 'le',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
      },
      {
        kind: 'instructionNode',
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
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 24,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'uiAmount',
            docs: ['The ui_amount of tokens to reformat.'],
            type: {
              kind: 'stringTypeNode',
              encoding: 'utf8',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'initializeMintCloseAuthority',
        docs: [
          'Initialize the close account authority on a new mint.',
          '',
          'Fails if the mint has already been initialized, so must be called before `InitializeMint`.',
          '',
          'The mint must have exactly enough space allocated for the base mint (82',
          'bytes), plus 83 bytes of padding, 1 byte reserved for the account type,',
          'then space required for this extension, plus any others.',
        ],
        optionalAccountStrategy: 'programId',
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
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 25,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'closeAuthority',
            docs: ['Authority that must sign the `CloseAccount` instruction on a mint.'],
            type: {
              kind: 'optionTypeNode',
              fixed: false,
              item: {
                kind: 'publicKeyTypeNode',
              },
              prefix: {
                kind: 'numberTypeNode',
                format: 'u8',
                endian: 'le',
              },
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'initializeTransferFeeConfig',
        docs: [
          'Initialize the transfer fee on a new mint.',
          '',
          'Fails if the mint has already been initialized, so must be called before `InitializeMint`.',
          '',
          'The mint must have exactly enough space allocated for the base mint (82',
          'bytes), plus 83 bytes of padding, 1 byte reserved for the account type,',
          'then space required for this extension, plus any others.',
        ],
        optionalAccountStrategy: 'programId',
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
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 26,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'transferFeeDiscriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 0,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'transferFeeConfigAuthority',
            docs: ['Pubkey that may update the fees.'],
            type: {
              kind: 'optionTypeNode',
              fixed: false,
              item: {
                kind: 'publicKeyTypeNode',
              },
              prefix: {
                kind: 'numberTypeNode',
                format: 'u8',
                endian: 'le',
              },
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'withdrawWithheldAuthority',
            docs: ['Withdraw instructions must be signed by this key.'],
            type: {
              kind: 'optionTypeNode',
              fixed: false,
              item: {
                kind: 'publicKeyTypeNode',
              },
              prefix: {
                kind: 'numberTypeNode',
                format: 'u8',
                endian: 'le',
              },
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'transferFeeBasisPoints',
            docs: [
              'Amount of transfer collected as fees, expressed as basis points of the transfer amount.',
            ],
            type: {
              kind: 'numberTypeNode',
              format: 'u16',
              endian: 'le',
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'maximumFee',
            docs: ['Maximum fee assessed on transfers.'],
            type: {
              kind: 'numberTypeNode',
              format: 'u64',
              endian: 'le',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
          {
            kind: 'fieldDiscriminatorNode',
            name: 'transferFeeDiscriminator',
            offset: 1,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'transferCheckedWithFee',
        docs: [
          'Transfer, providing expected mint information and fees.',
          '',
          'This instruction succeeds if the mint has no configured transfer fee',
          'and the provided fee is 0. This allows applications to use',
          '`TransferCheckedWithFee` with any mint.',
        ],
        optionalAccountStrategy: 'programId',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'source',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The source account. May include the `TransferFeeAmount` extension.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'mint',
            isWritable: false,
            isSigner: false,
            isOptional: false,
            docs: ['The token mint. May include the `TransferFeeConfig` extension.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'destination',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The destination account. May include the `TransferFeeAmount` extension.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'authority',
            isWritable: false,
            isSigner: 'either',
            isOptional: false,
            docs: ["The source account's owner/delegate or its multisignature account."],
            defaultValue: {
              kind: 'identityValueNode',
            },
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 26,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'transferFeeDiscriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 1,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'amount',
            docs: ['The amount of tokens to transfer.'],
            type: {
              kind: 'numberTypeNode',
              format: 'u64',
              endian: 'le',
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'decimals',
            docs: ['Expected number of base 10 digits to the right of the decimal place.'],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'fee',
            docs: [
              'Expected fee assessed on this transfer, calculated off-chain based',
              'on the transfer_fee_basis_points and maximum_fee of the mint. May',
              'be 0 for a mint without a configured transfer fee.',
            ],
            type: {
              kind: 'numberTypeNode',
              format: 'u64',
              endian: 'le',
            },
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            isOptional: true,
            isSigner: true,
            docs: [],
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
          {
            kind: 'fieldDiscriminatorNode',
            name: 'transferFeeDiscriminator',
            offset: 1,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'withdrawWithheldTokensFromMint',
        docs: [
          'Transfer all withheld tokens in the mint to an account. Signed by the',
          "mint's withdraw withheld tokens authority.",
        ],
        optionalAccountStrategy: 'programId',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'mint',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The token mint. Must include the `TransferFeeConfig` extension.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'feeReceiver',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: [
              'The fee receiver account. Must include the `TransferFeeAmount`',
              'extension associated with the provided mint.',
            ],
          },
          {
            kind: 'instructionAccountNode',
            name: 'withdrawWithheldAuthority',
            isWritable: false,
            isSigner: 'either',
            isOptional: false,
            docs: ["The mint's `withdraw_withheld_authority` or its multisignature account."],
            defaultValue: {
              kind: 'identityValueNode',
            },
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 26,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'transferFeeDiscriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 2,
            },
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            isOptional: true,
            isSigner: true,
            docs: [],
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
          {
            kind: 'fieldDiscriminatorNode',
            name: 'transferFeeDiscriminator',
            offset: 1,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'withdrawWithheldTokensFromAccounts',
        docs: [
          "Transfer all withheld tokens to an account. Signed by the mint's",
          'withdraw withheld tokens authority.',
        ],
        optionalAccountStrategy: 'programId',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'mint',
            isWritable: false,
            isSigner: false,
            isOptional: false,
            docs: ['The token mint. Must include the `TransferFeeConfig` extension.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'feeReceiver',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: [
              'The fee receiver account. Must include the `TransferFeeAmount`',
              'extension associated with the provided mint.',
            ],
          },
          {
            kind: 'instructionAccountNode',
            name: 'withdrawWithheldAuthority',
            isWritable: false,
            isSigner: 'either',
            isOptional: false,
            docs: ["The mint's `withdraw_withheld_authority` or its multisignature account."],
            defaultValue: {
              kind: 'identityValueNode',
            },
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 26,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'transferFeeDiscriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 3,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'numTokenAccounts',
            docs: ['Number of token accounts harvested.'],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            isOptional: true,
            isSigner: true,
            docs: [],
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
          },
          {
            kind: 'instructionRemainingAccountsNode',
            isOptional: false,
            isWritable: true,
            isSigner: false,
            docs: ['The source accounts to withdraw from.'],
            value: {
              kind: 'argumentValueNode',
              name: 'sources',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
          {
            kind: 'fieldDiscriminatorNode',
            name: 'transferFeeDiscriminator',
            offset: 1,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'harvestWithheldTokensToMint',
        docs: [
          'Permissionless instruction to transfer all withheld tokens to the mint.',
          '',
          'Succeeds for frozen accounts.',
          '',
          'Accounts provided should include the `TransferFeeAmount` extension.',
          'If not, the account is skipped.',
        ],
        optionalAccountStrategy: 'programId',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'mint',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The token mint.'],
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 26,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'transferFeeDiscriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 4,
            },
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            isOptional: false,
            isWritable: true,
            isSigner: false,
            docs: ['The source accounts to harvest from.'],
            value: {
              kind: 'argumentValueNode',
              name: 'sources',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
          {
            kind: 'fieldDiscriminatorNode',
            name: 'transferFeeDiscriminator',
            offset: 1,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'setTransferFee',
        docs: [
          'Set transfer fee. Only supported for mints that include the',
          '`TransferFeeConfig` extension.',
        ],
        optionalAccountStrategy: 'programId',
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
            name: 'transferFeeConfigAuthority',
            isWritable: false,
            isSigner: 'either',
            isOptional: false,
            docs: ["The mint's fee account owner or its multisignature account."],
            defaultValue: {
              kind: 'identityValueNode',
            },
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 26,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'transferFeeDiscriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 5,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'transferFeeBasisPoints',
            docs: [
              'Amount of transfer collected as fees, expressed as basis points of the transfer amount.',
            ],
            type: {
              kind: 'numberTypeNode',
              format: 'u16',
              endian: 'le',
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'maximumFee',
            docs: ['Maximum fee assessed on transfers.'],
            type: {
              kind: 'numberTypeNode',
              format: 'u64',
              endian: 'le',
            },
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            isOptional: true,
            isSigner: true,
            docs: [],
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
          {
            kind: 'fieldDiscriminatorNode',
            name: 'transferFeeDiscriminator',
            offset: 1,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'initializeConfidentialTransferMint',
        docs: [
          'Initializes confidential transfers for a mint.',
          '',
          'The `ConfidentialTransferInstruction::InitializeMint` instruction',
          'requires no signers and MUST be included within the same Transaction',
          'as `TokenInstruction::InitializeMint`. Otherwise another party can',
          'initialize the configuration.',
          '',
          'The instruction fails if the `TokenInstruction::InitializeMint`',
          'instruction has already executed for the mint.',
        ],
        optionalAccountStrategy: 'programId',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'mint',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The SPL Token mint.'],
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 27,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'confidentialTransferDiscriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 0,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'authority',
            docs: [
              'Authority to modify the `ConfidentialTransferMint` configuration and to',
              'approve new accounts.',
            ],
            type: {
              kind: 'zeroableOptionTypeNode',
              item: {
                kind: 'publicKeyTypeNode',
              },
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'autoApproveNewAccounts',
            docs: [
              'Determines if newly configured accounts must be approved by the',
              '`authority` before they may be used by the user.',
            ],
            type: {
              kind: 'booleanTypeNode',
              size: {
                kind: 'numberTypeNode',
                format: 'u8',
                endian: 'le',
              },
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'auditorElgamalPubkey',
            docs: ['New authority to decode any transfer amount in a confidential transfer.'],
            type: {
              kind: 'zeroableOptionTypeNode',
              item: {
                kind: 'publicKeyTypeNode',
              },
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
          {
            kind: 'fieldDiscriminatorNode',
            name: 'confidentialTransferDiscriminator',
            offset: 1,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'updateConfidentialTransferMint',
        docs: [
          'Updates the confidential transfer mint configuration for a mint.',
          '',
          'Use `TokenInstruction::SetAuthority` to update the confidential transfer',
          'mint authority.',
        ],
        optionalAccountStrategy: 'programId',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'mint',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The SPL Token mint.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'authority',
            isWritable: false,
            isSigner: true,
            isOptional: false,
            docs: ['Confidential transfer mint authority.'],
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 27,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'confidentialTransferDiscriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 1,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'autoApproveNewAccounts',
            docs: [
              'Determines if newly configured accounts must be approved by the',
              '`authority` before they may be used by the user.',
            ],
            type: {
              kind: 'booleanTypeNode',
              size: {
                kind: 'numberTypeNode',
                format: 'u8',
                endian: 'le',
              },
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'auditorElgamalPubkey',
            docs: ['New authority to decode any transfer amount in a confidential transfer.'],
            type: {
              kind: 'zeroableOptionTypeNode',
              item: {
                kind: 'publicKeyTypeNode',
              },
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
          {
            kind: 'fieldDiscriminatorNode',
            name: 'confidentialTransferDiscriminator',
            offset: 1,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'configureConfidentialTransferAccount',
        docs: [
          'Configures confidential transfers for a token account.',
          '',
          'The instruction fails if the confidential transfers are already',
          'configured, or if the mint was not initialized with confidential',
          'transfer support.',
          '',
          'The instruction fails if the `TokenInstruction::InitializeAccount`',
          'instruction has not yet successfully executed for the token account.',
          '',
          'Upon success, confidential and non-confidential deposits and transfers',
          'are enabled. Use the `DisableConfidentialCredits` and',
          '`DisableNonConfidentialCredits` instructions to disable.',
          '',
          'In order for this instruction to be successfully processed, it must be',
          'accompanied by the `VerifyPubkeyValidity` instruction of the',
          '`zk_elgamal_proof` program in the same transaction or the address of a',
          'context state account for the proof must be provided.',
        ],
        optionalAccountStrategy: 'programId',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'token',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The SPL Token account.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'mint',
            isWritable: false,
            isSigner: false,
            isOptional: false,
            docs: ['The corresponding SPL Token mint.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'instructionsSysvarOrContextState',
            isWritable: false,
            isSigner: false,
            isOptional: false,
            docs: [
              'Instructions sysvar if `VerifyPubkeyValidity` is included in',
              'the same transaction or context state account if',
              '`VerifyPubkeyValidity` is pre-verified into a context state',
              'account.',
            ],
            defaultValue: {
              kind: 'publicKeyValueNode',
              publicKey: 'Sysvar1nstructions1111111111111111111111111',
            },
          },
          {
            kind: 'instructionAccountNode',
            name: 'record',
            isWritable: false,
            isSigner: false,
            isOptional: true,
            docs: [
              '(Optional) Record account if the accompanying proof is to be read from a record account.',
            ],
          },
          {
            kind: 'instructionAccountNode',
            name: 'authority',
            isWritable: false,
            isSigner: 'either',
            isOptional: false,
            docs: ["The source account's owner/delegate or its multisignature account."],
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 27,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'confidentialTransferDiscriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 2,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'decryptableZeroBalance',
            docs: ['The decryptable balance (always 0) once the configure account succeeds.'],
            type: {
              kind: 'definedTypeLinkNode',
              name: 'decryptableBalance',
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'maximumPendingBalanceCreditCounter',
            docs: [
              'The maximum number of despots and transfers that an account can receiver',
              'before the `ApplyPendingBalance` is executed',
            ],
            type: {
              kind: 'numberTypeNode',
              format: 'u64',
              endian: 'le',
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'proofInstructionOffset',
            docs: [
              'Relative location of the `ProofInstruction::ZeroCiphertextProof`',
              'instruction to the `ConfigureAccount` instruction in the',
              'transaction. If the offset is `0`, then use a context state account',
              'for the proof.',
            ],
            type: {
              kind: 'numberTypeNode',
              format: 'i8',
              endian: 'le',
            },
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            isOptional: true,
            isSigner: true,
            docs: [],
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
          {
            kind: 'fieldDiscriminatorNode',
            name: 'confidentialTransferDiscriminator',
            offset: 1,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'approveConfidentialTransferAccount',
        docs: [
          'Approves a token account for confidential transfers.',
          '',
          'Approval is only required when the',
          '`ConfidentialTransferMint::approve_new_accounts` field is set in the',
          'SPL Token mint.  This instruction must be executed after the account',
          'owner configures their account for confidential transfers with',
          '`ConfidentialTransferInstruction::ConfigureAccount`.',
        ],
        optionalAccountStrategy: 'programId',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'token',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The SPL Token account to approve.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'mint',
            isWritable: false,
            isSigner: false,
            isOptional: false,
            docs: ['The corresponding SPL Token mint.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'authority',
            isWritable: false,
            isSigner: true,
            isOptional: false,
            docs: ['Confidential transfer mint authority.'],
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 27,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'confidentialTransferDiscriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 3,
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
          {
            kind: 'fieldDiscriminatorNode',
            name: 'confidentialTransferDiscriminator',
            offset: 1,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'emptyConfidentialTransferAccount',
        docs: [
          'Empty the available balance in a confidential token account.',
          '',
          'A token account that is extended for confidential transfers can only be',
          'closed if the pending and available balance ciphertexts are emptied.',
          'The pending balance can be emptied',
          'via the `ConfidentialTransferInstruction::ApplyPendingBalance`',
          'instruction. Use the `ConfidentialTransferInstruction::EmptyAccount`',
          'instruction to empty the available balance ciphertext.',
          '',
          'Note that a newly configured account is always empty, so this',
          'instruction is not required prior to account closing if no',
          'instructions beyond',
          '`ConfidentialTransferInstruction::ConfigureAccount` have affected the',
          'token account.',
          '',
          'In order for this instruction to be successfully processed, it must be',
          'accompanied by the `VerifyZeroCiphertext` instruction of the',
          '`zk_elgamal_proof` program in the same transaction or the address of a',
          'context state account for the proof must be provided.',
        ],
        optionalAccountStrategy: 'programId',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'token',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The SPL Token account.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'instructionsSysvarOrContextState',
            isWritable: false,
            isSigner: false,
            isOptional: false,
            docs: [
              'Instructions sysvar if `VerifyZeroCiphertext` is included in',
              'the same transaction or context state account if',
              '`VerifyZeroCiphertext` is pre-verified into a context state',
              'account.',
            ],
            defaultValue: {
              kind: 'publicKeyValueNode',
              publicKey: 'Sysvar1nstructions1111111111111111111111111',
            },
          },
          {
            kind: 'instructionAccountNode',
            name: 'record',
            isWritable: false,
            isSigner: false,
            isOptional: true,
            docs: [
              '(Optional) Record account if the accompanying proof is to be read from a record account.',
            ],
          },
          {
            kind: 'instructionAccountNode',
            name: 'authority',
            isWritable: false,
            isSigner: 'either',
            isOptional: false,
            docs: ["The source account's owner/delegate or its multisignature account."],
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 27,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'confidentialTransferDiscriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 4,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'proofInstructionOffset',
            docs: [
              'Relative location of the `ProofInstruction::VerifyCloseAccount`',
              'instruction to the `EmptyAccount` instruction in the transaction. If',
              'the offset is `0`, then use a context state account for the proof.',
            ],
            type: {
              kind: 'numberTypeNode',
              format: 'i8',
              endian: 'le',
            },
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            isOptional: true,
            isSigner: true,
            docs: [],
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
          {
            kind: 'fieldDiscriminatorNode',
            name: 'confidentialTransferDiscriminator',
            offset: 1,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'confidentialDeposit',
        docs: [
          'Deposit SPL Tokens into the pending balance of a confidential token',
          'account.',
          '',
          'The account owner can then invoke the `ApplyPendingBalance` instruction',
          'to roll the deposit into their available balance at a time of their',
          'choosing.',
          '',
          'Fails if the source or destination accounts are frozen.',
          'Fails if the associated mint is extended as `NonTransferable`.',
        ],
        optionalAccountStrategy: 'programId',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'token',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The SPL Token account.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'mint',
            isWritable: false,
            isSigner: false,
            isOptional: false,
            docs: ['The corresponding SPL Token mint.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'authority',
            isWritable: false,
            isSigner: 'either',
            isOptional: false,
            docs: ["The source account's owner/delegate or its multisignature account."],
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 27,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'confidentialTransferDiscriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 5,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'amount',
            docs: ['The amount of tokens to deposit.'],
            type: {
              kind: 'numberTypeNode',
              format: 'u64',
              endian: 'le',
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'decimals',
            docs: ['Expected number of base 10 digits to the right of the decimal place.'],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            isOptional: true,
            isSigner: true,
            docs: [],
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
          {
            kind: 'fieldDiscriminatorNode',
            name: 'confidentialTransferDiscriminator',
            offset: 1,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'confidentialWithdraw',
        docs: [
          'Withdraw SPL Tokens from the available balance of a confidential token',
          'account.',
          '',
          'In order for this instruction to be successfully processed, it must be',
          'accompanied by the following list of `zk_elgamal_proof` program',
          'instructions:',
          '- `VerifyCiphertextCommitmentEquality`',
          '- `VerifyBatchedRangeProofU64`',
          'These instructions can be accompanied in the same transaction or can be',
          'pre-verified into a context state account, in which case, only their',
          'context state account address need to be provided.',
          '',
          'Fails if the source or destination accounts are frozen.',
          'Fails if the associated mint is extended as `NonTransferable`.',
        ],
        optionalAccountStrategy: 'programId',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'token',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The SPL Token account.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'mint',
            isWritable: false,
            isSigner: false,
            isOptional: false,
            docs: ['The corresponding SPL Token mint.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'instructionsSysvar',
            isWritable: false,
            isSigner: false,
            isOptional: true,
            docs: [
              'Instructions sysvar if at least one of the',
              '`zk_elgamal_proof` instructions are included in the same',
              'transaction.',
            ],
          },
          {
            kind: 'instructionAccountNode',
            name: 'equalityRecord',
            isWritable: false,
            isSigner: false,
            isOptional: true,
            docs: ['(Optional) Equality proof record account or context state account.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'rangeRecord',
            isWritable: false,
            isSigner: false,
            isOptional: true,
            docs: ['(Optional) Range proof record account or context state account.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'authority',
            isWritable: false,
            isSigner: 'either',
            isOptional: false,
            docs: ["The source account's owner/delegate or its multisignature account."],
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 27,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'confidentialTransferDiscriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 6,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'amount',
            docs: ['The amount of tokens to withdraw.'],
            type: {
              kind: 'numberTypeNode',
              format: 'u64',
              endian: 'le',
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'decimals',
            docs: ['Expected number of base 10 digits to the right of the decimal place.'],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'newDecryptableAvailableBalance',
            docs: ['The new decryptable balance if the withdrawal succeeds.'],
            type: {
              kind: 'definedTypeLinkNode',
              name: 'decryptableBalance',
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'equalityProofInstructionOffset',
            docs: [
              'Relative location of the',
              '`ProofInstruction::VerifyCiphertextCommitmentEquality` instruction',
              'to the `Withdraw` instruction in the transaction. If the offset is',
              '`0`, then use a context state account for the proof.',
            ],
            type: {
              kind: 'numberTypeNode',
              format: 'i8',
              endian: 'le',
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'rangeProofInstructionOffset',
            docs: [
              'Relative location of the `ProofInstruction::BatchedRangeProofU64`',
              'instruction to the `Withdraw` instruction in the transaction. If the',
              'offset is `0`, then use a context state account for the proof.',
            ],
            type: {
              kind: 'numberTypeNode',
              format: 'i8',
              endian: 'le',
            },
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            isOptional: true,
            isSigner: true,
            docs: [],
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
          {
            kind: 'fieldDiscriminatorNode',
            name: 'confidentialTransferDiscriminator',
            offset: 1,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'confidentialTransfer',
        docs: [
          'Transfer tokens confidentially.',
          '',
          'In order for this instruction to be successfully processed, it must be',
          'accompanied by the following list of `zk_elgamal_proof` program',
          'instructions:',
          '- `VerifyCiphertextCommitmentEquality`',
          '- `VerifyBatchedGroupedCiphertext3HandlesValidity`',
          '- `VerifyBatchedRangeProofU128`',
          'These instructions can be accompanied in the same transaction or can be',
          'pre-verified into a context state account, in which case, only their',
          'context state account addresses need to be provided.',
          '',
          'Fails if the associated mint is extended as `NonTransferable`.',
        ],
        optionalAccountStrategy: 'programId',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'sourceToken',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The source SPL Token account.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'mint',
            isWritable: false,
            isSigner: false,
            isOptional: false,
            docs: ['The corresponding SPL Token mint.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'destinationToken',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The destination SPL Token account.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'instructionsSysvar',
            isWritable: false,
            isSigner: false,
            isOptional: true,
            docs: [
              '(Optional) Instructions sysvar if at least one of the',
              '`zk_elgamal_proof` instructions are included in the same',
              'transaction.',
            ],
          },
          {
            kind: 'instructionAccountNode',
            name: 'equalityRecord',
            isWritable: false,
            isSigner: false,
            isOptional: true,
            docs: ['(Optional) Equality proof record account or context state account.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'ciphertextValidityRecord',
            isWritable: false,
            isSigner: false,
            isOptional: true,
            docs: ['(Optional) Ciphertext validity proof record account or context state account.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'rangeRecord',
            isWritable: false,
            isSigner: false,
            isOptional: true,
            docs: ['(Optional) Range proof record account or context state account.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'authority',
            isWritable: false,
            isSigner: 'either',
            isOptional: false,
            docs: ["The source account's owner/delegate or its multisignature account."],
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 27,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'confidentialTransferDiscriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 7,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'newSourceDecryptableAvailableBalance',
            docs: ['The new source decryptable balance if the transfer succeeds.'],
            type: {
              kind: 'definedTypeLinkNode',
              name: 'decryptableBalance',
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'equalityProofInstructionOffset',
            docs: [
              'Relative location of the',
              '`ProofInstruction::VerifyCiphertextCommitmentEquality` instruction',
              'to the `Transfer` instruction in the transaction. If the offset is',
              '`0`, then use a context state account for the proof.',
            ],
            type: {
              kind: 'numberTypeNode',
              format: 'i8',
              endian: 'le',
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'ciphertextValidityProofInstructionOffset',
            docs: [
              'Relative location of the',
              '`ProofInstruction::VerifyBatchedGroupedCiphertext3HandlesValidity`',
              'instruction to the `Transfer` instruction in the transaction. If the',
              'offset is `0`, then use a context state account for the proof.',
            ],
            type: {
              kind: 'numberTypeNode',
              format: 'i8',
              endian: 'le',
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'rangeProofInstructionOffset',
            docs: [
              'Relative location of the `ProofInstruction::BatchedRangeProofU128Data`',
              'instruction to the `Transfer` instruction in the transaction. If the',
              'offset is `0`, then use a context state account for the proof.',
            ],
            type: {
              kind: 'numberTypeNode',
              format: 'i8',
              endian: 'le',
            },
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            isOptional: true,
            isSigner: true,
            docs: [],
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
          {
            kind: 'fieldDiscriminatorNode',
            name: 'confidentialTransferDiscriminator',
            offset: 1,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'applyConfidentialPendingBalance',
        docs: [
          'Applies the pending balance to the available balance, based on the',
          'history of `Deposit` and/or `Transfer` instructions.',
          '',
          'After submitting `ApplyPendingBalance`, the client should compare',
          '`ConfidentialTransferAccount::expected_pending_balance_credit_counter`',
          'with',
          '`ConfidentialTransferAccount::actual_applied_pending_balance_instructions`.  If they are',
          'equal then the',
          '`ConfidentialTransferAccount::decryptable_available_balance` is',
          'consistent with `ConfidentialTransferAccount::available_balance`. If',
          'they differ then there is more pending balance to be applied.',
        ],
        optionalAccountStrategy: 'programId',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'token',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The SPL Token account.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'authority',
            isWritable: false,
            isSigner: 'either',
            isOptional: false,
            docs: ["The source account's owner/delegate or its multisignature account."],
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 27,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'confidentialTransferDiscriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 8,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'expectedPendingBalanceCreditCounter',
            docs: [
              'The expected number of pending balance credits since the last successful',
              '`ApplyPendingBalance` instruction',
            ],
            type: {
              kind: 'numberTypeNode',
              format: 'u64',
              endian: 'le',
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'newDecryptableAvailableBalance',
            docs: ['The new decryptable balance if the pending balance is applied', 'successfully'],
            type: {
              kind: 'definedTypeLinkNode',
              name: 'decryptableBalance',
            },
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            isOptional: true,
            isSigner: true,
            docs: [],
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
          {
            kind: 'fieldDiscriminatorNode',
            name: 'confidentialTransferDiscriminator',
            offset: 1,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'enableConfidentialCredits',
        docs: [
          'Configure a confidential extension account to accept incoming',
          'confidential transfers.',
        ],
        optionalAccountStrategy: 'programId',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'token',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The SPL Token account.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'authority',
            isWritable: false,
            isSigner: 'either',
            isOptional: false,
            docs: ["The source account's owner/delegate or its multisignature account."],
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 27,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'confidentialTransferDiscriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 9,
            },
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            isOptional: true,
            isSigner: true,
            docs: [],
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
          {
            kind: 'fieldDiscriminatorNode',
            name: 'confidentialTransferDiscriminator',
            offset: 1,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'disableConfidentialCredits',
        docs: [
          'Configure a confidential extension account to reject any incoming',
          'confidential transfers.',
          '',
          'If the `allow_non_confidential_credits` field is `true`, then the base',
          'account can still receive non-confidential transfers.',
          '',
          'This instruction can be used to disable confidential payments after a',
          'token account has already been extended for confidential transfers.',
        ],
        optionalAccountStrategy: 'programId',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'token',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The SPL Token account.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'authority',
            isWritable: false,
            isSigner: 'either',
            isOptional: false,
            docs: ["The source account's owner/delegate or its multisignature account."],
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 27,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'confidentialTransferDiscriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 10,
            },
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            isOptional: true,
            isSigner: true,
            docs: [],
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
          {
            kind: 'fieldDiscriminatorNode',
            name: 'confidentialTransferDiscriminator',
            offset: 1,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'enableNonConfidentialCredits',
        docs: [
          'Configure an account with the confidential extension to accept incoming',
          'non-confidential transfers.',
        ],
        optionalAccountStrategy: 'programId',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'token',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The SPL Token account.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'authority',
            isWritable: false,
            isSigner: 'either',
            isOptional: false,
            docs: ["The source account's owner/delegate or its multisignature account."],
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 27,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'confidentialTransferDiscriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 11,
            },
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            isOptional: true,
            isSigner: true,
            docs: [],
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
          {
            kind: 'fieldDiscriminatorNode',
            name: 'confidentialTransferDiscriminator',
            offset: 1,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'disableNonConfidentialCredits',
        docs: [
          'Configure an account with the confidential extension to reject any',
          'incoming non-confidential transfers.',
          '',
          'This instruction can be used to configure a confidential extension',
          'account to exclusively receive confidential payments.',
        ],
        optionalAccountStrategy: 'programId',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'token',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The SPL Token account.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'authority',
            isWritable: false,
            isSigner: 'either',
            isOptional: false,
            docs: ["The source account's owner/delegate or its multisignature account."],
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 27,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'confidentialTransferDiscriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 12,
            },
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            isOptional: true,
            isSigner: true,
            docs: [],
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
          {
            kind: 'fieldDiscriminatorNode',
            name: 'confidentialTransferDiscriminator',
            offset: 1,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'confidentialTransferWithFee',
        docs: [
          'Transfer tokens confidentially with fee.',
          '',
          'In order for this instruction to be successfully processed, it must be',
          'accompanied by the following list of `zk_elgamal_proof` program',
          'instructions:',
          '- `VerifyCiphertextCommitmentEquality`',
          '- `VerifyBatchedGroupedCiphertext3HandlesValidity` (transfer amount',
          '  ciphertext)',
          '- `VerifyPercentageWithFee`',
          '- `VerifyBatchedGroupedCiphertext2HandlesValidity` (fee ciphertext)',
          '- `VerifyBatchedRangeProofU256`',
          'These instructions can be accompanied in the same transaction or can be',
          'pre-verified into a context state account, in which case, only their',
          'context state account addresses need to be provided.',
          '',
          'The same restrictions for the `Transfer` applies to',
          '`TransferWithFee`. Namely, the instruction fails if the',
          'associated mint is extended as `NonTransferable`.',
        ],
        optionalAccountStrategy: 'programId',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'sourceToken',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The source SPL Token account.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'mint',
            isWritable: false,
            isSigner: false,
            isOptional: false,
            docs: ['The corresponding SPL Token mint.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'destinationToken',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The destination SPL Token account.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'instructionsSysvar',
            isWritable: false,
            isSigner: false,
            isOptional: true,
            docs: [
              '(Optional) Instructions sysvar if at least one of the',
              '`zk_elgamal_proof` instructions are included in the same',
              'transaction.',
            ],
          },
          {
            kind: 'instructionAccountNode',
            name: 'equalityRecord',
            isWritable: false,
            isSigner: false,
            isOptional: true,
            docs: ['(Optional) Equality proof record account or context state account.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'transferAmountCiphertextValidityRecord',
            isWritable: false,
            isSigner: false,
            isOptional: true,
            docs: [
              '(Optional) Transfer amount ciphertext validity proof record',
              'account or context state account.',
            ],
          },
          {
            kind: 'instructionAccountNode',
            name: 'feeSigmaRecord',
            isWritable: false,
            isSigner: false,
            isOptional: true,
            docs: ['(Optional) Fee sigma proof record account or context state account.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'feeCiphertextValidityRecord',
            isWritable: false,
            isSigner: false,
            isOptional: true,
            docs: [
              '(Optional) Fee ciphertext validity proof record account or context state account.',
            ],
          },
          {
            kind: 'instructionAccountNode',
            name: 'rangeRecord',
            isWritable: false,
            isSigner: false,
            isOptional: true,
            docs: ['(Optional) Range proof record account or context state account.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'authority',
            isWritable: false,
            isSigner: 'either',
            isOptional: false,
            docs: ["The source account's owner/delegate or its multisignature account."],
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 27,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'confidentialTransferDiscriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 13,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'newSourceDecryptableAvailableBalance',
            docs: ['The new source decryptable balance if the transfer succeeds.'],
            type: {
              kind: 'definedTypeLinkNode',
              name: 'decryptableBalance',
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'equalityProofInstructionOffset',
            docs: [
              'Relative location of the',
              '`ProofInstruction::VerifyCiphertextCommitmentEquality` instruction',
              'to the `TransferWithFee` instruction in the transaction. If the offset',
              'is `0`, then use a context state account for the proof.',
            ],
            type: {
              kind: 'numberTypeNode',
              format: 'i8',
              endian: 'le',
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'transferAmountCiphertextValidityProofInstructionOffset',
            docs: [
              'Relative location of the',
              '`ProofInstruction::VerifyBatchedGroupedCiphertext3HandlesValidity`',
              'instruction to the `TransferWithFee` instruction in the transaction.',
              'If the offset is `0`, then use a context state account for the',
              'proof.',
            ],
            type: {
              kind: 'numberTypeNode',
              format: 'i8',
              endian: 'le',
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'feeSigmaProofInstructionOffset',
            docs: [
              'Relative location of the `ProofInstruction::VerifyPercentageWithFee`',
              'instruction to the `TransferWithFee` instruction in the transaction.',
              'If the offset is `0`, then use a context state account for the',
              'proof.',
            ],
            type: {
              kind: 'numberTypeNode',
              format: 'i8',
              endian: 'le',
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'feeCiphertextValidityProofInstructionOffset',
            docs: [
              'Relative location of the',
              '`ProofInstruction::VerifyBatchedGroupedCiphertext2HandlesValidity`',
              'instruction to the `TransferWithFee` instruction in the transaction.',
              'If the offset is `0`, then use a context state account for the',
              'proof.',
            ],
            type: {
              kind: 'numberTypeNode',
              format: 'i8',
              endian: 'le',
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'rangeProofInstructionOffset',
            docs: [
              'Relative location of the `ProofInstruction::BatchedRangeProofU256Data`',
              'instruction to the `TransferWithFee` instruction in the transaction.',
              'If the offset is `0`, then use a context state account for the',
              'proof.',
            ],
            type: {
              kind: 'numberTypeNode',
              format: 'i8',
              endian: 'le',
            },
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            isOptional: true,
            isSigner: true,
            docs: [],
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
          {
            kind: 'fieldDiscriminatorNode',
            name: 'confidentialTransferDiscriminator',
            offset: 1,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'initializeDefaultAccountState',
        docs: [
          'Initialize a new mint with the default state for new Accounts.',
          '',
          'Fails if the mint has already been initialized, so must be called before',
          '`InitializeMint`.',
          '',
          'The mint must have exactly enough space allocated for the base mint (82',
          'bytes), plus 83 bytes of padding, 1 byte reserved for the account type,',
          'then space required for this extension, plus any others.',
        ],
        optionalAccountStrategy: 'programId',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'mint',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The mint.'],
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 28,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'defaultAccountStateDiscriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 0,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'state',
            docs: ['The state each new token account should start with.'],
            type: {
              kind: 'definedTypeLinkNode',
              name: 'accountState',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
          {
            kind: 'fieldDiscriminatorNode',
            name: 'defaultAccountStateDiscriminator',
            offset: 1,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'updateDefaultAccountState',
        docs: [
          'Update the default state for new Accounts. Only supported for mints that',
          'include the `DefaultAccountState` extension.',
        ],
        optionalAccountStrategy: 'programId',
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
            name: 'freezeAuthority',
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
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 28,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'defaultAccountStateDiscriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 1,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'state',
            docs: ['The state each new token account should start with.'],
            type: {
              kind: 'definedTypeLinkNode',
              name: 'accountState',
            },
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            isOptional: true,
            isSigner: true,
            docs: [],
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
          {
            kind: 'fieldDiscriminatorNode',
            name: 'defaultAccountStateDiscriminator',
            offset: 1,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'reallocate',
        docs: [
          'Check to see if a token account is large enough for a list of',
          'ExtensionTypes, and if not, use reallocation to increase the data',
          'size.',
        ],
        optionalAccountStrategy: 'programId',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'token',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The token account to reallocate.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'payer',
            isWritable: true,
            isSigner: true,
            isOptional: false,
            docs: ['The payer account to fund reallocation.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'systemProgram',
            isWritable: false,
            isSigner: false,
            isOptional: false,
            docs: ['System program for reallocation funding.'],
            defaultValue: {
              kind: 'publicKeyValueNode',
              publicKey: '11111111111111111111111111111111',
            },
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
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 29,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'newExtensionTypes',
            docs: ['New extension types to include in the reallocated account.'],
            type: {
              kind: 'arrayTypeNode',
              item: {
                kind: 'definedTypeLinkNode',
                name: 'extensionType',
              },
              count: {
                kind: 'remainderCountNode',
              },
            },
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            isOptional: true,
            isSigner: true,
            docs: [],
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'enableMemoTransfers',
        docs: [
          'Require memos for transfers into this Account. Adds the MemoTransfer',
          "extension to the Account, if it doesn't already exist.",
        ],
        optionalAccountStrategy: 'programId',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'token',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The token account to update.'],
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
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 30,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'memoTransfersDiscriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 0,
            },
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            isOptional: true,
            isSigner: true,
            docs: [],
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
          {
            kind: 'fieldDiscriminatorNode',
            name: 'memoTransfersDiscriminator',
            offset: 1,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'disableMemoTransfers',
        docs: [
          'Stop requiring memos for transfers into this Account.',
          '',
          'Implicitly initializes the extension in the case where it is not',
          'present.',
        ],
        optionalAccountStrategy: 'programId',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'token',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The token account to update.'],
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
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 30,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'memoTransfersDiscriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 1,
            },
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            isOptional: true,
            isSigner: true,
            docs: [],
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
          {
            kind: 'fieldDiscriminatorNode',
            name: 'memoTransfersDiscriminator',
            offset: 1,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'createNativeMint',
        docs: [
          'Creates the native mint.',
          '',
          'This instruction only needs to be invoked once after deployment and is',
          'permissionless. Wrapped SOL (`native_mint::id()`) will not be',
          'available until this instruction is successfully executed.',
        ],
        optionalAccountStrategy: 'programId',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'payer',
            isWritable: true,
            isSigner: true,
            isOptional: false,
            docs: ['Funding account (must be a system account)'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'nativeMint',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The native mint address'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'systemProgram',
            isWritable: false,
            isSigner: false,
            isOptional: false,
            docs: ['System program for mint account funding'],
            defaultValue: {
              kind: 'publicKeyValueNode',
              publicKey: '11111111111111111111111111111111',
            },
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 31,
            },
          },
        ],
        remainingAccounts: [],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'initializeNonTransferableMint',
        docs: [
          'Initialize the non transferable extension for the given mint account',
          '',
          'Fails if the account has already been initialized, so must be called before `InitializeMint`.',
        ],
        optionalAccountStrategy: 'programId',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'mint',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The mint account to initialize.'],
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 32,
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'initializeInterestBearingMint',
        docs: [
          'Initialize a new mint with the `InterestBearing` extension.',
          '',
          'Fails if the mint has already been initialized, so must be called before',
          '`InitializeMint`.',
          '',
          'The mint must have exactly enough space allocated for the base mint (82',
          'bytes), plus 83 bytes of padding, 1 byte reserved for the account type,',
          'then space required for this extension, plus any others.',
        ],
        optionalAccountStrategy: 'programId',
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
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 33,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'interestBearingMintDiscriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 0,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'rateAuthority',
            docs: ['The public key for the account that can update the rate'],
            type: {
              kind: 'zeroableOptionTypeNode',
              item: {
                kind: 'publicKeyTypeNode',
              },
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'rate',
            docs: ['The initial interest rate'],
            type: {
              kind: 'numberTypeNode',
              format: 'i16',
              endian: 'le',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
          {
            kind: 'fieldDiscriminatorNode',
            name: 'interestBearingMintDiscriminator',
            offset: 1,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'updateRateInterestBearingMint',
        docs: [
          'Update the interest rate. Only supported for mints that include the',
          '`InterestBearingConfig` extension.',
        ],
        optionalAccountStrategy: 'programId',
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
            name: 'rateAuthority',
            isWritable: true,
            isSigner: 'either',
            isOptional: false,
            docs: ['The mint rate authority.'],
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 33,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'interestBearingMintDiscriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 1,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'rate',
            docs: ['The interest rate to update.'],
            type: {
              kind: 'numberTypeNode',
              format: 'i16',
              endian: 'le',
            },
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            isOptional: true,
            isSigner: true,
            docs: [],
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
          {
            kind: 'fieldDiscriminatorNode',
            name: 'interestBearingMintDiscriminator',
            offset: 1,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'enableCpiGuard',
        docs: [
          'Lock certain token operations from taking place within CPI for this Account, namely:',
          '* Transfer and Burn must go through a delegate.',
          '* CloseAccount can only return lamports to owner.',
          '* SetAuthority can only be used to remove an existing close authority.',
          '* Approve is disallowed entirely.',
          '',
          'In addition, CPI Guard cannot be enabled or disabled via CPI.',
        ],
        optionalAccountStrategy: 'programId',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'token',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The token account to update.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'owner',
            isWritable: false,
            isSigner: 'either',
            isOptional: false,
            docs: ["The account's owner/delegate or its multisignature account."],
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 34,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'cpiGuardDiscriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 0,
            },
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            isOptional: true,
            isSigner: true,
            docs: [],
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
          {
            kind: 'fieldDiscriminatorNode',
            name: 'cpiGuardDiscriminator',
            offset: 1,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'disableCpiGuard',
        docs: [
          'Allow all token operations to happen via CPI as normal.',
          '',
          'Implicitly initializes the extension in the case where it is not present.',
        ],
        optionalAccountStrategy: 'programId',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'token',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The token account to update.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'owner',
            isWritable: false,
            isSigner: 'either',
            isOptional: false,
            docs: ["The account's owner/delegate or its multisignature account."],
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 34,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'cpiGuardDiscriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 1,
            },
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            isOptional: true,
            isSigner: true,
            docs: [],
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
          {
            kind: 'fieldDiscriminatorNode',
            name: 'cpiGuardDiscriminator',
            offset: 1,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'initializePermanentDelegate',
        docs: [
          'Initialize the permanent delegate on a new mint.',
          '',
          'Fails if the mint has already been initialized, so must be called before `InitializeMint`.',
          '',
          'The mint must have exactly enough space allocated for the base mint (82 bytes),',
          'plus 83 bytes of padding, 1 byte reserved for the account type,',
          'then space required for this extension, plus any others.',
        ],
        optionalAccountStrategy: 'programId',
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
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 35,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'delegate',
            docs: ['Authority that may sign for `Transfer`s and `Burn`s on any account'],
            type: {
              kind: 'publicKeyTypeNode',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'initializeTransferHook',
        docs: [
          'Initialize a new mint with a transfer hook program.',
          '',
          'Fails if the mint has already been initialized, so must be called before `InitializeMint`.',
          '',
          'The mint must have exactly enough space allocated for the base mint (82 bytes),',
          'plus 83 bytes of padding, 1 byte reserved for the account type,',
          'then space required for this extension, plus any others.',
        ],
        optionalAccountStrategy: 'programId',
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
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 36,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'transferHookDiscriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 0,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'authority',
            docs: ['The public key for the account that can update the program id'],
            type: {
              kind: 'zeroableOptionTypeNode',
              item: {
                kind: 'publicKeyTypeNode',
              },
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'programId',
            docs: ['The program id that performs logic during transfers'],
            type: {
              kind: 'zeroableOptionTypeNode',
              item: {
                kind: 'publicKeyTypeNode',
              },
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
          {
            kind: 'fieldDiscriminatorNode',
            name: 'transferHookDiscriminator',
            offset: 1,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'updateTransferHook',
        docs: [
          'Update the transfer hook program id. Only supported for mints that',
          'include the `TransferHook` extension.',
          '',
          'Accounts expected by this instruction:',
          '',
          '  0. `[writable]` The mint.',
          '  1. `[signer]` The transfer hook authority.',
        ],
        optionalAccountStrategy: 'programId',
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
            name: 'authority',
            isWritable: false,
            isSigner: 'either',
            isOptional: false,
            docs: ['The transfer hook authority.'],
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 36,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'transferHookDiscriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 1,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'programId',
            docs: ['The program id that performs logic during transfers'],
            type: {
              kind: 'zeroableOptionTypeNode',
              item: {
                kind: 'publicKeyTypeNode',
              },
            },
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            isOptional: true,
            isSigner: true,
            docs: [],
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
          {
            kind: 'fieldDiscriminatorNode',
            name: 'transferHookDiscriminator',
            offset: 1,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'initializeConfidentialTransferFee',
        docs: [
          'Initializes confidential transfer fees for a mint.',
          '',
          'The instruction must be included within the same Transaction as TokenInstruction::InitializeMint.',
          'Otherwise another party can initialize the configuration.',
          '',
          'The instruction fails if TokenInstruction::InitializeMint has already executed for the mint.',
        ],
        optionalAccountStrategy: 'programId',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'mint',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The SPL Token mint.'],
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 37,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'confidentialTransferFeeDiscriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 0,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'authority',
            docs: ['Optional authority to set the withdraw withheld authority ElGamal key'],
            type: {
              kind: 'zeroableOptionTypeNode',
              item: {
                kind: 'publicKeyTypeNode',
              },
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'withdrawWithheldAuthorityElGamalPubkey',
            docs: ['Withheld fees from accounts must be encrypted with this ElGamal key'],
            type: {
              kind: 'zeroableOptionTypeNode',
              item: {
                kind: 'publicKeyTypeNode',
              },
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
          {
            kind: 'fieldDiscriminatorNode',
            name: 'confidentialTransferFeeDiscriminator',
            offset: 1,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'withdrawWithheldTokensFromMintForConfidentialTransferFee',
        docs: [
          'Transfer all withheld confidential tokens in the mint to an account.',
          "Signed by the mint's withdraw withheld tokens authority.",
          '',
          'The withheld confidential tokens are aggregated directly into the destination available balance.',
          '',
          'Must be accompanied by the VerifyCiphertextCiphertextEquality instruction',
          'of the zk_elgamal_proof program in the same transaction or the address of',
          'a context state account for the proof must be provided.',
        ],
        optionalAccountStrategy: 'programId',
        accounts: [
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
            name: 'destination',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The fee receiver account.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'instructionsSysvarOrContextState',
            isWritable: false,
            isSigner: false,
            isOptional: false,
            docs: ['Instructions sysvar or context state account'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'record',
            isWritable: false,
            isSigner: false,
            isOptional: true,
            docs: ['Optional record account if proof is read from record'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'authority',
            isWritable: false,
            isSigner: 'either',
            isOptional: false,
            docs: ["The mint's withdraw_withheld_authority"],
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 37,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'confidentialTransferFeeDiscriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 1,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'proofInstructionOffset',
            docs: ['Proof instruction offset'],
            type: {
              kind: 'numberTypeNode',
              format: 'i8',
              endian: 'le',
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'newDecryptableAvailableBalance',
            docs: ['The new decryptable balance in the destination token account'],
            type: {
              kind: 'definedTypeLinkNode',
              name: 'decryptableBalance',
            },
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            isOptional: true,
            isSigner: true,
            docs: [],
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
          {
            kind: 'fieldDiscriminatorNode',
            name: 'confidentialTransferFeeDiscriminator',
            offset: 1,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'withdrawWithheldTokensFromAccountsForConfidentialTransferFee',
        docs: [
          "Transfer all withheld tokens to an account. Signed by the mint's withdraw withheld",
          'tokens authority. This instruction is susceptible to front-running.',
          'Use `HarvestWithheldTokensToMint` and `WithdrawWithheldTokensFromMint` as alternative.',
          '',
          'Must be accompanied by the VerifyWithdrawWithheldTokens instruction.',
        ],
        optionalAccountStrategy: 'programId',
        accounts: [
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
            docs: ['The fee receiver account.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'instructionsSysvarOrContextState',
            isWritable: false,
            isSigner: false,
            isOptional: false,
            docs: ['Instructions sysvar or context state account'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'record',
            isWritable: false,
            isSigner: false,
            isOptional: true,
            docs: ['Optional record account'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'authority',
            isWritable: false,
            isSigner: 'either',
            isOptional: false,
            docs: ["The mint's withdraw_withheld_authority"],
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 37,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'confidentialTransferFeeDiscriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 2,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'numTokenAccounts',
            docs: ['Number of token accounts harvested'],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'proofInstructionOffset',
            docs: ['Proof instruction offset'],
            type: {
              kind: 'numberTypeNode',
              format: 'i8',
              endian: 'le',
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'newDecryptableAvailableBalance',
            docs: ['The new decryptable balance in the destination token account'],
            type: {
              kind: 'definedTypeLinkNode',
              name: 'decryptableBalance',
            },
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            isOptional: true,
            isSigner: true,
            docs: [],
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
          {
            kind: 'fieldDiscriminatorNode',
            name: 'confidentialTransferFeeDiscriminator',
            offset: 1,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'harvestWithheldTokensToMintForConfidentialTransferFee',
        docs: [
          'Permissionless instruction to transfer all withheld confidential tokens to the mint.',
          '',
          'Succeeds for frozen accounts.',
          '',
          'Accounts provided should include both the `TransferFeeAmount` and',
          '`ConfidentialTransferAccount` extension. If not, the account is skipped.',
        ],
        optionalAccountStrategy: 'programId',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'mint',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The mint.'],
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 37,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'confidentialTransferFeeDiscriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 3,
            },
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            isOptional: true,
            isSigner: false,
            isWritable: true,
            docs: ['The source accounts to harvest from'],
            value: {
              kind: 'argumentValueNode',
              name: 'sources',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
          {
            kind: 'fieldDiscriminatorNode',
            name: 'confidentialTransferFeeDiscriminator',
            offset: 1,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'enableHarvestToMint',
        docs: ['Configure a confidential transfer fee mint to accept harvested confidential fees.'],
        optionalAccountStrategy: 'programId',
        accounts: [
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
            docs: ['The confidential transfer fee authority'],
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 37,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'confidentialTransferFeeDiscriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 4,
            },
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            isOptional: true,
            isSigner: true,
            docs: [],
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
          {
            kind: 'fieldDiscriminatorNode',
            name: 'confidentialTransferFeeDiscriminator',
            offset: 1,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'disableHarvestToMint',
        docs: [
          'Configure a confidential transfer fee mint to reject any harvested confidential fees.',
        ],
        optionalAccountStrategy: 'programId',
        accounts: [
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
            docs: ['The confidential transfer fee authority'],
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 37,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'confidentialTransferFeeDiscriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 5,
            },
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            isOptional: true,
            isSigner: true,
            docs: [],
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
          {
            kind: 'fieldDiscriminatorNode',
            name: 'confidentialTransferFeeDiscriminator',
            offset: 1,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'withdrawExcessLamports',
        docs: [
          'This instruction is to be used to rescue SOLs sent to any TokenProgram',
          'owned account by sending them to any other account, leaving behind only',
          'lamports for rent exemption.',
        ],
        optionalAccountStrategy: 'programId',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'sourceAccount',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['Account holding excess lamports.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'destinationAccount',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['Destination account for withdrawn lamports.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'authority',
            isWritable: false,
            isSigner: 'either',
            isOptional: false,
            docs: ["The source account's owner/delegate or its multisignature account."],
            defaultValue: {
              kind: 'identityValueNode',
            },
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 38,
            },
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            isOptional: true,
            isSigner: true,
            docs: [],
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'initializeMetadataPointer',
        docs: [
          'Initialize a new mint with a metadata pointer',
          '',
          'Fails if the mint has already been initialized, so must be called before',
          '`InitializeMint`.',
          '',
          'The mint must have exactly enough space allocated for the base mint (82',
          'bytes), plus 83 bytes of padding, 1 byte reserved for the account type,',
          'then space required for this extension, plus any others.',
        ],
        optionalAccountStrategy: 'programId',
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
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 39,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'metadataPointerDiscriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 0,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'authority',
            docs: ['The public key for the account that can update the metadata address.'],
            type: {
              kind: 'zeroableOptionTypeNode',
              item: {
                kind: 'publicKeyTypeNode',
              },
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'metadataAddress',
            docs: ['The account address that holds the metadata.'],
            type: {
              kind: 'zeroableOptionTypeNode',
              item: {
                kind: 'publicKeyTypeNode',
              },
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
          {
            kind: 'fieldDiscriminatorNode',
            name: 'metadataPointerDiscriminator',
            offset: 1,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'updateMetadataPointer',
        docs: [
          'Update the metadata pointer address. Only supported for mints that',
          'include the `MetadataPointer` extension.',
        ],
        optionalAccountStrategy: 'programId',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'mint',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The mint to initialize.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'metadataPointerAuthority',
            isWritable: false,
            isSigner: 'either',
            isOptional: false,
            docs: ['The metadata pointer authority or its multisignature account.'],
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 39,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'metadataPointerDiscriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 1,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'metadataAddress',
            docs: ['The new account address that holds the metadata.'],
            type: {
              kind: 'zeroableOptionTypeNode',
              item: {
                kind: 'publicKeyTypeNode',
              },
            },
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            isOptional: true,
            isSigner: true,
            docs: [],
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
          {
            kind: 'fieldDiscriminatorNode',
            name: 'metadataPointerDiscriminator',
            offset: 1,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'initializeGroupPointer',
        docs: [
          'Initialize a new mint with a group pointer',
          '',
          'Fails if the mint has already been initialized, so must be called before',
          '`InitializeMint`.',
          '',
          'The mint must have exactly enough space allocated for the base mint (82',
          'bytes), plus 83 bytes of padding, 1 byte reserved for the account type,',
          'then space required for this extension, plus any others.',
        ],
        optionalAccountStrategy: 'programId',
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
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 40,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'groupPointerDiscriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 0,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'authority',
            docs: ['The public key for the account that can update the group address.'],
            type: {
              kind: 'zeroableOptionTypeNode',
              item: {
                kind: 'publicKeyTypeNode',
              },
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'groupAddress',
            docs: ['The account address that holds the group.'],
            type: {
              kind: 'zeroableOptionTypeNode',
              item: {
                kind: 'publicKeyTypeNode',
              },
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
          {
            kind: 'fieldDiscriminatorNode',
            name: 'groupPointerDiscriminator',
            offset: 1,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'updateGroupPointer',
        docs: [
          'Update the group pointer address. Only supported for mints that',
          'include the `GroupPointer` extension.',
        ],
        optionalAccountStrategy: 'programId',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'mint',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The mint to initialize.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'groupPointerAuthority',
            isWritable: false,
            isSigner: 'either',
            isOptional: false,
            docs: ['The group pointer authority or its multisignature account.'],
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 40,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'groupPointerDiscriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 1,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'groupAddress',
            docs: ['The new account address that holds the group configurations.'],
            type: {
              kind: 'zeroableOptionTypeNode',
              item: {
                kind: 'publicKeyTypeNode',
              },
            },
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            isOptional: true,
            isSigner: true,
            docs: [],
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
          {
            kind: 'fieldDiscriminatorNode',
            name: 'groupPointerDiscriminator',
            offset: 1,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'initializeGroupMemberPointer',
        docs: [
          'Initialize a new mint with a group member pointer',
          '',
          'Fails if the mint has already been initialized, so must be called before',
          '`InitializeMint`.',
          '',
          'The mint must have exactly enough space allocated for the base mint (82',
          'bytes), plus 83 bytes of padding, 1 byte reserved for the account type,',
          'then space required for this extension, plus any others.',
        ],
        optionalAccountStrategy: 'programId',
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
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 41,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'groupMemberPointerDiscriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 0,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'authority',
            docs: ['The public key for the account that can update the group member address.'],
            type: {
              kind: 'zeroableOptionTypeNode',
              item: {
                kind: 'publicKeyTypeNode',
              },
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'memberAddress',
            docs: ['The account address that holds the member.'],
            type: {
              kind: 'zeroableOptionTypeNode',
              item: {
                kind: 'publicKeyTypeNode',
              },
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
          {
            kind: 'fieldDiscriminatorNode',
            name: 'groupMemberPointerDiscriminator',
            offset: 1,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'updateGroupMemberPointer',
        docs: [
          'Update the group member pointer address. Only supported for mints that',
          'include the `GroupMemberPointer` extension.',
        ],
        optionalAccountStrategy: 'programId',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'mint',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: ['The mint to initialize.'],
          },
          {
            kind: 'instructionAccountNode',
            name: 'groupMemberPointerAuthority',
            isWritable: false,
            isSigner: 'either',
            isOptional: false,
            docs: ['The group member pointer authority or its multisignature account.'],
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 41,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'groupMemberPointerDiscriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'numberTypeNode',
              format: 'u8',
              endian: 'le',
            },
            defaultValue: {
              kind: 'numberValueNode',
              number: 1,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'memberAddress',
            docs: ['The new account address that holds the member.'],
            type: {
              kind: 'zeroableOptionTypeNode',
              item: {
                kind: 'publicKeyTypeNode',
              },
            },
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            isOptional: true,
            isSigner: true,
            docs: [],
            value: {
              kind: 'argumentValueNode',
              name: 'multiSigners',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
          {
            kind: 'fieldDiscriminatorNode',
            name: 'groupMemberPointerDiscriminator',
            offset: 1,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'initializeTokenMetadata',
        docs: [
          'Initializes a TLV entry with the basic token-metadata fields.',
          '',
          'Assumes that the provided mint is an SPL token mint, that the metadata',
          'account is allocated and assigned to the program, and that the metadata',
          'account has enough lamports to cover the rent-exempt reserve.',
        ],
        optionalAccountStrategy: 'programId',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'metadata',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: [],
          },
          {
            kind: 'instructionAccountNode',
            name: 'updateAuthority',
            isWritable: false,
            isSigner: false,
            isOptional: false,
            docs: [],
          },
          {
            kind: 'instructionAccountNode',
            name: 'mint',
            isWritable: false,
            isSigner: false,
            isOptional: false,
            docs: [],
          },
          {
            kind: 'instructionAccountNode',
            name: 'mintAuthority',
            isWritable: false,
            isSigner: true,
            isOptional: false,
            docs: [],
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'bytesTypeNode',
            },
            defaultValue: {
              kind: 'bytesValueNode',
              data: 'd2e11ea258b84d8d',
              encoding: 'base16',
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'name',
            docs: ['Longer name of the token.'],
            type: {
              kind: 'sizePrefixTypeNode',
              type: {
                kind: 'stringTypeNode',
                encoding: 'utf8',
              },
              prefix: {
                kind: 'numberTypeNode',
                format: 'u32',
                endian: 'le',
              },
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'symbol',
            docs: ['Shortened symbol of the token.'],
            type: {
              kind: 'sizePrefixTypeNode',
              type: {
                kind: 'stringTypeNode',
                encoding: 'utf8',
              },
              prefix: {
                kind: 'numberTypeNode',
                format: 'u32',
                endian: 'le',
              },
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'uri',
            docs: ['URI pointing to more metadata (image, video, etc.).'],
            type: {
              kind: 'sizePrefixTypeNode',
              type: {
                kind: 'stringTypeNode',
                encoding: 'utf8',
              },
              prefix: {
                kind: 'numberTypeNode',
                format: 'u32',
                endian: 'le',
              },
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'updateTokenMetadataField',
        docs: [
          'Updates a field in a token-metadata account.',
          '',
          'The field can be one of the required fields (name, symbol, URI), or a',
          'totally new field denoted by a "key" string.',
          '',
          'By the end of the instruction, the metadata account must be properly',
          'resized based on the new size of the TLV entry.',
          '  * If the new size is larger, the program must first reallocate to',
          '    avoid',
          '  overwriting other TLV entries.',
          '  * If the new size is smaller, the program must reallocate at the end',
          "  so that it's possible to iterate over TLV entries",
        ],
        optionalAccountStrategy: 'programId',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'metadata',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: [],
          },
          {
            kind: 'instructionAccountNode',
            name: 'updateAuthority',
            isWritable: false,
            isSigner: true,
            isOptional: false,
            docs: [],
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'bytesTypeNode',
            },
            defaultValue: {
              kind: 'bytesValueNode',
              data: 'dde9312db5cadcc8',
              encoding: 'base16',
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'field',
            docs: ['Field to update in the metadata.'],
            type: {
              kind: 'definedTypeLinkNode',
              name: 'tokenMetadataField',
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'value',
            docs: ['Value to write for the field.'],
            type: {
              kind: 'sizePrefixTypeNode',
              type: {
                kind: 'stringTypeNode',
                encoding: 'utf8',
              },
              prefix: {
                kind: 'numberTypeNode',
                format: 'u32',
                endian: 'le',
              },
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'removeTokenMetadataKey',
        docs: [
          'Removes a key-value pair in a token-metadata account.',
          '',
          'This only applies to additional fields, and not the base name / symbol /',
          'URI fields.',
          '',
          'By the end of the instruction, the metadata account must be properly',
          'resized at the end based on the new size of the TLV entry.',
        ],
        optionalAccountStrategy: 'programId',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'metadata',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: [],
          },
          {
            kind: 'instructionAccountNode',
            name: 'updateAuthority',
            isWritable: false,
            isSigner: true,
            isOptional: false,
            docs: [],
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'bytesTypeNode',
            },
            defaultValue: {
              kind: 'bytesValueNode',
              data: 'ea122038598d25b5',
              encoding: 'base16',
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'idempotent',
            docs: [
              'If the idempotent flag is set to true, then the instruction will not',
              'error if the key does not exist',
            ],
            type: {
              kind: 'booleanTypeNode',
              size: {
                kind: 'numberTypeNode',
                format: 'u8',
                endian: 'le',
              },
            },
            defaultValue: {
              kind: 'booleanValueNode',
              boolean: false,
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'key',
            docs: ['Key to remove in the additional metadata portion.'],
            type: {
              kind: 'sizePrefixTypeNode',
              type: {
                kind: 'stringTypeNode',
                encoding: 'utf8',
              },
              prefix: {
                kind: 'numberTypeNode',
                format: 'u32',
                endian: 'le',
              },
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'updateTokenMetadataUpdateAuthority',
        docs: ['Updates the token-metadata authority.'],
        optionalAccountStrategy: 'programId',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'metadata',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: [],
          },
          {
            kind: 'instructionAccountNode',
            name: 'updateAuthority',
            isWritable: false,
            isSigner: true,
            isOptional: false,
            docs: [],
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'bytesTypeNode',
            },
            defaultValue: {
              kind: 'bytesValueNode',
              data: 'd7e4a6e45464567b',
              encoding: 'base16',
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'newUpdateAuthority',
            docs: ['New authority for the token metadata, or unset if `None`'],
            type: {
              kind: 'zeroableOptionTypeNode',
              item: {
                kind: 'publicKeyTypeNode',
              },
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'emitTokenMetadata',
        docs: [
          'Emits the token-metadata as return data',
          '',
          'The format of the data emitted follows exactly the `TokenMetadata`',
          "struct, but it's possible that the account data is stored in another",
          'format by the program.',
          '',
          'With this instruction, a program that implements the token-metadata',
          'interface can return `TokenMetadata` without adhering to the specific',
          'byte layout of the `TokenMetadata` struct in any accounts.',
        ],
        optionalAccountStrategy: 'programId',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'metadata',
            isWritable: false,
            isSigner: false,
            isOptional: false,
            docs: [],
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'bytesTypeNode',
            },
            defaultValue: {
              kind: 'bytesValueNode',
              data: 'faa6b4fa0d0cb846',
              encoding: 'base16',
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'start',
            docs: ['Start of range of data to emit'],
            type: {
              kind: 'optionTypeNode',
              item: {
                kind: 'numberTypeNode',
                format: 'u64',
                endian: 'le',
              },
              prefix: {
                kind: 'numberTypeNode',
                format: 'u8',
                endian: 'le',
              },
            },
            defaultValue: {
              kind: 'noneValueNode',
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'end',
            docs: ['End of range of data to emit'],
            type: {
              kind: 'optionTypeNode',
              item: {
                kind: 'numberTypeNode',
                format: 'u64',
                endian: 'le',
              },
              prefix: {
                kind: 'numberTypeNode',
                format: 'u8',
                endian: 'le',
              },
            },
            defaultValue: {
              kind: 'noneValueNode',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'initializeTokenGroup',
        docs: [
          'Initialize a new `Group`',
          '',
          'Assumes one has already initialized a mint for the group.',
        ],
        optionalAccountStrategy: 'programId',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'group',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: [],
          },
          {
            kind: 'instructionAccountNode',
            name: 'mint',
            isWritable: false,
            isSigner: false,
            isOptional: false,
            docs: [],
          },
          {
            kind: 'instructionAccountNode',
            name: 'mintAuthority',
            isWritable: false,
            isSigner: true,
            isOptional: false,
            docs: [],
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'bytesTypeNode',
            },
            defaultValue: {
              kind: 'bytesValueNode',
              data: '79716c2736330004',
              encoding: 'base16',
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'updateAuthority',
            docs: ['Update authority for the group'],
            type: {
              kind: 'zeroableOptionTypeNode',
              item: {
                kind: 'publicKeyTypeNode',
              },
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'maxSize',
            docs: ['The maximum number of group members'],
            type: {
              kind: 'numberTypeNode',
              format: 'u64',
              endian: 'le',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'updateTokenGroupMaxSize',
        docs: ['Update the max size of a `Group`.'],
        optionalAccountStrategy: 'programId',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'group',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: [],
          },
          {
            kind: 'instructionAccountNode',
            name: 'updateAuthority',
            isWritable: false,
            isSigner: true,
            isOptional: false,
            docs: [],
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'bytesTypeNode',
            },
            defaultValue: {
              kind: 'bytesValueNode',
              data: '6c25ab8ff81e126e',
              encoding: 'base16',
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'maxSize',
            docs: ['New max size for the group'],
            type: {
              kind: 'numberTypeNode',
              format: 'u64',
              endian: 'le',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'updateTokenGroupUpdateAuthority',
        docs: ['Update the authority of a `Group`.'],
        optionalAccountStrategy: 'programId',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'group',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: [],
          },
          {
            kind: 'instructionAccountNode',
            name: 'updateAuthority',
            isWritable: false,
            isSigner: true,
            isOptional: false,
            docs: ['Current update authority'],
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'bytesTypeNode',
            },
            defaultValue: {
              kind: 'bytesValueNode',
              data: 'a1695801edddd8cb',
              encoding: 'base16',
            },
          },
          {
            kind: 'instructionArgumentNode',
            name: 'newUpdateAuthority',
            docs: ['New authority for the group, or unset if `None`'],
            type: {
              kind: 'zeroableOptionTypeNode',
              item: {
                kind: 'publicKeyTypeNode',
              },
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
      },
      {
        kind: 'instructionNode',
        name: 'initializeTokenGroupMember',
        docs: [
          'Initialize a new `Member` of a `Group`',
          '',
          'Assumes the `Group` has already been initialized,',
          'as well as the mint for the member.',
        ],
        optionalAccountStrategy: 'programId',
        accounts: [
          {
            kind: 'instructionAccountNode',
            name: 'member',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: [],
          },
          {
            kind: 'instructionAccountNode',
            name: 'memberMint',
            isWritable: false,
            isSigner: false,
            isOptional: false,
            docs: [],
          },
          {
            kind: 'instructionAccountNode',
            name: 'memberMintAuthority',
            isWritable: false,
            isSigner: true,
            isOptional: false,
            docs: [],
          },
          {
            kind: 'instructionAccountNode',
            name: 'group',
            isWritable: true,
            isSigner: false,
            isOptional: false,
            docs: [],
          },
          {
            kind: 'instructionAccountNode',
            name: 'groupUpdateAuthority',
            isWritable: false,
            isSigner: true,
            isOptional: false,
            docs: [],
          },
        ],
        arguments: [
          {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
              kind: 'bytesTypeNode',
            },
            defaultValue: {
              kind: 'bytesValueNode',
              data: '9820deb0dfed7486',
              encoding: 'base16',
            },
          },
        ],
        discriminators: [
          {
            kind: 'fieldDiscriminatorNode',
            name: 'discriminator',
            offset: 0,
          },
        ],
      },
    ],
    definedTypes: [
      {
        kind: 'definedTypeNode',
        name: 'accountState',
        docs: [],
        type: {
          kind: 'enumTypeNode',
          variants: [
            {
              kind: 'enumEmptyVariantTypeNode',
              name: 'uninitialized',
            },
            {
              kind: 'enumEmptyVariantTypeNode',
              name: 'initialized',
            },
            {
              kind: 'enumEmptyVariantTypeNode',
              name: 'frozen',
            },
          ],
          size: {
            kind: 'numberTypeNode',
            format: 'u8',
            endian: 'le',
          },
        },
      },
      {
        kind: 'definedTypeNode',
        name: 'authorityType',
        docs: [],
        type: {
          kind: 'enumTypeNode',
          variants: [
            {
              kind: 'enumEmptyVariantTypeNode',
              name: 'mintTokens',
            },
            {
              kind: 'enumEmptyVariantTypeNode',
              name: 'freezeAccount',
            },
            {
              kind: 'enumEmptyVariantTypeNode',
              name: 'accountOwner',
            },
            {
              kind: 'enumEmptyVariantTypeNode',
              name: 'closeAccount',
            },
          ],
          size: {
            kind: 'numberTypeNode',
            format: 'u8',
            endian: 'le',
          },
        },
      },
      {
        kind: 'definedTypeNode',
        name: 'transferFee',
        docs: [],
        type: {
          kind: 'structTypeNode',
          fields: [
            {
              kind: 'structFieldTypeNode',
              name: 'epoch',
              docs: ['First epoch where the transfer fee takes effect.'],
              type: {
                kind: 'numberTypeNode',
                format: 'u64',
                endian: 'le',
              },
            },
            {
              kind: 'structFieldTypeNode',
              name: 'maximumFee',
              docs: ['Maximum fee assessed on transfers, expressed as an amount of tokens.'],
              type: {
                kind: 'numberTypeNode',
                format: 'u64',
                endian: 'le',
              },
            },
            {
              kind: 'structFieldTypeNode',
              name: 'transferFeeBasisPoints',
              docs: [
                'Amount of transfer collected as fees, expressed as basis points of the',
                'transfer amount, ie. increments of 0.01%.',
              ],
              type: {
                kind: 'amountTypeNode',
                decimals: 2,
                unit: '%',
                number: {
                  kind: 'numberTypeNode',
                  format: 'u16',
                  endian: 'le',
                },
              },
            },
          ],
        },
      },
      {
        kind: 'definedTypeNode',
        name: 'encryptedBalance',
        docs: ['ElGamal ciphertext containing an account balance.'],
        type: {
          kind: 'fixedSizeTypeNode',
          size: 64,
          type: {
            kind: 'bytesTypeNode',
          },
        },
      },
      {
        kind: 'definedTypeNode',
        name: 'decryptableBalance',
        docs: ['Authenticated encryption containing an account balance.'],
        type: {
          kind: 'fixedSizeTypeNode',
          size: 36,
          type: {
            kind: 'bytesTypeNode',
          },
        },
      },
      {
        kind: 'definedTypeNode',
        name: 'extension',
        docs: [],
        type: {
          kind: 'enumTypeNode',
          variants: [
            {
              kind: 'enumEmptyVariantTypeNode',
              name: 'uninitialized',
            },
            {
              kind: 'enumStructVariantTypeNode',
              name: 'transferFeeConfig',
              struct: {
                kind: 'sizePrefixTypeNode',
                type: {
                  kind: 'structTypeNode',
                  fields: [
                    {
                      kind: 'structFieldTypeNode',
                      name: 'transferFeeConfigAuthority',
                      docs: ['Optional authority to set the fee.'],
                      type: {
                        kind: 'publicKeyTypeNode',
                      },
                    },
                    {
                      kind: 'structFieldTypeNode',
                      name: 'withdrawWithheldAuthority',
                      docs: ['Withdraw from mint instructions must be signed by this key.'],
                      type: {
                        kind: 'publicKeyTypeNode',
                      },
                    },
                    {
                      kind: 'structFieldTypeNode',
                      name: 'withheldAmount',
                      docs: [
                        'Withheld transfer fee tokens that have been moved to the mint for withdrawal.',
                      ],
                      type: {
                        kind: 'numberTypeNode',
                        format: 'u64',
                        endian: 'le',
                      },
                    },
                    {
                      kind: 'structFieldTypeNode',
                      name: 'olderTransferFee',
                      docs: [
                        'Older transfer fee, used if the current epoch < newerTransferFee.epoch.',
                      ],
                      type: {
                        kind: 'definedTypeLinkNode',
                        name: 'transferFee',
                      },
                    },
                    {
                      kind: 'structFieldTypeNode',
                      name: 'newerTransferFee',
                      docs: [
                        'Newer transfer fee, used if the current epoch >= newerTransferFee.epoch.',
                      ],
                      type: {
                        kind: 'definedTypeLinkNode',
                        name: 'transferFee',
                      },
                    },
                  ],
                },
                prefix: {
                  kind: 'numberTypeNode',
                  format: 'u16',
                  endian: 'le',
                },
              },
            },
            {
              kind: 'enumStructVariantTypeNode',
              name: 'transferFeeAmount',
              struct: {
                kind: 'sizePrefixTypeNode',
                type: {
                  kind: 'structTypeNode',
                  fields: [
                    {
                      kind: 'structFieldTypeNode',
                      name: 'withheldAmount',
                      docs: [
                        'Withheld transfer fee tokens that can be claimed by the fee authority.',
                      ],
                      type: {
                        kind: 'numberTypeNode',
                        format: 'u64',
                        endian: 'le',
                      },
                    },
                  ],
                },
                prefix: {
                  kind: 'numberTypeNode',
                  format: 'u16',
                  endian: 'le',
                },
              },
            },
            {
              kind: 'enumStructVariantTypeNode',
              name: 'mintCloseAuthority',
              struct: {
                kind: 'sizePrefixTypeNode',
                type: {
                  kind: 'structTypeNode',
                  fields: [
                    {
                      kind: 'structFieldTypeNode',
                      name: 'closeAuthority',
                      docs: [],
                      type: {
                        kind: 'publicKeyTypeNode',
                      },
                    },
                  ],
                },
                prefix: {
                  kind: 'numberTypeNode',
                  format: 'u16',
                  endian: 'le',
                },
              },
            },
            {
              kind: 'enumStructVariantTypeNode',
              name: 'confidentialTransferMint',
              struct: {
                kind: 'sizePrefixTypeNode',
                type: {
                  kind: 'structTypeNode',
                  fields: [
                    {
                      kind: 'structFieldTypeNode',
                      name: 'authority',
                      docs: [
                        'Authority to modify the `ConfidentialTransferMint` configuration and to',
                        'approve new accounts (if `auto_approve_new_accounts` is true).',
                        '',
                        'The legacy Token Multisig account is not supported as the authority.',
                      ],
                      type: {
                        kind: 'zeroableOptionTypeNode',
                        item: {
                          kind: 'publicKeyTypeNode',
                        },
                      },
                    },
                    {
                      kind: 'structFieldTypeNode',
                      name: 'autoApproveNewAccounts',
                      docs: [
                        'Indicate if newly configured accounts must be approved by the',
                        '`authority` before they may be used by the user.',
                        '',
                        '* If `true`, no approval is required and new accounts may be used immediately.',
                        '* If `false`, the authority must approve newly configured accounts (see',
                        '  `ConfidentialTransferInstruction::ConfigureAccount`).',
                      ],
                      type: {
                        kind: 'booleanTypeNode',
                        size: {
                          kind: 'numberTypeNode',
                          format: 'u8',
                          endian: 'le',
                        },
                      },
                    },
                    {
                      kind: 'structFieldTypeNode',
                      name: 'auditorElgamalPubkey',
                      docs: ['Authority to decode any transfer amount in a confidential transfer.'],
                      type: {
                        kind: 'zeroableOptionTypeNode',
                        item: {
                          kind: 'publicKeyTypeNode',
                        },
                      },
                    },
                  ],
                },
                prefix: {
                  kind: 'numberTypeNode',
                  format: 'u16',
                  endian: 'le',
                },
              },
            },
            {
              kind: 'enumStructVariantTypeNode',
              name: 'confidentialTransferAccount',
              struct: {
                kind: 'sizePrefixTypeNode',
                type: {
                  kind: 'structTypeNode',
                  fields: [
                    {
                      kind: 'structFieldTypeNode',
                      name: 'approved',
                      docs: [
                        '`true` if this account has been approved for use. All confidential',
                        'transfer operations for the account will fail until approval is granted.',
                      ],
                      type: {
                        kind: 'booleanTypeNode',
                        size: {
                          kind: 'numberTypeNode',
                          format: 'u8',
                          endian: 'le',
                        },
                      },
                    },
                    {
                      kind: 'structFieldTypeNode',
                      name: 'elgamalPubkey',
                      docs: ['The public key associated with ElGamal encryption.'],
                      type: {
                        kind: 'publicKeyTypeNode',
                      },
                    },
                    {
                      kind: 'structFieldTypeNode',
                      name: 'pendingBalanceLow',
                      docs: [
                        'The low 16 bits of the pending balance (encrypted by `elgamal_pubkey`).',
                      ],
                      type: {
                        kind: 'definedTypeLinkNode',
                        name: 'encryptedBalance',
                      },
                    },
                    {
                      kind: 'structFieldTypeNode',
                      name: 'pendingBalanceHigh',
                      docs: [
                        'The high 48 bits of the pending balance (encrypted by `elgamal_pubkey`).',
                      ],
                      type: {
                        kind: 'definedTypeLinkNode',
                        name: 'encryptedBalance',
                      },
                    },
                    {
                      kind: 'structFieldTypeNode',
                      name: 'availableBalance',
                      docs: ['The available balance (encrypted by `encrypiton_pubkey`).'],
                      type: {
                        kind: 'definedTypeLinkNode',
                        name: 'encryptedBalance',
                      },
                    },
                    {
                      kind: 'structFieldTypeNode',
                      name: 'decryptableAvailableBalance',
                      docs: ['The decryptable available balance.'],
                      type: {
                        kind: 'definedTypeLinkNode',
                        name: 'decryptableBalance',
                      },
                    },
                    {
                      kind: 'structFieldTypeNode',
                      name: 'allowConfidentialCredits',
                      docs: [
                        'If `false`, the extended account rejects any incoming confidential transfers.',
                      ],
                      type: {
                        kind: 'booleanTypeNode',
                        size: {
                          kind: 'numberTypeNode',
                          format: 'u8',
                          endian: 'le',
                        },
                      },
                    },
                    {
                      kind: 'structFieldTypeNode',
                      name: 'allowNonConfidentialCredits',
                      docs: ['If `false`, the base account rejects any incoming transfers.'],
                      type: {
                        kind: 'booleanTypeNode',
                        size: {
                          kind: 'numberTypeNode',
                          format: 'u8',
                          endian: 'le',
                        },
                      },
                    },
                    {
                      kind: 'structFieldTypeNode',
                      name: 'pendingBalanceCreditCounter',
                      docs: [
                        'The total number of `Deposit` and `Transfer` instructions that have credited `pending_balance`.',
                      ],
                      type: {
                        kind: 'numberTypeNode',
                        format: 'u64',
                        endian: 'le',
                      },
                    },
                    {
                      kind: 'structFieldTypeNode',
                      name: 'maximumPendingBalanceCreditCounter',
                      docs: [
                        'The maximum number of `Deposit` and `Transfer` instructions that can',
                        'credit `pending_balance` before the `ApplyPendingBalance`',
                        'instruction is executed.',
                      ],
                      type: {
                        kind: 'numberTypeNode',
                        format: 'u64',
                        endian: 'le',
                      },
                    },
                    {
                      kind: 'structFieldTypeNode',
                      name: 'expectedPendingBalanceCreditCounter',
                      docs: [
                        'The `expected_pending_balance_credit_counter` value that was included in',
                        'the last `ApplyPendingBalance` instruction.',
                      ],
                      type: {
                        kind: 'numberTypeNode',
                        format: 'u64',
                        endian: 'le',
                      },
                    },
                    {
                      kind: 'structFieldTypeNode',
                      name: 'actualPendingBalanceCreditCounter',
                      docs: [
                        'The actual `pending_balance_credit_counter` when the last',
                        '`ApplyPendingBalance` instruction was executed.',
                      ],
                      type: {
                        kind: 'numberTypeNode',
                        format: 'u64',
                        endian: 'le',
                      },
                    },
                  ],
                },
                prefix: {
                  kind: 'numberTypeNode',
                  format: 'u16',
                  endian: 'le',
                },
              },
            },
            {
              kind: 'enumStructVariantTypeNode',
              name: 'defaultAccountState',
              struct: {
                kind: 'sizePrefixTypeNode',
                type: {
                  kind: 'structTypeNode',
                  fields: [
                    {
                      kind: 'structFieldTypeNode',
                      name: 'state',
                      docs: [],
                      type: {
                        kind: 'definedTypeLinkNode',
                        name: 'accountState',
                      },
                    },
                  ],
                },
                prefix: {
                  kind: 'numberTypeNode',
                  format: 'u16',
                  endian: 'le',
                },
              },
            },
            {
              kind: 'enumStructVariantTypeNode',
              name: 'immutableOwner',
              struct: {
                kind: 'sizePrefixTypeNode',
                type: {
                  kind: 'structTypeNode',
                  fields: [],
                },
                prefix: {
                  kind: 'numberTypeNode',
                  format: 'u16',
                  endian: 'le',
                },
              },
            },
            {
              kind: 'enumStructVariantTypeNode',
              name: 'memoTransfer',
              struct: {
                kind: 'sizePrefixTypeNode',
                type: {
                  kind: 'structTypeNode',
                  fields: [
                    {
                      kind: 'structFieldTypeNode',
                      name: 'requireIncomingTransferMemos',
                      docs: ['Require transfers into this account to be accompanied by a memo.'],
                      type: {
                        kind: 'booleanTypeNode',
                        size: {
                          kind: 'numberTypeNode',
                          format: 'u8',
                          endian: 'le',
                        },
                      },
                    },
                  ],
                },
                prefix: {
                  kind: 'numberTypeNode',
                  format: 'u16',
                  endian: 'le',
                },
              },
            },
            {
              kind: 'enumStructVariantTypeNode',
              name: 'nonTransferable',
              struct: {
                kind: 'sizePrefixTypeNode',
                type: {
                  kind: 'structTypeNode',
                  fields: [],
                },
                prefix: {
                  kind: 'numberTypeNode',
                  format: 'u16',
                  endian: 'le',
                },
              },
            },
            {
              kind: 'enumStructVariantTypeNode',
              name: 'interestBearingConfig',
              struct: {
                kind: 'sizePrefixTypeNode',
                type: {
                  kind: 'structTypeNode',
                  fields: [
                    {
                      kind: 'structFieldTypeNode',
                      name: 'rateAuthority',
                      docs: [],
                      type: {
                        kind: 'publicKeyTypeNode',
                      },
                    },
                    {
                      kind: 'structFieldTypeNode',
                      name: 'initializationTimestamp',
                      docs: [],
                      type: {
                        kind: 'numberTypeNode',
                        format: 'u64',
                        endian: 'le',
                      },
                    },
                    {
                      kind: 'structFieldTypeNode',
                      name: 'preUpdateAverageRate',
                      docs: [],
                      type: {
                        kind: 'numberTypeNode',
                        format: 'i16',
                        endian: 'le',
                      },
                    },
                    {
                      kind: 'structFieldTypeNode',
                      name: 'lastUpdateTimestamp',
                      docs: [],
                      type: {
                        kind: 'numberTypeNode',
                        format: 'u64',
                        endian: 'le',
                      },
                    },
                    {
                      kind: 'structFieldTypeNode',
                      name: 'currentRate',
                      docs: [],
                      type: {
                        kind: 'numberTypeNode',
                        format: 'i16',
                        endian: 'le',
                      },
                    },
                  ],
                },
                prefix: {
                  kind: 'numberTypeNode',
                  format: 'u16',
                  endian: 'le',
                },
              },
            },
            {
              kind: 'enumStructVariantTypeNode',
              name: 'cpiGuard',
              struct: {
                kind: 'sizePrefixTypeNode',
                type: {
                  kind: 'structTypeNode',
                  fields: [
                    {
                      kind: 'structFieldTypeNode',
                      name: 'lockCpi',
                      docs: [
                        'Lock certain token operations from taking place within CPI for this account.',
                      ],
                      type: {
                        kind: 'booleanTypeNode',
                        size: {
                          kind: 'numberTypeNode',
                          format: 'u8',
                          endian: 'le',
                        },
                      },
                    },
                  ],
                },
                prefix: {
                  kind: 'numberTypeNode',
                  format: 'u16',
                  endian: 'le',
                },
              },
            },
            {
              kind: 'enumStructVariantTypeNode',
              name: 'permanentDelegate',
              struct: {
                kind: 'sizePrefixTypeNode',
                type: {
                  kind: 'structTypeNode',
                  fields: [
                    {
                      kind: 'structFieldTypeNode',
                      name: 'delegate',
                      docs: [],
                      type: {
                        kind: 'publicKeyTypeNode',
                      },
                    },
                  ],
                },
                prefix: {
                  kind: 'numberTypeNode',
                  format: 'u16',
                  endian: 'le',
                },
              },
            },
            {
              kind: 'enumStructVariantTypeNode',
              name: 'nonTransferableAccount',
              struct: {
                kind: 'sizePrefixTypeNode',
                type: {
                  kind: 'structTypeNode',
                  fields: [],
                },
                prefix: {
                  kind: 'numberTypeNode',
                  format: 'u16',
                  endian: 'le',
                },
              },
            },
            {
              kind: 'enumStructVariantTypeNode',
              name: 'transferHook',
              struct: {
                kind: 'sizePrefixTypeNode',
                type: {
                  kind: 'structTypeNode',
                  fields: [
                    {
                      kind: 'structFieldTypeNode',
                      name: 'authority',
                      docs: ['The transfer hook update authority.'],
                      type: {
                        kind: 'publicKeyTypeNode',
                      },
                    },
                    {
                      kind: 'structFieldTypeNode',
                      name: 'programId',
                      docs: ['The transfer hook program account.'],
                      type: {
                        kind: 'publicKeyTypeNode',
                      },
                    },
                  ],
                },
                prefix: {
                  kind: 'numberTypeNode',
                  format: 'u16',
                  endian: 'le',
                },
              },
            },
            {
              kind: 'enumStructVariantTypeNode',
              name: 'transferHookAccount',
              struct: {
                kind: 'sizePrefixTypeNode',
                type: {
                  kind: 'structTypeNode',
                  fields: [
                    {
                      kind: 'structFieldTypeNode',
                      name: 'transferring',
                      docs: [
                        'Whether or not this account is currently transferring tokens',
                        'True during the transfer hook cpi, otherwise false.',
                      ],
                      type: {
                        kind: 'booleanTypeNode',
                        size: {
                          kind: 'numberTypeNode',
                          format: 'u8',
                          endian: 'le',
                        },
                      },
                    },
                  ],
                },
                prefix: {
                  kind: 'numberTypeNode',
                  format: 'u16',
                  endian: 'le',
                },
              },
            },
            {
              kind: 'enumStructVariantTypeNode',
              name: 'confidentialTransferFee',
              struct: {
                kind: 'sizePrefixTypeNode',
                type: {
                  kind: 'structTypeNode',
                  fields: [
                    {
                      kind: 'structFieldTypeNode',
                      name: 'authority',
                      docs: [
                        'Optional authority to set the withdraw withheld authority ElGamal key.',
                      ],
                      type: {
                        kind: 'zeroableOptionTypeNode',
                        item: {
                          kind: 'publicKeyTypeNode',
                        },
                      },
                    },
                    {
                      kind: 'structFieldTypeNode',
                      name: 'elgamalPubkey',
                      docs: [
                        'Withheld fees from accounts must be encrypted with this ElGamal key.',
                        '',
                        'Note that whoever holds the ElGamal private key for this ElGamal public',
                        'key has the ability to decode any withheld fee amount that are',
                        'associated with accounts. When combined with the fee parameters, the',
                        'withheld fee amounts can reveal information about transfer amounts.',
                      ],
                      type: {
                        kind: 'publicKeyTypeNode',
                      },
                    },
                    {
                      kind: 'structFieldTypeNode',
                      name: 'harvestToMintEnabled',
                      docs: ['If `false`, the harvest of withheld tokens to mint is rejected.'],
                      type: {
                        kind: 'booleanTypeNode',
                        size: {
                          kind: 'numberTypeNode',
                          format: 'u8',
                          endian: 'le',
                        },
                      },
                    },
                    {
                      kind: 'structFieldTypeNode',
                      name: 'withheldAmount',
                      docs: [
                        'Withheld confidential transfer fee tokens that have been moved to the',
                        'mint for withdrawal.',
                      ],
                      type: {
                        kind: 'definedTypeLinkNode',
                        name: 'encryptedBalance',
                      },
                    },
                  ],
                },
                prefix: {
                  kind: 'numberTypeNode',
                  format: 'u16',
                  endian: 'le',
                },
              },
            },
            {
              kind: 'enumStructVariantTypeNode',
              name: 'confidentialTransferFeeAmount',
              struct: {
                kind: 'sizePrefixTypeNode',
                type: {
                  kind: 'structTypeNode',
                  fields: [
                    {
                      kind: 'structFieldTypeNode',
                      name: 'withheldAmount',
                      docs: [
                        'Amount withheld during confidential transfers, to be harvest to the mint.',
                      ],
                      type: {
                        kind: 'definedTypeLinkNode',
                        name: 'encryptedBalance',
                      },
                    },
                  ],
                },
                prefix: {
                  kind: 'numberTypeNode',
                  format: 'u16',
                  endian: 'le',
                },
              },
            },
            {
              kind: 'enumStructVariantTypeNode',
              name: 'metadataPointer',
              struct: {
                kind: 'sizePrefixTypeNode',
                type: {
                  kind: 'structTypeNode',
                  fields: [
                    {
                      kind: 'structFieldTypeNode',
                      name: 'authority',
                      docs: ['Optional authority that can set the metadata address.'],
                      type: {
                        kind: 'zeroableOptionTypeNode',
                        item: {
                          kind: 'publicKeyTypeNode',
                        },
                      },
                    },
                    {
                      kind: 'structFieldTypeNode',
                      name: 'metadataAddress',
                      docs: ['Optional Account Address that holds the metadata.'],
                      type: {
                        kind: 'zeroableOptionTypeNode',
                        item: {
                          kind: 'publicKeyTypeNode',
                        },
                      },
                    },
                  ],
                },
                prefix: {
                  kind: 'numberTypeNode',
                  format: 'u16',
                  endian: 'le',
                },
              },
            },
            {
              kind: 'enumStructVariantTypeNode',
              name: 'tokenMetadata',
              struct: {
                kind: 'sizePrefixTypeNode',
                type: {
                  kind: 'structTypeNode',
                  fields: [
                    {
                      kind: 'structFieldTypeNode',
                      name: 'updateAuthority',
                      docs: ['The authority that can sign to update the metadata.'],
                      type: {
                        kind: 'zeroableOptionTypeNode',
                        item: {
                          kind: 'publicKeyTypeNode',
                        },
                      },
                    },
                    {
                      kind: 'structFieldTypeNode',
                      name: 'mint',
                      docs: [
                        'The associated mint, used to counter spoofing to be sure that metadata belongs to a particular mint.',
                      ],
                      type: {
                        kind: 'publicKeyTypeNode',
                      },
                    },
                    {
                      kind: 'structFieldTypeNode',
                      name: 'name',
                      docs: ['The longer name of the token.'],
                      type: {
                        kind: 'sizePrefixTypeNode',
                        type: {
                          kind: 'stringTypeNode',
                          encoding: 'utf8',
                        },
                        prefix: {
                          kind: 'numberTypeNode',
                          format: 'u32',
                          endian: 'le',
                        },
                      },
                    },
                    {
                      kind: 'structFieldTypeNode',
                      name: 'symbol',
                      docs: ['The shortened symbol for the token.'],
                      type: {
                        kind: 'sizePrefixTypeNode',
                        type: {
                          kind: 'stringTypeNode',
                          encoding: 'utf8',
                        },
                        prefix: {
                          kind: 'numberTypeNode',
                          format: 'u32',
                          endian: 'le',
                        },
                      },
                    },
                    {
                      kind: 'structFieldTypeNode',
                      name: 'uri',
                      docs: ['The URI pointing to richer metadata.'],
                      type: {
                        kind: 'sizePrefixTypeNode',
                        type: {
                          kind: 'stringTypeNode',
                          encoding: 'utf8',
                        },
                        prefix: {
                          kind: 'numberTypeNode',
                          format: 'u32',
                          endian: 'le',
                        },
                      },
                    },
                    {
                      kind: 'structFieldTypeNode',
                      name: 'additionalMetadata',
                      docs: ['Any additional metadata about the token as key-value pairs.'],
                      type: {
                        kind: 'mapTypeNode',
                        key: {
                          kind: 'sizePrefixTypeNode',
                          type: {
                            kind: 'stringTypeNode',
                            encoding: 'utf8',
                          },
                          prefix: {
                            kind: 'numberTypeNode',
                            format: 'u32',
                            endian: 'le',
                          },
                        },
                        value: {
                          kind: 'sizePrefixTypeNode',
                          type: {
                            kind: 'stringTypeNode',
                            encoding: 'utf8',
                          },
                          prefix: {
                            kind: 'numberTypeNode',
                            format: 'u32',
                            endian: 'le',
                          },
                        },
                        count: {
                          kind: 'prefixedCountNode',
                          prefix: {
                            kind: 'numberTypeNode',
                            format: 'u32',
                            endian: 'le',
                          },
                        },
                      },
                    },
                  ],
                },
                prefix: {
                  kind: 'numberTypeNode',
                  format: 'u16',
                  endian: 'le',
                },
              },
            },
            {
              kind: 'enumStructVariantTypeNode',
              name: 'groupPointer',
              struct: {
                kind: 'sizePrefixTypeNode',
                type: {
                  kind: 'structTypeNode',
                  fields: [
                    {
                      kind: 'structFieldTypeNode',
                      name: 'authority',
                      docs: ['Optional authority that can set the group address.'],
                      type: {
                        kind: 'zeroableOptionTypeNode',
                        item: {
                          kind: 'publicKeyTypeNode',
                        },
                      },
                    },
                    {
                      kind: 'structFieldTypeNode',
                      name: 'groupAddress',
                      docs: ['Optional account address that holds the group.'],
                      type: {
                        kind: 'zeroableOptionTypeNode',
                        item: {
                          kind: 'publicKeyTypeNode',
                        },
                      },
                    },
                  ],
                },
                prefix: {
                  kind: 'numberTypeNode',
                  format: 'u16',
                  endian: 'le',
                },
              },
            },
            {
              kind: 'enumStructVariantTypeNode',
              name: 'tokenGroup',
              struct: {
                kind: 'sizePrefixTypeNode',
                type: {
                  kind: 'structTypeNode',
                  fields: [
                    {
                      kind: 'structFieldTypeNode',
                      name: 'updateAuthority',
                      docs: ['The authority that can sign to update the group.'],
                      type: {
                        kind: 'zeroableOptionTypeNode',
                        item: {
                          kind: 'publicKeyTypeNode',
                        },
                      },
                    },
                    {
                      kind: 'structFieldTypeNode',
                      name: 'mint',
                      docs: [
                        'The associated mint, used to counter spoofing to be sure that group belongs to a particular mint.',
                      ],
                      type: {
                        kind: 'publicKeyTypeNode',
                      },
                    },
                    {
                      kind: 'structFieldTypeNode',
                      name: 'size',
                      docs: ['The current number of group members.'],
                      type: {
                        kind: 'numberTypeNode',
                        format: 'u64',
                        endian: 'le',
                      },
                    },
                    {
                      kind: 'structFieldTypeNode',
                      name: 'maxSize',
                      docs: ['The maximum number of group members.'],
                      type: {
                        kind: 'numberTypeNode',
                        format: 'u64',
                        endian: 'le',
                      },
                    },
                  ],
                },
                prefix: {
                  kind: 'numberTypeNode',
                  format: 'u16',
                  endian: 'le',
                },
              },
            },
            {
              kind: 'enumStructVariantTypeNode',
              name: 'groupMemberPointer',
              struct: {
                kind: 'sizePrefixTypeNode',
                type: {
                  kind: 'structTypeNode',
                  fields: [
                    {
                      kind: 'structFieldTypeNode',
                      name: 'authority',
                      docs: ['Optional authority that can set the member address.'],
                      type: {
                        kind: 'zeroableOptionTypeNode',
                        item: {
                          kind: 'publicKeyTypeNode',
                        },
                      },
                    },
                    {
                      kind: 'structFieldTypeNode',
                      name: 'memberAddress',
                      docs: ['Optional account address that holds the member.'],
                      type: {
                        kind: 'zeroableOptionTypeNode',
                        item: {
                          kind: 'publicKeyTypeNode',
                        },
                      },
                    },
                  ],
                },
                prefix: {
                  kind: 'numberTypeNode',
                  format: 'u16',
                  endian: 'le',
                },
              },
            },
            {
              kind: 'enumStructVariantTypeNode',
              name: 'tokenGroupMember',
              struct: {
                kind: 'sizePrefixTypeNode',
                type: {
                  kind: 'structTypeNode',
                  fields: [
                    {
                      kind: 'structFieldTypeNode',
                      name: 'mint',
                      docs: [
                        'The associated mint, used to counter spoofing to be sure that member belongs to a particular mint.',
                      ],
                      type: {
                        kind: 'publicKeyTypeNode',
                      },
                    },
                    {
                      kind: 'structFieldTypeNode',
                      name: 'group',
                      docs: ['The pubkey of the `TokenGroup`.'],
                      type: {
                        kind: 'publicKeyTypeNode',
                      },
                    },
                    {
                      kind: 'structFieldTypeNode',
                      name: 'memberNumber',
                      docs: ['The member number.'],
                      type: {
                        kind: 'numberTypeNode',
                        format: 'u64',
                        endian: 'le',
                      },
                    },
                  ],
                },
                prefix: {
                  kind: 'numberTypeNode',
                  format: 'u16',
                  endian: 'le',
                },
              },
            },
          ],
          size: {
            kind: 'numberTypeNode',
            format: 'u16',
            endian: 'le',
          },
        },
      },
      {
        kind: 'definedTypeNode',
        name: 'extensionType',
        docs: [
          'Extensions that can be applied to mints or accounts.  Mint extensions must',
          'only be applied to mint accounts, and account extensions must only be',
          'applied to token holding accounts.',
        ],
        type: {
          kind: 'enumTypeNode',
          variants: [
            {
              kind: 'enumEmptyVariantTypeNode',
              name: 'uninitialized',
              docs: [
                'Used as padding if the account size would otherwise be 355, same as a multisig',
              ],
            },
            {
              kind: 'enumEmptyVariantTypeNode',
              name: 'transferFeeConfig',
              docs: [
                'Includes transfer fee rate info and accompanying authorities to withdraw',
                'and set the fee',
              ],
            },
            {
              kind: 'enumEmptyVariantTypeNode',
              name: 'transferFeeAmount',
              docs: ['Includes withheld transfer fees'],
            },
            {
              kind: 'enumEmptyVariantTypeNode',
              name: 'mintCloseAuthority',
              docs: ['Includes an optional mint close authority'],
            },
            {
              kind: 'enumEmptyVariantTypeNode',
              name: 'confidentialTransferMint',
              docs: ['Auditor configuration for confidential transfers'],
            },
            {
              kind: 'enumEmptyVariantTypeNode',
              name: 'confidentialTransferAccount',
              docs: ['State for confidential transfers'],
            },
            {
              kind: 'enumEmptyVariantTypeNode',
              name: 'defaultAccountState',
              docs: ['Specifies the default Account::state for new Accounts'],
            },
            {
              kind: 'enumEmptyVariantTypeNode',
              name: 'immutableOwner',
              docs: ['Indicates that the Account owner authority cannot be changed'],
            },
            {
              kind: 'enumEmptyVariantTypeNode',
              name: 'memoTransfer',
              docs: ['Require inbound transfers to have memo'],
            },
            {
              kind: 'enumEmptyVariantTypeNode',
              name: 'nonTransferable',
              docs: ["Indicates that the tokens from this mint can't be transferred"],
            },
            {
              kind: 'enumEmptyVariantTypeNode',
              name: 'interestBearingConfig',
              docs: ['Tokens accrue interest over time,'],
            },
            {
              kind: 'enumEmptyVariantTypeNode',
              name: 'cpiGuard',
              docs: ['Locks privileged token operations from happening via CPI'],
            },
            {
              kind: 'enumEmptyVariantTypeNode',
              name: 'permanentDelegate',
              docs: ['Includes an optional permanent delegate'],
            },
            {
              kind: 'enumEmptyVariantTypeNode',
              name: 'nonTransferableAccount',
              docs: [
                'Indicates that the tokens in this account belong to a non-transferable',
                'mint',
              ],
            },
            {
              kind: 'enumEmptyVariantTypeNode',
              name: 'transferHook',
              docs: [
                'Mint requires a CPI to a program implementing the "transfer hook"',
                'interface',
              ],
            },
            {
              kind: 'enumEmptyVariantTypeNode',
              name: 'transferHookAccount',
              docs: [
                'Indicates that the tokens in this account belong to a mint with a',
                'transfer hook',
              ],
            },
            {
              kind: 'enumEmptyVariantTypeNode',
              name: 'confidentialTransferFee',
              docs: [
                'Includes encrypted withheld fees and the encryption public that they are',
                'encrypted under',
              ],
            },
            {
              kind: 'enumEmptyVariantTypeNode',
              name: 'confidentialTransferFeeAmount',
              docs: ['Includes confidential withheld transfer fees'],
            },
            {
              kind: 'enumEmptyVariantTypeNode',
              name: 'metadataPointer',
              docs: [
                'Mint contains a pointer to another account (or the same account) that',
                'holds metadata',
              ],
            },
            {
              kind: 'enumEmptyVariantTypeNode',
              name: 'tokenMetadata',
              docs: ['Mint contains token-metadata'],
            },
            {
              kind: 'enumEmptyVariantTypeNode',
              name: 'groupPointer',
              docs: [
                'Mint contains a pointer to another account (or the same account) that',
                'holds group configurations',
              ],
            },
            {
              kind: 'enumEmptyVariantTypeNode',
              name: 'tokenGroup',
              docs: ['Mint contains token group configurations'],
            },
            {
              kind: 'enumEmptyVariantTypeNode',
              name: 'groupMemberPointer',
              docs: [
                'Mint contains a pointer to another account (or the same account) that',
                'holds group member configurations',
              ],
            },
            {
              kind: 'enumEmptyVariantTypeNode',
              name: 'tokenGroupMember',
              docs: ['Mint contains token group member configurations'],
            },
          ],
          size: {
            kind: 'numberTypeNode',
            format: 'u16',
            endian: 'le',
          },
        },
      },
      {
        kind: 'definedTypeNode',
        name: 'tokenMetadataField',
        docs: ['Fields in the metadata account, used for updating.'],
        type: {
          kind: 'enumTypeNode',
          variants: [
            {
              kind: 'enumEmptyVariantTypeNode',
              name: 'name',
              docs: ['The name field, corresponding to `TokenMetadata.name`'],
            },
            {
              kind: 'enumEmptyVariantTypeNode',
              name: 'symbol',
              docs: ['The symbol field, corresponding to `TokenMetadata.symbol`'],
            },
            {
              kind: 'enumEmptyVariantTypeNode',
              name: 'uri',
              docs: ['The uri field, corresponding to `TokenMetadata.uri`'],
            },
            {
              kind: 'enumTupleVariantTypeNode',
              name: 'key',
              docs: ['A user field, whose key is given by the associated string'],
              tuple: {
                kind: 'tupleTypeNode',
                items: [
                  {
                    kind: 'sizePrefixTypeNode',
                    type: {
                      kind: 'stringTypeNode',
                      encoding: 'utf8',
                    },
                    prefix: {
                      kind: 'numberTypeNode',
                      format: 'u32',
                      endian: 'le',
                    },
                  },
                ],
              },
            },
          ],
          size: {
            kind: 'numberTypeNode',
            format: 'u8',
            endian: 'le',
          },
        },
      },
    ],
    pdas: [],
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
  },
  additionalPrograms: [
    {
      kind: 'programNode',
      name: 'associatedToken',
      publicKey: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
      version: '1.1.1',
      origin: 'shank',
      docs: [],
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
                publicKey: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
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
                publicKey: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
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
                publicKey: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
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
      pdas: [
        {
          kind: 'pdaNode',
          name: 'associatedToken',
          docs: [],
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
      errors: [
        {
          kind: 'errorNode',
          name: 'invalidOwner',
          code: 0,
          message: 'Associated token account owner does not match address derivation',
          docs: ['InvalidOwner: Associated token account owner does not match address derivation'],
        },
      ],
    },
  ],
} as const;
