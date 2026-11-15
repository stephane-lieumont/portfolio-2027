import { provideHttpClient, withFetch } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import {
  provideClientHydration,
  withEventReplay,
  withI18nSupport,
} from '@angular/platform-browser';
import {
  TitleStrategy,
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';

import { API_BASE_URL } from '@core/config/api.config';
import { MEDIA_BASE_URL } from '@core/config/media.config';
import { PageMetadataService } from '@core/services/page-metadata.service';
import { RouteTransitionsService } from '@core/services/route-transitions.service';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      // A new navigation lands at the top, back and forward restore where the
      // visitor was. RouteTransitionsService moves the jump under the transition.
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
      withViewTransitions({
        skipInitialTransition: true,
        onViewTransitionCreated: (info) => inject(RouteTransitionsService).onCreated(info),
      }),
    ),
    // Hydration keeps the prerendered DOM instead of rebuilding it at boot, so
    // the images and the entrance already under way are not torn down and
    // replayed when Angular arrives late. Event replay keeps a click made
    // before then.
    provideClientHydration(withEventReplay(), withI18nSupport()),
    { provide: TitleStrategy, useClass: PageMetadataService },
    provideHttpClient(withFetch()),
    { provide: API_BASE_URL, useValue: '/api' },
    { provide: MEDIA_BASE_URL, useValue: '/medias' },
  ],
};
