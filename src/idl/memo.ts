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
            name: 'memo',
            type: { kind: 'stringTypeNode', encoding: 'utf8' },
            docs: [],
          },
        ],
        remainingAccounts: [
          {
            kind: 'instructionRemainingAccountsNode',
            value: { kind: 'argumentValueNode', name: 'signers' },
            isOptional: true,
            isSigner: true,
          },
        ],
        name: 'addMemo',
        idlName: 'addMemo',
        docs: [],
        optionalAccountStrategy: 'programId',
      },
    ],
    definedTypes: [],
    errors: [],
    name: 'memo',
    prefix: '',
    publicKey: 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
    version: '3.0.1',
    origin: 'shank',
  },
  additionalPrograms: [],
  standard: 'codama',
  version: '1.0.0',
} as const;
