// Génère des packshots épurés (fond #FAF9F5) via AIML API — google/nano-banana-pro-edit
// Usage : node packshots.cjs <projectDir> <outDir> <id> [<id> ...]
const fs = require('fs');
const path = require('path');

const [projectDir, outDir, ...ids] = process.argv.slice(2);
const sharp = require(path.join(projectDir, 'node_modules', 'sharp'));
const KEY = process.env.AIMLAPI_KEY;
if (!KEY) throw new Error('AIMLAPI_KEY manquante');

const SOURCES = {
  'serum-anti-taches': 'images/serum-anti-taches.webp',
  'creme-solaire': '../sunscream-banner.webp',
  'img-14': 'images/img-14.webp',
  'img-15': 'images/img-15.webp',
  'img-16': 'images/img-16.webp',
  'img-17': 'images/img-17.webp',
  'img-19': 'images/img-19.webp',
  'img-20': 'images/img-20.webp',
  'img-21': 'images/img-21.webp',
  'img-22': 'images/img-22.webp',
  'carte-cadeau': '../Card_banner-01_2.webp',
};

const EXTRA = {
  'serum-anti-taches': 'Keep only the small amber serum bottle with the white cap and its two boxes (the white "WHITENER" box and the golden box) standing side by side.',
  'creme-solaire': 'Keep only the sunscreen box and the white sunscreen bottle standing side by side; drop every illustration, sun, leaf and text from the banner.',
  'img-16': 'This is a black charcoal soap / black soap texture: show it as a neat rounded scoop of black soap paste in a small simple white ceramic dish, nothing else.',
  'carte-cadeau': 'Keep only the three gift cards (25, 50 and 100 euros) slightly fanned out and standing upright, drop all banner text, ribbons and decorations.',
};

const BASE_PROMPT = [
  'Clean e-commerce packshot of the exact same skincare product(s) shown in the reference image.',
  'Keep the packaging shape, labels, logo, colors and printed text exactly identical to the reference — do not invent or change any text.',
  'Remove every prop: no plants, flowers, towels, trays, pedestals, marble, furniture, windows or bathroom background.',
  'Product centered, upright, front-facing, filling about 60% of the frame height, with generous empty margins.',
  'Seamless solid flat background in the exact color #FAF9F5 (warm off-white), edge to edge, no gradient, no horizon line.',
  'Soft diffused studio light from the upper left, with one soft subtle contact shadow falling to the lower right.',
  'Minimalist high-end skincare product photography, photorealistic, sharp focus, no added text, no watermark.',
].join(' ');

async function toDataUrl(file) {
  const buf = await sharp(path.join(projectDir, file)).resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).png().toBuffer();
  return 'data:image/png;base64,' + buf.toString('base64');
}

async function generate(id) {
  const prompt = BASE_PROMPT + (EXTRA[id] ? ' ' + EXTRA[id] : '');
  const res = await fetch('https://api.aimlapi.com/v1/images/generations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/nano-banana-pro-edit',
      image_urls: [await toDataUrl(SOURCES[id])],
      prompt,
      aspect_ratio: '4:5',
      resolution: '1K',
      num_images: 1,
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${id}: HTTP ${res.status} ${text.slice(0, 300)}`);
  const data = JSON.parse(text);
  const url = data?.data?.[0]?.url;
  if (!url) throw new Error(`${id}: pas d'image ${text.slice(0, 300)}`);
  const img = Buffer.from(await (await fetch(url)).arrayBuffer());
  const out = path.join(outDir, `packshot-${id}.png`);
  fs.writeFileSync(out, img);
  const meta = await sharp(img).metadata();
  console.log(`${id}: OK ${meta.width}x${meta.height} -> ${out}`);
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const results = await Promise.allSettled(ids.map(generate));
  results.forEach(r => { if (r.status === 'rejected') console.log('ERREUR', r.reason.message); });
})();
