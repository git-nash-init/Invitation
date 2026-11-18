// Pure rules: no database, no network. Ported unchanged from the original bot
// where it was already tested, so it can be tested here with plain Node.
import { now, rupees } from './util.js';

export const DEFAULT_MODEL = 'gemini-3.5-flash-lite';
export const FAKE_LIMIT = 3;
export const REUSE_ORDER_SEC = 30 * 60;
export const PROOF_WINDOW_SEC = 15 * 86400;
export const CLAIM_DAYS = 7;
export const DEMO_MINUTES = 10;
export const DEMO_MAX_VIEWS = 5;
export const DEMOS_PER_HOUR = 5;

// Price in paise. A per-user percentage discount is supported for future offers.
export function priceFor(template, user, t = now()) {
  const base = template.price * 100;
  if (user && user.disc_until > t && user.disc_pct > 0) {
    return Math.min(base, Math.round((template.price * (100 - user.disc_pct)) / 100) * 100);
  }
  return base;
}

// Exact-paise amount that no other open order of this UPI ID is using, so a
// screenshot's amount can only match one order. `taken` is a Set of paise values.
export function pickAmount(taken, base, { up = false, start = 1 } = {}) {
  for (let step = 0; step < 5; step++) {
    for (let i = 0; i < 99; i++) {
      const k = ((start + i - 1) % 99) + 1;
      const amount = up ? base + step * 100 + k : base - step * 100 - k;
      if (amount > 0 && !taken.has(amount)) return amount;
    }
  }
  return null;
}

const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();

function payeeMatches(r, upi) {
  const vpa = norm(r.payee_vpa);
  if (vpa && vpa === norm(upi.vpa)) return 'yes';
  const name = norm(r.payee_name);
  if (name) {
    const want = norm(upi.payee_name).split(' ').filter(Boolean);
    if (want.length && want.every((w) => name.includes(w))) return 'yes';
  }
  return vpa || name ? 'no' : 'unknown';
}

// What the screenshot means. verdict: pass | unclear | not_payment | failed | fake
export function judge(order, upi, r, t = now()) {
  if (!r || r.error) return { verdict: 'unclear', reason: (r && r.error) || 'AI gave no answer' };
  if (r.is_payment_screenshot === false) return { verdict: 'not_payment', reason: 'not a payment screenshot' };
  const utr = String(r.utr || '').replace(/[^A-Za-z0-9]/g, '');
  const status = norm(r.status);
  if (status === 'failed') return { verdict: 'failed', reason: 'payment shows failed', utr };
  if (r.looks_edited === true) return { verdict: 'fake', reason: 'screenshot looks edited', utr };

  const payee = payeeMatches(r, upi);
  if (payee === 'no') return { verdict: 'fake', reason: `paid to someone else (${r.payee_vpa || r.payee_name})`, utr };

  const paise = Math.round(Number(r.amount) * 100);
  if (!Number.isFinite(paise) || paise <= 0) return { verdict: 'unclear', reason: 'amount not readable', utr };
  if (paise !== order.amount_paise) {
    // A genuine buyer often rounds 298.37 up to 299: a human decides, no strike.
    if (Math.abs(paise - order.amount_paise) <= 200) {
      return { verdict: 'unclear', reason: `paid ₹${rupees(paise)}, expected ₹${rupees(order.amount_paise)}`, utr };
    }
    return { verdict: 'fake', reason: `wrong amount ₹${rupees(paise)}, expected ₹${rupees(order.amount_paise)}`, utr };
  }

  if (status !== 'success') return { verdict: 'unclear', reason: 'status is ' + (status || 'unknown'), utr };
  if (payee === 'unknown') return { verdict: 'unclear', reason: 'receiver not readable', utr };
  if (utr.length < 8) return { verdict: 'unclear', reason: 'UTR not readable', utr };

  const paidAt = Date.parse(r.paid_at || '') / 1000;
  if (!Number.isFinite(paidAt)) return { verdict: 'unclear', reason: 'date not readable', utr };
  if (paidAt < order.created_at - 86400) return { verdict: 'fake', reason: 'old screenshot, from before this order', utr };
  // Time-zone slips by the model land here, so these go to a human, not a strike.
  if (paidAt < order.created_at - 600 || paidAt > t + 600) {
    return { verdict: 'unclear', reason: 'time does not line up with the order', utr };
  }

  return { verdict: 'pass', reason: 'ok', utr };
}

// The website page where a buyer unlocks and edits what they bought.
export const claimUrl = (site, token) => `${String(site).replace(/\/+$/, '')}/claim?t=${encodeURIComponent(token)}`;
export const demoUrl = (site, token) => `${String(site).replace(/\/+$/, '')}/lock/${encodeURIComponent(token)}`;
