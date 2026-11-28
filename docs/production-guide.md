# Going live: Pratham Invitation

Live site: **https://pratham-invitation.vercel.app** (Vercel project `sutraluxe`, now serving the Pratham Invitation site; rename the project in Vercel if you like).

**Never paste a secret into a chat.** Secrets go straight into the Vercel or Supabase dashboard.

## What runs where

| Part | Where |
| --- | --- |
| Website, studio, admin, payment routes | Vercel |
| Database, sign-in, file storage | Supabase (project `znpngvxlmgtpqgsmkzsv`) |
| Payments | Cashfree Payments |

## 1. Vercel environment variables

Vercel → your project → Settings → Environment Variables. Add each for **Production** (and Preview if you use previews), then **redeploy**.

| Name | Value | Status |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://znpngvxlmgtpqgsmkzsv.supabase.co` | already set |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | the publishable key (safe to expose) | already set |
| `NEXT_PUBLIC_SITE_URL` | `https://pratham-invitation.vercel.app` | already set |
| `ASSET_TOKEN_SECRET` | long random value that signs template links | already set |
| `PAYMENT_BRIDGE_SECRET` | lets the site confirm payments in the database | already set (matches Supabase Vault) |
| `CASHFREE_APP_ID` | Cashfree App ID | already set |
| `CASHFREE_SECRET_KEY` | Cashfree Secret Key, mark **Sensitive** | already set |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | support email shown on the Contact page | **you add** |
| `NEXT_PUBLIC_SUPPORT_PHONE` | phone or WhatsApp (optional) | optional |
| `NEXT_PUBLIC_BUSINESS_NAME` | your legal or trading name | **you add** |
| `NEXT_PUBLIC_BUSINESS_ADDRESS` | business address (the payment gateway asks for it) | **you add** |

Remove `NEXT_PUBLIC_BOT_USERNAME` if it is still there; nothing uses it now.

Admin → **Payments setup** shows which of these are in place (names only, never values).

## 2. Cashfree

1. In the Cashfree dashboard, Developers, API Keys, copy the **App ID** and **Secret Key**.
2. In Vercel, Settings, Environment Variables, add `CASHFREE_APP_ID` and `CASHFREE_SECRET_KEY` (mark the secret **Sensitive**), then redeploy. Leave `CASHFREE_ENV` unset: test keys use the sandbox, live keys take real payments.
3. In the Cashfree dashboard, whitelist the site address (`https://pratham-invitation.vercel.app`) for the payment gateway.
4. No webhook needs to be created by hand: every order tells Cashfree to call `/api/cashfree/webhook`, and the call is checked with the Secret Key.

The checkout asks the payer for a mobile number (Cashfree requires it). Without both keys the site cannot take payments and the publish button says so.

How payment is trusted: the browser is never believed. The server asks Cashfree for the order, and only when Cashfree says it is paid in full does it mark the order paid in the database, which re-checks the amount. The webhook does the same if the customer closes the tab right after paying.

Before real customers: read the refund text on `/refund`. **It is a draft policy written for you; change it to what you actually offer.**

Remove any `RAZORPAY_*` variables still in Vercel; nothing uses them now.

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

- [ ] A real small payment passes end to end (Orders shows it as Paid, publishing unlocks), then refund it from the Cashfree dashboard
- [ ] `/refund` text matches what you really offer; Contact details filled in
- [ ] Custom SMTP sender working (sign up with a new email and check it arrives)
- [ ] Music: nothing plays by default. Add tracks in Admin → Music with a licence note for each
- [ ] Vercel Firewall rule rate-limiting `/api/*`, `/t/*`, `/auth/*`
- [ ] Backups: Supabase free plan has none; upgrade for daily backups
- [ ] Custom domain connected, then update `NEXT_PUBLIC_SITE_URL`, the Supabase Site URL and redirect URLs, and whitelist the new domain in the Cashfree dashboard

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
