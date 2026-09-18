// Usage: node scripts/install-logo.mjs path/to/supplied-green-icon.svg
// Copies the supplied icon without recoloring, cropping, stretching, or redrawing.
import { readFile, writeFile, copyFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const supplied = process.argv[2];
if (!supplied || path.extname(supplied).toLowerCase() !== '.svg') throw new Error('Provide the original green icon SVG path.');
const svg = await readFile(supplied, 'utf8');
if (!svg.includes('<svg')) throw new Error('Expected an SVG file.');
await mkdir(path.join(root, 'assets/logos'), {recursive:true});
await copyFile(supplied, path.join(root, 'assets/logos/green-app-icon.svg'));
const file = path.join(root, 'index.html');
let html = await readFile(file, 'utf8');
const tag = '<link rel="icon" type="image/svg+xml" href="assets/logos/green-app-icon.svg">';
if (!html.includes(tag)) html = html.replace('</head>', `  ${tag}\n</head>`);
await writeFile(file, html);
console.log('Original green icon installed as favicon.');
