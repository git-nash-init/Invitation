import { test } from 'node:test';
import assert from 'node:assert/strict';
import { judge, priceFor, pickAmount, claimUrl, demoUrl } from '../logic.js';
import { esc, safeEqual, randToken, sha256Hex, dayStart, adminIds, redact } from '../util.js';
import { imageMime, parseAiJson } from '../ai.js';

// ---------- price ----------
test('price: template price in paise, with an optional per-buyer discount while valid', () => {
  const t0 = 1000;
  const tpl = { price: 699 };
  assert.equal(priceFor(tpl, null, t0), 69900);
  assert.equal(priceFor(tpl, { disc_pct: 20, disc_until: t0 + 5 }, t0), 55900);
  assert.equal(priceFor(tpl, { disc_pct: 20, disc_until: t0 - 1 }, t0), 69900);
  assert.equal(priceFor({ price: 1 }, null, t0), 100);
});

// ---------- unique amounts ----------
test('amount: exact paise below the price, never colliding with an open order', () => {
  const base = 69900;
  const taken = new Set();
  for (let i = 0; i < 400; i++) {
    const a = pickAmount(taken, base, { start: 1 + (i % 99) });
    assert.ok(a !== null && a < base && a >= base - 500, 'in band: ' + a);
    assert.ok(!taken.has(a), 'collision at ' + a);
    taken.add(a);
  }
});

test('amount: when every paise in the band is taken, it says so instead of reusing one', () => {
  const base = 69900;
  const taken = new Set();
  for (let step = 0; step < 5; step++) for (let k = 1; k <= 99; k++) taken.add(base - step * 100 - k);
  assert.equal(pickAmount(taken, base, { start: 7 }), null);
});

test('amount: the Rs 1 test counts upwards and stays under Rs 2', () => {
  const a = pickAmount(new Set(), 100, { up: true, start: 40 });
  assert.ok(a > 100 && a < 200, String(a));
});

// ---------- verdict ----------
const O = { amount_paise: 69837, created_at: 1_000_000 };
const U = { vpa: 'me@okbank', payee_name: 'Test Seller' };
const OK = {
  is_payment_screenshot: true,
  status: 'success',
  amount: 698.37,
  payee_vpa: 'me@okbank',
  payee_name: 'TEST SELLER',
  utr: '123456789012',
  paid_at: new Date(1_000_100 * 1000).toISOString(),
  looks_edited: false,
};
const T = 1_000_200;
const v = (over) => judge(O, U, { ...OK, ...over }, T).verdict;

test('judge: a correct screenshot passes', () => assert.equal(v({}), 'pass'));
test('judge: name match is enough when the UPI ID is hidden', () => assert.equal(v({ payee_vpa: null }), 'pass'));
test('judge: not a payment', () => assert.equal(v({ is_payment_screenshot: false }), 'not_payment'));
test('judge: failed payment', () => assert.equal(v({ status: 'failed' }), 'failed'));
test('judge: edited screenshot is fake', () => assert.equal(v({ looks_edited: true }), 'fake'));
test('judge: paid to someone else is fake', () => assert.equal(v({ payee_vpa: 'x@y', payee_name: 'Other' }), 'fake'));
test('judge: far-off amount is fake', () => assert.equal(v({ amount: 50 }), 'fake'));
test('judge: rounded-up amount goes to a human, not a strike', () => assert.equal(v({ amount: 699 }), 'unclear'));
test('judge: old screenshot is fake', () => assert.equal(v({ paid_at: new Date((1_000_000 - 90000) * 1000).toISOString() }), 'fake'));
test('judge: time slip goes to a human, not a strike', () => {
  assert.equal(v({ paid_at: new Date((T + 19800) * 1000).toISOString() }), 'unclear');
  assert.equal(v({ paid_at: new Date((1_000_000 - 3000) * 1000).toISOString() }), 'unclear');
});
test('judge: unreadable fields go to a human', () => {
  assert.equal(v({ utr: null }), 'unclear');
  assert.equal(v({ amount: null }), 'unclear');
  assert.equal(v({ paid_at: 'yesterday' }), 'unclear');
  assert.equal(v({ status: 'pending' }), 'unclear');
  assert.equal(v({ payee_vpa: null, payee_name: null }), 'unclear');
  assert.equal(judge(O, U, { error: 'down' }, T).verdict, 'unclear');
  assert.equal(judge(O, U, null, T).verdict, 'unclear');
});

// ---------- links and tokens ----------
test('links: claim and demo links are built from the site address, trailing slash or not', () => {
  assert.equal(claimUrl('https://x.test/', 'ab-_'), 'https://x.test/claim?t=ab-_');
  assert.equal(demoUrl('https://x.test', 'ab-_'), 'https://x.test/lock/ab-_');
});

test('token: long, URL-safe and different every time', () => {
  const seen = new Set();
  for (let i = 0; i < 200; i++) {
    const t = randToken(24);
    assert.match(t, /^[A-Za-z0-9_-]{32}$/);
    seen.add(t);
  }
  assert.equal(seen.size, 200);
});

// The database computes the same value with sha256(convert_to(token, 'UTF8')).
test('token: hash matches the SHA-256 test vector the database also produces', async () => {
  assert.equal(await sha256Hex('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});

// ---------- helpers ----------
test('esc: HTML in names cannot break a message', () => {
  assert.equal(esc('<b>"x"</b> & y'), '&lt;b&gt;&quot;x&quot;&lt;/b&gt; &amp; y');
  assert.equal(esc(null), '');
});

test('safeEqual: equal strings only', () => {
  assert.ok(safeEqual('abc', 'abc'));
  assert.ok(!safeEqual('abc', 'abd'));
  assert.ok(!safeEqual('abc', 'abcd'));
});

test('dayStart: a new day starts at midnight India time', () => {
  // 2026-11-18 18:30:00 UTC is 2026-11-19 00:00:00 IST
  const t = Date.UTC(2026, 10, 18, 18, 30, 0) / 1000;
  assert.equal(dayStart(t), t);
  assert.equal(dayStart(t - 1), t - 86400);
});

test('adminIds: comma list, ignores junk', () => {
  assert.deepEqual(adminIds({ ADMIN_IDS: '1, 22 ,x,0' }), [1, 22]);
  assert.deepEqual(adminIds({}), []);
});

test('redact: secrets never appear in logs', () => {
  const env = { BOT_TOKEN: '123:SECRET', CRON_SECRET: 'cron-secret-value' };
  assert.equal(redact('failed for 123:SECRET and cron-secret-value', env), 'failed for *** and ***');
});

test('ai: image type is detected, so a PNG sent as a file is labelled correctly', () => {
  assert.equal(imageMime(new Uint8Array([0x89, 0x50, 0, 0])), 'image/png');
  assert.equal(imageMime(new Uint8Array([0xff, 0xd8, 0xff])), 'image/jpeg');
  assert.equal(imageMime(new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57])), 'image/webp');
});

test('ai: the reply is read even when wrapped in text', () => {
  assert.deepEqual(parseAiJson('here: {"amount": 5} thanks'), { amount: 5 });
  assert.equal(parseAiJson('no json'), null);
  assert.equal(parseAiJson('{broken'), null);
});
