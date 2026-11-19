import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import {
  checkoutSignature,
  razorpayKeys,
  safeEqualHex,
  verifyCheckoutSignature,
  verifyWebhookSignature,
} from "../src/lib/razorpay.ts";

const hmac = (secret, text) => createHmac("sha256", secret).update(text).digest("hex");

test("checkout signature is HMAC-SHA256 of order_id|payment_id", () => {
  // Reference value computed independently of the code under test.
  assert.equal(checkoutSignature("order_ABC12345", "pay_XYZ98765", "key_secret"), hmac("key_secret", "order_ABC12345|pay_XYZ98765"));
});

test("checkout signature: accepts the real one, rejects every tampering", () => {
  const good = hmac("key_secret", "order_ABC12345|pay_XYZ98765");
  assert.equal(verifyCheckoutSignature("order_ABC12345", "pay_XYZ98765", good, "key_secret"), true);
  assert.equal(verifyCheckoutSignature("order_ABC12345", "pay_OTHER9999", good, "key_secret"), false, "another payment");
  assert.equal(verifyCheckoutSignature("order_OTHER9999", "pay_XYZ98765", good, "key_secret"), false, "another order");
  assert.equal(verifyCheckoutSignature("order_ABC12345", "pay_XYZ98765", good, "wrong_secret"), false, "wrong secret");
  assert.equal(verifyCheckoutSignature("order_ABC12345", "pay_XYZ98765", good.slice(0, -2), "key_secret"), false, "truncated");
  assert.equal(verifyCheckoutSignature("order_ABC12345", "pay_XYZ98765", "", "key_secret"), false, "empty");
  assert.equal(verifyCheckoutSignature("order_ABC12345", "pay_XYZ98765", good.toUpperCase(), "key_secret"), false, "case changed");
});

test("webhook signature covers the exact raw body", () => {
  const body = '{"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_1"}}}}';
  const sig = hmac("whsec", body);
  assert.equal(verifyWebhookSignature(body, sig, "whsec"), true);
  assert.equal(verifyWebhookSignature(body + " ", sig, "whsec"), false, "one extra byte");
  assert.equal(verifyWebhookSignature(JSON.stringify(JSON.parse(body), null, 2), sig, "whsec"), false, "re-serialised JSON");
  assert.equal(verifyWebhookSignature(body, sig, "other"), false, "wrong secret");
  // The checkout (key) secret must never verify a webhook, and the other way round.
  assert.equal(verifyWebhookSignature(body, hmac("key_secret", body), "whsec"), false);
});

test("safeEqualHex never throws on different lengths", () => {
  assert.equal(safeEqualHex("abcd", "abcd"), true);
  assert.equal(safeEqualHex("abcd", "abc"), false);
  assert.equal(safeEqualHex("", ""), true);
});

test("razorpayKeys needs both the id and the secret", () => {
  const old = { id: process.env.RAZORPAY_KEY_ID, secret: process.env.RAZORPAY_KEY_SECRET };
  try {
    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;
    assert.equal(razorpayKeys(), null);
    process.env.RAZORPAY_KEY_ID = "rzp_test_x";
    assert.equal(razorpayKeys(), null);
    process.env.RAZORPAY_KEY_SECRET = "s";
    assert.deepEqual(razorpayKeys(), { id: "rzp_test_x", secret: "s" });
  } finally {
    for (const [k, v] of [["RAZORPAY_KEY_ID", old.id], ["RAZORPAY_KEY_SECRET", old.secret]]) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
});
