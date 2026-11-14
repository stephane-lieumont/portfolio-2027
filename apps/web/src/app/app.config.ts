import { provideHttpClient, withFetch } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import {
  TitleStrategy,
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';

import { API_BASE_URL } from './core/api.config';
import { MEDIA_BASE_URL } from './core/media.config';
import { PageMetadata } from './core/page-metadata';
import { RouteTransitions } from './core/route-transitions';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      // A new navigation lands at the top, back and forward restore where the
      // visitor was. RouteTransitions moves the jump under the transition.
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
      withViewTransitions({
        skipInitialTransition: true,
        onViewTransitionCreated: (info) => inject(RouteTransitions).onCreated(info),
      }),
    ),
    // Hydration keeps the prerendered DOM instead of rebuilding it at boot, so
    // the images and the entrance already under way are not torn down and
    // replayed when Angular arrives late. Event replay keeps a click made
    // before then.
    provideClientHydration(withEventReplay()),
    { provide: TitleStrategy, useClass: PageMetadata },
    provideHttpClient(withFetch()),
    { provide: API_BASE_URL, useValue: '/api' },
    { provide: MEDIA_BASE_URL, useValue: '/medias' },
  ],
};
