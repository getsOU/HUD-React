import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { unzipSync } from 'fflate';

const root = fileURLToPath(new URL('../', import.meta.url));
const version = '0.2.0-preview.4';
const packageHash = 'a403a12ab076e3aef341777ee724f66d51e7a530e540193a5ab1308848c56fd9';
const packageUrl = `https://api.nuget.org/v3-flatcontainer/sou.hud.templates/${version}/sou.hud.templates.${version}.nupkg`;
const entries = [
  'contracts.d.ts', 'contracts.js', 'package.json', 'sou-hud.d.ts', 'sou-hud.js',
  'vendor/LICENSE-signalr.txt', 'vendor/NOTICE.md', 'vendor/signalr.min.js',
];
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

async function download() {
  const response = await fetch(packageUrl);
  if (!response.ok) throw new Error(`NuGet download failed: HTTP ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (sha256(bytes) !== packageHash) throw new Error('NuGet package SHA-256 does not match the pinned public release.');
  return unzipSync(bytes);
}

const archive = await download();
const files = entries.map(name => [
  `content/templates/web/wwwroot/sdk/${name}`, `public/sdk/${name}`,
]);
files.push(['content/templates/web/LICENSE', 'licenses/SOU-SDK-MIT.txt']);
for (const [source, target] of files) {
  const bytes = archive[source];
  if (!bytes) throw new Error(`Missing public SDK file: ${source}`);
  const destination = resolve(root, target);
  if (process.argv.includes('--verify')) {
    if (sha256(await readFile(destination)) !== sha256(bytes)) throw new Error(`SDK file changed: ${target}`);
  } else {
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, bytes);
  }
}
console.log(`Verified ${files.length} unchanged files from SOU.Hud.Templates ${version}.`);
