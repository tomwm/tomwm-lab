// Copies smile's static files into ../../dist/smile/
// Injects <base href="/smile/"> so assets resolve correctly when served at /smile.
// The source index.html is left clean so local dev (python3 -m http.server) still works.

import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = join(__dirname, '../../dist/smile');

mkdirSync(out, { recursive: true });

// Inject base tag into index.html
const html = readFileSync(join(__dirname, 'index.html'), 'utf8')
  .replace('<meta charset="UTF-8" />', '<meta charset="UTF-8" />\n  <base href="/smile/">');
writeFileSync(join(out, 'index.html'), html);

// Copy remaining static files
const files = ['app.js', 'audio-engine.js', 'hand-engine.js', 'harmony-engine.js', 'voice-synth.js'];
for (const f of files) cpSync(join(__dirname, f), join(out, f));
cpSync(join(__dirname, 'weights'), join(out, 'weights'), { recursive: true });

console.log('smile built → dist/smile');
