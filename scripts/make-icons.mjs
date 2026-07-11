// Zero-dependency PWA icon generator (solid navy tile + coral forward chevrons).
// Emits valid PNGs via node:zlib. Replace with official brand icons when supplied.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

function png(size, draw) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1);
    raw[row] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = draw(x, y, size);
      const o = row + 1 + x * 4;
      raw[o] = r;
      raw[o + 1] = g;
      raw[o + 2] = b;
      raw[o + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const NAVY = [11, 18, 32, 255];
const CORAL = [255, 90, 60, 255];
const AMBER = [255, 209, 102, 255];

// Two forward-leaning chevrons = motion. u,v are 0..1 coordinates.
function inChevron(u, v, x0, w) {
  const t = 0.16; // stroke thickness
  const d = Math.abs(v - 0.5); // distance from vertical centre
  const edge = x0 + d * 0.55; // lean back as we leave the centre line
  return u >= edge && u <= edge + w && v >= 0.18 && v <= 0.82;
}

function makeIcon(size, { maskable = false } = {}) {
  const pad = maskable ? 0 : Math.round(size * 0.06);
  const radius = maskable ? 0 : size * 0.22;
  return png(size, (x, y) => {
    // rounded-square tile (skip rounding for maskable: full bleed)
    if (!maskable) {
      const rx = Math.max(pad + radius - x, x - (size - 1 - pad - radius), 0);
      const ry = Math.max(pad + radius - y, y - (size - 1 - pad - radius), 0);
      if (x < pad || y < pad || x >= size - pad || y >= size - pad) return [0, 0, 0, 0];
      if (rx * rx + ry * ry > radius * radius) return [0, 0, 0, 0];
    }
    const u = (x - pad) / (size - 2 * pad);
    const v = (y - pad) / (size - 2 * pad);
    if (inChevron(u, v, 0.24, 0.14)) return CORAL;
    if (inChevron(u, v, 0.52, 0.14)) return AMBER;
    return NAVY;
  });
}

mkdirSync(new URL('../public/icons/', import.meta.url), { recursive: true });
writeFileSync(new URL('../public/icons/icon-192.png', import.meta.url), makeIcon(192));
writeFileSync(new URL('../public/icons/icon-512.png', import.meta.url), makeIcon(512));
writeFileSync(
  new URL('../public/icons/maskable-512.png', import.meta.url),
  makeIcon(512, { maskable: true })
);
writeFileSync(new URL('../public/icons/apple-touch-icon.png', import.meta.url), makeIcon(180));
console.log('icons written to public/icons/');
