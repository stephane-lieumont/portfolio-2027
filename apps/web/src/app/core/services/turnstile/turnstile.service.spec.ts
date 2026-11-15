import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { TURNSTILE_SITE_KEY } from '@core/config/turnstile.config';
import {
  TURNSTILE_SCRIPT_URL,
  type TurnstileApi,
  type TurnstileOptions,
  TurnstileService,
} from './turnstile.service';

class FakeTurnstile implements TurnstileApi {
  options: TurnstileOptions | null = null;
  readonly calls: string[] = [];
  widgetId: string | null = 'widget-1';

  render(_container: HTMLElement, options: TurnstileOptions) {
    this.options = options;
    return this.widgetId;
  }
  execute(id: string) {
    this.calls.push(`execute ${id}`);
  }
  reset(id: string) {
    this.calls.push(`reset ${id}`);
  }
  remove(id: string) {
    this.calls.push(`remove ${id}`);
  }
}

let fake: FakeTurnstile;
const ignore = () => undefined;

function service(): TurnstileService {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      { provide: TURNSTILE_SITE_KEY, useValue: 'site-key' },
    ],
  });
  return TestBed.inject(TurnstileService);
}

const scripts = () =>
  Array.from(document.head.querySelectorAll<HTMLScriptElement>('script')).filter(
    (script) => script.src === TURNSTILE_SCRIPT_URL,
  );

async function scriptArrives(api: TurnstileApi | null = fake): Promise<void> {
  await Promise.resolve();
  if (api) window.turnstile = api;
  scripts().at(-1)?.dispatchEvent(new Event('load'));
}

beforeEach(() => {
  fake = new FakeTurnstile();
});

afterEach(() => {
  for (const script of scripts()) script.remove();
  delete window.turnstile;
});

describe('TurnstileService', () => {
  it('loads the script once, only when asked, and renders an invisible widget', async () => {
    const turnstile = service();
    expect(scripts()).toHaveLength(0);

    const container = document.createElement('div');
    const mounting = turnstile.mount(container, ignore);
    await scriptArrives();
    await mounting;
    await turnstile.mount(document.createElement('div'), ignore);

    expect(scripts()).toHaveLength(1);
    expect(fake.options).toMatchObject({
      sitekey: 'site-key',
      action: 'contact',
      language: 'fr',
      appearance: 'interaction-only',
      execution: 'execute',
      retry: 'never',
    });
  });

  it('runs the check on demand and resets it before reusing it', async () => {
    const turnstile = service();
    const mounting = turnstile.mount(document.createElement('div'), ignore);
    await scriptArrives();
    const widget = await mounting;

    const first = widget.token();
    fake.options?.callback('token-1');
    const second = widget.token();
    fake.options?.callback('token-2');
    widget.remove();

    expect(await first).toBe('token-1');
    expect(await second).toBe('token-2');
    expect(fake.calls).toEqual([
      'execute widget-1',
      'reset widget-1',
      'execute widget-1',
      'remove widget-1',
    ]);
  });

  it('says when Cloudflare shows its challenge and when it hides it', async () => {
    const turnstile = service();
    const shown: boolean[] = [];
    const mounting = turnstile.mount(document.createElement('div'), (state) => shown.push(state));
    await scriptArrives();
    await mounting;

    fake.options?.['before-interactive-callback']();
    fake.options?.['after-interactive-callback']();

    expect(shown).toEqual([true, false]);
  });

  it.each(['error-callback', 'timeout-callback', 'unsupported-callback'] as const)(
    'refuses the token on %s',
    async (callback) => {
      const turnstile = service();
      const mounting = turnstile.mount(document.createElement('div'), ignore);
      await scriptArrives();
      const widget = await mounting;

      const token = widget.token();
      fake.options?.[callback]();

      await expect(token).rejects.toThrow(/Turnstile/);
    },
  );

  it('fails when the widget does not render', async () => {
    fake.widgetId = null;
    const turnstile = service();
    const mounting = turnstile.mount(document.createElement('div'), ignore);
    await scriptArrives();

    await expect(mounting).rejects.toThrow(/did not render/);
  });

  it('fails when the script defines nothing', async () => {
    const turnstile = service();
    const mounting = turnstile.mount(document.createElement('div'), ignore);
    await scriptArrives(null);

    await expect(mounting).rejects.toThrow(/did not define/);
  });

  it('fetches the script again after it failed to load', async () => {
    const turnstile = service();
    const failing = turnstile.mount(document.createElement('div'), ignore);
    await Promise.resolve();
    scripts()[0]?.dispatchEvent(new Event('error'));
    await expect(failing).rejects.toThrow(/did not load/);
    expect(scripts()).toHaveLength(0);

    const retrying = turnstile.mount(document.createElement('div'), ignore);
    await scriptArrives();

    await expect(retrying).resolves.toBeDefined();
  });
});
