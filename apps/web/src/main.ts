import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { APP_READY_EVENT, StartupService } from '@core/services/startup/startup.service';
import { SiteLayoutComponent } from '@layouts/site-layout/site-layout.component';

bootstrapApplication(SiteLayoutComponent, appConfig)
  .then((app) => app.injector.get(StartupService).announceReady())
  .catch((err) => {
    // Nothing will reveal what the page hid: show it as it stands.
    document.documentElement.classList.remove('js-motion');
    document.dispatchEvent(new Event(APP_READY_EVENT));
    console.error(err);
  });
