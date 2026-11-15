import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';

import { SiteLayoutComponent } from '@layouts/site-layout/site-layout.component';
import { config } from './app/app.config.server';

const bootstrap = (context: BootstrapContext) =>
  bootstrapApplication(SiteLayoutComponent, config, context);

export default bootstrap;
