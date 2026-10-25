// Draws the icon (a filled-in form: three white bars, long to short, and a check, on a rounded square in the
// interface accent) as PNGs: the Forest green in
// public/icon/ and the store folder, and one set per other colour palette in public/icon/<palette>/, which the
// toolbar button and page logos switch to.
// Run with `node scripts/make-icons.mjs`; no image libraries needed.
import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const SIZES = [16, 32, 48, 96, 128];
/** The light-mode accent of each palette, as in PALETTES (src/ui/palette.ts). Forest is the default icon. */
const ACCENTS = {
  forest: '#1f6b4f',
  ocean: '#24569c',
  plum: '#6b3d8f',
  clay: '#a3471f',
  graphite: '#26262b',
};
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
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

// The bars sit on a 16-step grid (every icon size is a multiple of 16), so their edges land on whole pixels and
// stay sharp in the toolbar. Each bar is a capsule: the segment between its end centres, widened by BAR.
const BAR = 1 / 16;
const BARS = [
  [
    [0.25, 0.25],
    [0.75, 0.25],
  ],
  [
    [0.25, 0.5],
    [0.5, 0.5],
  ],
  [
    [0.25, 0.75],
    [0.375, 0.75],
  ],
];
const CHECK = [
  [0.52, 0.69],
  [0.62, 0.79],
  [0.81, 0.56],
];

function onMark(x, y, size) {
  if (BARS.some(([a, b]) => distanceToSegment(x, y, a, b) <= BAR)) return true;
  const half = Math.max(BAR, 1.2 / size);
  return distanceToSegment(x, y, CHECK[0], CHECK[1]) <= half || distanceToSegment(x, y, CHECK[1], CHECK[2]) <= half;
}

/** Draws the icon at `size` pixels on `background`, leaving `padding` transparent pixels on every side. */
function render(size, background, padding = 0) {
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
          if (onMark(x, y, art)) white++;
        }
      }
      const i = (py * size + px) * 4;
      const w = cover ? white / cover : 0;
      for (let c = 0; c < 3; c++) rgba[i + c] = Math.round(background[c] * (1 - w) + 255 * w);
      rgba[i + 3] = Math.round((cover / SAMPLES ** 2) * 255);
    }
  }
  return png(size, rgba);
}

for (const [palette, accent] of Object.entries(ACCENTS)) {
  const dir = palette === 'forest' ? '../public/icon/' : `../public/icon/${palette}/`;
  mkdirSync(new URL(dir, import.meta.url), { recursive: true });
  for (const size of SIZES) writeFileSync(new URL(`${dir}${size}.png`, import.meta.url), render(size, rgb(accent)));
  console.log(`Wrote ${SIZES.map((s) => `${s}.png`).join(', ')} to ${dir.slice(3)}`);
}

// The Chrome Web Store wants 96 px of artwork centred in a 128 px square.
mkdirSync(new URL('../store/chrome/', import.meta.url), { recursive: true });
writeFileSync(new URL('../store/chrome/icon-128.png', import.meta.url), render(128, rgb(ACCENTS.forest), 16));
console.log('Wrote store/chrome/icon-128.png');
