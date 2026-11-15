const VARIANT = /-\d+\.webp$/i;
const EXTENSION = /\.[a-z0-9]+$/i;

const stemOf = (key: string): string => key.replace(VARIANT, '').replace(EXTENSION, '');

/**
 * The bucket objects no media record uses: an original no record names, and
 * every WebP variant of it (`-640.webp`…), which media:derive names after its
 * source's stem.
 */
export function orphanKeys(bucketKeys: readonly string[], usedKeys: readonly string[]): string[] {
  const usedStems = new Set(usedKeys.map(stemOf));
  return bucketKeys.filter((key) => !usedStems.has(stemOf(key))).sort();
}
