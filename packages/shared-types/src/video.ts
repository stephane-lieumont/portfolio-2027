/**
 * YouTube addresses, parsed the same way by the API's validation and by the
 * page that embeds them (ADR-0016). Free of Zod, like the registries, so the
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
 * anything else, including a playlist or a channel, which cannot be embedded
 * as one video.
 */
export function youtubeVideoId(address: string): string | null {
  for (const pattern of ADDRESSES) {
    const match = pattern.exec(address.trim());
    if (match) return match[1];
  }
  return null;
}

/**
 * The privacy-enhanced player, started by the click that asked for it. Nothing
 * from YouTube loads before that click: the page shows its own poster.
 */
export function youtubeEmbedUrl(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
}
