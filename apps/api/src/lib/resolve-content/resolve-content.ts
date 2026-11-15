import {
  type MediaAsset,
  type MediaPurpose,
  mediaAssetSchema,
} from '@portfolio/shared-types/media';
import {
  type Artwork,
  type ArtworkRecord,
  type ContentImage,
  type Project,
  type ProjectRecord,
  artworkRecordSchema,
  artworkSchema,
  projectRecordSchema,
  projectSchema,
} from '@portfolio/shared-types/project';
import {
  type StackEntry,
  type StackEntryRecord,
  stackEntryRecordSchema,
  stackEntrySchema,
} from '@portfolio/shared-types/stack';
import {
  type Tool,
  type ToolRecord,
  toolRecordSchema,
  toolSchema,
} from '@portfolio/shared-types/tool';
import type { z } from 'zod';

/** What records point at by id: the media assets and the tools. */
export interface References {
  readonly media: ReadonlyMap<string, MediaAsset>;
  readonly tools: ReadonlyMap<string, ToolRecord>;
}

export function referencesOf(
  media: readonly MediaAsset[],
  tools: readonly ToolRecord[],
): References {
  return {
    media: new Map(media.map((asset) => [asset.id, asset])),
    tools: new Map(tools.map((tool) => [tool.id, tool])),
  };
}

function asset(references: References, id: string, purpose: MediaPurpose): MediaAsset {
  const found = references.media.get(id);
  if (found?.purpose !== purpose) throw new Error(`no ${purpose} media ${id}`);
  return found;
}

function contentImage({ key, alt, width, height, averageColor }: MediaAsset): ContentImage {
  return { key, alt, width, height, ...(averageColor ? { averageColor } : {}) };
}

export function resolveTool(references: References, tool: ToolRecord): Tool {
  const icon = tool.icon === null ? null : asset(references, tool.icon, 'mark');
  return toolSchema.parse({
    ...tool,
    icon: icon && { src: icon.key, width: icon.width, height: icon.height },
  });
}

function toolOf(references: References, id: string): Tool {
  const tool = references.tools.get(id);
  if (!tool) throw new Error(`no tool ${id}`);
  return resolveTool(references, tool);
}

/**
 * The project as the site renders it: its images and tools resolved from the
 * ids the record stores, then held to the public schema.
 */
export function resolveProject(references: References, project: ProjectRecord): Project {
  const { cover, presentation, logo, ...fields } = project;
  const logoAsset = logo && asset(references, logo, 'logo');
  return projectSchema.parse({
    ...fields,
    technologies: project.technologies.map((id) => toolOf(references, id)),
    ...(cover && { cover: contentImage(asset(references, cover, 'cover')) }),
    ...(presentation && {
      presentation: contentImage(asset(references, presentation, 'presentation')),
    }),
    ...(logoAsset && {
      logo: {
        src: logoAsset.key,
        width: logoAsset.width,
        height: logoAsset.height,
        ...(logoAsset.variants && { variants: logoAsset.variants }),
        alt: logoAsset.alt,
      },
    }),
  });
}

export function resolveArtwork(references: References, artwork: ArtworkRecord): Artwork {
  return artworkSchema.parse({
    ...artwork,
    image: contentImage(asset(references, artwork.image, 'render')),
    software: artwork.software.map((id) => toolOf(references, id)),
  });
}

export function resolveStackEntry(references: References, entry: StackEntryRecord): StackEntry {
  return stackEntrySchema.parse({ ...entry, tool: toolOf(references, entry.tool) });
}

export interface ContentRecords {
  readonly media: readonly MediaAsset[];
  readonly tools: readonly ToolRecord[];
  readonly stack: readonly StackEntryRecord[];
  readonly projects: readonly ProjectRecord[];
  readonly artworks: readonly ArtworkRecord[];
}

export interface ResolvedContent {
  readonly tools: readonly Tool[];
  readonly stack: readonly StackEntry[];
  readonly projects: readonly Project[];
  readonly artworks: readonly Artwork[];
}

function parsed<T>(schema: z.ZodType<T>, record: T, name: string): T {
  const result = schema.safeParse(record);
  if (result.success) return result.data;
  const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
  throw new Error(`${name} is invalid:\n  ${issues.join('\n  ')}`);
}

function duplicates(keys: readonly string[]): string[] {
  return keys.filter((key, index) => keys.indexOf(key) !== index);
}

/**
 * Every record held to its schema and every reference followed, as the API
 * would serve them: what the seed checks before it writes anything, and what
 * the site's tests read without a server.
 */
export function resolveContent(records: ContentRecords): ResolvedContent {
  const media = records.media.map((m) => parsed(mediaAssetSchema, m, `media ${m.key}`));
  const tools = records.tools.map((t) => parsed(toolRecordSchema, t, `tool ${t.slug}`));
  const stack = records.stack.map((e) =>
    parsed(stackEntryRecordSchema, e, `stack entry ${e.domain} ${e.position}`),
  );
  const projects = records.projects.map((p) => parsed(projectRecordSchema, p, `dev ${p.slug.fr}`));
  const artworks = records.artworks.map((a) => parsed(artworkRecordSchema, a, `cgi ${a.slug.fr}`));

  const repeated = [
    ...duplicates(media.map((m) => m.key)).map((key) => `media ${key}`),
    ...duplicates(tools.map((t) => t.slug)).map((slug) => `tool ${slug}`),
    ...duplicates(stack.map((e) => `${e.domain} ${e.tool}`)).map((s) => `stack tool ${s}`),
    ...duplicates(stack.map((e) => `${e.domain} ${e.position}`)).map((s) => `stack position ${s}`),
  ];
  if (repeated.length > 0) throw new Error(`appears twice: ${repeated.join(', ')}`);

  const references = referencesOf(media, tools);
  return {
    tools: tools.map((tool) => resolveTool(references, tool)),
    stack: stack.map((entry) => resolveStackEntry(references, entry)),
    projects: projects.map((project) => resolveProject(references, project)),
    artworks: artworks.map((artwork) => resolveArtwork(references, artwork)),
  };
}
