/**
 * Convenience helper for creating { key, value } objects.
 *
 * @param key
 * @param value
 * @returns
 */
export function toItem<T = string>(key: string, value: T) {
  return { key, value };
}
