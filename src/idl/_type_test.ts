import * as P from 'micro-packed';
import * as idl from './index.ts';
import TokenIDL from './token.ts';

// Basic
const assertType = <T>(_value: T) => {};

assertType<number>(
  1 as any as idl.GetType<{
    kind: 'numberTypeNode';
    format: 'u32';
    endian: 'le';
  }>
);
assertType<number | undefined>(
  1 as any as idl.GetType<{
    kind: 'numberTypeNode';
    format: 'u32';
    endian: 'le';
    defaultValue: { kind: 'numberValueNode'; number: 1 };
    defaultValueStrategy: 'optional';
  }>
);
assertType<undefined>(
  1 as any as idl.GetType<{
    kind: 'numberTypeNode';
    format: 'u32';
    endian: 'le';
    defaultValue: { kind: 'numberValueNode'; number: 1 };
    defaultValueStrategy: 'omitted';
  }>
);

// bigint | undefined
export type t = idl.GetType<{
  kind: 'numberTypeNode';
  format: 'u32';
  endian: 'le';
  defaultValue: { kind: 'numberValueNode'; number: 1 };
  defaultValueStrategy: 'optional';
}>;
// undefined
export type t2 = idl.GetType<{
  kind: 'numberTypeNode';
  format: 'u32';
  endian: 'le';
  defaultValue: { kind: 'numberValueNode'; number: 1 };
  defaultValueStrategy: 'omitted';
}>;

const args = [
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
    defaultValue: { kind: 'numberValueNode', number: 12 },
    defaultValueStrategy: 'optional',
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
] as const;

export type t3 = idl.GetTypeArguments<typeof args, {}>;
assertType<{ discriminator: undefined; amount: bigint | undefined; decimals: number }>(
  1 as unknown as idl.GetTypeArguments<typeof args, {}>
);

const accounts = [
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
  {
    kind: 'instructionAccountNode',
    name: 'payer',
    isWritable: true,
    isSigner: true,
    isOptional: false,
    docs: ['Funding account (must be a system account).'],
    defaultValue: { kind: 'payerValueNode' },
  },
] as const;

export type t4 = idl.GetTypeAccounts<typeof accounts>;

const instruction = {
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
} as const;

export type t5 = idl.GetInstructionArgs<typeof instruction>;

assertType<{
  ata: string;
  mint: string;
  payer: string;
}>(1 as unknown as idl.GetInstructionArgs<typeof instruction>);

type t11 = idl.ParsedInstructions<(typeof TokenIDL)['program']['instructions']>;
type t12 = t11['decoder'];
type t13 = t11['encoders']['transferChecked'];
let b = (1 as unknown as t12)(1 as any);
b;
let a = 1 as any as t13;
a({
  source: '7o36UsWR1JQLpZ9PE2gn9L4SQ69CNNiWAXd4Jt7rqz9Z',
  mint: 'DShWnroshVbeUp28oopA3Pu7oFPDBtC1DBmPECXXAQ9n',
  destination: 'Hozo7TadHq6PMMiGLGNvgk79Hvj5VTAM7Ny2bamQ2m8q',
  authority: '3ECJhLBQ9DAuKBKNjQGLEk3YqoFcF1YvhdayQ2C96eXF',
  amount: 123n,
  decimals: 10,
});

type t22 = idl.AccountDefinitions<
  (typeof TokenIDL)['program']['accounts'],
  idl.GetDefinedTypes<(typeof TokenIDL)['program']['definedTypes']>
>;

type t23 = t22['coders']['token']['encode'];
let a2 = 1 as any as t23;
a2({
  owner: '1',
  mint: '1',
  amount: 1n,
  closeAuthority: '1',
  delegate: '1',
  delegatedAmount: 1n,
  isNative: undefined,
  state: { TAG: 'initialized' },
});

const t33 = idl.defineProgram(TokenIDL['program']);
t33.instructions.encoders.transferChecked({
  source: '7o36UsWR1JQLpZ9PE2gn9L4SQ69CNNiWAXd4Jt7rqz9Z',
  mint: 'DShWnroshVbeUp28oopA3Pu7oFPDBtC1DBmPECXXAQ9n',
  destination: 'Hozo7TadHq6PMMiGLGNvgk79Hvj5VTAM7Ny2bamQ2m8q',
  authority: '3ECJhLBQ9DAuKBKNjQGLEk3YqoFcF1YvhdayQ2C96eXF',
  amount: 123n,
  decimals: 10,
});

let a3 = idl.defineIDL(TokenIDL);
a3.associatedToken.pdas.associatedToken({ owner: '1', tokenProgram: '1', mint: '1' });

assertType<{
  mint: string;
  rent: undefined;
  payer: string;
}>(1 as unknown as idl.GetTypeAccounts<typeof accounts>);

assertType<string>(
  1 as any as idl.GetType<{
    kind: 'amountTypeNode';
    decimals: 2;
    unit: 'USD';
    number: { kind: 'numberTypeNode'; format: 'u32'; endian: 'le' };
  }>
);
assertType<number[]>(
  1 as any as idl.GetType<{
    kind: 'arrayTypeNode';
    count: { kind: 'fixedCountNode'; value: 3 };
    item: { kind: 'numberTypeNode'; format: 'u32'; endian: 'le' };
  }>
);
assertType<Map<string, number>>(
  1 as any as idl.GetType<{
    kind: 'mapTypeNode';
    key: { kind: 'fixedSizeTypeNode'; size: 3; type: { kind: 'stringTypeNode' } };
    value: { kind: 'numberTypeNode'; format: 'u16'; endian: 'le' };
    count: {
      kind: 'prefixedCountNode';
      prefix: { kind: 'numberTypeNode'; format: 'u32'; endian: 'le' };
    };
  }>
);
assertType<{
  A: string;
  B: number;
}>(
  1 as any as idl.GetType<{
    kind: 'structTypeNode';
    fields: [
      {
        kind: 'structFieldTypeNode';
        name: 'A';
        type: { kind: 'fixedSizeTypeNode'; size: 3; type: { kind: 'stringTypeNode' } };
      },
      {
        kind: 'structFieldTypeNode';
        name: 'B';
        type: { kind: 'numberTypeNode'; format: 'u16'; endian: 'le' };
      },
    ];
  }>
);
assertType<[string, number]>(
  1 as any as idl.GetType<{
    kind: 'tupleTypeNode';
    items: [
      { kind: 'fixedSizeTypeNode'; size: 3; type: { kind: 'stringTypeNode' } },
      { kind: 'numberTypeNode'; format: 'u16'; endian: 'le' },
    ];
  }>
);
assertType<[string, bigint]>(
  1 as any as idl.GetType<{
    kind: 'tupleTypeNode';
    items: [
      { kind: 'fixedSizeTypeNode'; size: 3; type: { kind: 'stringTypeNode' } },
      { kind: 'numberTypeNode'; format: 'u64'; endian: 'le' },
    ];
  }>
);
assertType<
  | { TAG: 'flip' }
  | { TAG: 'rotate'; data: [number] }
  | { TAG: 'move'; data: { x: number; y: number } }
>(
  1 as any as idl.GetType<{
    kind: 'enumTypeNode';
    variants: [
      { kind: 'enumEmptyVariantTypeNode'; name: 'flip' },
      {
        kind: 'enumTupleVariantTypeNode';
        name: 'rotate';
        tuple: {
          kind: 'tupleTypeNode';
          items: [{ kind: 'numberTypeNode'; format: 'u32'; endian: 'le' }];
        };
      },
      {
        kind: 'enumStructVariantTypeNode';
        name: 'move';
        struct: {
          kind: 'structTypeNode';
          fields: [
            {
              kind: 'structFieldTypeNode';
              name: 'x';
              type: { kind: 'numberTypeNode'; format: 'u16'; endian: 'le' };
            },
            {
              kind: 'structFieldTypeNode';
              name: 'y';
              type: { kind: 'numberTypeNode'; format: 'u16'; endian: 'le' };
            },
          ];
        };
      },
    ];
    size: { kind: 'numberTypeNode'; format: 'u8'; endian: 'le' };
  }>
);

type TestDefinedTypes = {
  StringType: P.CoderType<idl.GetType<{ kind: 'stringTypeNode' }>>;
  NumberType: P.CoderType<idl.GetType<{ kind: 'numberTypeNode'; format: 'u64' }>>;
  CustomTuple: P.CoderType<
    idl.GetType<{
      kind: 'tupleTypeNode';
      items: [{ kind: 'stringTypeNode' }, { kind: 'numberTypeNode'; format: 'u32' }];
    }>
  >;
};
assertType<string>(
  1 as any as idl.GetType<{ kind: 'definedTypeLinkNode'; name: 'StringType' }, TestDefinedTypes>
);
assertType<bigint>(
  1 as any as idl.GetType<{ kind: 'definedTypeLinkNode'; name: 'NumberType' }, TestDefinedTypes>
);
assertType<[string, number]>(
  1 as any as idl.GetType<{ kind: 'definedTypeLinkNode'; name: 'CustomTuple' }, TestDefinedTypes>
);
// PDAs

const testpdas = [
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
] as const;
assertType<{
  associatedToken: (arg: { owner: string; tokenProgram: string; mint: string }) => string;
}>(idl.parsePDAs('1', testpdas));
