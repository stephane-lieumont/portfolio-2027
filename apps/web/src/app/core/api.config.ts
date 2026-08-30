import { InjectionToken } from '@angular/core';

/** Base des appels API. En prod, nginx proxifie /api vers le conteneur Fastify. */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');
