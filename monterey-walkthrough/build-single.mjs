// Bundles index.html + css + js + assets into one self-contained HTML file (images as data URIs).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(join(root, p), 'utf8');
const dataUri = (p) => `data:image/jpeg;base64,${readFileSync(join(root, p)).toString('base64')}`;

let html = read('index.html');
let css = read('css/style.css');
let house = read('js/house.js');
let app = read('js/app.js');

// inline image assets referenced by the scripts
for (const src of [house, app]) {
  const matches = src.matchAll(/assets\/[\w\-/]+\.jpg/g);
  for (const m of matches) {
    const p = m[0];
    const uri = dataUri(p);
    house = house.split(p).join(uri);
    app = app.split(p).join(uri);
  }
}
html = html
  .replace(/<link rel="stylesheet" href="css\/style.css">/, `<style>\n${css}\n</style>`)
  .replace(/<script src="js\/house.js"><\/script>/, `<script>\n${house}\n</script>`)
  .replace(/<script src="js\/app.js"><\/script>/, `<script>\n${app}\n</script>`);

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist', 'monterey-walkthrough.html'), html);
console.log('wrote dist/monterey-walkthrough.html', (html.length / 1024 / 1024).toFixed(2), 'MB');
