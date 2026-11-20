import { test } from "node:test";
import assert from "node:assert/strict";
import { compose, whatsappUrl, telegramUrl, smsUrl, emailUrl } from "../src/lib/share.ts";

const body = "Hi {friend}! {host} invites you: {link}";
const link = "https://pratham.example/i/abc123/def456";

test("compose fills every placeholder, including repeats", () => {
  assert.equal(
    compose({ body: "{friend} {friend} {host} {link}", friend: "Aarti", host: "Ankita & Kaushik", link }),
    `Aarti Aarti Ankita & Kaushik ${link}`,
  );
});

test("compose cleans markup and control characters out of names", () => {
  const msg = compose({ body, friend: "<b>Rohan</b>\n\tKapoor", host: "A", link });
  // Markup characters and line breaks become single spaces; nothing can inject a tag or a new line.
  assert.equal(msg, `Hi b Rohan /b Kapoor! A invites you: ${link}`);
});

test("compose falls back for an empty name", () => {
  assert.ok(compose({ body, friend: "   ", host: "", link }).startsWith("Hi there!"));
});

test("compose limits very long names", () => {
  const msg = compose({ body: "{friend}", friend: "x".repeat(500), host: "h", link });
  assert.equal(msg.length, 80);
});

test("WhatsApp, SMS and email links encode the message", () => {
  const msg = compose({ body, friend: "Aarti & Co", host: "A", link });
  assert.ok(whatsappUrl(msg).startsWith("https://wa.me/?text="));
  assert.ok(!whatsappUrl(msg).includes(" "));
  assert.ok(whatsappUrl(msg).includes(encodeURIComponent("Aarti & Co")));
  assert.ok(smsUrl(msg).startsWith("sms:?&body="));
  assert.ok(emailUrl(msg, "You are invited").startsWith("mailto:?subject=You%20are%20invited&body="));
});

test("Telegram link carries the link separately and does not repeat it in the text", () => {
  const msg = compose({ body, friend: "Aarti", host: "A", link });
  const url = new URL(telegramUrl(msg, link));
  assert.equal(url.origin + url.pathname, "https://t.me/share/url");
  assert.equal(url.searchParams.get("url"), link);
  assert.ok(!url.searchParams.get("text").includes(link));
  assert.ok(url.searchParams.get("text").includes("Aarti"));
});

import { phoneDigits } from "../src/lib/share.ts";

test("phone numbers become WhatsApp digits: +91 and bare Indian numbers, junk is dropped", () => {
  assert.equal(phoneDigits("+91 98765-43210"), "919876543210");
  assert.equal(phoneDigits("098765 43210"), "919876543210");
  assert.equal(phoneDigits("9876543210"), "919876543210");
  assert.equal(phoneDigits("0044 7700 900123"), "447700900123");
  assert.equal(phoneDigits("12345"), "");
  assert.equal(phoneDigits(undefined), "");
});

test("a picked contact's number opens their own chat; without one nothing breaks", () => {
  assert.equal(whatsappUrl("Hi", "+91 98765 43210"), "https://wa.me/919876543210?text=Hi");
  assert.equal(whatsappUrl("Hi"), "https://wa.me/?text=Hi");
  assert.equal(smsUrl("Hi", "9876543210"), "sms:+919876543210?&body=Hi");
  assert.equal(smsUrl("Hi"), "sms:?&body=Hi");
  assert.equal(emailUrl("Hi", "S", "aarti@example.com"), "mailto:aarti@example.com?subject=S&body=Hi");
  assert.equal(emailUrl("Hi", "S", "not an email"), "mailto:?subject=S&body=Hi");
});
