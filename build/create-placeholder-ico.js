/**
 * Creates a minimal valid icon.ico (16x16 green) without native deps.
 * Used when svg-to-ico.js fails (e.g. sharp on Windows CI).
 */
const fs = require('fs');
const path = require('path');

const ICO_PATH = path.join(__dirname, 'icon.ico');

// Minimal 16x16 32bpp ICO: header + directory + DIB + pixel data
const W = 16;
const H = 16;
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);

const dibSize = 40 + W * H * 4;
const offset = 6 + 16;
const dirEntry = Buffer.alloc(16);
dirEntry[0] = W;
dirEntry[1] = H;
dirEntry[2] = 0;
dirEntry[3] = 0;
dirEntry[4] = 0;
dirEntry[5] = 0;
dirEntry.writeUInt32LE(dibSize, 8);
dirEntry.writeUInt32LE(offset, 12);

const dib = Buffer.alloc(40);
dib.writeUInt32LE(40, 0);
dib.writeInt32LE(W, 4);
dib.writeInt32LE(H * 2, 8);
dib.writeUInt16LE(1, 12);
dib.writeUInt16LE(32, 14);

const pixels = Buffer.alloc(W * H * 4);
for (let i = 0; i < W * H * 4; i += 4) {
  pixels[i] = 45;     // B (green tint)
  pixels[i + 1] = 125; // G
  pixels[i + 2] = 58;  // R
  pixels[i + 3] = 255;
}

const ico = Buffer.concat([header, dirEntry, dib, pixels]);
fs.writeFileSync(ICO_PATH, ico);
console.log('Written placeholder', ICO_PATH);
