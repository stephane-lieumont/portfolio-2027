// Launches `ng serve` in-process, resolving the CLI through Node rather than a
// shell shim. Preview panes and editors spawn this with an absolute node path,
// which is the only reliable way to get the Node 22 this workspace needs.
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(here, '..', 'apps', 'web');

process.chdir(webRoot);
process.argv = [process.argv[0], 'ng', 'serve', ...process.argv.slice(2)];

const require = createRequire(resolve(webRoot, 'package.json'));
await import(require.resolve('@angular/cli/bin/ng.js'));
