import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inflateSync } from 'node:zlib';
import jsQR from 'jsqr';
import { upiUri, qrPng } from '../qr.js';

test('QR: UPI link keeps @ literal and has the exact amount', () => {
  const u = upiUri({ vpa: 'me@okbank', name: 'Test Seller', paise: 69837, note: 'OD1' });
  assert.ok(u.includes('pa=me@okbank'));
  assert.ok(!u.includes('%40'));
  assert.ok(u.includes('am=698.37'));
  assert.ok(u.includes('pn=Test%20Seller'));
});

// Reads our PNG back into pixels and scans it with jsQR, an independent decoder.
function decodePng(png) {
  assert.deepEqual([...png.slice(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  const dv = new DataView(png.buffer, png.byteOffset);
  const size = dv.getUint32(16);
  assert.equal(png[24], 1, '1-bit');
  const raw = inflateSync(png.subarray(41, 41 + dv.getUint32(33)));
  const stride = Math.ceil(size / 8) + 1;
  const rgba = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++) {
    assert.equal(raw[y * stride], 0, 'filter byte');
    for (let x = 0; x < size; x++) {
      const v = (raw[y * stride + 1 + (x >> 3)] >> (7 - (x & 7))) & 1 ? 255 : 0;
      rgba.set([v, v, v, 255], (y * size + x) * 4);
    }
  }
  return { size, result: jsQR(rgba, size, size) };
}

test('QR: an independent decoder reads every length back exactly, across all QR sizes', async () => {
  const sizes = new Set();
  for (let len = 1; len <= 335; len += 7) {
    const data = 'upi://pay?pa=me@okbank&' + 'x'.repeat(len);
    const { size, result } = decodePng(await qrPng(data));
    assert.ok(result, 'not decodable at length ' + data.length);
    assert.equal(result.data, data);
    sizes.add(size);
  }
  assert.ok(sizes.size >= 10, 'covered QR sizes: ' + sizes.size);
});

test('QR: real UPI links decode, with non-English names too', async () => {
  for (const name of ['Test Seller', 'A Fairly Long Receiver Name Of Sixty Characters Exactly Here!', 'तनु अग्रवाल']) {
    for (const paise of [101, 69801, 69899, 100000]) {
      const uri = upiUri({ vpa: 'someone.long.name@okhdfcbank', name, paise, note: 'ODABCDEF1234' });
      const { result } = decodePng(await qrPng(uri));
      assert.equal(result.data, uri);
    }
  }
});

test('QR: too much data fails loudly instead of making a broken code', async () => {
  await assert.rejects(qrPng('x'.repeat(400)), /too long/);
});
