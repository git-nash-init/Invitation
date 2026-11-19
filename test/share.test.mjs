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
