import { InjectionToken } from '@angular/core';

/** API base path. In production, nginx proxies /api to the Fastify container. */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');
