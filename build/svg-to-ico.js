/**
 * Converts build/icon.svg to build/icon.ico with sizes 16, 32, 48, 256.
 * Run from repo root: node build/svg-to-ico.js
 */
const path = require('path');
const fs = require('fs');

const sharp = require('sharp');
const pngToIco = require('png-to-ico');

const ROOT = path.join(__dirname, '..');
const SVG_PATH = path.join(__dirname, 'icon.svg');
const ICO_PATH = path.join(__dirname, 'icon.ico');

const SIZES = [16, 32, 48, 256];

async function main() {
  const svgBuffer = fs.readFileSync(SVG_PATH);
  const pngBuffers = await Promise.all(
    SIZES.map((size) =>
      sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toBuffer()
    )
  );
  const icoBuffer = await pngToIco(pngBuffers);
  fs.writeFileSync(ICO_PATH, icoBuffer);
  console.log('Written', ICO_PATH);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
