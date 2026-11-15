import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ReducedMotionService } from '../../../../core/services/motion/reduced-motion.service';
import { SmoothScrollService } from '../../../../core/services/motion/smooth-scroll.service';
import { ArtViewerComponent, type ViewerPiece } from './art-viewer.component';

const pieces: ViewerPiece[] = ['a', 'b', 'c', 'd'].map((slug, i) => ({
  slug,
  title: `Pièce ${slug}`,
  year: '2015',
  alt: `Rendu ${slug}`,
  src: `/medias/cgi/${slug}.jpg`,
  srcset: `/medias/cgi/${slug}-640.webp 640w`,
  tone: '#808080',
  width: 1280,
  height: 720 + i,
  tools: [],
}));

describe('ArtViewerComponent stepping', () => {
  let finish: (() => void)[];
  let animate: ReturnType<typeof vi.fn>;

  function render(reduced: boolean) {
    finish = [];
    animate = vi.fn(() => {
      let done!: () => void;
      const finished = new Promise<void>((resolve) => (done = resolve));
      finish.push(done);
      return { finished, cancel: () => undefined } as unknown as Animation;
    });
    Element.prototype.animate = animate as unknown as Element['animate'];
    Element.prototype.getAnimations = () => [];
    HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: ReducedMotionService, useValue: { reduced: signal(reduced) } },
        { provide: SmoothScrollService, useValue: { pause: vi.fn(), resume: vi.fn() } },
      ],
    });
    const fixture = TestBed.createComponent(ArtViewerComponent);
    fixture.componentRef.setInput('pieces', pieces);
    fixture.detectChanges();
    const moved: number[] = [];
    fixture.componentInstance.moved.subscribe((i) => moved.push(i));
    fixture.componentInstance.show(0);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const key = (k: string) =>
      host
        .querySelector('.show__stage')!
        .dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
    return { fixture, host, moved, key };
  }

  beforeEach(() => TestBed.resetTestingModule());

  it('holds a step asked for mid-cut, keeps only the last, and plays it once the cut is done', async () => {
    const { fixture, moved, key } = render(false);
    key('ArrowRight');
    key('ArrowRight');
    key('ArrowRight');
    expect(moved).toEqual([1]);

    finish.forEach((done) => done());
    await vi.waitFor(() => expect(moved).toEqual([1, 2]));
    expect(fixture.componentInstance.current).toBe(2);
  });

  it('cuts along the diagonal, the leaving render drifting and darkening', () => {
    const { key } = render(false);
    key('ArrowRight');
    const frames = animate.mock.calls.map(([f]) =>
      Object.keys((f as Keyframe[])[0])
        .sort()
        .join('+'),
    );
    expect(frames).toContain('clipPath');
    expect(frames).toContain('filter+scale+translate');
  });

  it('crossfades in 220ms under reduced motion, with no cut and no drift', () => {
    const { key } = render(true);
    key('ArrowLeft');
    const calls = animate.mock.calls.map(([f, o]) => [Object.keys((f as Keyframe[])[0]).join(), o]);
    expect(calls).toEqual([['opacity', { duration: 220 }]]);
  });

  it('fetches the piece shown and its neighbours only, wrapping at the ends', () => {
    const { host } = render(false);
    const loaded = Array.from(host.querySelectorAll('.show__slide')).map(
      (s) => !!s.querySelector('img'),
    );
    expect(loaded).toEqual([true, true, false, true]);
  });

  // The route's view transition captures the page under the dialog as its new
  // state. A dialog that fades out there keeps its opaque backdrop in the top
  // layer past the crossfade, and the 3D world's orange ground lands in one
  // frame after it.
  // jsdom applies no component stylesheet, so this reads the rules themselves.
  it('fades in when it opens but leaves at once when it closes', () => {
    const css = readFileSync(
      join(process.cwd(), 'src/app/features/world/components/art-viewer/art-viewer.component.scss'),
      'utf8',
    );
    const rule = (selector: string) =>
      new RegExp(`^${selector.replace(/[.[\]]/g, '\\$&')} \\{([^}]*)\\}`, 'm').exec(css)?.[1] ?? '';

    expect(rule('.lb[open]')).toMatch(/transition:\s*opacity/);
    expect(rule('.lb')).not.toContain('transition');
    expect(rule('.lb::backdrop')).not.toContain('transition');
  });
});
