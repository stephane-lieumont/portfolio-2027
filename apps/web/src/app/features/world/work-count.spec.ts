import { describe, expect, it } from 'vitest';

import { workCount } from './work-count';

describe('workCount', () => {
  it('pads the count and spans the years, oldest first', () => {
    expect(workCount(['2022-08-30', '2021-06-01', '2022-03-15', '2021-11-10'])).toEqual({
      count: '04',
      span: '2021 – 2022',
    });
  });

  it('names a single year once', () => {
    expect(workCount(['2016-01-01', '2016-05-01'])).toEqual({ count: '02', span: '2016' });
  });
});
