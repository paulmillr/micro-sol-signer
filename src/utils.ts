import { validateObject as vld } from '@noble/curves/utils.js';

export function aarray<T>(
  item: unknown,
  title: string,
  inner: (elm: T, title: string) => void = () => {}
): T[] {
  if (!Array.isArray(item))
    throw new TypeError(`"${title}" expected array, got type=${typeof item}`);
  for (let i = 0; i < item.length; i++) inner(item[i], `${title}[${i}]`);
  return item;
}
/**
 * Asserts something is a string.
 * @param value - Value to validate.
 * @param title - Label included in thrown errors.
 * @returns The validated string.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Validate a label string.
 *
 * ```ts
 * astring('example', 'label');
 * ```
 */
export function astring(value: unknown, title: string = ''): string {
  if (typeof value !== 'string') {
    const prefix = title && `"${title}" `;
    throw new TypeError(prefix + 'expected string, got type=' + typeof value);
  }
  return value;
}
export function validateObject(
  object: Record<string, any>,
  fields: Record<string, string> = {},
  optFields: Record<string, string> = {},
  _title = 'object'
) {
  return vld(object, fields, optFields);
}
