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
   * so Angular, .NET and C# are not in it.
   */
  readonly glyph: string | null;
  /**
   * Transparent PNG in `public/logos/`, carried over from the 2022 site — the
   * real brand mark, which is what Stéphane wants shown wherever one exists.
   *
   * Preferred over `glyph` when both are present. The font stays as the
   * fallback because it covers tools the twelve PNGs do not, and neither is
   * required: a tool with neither renders a placeholder rather than a
   * hand-drawn stand-in for a logo everyone recognises.
   */
  readonly logo: string | null;
}

const LOGO = (name: string): string => `/logos/${name}.png`;

/** Development stack. Never mixed with SOFTWARE in a filter or a list. */
export const TECHNOLOGIES = [
  // No glyph in the 2022 font — see RegistryEntry.
  { slug: 'angular', label: 'Angular', glyph: null, logo: null },
  { slug: 'dotnet', label: '.NET', glyph: null, logo: null },
  { slug: 'csharp', label: 'C#', glyph: null, logo: null },
  { slug: 'typescript', label: 'TypeScript', glyph: '\\e927', logo: null },
  { slug: 'react', label: 'React', glyph: '\\e919', logo: LOGO('react') },
  { slug: 'vue', label: 'Vue.js', glyph: '\\e918', logo: LOGO('vue') },
  { slug: 'flutter', label: 'Flutter', glyph: '\\e917', logo: LOGO('flutter') },
  { slug: 'dart', label: 'Dart', glyph: '\\e915', logo: null },
  { slug: 'node', label: 'Node.js', glyph: '\\e925', logo: LOGO('node') },
  { slug: 'sass', label: 'Sass', glyph: '\\e924', logo: LOGO('sass') },
  { slug: 'webpack', label: 'Webpack', glyph: '\\e91a', logo: LOGO('webpack') },
  { slug: 'javascript', label: 'JavaScript', glyph: '\\e91c', logo: null },
  { slug: 'html', label: 'HTML', glyph: '\\eae4', logo: null },
  { slug: 'php', label: 'PHP', glyph: '\\e91f', logo: null },
  { slug: 'symfony', label: 'Symfony', glyph: '\\e914', logo: null },
  { slug: 'mongodb', label: 'MongoDB', glyph: '\\e91d', logo: null },
  { slug: 'mysql', label: 'MySQL', glyph: '\\e91e', logo: null },
  { slug: 'docker', label: 'Docker', glyph: '\\e926', logo: null },
  { slug: 'git', label: 'Git', glyph: '\\eae7', logo: null },
  { slug: 'github', label: 'GitHub', glyph: '\\eab0', logo: null },
  { slug: 'gitlab', label: 'GitLab', glyph: '\\e913', logo: null },
  { slug: 'jira', label: 'Jira', glyph: '\\e921', logo: null },
  { slug: 'confluence', label: 'Confluence', glyph: '\\e920', logo: null },
  { slug: 'figma', label: 'Figma', glyph: '\\e922', logo: null },
  { slug: 'xd', label: 'Adobe XD', glyph: '\\e923', logo: null },
  { slug: 'postman', label: 'Postman', glyph: '\\e916', logo: null },
] as const satisfies readonly RegistryEntry[];

/** 3D software. A separate vocabulary, never shown beside TECHNOLOGIES. */
export const SOFTWARE = [
  { slug: 'zbrush', label: 'ZBrush', glyph: '\\e904', logo: LOGO('zbrush') },
  { slug: '3dsmax', label: '3ds Max', glyph: '\\e900', logo: LOGO('3dsmax') },
  { slug: 'vray', label: 'V-Ray', glyph: '\\e903', logo: LOGO('vray') },
  { slug: 'corona', label: 'Corona', glyph: '\\e909', logo: null },
  {
    slug: 'substance-painter',
    label: 'Substance Painter',
    glyph: '\\e908',
    logo: LOGO('substance-painter'),
  },
  { slug: 'substance-designer', label: 'Substance Designer', glyph: '\\e907', logo: null },
  { slug: 'photoshop', label: 'Photoshop', glyph: '\\e902', logo: LOGO('photoshop') },
  { slug: 'illustrator', label: 'Illustrator', glyph: '\\e901', logo: LOGO('illustrator') },
  { slug: 'after-effect', label: 'After Effects', glyph: '\\e906', logo: null },
  { slug: 'premiere', label: 'Premiere', glyph: '\\e905', logo: null },
] as const satisfies readonly RegistryEntry[];

export type TechnologySlug = (typeof TECHNOLOGIES)[number]['slug'];
export type SoftwareSlug = (typeof SOFTWARE)[number]['slug'];

export function technologyOf(slug: TechnologySlug): RegistryEntry {
  return TECHNOLOGIES.find((t) => t.slug === slug)!;
}

export function softwareOf(slug: SoftwareSlug): RegistryEntry {
  return SOFTWARE.find((s) => s.slug === slug)!;
}
