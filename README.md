# Pratham Invitation (प्रथम)

Interactive wedding invitations. A host picks a template, customizes it, publishes it and shares a link: one link for everyone, or a personal link for each guest that shows the guest's name on the invitation. Guests reply with an RSVP and the host sees every reply in a dashboard.

Next.js (App Router) · Supabase (Auth, Postgres with row-level security, Storage) · Tailwind · motion

## Run it locally

```bash
npm install
cp .env.example .env.local   # then fill in the Supabase URL and publishable key
npm run dev
```

Only the Supabase **publishable** key belongs in this app. Never add the `service_role` key.

## How it fits together

- `src/app` – routes: landing, templates, preview, auth, dashboard, studio, public invitations (`/i/<slug>` and `/i/<slug>/<guest-code>`), API routes.
- `src/lib/supabase` – server, browser and proxy (session refresh and route guard) clients.
- `src/lib/invitations` – queries, server actions, config sanitiser, upload checks.
- `private-templates` – the invitation templates. They run in same-origin iframes and talk to the host page over `postMessage` (`sutra:*` messages).
- Database changes are SQL migrations applied to the Supabase project; row-level security is on for every table, and anonymous visitors only reach data through the `open_invitation` and `submit_rsvp` functions.

## Security notes

- Invitation config is sanitised on the server before it is stored (markup characters removed, URL fields allow-listed) because the templates insert some text with `innerHTML`.
- Uploads are checked by file signature, size and owner folder.
- Security headers (CSP, HSTS, frame rules) are set in `next.config.ts`.
- Add a rate-limit rule for `/api/*` in the hosting firewall; the in-app limiter is best-effort per instance.

## Auth setup (Supabase dashboard)

1. Authentication → URL Configuration: set the Site URL and add the deployed domain and `/auth/callback` to the redirect URLs.
2. Authentication → Providers → Google: add an OAuth client ID and secret from Google Cloud.
3. Authentication → Sign In / Providers: turn on email confirmation and leaked-password protection.

## Payments and admin

Designing an invitation is free. Publishing needs one paid order, taken by Cashfree on the publish page (`/studio/<id>/publish`, the only place a price is shown). The admin panel is at `/admin`.

- Going live, environment variables, Cashfree and Google sign-in: [docs/production-guide.md](docs/production-guide.md)
- Making Flow videos and music, and what to send back: [docs/flow-asset-guide.md](docs/flow-asset-guide.md)
- Tests: `npm test` (payment signatures, share links)
- Preview media: `npm run previews:make`

Template files are not public. They live in `private-templates/` and are served only through short-lived signed links (`/t/<token>/...`).
