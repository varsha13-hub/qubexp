/**
 * Simple placeholder generator: writes a tiny PNG (base64) and a short WAV.
 * No external dependencies.
 */
const fs = require('fs');
const path = require('path');

const ROOT = 'solar-system';
const ASSETS = path.join(ROOT, 'assets', 'planets');
const PLANETS = ['mars','jupiter','earth'];

const smallPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAQAAAAAYLlVAAAAK0lEQVR4Ae3BAQ0AAADCIPunNscwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwL0G7QAAeQG3sQAAAABJRU5ErkJggg==';
// 64x64 tiny placeholder white-ish PNG

function writePng(file) {
  const buf = Buffer.from(smallPngBase64, 'base64');
  fs.writeFileSync(file, buf);
}

function writeWav(file) {
  const sampleRate = 22050;
  const duration = 2; // seconds
  const numSamples = sampleRate * duration;
  const channels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * channels * bitsPerSample/8;
  const blockAlign = channels * bitsPerSample/8;
  const dataSize = numSamples * channels * bitsPerSample/8;
  const buffer = Buffer.alloc(44 + dataSize);
  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // PCM chunk size
  buffer.writeUInt16LE(1, 20); // audio format PCM
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  // generate a simple sine wave
  for (let i=0;i<numSamples;i++) {
    const t = i / sampleRate;
    const freq = 220;
    const sample = Math.floor(32760 * Math.sin(2 * Math.PI * freq * t) * 0.02);
    buffer.writeInt16LE(sample, 44 + i*2);
  }
  fs.writeFileSync(file, buffer);
}

if (!fs.existsSync(ASSETS)) fs.mkdirSync(ASSETS, { recursive: true });

for (const p of PLANETS) {
  const dir = path.join(ASSETS, p);
  fs.mkdirSync(dir, { recursive: true });
  writePng(path.join(dir, 'albedo.png'));
  writePng(path.join(dir, 'normal.png'));
  writePng(path.join(dir, 'roughness.png'));
  writePng(path.join(dir, 'clouds.png'));
  writePng(path.join(dir, 'emissive.png'));
  writeWav(path.join(dir, 'ambient_loop.wav'));
  fs.writeFileSync(path.join(dir, 'landmarks.json'), JSON.stringify([{id:'sample-1',name:'Sample Site',lat:0.5,lon:10,desc:'This is a sample landing site.'}], null, 2));
  console.log('Wrote placeholders for', p);
}
console.log('All placeholders created at', ASSETS);

