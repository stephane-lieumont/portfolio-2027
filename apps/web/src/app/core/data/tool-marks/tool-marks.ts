import {
  SOFTWARE,
  type SoftwareSlug,
  type TechnologySlug,
  softwareOf,
  technologyOf,
} from '@portfolio/shared-types/registries';

export type ToolSlug = TechnologySlug | SoftwareSlug;

const simpleIcon = (name: string): string => `/logos/simple-icons/${name}.svg`;

/**
 * Each tool's mark, drawn as a CSS mask in the world's ink: Simple Icons for
 * the code stack and Photoshop, the 2022 PNGs for the 3D tools (as on the
 * mockup). File names are Simple Icons' slugs, not the registry's — see
 * public/logos/simple-icons/README.md. A tool missing here shows its name only.
 */
const MARKS: Partial<Record<ToolSlug, string>> = {
  angular: simpleIcon('angular'),
  typescript: simpleIcon('typescript'),
  rxjs: simpleIcon('reactivex'),
  dotnet: simpleIcon('dotnet'),
  react: simpleIcon('react'),
  docker: simpleIcon('docker'),
  git: simpleIcon('git'),
  aws: simpleIcon('amazonwebservices'),
  'claude-code': simpleIcon('claude'),
  flutter: simpleIcon('flutter'),
  dart: simpleIcon('dart'),
  node: simpleIcon('nodedotjs'),
  webpack: simpleIcon('webpack'),
  javascript: simpleIcon('javascript'),
  sass: simpleIcon('sass'),
  photoshop: simpleIcon('adobephotoshop'),
  '3dsmax': '/logos/3dsmax.png',
  vray: '/logos/vray.png',
  zbrush: '/logos/zbrush.png',
  'substance-painter': '/logos/substance-painter.png',
  illustrator: '/logos/illustrator.png',
};

/**
 * The stack's names where the mockup groups a tool with its companion. Labels,
 * not content: the registry keeps one name per tool.
 */
const STACK_NAMES: Partial<Record<ToolSlug, string>> = {
  rxjs: 'RxJS / Signals',
  dotnet: '.NET / C#',
};

export interface ToolView {
  readonly slug: ToolSlug;
  readonly label: string;
  /** `url(...)` for a `--mask` custom property, or null when the tool has no mark. */
  readonly mask: string | null;
}

function isSoftware(slug: ToolSlug): slug is SoftwareSlug {
  return SOFTWARE.some((s) => s.slug === slug);
}

export function toolView(slug: ToolSlug, names: 'registry' | 'stack' = 'registry'): ToolView {
  const entry = isSoftware(slug) ? softwareOf(slug) : technologyOf(slug);
  const mark = MARKS[slug];
  return {
    slug,
    label: (names === 'stack' ? STACK_NAMES[slug] : undefined) ?? entry.label,
    mask: mark ? `url('${mark}')` : null,
  };
}
