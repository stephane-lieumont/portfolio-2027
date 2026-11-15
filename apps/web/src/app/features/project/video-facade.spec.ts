import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { youtubeVideoId } from '@portfolio/shared-types/video';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';

import { MEDIA_BASE_URL } from '../../core/media.config';
import { PROJECTS } from '../../core/static-content';
import { VideoFacade } from './video-facade';

describe('youtubeVideoId', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtube.com/watch?feature=share&v=dQw4w9WgXcQ&t=42', 'dQw4w9WgXcQ'],
    ['https://m.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ?t=10', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
  ])('reads %s', (address, id) => {
    expect(youtubeVideoId(address)).toBe(id);
  });

  it.each([
    'http://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://www.youtube.com.evil.example/watch?v=dQw4w9WgXcQ',
    'https://evil.example/?u=https://youtu.be/dQw4w9WgXcQ',
    'https://www.youtube.com/playlist?list=PL0123456789',
    'https://www.youtube.com/watch?v=short',
    'https://youtu.be/dQw4w9WgXcQ/../x',
    'https://vimeo.com/123456',
    'javascript:alert(1)',
  ])('refuses %s', (address) => {
    expect(youtubeVideoId(address)).toBeNull();
  });
});

const POSTER = PROJECTS[0].presentation;

async function render(url = 'https://youtu.be/dQw4w9WgXcQ') {
  await TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection(), { provide: MEDIA_BASE_URL, useValue: '/medias' }],
  }).compileComponents();
  const fixture = TestBed.createComponent(VideoFacade);
  fixture.componentRef.setInput('url', url);
  fixture.componentRef.setInput('title', 'Case Tes Potes — application mobile');
  fixture.componentRef.setInput('poster', POSTER);
  fixture.detectChanges();
  document.body.appendChild(fixture.nativeElement);
  return fixture;
}

/** Every address the facade would make the browser fetch. */
function requested(host: HTMLElement): string[] {
  return Array.from(host.querySelectorAll('[src], [srcset]')).flatMap((el) => [
    el.getAttribute('src') ?? '',
    el.getAttribute('srcset') ?? '',
  ]);
}

describe('VideoFacade', () => {
  it('asks nothing of YouTube before the click: its poster comes from our own media', async () => {
    const host = (await render()).nativeElement as HTMLElement;

    expect(host.querySelector('iframe')).toBeNull();
    for (const address of requested(host).filter(Boolean)) {
      expect(address).toMatch(/^\/medias\//);
    }
    host.remove();
  });

  it('is a real button, named for its action and its video', async () => {
    const host = (await render()).nativeElement as HTMLElement;
    const button = host.querySelector('button');

    expect(button?.getAttribute('type')).toBe('button');
    expect(button?.textContent?.trim()).toBe('Lire la vidéo : Case Tes Potes — application mobile');
    const results = await axe.run(host, { resultTypes: ['violations'] });
    expect(results.violations).toEqual([]);
    host.remove();
  });

  it('swaps in the privacy-enhanced player on the click, playing, and hands it the focus', async () => {
    const fixture = await render();
    const host = fixture.nativeElement as HTMLElement;

    host.querySelector('button')?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const player = host.querySelector('iframe');
    expect(player?.getAttribute('src')).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0',
    );
    expect(player?.getAttribute('title')).toBe('Vidéo : Case Tes Potes — application mobile');
    expect(host.querySelector('button')).toBeNull();
    expect(document.activeElement).toBe(player);
    host.remove();
  });

  it('never builds a player from an address it cannot read', async () => {
    const fixture = await render('https://evil.example/embed/dQw4w9WgXcQ');
    const host = fixture.nativeElement as HTMLElement;

    host.querySelector('button')?.click();
    fixture.detectChanges();

    expect(host.querySelector('iframe')).toBeNull();
    host.remove();
  });

  it('takes the focus on its play button when the page sends the visitor to it', async () => {
    const fixture = await render();
    const host = fixture.nativeElement as HTMLElement;

    fixture.componentInstance.focus();

    expect(document.activeElement).toBe(host.querySelector('button'));
    host.remove();
  });
});
