# Going live: step by step

Do these in order. Steps marked **You** need your accounts; steps marked **Claude** I do for you once you tell me the earlier step is done.

**Never paste a token or key into a chat.** Anything secret goes straight into the Supabase or Vercel dashboard.

## What runs where

| Part | Where | Notes |
| --- | --- | --- |
| Telegram bot and the every-minute worker | Supabase Edge Function `telegram-bot` plus `pg_cron` | Already deployed. Needs your secrets (step 3) |
| Database, sign-in, file storage | Supabase | Already set up |
| Website, studio, admin panel | Vercel | Blocked until Vercel access is fixed (step 5) |
| Payment check | Gemini API | Reads the payment screenshot |

## 1. Create the Telegram bot (You, 5 minutes)

1. In Telegram open **@BotFather** and send `/newbot`.
2. Name it (for example `SutraLuxe Invitations`) and choose a username ending in `bot`.
3. BotFather sends a long **token**. Keep it private. It goes in step 3.
4. Still in BotFather, make it look right:
   - `/setdescription`: `Interactive wedding invitations. Pick a style, preview it, pay by UPI, customize on our site, share by link.`
   - `/setabouttext`: `Make your invitation in minutes.`
   - `/setuserpic`: upload your logo.
   - `/setprivacy` then **Enable** (the bot only needs private chats).

## 2. Get your keys (You, 5 minutes)

- **Gemini key**: aistudio.google.com, create an API key. The free tier is fine to start. Google may review what is sent on the free tier, so switch on billing for the key's project once you have real sales.
- **Your Telegram ID**: your old bot used `5660886043`. Use the same number here unless you want a different admin. You can confirm later by sending `/id` to the new bot.
- **Your UPI ID and the name it shows** to people paying you (exactly as the UPI app displays it).

## 3. Set the secrets in Supabase (You, 5 minutes)

Supabase dashboard, project `znpngvxlmgtpqgsmkzsv`, **Edge Functions**, **Secrets**. Add:

| Name | Value |
| --- | --- |
| `BOT_TOKEN` | the token from step 1 |
| `GEMINI_KEY` | the Gemini key |
| `ADMIN_IDS` | your Telegram ID (several admins: separate with commas) |
| `BOT_USERNAME` | the bot's username without the @ |
| `SUPPORT_USERNAME` | the Telegram username buyers should message for help, without the @ |
| `SITE_URL` | your website address, must start with `https://` (use the Vercel address until you have a domain) |

You do **not** need to create a webhook secret or a worker secret. The system makes those itself.

## 4. Redeploy the bot (Claude)

Tell me step 3 is done. I redeploy the function with the latest code (it includes the `/testpay` command) and check it answers.

## 5. Put the website live on Vercel (You, then Claude)

The Vercel connection I have was refused for the account `try.avinasht@gmail.com`. Pick one:

- Grant that connection access to the Vercel account (Vercel asks you to approve it), or
- In this session run `! npx vercel login`, or
- Import the repo yourself at vercel.com/new (repo `git-nash-init/Invitation`).

Environment variables to add in Vercel (Settings, Environment Variables, all environments):

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://znpngvxlmgtpqgsmkzsv.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | the publishable key (it is safe to expose) |
| `NEXT_PUBLIC_SITE_URL` | your site address, `https://...` |
| `NEXT_PUBLIC_BOT_USERNAME` | the bot's username without the @ |
| `ASSET_TOKEN_SECRET` | a long random value. Make one with `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |

After the first deploy, copy the real address into `NEXT_PUBLIC_SITE_URL` (Vercel) and `SITE_URL` (Supabase secret) if it changed.

## 6. Sign-in settings in Supabase (You, 10 minutes)

Supabase dashboard, **Authentication**:

1. **URL Configuration**: set **Site URL** to your site address. Under **Redirect URLs** add `https://YOUR-SITE/auth/callback` (and `http://localhost:3000/auth/callback` for local work).
2. **Providers, Google**: create an OAuth client in Google Cloud (Credentials, OAuth client ID, Web). Add the callback address Supabase shows you as an authorised redirect URI, then paste the client ID and secret into Supabase.
3. **Providers, Email**: keep **Confirm email** on. Turn on **leaked password protection**.
4. **SMTP settings: set up your own sender** (Resend, Brevo or similar). Supabase's built-in email sender allows only a handful of emails per hour, so sign-up confirmations and password resets would fail once you have real users. This is the most common thing that breaks a launch.

## 7. Make yourself the admin (You, 2 minutes)

1. Open your site, **Sign up** with the email you will use for admin, and confirm the email.
2. In Supabase, **SQL Editor**, run (with your email):

```sql
insert into public.admins (user_id)
select id from auth.users where email = 'you@example.com';
```

3. Open `https://YOUR-SITE/admin`. Anyone not in that table sees an ordinary "not found" page.

## 8. Connect the bot (You, 1 minute)

1. In the admin panel go to **Setup** and press **Connect Telegram bot**. It shows `Connected to @yourbot`.
2. In Telegram send `/start` to your bot. You should see the categories.
3. Send `/id`. It must show your Telegram ID. If it does not match `ADMIN_IDS`, fix the secret and redo step 4.
4. In **Setup** the checks should turn green, including **Every-minute worker is running**.

## 9. Add your payment details (You, 2 minutes)

Admin, **Payments**, **Add a UPI ID**: the UPI ID, the receiver name exactly as payers see it, and a daily limit if you want one.

## 10. Test with real money (You, 15 minutes)

1. In the bot send `/testpay`. It shows a QR for about ₹1. Pay it from **another** UPI app and send the screenshot. You should get **Test passed**.
2. From a **second Telegram account** (a friend's phone is fine): `/start`, pick a template, **Buy**, pay the exact amount with the paise, send the screenshot.
3. Two outcomes are both good:
   - It passes by itself: the buyer receives **Open my studio**, and you receive a sale alert.
   - It needs a check: you receive the screenshot with **Approve** and **Reject**. Open your UPI app, find the exact amount, then approve.
4. As the buyer, tap **Open my studio**, sign in on the site, **Start customizing**, **Publish**, then **Send to your friends**. Open a friend link on a second phone and confirm the friend's name shows.
5. Open **Admin, Orders** and **Overview**: the sale appears there.

## 11. Previews and music (You and Claude, before you advertise)

- **Previews**: until preview media is uploaded, the bot shows each template's cover image. To make real ones from the actual templates (needs ffmpeg and Chrome on your computer):
  1. Build and start the site locally with `ASSET_TOKEN_SECRET` set: `npm run build`, then `npx next start -p 3201`.
  2. In another terminal: `ASSET_TOKEN_SECRET=<same value> BASE_URL=http://localhost:3201 npm run previews:make`. This writes a watermarked 540x960 video and three stills per template to `previews-out/` (about 1 MB each).
  3. After step 7 (you are admin): `ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=... npm run previews:upload`. This uploads them and registers them, and the bot shows them from then on.
  You can also replace these with clips from Flow later (see `docs/flow-asset-guide.md`).
- **Music**: nothing plays by default. Add tracks in **Admin, Music** after generating them (guide in `docs/flow-asset-guide.md`). Write the licence note for each one, because a track cannot go live without it.

## 12. Go-live checklist

- [ ] Steps 1 to 10 done, a real ₹1 test passed
- [ ] Terms and Privacy pages reviewed by someone who can give legal advice
- [ ] Flow terms for your plan read and saved with each track
- [ ] Custom SMTP sender working (sign up with a new email and confirm it arrives)
- [ ] Vercel Firewall rule that rate-limits `/api/*`, `/t/*` and `/auth/*`
- [ ] Backups: the Supabase free plan has no automatic backups. Upgrade to Pro for daily backups, or schedule your own `pg_dump`
- [ ] Custom domain connected, and `SITE_URL` and `NEXT_PUBLIC_SITE_URL` updated to it
- [ ] Bot profile finished in BotFather
- [ ] You know how to remove a wrong sale: `/revoke ORDER-ID` in the bot

## When something is wrong

| What you see | Likely cause | Fix |
| --- | --- | --- |
| Setup: worker not running | Scheduler or function down | Supabase, Edge Functions, `telegram-bot`, Logs. The scheduler is `cron.job` named `bot-tick` |
| Bot silent | Webhook not connected, or `BOT_TOKEN` wrong | Press **Connect Telegram bot** again |
| Buttons show text links instead | `SITE_URL` does not start with `https://` | Fix the secret |
| "Buy this template first" on the site | The buyer has no unused purchase | They must buy, then open the studio link from the bot |
| Sign-up emails never arrive | Built-in email sender limit | Set up SMTP (step 6) |
| Template page is blank in the studio | `ASSET_TOKEN_SECRET` missing on Vercel | Add it and redeploy |
| Payments paused message | No UPI ID is on, or all hit their daily limit | Admin, Payments |

## Honest limits

- **Copying**: nothing a browser displays can be made impossible to copy. The setup removes public access to template files, gives each demo to one named person for a few minutes, tiles their name across it, and sends previews with Telegram's no-forward protection. It makes copying hard and traceable, not impossible.
- **Instagram**: Instagram has no link that opens a message to a person. On phones the Instagram button opens the share sheet. On a computer it copies the message.
- **UPI screenshots**: a screenshot check can be fooled. That is why the bot uses exact-paise amounts, one-time payment references and a two-tap approval. A payment gateway with webhooks (Razorpay or Cashfree) would verify automatically and is the right upgrade once sales are steady.
