import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, ViewTransitionInfo, provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SmoothScroll } from './motion/smooth-scroll';
import { RouteTransitions, classifyTransition } from './route-transitions';
import { ActiveWorld } from './world/world';

describe('classifyTransition', () => {
  const dev = { path: '/developpeur', world: 'dev' } as const;
  const cgi = { path: '/graphisme-3d', world: 'cgi' } as const;
  const contactFrom = (world: 'dev' | 'cgi') => ({ path: '/contact', world });

  it('sweeps between the worlds, in the ground of the one arriving', () => {
    expect(classifyTransition(dev, cgi)).toBe('sweep-cgi');
    expect(classifyTransition(cgi, dev)).toBe('sweep-dev');
    expect(classifyTransition({ path: '/developpeur/kasa', world: 'dev' }, cgi)).toBe('sweep-cgi');
  });

  it('wipes into contact and back to the world it was opened from', () => {
    expect(classifyTransition(cgi, contactFrom('cgi'))).toBe('wipe');
    expect(classifyTransition(contactFrom('cgi'), cgi)).toBe('wipe');
  });

  it('sweeps when contact is left for the other world', () => {
    expect(classifyTransition(contactFrom('cgi'), dev)).toBe('sweep-dev');
  });

  it('crossfades within a world', () => {
    expect(classifyTransition(dev, { path: '/developpeur/kasa', world: 'dev' })).toBe('fade');
  });

  it('skips a navigation that changes nothing on screen', () => {
    expect(classifyTransition(dev, dev)).toBe('none');
  });

  it('morphs the plate when the viewer opens on a piece or closes back to the wall', () => {
    const piece = { path: '/graphisme-3d/beebop', world: 'cgi' } as const;
    expect(classifyTransition(cgi, piece)).toBe('viewer');
    expect(classifyTransition(piece, cgi)).toBe('viewer');
  });

  it('leaves a step between two pieces to the viewer’s own animation', () => {
    const from = { path: '/graphisme-3d/beebop', world: 'cgi' } as const;
    expect(classifyTransition(from, { path: '/graphisme-3d/gorgotte', world: 'cgi' })).toBe('none');
  });
});

describe('RouteTransitions', () => {
  const root = document.documentElement;
  let navigation: ReturnType<
    typeof signal<{
      trigger: string;
      finalUrl: UrlTree;
      extras: { scroll?: 'manual' };
    } | null>
  >;
  let jumpTo: ReturnType<typeof vi.fn>;

  function fakeTransition() {
    let finish!: () => void;
    let update!: () => void;
    const transition = {
      finished: new Promise<undefined>((resolve) => (finish = () => resolve(undefined))),
      updateCallbackDone: new Promise<undefined>((resolve) => (update = () => resolve(undefined))),
      ready: Promise.resolve(undefined),
      skipTransition: vi.fn(),
      types: new Set<string>(),
    };
    return { transition, finish, update };
  }

  function start(to: string, trigger = 'imperative', extras: { scroll?: 'manual' } = {}) {
    const router = TestBed.inject(Router);
    navigation.set({ trigger, finalUrl: router.parseUrl(to), extras });
    const fake = fakeTransition();
    TestBed.inject(RouteTransitions).onCreated({
      transition: fake.transition,
    } as unknown as ViewTransitionInfo);
    return fake;
  }

  beforeEach(() => {
    navigation = signal(null);
    jumpTo = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: SmoothScroll, useValue: { jumpTo, settle: vi.fn() } },
      ],
    });
    Object.defineProperty(TestBed.inject(Router), 'currentNavigation', { value: navigation });
    TestBed.inject(ActiveWorld).enter('/developpeur');
  });

  afterEach(() => {
    delete root.dataset['vt'];
    root.removeAttribute('data-world');
  });

  it('stamps the kind for the stylesheet and clears it once the transition is over', async () => {
    const { finish } = start('/graphisme-3d');
    expect(root.dataset['vt']).toBe('sweep-cgi');

    finish();
    await Promise.resolve();
    await Promise.resolve();
    expect(root.dataset['vt']).toBeUndefined();
  });

  it('jumps to the top once the new page is rendered, not before', async () => {
    const { update } = start('/contact');
    expect(jumpTo).not.toHaveBeenCalled();

    update();
    await Promise.resolve();
    await Promise.resolve();
    expect(jumpTo).toHaveBeenCalledWith(0);
  });

  it('leaves the scroll to the router on back and forward', async () => {
    const { update } = start('/graphisme-3d', 'popstate');
    update();
    await Promise.resolve();
    await Promise.resolve();
    expect(jumpTo).not.toHaveBeenCalled();
  });

  it('lets the cloud ride above the band only between two pages that show it', () => {
    start('/graphisme-3d');
    expect(root.dataset['vtCloud']).toBe('');
    TestBed.inject(ActiveWorld).enter('/contact');
    start('/graphisme-3d');
    expect(root.dataset['vtCloud']).toBeUndefined();
    TestBed.inject(ActiveWorld).enter('/developpeur');
    start('/developpeur/kasa');
    expect(root.dataset['vtCloud']).toBeUndefined();
  });

  it('keeps the scroll of a navigation that asks to, the viewer over the wall', async () => {
    TestBed.inject(ActiveWorld).enter('/graphisme-3d');
    const { update } = start('/graphisme-3d/beebop', 'imperative', { scroll: 'manual' });
    expect(root.dataset['vt']).toBe('viewer');
    update();
    await Promise.resolve();
    await Promise.resolve();
    expect(jumpTo).not.toHaveBeenCalled();
  });

  it('says when the transition under way is over, so the morph names can be cleared', async () => {
    const transitions = TestBed.inject(RouteTransitions);
    const { finish } = start('/graphisme-3d');
    let settled = false;
    void transitions.settled().then(() => (settled = true));
    await Promise.resolve();
    expect(settled).toBe(false);
    finish();
    await vi.waitFor(() => expect(settled).toBe(true));
  });

  it('animates nothing and stays put when the page does not change, without skipping', async () => {
    const { transition, update } = start('/developpeur?filtre=angular');
    expect(root.dataset['vt']).toBe('none');
    // A skipped transition rejects, and the router reports it as an error.
    expect(transition.skipTransition).not.toHaveBeenCalled();
    update();
    await Promise.resolve();
    await Promise.resolve();
    expect(jumpTo).not.toHaveBeenCalled();
  });

  it('does not let an earlier transition clear a later one', async () => {
    const first = start('/graphisme-3d');
    start('/contact');
    first.finish();
    await Promise.resolve();
    await Promise.resolve();
    expect(root.dataset['vt']).toBe('wipe');
  });

  it('stays out of the way when the router reports no navigation', () => {
    navigation.set(null);
    const { transition } = fakeTransition();
    TestBed.inject(RouteTransitions).onCreated({ transition } as unknown as ViewTransitionInfo);

    expect(transition.skipTransition).not.toHaveBeenCalled();
    expect(root.dataset['vt']).toBeUndefined();
  });
});
