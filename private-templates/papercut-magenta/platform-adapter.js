// Balcony platform adapter - bridges the invitation to the Balcony website
// when mounted through the contract runtime (GenericTemplateRuntime, since
// papercut's config already uses flat, platform-shaped field names - see
// config/templates.php). Same message contract as rose-invitation's and
// simple-card's platform-adapter.js.
//
// The runtime loads this page in an iframe with the event payload in the URL
// hash (#platform=<base64url JSON>). This script runs after config.js and
// BEFORE render.js, so the config it assembles here is what the template
// renders on first paint - no flash of demo defaults, no async handshake.
//
// Outbound messages to the parent page:
//   { type: 'sutra:ready' }
//   { type: 'sutra:rsvp', status, headcount, message }
//   { type: 'sutra:save', config }
//   { type: 'sutra:mode', mode }
//   { type: 'sutra:finalize' }
(function () {
  const PC = window.Papercut;
  if (!PC) return;

  const match = /[#&]platform=([A-Za-z0-9_-]+)/.exec(location.hash);
  if (!match) return; // stand-alone mode - the template behaves as before

  let payload;
  try {
    const b64 = match[1].replace(/-/g, '+').replace(/_/g, '/');
    payload = JSON.parse(decodeURIComponent(escape(atob(b64))));
  } catch (_) {
    return; // malformed payload - render the template defaults rather than break
  }

  function deepMerge(base, over) {
    if (Array.isArray(base) || Array.isArray(over)) return over !== undefined ? over : base;
    if (typeof base !== 'object' || base === null) return over !== undefined ? over : base;
    if (typeof over !== 'object' || over === null) return base;
    const out = {};
    Object.keys(base).forEach((k) => { out[k] = deepMerge(base[k], over[k]); });
    Object.keys(over).forEach((k) => { if (!(k in base)) out[k] = over[k]; });
    return out;
  }

  const event = payload.event || {};
  const overrides = payload.sectionOverrides || {};

  // The no-guest "common link" of a Personalised event drops the guest-name
  // spot entirely - same rule as rose-invitation.
  PC.commonLink = !!event.commonLink;

  // Whether this invitation has ever been published - drives the toolbar's
  // "Make it Live" vs "Push to live" label (see editor.js mount).
  PC.hasPublished = event.status !== 'draft';

  // RSVP's "Your name" field is asked for unless a specific guest is already
  // in the payload - same rule as rose-invitation.
  PC.hideNameField = !!(payload.guest && (payload.guest.name || payload.guest.greeting));

  // Platform mode never trusts this browser's localStorage - the host's
  // edits arrive in the payload (sectionOverrides.__templateConfig).
  let cfg = deepMerge(PC.DEFAULTS, overrides.__templateConfig || {});

  // media/date_flower_left.png and _right.png were renamed to .webp (and the
  // old files deleted) in an image-optimisation pass - PC.DEFAULTS points at
  // the new names, but any event saved BEFORE that pass has the old ones
  // baked into its stored config, which wins over the default in the merge
  // above and 404s on a guest's screen (the two files are simply gone). Patch
  // just these two known-renamed paths back onto the current default rather
  // than requiring every already-live event to be re-saved or backfilled.
  if (cfg.dateReveal) {
    if (cfg.dateReveal.bloomLeft === 'media/date_flower_left.png') {
      cfg.dateReveal.bloomLeft = PC.DEFAULTS.dateReveal.bloomLeft;
    }
    if (cfg.dateReveal.bloomRight === 'media/date_flower_right.png') {
      cfg.dateReveal.bloomRight = PC.DEFAULTS.dateReveal.bloomRight;
    }
  }

  // Generic EventData fields fill the names on a brand-new event, before the
  // host has ever saved this template's own config.
  if (!overrides.__templateConfig) {
    if (Array.isArray(event.hostNames) && event.hostNames.length >= 2) {
      cfg.brideName = event.hostNames[0];
      cfg.groomName = event.hostNames[1];
    }
  }

  PC.config = cfg;
  PC.platform = true;

  // Re-encode the payload with the CURRENT config - used by the editor's
  // Preview/Back navigation so in-progress edits survive the page change.
  PC.platformHash = function () {
    const next = Object.assign({}, payload, {
      sectionOverrides: Object.assign({}, overrides, {
        __templateConfig: JSON.parse(JSON.stringify(PC.config)),
      }),
    });
    const json = JSON.stringify(next);
    const b64 = btoa(unescape(encodeURIComponent(json)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return '#platform=' + b64;
  };

  // Tell the platform which mode this load is in - the template navigates
  // itself between ?edit=1 and ?preview=1, so the parent has no other way
  // to know, and needs to, to offer device viewports while previewing.
  window.parent.postMessage({ type: 'sutra:mode', mode: PC.mode }, '*');

  // ---- Edit mode: the template's editor, saving to the platform ----------
  if (PC.mode === 'edit') {
    PC.save = function () {
      PC.syncDerived();
      window.parent.postMessage(
        { type: 'sutra:save', config: JSON.parse(JSON.stringify(PC.config)) }, '*'
      );
      return true;
    };
    // Real gallery-photo uploads (see editor.js): same-origin endpoint, so
    // the iframe posts to it directly. Only set when the payload carries a
    // real event id - the trial editor has no event to upload against and
    // keeps its data-URL fallback.
    PC.uploadUrl = event.id ? ('/api/invitations/' + event.id + '/media') : null;
    // Same idea, for the background-music "upload your own" control
    // (_platform/music.js).
    PC.audioUploadUrl = event.id ? ('/api/invitations/' + event.id + '/audio') : null;
    // Resetting in platform mode returns to the template defaults (the
    // platform draft is replaced on the next autosave).
    PC.reset = function () {};
    window.parent.postMessage({ type: 'sutra:ready' }, '*');
    return; // guests-only wiring below doesn't apply while editing
  }

  cfg.finalized = true;

  // Guests can't persist config edits from platform mode.
  PC.save = function () { return false; };

  // RSVP is included with every purchase and is never plan-gated - see
  // config/templates.php, where the rsvpCta section is 'required' => true
  // for every template. This used to hide #balcony-rsvp when the platform
  // payload listed 'rsvpCta' in sectionOverrides.__disabled; nothing on the
  // backend has ever actually populated that list with it, and per product
  // policy nothing should - RSVP cannot be a section a plan turns off.

  // Personalized greeting: the platform guest record replaces the ?to= param.
  const guest = payload.guest;
  if (guest && (guest.greeting || guest.name)) {
    const name = guest.greeting ||
      (guest.familyName ? guest.name + ' & ' + guest.familyName : guest.name);
    PC.guestName = function () { return String(name).slice(0, 80); };
  }

  // ---- RSVP bridge --------------------------------------------------------
  // rsvp.js owns validation and the result panel; when a guest submits a
  // valid response it calls PC.reportRsvp(payload). Stand-alone (no
  // platform), PC.reportRsvp is simply never defined.
  PC.reportRsvp = function (rsvp) {
    window.parent.postMessage(Object.assign({ type: 'sutra:rsvp' }, rsvp), '*');
  };

  window.parent.postMessage({ type: 'sutra:ready' }, '*');
})();
