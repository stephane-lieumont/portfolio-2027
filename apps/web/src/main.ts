import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { SiteLayoutComponent } from '@layouts/site-layout/site-layout.component';

bootstrapApplication(SiteLayoutComponent, appConfig).catch((err) => {
  // Nothing will reveal what the page hid: show it as it stands.
  document.documentElement.classList.remove('js-motion');
  console.error(err);
});
