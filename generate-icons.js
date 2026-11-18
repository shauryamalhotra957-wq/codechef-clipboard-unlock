// generate-icons.js — Run with: node generate-icons.js
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createMinimalPNG(size) {
  const width = size;
  const height = size;
  const pixels = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const cx = width / 2;
      const cy = height / 2;
      const r = width * 0.45;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);

      if (dist <= r) {
        const g = 1 - (dist / r) * 0.3;
        pixels[idx] = Math.round(91 * g);
        pixels[idx + 1] = Math.round(79 * g);
        pixels[idx + 2] = Math.round(196 * g);
        pixels[idx + 3] = 255;
      }
    }
  }

  return encodePNG(width, height, pixels);
}

function encodePNG(width, height, pixels) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 4)] = 0;
    pixels.copy(rawData, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressed = zlib.deflateSync(rawData);

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const tb = Buffer.from(type, 'ascii');
    const crcData = Buffer.concat([tb, data]);
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < crcData.length; i++) {
      crc ^= crcData[i];
      for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
    crc ^= 0xFFFFFFFF;
    const cb = Buffer.alloc(4);
    cb.writeUInt32BE(crc >>> 0, 0);
    return Buffer.concat([len, tb, data, cb]);
  }

  return Buffer.concat([signature, makeChunk('IHDR', ihdr), makeChunk('IDAT', compressed), makeChunk('IEND', Buffer.alloc(0))]);
}

const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

[16, 48, 128].forEach(size => {
  const png = createMinimalPNG(size);
  const f = path.join(iconsDir, `icon-${size}.png`);
  fs.writeFileSync(f, png);
  console.log(`Created icon-${size}.png (${png.length} bytes)`);
});

console.log('Done!');
