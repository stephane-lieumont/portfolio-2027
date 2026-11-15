import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { stackOf } from '@core/data/tool-marks/tool-marks';
import { WorldStackComponent } from './world-stack.component';

function render(world: 'dev' | 'cgi') {
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  const fixture = TestBed.createComponent(WorldStackComponent);
  fixture.componentRef.setInput('world', world);
  fixture.detectChanges();
  const host = fixture.nativeElement as HTMLElement;
  document.body.appendChild(host);
  const tabs = () => Array.from(host.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const selected = () => tabs().map((t) => t.getAttribute('aria-selected'));
  const points = () =>
    Array.from(host.querySelectorAll('.mastery__list.is-current b')).map((b) => b.textContent);
  const key = async (name: string) => {
    host
      .querySelector('[role="tab"][aria-selected="true"]')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }));
    await fixture.whenStable();
  };
  return { fixture, host, tabs, selected, points, key };
}

describe('WorldStack', () => {
  let animate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // jsdom has no Web Animations.
    animate = vi.fn(
      () => ({ finished: Promise.resolve(), cancel: () => undefined }) as unknown as Animation,
    );
    Element.prototype.animate = animate as unknown as Element['animate'];
    Element.prototype.getAnimations = () => [];
  });

  afterEach(() => document.body.replaceChildren());

  it('is a tab list: the first tool selected, its points in the tab panel it labels', () => {
    const { host, tabs, selected, points } = render('dev');
    expect(selected()[0]).toBe('true');
    expect(selected().filter((s) => s === 'true')).toHaveLength(1);
    expect(tabs().map((t) => t.getAttribute('tabindex'))[0]).toBe('0');
    expect(
      tabs()
        .slice(1)
        .every((t) => t.getAttribute('tabindex') === '-1'),
    ).toBe(true);
    const panel = host.querySelector('[role="tabpanel"]')!;
    expect(panel.getAttribute('aria-labelledby')).toBe(tabs()[0].id);
    expect(tabs().every((t) => t.getAttribute('aria-controls') === panel.id)).toBe(true);
    expect(points()).toEqual(stackOf('dev')[0].points.map((p) => p.strongLine.fr));
  });

  it('switches the panel to the tool clicked, and the new points arrive in order', async () => {
    const { fixture, tabs, selected, points, host } = render('dev');
    tabs()[2].click();
    await fixture.whenStable();

    expect(selected()).toEqual(stackOf('dev').map((_, i) => String(i === 2)));
    expect(host.querySelector('.mastery__name.is-current')?.textContent).toBe('RxJS / Signals');
    expect(points()).toEqual(stackOf('dev')[2].points.map((p) => p.strongLine.fr));
    expect(animate).toHaveBeenCalledTimes(1 + stackOf('dev')[2].points.length);
  });

  it('moves with the arrows, wrapping, and Home and End, focus following the choice', async () => {
    const { tabs, selected, key } = render('cgi');
    const count = stackOf('cgi').length;

    await key('ArrowLeft');
    expect(selected()[count - 1]).toBe('true');
    expect(document.activeElement).toBe(tabs()[count - 1]);
    await key('ArrowRight');
    expect(selected()[0]).toBe('true');
    await key('End');
    expect(selected()[count - 1]).toBe('true');
    await key('Home');
    expect(selected()[0]).toBe('true');
    await key('a');
    expect(selected()[0]).toBe('true');
  });

  it('keeps every tool’s points in the panel, so it never changes height, exposing only the chosen', async () => {
    const { fixture, tabs, host } = render('dev');
    const lists = () => Array.from(host.querySelectorAll<HTMLElement>('.mastery__list'));
    expect(lists()).toHaveLength(stackOf('dev').length);

    tabs()[4].click();
    await fixture.whenStable();
    const exposed = lists().filter(
      (l) => !l.hasAttribute('inert') && l.getAttribute('aria-hidden') !== 'true',
    );
    expect(exposed).toEqual([lists()[4]]);
    const names = Array.from(host.querySelectorAll('.mastery__name')).filter(
      (n) => n.getAttribute('aria-hidden') !== 'true',
    );
    expect(names.map((n) => n.textContent)).toEqual(['React']);
  });

  it('names its row by world, and draws every mark from a file', () => {
    const { host } = render('cgi');
    expect(host.querySelector('.stack__head span')?.textContent).toBe('Mes logiciels');
    for (const mask of host.querySelectorAll<HTMLElement>('.mark__mask')) {
      expect(mask.style.getPropertyValue('--mask')).toMatch(/^url\("?'?\/logos\//);
    }
  });

  it('bubbles the marks in once, when the row first comes into view', () => {
    let report: ((entries: { isIntersecting: boolean }[]) => void) | null = null;
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: typeof report) {
          report = callback;
        }
        observe = () => undefined;
        disconnect = () => undefined;
      },
    );
    const { fixture } = render('cgi');
    fixture.detectChanges();
    report!([{ isIntersecting: false }]);
    expect(animate).not.toHaveBeenCalled();
    report!([{ isIntersecting: true }]);
    // The icon's wrapper and the name, for each mark.
    expect(animate).toHaveBeenCalledTimes(2 * stackOf('cgi').length);
    vi.unstubAllGlobals();
  });
});
