// Copies smile's static files into ../../dist/smile/
// No bundler needed — plain HTML/JS.

import { cpSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = join(__dirname, '../../dist/smile');

mkdirSync(out, { recursive: true });

const files = [
  'index.html',
  'app.js',
  'audio-engine.js',
  'hand-engine.js',
  'harmony-engine.js',
  'voice-synth.js',
];

for (const f of files) cpSync(join(__dirname, f), join(out, f));
cpSync(join(__dirname, 'weights'), join(out, 'weights'), { recursive: true });

console.log('smile built → dist/smile');
