import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPng(width, height, drawFn) {
  const rowSize = width * 4 + 1;
  const raw = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    raw[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      raw[pxOffset] = r;
      raw[pxOffset + 1] = g;
      raw[pxOffset + 2] = b;
      raw[pxOffset + 3] = a;
    }
  }

  const idatData = zlib.deflateSync(raw, { level: 9 });

  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc ^= buf[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
      }
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const combined = Buffer.concat([typeBuf, data]);
    crcBuf.writeUInt32BE(crc32(combined), 0);
    return Buffer.concat([len, combined, crcBuf]);
  }

  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // no interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', idatData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

// Function to draw CoinOn badge
function renderCoinOn(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background squircle or fill
  let bgR = 11, bgG = 14, bgB = 20, bgA = 255; // #0b0e14
  
  // Subtle diagonal gradient background
  const gradT = (x + y) / (w + h);
  bgR = Math.round(11 + gradT * 12); // ~ #171b28
  bgG = Math.round(14 + gradT * 14);
  bgB = Math.round(20 + gradT * 28);

  if (!isMaskable) {
    // Corner rounding for standard icons
    const radius = w * 0.22;
    const qx = Math.max(Math.abs(x - cx) - (cx - radius), 0);
    const qy = Math.max(Math.abs(y - cy) - (cy - radius), 0);
    const cornerDist = Math.sqrt(qx * qx + qy * qy);
    if (cornerDist > radius) {
      return [0, 0, 0, 0]; // Transparent outside squircle
    }
  }

  // Outer glowing ring
  const ringRadius = w * 0.36;
  const ringWidth = w * 0.02;
  if (Math.abs(dist - ringRadius) < ringWidth) {
    return [99, 102, 241, 160]; // Indigo-500 glow
  }

  // Main Coin Body
  const coinRadius = w * 0.30;
  if (dist <= coinRadius) {
    // Coin rim
    if (dist >= coinRadius - w * 0.015) {
      return [255, 255, 255, 200];
    }

    // Inner Coin Body gradient (Cyan to Indigo to Purple)
    const coinT = (dx + dy + coinRadius * 2) / (coinRadius * 4);
    let cr = 56 + coinT * 80;
    let cg = 189 - coinT * 90;
    let cb = 248 - coinT * 10;

    // Darker center hub
    const hubRadius = w * 0.22;
    if (dist <= hubRadius) {
      cr = 15; cg = 23; cb = 42; // #0f172a
      
      // Let's render the letters 'O' and 'N'
      // Normalized coords inside hub: -1 to 1
      const nx = dx / hubRadius;
      const ny = dy / hubRadius;

      // 'O' on left (nx around -0.42)
      const odx = nx - (-0.38);
      const ody = ny;
      const oDist = Math.sqrt(odx * odx + (ody * 0.85) * (ody * 0.85));
      if (oDist >= 0.16 && oDist <= 0.36 && Math.abs(nx - (-0.38)) < 0.45) {
        return [255, 255, 255, 255];
      }

      // 'N' on right (nx around 0.38)
      // Left vertical bar of N
      if (nx >= 0.16 && nx <= 0.26 && Math.abs(ny) <= 0.38) {
        return [255, 255, 255, 255];
      }
      // Right vertical bar of N
      if (nx >= 0.48 && nx <= 0.58 && Math.abs(ny) <= 0.38) {
        return [255, 255, 255, 255];
      }
      // Diagonal bar of N: from (0.20, -0.38) to (0.54, 0.38)
      const diagT = (ny + 0.38) / 0.76;
      const targetNx = 0.20 + diagT * 0.34;
      if (Math.abs(nx - targetNx) <= 0.07 && Math.abs(ny) <= 0.38) {
        return [255, 255, 255, 255];
      }
    }

    return [Math.round(cr), Math.round(cg), Math.round(cb), 255];
  }

  // Live Pulse Green Dot at top-right
  const dotX = cx + w * 0.18;
  const dotY = cy - h * 0.18;
  const dotDist = Math.sqrt((x - dotX) * (x - dotX) + (y - dotY) * (y - dotY));
  if (dotDist <= w * 0.04) {
    if (dotDist >= w * 0.032) return [255, 255, 255, 255];
    return [16, 185, 129, 255]; // Emerald green
  }

  return [bgR, bgG, bgB, bgA];
}

console.log('Generating PWA icons...');
const outDir = path.resolve('public');

// 1. icon-192.png
const png192 = createPng(192, 192, (x, y, w, h) => renderCoinOn(x, y, w, h, false));
fs.writeFileSync(path.join(outDir, 'icon-192.png'), png192);
console.log('Created icon-192.png');

// 2. icon-512.png
const png512 = createPng(512, 512, (x, y, w, h) => renderCoinOn(x, y, w, h, false));
fs.writeFileSync(path.join(outDir, 'icon-512.png'), png512);
console.log('Created icon-512.png');

// 3. icon-maskable-512.png
const pngMaskable512 = createPng(512, 512, (x, y, w, h) => renderCoinOn(x, y, w, h, true));
fs.writeFileSync(path.join(outDir, 'icon-maskable-512.png'), pngMaskable512);
console.log('Created icon-maskable-512.png');

// 4. apple-touch-icon.png (180x180)
const pngApple180 = createPng(180, 180, (x, y, w, h) => renderCoinOn(x, y, w, h, true));
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), pngApple180);
console.log('Created apple-touch-icon.png');
