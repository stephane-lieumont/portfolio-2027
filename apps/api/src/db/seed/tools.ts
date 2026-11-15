import type { ToolRecord } from '@portfolio/shared-types/tool';

import { mediaId } from './media.ts';

/**
 * The dev and 3D tools projects and pieces are credited with (spec 04 §2),
 * by id. Icons are Simple Icons for the code stack and Photoshop
 * (public/logos/simple-icons/README.md), the 2022 PNGs for the 3D tools,
 * and public/logos/other/ for marks Simple Icons lacks; React Native has no
 * mark of its own and shows React's. A tool without an icon shows its name.
 */
export const TOOLS: readonly ToolRecord[] = [
  {
    id: '410e1559-12eb-494d-9558-d2f5795d9280',
    slug: 'angular',
    label: { fr: 'Angular', en: 'Angular' },
    icon: mediaId('/logos/simple-icons/angular.svg'),
  },
  {
    id: 'c33345d3-638e-48b0-bd4a-da945c3327cd',
    slug: 'dotnet',
    label: { fr: '.NET', en: '.NET' },
    icon: mediaId('/logos/simple-icons/dotnet.svg'),
  },
  {
    id: 'ca5ede49-34b6-4d63-bcb3-8bbfb579ec4a',
    slug: 'csharp',
    label: { fr: 'C#', en: 'C#' },
    icon: null,
  },
  {
    id: '65b91011-9764-483d-aeca-c4457bfd178b',
    slug: 'rxjs',
    label: { fr: 'RxJS', en: 'RxJS' },
    icon: mediaId('/logos/simple-icons/reactivex.svg'),
  },
  {
    id: '804d4584-2f96-423b-b190-d8b74345b5bc',
    slug: 'aws',
    label: { fr: 'AWS', en: 'AWS' },
    icon: mediaId('/logos/simple-icons/amazonwebservices.svg'),
  },
  {
    id: '347bb62d-d853-4775-9439-ee79214dbafb',
    slug: 'claude-code',
    label: { fr: 'Claude Code', en: 'Claude Code' },
    icon: mediaId('/logos/simple-icons/claude.svg'),
  },
  {
    id: '66427909-69a0-4f30-9caf-64a1dd4a7e5f',
    slug: 'typescript',
    label: { fr: 'TypeScript', en: 'TypeScript' },
    icon: mediaId('/logos/simple-icons/typescript.svg'),
  },
  {
    id: 'cfd101a3-b57e-4284-b0e6-d967b001890e',
    slug: 'react',
    label: { fr: 'React', en: 'React' },
    icon: mediaId('/logos/simple-icons/react.svg'),
  },
  {
    id: '66342c4b-403b-4ffb-9e24-c98dc5ae49db',
    slug: 'react-native',
    label: { fr: 'React Native', en: 'React Native' },
    icon: mediaId('/logos/simple-icons/react.svg'),
  },
  {
    id: '87da8d2d-be79-4b5b-83e5-0ceeb375fc2b',
    slug: 'nextjs',
    label: { fr: 'Next.js', en: 'Next.js' },
    icon: mediaId('/logos/simple-icons/nextdotjs.svg'),
  },
  {
    id: 'fd111701-19df-4ebc-9f9e-e43eb313340c',
    slug: 'nginx',
    label: { fr: 'Nginx', en: 'Nginx' },
    icon: mediaId('/logos/simple-icons/nginx.svg'),
  },
  {
    id: '5f0461d6-71f1-4e15-ba0b-5263d0fbaa1b',
    slug: 'helm',
    label: { fr: 'Helm', en: 'Helm' },
    icon: mediaId('/logos/simple-icons/helm.svg'),
  },
  {
    id: '7b0d7525-e548-4f63-aea5-4665ae734378',
    slug: 'azure',
    label: { fr: 'Azure', en: 'Azure' },
    icon: mediaId('/logos/other/microsoftazure.svg'),
  },
  {
    id: '625f33a1-10c5-4c96-b04e-a78acb68742e',
    slug: 'ci-cd',
    label: { fr: 'CI/CD', en: 'CI/CD' },
    icon: mediaId('/logos/other/infinity.svg'),
  },
  {
    id: '707366b5-db7c-4643-b8f7-5196ea37cdf7',
    slug: 'azure-devops',
    label: { fr: 'Azure DevOps', en: 'Azure DevOps' },
    icon: mediaId('/logos/other/azuredevops.svg'),
  },
  {
    id: '1f926852-2486-4be5-998f-5589a65731fb',
    slug: 'sonarqube',
    label: { fr: 'SonarQube', en: 'SonarQube' },
    icon: mediaId('/logos/simple-icons/sonarqube.svg'),
  },
  {
    id: '96494711-6b2e-4ab7-86f3-bc3040cbc275',
    slug: 'unit-tests',
    label: { fr: 'Tests unitaires', en: 'Unit tests' },
    icon: mediaId('/logos/other/flask-conical.svg'),
  },
  {
    id: 'aea3091d-a019-4e00-b7ac-3ac49b2ddb04',
    slug: 'python',
    label: { fr: 'Python', en: 'Python' },
    icon: mediaId('/logos/simple-icons/python.svg'),
  },
  {
    id: '9250fa2e-3dcf-42a3-8c26-409a75794ed8',
    slug: 'datadog',
    label: { fr: 'Datadog', en: 'Datadog' },
    icon: mediaId('/logos/simple-icons/datadog.svg'),
  },
  {
    id: '238e80d5-0d27-4480-960c-a45fc41337e9',
    slug: 'terraform',
    label: { fr: 'Terraform', en: 'Terraform' },
    icon: mediaId('/logos/simple-icons/terraform.svg'),
  },
  {
    id: 'e6629f8d-c5e4-4766-b036-3f77c290a6b9',
    slug: 'redux',
    label: { fr: 'Redux', en: 'Redux' },
    icon: mediaId('/logos/simple-icons/redux.svg'),
  },
  {
    id: '7f35ccd0-319f-447b-aee7-d339f0806b55',
    slug: 'android',
    label: { fr: 'Android', en: 'Android' },
    icon: mediaId('/logos/simple-icons/android.svg'),
  },
  {
    id: 'fa217611-aa96-4e88-a7f0-4f87733ad1cd',
    slug: 'ios',
    label: { fr: 'iOS', en: 'iOS' },
    icon: mediaId('/logos/simple-icons/ios.svg'),
  },
  {
    id: 'ec5d1f6b-0846-4c19-85c8-62560d7931be',
    slug: 'google-play-console',
    label: { fr: 'Google Play Console', en: 'Google Play Console' },
    icon: mediaId('/logos/simple-icons/googleplay.svg'),
  },
  {
    id: 'b2308251-1c82-484a-b24e-f1fed2a1f8d1',
    slug: 'testflight',
    label: { fr: 'TestFlight', en: 'TestFlight' },
    icon: mediaId('/logos/other/appstore.svg'),
  },
  {
    id: '98d841a6-8ca7-4d12-8825-04c6ec91a216',
    slug: 'google-analytics',
    label: { fr: 'Google Analytics', en: 'Google Analytics' },
    icon: mediaId('/logos/simple-icons/googleanalytics.svg'),
  },
  {
    id: '2d9d51da-0703-41c0-8ccf-9264a5418853',
    slug: 'segment',
    label: { fr: 'Segment', en: 'Segment' },
    icon: mediaId('/logos/other/segment.svg'),
  },
  {
    id: '05be6d40-4a8f-4543-9e8a-1b926abb335b',
    slug: 'vue',
    label: { fr: 'Vue.js', en: 'Vue.js' },
    icon: null,
  },
  {
    id: 'febf5a83-18bc-4c47-8825-46b9968b1776',
    slug: 'flutter',
    label: { fr: 'Flutter', en: 'Flutter' },
    icon: mediaId('/logos/simple-icons/flutter.svg'),
  },
  {
    id: '5ef5967b-f5d8-4a43-983b-f387719427eb',
    slug: 'dart',
    label: { fr: 'Dart', en: 'Dart' },
    icon: mediaId('/logos/simple-icons/dart.svg'),
  },
  {
    id: '237ea415-49a3-47a6-b6df-da93a8d62e16',
    slug: 'node',
    label: { fr: 'Node.js', en: 'Node.js' },
    icon: mediaId('/logos/simple-icons/nodedotjs.svg'),
  },
  {
    id: 'e04bd8f3-f45f-4ffa-b203-c26687a7976b',
    slug: 'sass',
    label: { fr: 'Sass', en: 'Sass' },
    icon: mediaId('/logos/simple-icons/sass.svg'),
  },
  {
    id: '4d3d1919-8506-4175-bf6c-507198c60ef2',
    slug: 'tailwind',
    label: { fr: 'Tailwind CSS', en: 'Tailwind CSS' },
    icon: mediaId('/logos/simple-icons/tailwindcss.svg'),
  },
  {
    id: '8e60bd4c-b8c1-4b94-83ff-ad0f2a044722',
    slug: 'webpack',
    label: { fr: 'Webpack', en: 'Webpack' },
    icon: mediaId('/logos/simple-icons/webpack.svg'),
  },
  {
    id: 'b451ef74-1862-49bc-93ea-38e32317e0a8',
    slug: 'javascript',
    label: { fr: 'JavaScript', en: 'JavaScript' },
    icon: mediaId('/logos/simple-icons/javascript.svg'),
  },
  {
    id: '552a4e4c-38fb-490a-98f7-e35fdbeb0b3e',
    slug: 'html',
    label: { fr: 'HTML', en: 'HTML' },
    icon: null,
  },
  {
    id: 'b9eee33a-5e2d-4c2a-827c-03dc74ad8f93',
    slug: 'php',
    label: { fr: 'PHP', en: 'PHP' },
    icon: null,
  },
  {
    id: '7b3b59d8-8e55-400c-8c8b-c96b611b5a04',
    slug: 'symfony',
    label: { fr: 'Symfony', en: 'Symfony' },
    icon: null,
  },
  {
    id: '6f69332c-664a-45f5-99d8-63d7da4188e5',
    slug: 'mongodb',
    label: { fr: 'MongoDB', en: 'MongoDB' },
    icon: mediaId('/logos/simple-icons/mongodb.svg'),
  },
  {
    id: '2ada367e-a38c-4cff-9541-fe97b476390b',
    slug: 'mysql',
    label: { fr: 'MySQL', en: 'MySQL' },
    icon: null,
  },
  {
    id: '26b7af48-98f3-4ea6-b5d2-f8e5b4d9b2ea',
    slug: 'docker',
    label: { fr: 'Docker', en: 'Docker' },
    icon: mediaId('/logos/simple-icons/docker.svg'),
  },
  {
    id: 'cbe5203f-2dfc-41e2-8636-9daa13168673',
    slug: 'git',
    label: { fr: 'Git', en: 'Git' },
    icon: mediaId('/logos/simple-icons/git.svg'),
  },
  {
    id: 'd65d6f02-6f06-4a47-be98-73b88c7dd4fb',
    slug: 'github',
    label: { fr: 'GitHub', en: 'GitHub' },
    icon: mediaId('/logos/simple-icons/github.svg'),
  },
  {
    id: 'b89e3a9c-cc3f-4048-b694-626c133f8515',
    slug: 'gitlab',
    label: { fr: 'GitLab', en: 'GitLab' },
    icon: mediaId('/logos/simple-icons/gitlab.svg'),
  },
  {
    id: 'd02a7980-d329-424b-bc47-49efb86adf1b',
    slug: 'jira',
    label: { fr: 'Jira', en: 'Jira' },
    icon: mediaId('/logos/simple-icons/jira.svg'),
  },
  {
    id: 'b0eb6493-1ecc-441b-8cde-74272aa2a90f',
    slug: 'confluence',
    label: { fr: 'Confluence', en: 'Confluence' },
    icon: null,
  },
  {
    id: 'c3548e91-62ba-4176-8183-f710d9e15a41',
    slug: 'figma',
    label: { fr: 'Figma', en: 'Figma' },
    icon: mediaId('/logos/simple-icons/figma.svg'),
  },
  {
    id: 'd1dcef1b-91cc-46c1-8f29-2a8d6fb59a38',
    slug: 'xd',
    label: { fr: 'Adobe XD', en: 'Adobe XD' },
    icon: mediaId('/logos/simple-icons/adobexd.svg'),
  },
  {
    id: 'bd0cbccf-845a-467e-89f3-1e67fe98bc14',
    slug: 'postman',
    label: { fr: 'Postman', en: 'Postman' },
    icon: null,
  },
  {
    id: '3cc794c9-4d9b-4f0f-b028-b41e8e37497b',
    slug: 'zbrush',
    label: { fr: 'ZBrush', en: 'ZBrush' },
    icon: mediaId('/logos/zbrush.png'),
  },
  {
    id: '4a2595e4-175f-420e-ac4f-0cd85a016b7a',
    slug: '3dsmax',
    label: { fr: '3ds Max', en: '3ds Max' },
    icon: mediaId('/logos/3dsmax.png'),
  },
  {
    id: '68bba1af-1f80-4559-a3d6-a38071de9e65',
    slug: 'vray',
    label: { fr: 'V-Ray', en: 'V-Ray' },
    icon: mediaId('/logos/vray.png'),
  },
  {
    id: '0a5f66e0-d550-43e5-8524-7c0c9ef3d3b9',
    slug: 'corona',
    label: { fr: 'Corona', en: 'Corona' },
    icon: null,
  },
  {
    id: '6dd49df4-1a86-44cf-b6fc-59370ce24a4c',
    slug: 'substance-painter',
    label: { fr: 'Substance Painter', en: 'Substance Painter' },
    icon: mediaId('/logos/substance-painter.png'),
  },
  {
    id: 'de971941-1999-4b9b-86a8-e68dbdfbd0fd',
    slug: 'substance-designer',
    label: { fr: 'Substance Designer', en: 'Substance Designer' },
    icon: null,
  },
  {
    id: '586612f4-629b-485c-8a8e-75aab89a1e59',
    slug: 'photoshop',
    label: { fr: 'Photoshop', en: 'Photoshop' },
    icon: mediaId('/logos/simple-icons/adobephotoshop.svg'),
  },
  {
    id: '51225305-3539-4de4-b1ab-345e5cab33e2',
    slug: 'illustrator',
    label: { fr: 'Illustrator', en: 'Illustrator' },
    icon: mediaId('/logos/illustrator.png'),
  },
  {
    id: 'bb09abef-58b3-4067-8a53-de0dd61d15f8',
    slug: 'after-effect',
    label: { fr: 'After Effects', en: 'After Effects' },
    icon: null,
  },
  {
    id: 'c5a8b248-4b18-4ea8-91c4-8a26b2fa7103',
    slug: 'premiere',
    label: { fr: 'Premiere', en: 'Premiere' },
    icon: null,
  },
];

/** A seeded tool's id, by its slug: works and the Stack name their tools through it. */
export function toolId(slug: string): string {
  const tool = TOOLS.find((candidate) => candidate.slug === slug);
  if (!tool) throw new Error(`no seeded tool ${slug}`);
  return tool.id;
}
