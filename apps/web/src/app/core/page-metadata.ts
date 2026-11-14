import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, RouterStateSnapshot, TitleStrategy } from '@angular/router';

export const SITE_NAME = 'Stéphane Lieumont';
export const SITE_TITLE = `${SITE_NAME} — Lead Tech & graphiste 3D`;

/**
 * Writes each page's `<title>`, description and robots directive from its
 * route: `title` for the title, `data.description` and `data.noindex` for the
 * rest. Running as the router's title strategy means it runs during
 * prerendering too, so the metadata is in the delivered HTML (ADR-0008).
 */
@Injectable({ providedIn: 'root' })
export class PageMetadata extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const page = this.buildTitle(snapshot);
    this.title.setTitle(page ? `${page} — ${SITE_NAME}` : SITE_TITLE);

    const route = deepest(snapshot.root);
    const description: unknown = route.data['description'];
    if (typeof description === 'string') {
      this.meta.updateTag({ name: 'description', content: description });
    } else {
      this.meta.removeTag('name="description"');
    }

    if (route.data['noindex'] === true) {
      this.meta.updateTag({ name: 'robots', content: 'noindex' });
    } else {
      this.meta.removeTag('name="robots"');
    }
  }
}

function deepest(route: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
  return route.firstChild ? deepest(route.firstChild) : route;
}
