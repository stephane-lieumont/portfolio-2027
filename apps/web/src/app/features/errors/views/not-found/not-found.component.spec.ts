import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import axe from 'axe-core';
import { type MockInstance, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ReducedMotionService } from '@core/services/motion/reduced-motion.service';

import { NotFoundComponent } from './not-found.component';

let play: MockInstance<HTMLMediaElement['play']>;

beforeEach(() => {
  // jsdom has no media playback; the stubs fire the events a browser would.
  play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (
    this: HTMLMediaElement,
  ) {
    this.dispatchEvent(new Event('play'));
    return Promise.resolve();
  });
});

afterEach(() => vi.restoreAllMocks());

async function render(reduced = false): Promise<HTMLElement> {
  await TestBed.configureTestingModule({
    imports: [NotFoundComponent],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: ReducedMotionService, useValue: { reduced: () => reduced } },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(NotFoundComponent);
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('NotFound', () => {
  it('says what happened and offers a way back into the site', async () => {
    const host = await render();

    expect(host.querySelector('h1')?.textContent?.trim()).toBeTruthy();
    expect(host.textContent).toContain('404');
    expect(Array.from(host.querySelectorAll('a')).map((a) => a.getAttribute('href'))).toEqual([
      '/developpeur',
    ]);
  });

  it('plays the clip on arrival', async () => {
    await render();

    expect(play).toHaveBeenCalledTimes(1);
  });

  it('leaves the clip on its poster under reduced motion', async () => {
    await render(true);

    expect(play).not.toHaveBeenCalled();
  });

  it('has no detectable accessibility violation', async () => {
    const host = await render();
    document.body.appendChild(host);
    const results = await axe.run(host, {
      resultTypes: ['violations'],
      rules: { 'color-contrast': { enabled: false } },
    });
    host.remove();

    expect(results.violations).toEqual([]);
  });
});
