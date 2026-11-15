import type { StackEntry, Tool, WorldKey } from '@portfolio/shared-types';

import { STACK, TOOLS } from '@core/data/content/content.generated';
import { inLocale } from '@core/i18n/in-locale.pipe';

/**
 * The stack's names where the mockup groups a tool with its companion. Labels,
 * not content: the tool keeps one name.
 */
const STACK_NAMES: Readonly<Record<string, string>> = {
  rxjs: 'RxJS / Signals',
  dotnet: '.NET / C#',
};

export interface ToolView {
  readonly slug: string;
  readonly label: string;
  /** `url(...)` for a `--mask` custom property, or null when the tool has no mark. */
  readonly mask: string | null;
}

/** A tool as a chip or a mark shows it, in this build's language. */
export function toolView(tool: Tool, names: 'registry' | 'stack' = 'registry'): ToolView {
  return {
    slug: tool.slug,
    label: (names === 'stack' ? STACK_NAMES[tool.slug] : undefined) ?? inLocale(tool.label),
    mask: tool.icon ? `url('${tool.icon.src}')` : null,
  };
}

/** A tool named by slug, as the static world pages still do (their eyebrow). */
export function toolBySlug(slug: string): Tool {
  const tool = TOOLS.find((candidate) => candidate.slug === slug);
  if (!tool) throw new Error(`the content API serves no tool ${slug}`);
  return tool;
}

/** A world's Stack section, in its order. */
export function stackOf(domain: WorldKey): readonly StackEntry[] {
  return STACK.filter((entry) => entry.domain === domain).sort((a, b) => a.position - b.position);
}
