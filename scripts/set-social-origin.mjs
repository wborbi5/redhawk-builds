// Usage: node scripts/set-social-origin.mjs https://your-production-domain.example
// Run after assets/og.png has been replaced with your approved social card.
import {readFile,writeFile,access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const u=new URL(process.argv[2]);
if(u.protocol!=='https:') throw new Error('Use your HTTPS production origin.');
await access(path.join(root,'assets/og.png'));
const file=path.join(root,'index.html');
let html=await readFile(file,'utf8');
html=html.replace(/\s*<meta (?:property="og:(?:url|image|image:width|image:height|image:alt)"|name="twitter:image") [^>]*>/g,'');
html=html.replace('</head>',`  <meta property="og:url" content="${u.origin}/">\n  <meta property="og:image" content="${u.origin}/assets/og.png">\n  <meta property="og:image:width" content="1200">\n  <meta property="og:image:height" content="630">\n  <meta property="og:image:alt" content="Redhawk Builds. Your first build counts. Nov 6–8, 2026, Miami University.">\n  <meta name="twitter:image" content="${u.origin}/assets/og.png">\n</head>`);
await writeFile(file,html);
console.log('Static social metadata configured.');
