/**
 * Asserts that a value is an Error object.
 * Useful for narrowing 'unknown' in catch blocks.
 */
export function ensureError(value: unknown): Error {
  if (value instanceof Error) return value;
  return new Error(String(value));
}
