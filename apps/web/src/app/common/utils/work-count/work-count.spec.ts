import { describe, expect, it } from 'vitest';

import { workCount, workPeriod } from './work-count';

const released = (...dates: string[]) => dates.map((releasedAt) => ({ releasedAt }));

describe('workCount', () => {
  it('pads the count and spans the years, oldest first', () => {
    expect(workCount(released('2022-08-30', '2021-06-01', '2022-03-15', '2021-11-10'))).toEqual({
      count: '04',
      span: '2021 – 2022',
    });
  });

  it('names a single year once', () => {
    expect(workCount(released('2016-01-01', '2016-05-01'))).toEqual({ count: '02', span: '2016' });
  });

  it('starts where the earliest period starts, not where it ended', () => {
    expect(
      workCount([
        { startedAt: '2020-01-01', releasedAt: '2022-08-30' },
        { releasedAt: '2024-12-01' },
      ]).span,
    ).toBe('2020 – 2024');
  });

  it('runs to today while any work is still going on', () => {
    expect(
      workCount([{ startedAt: '2025-01-01', releasedAt: null }, ...released('2022-03-15')]),
    ).toEqual({ count: '02', span: '2022 – aujourd’hui' });
  });

  it('counts nothing without a span', () => {
    expect(workCount([])).toEqual({ count: '00', span: '' });
  });
});

describe('workPeriod', () => {
  it('is the release year alone without a start', () => {
    expect(workPeriod({ releasedAt: '2024-09-01' })).toBe('2024');
  });

  it('spans from start to release', () => {
    expect(workPeriod({ startedAt: '2023-01-01', releasedAt: '2024-06-01' })).toBe('2023 – 2024');
  });

  it('does not repeat a year the work started and ended in', () => {
    expect(workPeriod({ startedAt: '2024-02-01', releasedAt: '2024-06-01' })).toBe('2024');
  });

  it('runs to today while the work goes on', () => {
    expect(workPeriod({ startedAt: '2025-01-01', releasedAt: null })).toBe('2025 – aujourd’hui');
  });
});
