// Copies the production build (app/dist) to /site at the root of the repository: the folder
// that is uploaded to GitHub and served by GitHub Pages. /site is generated; do not edit it.
// Code written with AI assistance (Claude) for team RAACK.
import { cpSync, existsSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(app, 'dist');
const site = join(app, '..', 'site');
if (!existsSync(join(dist, 'index.html'))) throw new Error('Run "npm run build" first: app/dist/index.html is missing.');

rmSync(site, { recursive: true, force: true });
cpSync(dist, site, { recursive: true });
writeFileSync(
  join(site, 'README.md'),
  [
    '# Trend Detective · built site',
    '',
    'This folder is the static site that GitHub Pages serves. It is generated: do not edit it by hand.',
    'Source code, data scripts and tests are in [`app/`](../app/README.md). To rebuild it, run `npm run site` inside `app/`.',
    '',
    'Not an official NASA product.',
    ''
  ].join('\n')
);

// GitHub Pages passes a site through Jekyll unless it finds this file. The built site needs no
// processing, and with the file the folder can also be published on its own (a gh-pages branch).
writeFileSync(join(site, '.nojekyll'), '');

const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else files.push(`${relative(site, p)} (${(statSync(p).size / 1024).toFixed(0)} kB)`);
  }
})(site);
console.log(`site/: ${files.length} files\n  ${files.join('\n  ')}`);
