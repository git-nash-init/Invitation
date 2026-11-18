// Papercut Lotus - editor wiring: mounts the shared editing mechanics
// (_platform/editor-kit.js) and the shared toolbar chrome
// (_platform/toolbar.js), and defines this template's one bespoke
// data-action: picking a new gallery photo. Everything else editable here
// is plain [data-edit] contenteditable text, which editor-kit.js already
// wires generically (see render.js's editable() helper) - there's nothing
// else template-specific to hook up, unlike rose-invitation's add/remove/
// reorder handlers for its polaroid gallery and ceremony list.
(function () {
  const PC = window.Papercut;
  if (!PC) return;

  const kit = window.BalconyEditorKit && window.BalconyEditorKit.init(PC);
  if (!kit) return; // guests never wire editing at all (RI.mode === 'view')

  const cfg = PC.config;
  const GALLERY_MAX = 5;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const esc = PC.esc;

  // ---- Ceremony fields written by a native control -------------------------
  // The kit persists [data-edit-input] values itself but cannot know what to
  // redraw afterwards - a path like "ceremonies.2.time" says nothing about
  // which section owns it. A ceremony's date, time or maps link all change what
  // its card prints, so any of the three redraws the deck.
  document.addEventListener('sutra:field-changed', (e) => {
    if (/^ceremonies\.\d+\.(date|time|mapUrl)$/.test(e.detail.path)) {
      PC.render.ceremonies();
    }
  });

  // ---- Shared venue across ceremonies ----------------------------------------
  // Not [data-edit-input] (venue is contenteditable, via editable() -
  // ceremonies.N.venue), so this listens for the field losing focus rather
  // than a sutra:field-changed event, which contenteditable fields don't
  // dispatch.
  //
  // The FIRST ceremony's venue (Ring Ceremony) is the shared default for the
  // whole event - editing it fills every OTHER ceremony that hasn't been
  // individually overridden, so a host only has to type the address once and
  // then override just the ceremonies that are actually somewhere else.
  // Editing any other ceremony's venue marks THAT one overridden instead of
  // cascading from it - otherwise fixing Reception's address would blast
  // that same address onto every ceremony still following the default.
  document.addEventListener('focusout', (e) => {
    const el = e.target.closest ? e.target.closest('[data-edit]') : null;
    if (!el) return;
    const m = /^ceremonies\.(\d+)\.venue$/.exec(el.dataset.edit || '');
    if (!m) return;
    const i = +m[1];
    const list = cfg.ceremonies || [];
    const c = list[i];
    if (!c) return;

    if (i === 0) {
      list.forEach((other, j) => {
        if (j !== 0 && !other.venueCustom) other.venue = c.venue;
      });
    } else {
      c.venueCustom = true;
    }
    kit.saveNow();
    PC.render.ceremonies();
  });

  // An added ceremony's name is one of the two things that put it in front of
  // guests (PC.ceremonyLive), so finishing or emptying it can show or clear
  // the "hidden from guests" line under its card. Redrawn only when that
  // changes: the redraw would otherwise take the card out from under whatever
  // the host just clicked on next.
  document.addEventListener('focusout', (e) => {
    const el = e.target.closest ? e.target.closest('[data-edit]') : null;
    const m = el && /^ceremonies\.(\d+)\.name$/.exec(el.dataset.edit || '');
    if (!m) return;
    const c = (cfg.ceremonies || [])[+m[1]];
    if (!c || !c.custom) return;
    const item = el.closest('.ceremony');   // the card and the panel under it
    const hinted = !!(item && item.querySelector('.cere-hint'));
    if (hinted === PC.ceremonyLive(c)) PC.render.ceremonies();
  });

  // ---- Framing an added ceremony's photo -----------------------------------
  // The picture area is the only control it has. Four gestures share it, told
  // apart by what the pointer does rather than by separate widgets:
  //
  //   tap            choose a photo, or swap the one that is there
  //   drag           move the picture inside its arch
  //   wheel / pinch  zoom in and out
  //
  // Everything is written onto the <img> directly rather than by re-rendering:
  // a re-render mid-gesture would rebuild the element under the pointer and
  // drop the very gesture that caused it.
  const CEREMONY_ZOOM_MAX = 3;
  const clampCeremonyZoom = (z) => clamp(z, PC.CEREMONY_ZOOM_MIN, CEREMONY_ZOOM_MAX);

  function ceremonyAt(box) {
    const c = box && (cfg.ceremonies || [])[+box.dataset.cphoto];
    return c && c.custom ? c : null;
  }

  const ceremonyImg = (box) => box.querySelector('.ceremony__photo-img');

  // The framing itself lives in render.js, so a picture is laid out the same
  // way for a guest as it is mid-drag here. This only hands it the numbers.
  function applyCeremonyFrame(box, c) {
    const el = ceremonyImg(box);
    if (!el) return;
    el.dataset.zoom = clampCeremonyZoom(+c.zoom || 1);
    el.dataset.posX = Number.isFinite(+c.posX) ? +c.posX : 50;
    el.dataset.posY = Number.isFinite(+c.posY) ? +c.posY : 50;
    PC.framePhoto(el);
  }

  // Zoom about the centre, which is what both the wheel and a pinch imply.
  function zoomCeremony(box, factor) {
    const c = ceremonyAt(box);
    if (!c || !(c.art || '').trim()) return;   // nothing to zoom yet
    c.zoom = clampCeremonyZoom((+c.zoom || 1) * factor);
    applyCeremonyFrame(box, c);
    kit.scheduleSave();
  }

  // An added ceremony's photo. Set on the entry itself rather than by its
  // index: the kit calls back twice (a preview, then the uploaded file's URL).
  // A new photo starts framed afresh - the old one's zoom and position were
  // chosen for a different picture. A transparent PNG keeps its see-through
  // parts, so the card's own white shows through them, as it does round the
  // built-in artwork.
  function pickCeremonyPhoto(c) {
    if (!PC.canEdit('ceremonies')) return;
    let fresh = true;   // only on the first call: a zoom made before the
                        // upload lands belongs to this same picture
    kit.pickPhoto((url) => {
      if (fresh) { delete c.zoom; delete c.posX; delete c.posY; fresh = false; }
      c.art = url;
      kit.saveNow();
      PC.render.ceremonies();
    }, { keepTransparency: true });
  }

  // Wheel: the laptop half of zooming. Non-passive so preventDefault can stop
  // the page scrolling past the card.
  document.addEventListener('wheel', (e) => {
    const box = e.target.closest && e.target.closest('[data-cphoto]');
    if (!box) return;
    e.preventDefault();
    zoomCeremony(box, e.deltaY < 0 ? 1.08 : 1 / 1.08);
  }, { passive: false });

  // Pointers in flight per photo, so a second finger turns a drag into a
  // pinch rather than fighting it.
  const ceremonyTouches = new Map();

  document.addEventListener('pointerdown', (e) => {
    const box = e.target.closest && e.target.closest('[data-cphoto]');
    const c = ceremonyAt(box);
    if (!c) return;

    const live = ceremonyTouches.get(box) || new Map();
    ceremonyTouches.set(box, live);
    live.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const startX = e.clientX, startY = e.clientY;
    const fromX = Number.isFinite(+c.posX) ? +c.posX : 50;
    const fromY = Number.isFinite(+c.posY) ? +c.posY : 50;
    let moved = false;
    let pinchFrom = null;

    const spread = () => {
      const pts = [...live.values()];
      if (pts.length < 2) return null;
      return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    };

    box.setPointerCapture(e.pointerId);

    const move = (ev) => {
      if (live.has(ev.pointerId)) live.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });

      // Two fingers: pinch, measured against the spread when the second one
      // landed, so the picture tracks the fingers instead of drifting.
      if (live.size >= 2) {
        const now = spread();
        if (pinchFrom === null) { pinchFrom = now; return; }
        if (now && pinchFrom) {
          moved = true;
          zoomCeremony(box, now / pinchFrom);
          pinchFrom = now;
        }
        return;
      }

      // One finger: pan. The pointer's pixels become the stored 0-100 by
      // dividing by how much bigger than its arch the picture is, so it keeps
      // pace with the finger whatever the zoom. Zoomed out below covering,
      // that spare is negative and the smaller picture simply follows.
      if (Math.abs(ev.clientX - startX) > 3 || Math.abs(ev.clientY - startY) > 3) moved = true;
      if (!moved) return;
      const el = ceremonyImg(box);
      if (!el) return;
      const sx = el.offsetWidth - box.clientWidth, sy = el.offsetHeight - box.clientHeight;
      if (Math.abs(sx) > 1) c.posX = clamp(fromX - (ev.clientX - startX) * 100 / sx, 0, 100);
      if (Math.abs(sy) > 1) c.posY = clamp(fromY - (ev.clientY - startY) * 100 / sy, 0, 100);
      applyCeremonyFrame(box, c);
    };

    const up = (ev) => {
      live.delete(ev.pointerId);
      if (live.size) { pinchFrom = null; return; }   // other fingers still down
      ceremonyTouches.delete(box);
      box.removeEventListener('pointermove', move);
      box.removeEventListener('pointerup', up);
      box.removeEventListener('pointercancel', up);
      // A press that went nowhere is a tap, and a tap picks the photo. Done
      // here rather than with a click listener because the pointer is
      // captured: the browser retargets the click.
      if (moved) kit.saveNow();
      else pickCeremonyPhoto(c);
    };

    box.addEventListener('pointermove', move);
    box.addEventListener('pointerup', up);
    box.addEventListener('pointercancel', up);
  });

  // ---- Include / exclude one ceremony ---------------------------------------
  // Not in the shared kit: "keep at least one" is this template's rule about
  // ceremonies, not generic [data-edit-toggle] behaviour. The entry keeps its
  // name, date and venue while excluded, so this is reversible - which is the
  // whole point of a toggle rather than a delete.
  document.addEventListener('change', (e) => {
    const input = e.target;
    if (!(input.matches && input.matches('[data-edit-toggle]'))) return;
    if (!PC.canEdit('ceremonies')) { input.checked = !input.checked; return; }

    const list = cfg.ceremonies || [];
    if (!input.checked && list.filter(PC.ceremonyLive).length <= 1) {
      input.checked = true;
      kit.toast('Keep at least one ceremony - the schedule always appears.');
      return;
    }
    kit.setVal(input.dataset.editToggle, input.checked);
    kit.saveNow();
    PC.render.ceremonies();
  });

  // ---- Wedding date picker -------------------------------------------------
  // The plaque prints day / month / year on three separate panels, so one
  // calendar pick has to fan out into three config fields. eventISO holds the
  // machine value; the three display strings are derived from it, never parsed
  // back out of it - that way a host who hand-types "Ashadha" into a panel
  // does not break the picker, and the picker overwrites cleanly when used.
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  function ordinal(n) {
    // 11th/12th/13th are the exceptions to the 1st/2nd/3rd pattern.
    const teen = n % 100 >= 11 && n % 100 <= 13;
    const suffix = teen ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' })[n % 10] || 'th';
    return n + suffix;
  }

  // Parsed by hand rather than with `new Date(iso)`: that constructor reads a
  // bare yyyy-mm-dd as UTC, so anywhere west of Greenwich it renders the day
  // BEFORE the one the host picked.
  function applyISO(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!m) return false;
    const y = +m[1], mo = +m[2], d = +m[3];
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return false;

    cfg.eventISO = iso;
    cfg.eventDay = ordinal(d);
    cfg.eventMonth = MONTHS[mo - 1];
    cfg.eventYear = String(y);
    // Keep the one-line form in step, so the older reveal section still shows
    // the right date the moment its markup is un-commented.
    cfg.eventDate = cfg.eventDay + ' ' + cfg.eventMonth + ' ' + cfg.eventYear;
    syncCeremoniesToVivaah(iso);
    return true;
  }

  // Hand-typed day/month/year (see the 'date-pick' action) - always updates
  // the three panels as typed, and additionally advances eventISO (so the
  // ceremony schedule reschedules with it, same as a calendar pick) whenever
  // the three pieces happen to parse as a real calendar date. A value the
  // calendar cannot express ("Ashadha", "TBC") just sits in its panel.
  function applyManualDate(dayText, monthText, yearText) {
    cfg.eventDay = dayText;
    cfg.eventMonth = monthText;
    cfg.eventYear = yearText;
    cfg.eventDate = [dayText, monthText, yearText].filter((s) => (s || '').trim()).join(' ');

    const day = parseInt(dayText, 10);
    const monthIdx = MONTHS.findIndex((m) => m.toLowerCase() === (monthText || '').trim().toLowerCase());
    const year = parseInt(yearText, 10);
    if (day >= 1 && day <= 31 && monthIdx !== -1 && /^\d{4}$/.test((yearText || '').trim())) {
      const iso = year + '-' + String(monthIdx + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
      cfg.eventISO = iso;
      syncCeremoniesToVivaah(iso);
    }
  }

  // ---- Ceremony schedule follows the date-reveal date -----------------------
  // The date picked here IS the Vivaah date - everything else in the
  // ceremony carousel is scheduled relative to it, in the order the rites
  // actually run (see the matching comment/offsets in config.js's DEFAULTS,
  // which seed a brand-new invitation the same way). A host who has renamed
  // a ceremony's card no longer matches an entry here, so its date is simply
  // left alone rather than guessed at - and so is every ceremony the host
  // added themselves, even one they happened to call "Haldi": its date is the
  // one they typed.
  const VIVAAH_OFFSETS = {
    'ring ceremony': -3,
    'mehendi': -2,
    'haldi': -1,
    'sangeet': -1,
    'vivaah': 0,
    'reception': 1,
  };

  // Pure calendar-component arithmetic (Date.UTC/getUTC*, no timezone
  // conversion) - the same reason applyISO above avoids `new Date(iso)`.
  function addDaysISO(iso, days) {
    const mm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!mm) return iso;
    const dt = new Date(Date.UTC(+mm[1], +mm[2] - 1, +mm[3]));
    dt.setUTCDate(dt.getUTCDate() + days);
    return dt.getUTCFullYear() + '-' + String(dt.getUTCMonth() + 1).padStart(2, '0') + '-' + String(dt.getUTCDate()).padStart(2, '0');
  }

  function syncCeremoniesToVivaah(vivaahISO) {
    (cfg.ceremonies || []).forEach((c) => {
      if (c.custom) return;
      const offset = VIVAAH_OFFSETS[(c.name || '').trim().toLowerCase()];
      if (offset !== undefined) c.date = addDaysISO(vivaahISO, offset);
    });
  }

  // ---- Opening-invocation picker -------------------------------------------
  // Ported from rose-invitation/editor.js so the host gets the identical
  // control in both templates: custom (non-native) dropdowns, so the option
  // list can be styled and each native script rendered in its own font, plus a
  // live preview of the single line the cover will show.

  // Cap on a host's own line - it renders large on the intro cover, so keep it
  // short enough not to overflow.
  const INVOCATION_MAX = 60;

  // One styled <button> option inside a dropdown menu.
  function ddOption(kind, value, text, current, font, rtl) {
    return '<button type="button" class="inv-dd__opt' + (current ? ' is-current' : '') + '"' +
      ' data-dd-set data-dd-kind="' + kind + '" data-dd-value="' + esc(value) + '"' +
      (font ? ' style="font-family:' + font + '"' : '') + (rtl ? ' dir="rtl"' : '') + '>' +
      esc(text) + '</button>';
  }

  // A labelled dropdown: trigger (current value) + menu of options.
  function ddBlock(kind, label, valueText, valueFont, valueRtl, optionsHtml) {
    return '<div class="edit-pop__field"><span>' + label + '</span>' +
      '<div class="inv-dd" data-dd="' + kind + '">' +
      '<button type="button" class="inv-dd__trigger" data-dd-toggle>' +
      '<span class="inv-dd__value"' + (valueFont ? ' style="font-family:' + valueFont + '"' : '') +
      (valueRtl ? ' dir="rtl"' : '') + '>' + esc(valueText) + '</span>' +
      '<svg class="inv-dd__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>' +
      '</button>' +
      '<div class="inv-dd__menu" role="listbox">' + optionsHtml + '</div>' +
      '</div></div>';
  }

  function symThumb(s) {
    return s.src
      ? '<img class="inv-dd__sym" src="' + esc(s.src) + '" alt="" />'
      : '<span class="inv-dd__sym inv-dd__sym--none">-</span>';
  }

  // Symbol dropdown - each option shows the artwork plus its label.
  function symbolBlock() {
    const cur = PC.symbolById(cfg.invocation.symbol);
    const options = PC.SYMBOLS.map((s) => (
      '<button type="button" class="inv-dd__opt inv-dd__opt--sym' + (cur.id === s.id ? ' is-current' : '') + '"' +
      ' data-dd-set data-dd-kind="symbol" data-dd-value="' + esc(s.id) + '">' +
      symThumb(s) + '<span>' + esc(s.label) + '</span></button>'
    )).join('');

    return '<div class="edit-pop__field"><span>Symbol</span>' +
      '<div class="inv-dd" data-dd="symbol">' +
      '<button type="button" class="inv-dd__trigger" data-dd-toggle>' +
      '<span class="inv-dd__value inv-dd__value--sym">' + symThumb(cur) + '<span>' + esc(cur.label) + '</span></span>' +
      '<svg class="inv-dd__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>' +
      '</button>' +
      '<div class="inv-dd__menu" role="listbox">' + options + '</div>' +
      '</div></div>';
  }

  // ONE grouped list rather than separate tradition/script dropdowns: under
  // each tradition heading sits its line in English AND in its native
  // script(s). Picking an option sets both the tradition and the script.
  function invocationBlock() {
    const inv = cfg.invocation;
    const rels = PC.INVOCATIONS;
    const cur = PC.invocationLines(inv); // the currently resolved line

    let menu = '';
    Object.keys(rels).forEach((relKey) => {
      const rel = rels[relKey];
      menu += '<div class="inv-dd__group">' + esc(rel.label) + '</div>';
      const engOn = inv.religion === relKey && cur.isEnglish;
      menu += ddOption('inv', relKey + ':english', rel.english, engOn, '', false);
      Object.keys(rel.scripts).forEach((sk) => {
        const s = rel.scripts[sk];
        const on = inv.religion === relKey && !cur.isEnglish && cur.script === sk;
        menu += ddOption('inv', relKey + ':' + sk, s.text, on, "'" + s.font + "'", !!s.rtl);
      });
    });

    menu += '<div class="inv-dd__group">Other</div>';
    menu += ddOption('inv', 'custom', '✎ Write your own…', cur.isCustom, '', false);
    menu += ddOption('inv', 'blank', 'No invocation line', cur.isBlank, '', false);

    const triggerText = cur.isCustom ? (cur.text || 'Write your own…')
      : cur.isBlank ? 'No invocation line'
        : cur.text;
    const curFont = (cur.isEnglish || cur.isCustom || cur.isBlank || !cur.font) ? '' : "'" + cur.font + "'";
    const block = ddBlock('inv', 'Invocation', triggerText, curFont, cur.isBlank ? false : cur.rtl, menu);

    // Free-text field, shown only while "Write your own…" is the current pick.
    const customInput = cur.isCustom
      ? '<input type="text" class="inv-custom" maxlength="' + INVOCATION_MAX + '" value="' + esc(inv.custom || '') + '" placeholder="Write your invocation line…" />' +
      '<div class="inv-custom__count">' + (inv.custom || '').length + ' / ' + INVOCATION_MAX + '</div>'
      : '';

    return block + customInput;
  }

  function invocationPopHtml() {
    const line = PC.invocationLines(cfg.invocation);
    const sym = PC.symbolById(cfg.invocation.symbol);

    const preview =
      '<div class="edit-pop__inv-preview">' +
      (sym.src ? '<img class="inv-preview__sym" src="' + esc(sym.src) + '" alt="" />' : '') +
      (line.text
        ? '<div class="inv-preview__native"' + (line.rtl ? ' dir="rtl"' : '') +
        (line.isEnglish ? '' : ' style="font-family:\'' + line.font + '\',serif"') +
        '>' + esc(line.text) + '</div>'
        : (sym.src ? '' : '<div class="inv-preview__en">No opening line</div>')) +
      '</div>';

    return '<h4>Opening invocation</h4>' + invocationBlock() + symbolBlock() + preview;
  }

  // ONE delegated listener per popover element, guarded - the pop survives its
  // own innerHTML rebuilds, so re-adding would stack handlers.
  function wireInvocationPop(pop) {
    if (!pop || pop.__invWired) return;
    pop.__invWired = true;

    pop.addEventListener('click', (e) => {
      const toggle = e.target.closest('[data-dd-toggle]');
      if (toggle) {
        const dd = toggle.closest('.inv-dd');
        const open = dd.classList.contains('is-open');
        pop.querySelectorAll('.inv-dd.is-open').forEach((d) => d.classList.remove('is-open'));
        if (!open) dd.classList.add('is-open');
        return;
      }

      const opt = e.target.closest('[data-dd-set]');
      if (opt) {
        if (opt.dataset.ddKind === 'symbol') {
          cfg.invocation.symbol = opt.dataset.ddValue;
        } else if (opt.dataset.ddKind === 'inv') {
          const parts = opt.dataset.ddValue.split(':');
          if (parts.length === 1) {
            // 'custom' or 'blank' - keep the religion, switch the script only.
            cfg.invocation.script = parts[0];
          } else {
            cfg.invocation.religion = parts[0];
            cfg.invocation.script = parts[1];
          }
        }
        kit.saveNow();
        PC.render.invocation();
        pop.innerHTML = invocationPopHtml();
        const ci = pop.querySelector('.inv-custom');
        if (ci) ci.focus();
        return;
      }

      // A click anywhere else inside the popover closes any open menu.
      pop.querySelectorAll('.inv-dd.is-open').forEach((d) => d.classList.remove('is-open'));
    });

    // Live custom line: update config + cover on each keystroke, then rebuild
    // the pop (preview + trigger) while restoring focus and caret.
    pop.addEventListener('input', (e) => {
      const inp = e.target.closest('.inv-custom');
      if (!inp) return;
      // Enforce the cap even on paste - maxlength misses programmatic input.
      if (inp.value.length > INVOCATION_MAX) inp.value = inp.value.slice(0, INVOCATION_MAX);
      cfg.invocation.custom = inp.value;
      kit.saveNow();
      PC.render.invocation();
      const caret = inp.selectionStart;
      pop.innerHTML = invocationPopHtml();
      const next = pop.querySelector('.inv-custom');
      if (next) { next.focus(); try { next.setSelectionRange(caret, caret); } catch (_) { /* ignore */ } }
    });
  }

  function galleryList(kind) {
    if (!Array.isArray(cfg.gallery[kind])) cfg.gallery[kind] = [''];
    return cfg.gallery[kind];
  }

  // The removal itself, split out of the gallery-remove action so the photo
  // path can run it after a confirmation and the notes path straight away.
  // The index is re-checked here rather than trusted: for photos it was read
  // when the popover opened, and the reel can be redrawn while it is up.
  function removeGalleryItem(kind, idx) {
    const list = galleryList(kind);
    if (idx < 0 || idx >= list.length) return;
    list.splice(idx, 1);
    PC.render.gallery();
    if (PC.galleryGoto) PC.galleryGoto(kind, Math.max(0, idx - 1));
    kit.saveNow();
  }

  // Photo item as a mutable adjustment object (src + object-position + zoom).
  function photoAt(i) {
    const list = galleryList('photos');
    let o = list[i];
    if (!o || typeof o !== 'object') {
      o = { src: (typeof o === 'string' ? o : ''), px: 50, py: 50, zoom: 1.2 };
      list[i] = o;
    }
    if (o.px == null) o.px = 50;
    if (o.py == null) o.py = 50;
    // See photoOf in render.js - 1.2 so both axes have crop room to pan, not
    // just whichever one object-fit:cover happened to leave slack in at 1.
    if (!o.zoom) o.zoom = 1.2;
    return o;
  }

  function applyPhotoTransform(view, o) {
    const img = view && view.querySelector('.frame__photo');
    if (img) {
      img.style.objectPosition = o.px + '% ' + o.py + '%';
      img.style.transform = 'scale(' + o.zoom + ')';
    }
  }

  // Shared by the 'gallery-photo' action (the small ↺ control) and a plain
  // tap on the photo itself (see endPan below) - one picker flow, two ways
  // to reach it.
  function pickPhotoFor(idx) {
    kit.pickPhoto((url) => {
      galleryList('photos')[idx] = { src: url, px: 50, py: 50, zoom: 1.2 };
      PC.render.gallery();
      if (PC.galleryGoto) PC.galleryGoto('photos', idx);
    });
  }

  const actions = {
    // Wedding date: a native calendar, which brings each platform's own date
    // UI (and its locale and keyboard) for free rather than a hand-rolled one.
    'date-pick': (btn) => {
      const pop = kit.openPop(btn,
        '<h4>Wedding date</h4>' +
        '<input type="date" class="date-input" value="' + esc(cfg.eventISO || '') + '">' +
        '<div class="date-input__hint">Sets the day, month and year panels - or type them directly:</div>' +
        '<div class="date-input__manual">' +
          '<label class="edit-pop__field"><span>Day</span><input type="text" class="date-input__day" value="' + esc(cfg.eventDay || '') + '" placeholder="8th"></label>' +
          '<label class="edit-pop__field"><span>Month</span><input type="text" class="date-input__month" value="' + esc(cfg.eventMonth || '') + '" placeholder="February"></label>' +
          '<label class="edit-pop__field"><span>Year</span><input type="text" class="date-input__year" value="' + esc(cfg.eventYear || '') + '" placeholder="2026"></label>' +
        '</div>');
      const inp = pop && pop.querySelector('.date-input');
      if (!inp) return;
      try { inp.showPicker ? inp.showPicker() : inp.focus(); } catch (_) { inp.focus(); }

      const dayInp = pop.querySelector('.date-input__day');
      const moInp = pop.querySelector('.date-input__month');
      const yrInp = pop.querySelector('.date-input__year');

      function redraw() {
        PC.render.dateReveal();
        PC.render.ceremonies();
      }

      // `change`, not `input`: a native date field fires input on every partial
      // edit (year typed before month), which would write half-built dates.
      inp.addEventListener('change', () => {
        if (!applyISO(inp.value)) return;
        // The calendar just overwrote the three panels - keep the typed
        // fields in step so they don't show a stale value if reopened.
        if (dayInp) dayInp.value = cfg.eventDay;
        if (moInp) moInp.value = cfg.eventMonth;
        if (yrInp) yrInp.value = cfg.eventYear;
        kit.saveNow();
        redraw();
      });

      // Typed day/month/year - a host can write something the calendar
      // cannot express ("Ashadha", "TBC"), same as the plaque always allowed.
      // `change` (on blur), not `input`, so the ceremony schedule doesn't
      // reshuffle after every keystroke.
      [dayInp, moInp, yrInp].forEach((el) => {
        if (!el) return;
        el.addEventListener('change', () => {
          applyManualDate(dayInp.value, moInp.value, yrInp.value);
          // The calendar input only makes sense to keep in sync when the
          // typed value parsed as a real date - applyManualDate already
          // updated cfg.eventISO in that case.
          inp.value = cfg.eventISO || '';
          kit.saveNow();
          redraw();
        });
      });
    },

    // Opening invocation: tradition, script and symbol, all in one popover.
    'invocation-pick': (btn) => {
      const pop = kit.openPop(btn, invocationPopHtml());
      wireInvocationPop(pop);
    },

    // Pick/replace the photo for one frame - a new pick resets its adjustment.
    'gallery-photo': (btn) => {
      if (!btn || btn.disabled || btn.hasAttribute('data-locked')) return;
      pickPhotoFor(+btn.dataset.idx || 0);
    },
    // Zoom the shown photo in/out (a picture fills its frame at zoom 1).
    'gallery-zoom': (btn) => {
      const idx = +btn.dataset.idx || 0;
      const o = photoAt(idx);
      if (!o.src) return;
      o.zoom = clamp(Math.round((o.zoom + (btn.dataset.dir === 'in' ? 0.15 : -0.15)) * 100) / 100, 1, 3);
      const view = document.querySelector('.frame__photo-view[data-idx="' + idx + '"]');
      if (view) applyPhotoTransform(view, o);
      kit.scheduleSave();
    },
    // Add another frame (up to GALLERY_MAX), then jump to it.
    //
    // PHOTOS open the picker and store the result. They used to push an empty
    // string to reserve a slot; an unfilled reservation then sat in the array
    // as a blank frame between real photos, and nothing ever cleared it. There
    // is no reserving now - a photo enters the array only once it exists.
    //
    // NOTES push an empty and drop the caret into it - a note is typed in
    // place, so it has to exist before it can be written. render.js discards
    // any note still blank once editing is over, so an abandoned one never
    // reaches a guest and never leaves a hole in the reel.
    'gallery-add': (btn) => {
      const kind = btn.dataset.kind;
      const list = galleryList(kind);
      if (list.length >= GALLERY_MAX) { kit.toast('Up to ' + GALLERY_MAX + ' allowed'); return; }

      if (kind === 'photos') {
        kit.pickPhoto((url) => {
          list.push({ src: url, px: 50, py: 50, zoom: 1.2 });
          PC.render.gallery();
          if (PC.galleryGoto) PC.galleryGoto(kind, list.length - 1);
          kit.saveNow();
        });
        return;
      }

      list.push('');
      PC.render.gallery();
      if (PC.galleryGoto) PC.galleryGoto(kind, list.length - 1);
      const fresh = document.querySelector('#pcGalleryNoteTrack [data-note-idx="' + (list.length - 1) + '"]');
      if (fresh && fresh.focus) fresh.focus();
      kit.saveNow();
    },
    // Reorder a frame, the way rose-invitation's gallery cards do. Papercut
    // shows one card at a time behind a pager rather than a row of them, so
    // the controls sit on the frame and act on whichever cell is in the
    // opening - but the outcome is the same: the host decides the order.
    //
    // The carousel FOLLOWS the card (galleryGoto to its new index), otherwise
    // the frame appears to swap its contents with the neighbour and the card
    // being moved is the one that vanishes.
    'gallery-move': (btn) => {
      const kind = btn.dataset.kind;
      const list = galleryList(kind);
      const from = +btn.dataset.idx || 0;
      const to = from + (+btn.dataset.dir);
      if (to < 0 || to >= list.length) return;

      const moved = list[from];
      list[from] = list[to];
      list[to] = moved;

      PC.render.gallery();
      if (PC.galleryGoto) PC.galleryGoto(kind, to);
      kit.saveNow();
    },

    // Remove a frame (never the last one), then step back to a neighbour.
    //
    // A photograph asks first. It is the only thing in the editor the host
    // cannot get back by retyping - it came off their device and would have to
    // be found and uploaded again - and the x sits right beside the reorder
    // arrows on a small frame, which is an easy mis-tap. Notes are text the
    // host can write again, so those still go on the first click.
    'gallery-remove': (btn) => {
      const kind = btn.dataset.kind;
      const list = galleryList(kind);
      // Either reel can go to none - each has an add-cell to start again.
      if (list.length <= 0) return;
      const idx = +btn.dataset.idx || 0;

      if (kind !== 'photos') {
        removeGalleryItem(kind, idx);
        return;
      }

      // The kit already closes a popover on outside-click and on Escape, so
      // clicking away IS the cancel - the "Keep it" button is just the explicit
      // way to say the same thing.
      const pop = kit.openPop(btn,
        '<h4>Remove this photograph?</h4>' +
        '<p class="edit-pop__note">It comes off the invitation straight away. You can ' +
        'add it again later, but you will need the original file.</p>' +
        '<div class="edit-pop__confirm">' +
        '<button type="button" class="edit-pop__btn edit-pop__btn--danger" data-confirm-remove>' +
        'Remove</button>' +
        '<button type="button" class="edit-pop__btn" data-confirm-cancel>Keep it</button>' +
        '</div>');

      pop.querySelector('[data-confirm-remove]').addEventListener('click', () => {
        kit.closePop();
        removeGalleryItem(kind, idx);
      });
      pop.querySelector('[data-confirm-cancel]').addEventListener('click', () => kit.closePop());
    },

    // Take a whole card out of the invitation, or put it back. Only the flag
    // moves - the card's text stays in the config, so "remove" is reversible
    // and restoring returns the card exactly as the host left it.
    //
    // renderAll() rather than the one card's renderer: taking a card out
    // reflows the scenes around it, and the restore slot has to be drawn in
    // its place, which is the same pass.
    'card-remove': (btn) => {
      const key = btn.dataset.card;
      const branch = cfg[key];
      if (!branch || !PC.canEdit(key)) return;
      branch.enabled = false;
      PC.render.all();
      kit.saveNow();
      kit.toast('Card removed - you can add it back where it was.');
    },
    'card-restore': (btn) => {
      const key = btn.dataset.card;
      const branch = cfg[key];
      if (!branch || !PC.canEdit(key)) return;
      branch.enabled = true;
      PC.render.all();
      kit.saveNow();
    },

    // The gallery's two halves - the photo carousel and the keepsake notes -
    // come off and go back independently, the same way a card does. Only the
    // gallery is redrawn rather than the whole page: neither half moves
    // anything outside .gallery, so PC.render.all() would be a page rebuild to
    // change one section. The restore slot is drawn by the same pass (see
    // applyGalleryState in render.js).
    'gallery-section-remove': (btn) => {
      const kind = btn.dataset.kind;
      if (kind !== 'photos' && kind !== 'notes') return;
      if (!PC.canEdit('gallery.' + kind)) return;
      cfg.gallery[kind === 'photos' ? 'photosEnabled' : 'notesEnabled'] = false;
      PC.render.gallery();
      kit.saveNow();
      kit.toast('Section removed - you can add it back where it was.');
    },
    'gallery-section-restore': (btn) => {
      const kind = btn.dataset.kind;
      if (kind !== 'photos' && kind !== 'notes') return;
      if (!PC.canEdit('gallery.' + kind)) return;
      cfg.gallery[kind === 'photos' ? 'photosEnabled' : 'notesEnabled'] = true;
      PC.render.gallery();
      kit.saveNow();
    },

    // The Instagram button in the media row: off and back on, same as a card.
    // The saved link stays put while it is off, so restoring brings it back.
    'social-remove': () => {
      if (!PC.canEdit('social')) return;
      cfg.social.instagram = false;
      PC.render.social();
      kit.saveNow();
      kit.toast('Instagram removed - you can add it back where it was.');
    },
    'social-restore': () => {
      if (!PC.canEdit('social')) return;
      cfg.social.instagram = true;
      PC.render.social();
      kit.saveNow();
    },

    // Compliment card: add / remove a name line.
    // A ceremony of the host's own (see CUSTOM_CEREMONY_MAX in config.js). It
    // starts on the wedding date at the shared venue, unnamed and without a
    // photo - so hidden from guests until the host has given it both.
    'ceremony-add': () => {
      if (!PC.canEdit('ceremonies')) return;
      if (!Array.isArray(cfg.ceremonies)) cfg.ceremonies = [];
      const list = cfg.ceremonies;
      if (list.filter((c) => c.custom).length >= PC.CUSTOM_CEREMONY_MAX) {
        kit.toast('Up to ' + PC.CUSTOM_CEREMONY_MAX + ' ceremonies of your own');
        return;
      }
      list.push({
        // Its RSVP key for good, so deleting another added ceremony can never
        // move this one's replies.
        id: 'own-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        custom: true,
        name: '',
        art: '',
        date: cfg.eventISO || '',
        time: '',
        venue: (list[0] && list[0].venue) || '',
        mapUrl: '',
        enabled: true,
      });
      kit.saveNow();
      PC.render.ceremonies();

      // Sorted in by date, it may not land at the end - take the host to it.
      const nameEl = document.querySelector('[data-edit="ceremonies.' + (list.length - 1) + '.name"]');
      if (nameEl) {
        nameEl.closest('.ceremony').scrollIntoView({ behavior: 'smooth', block: 'center' });
        nameEl.focus({ preventScroll: true });
      }
      kit.toast('Added - give it a name, a date and a photo.');
    },

    // The added ceremony's picture - the "Change photo" button under the card;
    // a tap on the photo itself comes through the pointer handler above.
    'ceremony-photo': (btn) => {
      const c = (cfg.ceremonies || [])[+btn.dataset.index];
      if (c && c.custom) pickCeremonyPhoto(c);
    },

    // The zoom buttons under the card: the same steps a few wheel notches take.
    'ceremony-zoom': (btn) => {
      const box = document.querySelector('[data-cphoto="' + btn.dataset.index + '"]');
      if (box) zoomCeremony(box, +btn.dataset.dir > 0 ? 1.15 : 1 / 1.15);
    },

    // Deleting an added ceremony. Only these come out of the array - the
    // built-in six are switched off instead, and their place in the array is
    // their RSVP key. Added ones sit after all six, so taking one out never
    // moves a built-in. A photo is asked about first.
    'ceremony-remove': (btn) => {
      const list = cfg.ceremonies || [];
      const i = +btn.dataset.index;
      const c = list[i];
      if (!c || !c.custom || !PC.canEdit('ceremonies')) return;
      if (PC.ceremonyLive(c) && list.filter(PC.ceremonyLive).length <= 1) {
        kit.toast('Keep at least one ceremony - the schedule always appears.');
        return;
      }

      const drop = () => {
        list.splice(i, 1);
        kit.saveNow();
        PC.render.ceremonies();
      };
      if (!(c.art || '').trim()) { drop(); return; }

      const pop = kit.openPop(btn,
        '<h4>Delete this ceremony?</h4>' +
        '<p class="edit-pop__note">It comes off the invitation straight away, with its photo. ' +
        'You can add it again later, but you will need the photo again.</p>' +
        '<div class="edit-pop__confirm">' +
        '<button type="button" class="edit-pop__btn edit-pop__btn--danger" data-confirm-remove>Delete</button>' +
        '<button type="button" class="edit-pop__btn" data-confirm-cancel>Keep it</button>' +
        '</div>');
      pop.querySelector('[data-confirm-remove]').addEventListener('click', () => { kit.closePop(); drop(); });
      pop.querySelector('[data-confirm-cancel]').addEventListener('click', () => kit.closePop());
    },

    'compliment-line-add': () => {
      if (!PC.canEdit('compliments.lines')) return;
      if (!Array.isArray(cfg.compliments.lines)) cfg.compliments.lines = [];
      cfg.compliments.lines.push('');
      PC.render.compliments();
      kit.saveNow();
    },
    'compliment-line-remove': (btn) => {
      const idx = +btn.dataset.idx || 0;
      cfg.compliments.lines.splice(idx, 1);
      PC.render.compliments();
      kit.saveNow();
    },
  };

  document.addEventListener('click', (e) => {
    const btn = e.target.closest && e.target.closest('[data-action]');
    if (btn && actions[btn.dataset.action]) actions[btn.dataset.action](btn);
  });

  // ---- Drag to reposition a photo inside its frame -------------------------
  // Panning updates object-position (0–100%); scroll-wheel zooms. Both mutate
  // the stored photo object and autosave. Only the .is-adjustable views (edit,
  // filled cells) carry a data-idx, so this is inert elsewhere.
  let pan = null;
  document.addEventListener('pointerdown', (e) => {
    const view = e.target.closest && e.target.closest('.frame__photo-view.is-adjustable');
    if (!view) return;
    const idx = +view.dataset.idx;
    const o = photoAt(idx);
    if (!o.src) return;
    const rect = view.getBoundingClientRect();
    pan = { view, o, px: o.px, py: o.py, sx: e.clientX, sy: e.clientY, w: rect.width, h: rect.height, moved: false };
    if (view.setPointerCapture && e.pointerId != null) {
      try { view.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
    }
  });
  document.addEventListener('pointermove', (e) => {
    if (!pan) return;
    const dx = e.clientX - pan.sx;
    const dy = e.clientY - pan.sy;
    if (Math.abs(dx) + Math.abs(dy) > 3) pan.moved = true;
    // Drag the image: moving right reveals its left → object-position decreases.
    pan.o.px = clamp(pan.px - (dx / pan.w) * 100, 0, 100);
    pan.o.py = clamp(pan.py - (dy / pan.h) * 100, 0, 100);
    applyPhotoTransform(pan.view, pan.o);
  });
  function endPan() {
    if (!pan) return;
    const { view, moved } = pan;
    pan = null;
    if (moved) {
      kit.scheduleSave();
      return;
    }
    // No movement - a tap on the photo itself, not a drag. Opens the picker
    // to replace it, same as the small ↺ control in frame__adjust, so a host
    // isn't forced to hunt for that button when the photo itself is right
    // there and bigger. A real click event still follows pointerup on this
    // same element, but .frame__photo-view carries no [data-action] for the
    // delegated click listener to act on, so nothing double-fires.
    pickPhotoFor(+view.dataset.idx || 0);
  }
  document.addEventListener('pointerup', endPan);
  document.addEventListener('pointercancel', endPan);

  document.addEventListener('wheel', (e) => {
    const view = e.target.closest && e.target.closest('.frame__photo-view.is-adjustable');
    if (!view) return;
    e.preventDefault();
    const o = photoAt(+view.dataset.idx);
    if (!o.src) return;
    o.zoom = clamp(Math.round((o.zoom + (e.deltaY < 0 ? 0.12 : -0.12)) * 100) / 100, 1, 3);
    o.px = clamp(o.px, 0, 100);
    o.py = clamp(o.py, 0, 100);
    applyPhotoTransform(view, o);
    kit.scheduleSave();
  }, { passive: false });

  // ---- Mount the shared platform toolbar ---------------------------------
  // The bar, buy modal and edit ⇄ preview navigation are the platform's, not
  // this template's (see /templates/_platform/toolbar.js). We hand it only
  // what is ours: how to persist / reset / finalize this invitation's
  // config, and - in the host editor - how to carry the payload across the
  // edit ⇄ preview change.
  if (window.BalconyToolbar) {
    window.BalconyToolbar.mount({
      mode: PC.mode,
      trial: PC.trial,
      platform: !!PC.platform,
      published: PC.hasPublished,
      save: () => kit.flushSave(),
      reset: () => PC.reset(),
      finalize: () => { cfg.finalized = true; PC.save(); },
      platformHash: PC.platformHash || null,
      labels: PC.trial
        ? { editTrial: "Try editing - the couple's names are yours to change" }
        : { editHost: 'Editing your invitation', previewHost: 'Previewing your invitation' },
    });
  }
})();
