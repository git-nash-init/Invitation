> **Superseded for previews and template assets.** Use `docs/ai-agent-asset-prompt.md`: the preview video, poster and card images are now made by `npm run previews:make` and checked by `npm run previews:verify`. The Telegram parts of this guide no longer apply (the bot was removed). The Flow prompts and music ideas below are still usable if you want extra background clips or tracks.

# Flow asset guide: videos and music for Pratham Invitation

You generate the clips and songs in Google Flow and Flow Music. You drop them in `assets-in/`. I turn them into the website experience and the Telegram previews.

Some menu names below may differ on your screen. Follow the idea, not the exact label.

## 0. Before you start (5 minutes)

1. Sign in to Flow with your Google account. Check which plan you are on and read its **terms of use for commercial use**. The free tier gives daily credits, but whether free-tier output may be used in a product you sell was not clear in my research. You confirm this for your plan. Save a screenshot of the terms page.
2. After your first download, **play the file** and check for a visible "Made with Veo" mark or any watermark. If it is there, do not send it: generate on a plan that removes it, or tell me and we decide together. Audio from Flow Music may also carry an inaudible watermark; that is fine.
3. Make one project called `Pratham Invitation` so everything stays together.

## 1. Video settings (use these for every clip)

| Setting | Value |
| --- | --- |
| Mode | Text to Video |
| Model | Veo 3.1 Fast (or Lite to save credits; Quality only for final picks) |
| Aspect ratio | **9:16 portrait** (phones are the main screen). Also make **16:9** of your two best clips for desktop |
| Length | Longest the tool allows (usually 8 s) |
| Outputs per prompt | 1 or 2, then keep the best |
| Audio | Off if there is a switch. We add our own music |
| Resolution | Highest download option |

Two clips per template: an **intro** (something opens or unfolds) and an **ambient loop** (gentle motion behind the invitation text).

For a seamless loop, if Flow offers **Frames to Video** (start and end frame), use the same still as both. If not, no problem: I crossfade the loop with ffmpeg.

**Rules for every prompt:** no people, no faces, no text, no logos, no brand names. Real text comes out garbled in video; names and dates are added by the website. Keep the centre and lower third calm so text stays readable.

## 2. Video prompts

Copy each prompt as is. If a result is off, change one thing at a time.

### Royale Gate (maroon and gold palace)
**royale-intro**
> Slow cinematic shot at dusk. Tall maroon and gold palace double doors with brass studs and carved arches slowly swing open, warm golden light spills out onto a marble courtyard, marigold garlands sway gently, floating dust in the light. Camera pushes in slowly. Rich maroon, gold and warm amber colours. Soft depth of field, elegant, no people, no text.

**royale-loop**
> A decorated wedding mandap at dusk, red and ivory drapes moving slightly in a breeze, hanging brass lamps flickering warmly, rose petals drifting slowly down, calm static camera, shallow depth of field, warm golden hour glow, empty calm space in the centre, no people, no text.

### Noor Solarium (blush and gold)
**noor-intro**
> Elegant palace evening. Blush pink and brushed gold arches reveal one after another as the camera glides slowly forward through a long arcade, soft lantern light, subtle sparkle in the air, pastel pink sky through the arches. Dreamy, refined, no people, no text.

**noor-loop**
> Close view of blush pink and gold arched windows at twilight, thin curtains moving slightly, tiny lights twinkling softly, slow barely-moving camera, calm empty centre for text, no people, no text.

### Rose Pavilion (watercolour floral)
**rose-intro**
> Soft watercolour painted style. Ornate pastel floral double doors swing open to reveal a garden pavilion under a pastel sky, rose petals swirl out gently, hanging vines sway. Light, airy, romantic, painterly texture, no people, no text.

**rose-loop**
> Watercolour garden pavilion with climbing roses and hanging vines swaying slightly, a few petals falling slowly, soft cloudy pastel sky, calm composition with an empty centre, no people, no text.

### Magenta Lotus (papercut)
**magenta-intro**
> Layered paper-cut art, handmade look. A large magenta and pink paper lotus slowly unfolds petal by petal, each layer casting soft realistic paper shadows on a dark background, subtle depth and parallax. Crisp, tactile, elegant, no people, no text.

**magenta-loop**
> Layered magenta and pink paper-cut lotus and leaves with soft shadows, very gentle floating motion, small paper sparkles drifting, calm static camera, empty space in the centre, no people, no text.

### Sage Lotus (papercut, sage and ivory)
**sage-intro**
> Layered paper-cut art in sage green and ivory. A paper lotus and delicate traditional Indian motifs slowly unfold and layer in, soft shadows between layers, subtle parallax. Quiet, understated, handmade, no people, no text.

**sage-loop**
> Sage green and ivory paper-cut botanical motifs, layers shifting very slightly with soft shadows, tiny paper leaves drifting, calm empty centre, no people, no text.

## 3. Music (Flow Music)

Open Flow Music, choose to create a song from a text prompt, and set **instrumental / no vocals** if there is a switch. Ask for about **60 seconds** and generate 2 or 3 versions of each prompt. Keep the best.

Do not ask for "in the style of" a named song, singer or film. Describe the feel only. That keeps the music original.

### Launch set (3 tracks per category)

**Royal and Palace**
- `royal-shehnai-entry`: > Grand Indian wedding entrance, solo shehnai with soft tabla and warm strings, stately and joyful, 90 BPM, instrumental, no vocals, no lyrics.
- `royal-orchestral-romance`: > Warm romantic orchestral piece with sweeping strings, soft piano and a gentle flute, emotional and elegant, 76 BPM, instrumental, no vocals.
- `royal-sitar-celebration`: > Joyful celebratory instrumental with sitar, tabla and light percussion, bright and festive, 110 BPM, no vocals.

**Floral and Pastel**
- `floral-soft-piano`: > Tender romantic solo piano with light strings underneath, dreamy, spacious, 70 BPM, instrumental, no vocals.
- `floral-acoustic-spring`: > Gentle acoustic guitar and soft claps, fresh and hopeful, springtime wedding mood, 100 BPM, instrumental, no vocals.
- `floral-flute-strings`: > Soft bansuri flute over light strings and a warm pad, peaceful and romantic, 80 BPM, instrumental, no vocals.

**Papercut Art**
- `papercut-marimba-play`: > Light playful marimba and pizzicato strings, cheerful and charming, 105 BPM, instrumental, no vocals.
- `papercut-lofi-love`: > Warm lo-fi romantic beat with soft keys and vinyl texture, relaxed, 85 BPM, instrumental, no vocals.
- `papercut-sitar-pop`: > Modern light pop groove with a gentle sitar line and soft drums, upbeat and sweet, 100 BPM, instrumental, no vocals.

### Later categories (do not generate yet)
Pre-wedding: dhol and brass sangeet energy, 120 to 128 BPM. Baby and naming: soft music-box and harp lullaby. Birthday: upbeat bright pop. Anniversary: slow warm piano and cello. Griha Pravesh and puja: gentle flute, tanpura and bells.

## 4. What to send me

Create this folder and fill it:

```
assets-in/
  videos/
    royale-intro.mp4        royale-loop.mp4
    noor-intro.mp4          noor-loop.mp4
    rose-intro.mp4          rose-loop.mp4
    magenta-intro.mp4       magenta-loop.mp4
    sage-intro.mp4          sage-loop.mp4
    (optional 16:9 versions with -wide in the name)
  music/
    royal-shehnai-entry.mp3 ... (the nine names above)
  NOTES.txt
  terms-screenshot.png
```

`NOTES.txt`, one block per file:

```
file: royale-intro.mp4
tool: Flow (Veo 3.1 Fast)
date: 2026-11-__
plan: free / paid (which)
prompt: (paste the exact prompt)
watermark visible: no
terms read on: 2026-11-__   url: https://...
```

I store the tool, date, plan and terms link in the database next to every music track, so you can always show where it came from.

## 5. What I do with them

1. **ffmpeg**: compress each clip to a phone-friendly MP4 (H.264) and WebM, make a still poster, cut loop-safe versions with a crossfade, and normalise music loudness with a short fade in and out.
2. **Video-led template**: the intro clip plays when the guest opens the invitation, the loop plays behind the card, then names, date, venues, gallery and RSVP appear, all editable in the same studio. Slow phones, data-saver and "reduce motion" get the still poster instead.
3. **Music picker**: buyers choose one of 3 tracks for their category.
4. **Telegram**: the same clips become the protected, watermarked previews.
5. I tell you when it is live, and then we add more categories.
