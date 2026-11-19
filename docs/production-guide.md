# Going live: Pratham Invitation

Live site: **https://pratham-invitation.vercel.app** (Vercel project `sutraluxe`, now serving the Pratham Invitation site; rename the project in Vercel if you like).

**Never paste a secret into a chat.** Secrets go straight into the Vercel or Supabase dashboard.

## What runs where

| Part | Where |
| --- | --- |
| Website, studio, admin, payment routes | Vercel |
| Database, sign-in, file storage | Supabase (project `znpngvxlmgtpqgsmkzsv`) |
| Payments | Razorpay |

## 1. Vercel environment variables

Vercel → your project → Settings → Environment Variables. Add each for **Production** (and Preview if you use previews), then **redeploy**.

| Name | Value | Status |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://znpngvxlmgtpqgsmkzsv.supabase.co` | already set |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | the publishable key (safe to expose) | already set |
| `NEXT_PUBLIC_SITE_URL` | `https://pratham-invitation.vercel.app` | already set |
| `ASSET_TOKEN_SECRET` | long random value that signs template links | already set |
| `PAYMENT_BRIDGE_SECRET` | lets the site confirm payments in the database | already set (matches Supabase Vault) |
| `RAZORPAY_KEY_ID` | Razorpay Key ID, e.g. `rzp_test_...` | **you add** |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | the same Key ID (public) | **you add** |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret, mark **Sensitive** | **you add** |
| `RAZORPAY_WEBHOOK_SECRET` | the secret you type when creating the webhook, mark **Sensitive** | **you add** |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | support email shown on the Contact page | **you add** |
| `NEXT_PUBLIC_SUPPORT_PHONE` | phone or WhatsApp (optional) | optional |
| `NEXT_PUBLIC_BUSINESS_NAME` | your legal or trading name | **you add** |
| `NEXT_PUBLIC_BUSINESS_ADDRESS` | business address (Razorpay asks for it) | **you add** |

Remove `NEXT_PUBLIC_BOT_USERNAME` if it is still there; nothing uses it now.

Admin → **Payments setup** shows which of these are in place (names only, never values).

## 2. Razorpay

1. Create an account at razorpay.com. **Test mode** works immediately and moves no real money. Live mode needs KYC (PAN, bank account, business details) and a website with the Terms, Privacy, Refund and Contact pages (all four exist on this site).
2. Settings → API Keys → generate keys. Put the Key ID and Key Secret into Vercel as above.
3. Settings → Webhooks → Add:
   - URL: `https://pratham-invitation.vercel.app/api/razorpay/webhook`
   - Secret: invent a long random value and use the same one for `RAZORPAY_WEBHOOK_SECRET`
   - Events: `payment.captured`, `order.paid`, `payment.failed`, `refund.processed`
4. Redeploy. Test with a Razorpay test card or test UPI ID from their docs (test mode keys only).
5. Before real customers: read the refund text on `/refund`. **It is a draft policy written for you; change it to what you actually offer.**

How payment is trusted: the browser is never believed. The server checks Razorpay's signature, asks Razorpay for the payment and its amount, and only then marks the order paid in the database. The webhook does the same if the customer closes the tab right after paying. The price always comes from the database, never from the browser.

## 3. Google sign-in

The code is already in place. It needs two dashboards:

**Google Cloud** (console.cloud.google.com)
1. Create a project, then APIs and Services → OAuth consent screen: app name `Pratham Invitation`, your support email, and your domain. Publish the app so anyone can sign in.
2. Credentials → Create OAuth client ID → type **Web application**.
3. Authorized redirect URI: `https://znpngvxlmgtpqgsmkzsv.supabase.co/auth/v1/callback`
4. Copy the Client ID and Client Secret.

**Supabase** (Authentication)
1. Providers → Google: switch on, paste the Client ID and Secret.
2. URL Configuration: Site URL `https://pratham-invitation.vercel.app`. Redirect URLs: add `https://pratham-invitation.vercel.app/auth/callback` (and `http://localhost:3000/auth/callback` for local work).
3. Providers → Email: keep **Confirm email** on and turn on leaked-password protection.
4. SMTP Settings: set your own sender (Resend or Brevo). Supabase's built-in email allows only a few messages an hour, so sign-up emails would stop working.

Test: open the site, Log in, Continue with Google. If it fails, the address bar shows a Google error: "redirect_uri_mismatch" means the redirect URI above does not match exactly.

## 4. Make yourself the admin

1. Sign up on the site with your email and confirm it.
2. Supabase → SQL Editor:

```sql
insert into public.admins (user_id)
select id from auth.users where email = 'you@example.com';
```

3. Open `/admin`. Anyone not in that table sees a normal "not found" page.

## 5. Before you advertise

- [ ] A Razorpay test payment passes end to end (Orders shows it as Paid, publishing unlocks)
- [ ] `/refund` text matches what you really offer; Contact details filled in
- [ ] Custom SMTP sender working (sign up with a new email and check it arrives)
- [ ] Music: nothing plays by default. Add tracks in Admin → Music with a licence note for each
- [ ] Vercel Firewall rule rate-limiting `/api/*`, `/t/*`, `/auth/*`
- [ ] Backups: Supabase free plan has none; upgrade for daily backups
- [ ] Custom domain connected, then update `NEXT_PUBLIC_SITE_URL`, the Supabase Site URL and redirect URLs, and the Razorpay webhook address

## Previews

The preview videos and covers in `public/previews/` are generated from the real templates:

```bash
npm run previews:make            # all five
npm run previews:make -- royale  # one
```

It serves the templates itself and records them with your installed Chrome and ffmpeg. Commit the result.

## Honest limits

- **Copying**: nothing a browser shows can be made impossible to copy. Template files are not public; the live preview is signed, expires after 10 minutes, carries a watermark and blocks casual copying. That makes copying hard and traceable, not impossible.
- **Instagram**: Instagram has no link that opens a message to a person. On phones the Instagram button opens the share sheet; on a computer it copies the message.
- **Images**: the hero and background scenes are AI-generated artwork, not photographs of real places.
