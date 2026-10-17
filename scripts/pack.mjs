import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

function dotnet(args) {
  const result = spawnSync('dotnet', args, { stdio: 'inherit', shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
const manifest = JSON.parse(await readFile('hud.json', 'utf8'));
const filename = `${manifest.id}-${manifest.version}.souhud`;
const artifact = `artifacts/${filename}`;
await mkdir('artifacts', { recursive: true });
dotnet(['tool', 'restore']);
dotnet(['tool', 'run', 'sou-hud', '--', 'pack', 'dist', artifact]);
dotnet(['tool', 'run', 'sou-hud', '--', 'validate', artifact]);
const hash = createHash('sha256').update(await readFile(artifact)).digest('hex');
await writeFile(`${artifact}.sha256`, `${hash}  ${filename}\n`);
console.log(`SHA-256 ${hash}`);
