import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';

import { contactFailureOf } from './contact.api';

const answer = (status: number) => new HttpErrorResponse({ status });

describe('contactFailureOf', () => {
  // Until the API serves the route, the visitor must be sent elsewhere rather
  // than invited to retry something that cannot succeed.
  it.each([0, 404, 405, 501])('reads %i as not available yet', (status) => {
    expect(contactFailureOf(answer(status))).toBe('unavailable');
  });

  it.each([400, 413, 429, 500, 502, 503])('reads %i as a failure worth retrying', (status) => {
    expect(contactFailureOf(answer(status))).toBe('rejected');
  });

  it('reads anything that is not an HTTP answer as not available', () => {
    expect(contactFailureOf(new TypeError('Failed to fetch'))).toBe('unavailable');
  });
});
