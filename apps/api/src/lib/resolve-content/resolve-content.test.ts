import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ARTWORKS, PROJECTS } from '../../db/seed/content.ts';
import { MEDIA, mediaId } from '../../db/seed/media.ts';
import { STACK } from '../../db/seed/stack.ts';
import { TOOLS, toolId } from '../../db/seed/tools.ts';
import { resolveContent } from './resolve-content.ts';

const content = {
  media: MEDIA,
  tools: TOOLS,
  stack: STACK,
  projects: PROJECTS,
  artworks: ARTWORKS,
};

describe('resolveContent', () => {
  const resolved = resolveContent(content);

  it('serves a project its images and tools in the shape the site renders', () => {
    const mobile = resolved.projects.find((p) => p.slug.fr === 'case-tes-potes-mobile');

    assert.deepEqual(mobile?.cover, {
      key: 'projects/case-tes-potes-mobile.jpg',
      alt: {
        fr: 'Écrans de l’application mobile Case Tes Potes',
        en: 'Screens of the Case Tes Potes mobile app',
      },
      width: 400,
      height: 300,
      averageColor: '#bcc0ca',
    });
    assert.equal(mobile?.presentation?.averageColor, undefined);
    assert.deepEqual(mobile?.technologies[0], {
      id: toolId('flutter'),
      slug: 'flutter',
      label: { fr: 'Flutter', en: 'Flutter' },
      icon: { src: '/logos/simple-icons/flutter.svg', width: 24, height: 24 },
    });
  });

  it('serves a client logo from the site, with its variants when it is a raster', () => {
    const cir = resolved.projects.find((p) => p.slug.fr === 'cir-scancir');

    assert.deepEqual(cir?.logo, {
      src: '/logos/clients/cir-scancir.png',
      width: 783,
      height: 414,
      variants: [240, 480],
      alt: { fr: 'Logo de CIR', en: 'CIR logo' },
    });
  });

  it('gives a tool with no mark a null icon, and translates the label that is not a name', () => {
    const units = resolved.tools.find((tool) => tool.slug === 'unit-tests');

    assert.deepEqual(units?.label, { fr: 'Tests unitaires', en: 'Unit tests' });
    assert.equal(resolved.tools.find((tool) => tool.slug === 'csharp')?.icon, null);
  });

  it('resolves each Stack entry to its tool', () => {
    const first = resolved.stack.find((e) => e.domain === 'cgi' && e.position === 0);

    assert.equal(first?.tool.slug, '3dsmax');
    assert.equal(first?.points.length, 4);
  });

  it('refuses an image used for what it is not', () => {
    const [first, ...others] = ARTWORKS;
    const misused = { ...first, image: mediaId('/logos/simple-icons/angular.svg') };

    assert.throws(
      () => resolveContent({ ...content, artworks: [misused, ...others] }),
      /no render media/,
    );
  });

  it('refuses a tool slug or a Stack entry given twice', () => {
    const [angular] = TOOLS;
    assert.throws(
      () =>
        resolveContent({ ...content, tools: [...TOOLS, { ...angular, id: crypto.randomUUID() }] }),
      /appears twice: tool angular/,
    );

    const [entry] = STACK;
    assert.throws(
      () =>
        resolveContent({ ...content, stack: [...STACK, { ...entry, id: crypto.randomUUID() }] }),
      /appears twice: stack tool dev .+, stack position dev 0/,
    );
  });

  it('refuses a bucket image whose key is a path', () => {
    const [first, ...others] = MEDIA;

    assert.throws(
      () => resolveContent({ ...content, media: [{ ...first, key: '/cgi/x.jpg' }, ...others] }),
      /media \/cgi\/x.jpg is invalid/,
    );
  });
});
