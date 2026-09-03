/**
 * Uploads the site's images into the MinIO bucket, once.
 *
 * The bucket is the store of record for media — not the repository. Keeping
 * 5MB of renders in git would make every clone carry them forever and every
 * replacement rewrite history, and it would mean the back office and the site
 * read media from two different places.
 *
 * The sources are the images the 2022 site already ships. Run this from a
 * machine that has that repository checked out; the bucket keeps them
 * afterwards, and its volume is what gets backed up.
 *
 *   pnpm --filter @portfolio/api media:seed [source-repo]
 *
 * Re-running is safe: an object with the same key is replaced, not duplicated.
 */
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { Client as MinioClient } from 'minio';

import { loadConfig } from '../config.ts';

const DEFAULT_SOURCE = resolve(
  import.meta.dirname,
  '../../../../../Portfolio_2022/src/assets/medias',
);

/**
 * Source file to bucket key. Written out rather than derived: the 2022 names
 * carry a running number, a date that sometimes disagrees with the data beside
 * it, and inconsistent capitalisation. The key is the slug the site uses, so a
 * renamed source cannot silently point the gallery at the wrong render.
 */
const CGI: Record<string, string> = {
  'portfolio/1-1-escart-wild-2015.jpg': 'cgi/escart-wild.jpg',
  'portfolio/2-1-bibopp-2015.jpg': 'cgi/beebop.jpg',
  'portfolio/4-1-gorgotte-2015.jpg': 'cgi/gorgotte.jpg',
  'portfolio/5-1-auto-portrait-pixmodels-2014.jpg': 'cgi/caricature.jpg',
  'portfolio/6-1-immeuble-2015.jpg': 'cgi/immeuble.jpg',
  'portfolio/7-1-maison-moderne-2014.jpg': 'cgi/maison-moderne.jpg',
  'portfolio/9-2-salon-decoration1-nuit-2015.jpg': 'cgi/salon-nuit.jpg',
  'portfolio/10-2-chambre-decoration-jour-2015.jpg': 'cgi/chambre.jpg',
  'portfolio/12-3-salon-decoration1-jour-2015.jpg': 'cgi/salon-jour.jpg',
  'portfolio/13-1-ampoule-2014.jpg': 'cgi/ampoule.jpg',
  'portfolio/14-1-canette-de-soda-2014.jpg': 'cgi/support-marketing.jpg',
  'portfolio/17-1-Interieur-blanc-2014.jpg': 'cgi/entree.jpg',
  'portfolio/18-1-herbe-realiste-2014.jpg': 'cgi/exterieur.jpg',
  'portfolio/19-1-tomates-2014.jpg': 'cgi/tomates.jpg',
  'portfolio/21-Lego-Minions-2016.jpg': 'cgi/legos-minions.jpg',
  'portfolio/22-1-Extraterrestre-2016.jpg': 'cgi/extraterrestre.jpg',
};

const PROJECTS: Record<string, string> = {
  'projects/case-tes-potes-mobile-2022.jpg': 'projects/case-tes-potes-mobile.jpg',
  'projects/case-tes-potes-landingpage-2022.jpg': 'projects/case-tes-potes-landing-page.jpg',
  'projects/case-tes-potes-webapp-2021.jpg': 'projects/case-tes-potes-web-app.jpg',
  'projects/oc-kasa-fromation-2021.jpg': 'projects/kasa-openclassrooms.jpg',
  'projects/portfolio-3d-2018.jpg': 'projects/portfolio-3d-2018.jpg',
  'projects/pixmodels-2016-service-comminucation.jpg': 'projects/pixmodels.jpg',
};

/**
 * Read for everyone, write for no one. The site serves these to the public, so
 * anonymous GET has to work; anonymous PUT would let anyone replace a render
 * with anything at all.
 */
function readOnlyPolicy(bucket: string): string {
  return JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: { AWS: ['*'] },
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${bucket}/*`],
      },
    ],
  });
}

async function main(): Promise<void> {
  const source = process.argv[2] ?? DEFAULT_SOURCE;
  const config = loadConfig();

  const client = new MinioClient({
    endPoint: config.MINIO_ENDPOINT,
    port: config.MINIO_PORT,
    useSSL: config.MINIO_USE_SSL,
    accessKey: config.MINIO_ACCESS_KEY,
    secretKey: config.MINIO_SECRET_KEY,
  });

  const bucket = config.MINIO_BUCKET;
  if (!(await client.bucketExists(bucket))) {
    await client.makeBucket(bucket);
    console.log(`created bucket ${bucket}`);
  }
  await client.setBucketPolicy(bucket, readOnlyPolicy(bucket));

  const entries = Object.entries({ ...CGI, ...PROJECTS });
  const missing: string[] = [];

  for (const [file, key] of entries) {
    const path = join(source, file);
    try {
      await stat(path);
    } catch {
      missing.push(file);
      continue;
    }

    await client.putObject(bucket, key, createReadStream(path), undefined, {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
    });
    console.log(`uploaded ${key}`);
  }

  // Loud, and a non-zero exit: a half-seeded bucket looks fine until the one
  // page holding the missing render is opened.
  if (missing.length > 0) {
    console.error(`\n${missing.length} source file(s) not found under ${source}:`);
    for (const file of missing) console.error(`  ${file}`);
    process.exitCode = 1;
    return;
  }

  console.log(`\n${entries.length} objects in ${bucket}`);
}

await main();
