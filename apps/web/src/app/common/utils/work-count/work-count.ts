/** A piece of work in time: released, or still going on when `releasedAt` is null. */
export interface WorkDates {
  readonly startedAt?: string;
  readonly releasedAt: string | null;
}

const year = (iso: string): number => Number(iso.slice(0, 4));

const today = (): string => $localize`:@@work.today:aujourd’hui`;

function span(first: number, last: number | null): string {
  if (last === null) return `${first} – ${today()}`;
  return first === last ? `${first}` : `${first} – ${last}`;
}

/** One piece's years: « 2024 », « 2023 – 2024 », « 2025 – aujourd’hui ». */
export function workPeriod({ startedAt, releasedAt }: WorkDates): string {
  const end = releasedAt === null ? null : year(releasedAt);
  const start = startedAt ? year(startedAt) : end;
  // Work still going on always names its start (content.spec.ts).
  return start === null ? today() : span(start, end);
}

/**
 * The label beside a world's work: how many pieces, and the span of years they
 * cover — « 07 projets · 2020 – aujourd’hui ». Derived from the published
 * records (spec 03), never written by hand.
 */
export function workCount(works: readonly WorkDates[]): { count: string; span: string } {
  const count = String(works.length).padStart(2, '0');
  if (works.length === 0) return { count, span: '' };
  const starts = works.map((w) => year(w.startedAt ?? w.releasedAt ?? ''));
  const ongoing = works.some((w) => w.releasedAt === null);
  const last = ongoing ? null : Math.max(...works.map((w) => year(w.releasedAt ?? '')));
  return { count, span: span(Math.min(...starts), last) };
}
