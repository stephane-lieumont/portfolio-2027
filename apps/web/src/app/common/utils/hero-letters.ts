export interface Glyph {
  readonly char: string;
  /** Position among the visible letters, for the stagger. */
  readonly index: number;
}

/** The name as words of letters, indexed across the whole name. */
export function nameWords(name: string): Glyph[][] {
  let index = 0;
  return name.split(' ').map((word) => [...word].map((char) => ({ char, index: index++ })));
}

/** Letters before the role flips in: the name's rise, ending at 260 + n × 38 ms, then 220 ms. */
export function introBase(name: string): number {
  return 260 + name.replace(/\s/g, '').length * 38 + 220;
}
