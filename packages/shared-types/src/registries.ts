/**
 * Technology and software registries.
 *
 * Typed constants rather than database tables: the glyph lives in an icon font
 * shipped with the app either way, so adding an entry is a commit regardless.
 * Saying so is more honest than pretending it is data (see spec 03).
 *
 * The glyphs come from the 2022 site's icon font, carried over unchanged.
 *
 * Deliberately free of Zod: the browser needs the data and the helpers, not the
 * validation. Keeping the import out means the front end never pulls Zod into
 * its bundle to render a chip. The schemas built from these live next to the
 * entities that use them.
 */
export interface RegistryEntry {
  readonly slug: string;
  readonly label: string;
  /**
   * Codepoint in the `icons` font, as a CSS escape — or `null` where the font
   * has no glyph. It was drawn in 2022 and predates Stéphane's current stack,
   * so Angular and .NET are not in it; those carry an inline SVG instead.
   */
  readonly glyph: string | null;
}

/** Development stack. Never mixed with SOFTWARE in a filter or a list. */
export const TECHNOLOGIES = [
  // No glyph in the 2022 font — see RegistryEntry.
  { slug: 'angular', label: 'Angular', glyph: null },
  { slug: 'dotnet', label: '.NET', glyph: null },
  { slug: 'csharp', label: 'C#', glyph: null },
  { slug: 'typescript', label: 'TypeScript', glyph: '\\e927' },
  { slug: 'react', label: 'React', glyph: '\\e919' },
  { slug: 'vue', label: 'Vue.js', glyph: '\\e918' },
  { slug: 'flutter', label: 'Flutter', glyph: '\\e917' },
  { slug: 'dart', label: 'Dart', glyph: '\\e915' },
  { slug: 'node', label: 'Node.js', glyph: '\\e925' },
  { slug: 'sass', label: 'Sass', glyph: '\\e924' },
  { slug: 'webpack', label: 'Webpack', glyph: '\\e91a' },
  { slug: 'javascript', label: 'JavaScript', glyph: '\\e91c' },
  { slug: 'html', label: 'HTML', glyph: '\\eae4' },
  { slug: 'php', label: 'PHP', glyph: '\\e91f' },
  { slug: 'symfony', label: 'Symfony', glyph: '\\e914' },
  { slug: 'mongodb', label: 'MongoDB', glyph: '\\e91d' },
  { slug: 'mysql', label: 'MySQL', glyph: '\\e91e' },
  { slug: 'docker', label: 'Docker', glyph: '\\e926' },
  { slug: 'git', label: 'Git', glyph: '\\eae7' },
  { slug: 'github', label: 'GitHub', glyph: '\\eab0' },
  { slug: 'gitlab', label: 'GitLab', glyph: '\\e913' },
  { slug: 'jira', label: 'Jira', glyph: '\\e921' },
  { slug: 'confluence', label: 'Confluence', glyph: '\\e920' },
  { slug: 'figma', label: 'Figma', glyph: '\\e922' },
  { slug: 'xd', label: 'Adobe XD', glyph: '\\e923' },
  { slug: 'postman', label: 'Postman', glyph: '\\e916' },
] as const satisfies readonly RegistryEntry[];

/** 3D software. A separate vocabulary, never shown beside TECHNOLOGIES. */
export const SOFTWARE = [
  { slug: 'zbrush', label: 'ZBrush', glyph: '\\e904' },
  { slug: '3dsmax', label: '3ds Max', glyph: '\\e900' },
  { slug: 'vray', label: 'V-Ray', glyph: '\\e903' },
  { slug: 'corona', label: 'Corona', glyph: '\\e909' },
  { slug: 'substance-painter', label: 'Substance Painter', glyph: '\\e908' },
  { slug: 'substance-designer', label: 'Substance Designer', glyph: '\\e907' },
  { slug: 'photoshop', label: 'Photoshop', glyph: '\\e902' },
  { slug: 'illustrator', label: 'Illustrator', glyph: '\\e901' },
  { slug: 'after-effect', label: 'After Effects', glyph: '\\e906' },
  { slug: 'premiere', label: 'Premiere', glyph: '\\e905' },
] as const satisfies readonly RegistryEntry[];

export type TechnologySlug = (typeof TECHNOLOGIES)[number]['slug'];
export type SoftwareSlug = (typeof SOFTWARE)[number]['slug'];

export function technologyOf(slug: TechnologySlug): RegistryEntry {
  return TECHNOLOGIES.find((t) => t.slug === slug)!;
}

export function softwareOf(slug: SoftwareSlug): RegistryEntry {
  return SOFTWARE.find((s) => s.slug === slug)!;
}
