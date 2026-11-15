// The share cards: one 1200 × 630 PNG per world and language, in public/og/.
//
//   pnpm --filter @portfolio/web og:images
//
// Text is drawn as glyph outlines read from the site's own fonts, so the
// result never depends on what fonts the machine running this has installed.
// The output is committed; run this again when a role word or a world's
// tools change.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import * as fontkit from 'fontkit';
import sharp from 'sharp';
import wawoff2 from 'wawoff2';

import { SOFTWARE, TECHNOLOGIES } from '@portfolio/shared-types/registries';

import { WORLD_PAGES } from '../src/app/core/data/world-content/world-content.ts';
import { OG_IMAGE } from '../src/app/core/i18n/site-paths.ts';

const PUBLIC = new URL('../public/', import.meta.url);
const WIDTH = OG_IMAGE.width;
const HEIGHT = OG_IMAGE.height;
const MARGIN = 72;

// fontkit cannot apply a variable font's axes to a WOFF2 file: decompress first.
async function font(file) {
  const woff2 = await readFile(new URL(`fonts/${file}`, PUBLIC));
  return fontkit.create(Buffer.from(await wawoff2.decompress(woff2)));
}

const sans = await font('instrument-sans-latin.woff2');
const FONTS = {
  name: sans.getVariation({ wght: 500, wdth: 100 }),
  role: sans.getVariation({ wght: 600, wdth: 75 }),
  italic: await font('instrument-serif-latin-400-italic.woff2'),
  mono: await font('jetbrains-mono-latin-400-normal.woff2'),
  glyph: await font('jetbrains-mono-latin-500-normal.woff2'),
};

// The header's names for each world (nav.dev, nav.cgi in messages.en.xlf).
const LABELS = {
  dev: { fr: 'Développement', en: 'Development' },
  cgi: { fr: 'Graphisme 3D', en: '3D art' },
};

// The hero's accent letters, as world-hero.component.ts sets them.
const ACCENTS = {
  dev: { fr: [2], en: [2] },
  cgi: { fr: [10, 11], en: [0, 1] },
};

const COLOURS = {
  dev: { ground: '#12100f', ink: '#f3eee8', muted: '#968d84', accent: '#f2a154' },
  cgi: { ground: '#f2a154', ink: '#12100f', muted: '#5c280b', accent: '#12100f' },
};

/** Glyph outlines for a run of text, its baseline starting at (x, y). */
function run(face, text, size, x, y, tracking = 0) {
  const scale = size / face.unitsPerEm;
  const { glyphs, positions } = face.layout(text);
  let pen = 0;
  const paths = glyphs.map((glyph, i) => {
    const d = glyph.path.toSVG();
    const at = pen + positions[i].xOffset;
    pen += positions[i].xAdvance + tracking * face.unitsPerEm;
    return d ? `<path transform="translate(${at} 0)" d="${d}"/>` : '';
  });
  const width = (pen - tracking * face.unitsPerEm) * scale;
  const svg = `<g transform="translate(${x} ${y}) scale(${scale} ${-scale})">${paths.join('')}</g>`;
  return { svg, width };
}

/** The role word, its accent letters in the serif italic, like the hero. */
function roleWord(world, locale, x, y, colours) {
  const word = WORLD_PAGES[world].roleWord[locale];
  const accents = ACCENTS[world][locale];
  const size = 78;
  let pen = x;
  const parts = [];
  [...word].forEach((char, index) => {
    const italic = accents.includes(index);
    if (char === ' ') {
      pen += size * 0.22;
      return;
    }
    const { svg, width } = italic
      ? run(FONTS.italic, char, size * 1.06, pen, y, -0.04)
      : run(FONTS.role, char, size, pen, y, -0.02);
    parts.push(`<g fill="${italic ? colours.accent : colours.muted}">${svg}</g>`);
    pen += width + (italic ? -0.04 : -0.02) * size;
  });
  return parts.join('');
}

/** A seeded generator: the same card every run. */
function random(seed) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

/** The developer world's cloud: the glyph `</>`, sampled into points. */
async function glyphPoints() {
  const W = 480;
  const H = 300;
  const { svg, width } = run(FONTS.glyph, '</>', 232, 0, 0);
  const raster = await sharp(
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">` +
        `<g transform="translate(${(W - width) / 2} ${H * 0.72})">${svg}</g></svg>`,
    ),
  )
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const points = [];
  for (let y = 0; y < H; y += 7) {
    for (let x = 0; x < W; x += 7) {
      if (raster.data[(y * W + x) * 4 + 3] > 128) points.push([x - W / 2, y - H / 2, 1]);
    }
  }
  return points;
}

/** The 3D world's cloud: a tilted torus, R 1 and r 0.42 as in CloudStore. */
function torusPoints() {
  const points = [];
  const pitch = 1.05;
  const yaw = 0.5;
  for (let i = 0; i < 60; i++) {
    for (let j = 0; j < 20; j++) {
      const u = (i / 60) * Math.PI * 2;
      const v = (j / 20) * Math.PI * 2;
      const x0 = (1 + 0.42 * Math.cos(v)) * Math.cos(u);
      const y0 = (1 + 0.42 * Math.cos(v)) * Math.sin(u);
      const z0 = 0.42 * Math.sin(v);
      const x1 = x0 * Math.cos(yaw) - y0 * Math.sin(yaw);
      const y1 = x0 * Math.sin(yaw) + y0 * Math.cos(yaw);
      const y2 = y1 * Math.cos(pitch) - z0 * Math.sin(pitch);
      const z2 = y1 * Math.sin(pitch) + z0 * Math.cos(pitch);
      const depth = (z2 + 1.42) / 2.84;
      points.push([x1 * 132, y2 * 132, 0.35 + depth * 0.65]);
    }
  }
  return points;
}

function cloud(points, cx, cy, colour, opacity, seed) {
  const jitter = random(seed);
  return points
    .map(([x, y, depth]) => {
      const r = (1.2 + depth * 1.3).toFixed(2);
      const px = (cx + x + (jitter() - 0.5) * 2).toFixed(1);
      const py = (cy + y + (jitter() - 0.5) * 2).toFixed(1);
      return `<circle cx="${px}" cy="${py}" r="${r}" fill-opacity="${(opacity * depth).toFixed(2)}"/>`;
    })
    .join('')
    .replace(/^/, `<g fill="${colour}">`)
    .concat('</g>');
}

async function card(world, locale) {
  const colours = COLOURS[world];
  const label = LABELS[world][locale].toLocaleUpperCase(locale);
  const tools = WORLD_PAGES[world].eyebrowTools
    .map((slug) => [...TECHNOLOGIES, ...SOFTWARE].find((tool) => tool.slug === slug)?.label ?? slug)
    .join(' · ')
    .toLocaleUpperCase(locale);

  const eyebrowLeft = run(FONTS.mono, label, 20, MARGIN, MARGIN + 18, 0.08);
  const toolsWidth = run(FONTS.mono, tools, 20, 0, 0, 0.08).width;
  const eyebrowRight = run(FONTS.mono, tools, 20, WIDTH - MARGIN - toolsWidth, MARGIN + 18, 0.08);
  const name = run(FONTS.name, 'Stéphane Lieumont', 104, MARGIN - 4, 470, -0.035);

  const points = world === 'dev' ? await glyphPoints() : torusPoints();
  const dots = cloud(points, 880, 268, colours.ink, world === 'dev' ? 0.2 : 0.32, 7);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="100%" height="100%" fill="${colours.ground}"/>
${dots}
<g fill="${colours.muted}">${eyebrowLeft.svg}${eyebrowRight.svg}</g>
<rect x="${MARGIN}" y="${MARGIN + 36}" width="${WIDTH - 2 * MARGIN}" height="1" fill="${colours.ink}" fill-opacity="0.18"/>
<g fill="${colours.ink}">${name.svg}</g>
${roleWord(world, locale, MARGIN, 556, colours)}
</svg>`;

  return sharp(Buffer.from(svg))
    .png({ compressionLevel: 9, palette: true, quality: 90 })
    .toBuffer();
}

await mkdir(new URL('og/', PUBLIC), { recursive: true });
for (const world of ['dev', 'cgi']) {
  for (const locale of ['fr', 'en']) {
    const file = OG_IMAGE.file(world, locale);
    const png = await card(world, locale);
    await writeFile(new URL(file.slice(1), PUBLIC), png);
    const { width, height } = await sharp(png).metadata();
    console.log(`public${file}  ${width} × ${height}  ${Math.round(png.length / 1024)} KB`);
  }
}
