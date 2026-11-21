// Shared background-music: guest-facing playback + mute toggle, and (in edit
// mode) a small floating control letting the host upload their own track or
// fall back to the shared default. One implementation instead of one per
// template - every template's namespace object (Papercut/RoseInvite/
// SimpleCard/SimpleAnnouncement) already carries the same shape this needs:
//   NS.mode                    - 'edit' | 'preview' | 'view'
//   NS.config.music            - { enabled, src, volume } (added to each
//                                 template's DEFAULTS; src '' means "use the
//                                 shared default track below")
//   NS.canEdit('music')        - already exists on every template (used to
//                                 gate other fields the same way); false in
//                                 the shopper trial, true for a real host
//   NS.audioUploadUrl          - '/host/events/{id}/audio', set by each
//                                 template's platform-adapter.js the same
//                                 way uploadUrl already is for photos; null
//                                 in trial/standalone dev
//   NS.save()                  - already exists on every template
//
// Usage: the last line of each template's own bootstrap script (app.js) -
//   if (window.BalconyMusic) window.BalconyMusic.mount(RI);
window.BalconyMusic = (function () {
  // Ships with every template as the shared default - a host who never
  // touches the music setting still gets a working, on-theme track rather
  // than silence. Absolute (not relative to the template folder) because
  // it lives once under /templates/music/, not copied into each template.
  // URL-encoded (the filename has a space) - encodeURI would be run on this
  // every use otherwise, and a literal space in a src attribute is asking
  // for a browser/environment to disagree on how to resolve it.
  // No shared default track: the one that shipped with these templates was a
  // commercial film song. An invitation now plays only a track its host chose
  // from the licensed catalogue (or uploaded); otherwise it stays silent.
  var DEFAULT_TRACK = '';

  var ICON_ON =
    '<svg class="music-toggle__icon music-toggle__icon--on" viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M4 9v6h4l5 4V5L8 9H4z"/>' +
    '<path d="M16.5 8.5a5 5 0 0 1 0 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' +
    '<path d="M19 6a8 8 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' +
    '</svg>';
  var ICON_OFF =
    '<svg class="music-toggle__icon music-toggle__icon--off" viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M4 9v6h4l5 4V5L8 9H4z"/>' +
    '<path d="M16.5 9.5l5 5M21.5 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' +
    '</svg>';
  var ICON_NOTE =
    '<svg class="music-toggle__icon" viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M9 18V5l11-2v13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<circle cx="6" cy="18" r="3" fill="none" stroke="currentColor" stroke-width="1.8"/>' +
    '<circle cx="17" cy="16" r="3" fill="none" stroke="currentColor" stroke-width="1.8"/>' +
    '</svg>';

  function clamp01(n) { return Math.max(0, Math.min(1, n)); }

  function xsrfToken() {
    var m = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);
    return m ? decodeURIComponent(m[1]) : '';
  }

  function mount(NS) {
    if (!NS) return;
    if (NS.mode === 'edit') mountEditControl(NS);
    else mountPlayback(NS);
  }

  // ---- Guest-facing playback + mute toggle ---------------------------------
  // Autoplay reality: browsers block audible autoplay until the visitor
  // interacts with the page. The outer Balcony frame grants
  // `allow="autoplay"`, so we try immediately; if refused, the first gesture
  // anywhere on the page unlocks it. The toggle then mutes/unmutes.
  function mountPlayback(NS) {
    var cfg = (NS.config && NS.config.music) || {};
    if (cfg.enabled === false) return;

    var src = (cfg.src || '').trim() || DEFAULT_TRACK;
    if (!src) return; // nothing licensed to play: no audio and no music button

    var audio = new Audio();
    audio.loop = true;
    // 'metadata', not 'auto': loading the whole track on every page view,
    // including the majority of guests who never turn the music on, is
    // exactly the cost this avoids. Audible autoplay is blocked until a
    // gesture anyway, so nothing needs the audio data until the unlock below
    // or the toggle calls play() - and that call starts the full fetch by
    // itself. The header is enough to confirm the file is playable, which is
    // all the button-reveal below waits for.
    audio.preload = 'metadata';
    audio.volume = typeof cfg.volume === 'number' ? clamp01(cfg.volume) : 0.5;
    audio.src = src;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'music-toggle';
    btn.hidden = true; // revealed once we know a track can play
    btn.innerHTML = ICON_ON + ICON_OFF;
    document.body.appendChild(btn);

    // Host previews open the template with ?muted=1 so background music
    // doesn't autoplay in the dashboard workspace; the visitor unmutes with
    // this toggle.
    var startMuted = false;
    try { startMuted = new URLSearchParams(window.location.search).get('muted') === '1'; } catch (e) {}
    var wantsSound = !startMuted;

    function reflect() {
      btn.classList.toggle('is-muted', !wantsSound);
      btn.setAttribute('aria-pressed', String(!wantsSound));
      btn.setAttribute('aria-label', wantsSound ? 'Mute music' : 'Play music');
      btn.title = wantsSound ? 'Mute music' : 'Play music';
    }

    function tryPlay() {
      if (!wantsSound) return;
      var p = audio.play();
      if (p && typeof p.catch === 'function') {
        p.catch(function () { /* blocked - a later gesture will retry */ });
      }
    }

    // Reveal the control only once the browser confirms it can play this
    // file. Both events, because which one arrives depends on how much the
    // browser decided to fetch: under preload='metadata' it parses the
    // header and fires loadedmetadata, and may never buffer enough for
    // canplay until something calls play(). Waiting on canplay alone would
    // leave the toggle hidden for good.
    function revealToggle() { btn.hidden = false; }
    audio.addEventListener('loadedmetadata', revealToggle, { once: true });
    audio.addEventListener('canplay', revealToggle, { once: true });

    // A host's own uploaded track failing to load (moved, deleted, a format
    // the browser can't play) shouldn't leave the guest with silence - fall
    // back to the shared default once.
    audio.addEventListener('error', function () {
      if (DEFAULT_TRACK && audio.src.indexOf(DEFAULT_TRACK) === -1) {
        audio.src = DEFAULT_TRACK;
        audio.load();
        tryPlay();
      }
    });

    tryPlay(); // first attempt - often blocked by the autoplay policy, that's expected

    // Unlock on the first genuine interaction anywhere except the button
    // itself (the button runs its own logic below).
    var GESTURES = ['pointerdown', 'keydown', 'touchstart', 'scroll'];
    function unlock(e) {
      if (e && e.target && btn.contains(e.target)) return;
      if (wantsSound && audio.paused) tryPlay();
      if (!audio.paused) disarmUnlock();
    }
    // Symmetrical, because the page coming back from the background may need
    // to wait for a gesture all over again - re-adding the same listener for
    // the same event is a no-op, so arming twice is harmless.
    function armUnlock() {
      GESTURES.forEach(function (t) { window.addEventListener(t, unlock, { passive: true }); });
    }
    function disarmUnlock() {
      GESTURES.forEach(function (t) { window.removeEventListener(t, unlock); });
    }
    armUnlock();

    btn.addEventListener('click', function () {
      wantsSound = !wantsSound;
      if (wantsSound) { audio.muted = false; tryPlay(); }
      else { audio.pause(); }
      reflect();
    });

    // ---- Stopping when the invitation is no longer on screen ---------------
    // Audio started by a page has a life of its own on a phone. The browser
    // hands it a media session, and a media session is meant to survive the
    // screen locking, the app being switched away from and - in an in-app
    // browser like WhatsApp's - the sheet being swiped shut, complete with a
    // lock-screen control nobody asked for. That is the right behaviour for a
    // music app and quite wrong for an invitation: a guest who opened one and
    // put the phone in their pocket kept hearing it.
    //
    // Three moments, because no one event covers them all:
    //   visibilitychange  tab switched away, app backgrounded, screen locked
    //   pagehide          navigated away or closed - and, with persisted set,
    //                     frozen into the back/forward cache, from which the
    //                     page can come back alive and want its sound again
    //   pageshow          ... exactly that, restored
    //
    // beforeunload and unload are deliberately not used. They are unreliable
    // on mobile - iOS often never fires them - and merely registering one
    // disqualifies the page from the back/forward cache, making 'back' slower
    // for every guest to fix a case pagehide already covers.
    var pausedByUs = false;

    function suspend() {
      if (audio.paused) return;   // already off, or the guest muted it
      pausedByUs = true;
      audio.pause();
    }

    function resume() {
      if (!pausedByUs) return;    // only restart what this code stopped
      pausedByUs = false;
      tryPlay();
      // Returning to a page is not always a fresh gesture as far as the
      // autoplay policy is concerned, so be ready to wait for the next tap.
      armUnlock();
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) suspend();
      else resume();
    });

    window.addEventListener('pagehide', function (e) {
      suspend();
      if (!e.persisted) {
        // A real teardown rather than a freeze: let go of the audio itself,
        // so nothing of it - least of all a lock-screen control - outlives
        // the page that was playing it.
        pausedByUs = false;
        audio.removeAttribute('src');
        audio.load();
      }
    });

    window.addEventListener('pageshow', function (e) {
      if (e.persisted) resume();
    });

    reflect();
  }

  // ---- Host edit-mode control -----------------------------------------------
  // A floating note button (same corner the guest-facing toggle occupies)
  // that opens a tiny popover: current track, "Upload your own", and a
  // "Use default" reset once a host has one. Self-contained (its own file
  // input, its own upload call) so it works the same whether or not the
  // template also loads _platform/editor-kit.js - simple-card and
  // simple-announcement don't.
  function mountEditControl(NS) {
    if (NS.canEdit && !NS.canEdit('music')) return; // shopper trial - no music upload to try
    var cfg = NS.config.music || (NS.config.music = { enabled: true, src: '', volume: 0.5 });

    function persist() {
      Promise.resolve(NS.save()).then(function (ok) {
        if (ok) document.dispatchEvent(new CustomEvent('sutra:saved'));
      });
    }

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'music-toggle music-toggle--edit';
    btn.setAttribute('aria-label', 'Background music');
    btn.title = 'Background music';
    btn.innerHTML = ICON_NOTE;
    document.body.appendChild(btn);

    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/mpeg,audio/mp4,audio/x-m4a,.mp3,.m4a';
    input.hidden = true;
    document.body.appendChild(input);

    var pop = null;
    var errorMsg = '';
    var tracks = null;      // the library, fetched once when the popover first opens
    var preview = null;     // the one track being auditioned
    var previewId = '';
    var uploading = false;  // a track of the host's own is on its way
    var category = '';      // the chosen category; '' shows every track
    var catalogue = [];     // the library's categories, in order

    function esc(t) {
      return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }

    function stopPreview() {
      if (preview) { preview.pause(); preview = null; }
      previewId = '';
    }

    function closePop() { stopPreview(); if (pop) { pop.remove(); pop = null; } }

    function loadTracks() {
      if (tracks) return Promise.resolve(tracks);
      return fetch('/api/music', { credentials: 'same-origin' })
        .then(function (r) { return r.ok ? r.json() : { tracks: [] }; })
        .then(function (d) { tracks = (d && d.tracks) || []; catalogue = (d && d.categories) || []; return tracks; })
        .catch(function () { tracks = []; return tracks; });
    }

    function find(id) { return (tracks || []).filter(function (t) { return t.id === id; })[0]; }

    function currentLabel() {
      if (cfg.enabled === false) return 'No music';
      var src = (cfg.src || '').trim();
      if (!src) return 'No music chosen yet';
      var hit = (tracks || []).filter(function (t) { return t.id === cfg.trackId || t.url === src; })[0];
      return hit ? hit.title : 'Your uploaded track';
    }

    function paint() {
      stopPreview();
      var old = pop ? pop.querySelector('.music-pop__list') : null;
      var scroll = old ? old.scrollTop : 0;
      if (pop) { pop.remove(); pop = null; }
      var none = cfg.enabled === false;
      var chosen = (cfg.src || '').trim();
      pop = document.createElement('div');
      pop.className = 'music-pop';
      var shownTracks = (tracks || []).filter(function (t) {
        return !category || (t.categories || []).indexOf(category) !== -1;
      });
      var chips = catalogue.length
        ? '<div class="music-pop__cats" role="group" aria-label="Music categories">' +
          '<button type="button" class="music-pop__cat" data-music="cat" data-cat="" aria-pressed="' + (category === '' ? 'true' : 'false') + '">All</button>' +
          catalogue.map(function (c) {
            return '<button type="button" class="music-pop__cat" data-music="cat" data-cat="' + esc(c.slug) + '" aria-pressed="' + (category === c.slug ? 'true' : 'false') + '">' + esc(c.name) + '</button>';
          }).join('') +
          '</div>'
        : '';
      var rows = shownTracks.map(function (t) {
        var on = !none && (t.id === cfg.trackId || t.url === chosen);
        return '<li class="music-pop__item' + (on ? ' is-on' : '') + '">' +
          '<button type="button" class="music-pop__play" data-music="play" data-id="' + esc(t.id) + '" aria-label="Listen to ' + esc(t.title) + '">&#9654;</button>' +
          '<span class="music-pop__name">' + esc(t.title) + (t.vibe ? '<small>' + esc(t.vibe) + '</small>' : '') + '</span>' +
          '<button type="button" class="music-pop__use" data-music="choose" data-id="' + esc(t.id) + '"' + (on ? ' aria-pressed="true"' : '') + '>' + (on ? 'Chosen' : 'Use') + '</button>' +
          '</li>';
      }).join('');
      pop.innerHTML =
        '<p class="music-pop__title">Background music</p>' +
        '<p class="music-pop__current">Now: <b>' + esc(currentLabel()) + '</b></p>' +
        chips +
        (errorMsg ? '<p class="music-pop__error">' + esc(errorMsg) + '</p>' : '') +
        '<ul class="music-pop__list">' +
        '<li class="music-pop__item' + (none ? ' is-on' : '') + '"><span class="music-pop__mute" aria-hidden="true">&#128263;</span>' +
        '<span class="music-pop__name">No music<small>The invitation stays silent</small></span>' +
        '<button type="button" class="music-pop__use" data-music="none"' + (none ? ' aria-pressed="true"' : '') + '>' + (none ? 'Chosen' : 'Use') + '</button></li>' +
        (tracks === null ? '<li class="music-pop__empty">Loading tracks…</li>' : (rows || '<li class="music-pop__empty">' + (category ? 'No tracks in this category yet.' : 'No tracks in the library yet.') + '</li>')) +
        '</ul>' +
        '<div class="music-pop__row">' +
        '<button type="button" class="music-pop__btn" data-music="upload"' + (uploading ? ' disabled aria-busy="true"' : '') + '>' + (uploading ? 'Uploading your track…' : 'Upload your own') + '</button>' +
        '</div>' +
        '<p class="music-pop__note">Your own track: MP3 or M4A, up to 8 MB.</p>';
      document.body.appendChild(pop);
      var r = btn.getBoundingClientRect();
      pop.style.top = Math.max(8, r.bottom + 8) + 'px';
      pop.style.right = Math.max(8, window.innerWidth - r.right) + 'px';
      var list = pop.querySelector('.music-pop__list');
      if (list) list.scrollTop = scroll;
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (pop) { closePop(); return; }
      errorMsg = '';
      paint();
      if (tracks === null) loadTracks().then(function () { if (pop) paint(); });
    });

    document.addEventListener('pointerdown', function (e) {
      if (pop && !pop.contains(e.target) && e.target !== btn && !btn.contains(e.target)) closePop();
    });

    document.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('[data-music]');
      if (!t || !pop || !pop.contains(t)) return;
      var act = t.dataset.music;
      if (act === 'upload') {
        input.click();
      } else if (act === 'cat') {
        category = t.dataset.cat || '';
        errorMsg = '';
        paint();
      } else if (act === 'none') {
        cfg.enabled = false;
        errorMsg = '';
        paint();
        persist();
      } else if (act === 'choose') {
        var tr = find(t.dataset.id);
        if (!tr) return;
        cfg.enabled = true;
        cfg.src = tr.url;
        cfg.trackId = tr.id;
        errorMsg = '';
        paint();
        persist();
      } else if (act === 'play') {
        var id = t.dataset.id;
        var again = previewId === id;
        var tp = find(id);
        stopPreview();
        pop.querySelectorAll('.music-pop__play').forEach(function (b) { b.innerHTML = '&#9654;'; });
        if (again || !tp) return;
        preview = new Audio(tp.url);
        preview.volume = 0.7;
        previewId = id;
        t.innerHTML = '&#10074;&#10074;';
        preview.addEventListener('ended', function () { t.innerHTML = '&#9654;'; previewId = ''; });
        preview.play().catch(function () {
          previewId = '';
          t.innerHTML = '&#9654;';
          errorMsg = "Couldn't play that track.";
        });
      }
    });

    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      input.value = '';
      if (!file) return;

      // 8 MB is generous for a soft background track and far short of what
      // would make an invitation slow to open.
      if (file.size > 8 * 1024 * 1024) {
        errorMsg = 'That file is too large - please keep it under 8 MB.';
        paint();
        return;
      }

      if (NS.audioUploadUrl) {
        uploading = true;
        errorMsg = '';
        paint();
        var form = new FormData();
        form.append('audio', file);
        fetch(NS.audioUploadUrl, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { Accept: 'application/json', 'X-XSRF-TOKEN': xsrfToken() },
          body: form,
        })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (res) {
            uploading = false;
            if (res && res.url) {
              cfg.src = res.url;
              cfg.enabled = true;
              cfg.trackId = '';
              errorMsg = '';
              paint();
              persist();
            } else {
              errorMsg = "Couldn't upload that file - please check your connection.";
              paint();
            }
          })
          .catch(function () {
            uploading = false;
            errorMsg = "Couldn't upload that file - please check your connection.";
            paint();
          });
      } else {
        // Trial/standalone dev - no event to upload against yet. A local
        // object URL previews the pick; like editor-kit's own pickPhoto in
        // this same mode, it doesn't survive a reload.
        cfg.src = URL.createObjectURL(file);
        cfg.enabled = true;
        cfg.trackId = '';
        errorMsg = '';
        paint();
        persist();
      }
    });
  }

  return { mount: mount, DEFAULT_TRACK: DEFAULT_TRACK };
})();
