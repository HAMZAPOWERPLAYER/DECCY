/**
 * Generates Decay's visual + audio identity from scratch:
 *   - soft organic glow layers (tinted at runtime, white with alpha)
 *   - fracture overlay used at the "cracking" stage
 *   - app icon / splash / adaptive-icon artwork
 *   - the looping ambient drone used by the optional home-screen sound
 *
 * Run with: node scripts/generate-decay-assets.js
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.join(__dirname, '..');
const IMG_DIR = path.join(ROOT, 'assets', 'images');
const AUD_DIR = path.join(ROOT, 'assets', 'audio');
fs.mkdirSync(IMG_DIR, { recursive: true });
fs.mkdirSync(AUD_DIR, { recursive: true });

/* ------------------------------------------------------------------ PNG -- */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function writePNG(file, w, h, rgba) {
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy
      ? rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
      : Buffer.from(rgba.buffer, rgba.byteOffset + y * stride, stride).copy(
          raw,
          y * (stride + 1) + 1,
        );
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  fs.writeFileSync(file, png);
  console.log(`  ${path.relative(ROOT, file)}  ${w}x${h}  ${(png.length / 1024) | 0} KB`);
}

/* --------------------------------------------------------------- canvas -- */

class Canvas {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.data = Buffer.alloc(w * h * 4);
  }

  composite(x, y, r, g, b, a) {
    if (a <= 0 || x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    const d = this.data;
    const da = d[i + 3] / 255;
    const ao = a + da * (1 - a);
    if (ao <= 0) return;
    const dr = d[i] / 255;
    const dg = d[i + 1] / 255;
    const db = d[i + 2] / 255;
    d[i] = Math.round(((r * a + dr * da * (1 - a)) / ao) * 255);
    d[i + 1] = Math.round(((g * a + dg * da * (1 - a)) / ao) * 255);
    d[i + 2] = Math.round(((b * a + db * da * (1 - a)) / ao) * 255);
    d[i + 3] = Math.round(ao * 255);
  }

  /**
   * Soft radial field with an optional organic (angular) radius wobble.
   * `power` shapes the falloff: higher = tighter core, longer tail.
   */
  glow({ cx, cy, radius, color, alpha, power = 2.4, wobble = [], soft = 1 }) {
    const [r, g, b] = color;
    const reach = radius * (1.6 + soft);
    const x0 = Math.max(0, Math.floor(cx - reach));
    const x1 = Math.min(this.w - 1, Math.ceil(cx + reach));
    const y0 = Math.max(0, Math.floor(cy - reach));
    const y1 = Math.min(this.h - 1, Math.ceil(cy + reach));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dx = x + 0.5 - cx;
        const dy = y + 0.5 - cy;
        const dist = Math.hypot(dx, dy);
        const ang = Math.atan2(dy, dx);
        let wob = 1;
        for (const [k, amp, phase] of wobble) wob += amp * Math.sin(k * ang + phase);
        const rr = radius * wob;
        const t = dist / rr;
        if (t >= 1.6) continue;
        let a = Math.pow(Math.max(0, 1 - Math.min(t, 1)), power);
        if (t > 1) a *= Math.pow(Math.max(0, 1 - (t - 1) / 0.6), 2);
        this.composite(x, y, r, g, b, Math.min(1, a * alpha));
      }
    }
  }

  /** A crisper organic body — the readable silhouette of the companion. */
  body({ cx, cy, radius, color, alpha, wobble = [], softness = 0.22 }) {
    const [r, g, b] = color;
    const reach = radius * 1.6;
    const x0 = Math.max(0, Math.floor(cx - reach));
    const x1 = Math.min(this.w - 1, Math.ceil(cx + reach));
    const y0 = Math.max(0, Math.floor(cy - reach));
    const y1 = Math.min(this.h - 1, Math.ceil(cy + reach));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dx = x + 0.5 - cx;
        const dy = y + 0.5 - cy;
        const dist = Math.hypot(dx, dy);
        const ang = Math.atan2(dy, dx);
        let wob = 1;
        for (const [k, amp, phase] of wobble) wob += amp * Math.sin(k * ang + phase);
        const rr = radius * wob;
        const edge = (dist - rr) / (radius * softness);
        if (edge > 1) continue;
        const shape = 0.5 - 0.5 * Math.tanh(edge * 1.8);
        const core = 1 - 0.55 * Math.pow(Math.min(1, dist / rr), 1.7);
        this.composite(x, y, r, g, b, Math.min(1, shape * core * alpha));
      }
    }
  }

  segment(x1, y1, x2, y2, width, color, alpha) {
    const [r, g, b] = color;
    const minX = Math.max(0, Math.floor(Math.min(x1, x2) - width - 2));
    const maxX = Math.min(this.w - 1, Math.ceil(Math.max(x1, x2) + width + 2));
    const minY = Math.max(0, Math.floor(Math.min(y1, y2) - width - 2));
    const maxY = Math.min(this.h - 1, Math.ceil(Math.max(y1, y2) + width + 2));
    const vx = x2 - x1;
    const vy = y2 - y1;
    const len2 = vx * vx + vy * vy || 1;
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        let t = ((x - x1) * vx + (y - y1) * vy) / len2;
        t = Math.max(0, Math.min(1, t));
        const d = Math.hypot(x - (x1 + t * vx), y - (y1 + t * vy));
        if (d > width * 2.5) continue;
        const a = Math.pow(Math.max(0, 1 - d / (width * 2.5)), 1.6) * alpha;
        this.composite(x, y, r, g, b, a);
      }
    }
  }

  polyline(points, width, color, alpha) {
    for (let i = 1; i < points.length; i++) {
      this.segment(
        points[i - 1][0],
        points[i - 1][1],
        points[i][0],
        points[i][1],
        width,
        color,
        alpha,
      );
    }
  }

  solid(r, g, b, a = 1) {
    for (let i = 0; i < this.data.length; i += 4) {
      this.data[i] = r;
      this.data[i + 1] = g;
      this.data[i + 2] = b;
      this.data[i + 3] = Math.round(a * 255);
    }
  }
}

const WHITE = [1, 1, 1];
const GOLD = [0xe8 / 255, 0xc8 / 255, 0x88 / 255];
const VOID = [0x0b / 255, 0x0d / 255, 0x12 / 255];

const rnd = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/* ------------------------------------------------------------ artwork --- */

function buildGlowLayers() {
  console.log('glow layers');

  // Wide, formless aura — the light that reaches into the dark.
  const bloom = new Canvas(768, 768);
  bloom.glow({
    cx: 384,
    cy: 384,
    radius: 300,
    color: WHITE,
    alpha: 0.95,
    power: 3.1,
    wobble: [
      [3, 0.05, 0.4],
      [5, 0.03, 1.9],
    ],
    soft: 1,
  });
  writePNG(path.join(IMG_DIR, 'glow-bloom.png'), 768, 768, bloom.data);

  // The body: an ambiguous organic form, never quite a circle.
  const body = new Canvas(768, 768);
  body.glow({
    cx: 384,
    cy: 384,
    radius: 250,
    color: WHITE,
    alpha: 0.55,
    power: 4.2,
    wobble: [
      [3, 0.09, 0.4],
      [5, 0.06, 1.7],
      [7, 0.035, 2.6],
    ],
    soft: 0.35,
  });
  body.body({
    cx: 384,
    cy: 384,
    radius: 176,
    color: WHITE,
    alpha: 0.92,
    wobble: [
      [3, 0.1, 0.4],
      [5, 0.07, 1.7],
      [7, 0.04, 2.6],
    ],
    softness: 0.3,
  });
  writePNG(path.join(IMG_DIR, 'glow-body.png'), 768, 768, body.data);

  // Bright centre.
  const core = new Canvas(512, 512);
  core.glow({
    cx: 256,
    cy: 256,
    radius: 132,
    color: WHITE,
    alpha: 1,
    power: 3.4,
    wobble: [
      [3, 0.08, 0.4],
      [5, 0.05, 1.7],
    ],
    soft: 0.5,
  });
  writePNG(path.join(IMG_DIR, 'glow-core.png'), 512, 512, core.data);
}

function buildCracks() {
  console.log('fractures');
  const size = 768;
  const c = new Canvas(size, size);
  const rand = rnd(20260925);
  const cx = size / 2;
  const cy = size / 2;
  const arms = 11;
  for (let i = 0; i < arms; i++) {
    const base = (i / arms) * Math.PI * 2 + rand() * 0.4;
    let ang = base;
    let radius = 40 + rand() * 60;
    let x = cx + Math.cos(ang) * radius * 0.25;
    let y = cy + Math.sin(ang) * radius * 0.25;
    const pts = [[x, y]];
    const steps = 5 + Math.floor(rand() * 4);
    for (let s = 0; s < steps; s++) {
      radius += 24 + rand() * 34;
      ang += (rand() - 0.5) * 0.55;
      x = cx + Math.cos(ang) * radius;
      y = cy + Math.sin(ang) * radius;
      pts.push([x, y]);
    }
    c.polyline(pts, 1.4 + rand() * 1.1, WHITE, 0.42 + rand() * 0.35);
  }
  // two quiet cross fractures so it reads as stress, not a starburst
  for (let i = 0; i < 2; i++) {
    const y = cy + (rand() - 0.5) * 140;
    const pts = [];
    for (let x = cx - 190; x <= cx + 190; x += 38) {
      pts.push([x, y + Math.sin(x * 0.031 + i * 2) * 26 + (rand() - 0.5) * 10]);
    }
    c.polyline(pts, 1.1, WHITE, 0.3);
  }
  writePNG(path.join(IMG_DIR, 'cracks.png'), size, size, c.data);
}

function iconCanvas(size, opts) {
  const c = new Canvas(size, size);
  if (opts.background) c.solid(opts.background[0], opts.background[1], opts.background[2], 1);
  const s = size / 1024;
  const cx = size / 2;
  const cy = size / 2;
  const wobble = [
    [3, 0.1, 0.4],
    [5, 0.07, 1.7],
    [7, 0.04, 2.6],
  ];
  c.glow({
    cx,
    cy,
    radius: opts.bloom * s,
    color: opts.color,
    alpha: opts.bloomAlpha,
    power: 3.2,
    wobble,
    soft: 1,
  });
  c.body({
    cx,
    cy,
    radius: opts.body * s,
    color: opts.color,
    alpha: opts.bodyAlpha,
    wobble,
    softness: 0.3,
  });
  c.glow({
    cx,
    cy,
    radius: opts.core * s,
    color: opts.coreColor || opts.color,
    alpha: opts.coreAlpha,
    power: 3.2,
    wobble,
    soft: 0.5,
  });
  return c;
}

function buildIcons() {
  console.log('icons');
  const icon = iconCanvas(1024, {
    background: VOID,
    color: GOLD,
    bloom: 470,
    bloomAlpha: 0.55,
    body: 250,
    bodyAlpha: 0.85,
    core: 132,
    coreAlpha: 0.95,
    coreColor: [1, 0.96, 0.88],
  });
  writePNG(path.join(IMG_DIR, 'icon.png'), 1024, 1024, icon.data);

  // Android adaptive foreground — content kept inside the ~66% safe circle.
  const fg = iconCanvas(1024, {
    background: null,
    color: GOLD,
    bloom: 330,
    bloomAlpha: 0.5,
    body: 176,
    bodyAlpha: 0.88,
    core: 92,
    coreAlpha: 0.95,
    coreColor: [1, 0.96, 0.88],
  });
  writePNG(path.join(IMG_DIR, 'android-icon-foreground.png'), 1024, 1024, fg.data);

  const bg = new Canvas(1024, 1024);
  bg.solid(0x0b, 0x0d, 0x12, 1);
  writePNG(path.join(IMG_DIR, 'android-icon-background.png'), 1024, 1024, bg.data);

  const mono = iconCanvas(1024, {
    background: null,
    color: [1, 1, 1],
    bloom: 330,
    bloomAlpha: 0.38,
    body: 176,
    bodyAlpha: 1,
    core: 92,
    coreAlpha: 1,
    coreColor: [1, 1, 1],
  });
  writePNG(path.join(IMG_DIR, 'android-icon-monochrome.png'), 1024, 1024, mono.data);

  const splash = iconCanvas(512, {
    background: null,
    color: GOLD,
    bloom: 250,
    bloomAlpha: 0.5,
    body: 136,
    bodyAlpha: 0.9,
    core: 72,
    coreAlpha: 1,
    coreColor: [1, 0.97, 0.9],
  });
  writePNG(path.join(IMG_DIR, 'splash-icon.png'), 512, 512, splash.data);

  const fav = iconCanvas(64, {
    background: VOID,
    color: GOLD,
    bloom: 30,
    bloomAlpha: 0.55,
    body: 17,
    bodyAlpha: 0.9,
    core: 9,
    coreAlpha: 1,
    coreColor: [1, 0.96, 0.88],
  });
  writePNG(path.join(IMG_DIR, 'favicon.png'), 64, 64, fav.data);
}

/* --------------------------------------------------------------- audio --- */

function writeWav(file, samples, sampleRate) {
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    data.writeInt16LE(Math.round(v * 32767), i * 2);
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0, 'latin1');
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8, 'latin1');
  header.write('fmt ', 12, 'latin1');
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36, 'latin1');
  header.writeUInt32LE(data.length, 40);
  fs.writeFileSync(file, Buffer.concat([header, data]));
  console.log(`  ${path.relative(ROOT, file)}  ${(Buffer.byteLength(header) + data.length) / 1024 | 0} KB`);
}

function buildAmbient() {
  console.log('ambient drone');
  const sampleRate = 22050;
  const duration = 8;
  const total = sampleRate * duration;
  const fade = Math.floor(sampleRate * 0.35);
  const out = new Float32Array(total + fade);

  const partials = [
    { f: 110, a: 0.5 },
    { f: 164.81, a: 0.3 },
    { f: 220, a: 0.16 },
    { f: 329.63, a: 0.07 },
    { f: 440, a: 0.035 },
  ];

  const rand = rnd(77123);
  const noise = new Float32Array(total + fade);
  let lp = 0;
  for (let i = 0; i < noise.length; i++) {
    lp += ((rand() * 2 - 1) - lp) * 0.012; // heavy low-pass = air, not hiss
    noise[i] = lp;
  }
  let noiseNorm = 0;
  for (let i = 0; i < noise.length; i++) noiseNorm = Math.max(noiseNorm, Math.abs(noise[i]));
  const noiseGain = 0.05 / (noiseNorm || 1);

  for (let i = 0; i < out.length; i++) {
    const t = i / sampleRate;
    const breath = 0.72 + 0.28 * Math.sin((2 * Math.PI * t) / duration - Math.PI / 2);
    let v = 0;
    for (const p of partials) {
      const detune = 1 + 0.0015 * Math.sin((2 * Math.PI * t) / (duration * 2));
      v += p.a * Math.sin(2 * Math.PI * p.f * detune * t);
    }
    v *= 0.16 * breath;
    v += noise[i] * noiseGain * breath;
    out[i] = v;
  }

  // Seamless loop: fold the tail back over the head.
  for (let i = 0; i < fade; i++) {
    const k = i / fade;
    out[i] = out[i] * k + out[total + i] * (1 - k);
  }

  const final = out.subarray(0, total);
  let peak = 0;
  for (let i = 0; i < final.length; i++) peak = Math.max(peak, Math.abs(final[i]));
  const gain = 0.28 / (peak || 1);
  for (let i = 0; i < final.length; i++) final[i] *= gain;

  writeWav(path.join(AUD_DIR, 'ambient.wav'), final, sampleRate);
}

buildGlowLayers();
buildCracks();
buildIcons();
buildAmbient();
console.log('done');
