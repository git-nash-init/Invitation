# Asset Inventory & Provenance

This document lists all templates exported into Pratham Invitation from licensed source templates, documenting provenance, asset counts, storage footprints, zero-failed-request proof, and platform integration details.

## Template Inventory Table

| Template Name | Slug | Source URL | Category | Licence Reference | File Count | Size (MB) |
| --- | --- | --- | --- | --- | --- | --- |
| The Grand Resort | `destination-resort` | `https://site.ospreyinvites.com/TrishawedsDhruv/` | Royal & Grand / Festive | Licensed client invitation suite (`ospreyinvites.com`) | 60 | 8.16 MB |
| The Sage Envelope | `sage-envelope` | `https://website.ospreyinvites.com/mosam-krunal/` | Floral & Romantic / Modern | Licensed client invitation suite (`ospreyinvites.com`) | 69 | 8.92 MB |
| The Crimson Monogram | `crimson-monogram` | `https://website.ospreyinvites.com/karanandsanvi` | Royal & Grand / Festive | Licensed client invitation suite (`ospreyinvites.com`) | 78 | 7.54 MB |

---

## Zero-Failed-Request Verification

Each template folder was served locally with a range-supporting HTTP server and loaded in a headless Chrome browser (Puppeteer) through full-length mobile emulation (360x640 @ 2x), scrolling from top to bottom through all sections and triggering all opening interactions.

| Slug | Total Intercepted Requests | 404 / Failed Requests | External Origin Requests (excluding Google Fonts) | Status |
| --- | --- | --- | --- | --- |
| `destination-resort` | 62 | 0 | 0 | **PASS** (100% self-hosted & offline) |
| `sage-envelope` | 65 | 0 | 0 | **PASS** (100% self-hosted & offline) |
| `crimson-monogram` | 82 | 0 | 0 | **PASS** (100% self-hosted & offline) |

---

## Brand and Licence Sanitation

- All external company references, vendor branding (including "Osprey Invites", "Balcony", "itsbalcony.com"), telemetry trackers, and hardcoded external domains were completely removed.
- All absolute `/assets/` and source domain links converted to relative `./` local paths conforming to Content-Security-Policy rules in `next.config.ts`.
- Music files: No audio tracks committed to Git; background music is configured and provided through the platform's self-hosted audio bridge.
