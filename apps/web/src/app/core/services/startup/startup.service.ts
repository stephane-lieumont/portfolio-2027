import { ApplicationRef, DOCUMENT, Injectable, inject } from '@angular/core';

/** Dispatched on the document once the app can take over from the loader. */
export const APP_READY_EVENT = 'app-ready';
/** Dispatched on the document by index.html when the page's entrance may play. */
export const ENTRANCE_RELEASE_EVENT = 'boot-release';

/**
 * Whether index.html's startup loader still holds the page's entrance: while
 * it decides whether to show (`wait`), while it covers the page (`on`) and
 * as its exit starts (`out`), until the band uncovers the hero.
 */
export function entranceHeld(root: Element): boolean {
  const state = root.getAttribute('data-boot');
  return state === 'wait' || state === 'on' || state === 'out';
}

/**
 * The app's side of the startup loader, which lives in index.html so it paints
 * before the bundle: the app says when it is ready, and what plays on script
 * (the point cloud's assembly) waits for the loader to let the entrance go.
 */
@Injectable({ providedIn: 'root' })
export class StartupService {
  private readonly document = inject(DOCUMENT);
  private readonly app = inject(ApplicationRef);

  /** Hydrated and the fonts in: the loader may leave. */
  async announceReady(): Promise<void> {
    await this.app.whenStable();
    await this.document.fonts?.ready;
    this.document.dispatchEvent(new Event(APP_READY_EVENT));
  }

  /** Synchronous when nothing is held, so a page opened by a route change starts at once. */
  afterEntranceRelease(run: () => void): void {
    if (!entranceHeld(this.document.documentElement)) {
      run();
      return;
    }
    this.document.addEventListener(ENTRANCE_RELEASE_EVENT, run, { once: true });
  }
}
