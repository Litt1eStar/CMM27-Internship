// Generates the three UI sounds as small mono WAV files. Run: node scripts/make-sfx.mjs
// Made from maths, so there are no licensing questions and every run gives identical files.
import { mkdirSync, writeFileSync } from 'node:fs';

const RATE = 22050;
const OUT = new URL('../src/assets/sfx/', import.meta.url);

function wav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), i * 2));
  const h = Buffer.alloc(44);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write('WAVE', 8);
  h.write('fmt ', 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); // PCM
  h.writeUInt16LE(1, 22); // mono
  h.writeUInt32LE(RATE, 24);
  h.writeUInt32LE(RATE * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write('data', 36);
  h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}

const render = (seconds, fn) => Array.from({ length: Math.round(seconds * RATE) }, (_, i) => fn(i / RATE));
// Short fade-in so the first sample doesn't click.
const attack = (t) => Math.min(1, t / 0.004);

let seed = 7;
const noise = () => {
  seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff;
  return seed / 0x3fffffff - 1;
};

function note(t, start, freq) {
  if (t < start) return 0;
  const u = t - start;
  return attack(u) * Math.exp(-u * 6) * (Math.sin(2 * Math.PI * freq * u) + 0.25 * Math.sin(4 * Math.PI * freq * u));
}

// pop: a quick downward pitch sweep (tick)
const pop = render(0.09, (t) => attack(t) * Math.sin(2 * Math.PI * (900 * t - 3000 * t * t)) * Math.exp(-t * 45) * 0.6);
// chime: two bright notes, C6 then G6 (success)
const chime = render(0.6, (t) => 0.32 * (note(t, 0, 1046.5) + note(t, 0.08, 1568)));
// rustle: soft filtered noise swell (a leaf growing, used from phase 3)
let low = 0;
const rustle = render(0.35, (t) => {
  low += 0.18 * (noise() - low);
  return low * Math.sin((Math.PI * t) / 0.35) ** 2 * 0.9;
});

mkdirSync(OUT, { recursive: true });
for (const [name, samples] of Object.entries({ pop, chime, rustle })) {
  writeFileSync(new URL(`${name}.wav`, OUT), wav(samples));
}
console.log('wrote pop.wav, chime.wav, rustle.wav');
