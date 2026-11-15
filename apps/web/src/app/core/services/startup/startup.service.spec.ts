import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import {
  APP_READY_EVENT,
  ENTRANCE_RELEASE_EVENT,
  StartupService,
  entranceHeld,
} from './startup.service';

describe('StartupService', () => {
  const root = document.documentElement;

  afterEach(() => root.removeAttribute('data-boot'));

  function create(): StartupService {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    return TestBed.inject(StartupService);
  }

  it('holds the entrance only while the loader decides or covers the page', () => {
    expect(entranceHeld(root)).toBe(false);
    for (const [state, held] of [
      ['wait', true],
      ['on', true],
      ['out', true],
      ['clear', false],
      ['skip', false],
    ] as const) {
      root.setAttribute('data-boot', state);
      expect(entranceHeld(root), state).toBe(held);
    }
  });

  it('starts at once when nothing holds the entrance (a route change, no loader)', () => {
    let started = 0;
    create().afterEntranceRelease(() => started++);
    expect(started).toBe(1);
  });

  it('waits for the loader to let the entrance go, then starts once', () => {
    root.setAttribute('data-boot', 'on');
    let started = 0;
    create().afterEntranceRelease(() => started++);
    expect(started).toBe(0);
    document.dispatchEvent(new Event(ENTRANCE_RELEASE_EVENT));
    document.dispatchEvent(new Event(ENTRANCE_RELEASE_EVENT));
    expect(started).toBe(1);
  });

  it('tells the loader the app is ready once it is stable', async () => {
    const startup = create();
    let heard = 0;
    document.addEventListener(APP_READY_EVENT, () => heard++, { once: true });
    await TestBed.inject(ApplicationRef).whenStable();
    await startup.announceReady();
    expect(heard).toBe(1);
  });
});
