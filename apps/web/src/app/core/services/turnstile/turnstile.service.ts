import { DOCUMENT, Injectable, inject } from '@angular/core';

import { TURNSTILE_SITE_KEY } from '@core/config/turnstile.config';
import { SITE_LOCALE } from '@core/i18n/site-locale/site-locale';

/** The part of Cloudflare's `window.turnstile` this site uses. */
export interface TurnstileApi {
  render(container: HTMLElement, options: TurnstileOptions): string | null | undefined;
  execute(widgetId: string): void;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
}

export interface TurnstileOptions {
  sitekey: string;
  action: string;
  language: string;
  appearance: 'interaction-only';
  execution: 'execute';
  retry: 'never';
  callback: (token: string) => void;
  'error-callback': () => void;
  'timeout-callback': () => void;
  'unsupported-callback': () => void;
  'before-interactive-callback': () => void;
  'after-interactive-callback': () => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export const TURNSTILE_SCRIPT_URL =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

export interface CaptchaWidget {
  /**
   * A fresh single-use token. The check runs unseen; Cloudflare shows the
   * widget only when it wants the visitor to act.
   */
  token(): Promise<string>;
  remove(): void;
}

/**
 * Loads Turnstile on demand, so its script reaches the contact page only and
 * never the prerendered pages (ADR-0020).
 */
@Injectable({ providedIn: 'root' })
export class TurnstileService {
  private readonly document = inject(DOCUMENT);
  private readonly siteKey = inject(TURNSTILE_SITE_KEY);
  private api: Promise<TurnstileApi> | null = null;

  /** `onChallenge` says when Cloudflare shows the widget and when it hides it again. */
  async mount(
    container: HTMLElement,
    onChallenge: (shown: boolean) => void,
  ): Promise<CaptchaWidget> {
    const api = await this.load();

    let pending: { resolve: (token: string) => void; reject: (error: Error) => void } | null = null;
    const fail = (reason: string) => () => {
      pending?.reject(new Error(`Turnstile: ${reason}`));
      pending = null;
    };

    const widgetId = api.render(container, {
      sitekey: this.siteKey,
      action: 'contact',
      language: SITE_LOCALE,
      appearance: 'interaction-only',
      execution: 'execute',
      retry: 'never',
      callback: (token) => {
        pending?.resolve(token);
        pending = null;
      },
      'error-callback': fail('error'),
      'timeout-callback': fail('timeout'),
      'unsupported-callback': fail('unsupported browser'),
      'before-interactive-callback': () => onChallenge(true),
      'after-interactive-callback': () => onChallenge(false),
    });
    if (!widgetId) throw new Error('Turnstile: the widget did not render');

    let used = false;
    return {
      token: () =>
        new Promise<string>((resolve, reject) => {
          pending = { resolve, reject };
          if (used) api.reset(widgetId);
          used = true;
          api.execute(widgetId);
        }),
      remove: () => api.remove(widgetId),
    };
  }

  private load(): Promise<TurnstileApi> {
    this.api ??= new Promise<TurnstileApi>((resolve, reject) => {
      const script = this.document.createElement('script');
      script.src = TURNSTILE_SCRIPT_URL;
      script.onload = () => {
        const api = this.document.defaultView?.turnstile;
        if (api) resolve(api);
        else reject(new Error('Turnstile: the script did not define its API'));
      };
      script.onerror = () => {
        script.remove();
        this.api = null;
        reject(new Error('Turnstile: the script did not load'));
      };
      this.document.head.appendChild(script);
    });
    return this.api;
  }
}
