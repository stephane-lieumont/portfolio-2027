/**
 * The label beside a world's work: how many pieces, and the span of years they
 * cover — « 06 projets · 2015 – 2022 ». Derived from the published records
 * (spec 03), never written by hand.
 */
export function workCount(releasedAt: readonly string[]): { count: string; span: string } {
  const years = releasedAt.map((iso) => Number(iso.slice(0, 4)));
  const first = Math.min(...years);
  const last = Math.max(...years);
  return {
    count: String(years.length).padStart(2, '0'),
    span: years.length === 0 ? '' : first === last ? `${first}` : `${first} – ${last}`,
  };
}
