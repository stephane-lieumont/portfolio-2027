import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { API_BASE_URL } from './api.config';
import { ProjectsApi } from './projects.api';

describe('ProjectsApi', () => {
  let api: ProjectsApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });
    api = TestBed.inject(ProjectsApi);
    http = TestBed.inject(HttpTestingController);
  });

  it('reads the list from the configured base', () => {
    api.list().subscribe();

    // The base is injected, never hard-coded: nginx proxies /api to the
    // Fastify container in production and the path differs in development.
    const request = http.expectOne((r) => r.url === '/api/projects');
    expect(request.request.method).toBe('GET');
    request.flush([]);
    http.verify();
  });

  it('passes a filter through as query parameters', () => {
    api.list({ kind: 'cgi', status: 'published' }).subscribe();

    const request = http.expectOne((r) => r.url === '/api/projects');
    expect(request.request.params.get('kind')).toBe('cgi');
    expect(request.request.params.get('status')).toBe('published');
    request.flush([]);
    http.verify();
  });

  it('sends no parameters when no filter is given', () => {
    api.list().subscribe();

    const request = http.expectOne((r) => r.url === '/api/projects');
    expect(request.request.params.keys()).toEqual([]);
    request.flush([]);
    http.verify();
  });

  it('reads one project by slug', () => {
    api.bySlug('kasa-openclassrooms').subscribe();

    const request = http.expectOne('/api/projects/kasa-openclassrooms');
    expect(request.request.method).toBe('GET');
    request.flush({});
    http.verify();
  });
});
