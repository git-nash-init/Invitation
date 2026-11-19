# Prompt for the AI agent: bring the licensed templates into Pratham Invitation and build every preview asset

Fill in the three `{{...}}` values, then give everything below the line to the agent.

---

## 0. Your job, in one paragraph

You are working on **Pratham Invitation** (प्रथम, "first"): a Next.js 16 and Supabase website where couples customize an interactive wedding invitation for free and pay once (Razorpay) to publish a shareable link. The owner now **owns or is licensed to use** a set of invitation templates and their assets, published at **{{SOURCE_SITE_URL}}**. Your job is to (A) export every asset of those templates from that source, (B) make each template run inside this site, (C) register it in the database and the site's catalogue, (D) **render each template with Chrome and encode it with ffmpeg** into the preview video and the card images, and (E) attach all of it to the website and prove it works. Do every phase. Nothing may be left out. When you finish, give the report described in section 9.

Inputs you will use:
- Repository: **{{REPO_URL_OR_LOCAL_PATH}}** (branch `main`; read `AGENTS.md` and `README.md` first).
- Live site: **https://pratham-invitation.vercel.app**
- Licence evidence: **{{WHERE_THE_LICENCE_OR_OWNERSHIP_PROOF_IS}}**. Copy it to `docs/licences/` and list every asset family it covers. If an asset is not covered, do not use it and say so in the report.

## 1. Rules that never bend

1. **No price anywhere on the public website.** No ₹, no "price", no "Pricing" on any public page or in any public page's HTML or JSON. The price lives only in `templates.price` in the database and is shown only on `/studio/<id>/publish`. Public queries must never select `price` or `list_price` (see `getTemplates` vs `getPricedTemplate` in `src/lib/templates.ts`).
2. **Template files are private.** They live in `private-templates/<slug>/` and are served only through the signed route `/t/<token>/<slug>/…` (`src/app/t/[...path]/route.ts`). Never put a template file in `public/`. Only the preview pack (section 5) is public, because it is watermarked.
3. **Everything a template needs must be self-hosted inside its folder** (or the shared `private-templates/_platform/`). The template page's Content-Security-Policy (`next.config.ts`) allows only: own files, `data:` and `blob:` images, Supabase images and media, Google Fonts CSS and font files. **No CDN scripts, no external images, videos or audio.** Download libraries (gsap, lenis and so on) into `_platform/vendor/` or the template folder.
4. **Secrets**: never print, log or commit a key or secret. Never touch `.env*` files, Razorpay, Supabase keys or the payment code (`src/lib/razorpay.ts`, `src/app/api/checkout*`, `src/app/api/razorpay*`). They are not part of this job.
5. **Git**: work on a branch, open or push a normal commit only after every check in section 7 passes. Never rewrite history or force-push. Never commit audio files (`*.mp3`, `*.m4a` are git-ignored on purpose). Do not copy music that is not covered by the licence proof.
6. **Brand**: the product is "Pratham Invitation". Remove or replace any other brand name, watermark text, logo, domain or support email that came with the source templates (search the exported files for them). Template sample names stay as the sample couple (Ankita and Kaushik) unless the source already uses other sample names.
7. Do not invent claims, counts, reviews or testimonials in any copy you write.

## 2. Phase A: export everything from {{SOURCE_SITE_URL}}

Goal: a complete, offline-working copy of each template. Do it like this and prove it.

1. **Find every template.** Open the source site, list each template (name, URL, how it is opened). Create `docs/asset-inventory.md` with a table: template, source URL, slug you will use (lowercase letters, digits and hyphens, 2 to 40 characters, e.g. `emerald-court`), licence reference.
2. **For each template, export every file it uses**, keeping its folder structure:
   - the HTML entry page, all CSS, all JavaScript (including files loaded later by other scripts);
   - every image (png, jpg, webp, svg, gif), every sprite and texture, including ones referenced only from CSS (`background-image`, `mask-image`, `@font-face`, `image-set`) and from JavaScript (strings, config files, arrays of file names);
   - every video and its poster, every audio file, every Lottie / JSON animation;
   - every font file (woff2, woff, ttf). Prefer woff2. Google Fonts used through `fonts.googleapis.com` may stay as links (the policy allows them);
   - the default text, names, ceremonies and gallery sample content (usually a `config.js` or JSON).
   Use the browser's network log plus the HTML/CSS/JS source to build the list; do not rely on one method. Check the template at phone width **and** desktop width, open it, scroll all the way to the end, open every section and gallery, and trigger every interaction, because many assets only load then.
3. **Prove nothing is missing.** After saving, serve the folder and load it with a headless browser while recording every request. The result must be **zero failed requests (no 404, no blocked request)** and **zero requests to another origin** except `fonts.googleapis.com` and `fonts.gstatic.com`. Write the request log summary into `docs/asset-inventory.md`.
4. **Fix paths.** All references must be relative to the template folder (`media/x.webp`), never absolute (`/assets/x.webp`) and never to the source domain. Shared libraries go to `../_platform/vendor/…`.
5. **Optimise without breaking** (update every reference if you rename or convert anything):
   - photographs: webp, quality 80 to 85, longest side no more than 2000 px, each file ideally under 300 KB (full-width backgrounds under 600 KB);
   - images with transparency: keep png or convert to webp with alpha; svg stays svg;
   - videos inside a template: h.264 mp4, no more than 720p, no audio unless the template needs it, under 3 MB each, with `+faststart`;
   - fonts: woff2 only;
   - a whole template folder should stay under about 8 MB; if it is larger, say why in the inventory.
6. **Music**: do not copy music into git. List each track in the inventory with its licence. Tracks are added later through Admin, Music, with a licence note.

## 3. Phase B: make each template work inside this site

Read two finished templates first as the reference: `private-templates/royale/` (frames, gallery, editor) and `private-templates/papercut/` (different structure). Copy their `platform-adapter.js` approach exactly. A template is a plain static folder:

```
private-templates/<slug>/
  index.html              entry page; loads scripts in this order (see royale/index.html):
                          config.js, platform-adapter.js, ../_platform/fit-text.js, render.js, app.js,
                          effects/scroll scripts, ../_platform/toolbar.js, ../_platform/rsvp.js,
                          ../_platform/date-display.js, ../_platform/editor-kit.js, editor.js,
                          ../_platform/music.js
  config.js               DEFAULTS: the sample couple, dates, ceremonies, gallery starters
  platform-adapter.js     bridge to the website (below)
  render.js / editor.js   draw the invitation; edit mode
  media/                  every image, video, font the template uses
```

**The contract with the website** (do not change the website to fit a template; change the template):

- **Three ways a template is opened**
  1. **Stand-alone** (URL with no `#platform=`): shows the template's own sample content, **including every sample gallery frame/photo placeholder**. The public live demo (`/demo/<slug>`) and the preview recorder use this mode. If a template hides sample content when no payload exists, fix that: a shopper must see the full design.
  2. **Edit** (`?edit=1#platform=…`): the studio. Empty photo areas show "Tap to add a photo"; clicking one opens the file picker (`pickPhoto` in `_platform/editor-kit.js`); the file is uploaded to `RY.uploadUrl` = `/api/invitations/<id>/media`. Music upload uses `/api/invitations/<id>/audio`. Gallery arrows and the remove button must keep working (see the comment in `royale/gallery.js` about pointer capture).
  3. **Guest** (`#platform=…`, no `?edit=1`): a published invitation. Frames or photos the host left empty are hidden. A guest name in the payload personalises the greeting.
- **The payload** is `#platform=<base64url JSON>`: `{ event: { id, status, commonLink, rsvpEvents, rsvpAutoManaged, rsvpManageable }, sectionOverrides: { __templateConfig }, guest: { name } | null }`. Merge `__templateConfig` over your `DEFAULTS` before the first paint (no flash of defaults).
- **Messages to the parent window** (`window.parent.postMessage`): `{type:'sutra:ready'}`, `{type:'sutra:mode', mode}`, `{type:'sutra:save', config}` (the whole config), `{type:'sutra:finalize'}` (the "Publish" button), and for RSVP `{type:'sutra:rsvp', status, headcount, message}` (the shared `_platform/rsvp.js` already sends the rest). Studio listens in `src/components/studio/studio-client.tsx`; guests' replies are handled in `src/components/invitation/public-frame.tsx`.
- Every template must have: an **opening screen** whose control reads **"Tap to open"** (the recorder looks for that text; if yours says something else, add `tap: "<text>"` for it in `OPTS` in `scripts/make-previews.mjs`), RSVP, a map link per ceremony, music, and a gallery or photo area the host can fill in.

Test locally (`npm install`, `npm run dev`, port 3300 is fine):
- `/demo/<slug>`: the whole design with sample content; scroll to the end; any sideways gallery must have scrollable width greater than its visible width and must move by trackpad or mouse drag.
- Studio-style load: take the iframe `src` from `/demo/<slug>`, add `?edit=1#platform=<payload with a fake event id>` and confirm that clicking an empty photo opens the file chooser and that editing text works.
- Console: **no errors**.

## 4. Phase C: register each template in the site

1. **Database**: add a migration file `supabase/migrations/<timestamp>_add_<slug>.sql` and apply it to the project (Supabase CLI or SQL editor; if you cannot apply it, give the SQL to the owner and say so in the report):

```sql
insert into public.templates
  (slug, name, tagline, category, highlights, cover_path, bullets, category_slug, sort, is_active, price)
values
  ('<slug>', '<The Display Name>', '<one sentence, 60 to 120 characters>', '<short category label>',
   '<three or four words>', '/previews/<slug>/cover.webp',
   '["<benefit one>", "<benefit two>", "<benefit three>"]'::jsonb,
   '<royal-palace | floral-pastel | papercut-art | a new slug you also insert into public.categories>',
   <next sort number>, true, 699);
```

   Exactly three bullets, each under 50 characters and describing something a guest or host really gets. The price is a default; the owner changes it in Admin, Templates.
2. **Site copy**: in `src/lib/showcase.ts` add `SHOWCASE[<slug>]` (`feel`: a few words; `useCase`: one honest sentence about a real situation), add the slug to `TEMPLATE_GROUPS` (style filters: `royal`, `floral`, `papercut`, `festive`; a design may be in several), and add it to `FALLBACK_SLIDES`.
3. **Preview settings**: only if needed, add the slug to `OPTS` in `scripts/make-previews.mjs` (`tap`, `openWait`, `settle`, `coverFrom`; documented at the top of that object).

## 5. Phase D: render with Chrome, encode with ffmpeg, make the preview pack

You do not draw these by hand and you do not screen-record manually. The repo already has the pipeline. It serves `private-templates/` itself on a free local port, opens each template in Chrome as a phone, records it, and encodes with ffmpeg.

**Prerequisites**: Google Chrome (set `CHROME_PATH`), `ffmpeg` and `ffprobe` on the PATH, and a bold font for the watermark (`WATERMARK_FONT`, in ffmpeg path-escaping; Windows default `C\:/Windows/Fonts/arialbd.ttf`; on Linux e.g. `/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf`). Run `npm install` first (it provides `puppeteer-core`).

**Commands**
```
npm run previews:make                          # every template (new folders are found automatically)
npm run previews:make -- <slug>                # one template: video, stills and cover
npm run previews:make -- <slug> --video-only   # re-record only the video; stills and cover stay
npm run previews:verify                        # the pass/fail check (see "The proof" below); must pass
```

**What it produces for each template, in `public/previews/<slug>/`** (this is the complete list; all six files are required)

| File | Spec | Used for |
| --- | --- | --- |
| `preview.mp4` | 720x1280 (9:16), 30 fps, h.264, yuv420p, **no audio**, `+faststart`, CRF 26, 8 to 24 s, watermark "Pratham Invitation preview" (small corner tag plus a faint diagonal one) | hero phone, hover on cards, the template page, the showcase |
| `poster.webp` | the **first frame of preview.mp4**, extracted from the encoded video | the poster of every video player, so a video starting changes nothing on screen |
| `cover.webp` | 720 px wide (720x1280), webp quality 86, **clean, no watermark**, an attractive frame of the opened invitation | the arch-shaped card in the catalogue, the social share image |
| `still-1.webp`, `still-2.webp`, `still-3.webp` | 720 px wide, quality 82, watermarked: 1 the opening screen, 2 just after opening, 3 a scrolled section | thumbnails on the template page and showcase |
| `manifest.json` | slug, files, probe, bytes, `tapped: true`, `pageErrors: []` | a record |

**What the cover must look like.** The card shows it cropped to a 3:4 arch with `object-fit: cover`, with a "Live preview" pill over the bottom centre. So: the subject and any names sit in the middle two thirds, not in the top 12 % or the bottom 20 %; never a half-drawn animation (the title must be fully visible: raise `openWait` for that template until it is); never the opening "Tap to open" card (that is the poster's job); and **it must not look like any other template's cover** (the verifier measures this; choose `coverFrom` 1, 2 or 3, or wait longer, until it differs).

### The 3-second bug, and how it must never come back

**What it was.** Each video used to open on the "Tap to open" card, then at about 2 s the page visibly re-rendered (a flash, the intro animation replaying), and then the "Tap to open" card appeared a second time. On a card hover this looked like: the image, then a rendering flicker, then the opening screen loading again. **Cause:** the recorder took a screenshot while the screen recording was running. A screenshot makes Chrome re-lay-out the page, and the recording captured that re-render.

**Rules (all mandatory; the pipeline already follows them, keep it that way):**
1. **Never take a screenshot, evaluate layout-changing code, resize or emulate anything while a recording is running.** Stills and the cover are taken in a **separate page load** before or after the recording (`captureStills` and `captureVideo` in `scripts/make-previews.mjs`).
2. **Start the recording only after the page has settled**: `networkidle2`, then about 1.5 s for fonts and the opening animation (add `settle` in `OPTS` if a template needs longer). The first frame of the video must already be the final, stable "Tap to open" screen.
3. Record at 360x640 CSS pixels with `deviceScaleFactor: 2` (mobile and touch emulation on). **Do not pass the `scale` option to `page.screencast`** (it zooms the frame). The recorded file is 720x1280.
4. After the recording starts: wait about 1.6 s on the opening screen, press "Tap to open" with a real click, wait for the opening animation, then scroll slowly (wheel steps with pauses) through the whole invitation.
5. Encode with `-ss 0.4` to drop the first moments of the recording (recorder warm-up), `fps=30`, `scale=720:-2:flags=lanczos`, then the watermark. Never trim by guessing; the verifier decides.
6. `poster.webp` is always cut from the finished `preview.mp4` (frame 0).
7. On the website a card never shows its video until the video is actually playing, and it always starts from frame 0 (`src/components/landing/template-card.tsx`). Do not change that.

**The proof.** `npm run previews:verify` must print `All checks passed` and exit 0. It checks, per template: the six files; h.264/yuv420p; 720x1280; 8 to 30 s; no audio; faststart; **the first 0.8 s is steady (frame-to-frame similarity at least 0.94)**; **the opening card never returns after the picture has changed** (this is the exact old bug: on the old videos it reports "GLITCH: the opening card comes back at 3.2 s"); the poster equals frame 0; the cover is 720 wide; and no two covers look alike. If it fails, fix the cause and re-record; never lower the thresholds.

Also look with your own eyes: extract a contact sheet of the first 5 seconds (`ffmpeg -i preview.mp4 -t 5 -vf "fps=2,scale=140:-2,tile=10x1" -frames:v 1 sheet.png`) and open it for every template. It must show the same opening card for about one second, then the tap, then the opening animation, with no card repeated afterwards.

## 6. Phase E: attach everything to the website and check each page

The site already uses the pack through `src/lib/showcase.ts` (`previewVideo`, `previewPoster`, `previewCover`, `previewStill`) and the database `cover_path`. Once the files and the database row exist, the template appears automatically on `/`, `/templates` (with the style filter buttons), `/preview/<slug>` and the "every other design" list. Confirm each of these in a real browser at 1440 px and 390 px width:

- `/templates`: the new card is there, its cover is different from every other card, the filter button for its style shows it, and hovering the card starts the video **at the "Tap to open" screen within 0.3 s with no blank flash and no restart**, and leaving resets it.
- `/preview/<slug>`: the phone shows the video with its poster, the three stills load, "Open live preview" opens `/demo/<slug>`, "Customize free" asks to sign in (when signed out).
- `/` hero phone and showcase list include it and play.
- No horizontal page scroll; no console errors; no request to another origin.
- **Crawl the public pages and prove none contains "₹", "price" or "Pricing"** (`/`, `/templates`, `/preview/<slug>`, `/demo/<slug>`, `/terms`, `/privacy`, `/refund`, `/contact`).

## 7. Acceptance checks (run them all; paste the real output in your report)

```
npx tsc --noEmit
npm run lint
npm test
npm run previews:verify
npm run build
npm run dev            # in another terminal:  npm run qa:header   (header behaviour must still pass)
```

After deploying (push to `main`; Vercel builds it), request `https://pratham-invitation.vercel.app/previews/<slug>/preview.mp4`, `poster.webp`, `cover.webp`, `still-1..3.webp` (each must return 200 with the right content type) and `https://pratham-invitation.vercel.app/templates` (the new card must be in the HTML).

## 8. Order of work

1. Read `AGENTS.md`, `README.md`, `docs/production-guide.md`, `src/lib/showcase.ts`, `scripts/make-previews.mjs`, `scripts/verify-previews.mjs`, `private-templates/royale/`.
2. Phase A for all templates (inventory file first), then B, C, D, E for one template end to end, then repeat for the others.
3. Commit in small steps with clear messages.

## 9. Final report (exactly this shape)

For every template, one row: slug; source URL; files exported (count and MB); zero-failed-request proof; the six preview files with their sizes; the `previews:verify` lines for it; the page checks (yes or no for each item in section 6). Then: the migration SQL and whether it was applied; anything you could not do and why (be explicit); any asset you skipped for licence reasons; the commit hashes. Do not say a phase is done unless you ran its command and have the output. If something is left out, say so plainly.
