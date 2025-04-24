import { ed25519 } from '@noble/curves/ed25519';
import { sha256 } from '@noble/hashes/sha2';
import { concatBytes } from '@noble/hashes/utils';
import { base16, base58, base64, utf8 } from '@scure/base';
import * as P from 'micro-packed';
import type { Instruction } from '../index.ts';

/*
# What is IDL?

Solana IDL == Ethereum ABI. Docs: https://github.com/codama-idl/codama/tree/main/packages/nodes

# IDLS

- Token: https://github.com/solana-program/token/blob/main/program/idl.json
- Token2022: https://github.com/solana-program/token-2022/blob/main/program/idl.json
- System: https://raw.githubusercontent.com/solana-program/system/refs/heads/main/program/idl.json
- ALT: https://github.com/solana-program/address-lookup-table/blob/main/program/idl.json
- Stake: https://raw.githubusercontent.com/solana-program/stake/refs/heads/main/program/idl.json
- Memo: https://raw.githubusercontent.com/solana-program/memo/refs/heads/main/program/idl.json
- Compute budget: https://raw.githubusercontent.com/solana-program/compute-budget/refs/heads/main/program/idl.json
- Config: https://raw.githubusercontent.com/solana-program/config/refs/heads/main/program/idl.json

These are anchor v00/v01, but it is possible to convert these to codama:

- Raydium CL: https://solscan.io/account/CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK#anchorProgramIdl
- Jupyter: https://solscan.io/account/JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4#anchorProgramIdl

## Status:
- this is slightly less broken than previous version (id)
  - a lot of bugs fixed that was in previous version
- super fragile and likely broken (you may lose funds!)

## Not done
- multisig support
- types
- PDA as parseValue
- IDL mostly works, but I don't trust it
- various link/semantic node values
- not padded preOffsetTypeNode/postOffsetTypeNode: unclear how to do this without adjusting micro-packed
    - does not seem to be used
*/

// Utils
export const PRECISION = 9;
export const Decimal = P.coders.decimal(PRECISION);
export type Bytes = Uint8Array;

const b58 = () => {
  const inner = P.bytes(32);
  return P.wrap({
    size: inner.size,
    encodeStream: (w: P.Writer, value: string) => inner.encodeStream(w, base58.decode(value)),
    decodeStream: (r: P.Reader): string => base58.encode(inner.decodeStream(r)),
  });
};

// first bit -- terminator (1 -- continue, 0 -- last)
export const shortU16 = P.wrap({
  encodeStream: (w: P.Writer, value: number) => {
    if (!value) return w.byte(0);
    for (; value; value >>= 7) {
      w.bits(value > 0x7f ? 1 : 0, 1);
      w.bits(value & 0x7f, 7);
    }
  },
  decodeStream: (r: P.Reader): number => {
    let len = 0;
    for (let pos = 0; !r.isEnd(); pos++) {
      const last = !r.bits(1);
      len |= r.bits(7) << (pos * 7);
      if (last) break;
    }
    return len;
  },
});

export const pubKey = b58();

function mod(a: bigint, b: bigint = ed25519.CURVE.Fp.ORDER) {
  const res = a % b;
  return res >= 0n ? res : b + res;
}

export function isOnCurve(bytes: Bytes | string) {
  if (typeof bytes === 'string') bytes = base58.decode(bytes);
  try {
    // noble-ed25519 checks that publicKey is < P, but dalek (ed25519-dalek.CompressedEdwardsY) is not, so we do modulo here.
    // first bit in last byte is x oddity flag
    const last = bytes[31];
    const normedLast = last & ~0x80;
    const normed = Uint8Array.from(Array.from(bytes.slice(0, 31)).concat(normedLast));
    const modBytes = P.U256LE.encode(mod(P.U256LE.decode(normed)));
    if ((last & 0x80) !== 0) modBytes[31] |= 0x80;
    ed25519.ExtendedPoint.fromHex(modBytes);
    return true;
  } catch (e) {
    return false;
  }
}

export function programAddress(program: string, ...seeds: Bytes[]) {
  let seed = P.utils.concatBytes(...seeds);
  const noncePos = seed.length;
  seed = P.utils.concatBytes(
    seed,
    new Uint8Array([0]),
    base58.decode(program),
    utf8.decode('ProgramDerivedAddress')
  );
  for (let i = 255; i >= 0; i--) {
    seed[noncePos] = i;
    const hash = sha256(seed);
    if (isOnCurve(hash)) continue;
    return base58.encode(hash);
  }
  throw new Error('SOL.programAddress: nonce exhausted, cannot find program address');
}

type ArrLike<T> = Array<T> | ReadonlyArray<T>;

// Boolean based on arbitrary number
const numBool: P.Coder<number, boolean> = {
  encode: (from): boolean => {
    if (from === 1) return true;
    if (from === 0) return false;
    throw new Error('wrong boolean');
  },
  decode(to: boolean) {
    if (to === true) return 1;
    if (to === false) return 0;
    throw new Error('wrong boolean');
  },
};
// Add postfix to string
const stringPostfix = (postfix: string): P.Coder<string, string> => ({
  encode(from) {
    return from + postfix;
  },
  decode(to) {
    if (!to.endsWith(postfix)) throw new Error('wrong postfix');
    return to.slice(0, -postfix.length);
  },
});
// Opposite of P.coders.numberBigint: use bigints with u8/u16/u32
const fromBigint: P.Coder<number, bigint> = {
  encode: (from: number): bigint => {
    if (!Number.isSafeInteger(from)) throw new Error(`expected safe number, got ${typeof from}`);
    return BigInt(from);
  },
  decode: (to: bigint): number => {
    if (typeof to !== 'bigint') throw new Error(`expected bigint, got ${typeof to}`);
    if (to > BigInt(Number.MAX_SAFE_INTEGER))
      throw new Error(`element bigger than MAX_SAFE_INTEGER=${to}`);
    return Number(to);
  },
};
const defaultCoder = <T>(inner: P.CoderType<T>, value: T): P.CoderType<T | undefined> =>
  P.apply(inner, {
    encode: (from: T) => from,
    decode: (to: T | undefined) => (to === undefined ? value : to),
  });

// TODO: it should be done via flags?
function zeroable<T>(inner: P.CoderType<T>): P.CoderType<T | undefined> {
  if (!Number.isSafeInteger(inner.size)) throw new Error('zeroable on unsized element');
  const ZEROS = new Uint8Array(inner.size!);
  return P.wrap({
    size: inner.size,
    encodeStream(w, value: T | undefined) {
      if (value === undefined) w.bytes(ZEROS);
      else inner.encodeStream(w, value);
    },
    decodeStream: inner.decodeStream,
  }) as P.CoderType<T | undefined>;
}

function remainder<T>(inner: P.CoderType<T>): P.CoderType<T | undefined> {
  return P.wrap({
    size: inner.size,
    encodeStream(w, value: T | undefined) {
      if (value !== undefined) inner.encodeStream(w, value);
    },
    decodeStream(r) {
      if (r.isEnd()) return undefined;
      return inner.decodeStream(r);
    },
  }) as P.CoderType<T | undefined>;
}

function prefix<T>(inner: P.CoderType<T>, prefix: Uint8Array): P.CoderType<T> {
  return P.wrap({
    size: inner.size,
    encodeStream(w, value: T) {
      w.bytes(prefix);
      inner.encodeStream(w, value);
    },
    decodeStream(r) {
      const p = r.bytes(prefix.length);
      if (!P.utils.equalBytes(p, prefix)) throw new Error('wrong prefix');
      return inner.decodeStream(r);
    },
  });
}

function postfix<T>(inner: P.CoderType<T>, postfix: Uint8Array): P.CoderType<T> {
  return P.wrap({
    size: inner.size,
    encodeStream(w, value: T) {
      inner.encodeStream(w, value);
      w.bytes(postfix);
    },
    decodeStream(r) {
      const res = inner.decodeStream(r);
      if (!P.utils.equalBytes(r.bytes(postfix.length), postfix)) throw new Error('wrong postfix');
      return res;
    },
  });
}

const EMPTY = P.magic(P.bytes(0), new Uint8Array(0));

function fixedOptional<T>(
  flag: P.CoderType<boolean>,
  inner: P.CoderType<T>
): P.CoderType<T | undefined> {
  if (!P.isCoder(flag) || !P.isCoder(inner))
    throw new Error(`fixedOptional: invalid flag or inner value flag=${flag} inner=${inner}`);
  if (flag.size === undefined) throw new Error('fixedOptional with unsized flag');
  if (inner.size === undefined) throw new Error('fixedOptional with unsized inner');
  return P.wrap({
    size: flag.size + inner.size,
    encodeStream: (w, value: T | undefined) => {
      flag.encodeStream(w, !!value);
      if (value) inner.encodeStream(w, value);
      else w.bytes(new Uint8Array(inner.size!));
    },
    decodeStream: (r): T | undefined => {
      if (flag.decodeStream(r)) return inner.decodeStream(r);
      else {
        if (!P.utils.equalBytes(r.bytes(inner.size!), new Uint8Array(inner.size!)))
          throw new Error('fixedOptional: wrong padding');
      }
      return;
    },
  });
}

// IDL stuff
type Node<K extends string, F = {}> = { readonly kind: K } & F;
type NumberValue = Node<'numberValueNode', { readonly number: number }>;
type NoneValue = Node<'noneValueNode'>;
type BytesValue = Node<
  'bytesValueNode',
  { readonly data: string; readonly encoding: 'base16' | 'base58' | 'base64' | 'utf8' }
>;
type BooleanValue = Node<'booleanValueNode', { readonly boolean: boolean }>;
type AccountBumpValue = Node<'accountBumpValueNode', { readonly name: string }>; // ????
type PublicKeyValue = Node<'publicKeyValueNode', { readonly publicKey: string }>;
type PayerValue = Node<'payerValueNode'>;

type PdaLink = Node<'pdaLinkNode', { readonly name: string }>;
type PdaSeedValue = Node<
  'pdaSeedValueNode',
  {
    readonly name: string;
    readonly value: Node<'accountValueNode' | 'argumentValueNode', { readonly name: string }>;
  }
>;
type PdaValue = Node<
  'pdaValueNode',
  { readonly pda: PdaLink; readonly seeds: ArrLike<PdaSeedValue> }
>;
type IdentityValue = Node<'identityValueNode'>; // like payer?
type AccountValue = Node<'accountValueNode', { readonly name: 'authority' }>; // defaults to another account?
type DefaultValue =
  | NumberValue
  | NoneValue
  | AccountBumpValue
  | BytesValue
  | BooleanValue
  | PublicKeyValue
  | PayerValue
  | PdaValue
  | IdentityValue
  | AccountValue;
type DefaultValueMap = {
  boolean: BooleanValue;
  number: NumberValue;
  bytes: BytesValue;
  none: NoneValue;
  publicKey: PublicKeyValue;
  payer: PayerValue;
  pda: PdaValue;
  identity: IdentityValue;
  account: AccountValue;
};
type DefaultValueDef<T extends keyof DefaultValueMap> = {
  defaultValue?: DefaultValueMap[T];
  defaultValueStrategy?: 'omitted' | 'optional'; // default: optional
};

function parseValueInt<
  T extends DefaultValue,
  PT extends ArrLike<PDAType>,
  DT extends DefinedTypes,
>(value: T, _pdas: PDAs<PT, DT>, _dt: DT) {
  // Everything is bigint, except things that used as counters (array length/etc)
  if (value.kind === 'numberValueNode') return BigInt(value.number);
  if (value.kind === 'noneValueNode') return undefined;
  if (value.kind === 'booleanValueNode') return value.boolean;
  if (value.kind === 'bytesValueNode') {
    if (value.encoding === 'base16') return base16.decode(value.data.toUpperCase());
    if (value.encoding === 'base58') return base58.decode(value.data);
    if (value.encoding === 'base64') return base64.decode(value.data);
    if (value.encoding === 'utf8') return utf8.decode(value.data);
  }
  if (value.kind === 'publicKeyValueNode') return value.publicKey;
  if (value.kind === 'pdaValueNode') {
    throw new Error('not implemented');
    // if (value.pda.kind !== 'pdaLinkNode') throw new Error('wrong pda link node');
    // const link = pdas[value.pda.name];
    // if (!link) throw new Error('unknown pda link:' + value.pda.name);
    // // TODO: fix?
    // const seeds = Object.fromEntries(
    //   value.seeds.map((i) => {
    //     if (i.kind !== 'pdaSeedValueNode') throw new Error('unknown pda seed node');
    //     if (!['accountValueNode', 'argumentValueNode'].includes(i.value.kind))
    //       throw new Error('wrong pda seed node');
    //     //console.log('T', i.value.name);
    //     return [i.name, i];
    //   })
    // );
  }
  throw new Error('wrong default value');
}
const IGNORE_DEFAULT = [
  'payerValueNode',
  'accountBumpValueNode',
  'identityValueNode',
  'pdaValueNode',
] as const;
function parseValue<T extends BasicType, PT extends ArrLike<PDAType>, DT extends DefinedTypes>(
  node: T,
  val: any,
  pdas: PDAs<PT, DT>,
  dt: DT
) {
  if (node.defaultValue) {
    // These not availabe on parsing step
    if (IGNORE_DEFAULT.includes(node.defaultValue.kind)) {
      return val;
    }
    if (val !== undefined && node.defaultValueStrategy === 'omitted')
      throw new Error('parseValue: non-empty omitted value');
    if (val === undefined) return (parseValueInt as any)(node.defaultValue, pdas, dt);
  }
  return val;
}

// Discriminators
type FieldDiscriminator = Node<
  'fieldDiscriminatorNode',
  { readonly name: string; readonly offset: number }
>;
type SizeDiscriminator = Node<'sizeDiscriminatorNode', { readonly size: number }>;
type ConstantDiscriminator = Node<
  'constantDiscriminatorNode',
  { readonly offset: number; readonly constant: ConstantType }
>;
type Discriminator = SizeDiscriminator | FieldDiscriminator | ConstantDiscriminator;
// Types
type NumericType = Node<
  'numberTypeNode',
  {
    readonly format: 'shortU16' | 'u8' | 'i8' | 'u16' | 'i16' | 'u32' | 'i32' | 'u64' | 'i64';
    readonly endian?: 'le' | 'be';
  }
> &
  DefaultValueDef<'number'>;

// As bigint
function parseNumeric(type: NumericType) {
  if (type.kind !== 'numberTypeNode') throw new Error('wrong numberTypeNode');
  if (type.format === 'shortU16') return P.apply(shortU16, fromBigint);
  if (type.format === 'u8') return P.apply(P.U8, fromBigint);
  if (type.format === 'i8') return P.apply(P.I8, fromBigint);
  if (type.format === 'i16') return P.apply(type.endian === 'le' ? P.I16LE : P.I16BE, fromBigint);
  if (type.format === 'u16') return P.apply(type.endian === 'le' ? P.U16LE : P.U16BE, fromBigint);
  if (type.format === 'i32') return P.apply(type.endian === 'le' ? P.I32LE : P.I32BE, fromBigint);
  if (type.format === 'u32') return P.apply(type.endian === 'le' ? P.U32LE : P.U32BE, fromBigint);
  if (type.format === 'i64') return type.endian === 'le' ? P.I64LE : P.I64BE;
  if (type.format === 'u64') return type.endian === 'le' ? P.U64LE : P.U64BE;
  throw new Error('wrong numeric type');
}
// As number (for counts). TODO: merge with parseNumeric
function parseNumericSafe(type: NumericType) {
  if (type.kind !== 'numberTypeNode') throw new Error('wrong numberTypeNode');
  if (type.format === 'u8') return P.U8;
  if (type.format === 'i8') return P.I8;
  if (type.format === 'shortU16') return shortU16;
  if (type.format === 'u16') return type.endian === 'le' ? P.U16LE : P.U16BE;
  if (type.format === 'i16') return type.endian === 'le' ? P.I16LE : P.I16BE;
  if (type.format === 'u32') return type.endian === 'le' ? P.U32LE : P.U32BE;
  if (type.format === 'i32') return type.endian === 'le' ? P.I32LE : P.I32BE;
  if (type.format === 'u64')
    return P.apply(type.endian === 'le' ? P.U64LE : P.U64BE, P.coders.numberBigint);
  if (type.format === 'i64')
    return P.apply(type.endian === 'le' ? P.I64LE : P.I64BE, P.coders.numberBigint);
  throw new Error('wrong numeric type');
}

type CountType =
  | Node<'prefixedCountNode', { prefix: NumericType }>
  | Node<'remainderCountNode'>
  | Node<'fixedCountNode', { value: number }>;

function parseCount(count: CountType): P.Length {
  if (count.kind === 'prefixedCountNode') return parseNumericSafe(count.prefix);
  if (count.kind === 'remainderCountNode') return null;
  if (count.kind === 'fixedCountNode') {
    if (!Number.isSafeInteger(count.value)) throw new Error('wrong fixedCountNode');
    return count.value;
  }
  throw new Error('wrong count node');
}

type EnumVariants = (
  | Node<'enumEmptyVariantTypeNode'>
  | Node<'enumStructVariantTypeNode', { readonly struct: any }>
  | Node<'enumTupleVariantTypeNode', { readonly tuple: TupleType }>
) & { readonly name: string; readonly discriminator?: number };

type EnumType = Node<
  'enumTypeNode',
  { readonly variants: ArrLike<EnumVariants>; readonly size: NumericType }
>;
type ArrayType = Node<'arrayTypeNode', { readonly item: BasicType; readonly count: CountType }>;
type PublicKeyType = Node<'publicKeyTypeNode'>;
type TypeLinkType = Node<'definedTypeLinkNode', { readonly name: string }>;
type BooleanType = Node<'booleanTypeNode', { readonly size: NumericType }> &
  DefaultValueDef<'boolean'>;
type StringType = Node<'stringTypeNode'>;
type StructField = Node<
  'structFieldTypeNode',
  { readonly name: string; readonly type: BasicType }
> &
  DefaultValueDef<any>; // TODO: fix
type StructType = Node<'structTypeNode', { readonly fields: ArrLike<StructField> }>;
type OptionalType = Node<
  'optionTypeNode',
  { readonly item: BasicType; readonly prefix?: NumericType; readonly fixed?: boolean }
>;
type AmountType = Node<
  'amountTypeNode',
  { readonly decimals: number; readonly unit: string; readonly number: NumericType }
>;
type FixedSizeType = Node<'fixedSizeTypeNode', { readonly size: number; readonly type: BasicType }>;
type BytesType = Node<'bytesTypeNode'>;
type PrefixType = Node<
  'sizePrefixTypeNode',
  { readonly type: BasicType; readonly prefix: NumericType }
>;
type ZeroableType = Node<'zeroableOptionTypeNode', { readonly item: BasicType }>;
type RemainderOptionType = Node<'remainderOptionTypeNode', { readonly item: BasicType }>;
type HiddenPrefixType = Node<
  'hiddenPrefixTypeNode',
  { readonly type: BasicType; readonly prefix: ArrLike<BasicType> }
>;
type HiddenSuffixType = Node<
  'hiddenSuffixTypeNode',
  { readonly type: BasicType; readonly suffix: ArrLike<BasicType> }
>;
type ConstantType = Node<'constantValueNode', { readonly type: BasicType; readonly value: any }>;
type PreOffsetType = Node<
  'preOffsetTypeNode',
  {
    readonly offset: number;
    readonly strategy: 'padded' | 'absolute' | 'relative';
    readonly type: BasicType;
  }
>;
type PostOffsetType = Node<
  'PostOffsetTypeNode',
  {
    readonly offset: number;
    readonly strategy: 'padded' | 'absolute' | 'relative';
    readonly type: BasicType;
  }
>;
type TupleType = Node<'tupleTypeNode', { readonly items: ArrLike<BasicType> }>;
type MapType = Node<
  'mapTypeNode',
  {
    readonly key: BasicType;
    readonly value: BasicType;
    readonly count: CountType;
  }
>;

type BasicType = (
  | EnumType
  | NumericType
  | OptionalType
  | StructType
  | ArrayType
  | PublicKeyType
  | TypeLinkType
  | StringType
  | BooleanType
  | AmountType
  | FixedSizeType
  | BytesType
  | ZeroableType
  | PrefixType
  | RemainderOptionType
  | ConstantType
  | PreOffsetType
  | StructField
  | HiddenPrefixType
  | HiddenSuffixType
  | PostOffsetType
  | TupleType
  | MapType
) & { defaultValue?: DefaultValue; defaultValueStrategy?: 'omitted' | 'optional' };

type DefinedTypes = Record<string, P.CoderType<any>>;

type GetTypeStruct<T extends StructType, DT extends DefinedTypes = {}> = {
  [K in T['fields'][number]['name']]: GetType<
    Extract<T['fields'][number], { name: K }>['type'],
    DT
  >;
};

type GetTypeTuple<T extends TupleType, DT extends DefinedTypes = {}> = T['items'] extends readonly [
  infer A,
]
  ? [A extends BasicType ? GetType<A, DT> : never]
  : T['items'] extends readonly [infer A, infer B]
    ? [A extends BasicType ? GetType<A, DT> : never, B extends BasicType ? GetType<B, DT> : never]
    : T['items'] extends readonly [infer A, infer B, infer C]
      ? [
          A extends BasicType ? GetType<A, DT> : never,
          B extends BasicType ? GetType<B, DT> : never,
          C extends BasicType ? GetType<C, DT> : never,
        ]
      : T['items'] extends ReadonlyArray<infer Item>
        ? (Item extends BasicType ? GetType<Item, DT> : never)[]
        : never[];

type GetTypeEnum<
  T extends EnumType,
  DT extends DefinedTypes = {},
> = T['variants'] extends readonly []
  ? never
  : T['variants'][number] extends infer Variant
    ? Variant extends Node<'enumEmptyVariantTypeNode'> & { readonly name: infer Name }
      ? { TAG: Name extends string ? Name : never }
      : Variant extends Node<'enumStructVariantTypeNode'> & {
            readonly name: infer Name;
            readonly struct: infer Struct;
          }
        ? {
            TAG: Name extends string ? Name : never;
            data: Struct extends StructType ? GetTypeStruct<Struct, DT> : never;
          }
        : Variant extends Node<'enumTupleVariantTypeNode'> & {
              readonly name: infer Name;
              readonly tuple: infer Tuple;
            }
          ? {
              TAG: Name extends string ? Name : never;
              data: Tuple extends TupleType ? GetTypeTuple<Tuple, DT> : never;
            }
          : never
    : never;

// type TypeLinkType = Node<'definedTypeLinkNode', { readonly name: string }>;

type GetTypeLink<T extends TypeLinkType, DT extends DefinedTypes = {}> = T['name'] extends keyof DT
  ? P.UnwrapCoder<DT[T['name']]>
  : never;

// prettier-ignore
type GetTypeBase<T extends BasicType, DT extends DefinedTypes = {}> =
  // Basic
  T extends NumericType ? bigint :
  T extends BooleanType ? boolean :
  T extends StringType ? string :
  T extends AmountType ? string :
  T extends BytesType ? Uint8Array :
  T extends PublicKeyType ? string :
  // Structs
  T extends ArrayType ? (GetType<T['item'], DT>)[] :
  T extends MapType ? Map<GetType<T['key'], DT>, GetType<T['value'], DT>> :  // TODO: fix to map?
  T extends StructType ? GetTypeStruct<T, DT> :
  T extends TupleType ? GetTypeTuple<T, DT> :
  T extends EnumType ? GetTypeEnum<T, DT> :
  T extends TypeLinkType ? GetTypeLink<T, DT> :
  // Passhrough
  T extends FixedSizeType ? GetType<T['type'], DT> :
  T extends HiddenPrefixType ? GetType<T['type'], DT> :
  T extends HiddenSuffixType ? GetType<T['type'], DT> :
  T extends PreOffsetType ? GetType<T['type'], DT> :
  T extends PostOffsetType ? GetType<T['type'], DT> :
  T extends ZeroableType ? GetType<T['item'], DT> :
  T extends PrefixType ? GetType<T['type'], DT> :
  T extends ConstantType ? GetType<T['type'], DT> :
  T extends RemainderOptionType ? GetType<T['item'], DT> | undefined :
  T extends OptionalType ? GetType<T['item'], DT> | undefined :
  unknown; // default

export type GetType<T extends BasicType, DT extends DefinedTypes = {}> = T extends {
  defaultValue: Exclude<DefaultValue, { kind: (typeof IGNORE_DEFAULT)[number] }>;
  defaultValueStrategy?: infer Strategy;
}
  ? Strategy extends 'omitted'
    ? undefined
    : Strategy extends 'optional' | undefined
      ? GetTypeBase<T, DT> | undefined
      : GetTypeBase<T, DT>
  : // If no defaultValue or it's an ignored kind, proceed as normal
    GetTypeBase<T, DT>;

const types: Record<string, (type: any, dt: DefinedTypes) => P.CoderType<any>> = {
  // Primitive
  publicKeyTypeNode: () => pubKey,
  numberTypeNode: (type: NumericType) => parseNumeric(type),
  booleanTypeNode: (type: BooleanType) => P.apply(parseNumericSafe(type.size), numBool),
  bytesTypeNode: (_type: BytesType) => P.bytes(null),
  stringTypeNode: (_type: StringType) => P.string(null),
  amountTypeNode: (type: AmountType) => {
    const x = parseNumeric(type.number);
    const x2 = P.apply(x, P.coders.decimal(type.decimals));
    return P.apply(x2, stringPostfix(` ${type.unit}`));
  },
  // Wrappers
  fixedSizeTypeNode: (type: FixedSizeType, dt: DefinedTypes = {}) =>
    P.prefix(type.size, (mapType as any)(type.type, dt)),
  sizePrefixTypeNode: (type: PrefixType, dt: DefinedTypes = {}) =>
    P.prefix(parseNumericSafe(type.prefix), (mapType as any)(type.type, dt)),
  optionTypeNode: (type: OptionalType, dt: DefinedTypes = {}) => {
    const inner = (mapType as any)(type.item, dt);
    const prefix = parseNumericSafe(
      type.prefix ? type.prefix : { kind: 'numberTypeNode', format: 'u8', endian: 'le' }
    );
    if (type.fixed === true) {
      if (!inner.size) throw new Error('optional fixed=true with unsized element');
      return fixedOptional(P.apply(prefix, numBool), inner);
    }
    return P.optional(P.apply(prefix, numBool), inner);
  },
  // Structure
  arrayTypeNode: (type: ArrayType, dt: DefinedTypes = {}) =>
    P.array(parseCount(type.count), (mapType as any)(type.item, dt)),
  enumVariant: (type: EnumVariants, dt: DefinedTypes = {}) => {
    if (type.kind === 'enumStructVariantTypeNode') return (mapType as any)(type.struct, dt);
    if (type.kind === 'enumTupleVariantTypeNode') return mapType(type.tuple, dt);
    if (type.kind === 'enumEmptyVariantTypeNode') return EMPTY;
    throw new Error('unknown enum variant');
  },
  enumTypeNode: (type: EnumType, dt: DefinedTypes = {}) => {
    const variants = Object.fromEntries(
      type.variants.map((i, j) => [i.name, [i.discriminator || j, types.enumVariant(i, dt)]])
    );
    return P.mappedTag(parseNumericSafe(type.size), variants as any);
  },
  mapTypeNode: (type: MapType, dt: DefinedTypes = {}) => {
    const inner = P.tuple([(mapType as any)(type.key, dt), (mapType as any)(type.value, dt)]);
    const lst = P.array(parseCount(type.count), inner);
    return P.apply(lst, P.coders.dict());
  },
  structFieldTypeNode: (type: StructField, dt: DefinedTypes = {}) =>
    (mapType as any)(
      {
        ...type.type,
        defaultValue: type.defaultValue,
        defaultValueStrategy: type.defaultValueStrategy,
      },
      dt
    ),
  structTypeNode: <T extends StructType, DT extends DefinedTypes>(
    type: T,
    dt: DT
  ): P.CoderType<GetTypeStruct<T, DT>> =>
    P.struct(
      Object.fromEntries(
        type.fields.map((i) => {
          if (i.kind !== 'structFieldTypeNode') throw new Error('wrong structFieldTypeNode');
          return [i.name, mapType(i, dt)];
        })
      ) as any
    ) as any,
  tupleTypeNode: (type: TupleType, dt: DefinedTypes = {}) =>
    P.tuple(type.items.map((i) => (mapType as any)(i, dt))),
  definedTypeLinkNode: (type: DefinedType, dt: DefinedTypes = {}) => {
    if (!dt[type.name]) throw new Error('unknown type: ' + type.name);
    return dt[type.name];
  },
  zeroableOptionTypeNode: <T extends ZeroableType>(type: T, dt: DefinedTypes = {}) =>
    zeroable((mapType as any)(type.item, dt)),
  remainderOptionTypeNode: <T extends RemainderOptionType>(type: T, dt: DefinedTypes = {}) =>
    remainder((mapType as any)(type.item, dt)),
  constantValueNode: <T extends ConstantType>(type: T, dt: DefinedTypes = {}) =>
    P.magic((mapType as any)(type.type, dt), parseValueInt(type.value, {}, dt)),
  hiddenPrefixTypeNode: <T extends HiddenPrefixType>(type: T, dt: DefinedTypes = {}) => {
    return prefix(
      (mapType as any)(type.type, dt),
      concatBytes(...type.prefix.map((i) => (mapType as any)(i, dt).encode()))
    );
  },
  hiddenSuffixTypeNode: <T extends HiddenSuffixType>(type: T, dt: DefinedTypes = {}) =>
    postfix(
      (mapType as any)(type.type, dt),
      concatBytes(...type.suffix.map((i) => (mapType as any)(i, dt).encode()))
    ),
  preOffsetTypeNode: <T extends PreOffsetType>(type: T, dt: DefinedTypes = {}) => {
    if (type.strategy === 'padded')
      return prefix((mapType as any)(type.type, dt), new Uint8Array(type.offset));
    // TODO: this includes very complex pointer-like manipulation that I'm not sure how to implement yet.
    throw new Error('not implemented');
  },
  postOffsetTypeNode: <T extends PreOffsetType>(type: T, dt: DefinedTypes = {}) => {
    if (type.strategy === 'padded')
      return postfix((mapType as any)(type.type, dt), new Uint8Array(type.offset));
    throw new Error('not implemented');
  },
};

function mapTypeInternal(type: BasicType, definedTypes: DefinedTypes = {}): any {
  const t = (types as any)[type.kind];
  if (t === undefined) throw new Error('Unknown type: ' + type.kind);
  return t(type, definedTypes);
}

export function mapType<T extends BasicType, DT extends DefinedTypes>(
  type: T,
  dt: DT
): GetType<T, DT> {
  const t = mapTypeInternal(type, dt);
  // Inner type of field type is already mapped!
  if (
    type.defaultValue &&
    type.kind !== 'structFieldTypeNode' &&
    !IGNORE_DEFAULT.includes(type.defaultValue.kind as any)
  ) {
    const def = parseValueInt(type.defaultValue, {}, dt);
    if (type.defaultValueStrategy === 'omitted') return P.magic(t, def) as any;
    if (type.defaultValueStrategy === 'optional' || type.defaultValueStrategy === undefined)
      return defaultCoder(t, def) as any;
    throw new Error('wrong defaultValueStrategy: ' + type.defaultValueStrategy);
  }
  return t;
}

type DefinedType = {
  readonly kind: 'definedTypeNode';
  readonly name: string;
  readonly type: BasicType;
};

export type GetDefinedTypes<T extends ArrLike<DefinedType>> = {
  [K in T[number]['name']]: P.CoderType<GetType<Extract<T[number], { name: K }>['type']>>;
};
function parseDefinedTypes<T extends ArrLike<DefinedType>>(types: T): GetDefinedTypes<T> {
  const res: Record<string, any> = {};
  // Disable recursive stuff here
  for (const t of types) res[t.name] = (mapType as any)(t.type, res);
  return res as any;
}

type PDASeeds =
  | Node<'variablePdaSeedNode', { readonly name: string; readonly type: BasicType }>
  | Node<
      'constantPdaSeedNode',
      { readonly name: string; readonly type: BasicType; readonly value: DefaultValue }
    >;

type PDAType = Node<'pdaNode', { readonly name: string; readonly seeds: ArrLike<PDASeeds> }>;

type GetPDASeeds<T extends PDAType, DT extends DefinedTypes = {}> = {
  [K in Extract<T['seeds'][number], { name: string }>['name']]: Extract<
    T['seeds'][number],
    { name: K }
  > extends Node<'variablePdaSeedNode', { readonly type: infer Type }>
    ? GetType<Type & BasicType, DT>
    : Extract<T['seeds'][number], { name: K }> extends Node<
          'constantPdaSeedNode',
          { readonly type: infer Type }
        >
      ? GetType<Type & BasicType, DT>
      : never;
};

// Then, define the return type for parsePDAs
type PDAs<T extends ArrLike<PDAType>, DT extends DefinedTypes = {}> = {
  [K in T[number]['name']]: (value: GetPDASeeds<Extract<T[number], { name: K }>, DT>) => string;
};

export function parsePDAs<T extends ArrLike<PDAType>, DT extends DefinedTypes = {}>(
  program: string,
  pda: T,
  dt: DT = {} as DT
): PDAs<T, DT> {
  const res: Record<string, any> = {};
  for (const p of pda) {
    const fields = Object.fromEntries(
      p.seeds.map((seed) => {
        if (seed.kind === 'variablePdaSeedNode')
          return [seed.name, (mapType as any)(seed.type, dt)];
        if (seed.kind === 'constantPdaSeedNode') {
          // TODO: check
          return [
            seed.name,
            P.magic((mapType as any)(seed.type, dt), parseValueInt(seed.value, res, dt)),
          ];
        }
        throw new Error('unknown seed type');
      })
    );
    const coder = P.struct(fields);
    res[p.name] = (value: any) => programAddress(program, coder.encode(value));
  }
  return res as any;
}

type Account = Node<
  'instructionAccountNode',
  {
    readonly name: string;
    readonly isWritable: boolean;
    readonly isSigner: boolean | 'either';
    readonly isOptional: boolean;
  }
> &
  DefaultValueDef<'publicKey' | 'pda' | 'identity' | 'payer' | 'account'>;

type Argument = Node<
  'instructionArgumentNode',
  { readonly name: string; readonly type: BasicType }
> &
  DefaultValueDef<any>;

type GetArgumentType<A extends Argument, DT extends DefinedTypes = {}> = A extends {
  type: infer T extends BasicType;
  defaultValue: infer DV;
  defaultValueStrategy: infer DVS;
}
  ? GetType<
      {
        defaultValue: DV;
        defaultValueStrategy: DVS;
      } & T,
      DT
    >
  : A extends {
        type: infer T extends BasicType;
        defaultValue: infer DV;
      }
    ? GetType<
        {
          defaultValue: DV;
          defaultValueStrategy: undefined;
        } & T,
        DT
      >
    : A extends {
          type: infer T extends BasicType;
        }
      ? GetType<T, DT>
      : unknown;

export type GetTypeArguments<T extends ArrLike<Argument>, DT extends DefinedTypes = {}> = {
  [K in Extract<T[number], { name: string }>['name']]: GetArgumentType<
    Extract<T[number], { name: K }>,
    DT
  >;
};

function parseArguments<T extends ArrLike<Argument>, DT extends DefinedTypes>(
  args: T,
  types: DT
): GetTypeArguments<T, DT> {
  const res: Record<string, any> = {};
  for (const a of args) {
    if (a.kind !== 'instructionArgumentNode') throw new Error('instructionArgumentNode');
    const type = (mapType as any)(
      { ...a.type, defaultValue: a.defaultValue, defaultValueStrategy: a.defaultValueStrategy },
      types
    );
    res[a.name] = type;
  }
  return res as GetTypeArguments<T, DT>;
}

function getFieldBytes(node: any, field: string, types: DefinedTypes) {
  if (node.kind === 'accountNode') {
    if (node.data.kind === 'structTypeNode') {
      for (const f of node.data.fields) {
        if (f.name !== field) continue;
        return (mapType as any)(f, types).encode(undefined);
      }
    }
  }
  if (node.kind === 'instructionNode') {
    for (const f of node.arguments) {
      if (f.name !== field) continue;
      return (mapType as any)(
        { ...f.type, defaultValue: f.defaultValue, defaultValueStrategy: f.defaultValueStrategy },
        types
      ).encode(undefined);
    }
  }
  throw new Error('getFieldBytes wrong node type: ' + node.kind);
}

function decodeDiscriminators(
  discriminators: ArrLike<Discriminator>,
  coder: any,
  node: any,
  types: DefinedTypes
) {
  return (data: Uint8Array) => {
    // This is slower and worse than previous version via tag, but significantly more flexible
    for (const d of discriminators) {
      if (d.kind === 'sizeDiscriminatorNode' && data.length !== d.size) return false;
      if (d.kind === 'constantDiscriminatorNode') {
        throw new Error('constantDiscriminatorNode not imeplemented');
      }
      if (d.kind === 'fieldDiscriminatorNode') {
        const bytes = getFieldBytes(node, d.name, types);
        const realBytes = data.subarray(d.offset, d.offset + bytes.length);
        if (!P.utils.equalBytes(bytes, realBytes)) return false;
      }
    }
    return coder.decode(data);
  };
}

function buildDecoder<T extends Record<string, (data: Uint8Array) => any>>(decoders: T) {
  // TODO: P.match?
  return (data: Uint8Array) => {
    for (const [name, decoder] of Object.entries(decoders)) {
      const value = decoder(data);
      if (value !== false) return { TAG: name, data: value };
    }
    throw new Error('Unknown value');
  };
}

type RemainingAccounts = Node<
  'instructionRemainingAccountsNode',
  { readonly value: Node<'argumentValueNode', { readonly name: string }> }
>;

type ProgramInstruction = Node<
  'instructionNode',
  {
    readonly accounts: ArrLike<Account>;
    readonly arguments: ArrLike<Argument>;
    readonly discriminators?: ArrLike<Discriminator>;
    readonly remainingAccounts?: ArrLike<RemainingAccounts>;
    readonly name: string;
    readonly optionalAccountStrategy?: 'programId' | 'omitted';
  }
>;

export type GetTypeAccounts<T extends ArrLike<Account>> = {
  [K in Extract<T[number], { name: string }>['name']]: Extract<T[number], { name: K }> extends {
    defaultValue?: { kind: 'publicKeyValueNode' };
  }
    ? undefined // Account with publicKeyValueNode default is optional
    : string; // All other accounts are required
};

export type Nullable<T> =
  // Pick all non-undefinable keys as required properties
  {
    [K in keyof T as undefined extends T[K] ? never : K]: T[K];
  } & {
    // Pick all undefinable keys as optional properties (without undefined in their type)
    [K in keyof T as undefined extends T[K] ? K : never]?: Exclude<T[K], undefined>;
  };

export type GetInstructionArgs<
  T extends ProgramInstruction,
  DT extends DefinedTypes = {},
> = Nullable<GetTypeArguments<T['arguments'], DT> & GetTypeAccounts<T['accounts']>>;

type DecodedInstruction<T extends ProgramInstruction, DT extends DefinedTypes = {}> = {
  TAG: string;
  data: GetInstructionArgs<T, DT> & {
    [K in Extract<T['accounts'][number], { name: string }>['name']]?: string;
  };
};

export type ParsedInstructions<
  T extends ArrLike<ProgramInstruction>,
  DT extends DefinedTypes = {},
> = {
  encoders: {
    [K in T[number]['name']]: (
      inst: GetInstructionArgs<Extract<T[number], { name: K }>, DT>
    ) => Instruction;
  };
  decoder: (inst: Instruction) => DecodedInstruction<T[number], DT>;
};

function parseInstructions<
  T extends ArrLike<ProgramInstruction>,
  P extends PDAs<any, DT>,
  DT extends DefinedTypes,
>(instructions: T, types: DT, pdas: P, contract: string): ParsedInstructions<T, DT> {
  const encoders: Record<string, any> = {};
  const decoders: Record<string, any> = {};
  const instNames: Record<string, ProgramInstruction> = {};
  for (const i of instructions) {
    if (i.kind !== 'instructionNode') throw new Error('wrong instructionNode');
    const args = parseArguments(i.arguments, types) as any;
    const type = P.struct(args);
    instNames[i.name] = i;
    encoders[i.name] = (inst: any): Instruction => {
      const data = type.encode(inst);
      const keys = i.accounts.map((i) => ({
        address: (parseValue as any)(i, inst[i.name], pdas, types) as string,
        sign: i.isSigner !== false, // either?
        write: i.isWritable === true,
      }));
      if (i.remainingAccounts) {
        if (i.remainingAccounts.length !== 1)
          throw new Error('only single remainingAccounts supported');
        const r0 = i.remainingAccounts[0];
        if (r0.value.kind !== 'argumentValueNode')
          throw new Error('remainingAccounts: only argumentValueNode supported');
        const name = r0.value.name;
        if (inst[name]) throw new Error('encode: remainingAccounts not implemented');
      }
      return { program: contract, keys, data };
    };
    decoders[i.name] = decodeDiscriminators(i.discriminators || [], type, i, types);
  }
  const decoderData = buildDecoder(decoders);
  const decoder = (inst: Instruction) => {
    if (inst.program !== contract) throw new Error('wrong program address');
    const data = decoderData(inst.data);
    const instMeta = instNames[data.TAG];
    const accounts = instMeta.accounts;

    if (inst.keys.length !== accounts.length) throw new Error('wrong number of accounts');
    // if (instMeta.remainingAccounts) {
    //   throw new Error('decode: remainingAccounts not implemented');
    // }
    for (let i = 0; i < accounts.length; i++) {
      const m = accounts[i];
      const r = inst.keys[i];
      if (m.isSigner === true && !r.sign) throw new Error('wrong sign flag');
      if (m.isWritable === true && !r.write) throw new Error('wrong write flag');
      if (r.address !== (parseValue as any)(m, undefined, pdas, types))
        data.data[m.name] = r.address;
    }
    return data;
  };
  return { encoders, decoder } as any;
}

type ContractAccount = {
  readonly kind: 'accountNode';
  readonly name: string;
  readonly data: BasicType;
  readonly discriminators?: ArrLike<Discriminator>;
};

type DecodedAccount<T extends ArrLike<ContractAccount>, DT extends DefinedTypes = {}> = {
  [K in T[number]['name']]: {
    TAG: K;
    data: GetType<Extract<T[number], { name: K }>['data'], DT>;
  };
}[T[number]['name']];

export type AccountDefinitions<T extends ArrLike<ContractAccount>, DT extends DefinedTypes = {}> = {
  encoders: {
    [K in T[number]['name']]: (
      data: GetType<Extract<T[number], { name: K }>['data'], DT>
    ) => Uint8Array;
  };
  decoder: (data: Uint8Array) => DecodedAccount<T, DT>;
};

export function defineAccounts<T extends ArrLike<ContractAccount>, DT extends DefinedTypes>(
  accounts: T,
  types: DT
): AccountDefinitions<T, DT> {
  const encoders: Record<string, any> = {};
  const decoders: Record<string, any> = {};
  for (const a of accounts) {
    if (a.kind !== 'accountNode') throw new Error('wrong accountNode');
    const type = (mapType as any)(a.data, types);
    encoders[a.name] = type.encode;
    decoders[a.name] = decodeDiscriminators(a.discriminators || [], type, a, types);
  }
  const decoder = buildDecoder(decoders);
  return { encoders, decoder } as any;
}

type Program = {
  readonly kind: 'programNode';
  readonly name: string;
  readonly publicKey: string;
  readonly definedTypes: ArrLike<DefinedType>;
  readonly pdas: ArrLike<PDAType>;
  readonly instructions: ArrLike<ProgramInstruction>;
  readonly accounts: ArrLike<ContractAccount>;
};

type GetTypeProgram<P extends Program> = {
  name: P['name'];
  contract: P['publicKey'];
  types: GetDefinedTypes<P['definedTypes']>;
  pdas: PDAs<P['pdas'], GetDefinedTypes<P['definedTypes']>>;
  instructions: ParsedInstructions<P['instructions'], GetDefinedTypes<P['definedTypes']>>;
  accounts: AccountDefinitions<P['accounts'], GetDefinedTypes<P['definedTypes']>>;
};

export function defineProgram<P extends Program>(p: P): GetTypeProgram<P> {
  if (p.kind !== 'programNode') throw new Error('idl: wrong program node');
  const types = parseDefinedTypes(p.definedTypes) as any;
  const pdas = parsePDAs(p.publicKey, p.pdas, types);
  const instructions = (parseInstructions as any)(p.instructions, types, pdas, p.publicKey);
  const accounts = defineAccounts(p.accounts, types);
  return { name: p.name, contract: p.publicKey, types, accounts, instructions, pdas } as any;
}

type IDL = {
  readonly kind: 'rootNode';
  readonly program: Program;
  readonly additionalPrograms: ArrLike<Program>;
};

type GetTypeIDL<T extends IDL> = {
  [K in
    | T['program']['name']
    | T['additionalPrograms'][number]['name']]: K extends T['program']['name']
    ? GetTypeProgram<T['program']>
    : GetTypeProgram<Extract<T['additionalPrograms'][number], { name: K }>>;
};

export function defineIDL<T extends IDL>(idl: T): GetTypeIDL<T> {
  const res: Record<string, any> = {};
  res[idl.program.name] = defineProgram(idl.program);
  for (const program of idl.additionalPrograms) res[program.name] = defineProgram(program);
  return res as GetTypeIDL<T>;
}
