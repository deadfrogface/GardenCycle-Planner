/**
 * Converts build/icon.svg to build/icon.ico (16, 32, 48, 256) using @resvg/resvg-js.
 * Run from repo root: node build/svg-to-ico.js
 */
const path = require('path');
const fs = require('fs');
const { Resvg } = require('@resvg/resvg-js');
const pngToIco = require('png-to-ico');

const SVG_PATH = path.join(__dirname, 'icon.svg');
const ICO_PATH = path.join(__dirname, 'icon.ico');
const SIZES = [16, 32, 48, 256];

function renderSvgToPng(svgBuffer, size) {
  const opts = { fitTo: { mode: 'width', value: size } };
  const resvg = new Resvg(svgBuffer, opts);
  const pngData = resvg.render();
  return Buffer.from(pngData.asPng());
}

async function main() {
  let svgBuffer = fs.readFileSync(SVG_PATH);
  if (svgBuffer[0] === 0xef && svgBuffer[1] === 0xbb && svgBuffer[2] === 0xbf) {
    svgBuffer = svgBuffer.subarray(3);
  }
  const pngBuffers = SIZES.map((size) => renderSvgToPng(svgBuffer, size));
  const icoBuffer = await pngToIco(pngBuffers);
  fs.writeFileSync(ICO_PATH, icoBuffer);
  console.log('Written', ICO_PATH);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
