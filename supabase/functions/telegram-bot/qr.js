// UPI QR as a PNG, written to fit the free plan's 10 ms CPU limit.
// Off-the-shelf QR libraries try all 8 mask patterns, which alone used about
// 4 ms. A QR with one fixed mask is fully valid (the mask is stored in the code),
// so this encoder skips that search. Checked against an independent decoder in tests.

export function upiUri({ vpa, name, paise, note }) {
  // The "@" in pa must stay literal: some UPI apps reject %40.
  const amount = (paise / 100).toFixed(2);
  return `upi://pay?pa=${vpa}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
}

// Error correction level M, versions 1-14:
// [EC codewords per block, group 1 blocks, data per block, group 2 blocks, data per block]
const BLOCKS = [
  null,
  [10, 1, 16, 0, 0], [16, 1, 28, 0, 0], [26, 1, 44, 0, 0], [18, 2, 32, 0, 0], [24, 2, 43, 0, 0],
  [16, 4, 27, 0, 0], [18, 4, 31, 0, 0], [22, 2, 38, 2, 39], [22, 3, 36, 2, 37], [26, 4, 43, 1, 44],
  [30, 1, 50, 4, 51], [22, 6, 36, 2, 37], [22, 8, 37, 1, 38], [24, 4, 40, 5, 41],
];
const ALIGN = [
  null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46],
  [6, 28, 50], [6, 30, 54], [6, 32, 58], [6, 34, 62], [6, 26, 46, 66],
];
const MASK = 0; // (x + y) % 2 == 0

const capacity = (v) => {
  const [, n1, d1, n2, d2] = BLOCKS[v];
  return n1 * d1 + n2 * d2;
};

// Galois field GF(256) tables for Reed-Solomon.
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
for (let i = 0, x = 1; i < 255; i++) {
  EXP[i] = x;
  LOG[x] = i;
  x = x << 1 ^ (x & 0x80 ? 0x11d : 0);
}
for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];

function rsGenerator(n) {
  let g = new Uint8Array([1]);
  for (let i = 0; i < n; i++) {
    const next = new Uint8Array(g.length + 1);
    for (let j = 0; j < g.length; j++) {
      next[j] ^= g[j];
      if (g[j]) next[j + 1] ^= EXP[LOG[g[j]] + i];
    }
    g = next;
  }
  return g;
}

function rsRemainder(data, ecLen, gen) {
  const out = new Uint8Array(ecLen);
  for (const byte of data) {
    const factor = byte ^ out[0];
    out.copyWithin(0, 1);
    out[ecLen - 1] = 0;
    if (factor) {
      const lf = LOG[factor];
      for (let i = 0; i < ecLen; i++) if (gen[i + 1]) out[i] ^= EXP[LOG[gen[i + 1]] + lf];
    }
  }
  return out;
}

function encodeData(bytes) {
  let version = 0;
  for (let v = 1; v < BLOCKS.length; v++) {
    const bits = 4 + (v < 10 ? 8 : 16) + bytes.length * 8;
    if (bits <= capacity(v) * 8) {
      version = v;
      break;
    }
  }
  if (!version) throw new Error('QR data too long');

  const cap = capacity(version);
  const out = new Uint8Array(cap);
  let bitPos = 0;
  const put = (val, len) => {
    for (let i = len - 1; i >= 0; i--, bitPos++) if ((val >>> i) & 1) out[bitPos >> 3] |= 0x80 >> (bitPos & 7);
  };
  put(4, 4); // byte mode
  put(bytes.length, version < 10 ? 8 : 16);
  for (const b of bytes) put(b, 8);
  put(0, Math.min(4, cap * 8 - bitPos)); // terminator
  let i = (bitPos + 7) >> 3; // pad to a byte, then alternate pad bytes
  for (let pad = 0xec; i < cap; i++, pad ^= 0xec ^ 0x11) out[i] = pad;

  const [ecLen, n1, d1, n2, d2] = BLOCKS[version];
  const gen = rsGenerator(ecLen);
  const blocks = [];
  let off = 0;
  for (let b = 0; b < n1 + n2; b++) {
    const size = b < n1 ? d1 : d2;
    const data = out.subarray(off, off + size);
    off += size;
    blocks.push({ data, ec: rsRemainder(data, ecLen, gen) });
  }
  const total = new Uint8Array(cap + ecLen * blocks.length);
  let t = 0;
  for (let c = 0; c < Math.max(d1, d2); c++) for (const b of blocks) if (c < b.data.length) total[t++] = b.data[c];
  for (let c = 0; c < ecLen; c++) for (const b of blocks) total[t++] = b.ec[c];
  return { version, codewords: total };
}

// Returns { size, dark(x, y) }.
export function qrMatrix(text) {
  const { version, codewords } = encodeData(new TextEncoder().encode(text));
  const size = version * 4 + 17;
  const mods = new Uint8Array(size * size);
  const isFn = new Uint8Array(size * size);
  const setFn = (x, y, dark) => {
    mods[y * size + x] = dark ? 1 : 0;
    isFn[y * size + x] = 1;
  };

  for (let i = 0; i < size; i++) {
    setFn(6, i, i % 2 === 0);
    setFn(i, 6, i % 2 === 0);
  }
  const finder = (cx, cy) => {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (x < 0 || y < 0 || x >= size || y >= size) continue;
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        setFn(x, y, d !== 2 && d !== 4);
      }
    }
  };
  finder(3, 3);
  finder(size - 4, 3);
  finder(3, size - 4);

  const pos = ALIGN[version];
  const last = pos.length - 1;
  for (let a = 0; a <= last; a++) {
    for (let b = 0; b <= last; b++) {
      if ((a === 0 && b === 0) || (a === 0 && b === last) || (a === last && b === 0)) continue;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) setFn(pos[a] + dx, pos[b] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }
  }

  // Format info: level M is 0b00.
  let rem = MASK;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  const fmt = ((MASK << 10) | rem) ^ 0x5412;
  const fb = (i) => ((fmt >>> i) & 1) === 1;
  for (let i = 0; i <= 5; i++) setFn(8, i, fb(i));
  setFn(8, 7, fb(6));
  setFn(8, 8, fb(7));
  setFn(7, 8, fb(8));
  for (let i = 9; i < 15; i++) setFn(14 - i, 8, fb(i));
  for (let i = 0; i < 8; i++) setFn(size - 1 - i, 8, fb(i));
  for (let i = 8; i < 15; i++) setFn(8, size - 15 + i, fb(i));
  setFn(8, size - 8, true);

  if (version >= 7) {
    let r = version;
    for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1f25);
    const bits = (version << 12) | r;
    for (let i = 0; i < 18; i++) {
      const bit = ((bits >>> i) & 1) === 1;
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      setFn(a, b, bit);
      setFn(b, a, bit);
    }
  }

  // Data, zigzag from the bottom-right; leftover remainder bits stay 0.
  let i = 0;
  const totalBits = codewords.length * 8;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    const upward = ((right + 1) & 2) === 0;
    for (let vert = 0; vert < size; vert++) {
      const y = upward ? size - 1 - vert : vert;
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const at = y * size + x;
        if (isFn[at]) continue;
        let bit = 0;
        if (i < totalBits) {
          bit = (codewords[i >> 3] >> (7 - (i & 7))) & 1;
          i++;
        }
        mods[at] = bit ^ ((x + y) % 2 === 0 ? 1 : 0);
      }
    }
  }
  return { size, dark: (x, y) => mods[y * size + x] === 1 };
}

const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c >>> 0;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const out = new Uint8Array(12 + data.length);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  dv.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}
async function zlib(data) {
  const cs = new CompressionStream('deflate'); // "deflate" = zlib format, which PNG requires
  const w = cs.writable.getWriter();
  w.write(data);
  w.close();
  return new Uint8Array(await new Response(cs.readable).arrayBuffer());
}

export const QUIET = 4; // white border, in modules

// 1-bit PNG with 8 pixels per module, so every module is exactly one byte per row.
export async function qrPng(text) {
  const { size, dark } = qrMatrix(text);
  const width = size + QUIET * 2; // bytes per pixel row, also the image size in modules
  const stride = width + 1; // filter byte + pixels
  const raw = new Uint8Array(stride * width * 8).fill(0xff);
  for (let y = 0; y < width; y++) {
    const row = new Uint8Array(stride).fill(0xff);
    row[0] = 0; // filter: none
    if (y >= QUIET && y < QUIET + size) {
      for (let x = 0; x < size; x++) if (dark(x, y - QUIET)) row[1 + QUIET + x] = 0;
    }
    for (let r = 0; r < 8; r++) raw.set(row, (y * 8 + r) * stride);
  }
  const ihdr = new Uint8Array(13);
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, width * 8);
  dv.setUint32(4, width * 8);
  ihdr[8] = 1; // bit depth
  ihdr[9] = 0; // grayscale
  const parts = [
    new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', await zlib(raw)),
    chunk('IEND', new Uint8Array(0)),
  ];
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}
