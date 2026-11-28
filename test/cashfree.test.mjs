import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import {
  cashfreeKeys,
  cashfreeMode,
  cashfreeWebhookSignature,
  cleanPhone,
  settlementOf,
  verifyCashfreeWebhook,
} from "../src/lib/cashfree.ts";

const sign = (secret, ts, body) => createHmac("sha256", secret).update(ts + body).digest("base64");

test("webhook signature is Base64 HMAC-SHA256 of timestamp + raw body", () => {
  const body = '{"type":"PAYMENT_SUCCESS_WEBHOOK","data":{"order":{"order_amount":699.00}}}';
  assert.equal(cashfreeWebhookSignature("1700000000", body, "secret"), sign("secret", "1700000000", body));
});

test("webhook: accepts the real one, rejects every tampering", () => {
  const body = '{"type":"PAYMENT_SUCCESS_WEBHOOK","data":{"order":{"order_amount":699.00}}}';
  const good = sign("secret", "1700000000", body);
  assert.equal(verifyCashfreeWebhook("1700000000", body, good, "secret"), true);
  assert.equal(verifyCashfreeWebhook("1700000001", body, good, "secret"), false, "another timestamp");
  assert.equal(verifyCashfreeWebhook("1700000000", body.replace("699.00", "699"), good, "secret"), false, "re-serialised body");
  assert.equal(verifyCashfreeWebhook("1700000000", body, good, "other"), false, "wrong secret");
  assert.equal(verifyCashfreeWebhook("1700000000", body, "", "secret"), false, "no signature");
  assert.equal(verifyCashfreeWebhook("", body, good, "secret"), false, "no timestamp");
  assert.equal(verifyCashfreeWebhook("1700000000", body, good.slice(0, -2), "secret"), false, "truncated");
});

test("mode: explicit setting wins, otherwise the keys decide", () => {
  assert.equal(cashfreeMode("TEST1234", "cfsk_ma_test_abc"), "sandbox");
  assert.equal(cashfreeMode("1234abcd", "cfsk_ma_prod_abc"), "production");
  assert.equal(cashfreeMode("1234abcd", "cfsk_ma_prod_abc", "sandbox"), "sandbox");
  assert.equal(cashfreeMode("TEST1234", "cfsk_ma_test_abc", "production"), "production");
  assert.equal(cashfreeMode("TEST1234", "cfsk_ma_test_abc", ""), "sandbox");
});

test("keys: both are needed", () => {
  const before = { ...process.env };
  delete process.env.CASHFREE_APP_ID;
  delete process.env.CASHFREE_SECRET_KEY;
  delete process.env.CASHFREE_ENV;
  assert.equal(cashfreeKeys(), null);
  process.env.CASHFREE_APP_ID = "TESTabc";
  assert.equal(cashfreeKeys(), null, "secret missing");
  process.env.CASHFREE_SECRET_KEY = "  cfsk_ma_test_x  ";
  assert.deepEqual(cashfreeKeys(), { appId: "TESTabc", secret: "cfsk_ma_test_x", mode: "sandbox" });
  process.env = before;
});

test("phone: Indian mobile numbers only, prefixes removed", () => {
  assert.equal(cleanPhone("9876543210"), "9876543210");
  assert.equal(cleanPhone("+91 98765 43210"), "9876543210");
  assert.equal(cleanPhone("09876543210"), "9876543210");
  assert.equal(cleanPhone("919876543210"), "9876543210");
  assert.equal(cleanPhone("1234567890"), null, "cannot start with 1");
  assert.equal(cleanPhone("98765"), null);
  assert.equal(cleanPhone(""), null);
  assert.equal(cleanPhone(undefined), null);
});

test("settlement: paid only when the order is PAID and a payment succeeded", () => {
  const order = (s) => ({ order_id: "o", order_status: s, order_amount: 699, order_currency: "INR" });
  const pay = (s, id = 1) => ({ cf_payment_id: id, payment_status: s, payment_group: "upi" });

  assert.deepEqual(settlementOf(order("PAID"), [pay("FAILED", 1), pay("SUCCESS", 2)]), {
    state: "paid",
    paymentId: "2",
    amountPaise: 69900,
    method: "upi",
  });
  assert.equal(settlementOf({ ...order("PAID"), order_amount: 699.5 }, [pay("SUCCESS")]).amountPaise, 69950);
  assert.equal(settlementOf(order("ACTIVE"), [pay("SUCCESS")]).state, "pending", "order not yet marked paid");
  assert.equal(settlementOf(order("PAID"), []).state, "pending", "payment not yet listed");
  assert.equal(settlementOf(order("ACTIVE"), [pay("PENDING")]).state, "pending");
  assert.equal(settlementOf(order("ACTIVE"), [pay("FAILED")]).state, "not_paid");
  assert.equal(settlementOf(order("ACTIVE"), [pay("USER_DROPPED")]).state, "not_paid");
  assert.equal(settlementOf(order("ACTIVE"), []).state, "not_paid", "window closed without trying");
  assert.equal(settlementOf(order("EXPIRED"), []).state, "not_paid");
});
