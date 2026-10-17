import { cp, copyFile } from 'node:fs/promises';
await copyFile('hud.json', 'dist/hud.json');
await copyFile('LICENSE', 'dist/LICENSE');
await copyFile('THIRD-PARTY-NOTICES.md', 'dist/THIRD-PARTY-NOTICES.md');
await cp('licenses', 'dist/licenses', { recursive: true });
for (const dependency of ['react', 'react-dom', 'scheduler']) {
  await copyFile(`node_modules/${dependency}/LICENSE`, `dist/licenses/${dependency}-MIT.txt`);
}
