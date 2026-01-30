import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const images = [
  { filename: 'icon.png', width: 200, height: 200, bgColor: '#3B82F6', text: 'Fixel' },
  { filename: 'mint-card-bg.png', width: 600, height: 600, bgColor: '#0F172A', text: 'Mint Card' },
  { filename: 'splash.png', width: 1200, height: 800, bgColor: '#0F172A', text: 'Fixel NFT' },
  { filename: 'hero.png', width: 800, height: 400, bgColor: '#1E293B', text: 'Hero Image' },
  { filename: 'og.png', width: 1200, height: 630, bgColor: '#0F172A', text: 'Fixel NFT' },
  { filename: 'screenshots/1.png', width: 800, height: 600, bgColor: '#1E293B', text: 'Screenshot 1' },
  { filename: 'screenshots/2.png', width: 800, height: 600, bgColor: '#1E293B', text: 'Screenshot 2' }
];

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  
  const typeBuffer = Buffer.from(type);
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData), 0);
  
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(data) {
  let crc = 0xFFFFFFFF;
  const table = getCrc32Table();
  
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xFF];
  }
  
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function getCrc32Table() {
  const table = new Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
}

function createPng(width, height, r, g, b) {
  // Create raw image data with filter byte for each row
  const rawData = Buffer.alloc(height * (width * 3 + 1));
  let offset = 0;
  
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter type: None for each row
    for (let x = 0; x < width; x++) {
      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
    }
  }
  
  // Compress with zlib
  const compressed = zlibCompress(rawData);
  
  const chunks = [];
  
  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB
  chunks.push(createChunk('IHDR', ihdr));
  
  // IDAT chunk
  chunks.push(createChunk('IDAT', compressed));
  
  // IEND chunk
  chunks.push(createChunk('IEND', Buffer.alloc(0)));
  
  // Combine chunks with PNG signature
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), ...chunks]);
}

function zlibCompress(data) {
  // Zlib header (CMF + FLG)
  // CMF: 0x78 = compression method 8 (deflate), window size 32K
  // FLG: 0x01 = default compression level, no dictionary
  const zlibHeader = Buffer.from([0x78, 0x01]);
  
  // Adler32 checksum (use unsigned)
  let a1 = 1;
  let a2 = 0;
  for (let i = 0; i < data.length; i++) {
    a1 = (a1 + data[i]) % 65521;
    a2 = (a2 + a1) % 65521;
  }
  const adler = Buffer.alloc(4);
  adler.writeUInt32BE(((a2 << 16) | a1) >>> 0, 0);
  
  // Simple LZ77-like compression (store uncompressed blocks)
  const blocks = [];
  
  // For uncompressed blocks, we need to split into chunks <= 65535 bytes
  const maxChunkSize = 65535;
  let offset = 0;
  
  while (offset < data.length) {
    const chunkSize = Math.min(maxChunkSize, data.length - offset);
    const isFinal = offset + chunkSize >= data.length;
    
    // Block header: 1 byte (BFINAL + BTYPE) + 2 bytes (LEN) + 2 bytes (NLEN)
    const blockHeader = Buffer.alloc(5);
    blockHeader[0] = isFinal ? 0x01 : 0x00; // BFINAL
    // BTYPE = 00 (uncompressed)
    blockHeader.writeUInt16LE(chunkSize, 1); // LEN
    blockHeader.writeUInt16LE((~chunkSize) & 0xFFFF, 3); // NLEN (negated)
    
    blocks.push(blockHeader);
    blocks.push(data.slice(offset, offset + chunkSize));
    offset += chunkSize;
  }
  
  // Combine
  return Buffer.concat([zlibHeader, ...blocks, adler]);
}

function hexToRgb(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16)
  };
}

async function main() {
  console.log('Generating placeholder PNGs...\n');
  
  for (const image of images) {
    const filepath = path.join(process.cwd(), 'public', image.filename);
    const dir = path.dirname(filepath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const { r, g, b } = hexToRgb(image.bgColor);
    const png = createPng(image.width, image.height, r, g, b);
    
    fs.writeFileSync(filepath, png);
    console.log(`Created ${image.filename} (${image.width}x${image.height})`);
  }
  
  console.log('\nDone! Replace these placeholders with actual images.');
}

main().catch(console.error);
