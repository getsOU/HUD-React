import { cp, copyFile } from 'node:fs/promises';
await copyFile('hud.json', 'dist/hud.json');
await copyFile('LICENSE', 'dist/LICENSE');
await copyFile('LICENSING.md', 'dist/LICENSING.md');
await copyFile('THIRD-PARTY-NOTICES.md', 'dist/THIRD-PARTY-NOTICES.md');
await cp('licenses', 'dist/licenses', { recursive: true });
await copyFile('node_modules/he/LICENSE-MIT.txt', 'dist/licenses/he-MIT.txt');
for (const dependency of ['react', 'react-dom', 'scheduler']) {
  await copyFile(`node_modules/${dependency}/LICENSE`, `dist/licenses/${dependency}-MIT.txt`);
}
