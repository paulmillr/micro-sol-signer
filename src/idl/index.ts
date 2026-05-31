import { ed25519 } from '@noble/curves/ed25519.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { concatBytes, isBytes } from '@noble/hashes/utils.js';
import { base16, base58, base64, utf8, type TArg, type TRet } from '@scure/base';
import * as P from 'micro-packed';
import type { Instruction } from '../index.ts';
export type { TArg, TRet } from '@scure/base';

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
- not padded preOffsetTypeNode/postOffsetTypeNode: unclear how to do this without adjusting
  micro-packed
    - does not seem to be used
*/

/**
 * Recursively freezes an object graph in place.
 * @param obj - Value to freeze.
 * @returns The same value after freezing every reachable array or object value.
 * @example
 * Freeze generated IDL helper constants before exporting them.
 * ```ts
 * import { deepFreeze } from 'micro-sol-signer/idl.js';
 * deepFreeze({ accounts: [{ name: 'state' }] });
 * ```
 */
export function deepFreeze<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object' || isBytes(obj)) return obj;
  if (Object.isFrozen(obj)) return obj;
  Object.freeze(obj);
  if (Array.isArray(obj)) {
    for (const item of obj) deepFreeze(item);
  } else {
    for (const value of Object.values(obj)) deepFreeze(value);
  }
  return obj;
}
/** Default Solana decimal precision for SOL amounts. */
export const PRECISION = 9;
/**
 * Decimal coder for lamport-denominated SOL values.
 * @example
 * Convert between human-readable SOL amounts and lamports.
 * ```ts
 * import { Decimal } from 'micro-sol-signer/idl.js';
 * const lamports = Decimal.decode('1.5');
 * const amount = Decimal.encode(lamports); // '1.5'
 * ```
 */
export const Decimal: P.Coder<bigint, string> = /* @__PURE__ */ deepFreeze(
  /* @__PURE__ */ P.coders.decimal(PRECISION)
);
/** Generic byte-array type used across IDL helpers. */
export type Bytes = Uint8Array;
/** Public coder type with byte outputs narrowed for TS generic Uint8Array compatibility. */
export type CoderType<T> = TRet<
  Omit<P.CoderType<T>, 'decode' | 'decodeStream' | 'encode' | 'encodeStream'> & {
    encode: (data: TArg<T>) => TRet<Uint8Array>;
    decode: (data: TArg<Uint8Array>, opts?: P.ReaderOpts) => TRet<T>;
    encodeStream: (w: P.Writer, value: TArg<T>) => void;
    decodeStream: (r: P.Reader) => TRet<T>;
  }
>;

const b58 = (): TRet<CoderType<string>> => {
  const inner = P.bytes(32);
  return P.wrap({
    size: inner.size,
    encodeStream: (w: P.Writer, value: string) => inner.encodeStream(w, base58.decode(value)),
    decodeStream: (r: P.Reader): string => base58.encode(inner.decodeStream(r)),
  }) as CoderType<string>;
};

// first bit -- terminator (1 -- continue, 0 -- last)
/**
 * Short variable-length `u16` coder used by Solana message formats.
 * Despite the historical name, this keeps consuming 7-bit groups until it sees a
 * terminator bit or the input ends.
 * @example
 * Round-trip the compact length prefix used in Solana message arrays.
 * ```ts
 * import { shortU16 } from 'micro-sol-signer/idl.js';
 * const encoded = shortU16.encode(300);
 * const decoded = shortU16.decode(encoded); // 300
 * ```
 */
export const shortU16: TRet<CoderType<number>> = /* @__PURE__ */ deepFreeze(
  /* @__PURE__ */ P.wrap({
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
  }) as CoderType<number>
);

/**
 * Base58-encoded public key coder.
 * @example
 * Encode and decode the base58 public-key strings used by Solana RPC APIs.
 * ```ts
 * import { pubKey } from 'micro-sol-signer/idl.js';
 * const owner = pubKey.decode(pubKey.encode('11111111111111111111111111111111'));
 * ```
 */
export const pubKey: TRet<CoderType<string>> = /* @__PURE__ */ deepFreeze(/* @__PURE__ */ b58());
const _0n = /* @__PURE__ */ BigInt(0);

function mod(a: bigint, b: bigint = ed25519.Point.Fp.ORDER) {
  const res = a % b;
  return res >= _0n ? res : b + res;
}

/**
 * Checks whether bytes decode to a valid Ed25519 point on curve.
 * @param bytes - Public key bytes or base58 string.
 * @returns `true` when the value is on the Ed25519 curve.
 * @example
 * Distinguish a Solana public key from an arbitrary base58 string before using it as an owner.
 * ```ts
 * import { isOnCurve } from 'micro-sol-signer/idl.js';
 * const isAddress = isOnCurve('11111111111111111111111111111111');
 * ```
 */
export function isOnCurve(bytes: TArg<Bytes | string>): boolean {
  if (typeof bytes === 'string') bytes = base58.decode(bytes);
  try {
    // noble-ed25519 checks that publicKey is < P, but dalek does not, so reduce modulo P.
    // first bit in last byte is x oddity flag
    const last = bytes[31];
    const normed = Uint8Array.from(bytes.subarray(0, 32));
    normed[31] = last & ~0x80;
    const modBytes = P.U256LE.encode(mod(P.U256LE.decode(normed)));
    if ((last & 0x80) !== 0) modBytes[31] |= 0x80;
    ed25519.Point.fromBytes(modBytes);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Derives a Solana program-derived address for a program and seed list.
 * @param program - Program address in base58 form.
 * @param seeds - Seed byte slices used for derivation.
 * @returns Base58-encoded PDA.
 * @throws If no off-curve PDA can be found for the supplied seeds. {@link Error}
 * @example
 * Derive a deterministic PDA from a program id and one or more seed byte arrays.
 * ```ts
 * import { programAddress } from 'micro-sol-signer/idl.js';
 * const vault = programAddress('11111111111111111111111111111111', Uint8Array.of(1, 2, 3));
 * ```
 */
export function programAddress(program: string, ...seeds: TArg<Bytes[]>): string {
  let seed = P.utils.concatBytes(...seeds);
  const noncePos = seed.length;
  seed = P.utils.concatBytes(
    seed,
    Uint8Array.of(0),
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
  // The all-zero inner encoding is reserved as the undefined sentinel.
  const ZEROS = new Uint8Array(inner.size!);
  return P.wrap({
    size: inner.size,
    encodeStream(w, value: T | undefined) {
      if (value === undefined) w.bytes(ZEROS);
      else {
        const bytes = inner.encode(value);
        // Present values must not collide with the undefined sentinel because decode reserves it.
        if (P.utils.equalBytes(bytes, ZEROS))
          throw new Error('zeroable: encoded value collides with undefined sentinel');
        w.bytes(bytes);
      }
    },
    decodeStream(r) {
      // Check bytes before inner decoding, otherwise a zero public key becomes the Solana 111...
      // address.
      if (P.utils.equalBytes(r.bytes(inner.size!, true), ZEROS)) {
        r.bytes(inner.size!);
        return;
      }
      return inner.decodeStream(r);
    },
  }) as P.CoderType<T | undefined>;
}

function remainder<T>(inner: P.CoderType<T>): P.CoderType<T | undefined> {
  return P.wrap({
    // `undefined` is EOF, so non-empty fixed-size items still produce variable-size option bytes.
    size: inner.size === 0 ? 0 : undefined,
    encodeStream(w, value: T | undefined) {
      // EOF is reserved as the undefined sentinel, so present values must not encode to an empty
      // tail.
      if (value !== undefined) {
        const bytes = inner.encode(value);
        if (!bytes.length)
          throw new Error('remainder: encoded value collides with undefined sentinel');
        w.bytes(bytes);
      }
    },
    decodeStream(r) {
      if (r.isEnd()) return undefined;
      return inner.decodeStream(r);
    },
  }) as P.CoderType<T | undefined>;
}

function prefix<T>(inner: P.CoderType<T>, prefix: TArg<Uint8Array>): P.CoderType<T> {
  return P.wrap({
    // Hidden prefix bytes are value-hidden, not byte-hidden, so fixed-size metadata must include
    // them.
    size: inner.size === undefined ? undefined : prefix.length + inner.size,
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

function postfix<T>(inner: P.CoderType<T>, postfix: TArg<Uint8Array>): P.CoderType<T> {
  return P.wrap({
    // Hidden suffix bytes are value-hidden, not byte-hidden, so fixed-size metadata must include
    // them.
    size: inner.size === undefined ? undefined : inner.size + postfix.length,
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

const EMPTY = /* @__PURE__ */ (() => P.magic(P.bytes(0), new Uint8Array(0)))();

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
      // Presence is only undefined; falsy payloads like 0/false/0n are valid option values.
      const present = value !== undefined;
      flag.encodeStream(w, present);
      if (present) inner.encodeStream(w, value);
      else w.bytes(new Uint8Array(inner.size!));
    },
    decodeStream: (r): T | undefined => {
      const present = flag.decodeStream(r);
      if (typeof present !== 'boolean')
        throw new Error(`fixedOptional: expected boolean flag, got ${typeof present}`);
      if (present) return inner.decodeStream(r);
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
// Defaults to another account.
type AccountValue = Node<'accountValueNode', { readonly name: string }>;
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
>(value: T, _pdas: TArg<PDAs<PT, DT>>, _dt: DT) {
  // Everything is bigint, except things that used as counters (array length/etc)
  if (value.kind === 'numberValueNode') return value.number;
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
// These defaults depend on runtime account resolution, so parseValue() cannot synthesize them from
// static IDL data.
const IGNORE_DEFAULT = [
  'payerValueNode',
  'accountBumpValueNode',
  'identityValueNode',
  'pdaValueNode',
] as const;
function parseValue<T extends BasicType, PT extends ArrLike<PDAType>, DT extends DefinedTypes>(
  node: T,
  val: any,
  pdas: TArg<PDAs<PT, DT>>,
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
// prettier-ignore
const NumCoders = {
  shortU16: { le: shortU16, be: shortU16, bigint: false }, // Solana
  u8:       { le: P.U8,     be: P.U8    , bigint: false }, // Unsigned
  u16:      { le: P.U16LE,  be: P.U16BE , bigint: false },
  u32:      { le: P.U32LE,  be: P.U32BE , bigint: false },
  u64:      { le: P.U64LE,  be: P.U64BE , bigint: true  },
  u128:     { le: P.U128LE, be: P.U128BE, bigint: true  },
  i8:       { le: P.I8,     be: P.I8    , bigint: false }, // Signed
  i16:      { le: P.I16LE,  be: P.I16BE , bigint: false },
  i32:      { le: P.I32LE,  be: P.I32BE , bigint: false },
  i64:      { le: P.I64LE,  be: P.I64BE , bigint: true  },
  i128:     { le: P.I128LE, be: P.I128BE, bigint: true  },
  f32:      { le: P.F32LE,  be: P.F32BE , bigint: false }, // Float
  f64:      { le: P.F64LE,  be: P.F64BE , bigint: false },
} as const;

type BigIntCoders = {
  [K in keyof typeof NumCoders]: (typeof NumCoders)[K]['bigint'] extends true ? K : never;
}[keyof typeof NumCoders];

type NumericType = Node<
  'numberTypeNode',
  {
    readonly format: 'shortU16' | keyof typeof NumCoders;
    readonly endian?: 'le' | 'be';
  }
> &
  DefaultValueDef<'number'>;

type GetTypeNumeric<T extends NumericType> = T['format'] extends BigIntCoders ? bigint : number;

// As bigint
function parseNumeric(type: NumericType) {
  if (type.kind !== 'numberTypeNode') throw new Error('wrong numberTypeNode');
  const endian = type.endian || 'le';
  if (endian !== 'le' && endian !== 'be') throw new Error('numberTypeNode: wrong endian');
  let format = NumCoders[type.format][endian];
  if (!format) throw new Error('wrong numeric type');
  // Allow writing number to bigint coders
  const isBigint = NumCoders[type.format].bigint;
  if (isBigint) {
    return P.apply(format as P.CoderType<bigint>, {
      encode: (from) => from,
      decode(to) {
        if (typeof to !== 'bigint' && Number.isSafeInteger(to)) return BigInt(to);
        return to;
      },
    }) as P.CoderType<bigint | number>;
  }
  return format;
}
// As number (for counts). TODO: merge with parseNumeric
function parseNumericSafe(type: NumericType): P.CoderType<number> {
  const t = parseNumeric(type);
  const isBigint = NumCoders[type.format].bigint;
  // On read replace bigints with numbers
  if (isBigint) {
    return P.apply(t as P.CoderType<bigint | number>, {
      encode(from) {
        if (from > BigInt(Number.MAX_SAFE_INTEGER))
          throw new Error(`element bigger than MAX_SAFE_INTEGER=${from}`);
        return Number(from);
      },
      decode: (to) => to,
    }) as P.CoderType<number>;
  }
  return t as P.CoderType<number>;
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
  T extends NumericType ? GetTypeNumeric<T> :
  T extends BooleanType ? boolean :
  T extends StringType ? string :
  T extends AmountType ? string :
  T extends BytesType ? Uint8Array :
  T extends PublicKeyType ? string :
  // Structs
  T extends ArrayType ? (GetType<T['item'], DT>)[] :
  // Map nodes use object-record values in Codama dynamic clients and in the dict() runtime path
  // here.
  T extends MapType ? Record<string, GetType<T['value'], DT>> :
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

/** Maps an IDL type node into the corresponding TypeScript type. */
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
  bytesTypeNode: (_type: BytesType) =>
    P.apply(P.bytes(null), {
      encode(from) {
        // P.bytes(null) can decode a view into caller-owned bytes; IDL byte fields must own their
        // data. Buffer.slice() aliases memory, so force a fresh Uint8Array copy.
        return Uint8Array.from(from);
      },
      decode: (to) => to,
    }),
  // Strip zero bytes from string: ugly, but required for compatibility with solana utf8 coder
  stringTypeNode: (_type: StringType) =>
    P.validate(P.string(null), (s) => s.replace(/\u0000/g, '')),
  amountTypeNode: (type: AmountType) => {
    let x = parseNumeric(type.number) as any;
    if (!NumCoders[type.number.format].bigint) x = P.apply(x, fromBigint);
    // fromBigint
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
      // Zero-byte items are fixed-size too; the presence flag still distinguishes Some from None.
      if (inner.size === undefined) throw new Error('optional fixed=true with unsized element');
      return fixedOptional(P.apply(prefix, numBool), inner);
    }
    return P.optional(P.apply(prefix, numBool), inner);
  },
  // Structure
  arrayTypeNode: (type: ArrayType, dt: DefinedTypes = {}) =>
    P.array(parseCount(type.count), (mapType as any)(type.item, dt)),
  enumVariant: (type: EnumVariants, dt: DefinedTypes = {}) => {
    if (type.kind === 'enumStructVariantTypeNode') return (mapType as any)(type.struct, dt);
    if (type.kind === 'enumTupleVariantTypeNode') return (mapType as any)(type.tuple, dt);
    if (type.kind === 'enumEmptyVariantTypeNode') return EMPTY;
    throw new Error('unknown enum variant');
  },
  enumTypeNode: (type: EnumType, dt: DefinedTypes = {}) => {
    const variants = Object.fromEntries(
      type.variants.map((i, j) => [
        i.name,
        // Discriminator 0 is explicit; only an absent discriminator falls back to the variant
        // index.
        [i.discriminator === undefined ? j : i.discriminator, types.enumVariant(i, dt)],
      ])
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
  ): TRet<P.CoderType<GetTypeStruct<T, DT>>> =>
    // Preserve IDL field order; plain objects reorder numeric-like names before P.struct can see
    // them.
    orderedStruct(
      type.fields.map((i) => {
        if (i.kind !== 'structFieldTypeNode') throw new Error('wrong structFieldTypeNode');
        return [i.name, (mapType as any)(i, dt)] as const;
      })
    ) as any,
  tupleTypeNode: (type: TupleType, dt: DefinedTypes = {}) =>
    P.tuple(type.items.map((i) => (mapType as any)(i, dt))),
  definedTypeLinkNode: (type: DefinedType, dt: DefinedTypes = {}) => {
    // Resolve links lazily so forward and recursive defined-type references can populate `dt`
    // later.
    return P.lazy(() => {
      if (!dt[type.name]) throw new Error('unknown type: ' + type.name);
      return dt[type.name];
    });
  },
  zeroableOptionTypeNode: <T extends ZeroableType>(type: T, dt: DefinedTypes = {}) =>
    zeroable((mapType as any)(type.item, dt)),
  remainderOptionTypeNode: <T extends RemainderOptionType>(type: T, dt: DefinedTypes = {}) =>
    remainder((mapType as any)(type.item, dt)),
  constantValueNode: <T extends ConstantType>(type: T, dt: DefinedTypes = {}) =>
    // Constant IDL nodes are static markers: they validate the fixed bytes and never expose the
    // constant to callers.
    P.magic((mapType as any)(type.type, dt), parseValueInt(type.value, {}, dt)),
  hiddenPrefixTypeNode: <T extends HiddenPrefixType>(type: T, dt: DefinedTypes = {}) => {
    return prefix(
      (mapType as any)(type.type, dt),
      // Hidden prefix items are encoded eagerly, so each prefix node must have a fixed value
      // without caller input.
      concatBytes(...type.prefix.map((i) => (mapType as any)(i, dt).encode()))
    );
  },
  hiddenSuffixTypeNode: <T extends HiddenSuffixType>(type: T, dt: DefinedTypes = {}) =>
    postfix(
      (mapType as any)(type.type, dt),
      // Hidden suffix items are encoded eagerly, so each suffix node must have a fixed value
      // without caller input.
      concatBytes(...type.suffix.map((i) => (mapType as any)(i, dt).encode()))
    ),
  preOffsetTypeNode: <T extends PreOffsetType>(type: T, dt: DefinedTypes = {}) => {
    if (type.strategy === 'padded')
      return prefix((mapType as any)(type.type, dt), new Uint8Array(type.offset));
    // Only the padded strategy is wired today; absolute/relative offsets still throw until
    // micro-packed grows pointer-style support.
    // TODO: this includes very complex pointer-like manipulation that I'm not sure how to implement
    // yet.
    throw new Error('not implemented');
  },
  postOffsetTypeNode: <T extends PreOffsetType>(type: T, dt: DefinedTypes = {}) => {
    if (type.strategy === 'padded')
      return postfix((mapType as any)(type.type, dt), new Uint8Array(type.offset));
    // Only the padded strategy is wired today; absolute/relative offsets still throw until
    // micro-packed grows pointer-style support.
    throw new Error('not implemented');
  },
};

function mapTypeInternal(type: BasicType, definedTypes: DefinedTypes = {}): any {
  const t = (types as any)[type.kind];
  if (t === undefined) throw new Error('Unknown type: ' + type.kind);
  return t(type, definedTypes);
}

const RESERVED_FIELD_NAMES = new Set(['__proto__', 'constructor', 'prototype']);
const orderedStruct = (fields: readonly (readonly [string, P.CoderType<any>])[]) => {
  const seen = new Set<string>();
  let size: number | undefined = 0;
  for (const [name, coder] of fields) {
    if (typeof name !== 'string')
      throw new Error(`struct: field should be string, got ${typeof name}`);
    if (seen.has(name)) throw new Error(`duplicate struct field name: ${name}`);
    seen.add(name);
    if (name.includes('..'))
      throw new TypeError(`struct: field ${name} cannot contain path parent ..`);
    if (name.includes('/'))
      throw new TypeError(`struct: field ${name} cannot contain path separator /`);
    if (RESERVED_FIELD_NAMES.has(name)) throw new Error(`struct: field ${name} is reserved`);
    if (!P.isCoder(coder)) throw new TypeError(`struct: field ${name} is not CoderType`);
    if (size !== undefined) {
      if (coder.size === undefined) size = undefined;
      else if (!Number.isSafeInteger(coder.size))
        throw new Error(`sizeof: wrong element size=${coder.size}`);
      else size += coder.size;
    }
  }
  return P.wrap({
    size,
    encodeStream(w: P.Writer, value: Record<string, any>) {
      (w as any).pushObj(value, (field: (name: string, fn: () => void) => void) => {
        for (const [name, coder] of fields) field(name, () => coder.encodeStream(w, value[name]));
      });
    },
    decodeStream(r: P.Reader) {
      const res: Record<string, any> = {};
      (r as any).pushObj(res, (field: (name: string, fn: () => void) => void) => {
        for (const [name, coder] of fields) field(name, () => (res[name] = coder.decodeStream(r)));
      });
      return res;
    },
    validate(value: Record<string, any>) {
      if (typeof value !== 'object' || value === null)
        throw new Error(`struct: invalid value ${value}`);
      return value;
    },
  });
};

/**
 * Maps an IDL type node into a `micro-packed` coder.
 * @param type - IDL type node to map.
 * @param dt - Already-defined linked types.
 * @returns Coder for the requested type node.
 * @throws If the IDL type node, linked types, or default-value strategy is invalid. {@link Error}
 * @example
 * Build a coder directly from an IDL type node before wiring it into an instruction or account.
 * ```ts
 * import { mapType } from 'micro-sol-signer/idl.js';
 * const u8 = mapType({ kind: 'numberTypeNode', format: 'u8', endian: 'le' }, {});
 * u8.encode(7);
 * ```
 */
export function mapType<T extends BasicType, DT extends DefinedTypes>(
  type: T,
  dt: DT
): TRet<CoderType<GetType<T, DT>>> {
  // Public callers use the returned coder directly; exposing only the decoded value type breaks
  // `.encode()` / `.decode()`.
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
  return t as any;
}

type DefinedType = {
  readonly kind: 'definedTypeNode';
  readonly name: string;
  readonly type: BasicType;
};

/** Produces the typed coder map for `definedTypes`. */
export type GetDefinedTypes<T extends ArrLike<DefinedType>> = {
  [K in T[number]['name']]: CoderType<GetType<Extract<T[number], { name: K }>['type']>>;
};
function parseDefinedTypes<T extends ArrLike<DefinedType>>(types: T) {
  const res: Record<string, any> = {};
  const seen = new Set<string>();
  // Reuse one mutable map so forward and recursive definedTypeLinkNode coders all resolve against
  // the same object.
  // Disable recursive stuff here
  for (const t of types) {
    // Duplicate type names resolve first-vs-last differently across Codama consumers, so reject the
    // ambiguous IDL.
    if (seen.has(t.name)) throw new Error('duplicate defined type name: ' + t.name);
    seen.add(t.name);
    res[t.name] = (mapType as any)(t.type, res);
  }
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

/**
 * Builds PDA helper functions from IDL PDA definitions.
 * @param program - Program address in base58 form.
 * @param pda - PDA definitions from the IDL.
 * @param dt - Defined type coders used by PDA seeds.
 * @returns PDA helper map keyed by PDA name.
 * @throws If the PDA definitions or linked seed types are malformed. {@link Error}
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Generate typed PDA helpers and call one with its seed object.
 * ```ts
 * import { parsePDAs } from 'micro-sol-signer/idl.js';
 * const pdas = parsePDAs('11111111111111111111111111111111', [
 *   {
 *     kind: 'pdaNode',
 *     name: 'vault',
 *     seeds: [
 *       {
 *         kind: 'variablePdaSeedNode',
 *         name: 'owner',
 *         type: { kind: 'publicKeyTypeNode' },
 *       },
 *     ],
 *   },
 * ]);
 * const vault = pdas.vault({ owner: '11111111111111111111111111111111' });
 * ```
 */
export function parsePDAs<T extends ArrLike<PDAType>, DT extends DefinedTypes = {}>(
  program: string,
  pda: T,
  dt: DT = {} as DT
): TRet<PDAs<T, DT>> {
  const res: Record<string, any> = {};
  const seen = new Set<string>();
  for (const p of pda) {
    // Codama rejects duplicate PDA additions; accepting them here would silently replace helpers.
    if (seen.has(p.name)) throw new Error('duplicate PDA name: ' + p.name);
    seen.add(p.name);
    const fields = p.seeds.map((seed) => {
      if (seed.kind === 'variablePdaSeedNode')
        return [seed.name, (mapType as any)(seed.type, dt)] as const;
      if (seed.kind === 'constantPdaSeedNode') {
        // TODO: check
        return [
          seed.name,
          P.magic((mapType as any)(seed.type, dt), parseValueInt(seed.value, res, dt)),
        ] as const;
      }
      throw new Error('unknown seed type');
    });
    // PDA derivation is byte-order sensitive; keep declared seed order even for numeric-like names.
    const coder = orderedStruct(fields);
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

/** Maps instruction argument nodes into their TypeScript object shape. */
export type GetTypeArguments<T extends ArrLike<Argument>, DT extends DefinedTypes = {}> = {
  [K in Extract<T[number], { name: string }>['name']]: GetArgumentType<
    Extract<T[number], { name: K }>,
    DT
  >;
};

function parseArguments<T extends ArrLike<Argument>, DT extends DefinedTypes>(
  args: T,
  types: DT
): TRet<CoderType<GetTypeArguments<T, DT>>> {
  const fields = [];
  const seen = new Set<string>();
  for (const a of args) {
    if (a.kind !== 'instructionArgumentNode') throw new Error('instructionArgumentNode');
    // Codama validators reject conflicting argument names; accepting them here would silently
    // replace coders.
    if (seen.has(a.name)) throw new Error('duplicate argument name: ' + a.name);
    seen.add(a.name);
    const type = (mapType as any)(
      { ...a.type, defaultValue: a.defaultValue, defaultValueStrategy: a.defaultValueStrategy },
      types
    );
    fields.push([a.name, type] as const);
  }
  // Instruction data is byte-order sensitive; keep declared argument order even for numeric-like
  // names.
  return orderedStruct(fields) as any;
}

function getFieldBytes(node: any, field: string, types: DefinedTypes) {
  // Field discriminators derive their bytes from encode(undefined), so the referenced field must
  // have a deterministic default or constant encoding.
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

// Boolean account data can decode to false, so candidate misses need a sentinel that cannot collide
// with payloads.
const DECODER_MISS = Symbol('decoder miss');
function decodeDiscriminators(
  discriminators: ArrLike<Discriminator>,
  coder: any,
  node: any,
  types: DefinedTypes
) {
  return (data: TArg<Uint8Array>, opts?: P.ReaderOpts) => {
    // This is slower and worse than previous version via tag, but significantly more flexible
    for (const d of discriminators) {
      if (d.kind === 'sizeDiscriminatorNode' && data.length !== d.size) return DECODER_MISS;
      if (d.kind === 'constantDiscriminatorNode') {
        // Constant discriminators are part of the public IDL surface, but this decoder path still
        // does not support them.
        throw new Error('constantDiscriminatorNode not implemented');
      }
      if (d.kind === 'fieldDiscriminatorNode') {
        const bytes = getFieldBytes(node, d.name, types);
        const realBytes = data.subarray(d.offset, d.offset + bytes.length);
        if (!P.utils.equalBytes(bytes, realBytes)) return DECODER_MISS;
      }
    }
    return coder.decode(data, opts);
  };
}

function buildDecoder<
  T extends Record<string, (data: TArg<Uint8Array>, opts?: P.ReaderOpts) => any>,
>(decoders: T) {
  // TODO: P.match?
  return (data: TArg<Uint8Array>, opts?: P.ReaderOpts) => {
    for (const [name, decoder] of Object.entries(decoders)) {
      const value = decoder(data, opts);
      if (value !== DECODER_MISS) return { TAG: name, data: value };
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

// Static public-key defaults and accountValueNode references are auto-resolved when omitted.
type AutoResolvableAccountDefault = { kind: 'publicKeyValueNode' } | { kind: 'accountValueNode' };
/** Maps instruction account definitions into the required account input shape. */
export type GetTypeAccounts<T extends ArrLike<Account>> = {
  [K in Extract<T[number], { name: string }>['name']]: Extract<T[number], { name: K }> extends {
    defaultValue: infer Default;
  }
    ? Default extends AutoResolvableAccountDefault
      ? undefined
      : string
    : string; // All other accounts are required
};

/** Turns properties containing `undefined` into optional fields. */
export type Nullable<T> =
  // Pick all non-undefinable keys as required properties
  {
    [K in keyof T as undefined extends T[K] ? never : K]: T[K];
  } & {
    // Pick all undefinable keys as optional properties (without undefined in their type)
    [K in keyof T as undefined extends T[K] ? K : never]?: Exclude<T[K], undefined>;
  };

/** Combines instruction arguments and accounts into one input shape. */
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

/** Encoders and decoder generated for a program's instruction set. */
export type ParsedInstructions<
  T extends ArrLike<ProgramInstruction>,
  DT extends DefinedTypes = {},
> = {
  /** Instruction encoders keyed by instruction name. */
  encoders: {
    [K in T[number]['name']]: (
      inst: TArg<GetInstructionArgs<Extract<T[number], { name: K }>, DT>>
    ) => TRet<Instruction>;
  };
  /**
   * Instruction decoder for the owning program.
   * @param inst - Raw instruction to decode.
   * @param opts - Optional reader settings. See {@link P.ReaderOpts}.
   * @returns Decoded instruction tagged with its instruction name.
   */
  decoder: (inst: TArg<Instruction>, opts?: P.ReaderOpts) => DecodedInstruction<T[number], DT>;
};

function parseInstructions<
  T extends ArrLike<ProgramInstruction>,
  P extends PDAs<any, DT>,
  DT extends DefinedTypes,
>(instructions: T, types: DT, pdas: P, contract: string): TRet<ParsedInstructions<T, DT>> {
  const encoders: Record<string, any> = {};
  const decoders: Record<string, any> = {};
  const instNames: Record<string, ProgramInstruction> = {};
  const seen = new Set<string>();
  const accountString = (name: string, value: any) => {
    if (typeof value !== 'string') throw new Error(`account ${name} must be a string`);
    return value;
  };
  const accountInput = (
    accounts: ArrLike<Account>,
    m: Account,
    values: Record<string, any>,
    stack: string[] = []
  ): any => {
    const value = values[m.name];
    if (value !== undefined) return accountString(m.name, value);
    const d = m.defaultValue;
    if (d && d.kind === 'accountValueNode') {
      if (stack.includes(m.name)) throw new Error('recursive account default: ' + m.name);
      let next: Account | undefined = undefined;
      for (const a of accounts) {
        if (a.name === d.name) {
          next = a;
          break;
        }
      }
      if (next === undefined) throw new Error('unknown account default: ' + d.name);
      return accountInput(accounts, next, values, stack.concat(m.name));
    }
    const def = (parseValue as any)(m, undefined, pdas, types);
    // Missing required accounts otherwise leak as undefined metas and fail later in message
    // construction.
    if (def === undefined) throw new Error('missing account: ' + m.name);
    return accountString(m.name, def);
  };
  for (const i of instructions) {
    if (i.kind !== 'instructionNode') throw new Error('wrong instructionNode');
    // Instruction helpers are keyed by name, so duplicate names would silently replace
    // encoder/decoder metadata.
    if (seen.has(i.name)) throw new Error('duplicate instruction name: ' + i.name);
    seen.add(i.name);
    const accountNames = new Set<string>();
    for (const account of i.accounts) {
      if (accountNames.has(account.name))
        throw new Error('duplicate instruction account name: ' + account.name);
      accountNames.add(account.name);
    }
    const type = (parseArguments as any)(i.arguments, types) as any;
    instNames[i.name] = i;
    encoders[i.name] = (inst: any): TRet<Instruction> => {
      const data = type.encode(inst);
      // Keep sibling account metadata available when resolving accountValueNode defaults.
      const keys = i.accounts.map((account) => ({
        address: accountInput(i.accounts, account, inst) as string,
        // isSigner: 'either' stays signed by default so single-owner token helpers require
        // owner/delegate signatures.
        sign: account.isSigner !== false,
        write: account.isWritable === true,
      }));
      if (i.remainingAccounts) {
        if (i.remainingAccounts.length !== 1)
          throw new Error('only single remainingAccounts supported');
        const r0 = i.remainingAccounts[0];
        if (r0.value.kind !== 'argumentValueNode')
          throw new Error('remainingAccounts: only argumentValueNode supported');
        const name = r0.value.name;
        // Remaining-account encoding is intentionally not implemented yet; callers must build those
        // metas manually.
        if (inst[name]) throw new Error('encode: remainingAccounts not implemented');
      }
      return { program: contract, keys, data };
    };
    decoders[i.name] = decodeDiscriminators(i.discriminators || [], type, i, types);
  }
  const decoderData = buildDecoder(decoders);
  const decoder = (inst: TArg<Instruction>, opts?: P.ReaderOpts) => {
    // Generated decoders are public too; validate roots here, not only in parseInstruction().
    if (!inst || typeof inst !== 'object') throw new Error('instruction must be an object');
    if (typeof inst.program !== 'string') throw new Error('instruction program must be a string');
    if (!Array.isArray(inst.keys)) throw new Error('instruction keys must be an array');
    if (!(inst.data instanceof Uint8Array)) throw new Error('instruction data must be bytes');
    if (inst.program !== contract) throw new Error('wrong program address');
    const data = decoderData(inst.data, opts);
    const instMeta = instNames[data.TAG];
    const accounts = instMeta.accounts;

    // This decoder still expects the fixed declared account prefix only; remaining accounts and
    // omitted optional accounts are not unpacked here yet.
    if (inst.keys.length !== accounts.length) throw new Error('wrong number of accounts');
    // if (instMeta.remainingAccounts) {
    //   throw new Error('decode: remainingAccounts not implemented');
    // }
    const actual: Record<string, string> = {};
    const metas: Instruction['keys'] = [];
    for (let i = 0; i < accounts.length; i++) {
      const m = accounts[i];
      const r = inst.keys[i];
      // parseInstruction accepts caller-built metas, so validate before exposing decoded account
      // values.
      if (!r || typeof r !== 'object') throw new Error('wrong account meta: ' + m.name);
      accountString(m.name, r.address);
      if (typeof r.sign !== 'boolean')
        throw new Error(`account ${m.name} sign flag must be boolean`);
      if (typeof r.write !== 'boolean')
        throw new Error(`account ${m.name} write flag must be boolean`);
      metas.push(r);
      if (m.isSigner === true && !r.sign) throw new Error('wrong sign flag');
      if (m.isWritable === true && !r.write) throw new Error('wrong write flag');
      actual[m.name] = r.address;
    }
    for (let i = 0; i < accounts.length; i++) {
      const m = accounts[i];
      const r = metas[i];
      const d = m.defaultValue;
      let accountDefault;
      if (d && d.kind === 'accountValueNode') {
        // accountValueNode references another runtime account, so it needs the full instruction key
        // list.
        accountDefault = actual[d.name];
        if (accountDefault === undefined) throw new Error('unknown account default: ' + d.name);
      } else {
        accountDefault = (parseValue as any)(m, undefined, pdas, types);
      }
      if (r.address !== accountDefault) data.data[m.name] = r.address;
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

/** Typed account coders and decoder generated from IDL account definitions. */
export type AccountDefinitions<T extends ArrLike<ContractAccount>, DT extends DefinedTypes = {}> = {
  /** Account coders keyed by account name. */
  coders: {
    [K in T[number]['name']]: CoderType<GetType<Extract<T[number], { name: K }>['data'], DT>>;
  };

  /**
   * Decoder that tags decoded data with the matching account name.
   * @param data - Raw account bytes.
   * @param opts - Optional reader settings. See {@link P.ReaderOpts}.
   * @returns Decoded account tagged with the matching account name.
   */
  decoder: (data: TArg<Uint8Array>, opts?: P.ReaderOpts) => TRet<DecodedAccount<T, DT>>;
};

/**
 * Builds account coders and a decoder from IDL account definitions.
 * @param accounts - Account nodes from the IDL.
 * @param types - Defined type coders referenced by the accounts.
 * @returns Typed account coder set and decoder.
 * @throws If an account node or its discriminators are invalid. {@link Error}
 * @example
 * Build account coders once, then reuse them for encode/decode.
 * ```ts
 * import { defineAccounts } from 'micro-sol-signer/idl.js';
 * const accounts = defineAccounts(
 * [{ kind: 'accountNode', name: 'counter', data: { kind: 'numberTypeNode', format: 'u8', endian:
 * 'le' } }],
 *   {}
 * );
 * const data = accounts.coders.counter.encode(7);
 * accounts.decoder(data);
 * ```
 */
export function defineAccounts<T extends ArrLike<ContractAccount>, DT extends DefinedTypes>(
  accounts: T,
  types: DT
): TRet<AccountDefinitions<T, DT>> {
  const coders: Record<string, any> = {};
  const decoders: Record<string, any> = {};
  const seen = new Set<string>();
  for (const a of accounts) {
    if (a.kind !== 'accountNode') throw new Error('wrong accountNode');
    // Account names share these plain-object tables; duplicates would overwrite earlier coders and
    // decoder metadata.
    if (seen.has(a.name)) throw new Error('duplicate account name: ' + a.name);
    seen.add(a.name);
    const type = (mapType as any)(a.data, types);
    // If size not available by coder construction: extract from size discriminator
    if (type.size === undefined) {
      for (const d of a.discriminators || []) {
        if (d.kind !== 'sizeDiscriminatorNode') continue;
        type.size = d.size;
        break;
      }
    }
    coders[a.name] = type;
    decoders[a.name] = decodeDiscriminators(a.discriminators || [], type, a, types);
  }
  const decoderData = buildDecoder(decoders);
  const decoder = (data: TArg<Uint8Array>, opts?: P.ReaderOpts) => {
    // Account decoders are public entrypoints; reject malformed roots before byte-reader setup.
    if (!(data instanceof Uint8Array)) throw new Error('account data must be bytes');
    return decoderData(data, opts);
  };
  return deepFreeze({ coders, decoder }) as any;
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

/**
 * Builds typed helpers for one Solana program node.
 * @param p - Program node from the IDL.
 * @returns Typed program helpers for accounts, instructions, and PDAs.
 * @throws If the program node is malformed or its typed helpers cannot be constructed. {@link
 * Error}
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Build one typed helper bundle for a single program node.
 * ```ts
 * import { defineProgram } from 'micro-sol-signer/idl.js';
 * const program = defineProgram({
 *   kind: 'programNode',
 *   name: 'demo',
 *   publicKey: '11111111111111111111111111111111',
 *   definedTypes: [],
 *   pdas: [],
 *   instructions: [],
 *   accounts: [],
 * });
 * const contract = program.contract;
 * ```
 */
export function defineProgram<P extends Program>(p: P): TRet<GetTypeProgram<P>> {
  if (p.kind !== 'programNode') throw new Error('idl: wrong program node');
  // Child helpers own section-specific validation; defineProgram only wires their results together.
  const types = parseDefinedTypes(p.definedTypes) as any;
  const pdas = parsePDAs(p.publicKey, p.pdas, types);
  const instructions = (parseInstructions as any)(p.instructions, types, pdas, p.publicKey);
  const accounts = defineAccounts(p.accounts, types);
  return deepFreeze({
    name: p.name,
    contract: p.publicKey,
    types,
    accounts,
    instructions,
    pdas,
  }) as any;
}

type IDL = {
  readonly kind: 'rootNode';
  readonly program: Program;
  readonly additionalPrograms: ArrLike<Program>;
};

/** Type-level helper shape produced by `defineIDL(...)` for a root IDL document. */
export type GetTypeIDL<T extends IDL> = {
  [P in T['program']['name']]: {
    program: GetTypeProgram<T['program']>;
    additionalPrograms: {
      [K in T['additionalPrograms'][number]['name']]: GetTypeProgram<
        Extract<T['additionalPrograms'][number], { name: K }>
      >;
    };
  };
};

/**
 * Builds typed helpers for a root IDL and its additional programs.
 * @param idl - Root IDL document.
 * @returns Object keyed by the root program name.
 * @throws If the root IDL contains malformed program definitions. {@link Error}
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Build helpers for the root program and any additional programs declared in the IDL.
 * ```ts
 * import { defineIDL } from 'micro-sol-signer/idl.js';
 * const idl = defineIDL({
 *   kind: 'rootNode',
 *   program: {
 *     kind: 'programNode',
 *     name: 'demo',
 *     publicKey: '11111111111111111111111111111111',
 *     definedTypes: [],
 *     pdas: [],
 *     instructions: [],
 *     accounts: [],
 *   },
 *   additionalPrograms: [],
 * });
 * const contract = idl.demo.program.contract;
 * ```
 */
export function defineIDL<T extends IDL>(idl: T): TRet<GetTypeIDL<T>> {
  if (idl.kind !== 'rootNode') throw new Error('idl: wrong root node');
  // Additional program names share one plain-object table under the main program.
  const res: Record<string, any> = {
    [idl.program.name]: {
      program: defineProgram(idl.program),
      additionalPrograms: {},
    },
  };
  const seen = new Set<string>();
  for (const program of idl.additionalPrograms) {
    if (seen.has(program.name))
      throw new Error('duplicate additional program name: ' + program.name);
    seen.add(program.name);
    res[idl.program.name].additionalPrograms[program.name] = defineProgram(program);
  }
  return deepFreeze(res) as TRet<GetTypeIDL<T>>;
}
