import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { ListProjectsQuery, Project, ProjectSummary } from '@portfolio/shared-types';
import type { Observable } from 'rxjs';

import { API_BASE_URL } from './api.config';

@Injectable({ providedIn: 'root' })
export class ProjectsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(query: ListProjectsQuery = {}): Observable<ProjectSummary[]> {
    return this.http.get<ProjectSummary[]>(`${this.baseUrl}/projects`, { params: { ...query } });
  }

  bySlug(slug: string): Observable<Project> {
    return this.http.get<Project>(`${this.baseUrl}/projects/${slug}`);
  }
}
