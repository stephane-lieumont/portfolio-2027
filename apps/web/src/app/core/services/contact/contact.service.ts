import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { ContactRequest } from '@portfolio/shared-types';
import { type Observable, map } from 'rxjs';

import { API_BASE_URL } from '@core/config/api.config';

/**
 * - `unavailable`: nothing answers at the route yet — no network, no API, or an
 *   API without the contact route. The visitor should take another way in.
 * - `captcha`: the API did not accept the anti-spam check (ADR-0020).
 * - `rejected`: the API answered and refused or failed. Worth retrying.
 */
export type ContactFailure = 'unavailable' | 'captcha' | 'rejected';

// 0 is a network failure; 404 and 405 are what nginx and the API answer before
// the route exists; 501 is an API that declares it not implemented.
const UNAVAILABLE = new Set([0, 404, 405, 501]);

export function contactFailureOf(error: unknown): ContactFailure {
  if (!(error instanceof HttpErrorResponse) || UNAVAILABLE.has(error.status)) return 'unavailable';
  return error.status === 403 ? 'captcha' : 'rejected';
}

/** The message goes to the API, which relays it; never from the browser (ADR-0007). */
@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  send(request: ContactRequest): Observable<void> {
    return this.http.post(`${this.baseUrl}/contact`, request).pipe(map(() => undefined));
  }
}
