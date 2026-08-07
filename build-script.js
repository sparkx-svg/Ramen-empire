#!/usr/bin/env node
/**
 * Concatenate js/01-*.js … js/04-*.js into script.js (single IIFE for production).
 * Usage: node build-script.js
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const jsDir = join(__dirname, 'js');
const files = readdirSync(jsDir)
  .filter(f => /^\d{2}-.*\.js$/.test(f))
  .sort();

if (files.length < 4) {
  console.error('Expected numbered js/0N-*.js parts, found:', files);
  process.exit(1);
}

const stripBanner = (src) => {
  // Remove the leading /** ... */ block if present
  if (src.startsWith('/**')) {
    const end = src.indexOf('*/');
    if (end !== -1) return src.slice(end + 2).replace(/^\s*\n/, '');
  }
  return src;
};

let body = '';
for (const f of files) {
  body += stripBanner(readFileSync(join(jsDir, f), 'utf8'));
  if (!body.endsWith('\n')) body += '\n';
}

const out = `(function(){\n  "use strict";\n\n` + body + `\n})();\n`;
writeFileSync(join(__dirname, 'script.js'), out);
console.log('Wrote script.js from:', files.join(', '));
console.log('Size:', out.length, 'bytes');
