/**
 * YouTube addresses, parsed by the `Project` schema so « Voir la vidéo » always
 * leads to one video (ADR-0016 and its 2026-11-15 note). Free of Zod, like the registries, so the
 * browser can import it without pulling the validator into its bundle.
 */

// Written as patterns rather than with URL: this package carries no DOM or
// Node typings, and the forms accepted are few.
const ID = '([A-Za-z0-9_-]{11})';
const TAIL = '(?:[?&#][^\\s]*)?';
const ADDRESSES = [
  new RegExp(
    `^https://(?:www\\.|m\\.)?youtube\\.com/watch\\?(?:[^#\\s]*&)?v=${ID}(?:[&#][^\\s]*)?$`,
  ),
  new RegExp(`^https://(?:www\\.)?youtube\\.com/(?:embed|shorts|live)/${ID}${TAIL}$`),
  new RegExp(`^https://youtu\\.be/${ID}${TAIL}$`),
];

/**
 * The video's id, from an `https` watch, short or embed address; null for
 * anything else, including a playlist or a channel, which is not one video.
 */
export function youtubeVideoId(address: string): string | null {
  for (const pattern of ADDRESSES) {
    const match = pattern.exec(address.trim());
    if (match) return match[1];
  }
  return null;
}
