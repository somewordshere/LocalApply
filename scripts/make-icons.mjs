// Draws the icon (white check on a deep green rounded square, the interface accent) as PNGs in public/icon/ and the store folder.
// Run with `node scripts/make-icons.mjs`; no image libraries needed.
import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const SIZES = [16, 32, 48, 96, 128];
const BACKGROUND = [31, 107, 79];
const SAMPLES = 4;

function crc32(buf) {
  let c = ~0;
  for (const byte of buf) {
    c ^= byte;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

function png(size, rgba) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header.set([8, 6, 0, 0, 0], 8);
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function insideRoundedRect(x, y) {
  const r = 0.22;
  const cx = Math.min(Math.max(x, r), 1 - r);
  const cy = Math.min(Math.max(y, r), 1 - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

function distanceToSegment(px, py, [ax, ay], [bx, by]) {
  const t = Math.max(
    0,
    Math.min(1, ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2)),
  );
  return Math.hypot(px - (ax + t * (bx - ax)), py - (ay + t * (by - ay)));
}

const CHECK = [
  [0.27, 0.52],
  [0.43, 0.68],
  [0.74, 0.34],
];

function onCheck(x, y, size) {
  const half = Math.max(0.065, 1.2 / size);
  return distanceToSegment(x, y, CHECK[0], CHECK[1]) <= half || distanceToSegment(x, y, CHECK[1], CHECK[2]) <= half;
}

/** Draws the icon at `size` pixels, leaving `padding` transparent pixels on every side. */
function render(size, padding = 0) {
  const art = size - 2 * padding;
  const rgba = Buffer.alloc(size * size * 4);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let cover = 0;
      let white = 0;
      for (let sy = 0; sy < SAMPLES; sy++) {
        for (let sx = 0; sx < SAMPLES; sx++) {
          const x = (px - padding + (sx + 0.5) / SAMPLES) / art;
          const y = (py - padding + (sy + 0.5) / SAMPLES) / art;
          if (x < 0 || y < 0 || x > 1 || y > 1 || !insideRoundedRect(x, y)) continue;
          cover++;
          if (onCheck(x, y, art)) white++;
        }
      }
      const i = (py * size + px) * 4;
      const w = cover ? white / cover : 0;
      for (let c = 0; c < 3; c++) rgba[i + c] = Math.round(BACKGROUND[c] * (1 - w) + 255 * w);
      rgba[i + 3] = Math.round((cover / SAMPLES ** 2) * 255);
    }
  }
  return png(size, rgba);
}

mkdirSync(new URL('../public/icon/', import.meta.url), { recursive: true });
for (const size of SIZES) writeFileSync(new URL(`../public/icon/${size}.png`, import.meta.url), render(size));
console.log(`Wrote ${SIZES.map((s) => `${s}.png`).join(', ')} to public/icon/`);

// The Chrome Web Store wants 96 px of artwork centred in a 128 px square.
mkdirSync(new URL('../store/chrome/', import.meta.url), { recursive: true });
writeFileSync(new URL('../store/chrome/icon-128.png', import.meta.url), render(128, 16));
console.log('Wrote store/chrome/icon-128.png');
