// Moments engine - the shared runtime of the celebration designs (birthdays, baby showers and
// naming ceremonies, housewarmings and festive parties).
//
// A design is a folder with three small files:
//   design.js   window.MomentsDesign = { id, defaults, palettes, fx, coverHtml(h), heroHtml(h), ... }
//   style.css   its look: colours, type, the cover art and how the cover opens
//   index.html  fonts and the script tags
// Everything a design does not draw itself comes from here: the platform bridge (the same
// #platform= payload and sutra:* messages every other template uses), the page sections, the
// in-place editor, the countdown, the particle layer and the scroll effects.
//
// Loaded after _platform/toolbar.js and _platform/music.js and before _platform/rsvp.js, which
// needs the #balcony-rsvp mount this file writes.
(function () {
  'use strict';

  var D = window.MomentsDesign;
  if (!D) return;

  var params = new URLSearchParams(location.search);
  var mode = params.has('edit') ? 'edit' : params.has('preview') ? 'preview' : 'view';
  var edit = mode === 'edit';
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* old browser */ }

  // ---- Defaults: what every design has, then the design's own sample words -------------------
  var BASE = {
    version: 1,
    finalized: false,
    kicker: 'You are invited',
    title: 'Our celebration',
    subtitle: '',
    hostLine: '',
    eventDate: 'Saturday, 14 March 2027',
    eventTime: '7:00 PM onwards',
    eventISO: '2027-03-14T19:00',
    venue: 'Venue name, City',
    mapUrl: '',
    note: '',
    noteSign: '',
    heroPhoto: '',
    closing: 'See you there',
    events: [],
    details: [],
    photos: [],
    sections: { countdown: true, note: true, schedule: true, details: true, gallery: true, venue: true, rsvp: true },
    palette: 0,
    effects: true,
    music: { enabled: true, src: '', volume: 0.5 },
    textStyle: {},
    wording: []
  };

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function deepMerge(base, over) {
    if (Array.isArray(base) || Array.isArray(over)) return over !== undefined ? over : base;
    if (typeof base !== 'object' || base === null) return over !== undefined ? over : base;
    if (typeof over !== 'object' || over === null) return base;
    var out = {};
    Object.keys(base).forEach(function (k) { out[k] = deepMerge(base[k], over[k]); });
    Object.keys(over).forEach(function (k) { if (!(k in base)) out[k] = over[k]; });
    return out;
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  var DEFAULTS = deepMerge(BASE, D.defaults || {});

  var MO = {
    DEFAULTS: DEFAULTS,
    config: clone(DEFAULTS),
    mode: mode,
    trial: params.has('trial'),
    platform: false,
    published: undefined,
    esc: esc,
    canEdit: function () { return edit; },
    save: function () { return true; },
    reset: function () {},
    finalize: function () {},
    guestName: function () {
      var to = params.get('to');
      return to ? String(to).trim().slice(0, 80) : '';
    }
  };
  window.Moments = MO;

  // ---- Platform bridge (same contract as every other template's platform-adapter.js) ----------
  (function adapter() {
    var match = /[#&]platform=([A-Za-z0-9_-]+)/.exec(location.hash);
    if (!match) return;
    var payload;
    try {
      var b64 = match[1].replace(/-/g, '+').replace(/_/g, '/');
      payload = JSON.parse(decodeURIComponent(escape(atob(b64))));
    } catch (e) { return; }

    var event = payload.event || {};
    var overrides = payload.sectionOverrides || {};
    MO.commonLink = !!event.commonLink;
    MO.published = event.status !== 'draft';
    MO.hasPublished = MO.published;
    MO.config = deepMerge(DEFAULTS, overrides.__templateConfig || {});
    MO.platform = true;

    MO.platformHash = function () {
      var next = Object.assign({}, payload, {
        sectionOverrides: Object.assign({}, overrides, { __templateConfig: clone(MO.config) })
      });
      var b = btoa(unescape(encodeURIComponent(JSON.stringify(next))))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      return '#platform=' + b;
    };

    try { window.parent.postMessage({ type: 'sutra:mode', mode: mode }, '*'); } catch (e) { /* no parent */ }

    if (edit) {
      // A brand-new invitation has nothing saved yet: its sample plan is stored on the first load, so
      // the reply form has something to ask about even if the host publishes without changing a word.
      var saved = overrides.__templateConfig;
      MO.fresh = !saved || typeof saved !== 'object' || !Object.keys(saved).length;
      MO.save = function () {
        try { window.parent.postMessage({ type: 'sutra:save', config: clone(MO.config) }, '*'); } catch (e) { return false; }
        return true;
      };
      if (event.id) {
        MO.uploadUrl = '/api/invitations/' + encodeURIComponent(event.id) + '/media';
        MO.audioUploadUrl = '/api/invitations/' + encodeURIComponent(event.id) + '/audio';
      }
    } else {
      MO.save = function () { return false; };
      var guest = payload.guest;
      if (guest && (guest.greeting || guest.name)) {
        var name = guest.greeting || (guest.familyName ? guest.name + ' & ' + guest.familyName : guest.name);
        MO.guestName = function () { return String(name).trim().slice(0, 80); };
      } else {
        MO.guestName = function () { return ''; };
      }
    }
    window.addEventListener('load', function () {
      try { window.parent.postMessage({ type: 'sutra:ready' }, '*'); } catch (e) { /* no parent */ }
    });
  })();

  var cfg = MO.config;
  // A saved invitation may predate a section or a list: never let a missing key break the page.
  if (!cfg.sections || typeof cfg.sections !== 'object') cfg.sections = clone(BASE.sections);
  ['events', 'details', 'photos'].forEach(function (k) { if (!Array.isArray(cfg[k])) cfg[k] = []; });

  // ---- Small helpers a design's own markup uses ---------------------------------------------
  // One line of text the host can type over. data-fmt is set for guests too (size and alignment).
  function E(path, tag, cls, opts) {
    opts = opts || {};
    var val = getPath(cfg, path);
    if (val == null) val = '';
    if (!edit && !String(val).trim() && !opts.keep) return '';
    var attrs = ' data-fmt="' + esc(path) + '"';
    if (edit) {
      attrs += ' contenteditable="plaintext-only" spellcheck="false" data-edit="' + esc(path) + '"' +
        (opts.multi ? ' data-multi="1"' : '') +
        (opts.hint ? ' data-hint="' + esc(opts.hint) + '"' : '');
    }
    return '<' + tag + (cls ? ' class="' + cls + '"' : '') + attrs + '>' + esc(val) + '</' + tag + '>';
  }

  function parts(path) { return String(path).replace(/\]/g, '').split(/[.\[]/); }
  function getPath(obj, path) {
    var p = parts(path), cur = obj;
    for (var i = 0; i < p.length; i++) { if (cur == null) return undefined; cur = cur[p[i]]; }
    return cur;
  }
  function setPath(obj, path, val) {
    var p = parts(path), cur = obj;
    for (var i = 0; i < p.length - 1; i++) { cur = cur[p[i]]; if (cur == null) return; }
    cur[p[p.length - 1]] = val;
  }

  function on(name) { return cfg.sections[name] !== false; }

  var HD = D.headings || {};
  function hd(k, dflt) { return esc(HD[k] || dflt); }

  var H = { E: E, esc: esc, cfg: cfg, edit: edit, mode: mode, guest: function () { return MO.commonLink ? '' : MO.guestName(); } };

  // ---- Palette -------------------------------------------------------------------------------
  function applyPalette() {
    var list = D.palettes || [];
    var p = list[cfg.palette] || list[0];
    var root = document.documentElement;
    // Clear what any other palette set, so switching back never leaves a colour behind.
    list.forEach(function (o) { Object.keys(o.vars).forEach(function (k) { root.style.removeProperty(k); }); });
    if (p) Object.keys(p.vars).forEach(function (k) { root.style.setProperty(k, p.vars[k]); });
    document.body.setAttribute('data-palette', String(cfg.palette || 0));
  }

  // ---- Date ----------------------------------------------------------------------------------
  function eventTime() {
    var m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(cfg.eventISO || '');
    if (!m) return null;
    return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), 0);
  }
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function longDate(d) { return DAYS[d.getDay()] + ', ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); }
  function clock(d) {
    var h = d.getHours(), m = d.getMinutes();
    return ((h % 12) || 12) + ':' + (m < 10 ? '0' : '') + m + ' ' + (h < 12 ? 'AM' : 'PM');
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function calendarUrl() {
    var d = eventTime();
    if (!d) return '';
    var end = new Date(d.getTime() + 3 * 3600 * 1000);
    var f = function (x) { return x.getFullYear() + pad(x.getMonth() + 1) + pad(x.getDate()) + 'T' + pad(x.getHours()) + pad(x.getMinutes()) + '00'; };
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
      '&text=' + encodeURIComponent(cfg.title || '') +
      '&dates=' + f(d) + '/' + f(end) +
      '&location=' + encodeURIComponent(cfg.venue || '');
  }

  function safeUrl(u) { return /^https?:\/\//i.test(String(u || '')) ? String(u) : ''; }

  // ---- Page ----------------------------------------------------------------------------------
  var ICON = {
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.500C5 14.800 12 21 12 21Z" fill="none" stroke="currentColor" stroke-width="1.800" stroke-linejoin="round"/><circle cx="12" cy="9.500" r="2.500" fill="none" stroke="currentColor" stroke-width="1.800"/></svg>',
    cal: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v3M17 3v3M4 9h16M5.500 5h13A1.500 1.500 0 0 1 20 6.500v12a1.500 1.500 0 0 1-1.500 1.500h-13A1.500 1.500 0 0 1 4 18.500v-12A1.500 1.500 0 0 1 5.500 5Z" fill="none" stroke="currentColor" stroke-width="1.800" stroke-linecap="round"/></svg>',
    share: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V4m0 0L8 8m4-4 4 4M5 13v5.500A1.500 1.500 0 0 0 6.500 20h11a1.500 1.500 0 0 0 1.500-1.500V13" fill="none" stroke="currentColor" stroke-width="1.800" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.500" fill="none" stroke="currentColor" stroke-width="1.800"/><path d="M12 7.500V12l3 2" fill="none" stroke="currentColor" stroke-width="1.800" stroke-linecap="round"/></svg>',
    photo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.500 6h15A1.500 1.500 0 0 1 21 7.500v9a1.500 1.500 0 0 1-1.500 1.500h-15A1.500 1.500 0 0 1 3 16.500v-9A1.500 1.500 0 0 1 4.500 6Z" fill="none" stroke="currentColor" stroke-width="1.600"/><path d="m3.500 16 5-4.500 4 3.500 3-2.500 5 4" fill="none" stroke="currentColor" stroke-width="1.600" stroke-linejoin="round"/><circle cx="15.500" cy="10" r="1.400" fill="currentColor"/></svg>'
  };

  function sectionOpen(name, cls, label) {
    return '<section class="mo-sec mo-' + name + (cls ? ' ' + cls : '') + '" data-sec="' + name + '"' + (label ? ' aria-label="' + esc(label) + '"' : '') + '>' +
      (typeof D.decor === 'function' ? (D.decor(name, H) || '') : '');
  }

  function photoBox(path, src, cls, alt) {
    var pick = edit ? ' data-pick-photo="' + esc(path) + '"' : '';
    if (src) {
      return '<img class="mo-photo ' + cls + '" src="' + esc(src) + '" alt="' + esc(alt || '') + '" loading="lazy" decoding="async"' + pick + '>';
    }
    // No photo yet: guests see the design's own art; the host sees where to add one.
    var art = typeof D.placeholder === 'function' ? D.placeholder(path, H) : '';
    return '<div class="mo-photo mo-photo--empty ' + cls + '"' + pick + '>' + art +
      (edit ? '<span class="mo-photo__add" data-no-wording>' + ICON.photo + 'Add a photo</span>' : '') + '</div>';
  }

  function coverHtml() {
    var guest = H.guest();
    return '<div class="mo-cover" id="moCover" data-no-snap>' +
      '<div class="mo-cover__in">' +
      (guest ? '<p class="mo-cover__guest" data-no-wording><span>For</span> ' + esc(guest) + '</p>' : '') +
      D.coverHtml(H) +
      '</div></div>';
  }

  function heroHtml() {
    return sectionOpen('hero', '', 'Invitation') +
      '<div class="mo-hero__in">' +
      (typeof D.heroHtml === 'function' ? D.heroHtml(H) :
        E('kicker', 'p', 'mo-kicker', { hint: 'Small line' }) +
        E('title', 'h1', 'mo-title', { hint: 'Title' }) +
        E('subtitle', 'p', 'mo-subtitle', { hint: 'One line about it' })) +
      '<div class="mo-when" data-rv>' +
      '<span class="mo-chip">' + ICON.cal + E('eventDate', 'span', 'mo-chip__t', { keep: true, hint: 'Date' }) + '</span>' +
      '<span class="mo-chip">' + ICON.clock + E('eventTime', 'span', 'mo-chip__t', { keep: true, hint: 'Time' }) + '</span>' +
      '</div>' +
      E('hostLine', 'p', 'mo-host', { hint: 'Hosted by' }) +
      '<div class="mo-scrollcue" aria-hidden="true"><i></i></div>' +
      '</div></section>';
  }

  function countdownHtml() {
    if (!on('countdown') && !edit) return '';
    return sectionOpen('countdown', on('countdown') ? '' : 'is-off', 'Countdown') +
      '<h2 class="mo-h" data-rv>' + hd('countdown', 'The countdown is on') + '</h2>' +
      '<div class="mo-count count" id="moCount" data-rv data-no-wording>' +
      ['Days', 'Hours', 'Minutes', 'Seconds'].map(function (l, i) {
        return '<div class="mo-count__cell"><b data-c="' + i + '">00</b><span>' + l + '</span></div>';
      }).join('') +
      '</div>' +
      '<p class="mo-count__done" id="moCountDone" hidden>It is happening today</p>' +
      (edit ? '<label class="mo-ed-field" data-no-wording><span>Date and time for the countdown</span>' +
        '<input type="datetime-local" id="moIso" value="' + esc((cfg.eventISO || '').slice(0, 16)) + '"></label>' : '') +
      '</section>';
  }

  function noteHtml() {
    if (!on('note') && !edit) return '';
    if (!edit && !String(cfg.note || '').trim() && !cfg.heroPhoto) return '';
    return sectionOpen('note', on('note') ? '' : 'is-off', 'A note') +
      '<div class="mo-note__photo" data-rv>' + photoBox('heroPhoto', cfg.heroPhoto, 'mo-note__img', cfg.title) + '</div>' +
      '<div class="mo-note__body" data-rv>' +
      E('note', 'p', 'mo-note__text', { multi: true, hint: 'Your message to guests' }) +
      E('noteSign', 'p', 'mo-note__sign', { hint: 'Signed by' }) +
      '</div></section>';
  }

  function scheduleHtml() {
    if (!on('schedule') && !edit) return '';
    if (!edit && !cfg.events.length) return '';
    var rows = cfg.events.map(function (ev, i) {
      var p = 'events[' + i + ']';
      var map = safeUrl(ev.mapUrl);
      return '<li class="mo-ev" data-rv>' +
        (edit && cfg.events.length > 1 ? '<button type="button" class="mo-x" data-rm="events" data-i="' + i + '" aria-label="Remove this part">&times;</button>' : '') +
        '<span class="mo-ev__n" aria-hidden="true" data-no-wording>' + pad(i + 1) + '</span>' +
        '<div class="mo-ev__b">' +
        E(p + '.time', 'p', 'mo-ev__time', { hint: 'Time' }) +
        E(p + '.name', 'h3', 'mo-ev__name', { keep: true, hint: 'What is happening' }) +
        E(p + '.venue', 'p', 'mo-ev__venue', { hint: 'Where' }) +
        (map ? '<a class="mo-link" href="' + esc(map) + '" target="_blank" rel="noopener">' + ICON.pin + 'Open in Maps</a>' : '') +
        (edit ? '<label class="mo-ed-field" data-no-wording><span>Map link</span><input type="url" data-map="' + p + '.mapUrl" value="' + esc(ev.mapUrl || '') + '" placeholder="Paste a Google Maps link"></label>' : '') +
        '</div></li>';
    }).join('');
    return sectionOpen('schedule', on('schedule') ? '' : 'is-off', 'The plan') +
      '<h2 class="mo-h" data-rv>' + hd('schedule', 'The plan') + '</h2>' +
      '<ol class="mo-evs">' + rows + '</ol>' +
      (edit ? '<button type="button" class="mo-add" data-add="events">+ Add a part</button>' : '') +
      '</section>';
  }

  function detailsHtml() {
    if (!on('details') && !edit) return '';
    if (!edit && !cfg.details.length) return '';
    var rows = cfg.details.map(function (d, i) {
      var p = 'details[' + i + ']';
      return '<li class="mo-dt" data-rv>' +
        (edit ? '<button type="button" class="mo-x" data-rm="details" data-i="' + i + '" aria-label="Remove this card">&times;</button>' : '') +
        E(p + '.title', 'h3', 'mo-dt__t', { keep: true, hint: 'Heading' }) +
        E(p + '.text', 'p', 'mo-dt__p', { multi: true, hint: 'Details' }) +
        '</li>';
    }).join('');
    return sectionOpen('details', on('details') ? '' : 'is-off', 'Good to know') +
      '<h2 class="mo-h" data-rv>' + hd('details', 'Good to know') + '</h2>' +
      '<ul class="mo-dts">' + rows + '</ul>' +
      (edit ? '<button type="button" class="mo-add" data-add="details">+ Add a card</button>' : '') +
      '</section>';
  }

  function galleryHtml() {
    if (!on('gallery') && !edit) return '';
    if (!edit && !cfg.photos.length) return '';
    var rows = cfg.photos.map(function (ph, i) {
      var p = 'photos[' + i + ']';
      return '<li class="mo-ph" data-rv style="--i:' + i + '">' +
        (edit ? '<button type="button" class="mo-x" data-rm="photos" data-i="' + i + '" aria-label="Remove this photo">&times;</button>' : '') +
        '<figure>' + photoBox(p + '.src', ph.src, 'mo-ph__img', ph.caption) +
        '<figcaption>' + E(p + '.caption', 'span', 'mo-ph__c', { hint: 'Caption' }) + '</figcaption></figure></li>';
    }).join('');
    return sectionOpen('gallery', on('gallery') ? '' : 'is-off', 'Photos') +
      '<h2 class="mo-h" data-rv>' + hd('gallery', 'Moments') + '</h2>' +
      '<ul class="mo-phs">' + rows + '</ul>' +
      (edit && cfg.photos.length < 12 ? '<button type="button" class="mo-add" data-add="photos">+ Add a photo</button>' : '') +
      '</section>';
  }

  function venueHtml() {
    if (!on('venue') && !edit) return '';
    var map = safeUrl(cfg.mapUrl);
    var cal = calendarUrl();
    return sectionOpen('venue', on('venue') ? '' : 'is-off', 'Where') +
      '<h2 class="mo-h" data-rv>' + hd('venue', 'Find us here') + '</h2>' +
      '<div class="mo-venue__card" data-rv>' +
      E('venue', 'p', 'mo-venue__name', { keep: true, multi: true, hint: 'Venue and address' }) +
      '<div class="mo-venue__acts">' +
      (map ? '<a class="mo-btn" href="' + esc(map) + '" target="_blank" rel="noopener">' + ICON.pin + 'Open in Maps</a>' : '') +
      (cal && !edit ? '<a class="mo-btn mo-btn--ghost" href="' + esc(cal) + '" target="_blank" rel="noopener">' + ICON.cal + 'Add to calendar</a>' : '') +
      '</div>' +
      (edit ? '<label class="mo-ed-field" data-no-wording><span>Map link for the venue</span><input type="url" data-map="mapUrl" value="' + esc(cfg.mapUrl || '') + '" placeholder="Paste a Google Maps link"></label>' : '') +
      '</div></section>';
  }

  function rsvpHtml() {
    if (!on('rsvp') && !edit) return '';
    return sectionOpen('rsvp', on('rsvp') ? '' : 'is-off', 'Reply') +
      '<h2 class="mo-h" data-rv>' + hd('rsvp', 'Will you be there?') + '</h2>' +
      '<div class="mo-rsvp__in" data-rv><div id="balcony-rsvp"></div></div>' +
      '</section>';
  }

  function closingHtml() {
    return sectionOpen('closing', '', 'Closing') +
      (typeof D.closingHtml === 'function' ? D.closingHtml(H) : '') +
      E('closing', 'p', 'mo-closing__t', { keep: true, hint: 'Sign-off' }) +
      E('title', 'p', 'mo-closing__n', { hint: 'Title' }) +
      (!edit ? '<button type="button" class="mo-btn mo-share" id="moShare">' + ICON.share + 'Share this invitation</button>' : '') +
      '</section>';
  }

  var root = document.getElementById('mo-root');
  if (!root) return;

  function buildSections() {
    return heroHtml() + countdownHtml() + noteHtml() + scheduleHtml() + detailsHtml() + galleryHtml() + venueHtml() + rsvpHtml() + closingHtml();
  }

  // The RSVP form is written once by _platform/rsvp.js; a redraw keeps that node and puts it back.
  function render(first) {
    var keep = document.getElementById('balcony-rsvp');
    var main = document.getElementById('moMain');
    if (first) {
      root.innerHTML = '<div class="mo-progress" aria-hidden="true"><i id="moBar"></i></div>' +
        coverHtml() + '<main class="mo-page" id="moMain">' + buildSections() + '</main>';
    } else {
      var y = window.scrollY;
      main.innerHTML = buildSections();
      // In the editor the cover is part of the page, so a new cover photo shows at once.
      var cover = document.getElementById('moCover');
      if (edit && cover) cover.outerHTML = coverHtml();
      var slot = document.getElementById('balcony-rsvp');
      if (keep && slot && keep !== slot) slot.parentNode.replaceChild(keep, slot);
      window.scrollTo(0, y);
    }
    applyPalette();
    watchReveals(!first);
    tick();
    syncRsvp();
    if (edit) markOff();
  }

  // ---- RSVP schedule: what the reply form asks about, for demos and the editor ----------------
  function syncRsvp() {
    var list = cfg.events.length ? cfg.events : [{ name: cfg.title, date: '' }];
    var events = list.map(function (e, i) { return { id: 'e' + i, key: 'e' + i, name: e.name || ('Part ' + (i + 1)), date: null }; });
    document.dispatchEvent(new CustomEvent('sutra:rsvp-events-changed', { detail: { events: events } }));
  }
  document.addEventListener('sutra:rsvp-events-request', syncRsvp);

  // ---- Countdown -----------------------------------------------------------------------------
  var timer = null;
  function tick() {
    var box = document.getElementById('moCount');
    if (!box) return;
    var when = eventTime();
    var done = document.getElementById('moCountDone');
    var left = when ? when.getTime() - Date.now() : 0;
    var over = !when || left <= 0;
    box.hidden = over && !edit;
    if (done) done.hidden = !over || edit;
    if (over) left = 0;
    var s = Math.floor(left / 1000);
    var vals = [Math.floor(s / 86400), Math.floor((s % 86400) / 3600), Math.floor((s % 3600) / 60), s % 60];
    var cells = box.querySelectorAll('[data-c]');
    for (var i = 0; i < cells.length; i++) {
      var t = pad(vals[i]);
      if (cells[i].textContent !== t) {
        cells[i].textContent = t;
        if (!reduce) { cells[i].classList.remove('is-tick'); void cells[i].offsetWidth; cells[i].classList.add('is-tick'); }
      }
    }
    if (!timer) timer = setInterval(tick, 1000);
  }

  // ---- Scroll: reveals, progress bar, parallax -----------------------------------------------
  var io = null;
  function watchReveals(instant) {
    var els = root.querySelectorAll('[data-rv]');
    if (reduce || edit || instant || !('IntersectionObserver' in window)) {
      for (var i = 0; i < els.length; i++) els[i].classList.add('is-in');
      return;
    }
    if (!io) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    }
    for (var j = 0; j < els.length; j++) {
      // Siblings arrive one after another.
      var sibs = els[j].parentNode ? els[j].parentNode.children : [];
      var idx = Array.prototype.indexOf.call(sibs, els[j]);
      els[j].style.setProperty('--d', Math.min(idx, 6) * 70 + 'ms');
      io.observe(els[j]);
    }
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var doc = document.documentElement;
      var max = Math.max(1, doc.scrollHeight - window.innerHeight);
      var y = window.scrollY;
      var bar = document.getElementById('moBar');
      if (bar) bar.style.transform = 'scaleX(' + Math.min(1, y / max) + ')';
      doc.style.setProperty('--mo-scroll', String(y));
      if (reduce) return;
      var pars = root.querySelectorAll('[data-par]');
      var vh = window.innerHeight;
      for (var i = 0; i < pars.length; i++) {
        var r = pars[i].getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) continue;
        var k = parseFloat(pars[i].getAttribute('data-par')) || 0.15;
        var mid = r.top + r.height / 2 - vh / 2;
        pars[i].style.setProperty('--par', (-(mid * k)).toFixed(1) + 'px');
      }
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  // ---- Particles -----------------------------------------------------------------------------
  // One canvas, one loop. A design names the effect and its colours in design.fx; the opening
  // burst and a slow ambient drift both come from here. Nothing runs for reduced motion, in the
  // editor, or while the tab is hidden.
  var FX = (function () {
    var spec = D.fx || {};
    var canvas, ctx, W = 0, H2 = 0, dpr = 1, items = [], raf = 0, running = false, last = 0;
    var colors = spec.colors || ['#ffffff'];
    var kind = spec.kind || '';
    var max = spec.count == null ? 36 : spec.count;

    function size() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = window.innerWidth; H2 = window.innerHeight;
      canvas.width = W * dpr; canvas.height = H2 * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H2 + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function rnd(a, b) { return a + Math.random() * (b - a); }
    function pick() { return colors[(Math.random() * colors.length) | 0]; }

    function spawn(seed) {
      var p = { c: pick(), life: 1, burst: false };
      if (kind === 'confetti' || kind === 'petals' || kind === 'leaves') {
        p.x = rnd(0, W); p.y = seed ? rnd(0, H2) : -20;
        p.vx = rnd(-18, 18); p.vy = rnd(26, 70) * (kind === 'confetti' ? 1.3 : 1);
        p.r = rnd(4, 9); p.a = rnd(0, 6.280); p.va = rnd(-2.200, 2.200); p.w = rnd(0.400, 1);
      } else if (kind === 'bubbles' || kind === 'pixels' || kind === 'lanterns') {
        p.x = rnd(0, W); p.y = seed ? rnd(0, H2) : H2 + 20;
        p.vx = rnd(-8, 8); p.vy = -rnd(14, 46);
        p.r = kind === 'pixels' ? rnd(2, 5) : rnd(3, 11); p.a = rnd(0, 6.280); p.va = rnd(0.600, 1.800);
      } else if (kind === 'stars' || kind === 'fireflies') {
        p.x = rnd(0, W); p.y = rnd(0, H2);
        p.vx = kind === 'fireflies' ? rnd(-10, 10) : 0; p.vy = kind === 'fireflies' ? rnd(-8, 8) : 0;
        p.r = rnd(0.800, kind === 'fireflies' ? 3.200 : 2.200); p.a = rnd(0, 6.280); p.va = rnd(0.600, 2.400);
      }
      return p;
    }

    function burst(x, y, n, cols) {
      if (!ctx || reduce) return;
      for (var i = 0; i < n; i++) {
        var ang = rnd(0, 6.283), sp = rnd(120, 520);
        items.push({
          burst: true, x: x, y: y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 160,
          r: rnd(3, 8), a: rnd(0, 6.280), va: rnd(-8, 8), w: rnd(0.400, 1), life: 1,
          c: (cols || colors)[(Math.random() * (cols || colors).length) | 0],
          round: kind === 'stars' || kind === 'fireflies' || kind === 'sparks' || kind === 'lanterns'
        });
      }
      start();
    }

    // Fireworks: a few shells in the upper part of the screen, now and then.
    var nextShell = 0;
    function shells(t) {
      if (kind !== 'sparks' || t < nextShell) return;
      nextShell = t + rnd(1400, 3200);
      burst(rnd(W * 0.150, W * 0.850), rnd(H2 * 0.100, H2 * 0.450), 26);
    }

    function frame(t) {
      if (!running) return;
      var dt = Math.min(0.050, (t - last) / 1000 || 0.016);
      last = t;
      ctx.clearRect(0, 0, W, H2);
      shells(t);
      var ambient = 0;
      for (var i = items.length - 1; i >= 0; i--) {
        var p = items[i];
        p.x += p.vx * dt; p.y += p.vy * dt; p.a += p.va * dt;
        if (p.burst) {
          p.vy += 620 * dt; p.vx *= 0.985; p.life -= dt * 0.550;
          if (p.life <= 0 || p.y > H2 + 40) { items.splice(i, 1); continue; }
        } else {
          ambient++;
          if (kind === 'confetti' || kind === 'petals' || kind === 'leaves') {
            p.x += Math.sin(p.a) * 22 * dt;
            if (p.y > H2 + 24) items[i] = spawn(false);
          } else if (kind === 'bubbles' || kind === 'pixels' || kind === 'lanterns') {
            p.x += Math.sin(p.a) * 12 * dt;
            if (p.y < -24) items[i] = spawn(false);
          } else if (kind === 'fireflies') {
            p.vx += rnd(-14, 14) * dt; p.vy += rnd(-14, 14) * dt;
            if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10;
            if (p.y < -10) p.y = H2 + 10; if (p.y > H2 + 10) p.y = -10;
          }
        }
        draw(p);
      }
      if (!items.length && kind !== 'sparks') { running = false; return; }
      raf = requestAnimationFrame(frame);
    }

    function draw(p) {
      var alpha = p.burst ? Math.max(0, p.life) : 1;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.fillStyle = p.c;
      if (p.burst && !p.round) {
        ctx.globalAlpha = alpha; ctx.rotate(p.a);
        ctx.fillRect(-p.r, -p.r * p.w * 0.600, p.r * 2, p.r * 1.200 * p.w);
      } else if (p.burst) {
        ctx.globalAlpha = alpha; ctx.beginPath(); ctx.arc(0, 0, p.r * 0.550, 0, 6.283); ctx.fill();
      } else if (kind === 'confetti') {
        ctx.globalAlpha = 0.900; ctx.rotate(p.a);
        ctx.fillRect(-p.r, -p.r * 0.450 * Math.cos(p.a * 1.700), p.r * 2, p.r * 0.900 * Math.cos(p.a * 1.700));
      } else if (kind === 'petals' || kind === 'leaves') {
        ctx.globalAlpha = 0.850; ctx.rotate(p.a);
        ctx.beginPath(); ctx.ellipse(0, 0, p.r * 1.300, p.r * 0.600, 0, 0, 6.283); ctx.fill();
      } else if (kind === 'pixels') {
        ctx.globalAlpha = 0.350 + 0.450 * Math.abs(Math.sin(p.a));
        ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 2);
      } else if (kind === 'bubbles') {
        ctx.globalAlpha = 0.550; ctx.strokeStyle = p.c; ctx.lineWidth = 1.400;
        ctx.beginPath(); ctx.arc(0, 0, p.r, 0, 6.283); ctx.stroke();
        ctx.globalAlpha = 0.160; ctx.fill();
      } else if (kind === 'lanterns') {
        ctx.globalAlpha = 0.550 + 0.350 * Math.sin(p.a);
        ctx.shadowColor = p.c; ctx.shadowBlur = 14;
        ctx.beginPath(); ctx.ellipse(0, 0, p.r * 0.700, p.r, 0, 0, 6.283); ctx.fill();
      } else {
        ctx.globalAlpha = 0.250 + 0.750 * Math.abs(Math.sin(p.a));
        if (kind === 'fireflies') { ctx.shadowColor = p.c; ctx.shadowBlur = 12; }
        ctx.beginPath(); ctx.arc(0, 0, p.r, 0, 6.283); ctx.fill();
      }
      ctx.restore();
    }

    function start() {
      if (running || !ctx) return;
      running = true; last = performance.now();
      raf = requestAnimationFrame(frame);
    }
    function stop() { running = false; cancelAnimationFrame(raf); }

    function init() {
      if (!kind || reduce || edit || cfg.effects === false) return;
      canvas = document.createElement('canvas');
      canvas.className = 'mo-fx mo-fx--' + (spec.layer || 'front');
      canvas.setAttribute('aria-hidden', 'true');
      document.body.appendChild(canvas);
      ctx = canvas.getContext('2d');
      if (!ctx) return;
      size();
      window.addEventListener('resize', size);
      document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
      var n = Math.min(max, Math.round(max * Math.min(1, W / 420 + 0.300)));
      if (kind !== 'sparks') for (var i = 0; i < n; i++) items.push(spawn(true));
      start();
    }
    return { init: init, burst: burst };
  })();
  MO.burst = function (x, y, n, cols) { FX.burst(x, y, n, cols); };

  // ---- Opening the cover ---------------------------------------------------------------------
  var opened = false;
  function openCover(ev) {
    if (opened || edit) return;
    opened = true;
    var cover = document.getElementById('moCover');
    var body = document.body;
    cover.classList.add('is-opening');
    body.classList.add('mo-opening');
    var r = ev && ev.target && ev.target.getBoundingClientRect ? ev.target.getBoundingClientRect() : null;
    var bx = r ? r.left + r.width / 2 : window.innerWidth / 2;
    var by = r ? r.top + r.height / 2 : window.innerHeight / 2;
    if (D.fx && D.fx.burst !== false) FX.burst(bx, by, D.fx.burstCount || 70, D.fx.burstColors);
    var ms = reduce ? 200 : (D.openMs || 1500);
    setTimeout(function () {
      cover.classList.add('is-gone');
      body.classList.remove('mo-locked', 'mo-opening');
      body.classList.add('mo-opened');
      setTimeout(function () { cover.hidden = true; }, 700);
      var hero = root.querySelector('.mo-hero');
      if (hero) hero.classList.add('is-live');
      onScroll();
    }, ms);
  }

  // ---- Sharing -------------------------------------------------------------------------------
  function pageUrl() {
    try { return window.top.location.href.split('#')[0]; } catch (e) { return location.href.split('#')[0]; }
  }
  function share() {
    var url = pageUrl();
    var text = (cfg.title || 'You are invited') + (cfg.eventDate ? ' · ' + cfg.eventDate : '');
    try {
      if (navigator.share) { navigator.share({ title: cfg.title || '', text: text, url: url }).catch(function () {}); return; }
    } catch (e) { /* fall through */ }
    window.open('https://wa.me/?text=' + encodeURIComponent(text + '\n' + url), '_blank', 'noopener');
  }

  // ---- Draw the page -------------------------------------------------------------------------
  document.body.classList.add('mo-mode-' + mode);
  document.body.setAttribute('data-design', D.id || '');
  if (!edit) document.body.classList.add('mo-locked');
  render(true);
  if (edit) {
    var h0 = root.querySelector('.mo-hero');
    if (h0) h0.classList.add('is-live');
  }

  root.addEventListener('click', function (e) {
    var t = e.target;
    if (!t.closest) return;
    if (t.closest('#moShare')) { share(); return; }
    if (!edit && t.closest('[data-open]')) { openCover(e); return; }
  });
  // The whole cover opens it, not only the button: a thumb lands anywhere.
  var coverEl = document.getElementById('moCover');
  if (coverEl && !edit) {
    coverEl.addEventListener('click', function (e) { openCover(e); });
    coverEl.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') openCover(e); });
  }

  FX.init();
  if (typeof D.onReady === 'function') { try { D.onReady(MO, H); } catch (e) { /* a design's extras never break the page */ } }
  onScroll();

  MO.reRender = function () { render(false); };

  // Mounted for the editor and for its preview: the parent page drives edit and preview through it.
  if (window.BalconyToolbar && typeof window.BalconyToolbar.mount === 'function') window.BalconyToolbar.mount(MO);

  // ---- Editor --------------------------------------------------------------------------------
  if (!edit) return;

  var saveTimer = null;
  function saveSoon(ms) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      Promise.resolve(MO.save()).then(function (ok) { if (ok) document.dispatchEvent(new CustomEvent('sutra:saved')); });
    }, ms == null ? 350 : ms);
  }

  function markOff() {
    // A hidden section stays on the host's page, dimmed, so it can be brought back.
    var secs = root.querySelectorAll('.mo-sec.is-off');
    for (var i = 0; i < secs.length; i++) secs[i].setAttribute('data-off-label', 'Hidden from guests');
  }
  markOff();
  if (MO.fresh) saveSoon(900);

  document.addEventListener('input', function (e) {
    var el = e.target;
    if (!el || !el.closest) return;
    var ed = el.closest('[data-edit]');
    if (ed) {
      var path = ed.getAttribute('data-edit');
      var val = (ed.innerText || ed.textContent || '').replace(/ /g, ' ');
      val = ed.hasAttribute('data-multi') ? val.replace(/\n{3,}/g, '\n\n').trim() : val.replace(/\s*\n\s*/g, ' ').trim();
      setPath(cfg, path, val);
      var twins = root.querySelectorAll('[data-edit="' + path.replace(/"/g, '') + '"]');
      for (var i = 0; i < twins.length; i++) if (twins[i] !== ed) twins[i].textContent = val;
      if (/^events\[\d+\]\.name$/.test(path) || path === 'title') syncRsvp();
      saveSoon();
      return;
    }
    if (el.hasAttribute && el.hasAttribute('data-map')) {
      setPath(cfg, el.getAttribute('data-map'), el.value.trim());
      saveSoon(500);
    }
  });

  // A one-line field never takes a line break.
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    var ed = e.target.closest && e.target.closest('[data-edit]');
    if (ed && !ed.hasAttribute('data-multi')) { e.preventDefault(); ed.blur(); }
  });

  document.addEventListener('change', function (e) {
    var el = e.target;
    if (!el || !el.hasAttribute) return;
    if (el.hasAttribute('data-map')) { render(false); return; }
    if (el.id === 'moIso') {
      cfg.eventISO = el.value;
      var d = eventTime();
      if (d) { cfg.eventDate = longDate(d); cfg.eventTime = clock(d) + ' onwards'; }
      saveSoon(0);
      render(false);
    }
  });

  var BLANK = {
    events: function () { return { name: 'New part', time: 'Time', venue: (cfg.events[0] && cfg.events[0].venue) || 'Where', mapUrl: '' }; },
    details: function () { return { title: 'Heading', text: 'Write the details here.' }; },
    photos: function () { return { src: '', caption: 'Caption' }; }
  };

  root.addEventListener('click', function (e) {
    var t = e.target;
    if (!t.closest) return;
    var rm = t.closest('[data-rm]');
    if (rm) {
      e.preventDefault(); e.stopPropagation();
      var list = cfg[rm.getAttribute('data-rm')];
      list.splice(+rm.getAttribute('data-i'), 1);
      saveSoon(0); render(false);
      return;
    }
    var add = t.closest('[data-add]');
    if (add) {
      e.preventDefault();
      var key = add.getAttribute('data-add');
      cfg[key].push(BLANK[key]());
      saveSoon(0); render(false);
      var sec = root.querySelector('.mo-' + (key === 'events' ? 'schedule' : key === 'photos' ? 'gallery' : 'details'));
      var eds = sec ? sec.querySelectorAll('[data-edit]') : [];
      var lastEd = eds[eds.length - (key === 'photos' ? 1 : 2)] || eds[eds.length - 1];
      if (lastEd) { lastEd.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    }
  }, true);

  // ---- "Design" panel: colours, which sections show, effects ---------------------------------
  var SECTION_NAMES = [
    ['countdown', 'Countdown'], ['note', 'Photo and message'], ['schedule', 'The plan'],
    ['details', 'Good to know'], ['gallery', 'Photos'], ['venue', 'Venue and map'], ['rsvp', 'Replies (RSVP)']
  ];
  var panel = null;
  var opener = document.createElement('button');
  opener.type = 'button';
  opener.id = 'mo-design-open';
  opener.setAttribute('data-no-wording', '');
  opener.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18c1.200 0 1.800-.900 1.800-1.800 0-1.300-1-1.700-1-2.700 0-.800.700-1.500 1.500-1.500H16a5 5 0 0 0 5-5c0-3.900-4-7-9-7Z" fill="none" stroke="currentColor" stroke-width="1.700"/><circle cx="7.800" cy="11.500" r="1.200" fill="currentColor"/><circle cx="10.500" cy="7.500" r="1.200" fill="currentColor"/><circle cx="15" cy="7.800" r="1.200" fill="currentColor"/></svg><span>Colours and sections</span>';
  document.body.appendChild(opener);

  function panelHtml() {
    var pals = (D.palettes || []).map(function (p, i) {
      return '<button type="button" class="mo-pal' + (i === (cfg.palette || 0) ? ' is-on' : '') + '" data-pal="' + i + '" aria-pressed="' + (i === (cfg.palette || 0)) + '">' +
        '<i style="background:' + esc(p.swatch[0]) + '"></i><i style="background:' + esc(p.swatch[1]) + '"></i><i style="background:' + esc(p.swatch[2]) + '"></i>' +
        '<span>' + esc(p.name) + '</span></button>';
    }).join('');
    var secs = SECTION_NAMES.map(function (s) {
      return '<label class="mo-tog"><input type="checkbox" data-sec-tog="' + s[0] + '"' + (on(s[0]) ? ' checked' : '') + '><span>' + s[1] + '</span></label>';
    }).join('');
    return '<div class="mo-panel__head"><b>Colours and sections</b><button type="button" class="mo-panel__x" data-panel-x aria-label="Close">&times;</button></div>' +
      (pals ? '<p class="mo-panel__l">Colours</p><div class="mo-pals">' + pals + '</div>' : '') +
      '<p class="mo-panel__l">Show on the invitation</p><div class="mo-togs">' + secs + '</div>' +
      '<p class="mo-panel__l">Motion</p><label class="mo-tog"><input type="checkbox" data-fx-tog' + (cfg.effects !== false ? ' checked' : '') + '><span>Floating effects and the opening burst</span></label>' +
      '<p class="mo-panel__n">Tap any text on the invitation to change it. Tap a picture to replace it.</p>';
  }
  function openPanel() {
    if (panel) { panel.remove(); panel = null; return; }
    panel = document.createElement('div');
    panel.id = 'mo-panel';
    panel.setAttribute('data-no-wording', '');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Colours and sections');
    panel.innerHTML = panelHtml();
    document.body.appendChild(panel);
  }
  opener.addEventListener('click', openPanel);
  document.addEventListener('click', function (e) {
    if (!panel || !e.target.closest) return;
    if (e.target.closest('[data-panel-x]')) { panel.remove(); panel = null; return; }
    var pal = e.target.closest('[data-pal]');
    if (pal) {
      cfg.palette = +pal.getAttribute('data-pal');
      applyPalette();
      panel.innerHTML = panelHtml();
      saveSoon(0);
    }
  });
  document.addEventListener('change', function (e) {
    var el = e.target;
    if (!panel || !el || !el.hasAttribute) return;
    if (el.hasAttribute('data-sec-tog')) {
      cfg.sections[el.getAttribute('data-sec-tog')] = el.checked;
      saveSoon(0); render(false);
    } else if (el.hasAttribute('data-fx-tog')) {
      cfg.effects = el.checked;
      saveSoon(0);
    }
  });

})();
