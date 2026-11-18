// The template editor. Active only with ?edit=1 (full editing UI) or ?preview=1.
// All edits mutate RoseInvite.config and autosave (via the shared editor kit's
// saveNow, which calls RI.save - localStorage standalone, the platform bridge,
// or the trial's server draft); structural changes (add/remove/reorder)
// re-render just the affected section via RoseInvite.render.* and rely on
// delegated event handlers, so nothing needs rebinding.
//
// The generic mechanics - autosave/toast/popover, [data-edit] contenteditable
// wiring, [data-edit-input] persistence, reorderable-list helpers, and the
// compress-then-upload photo picker - live in the shared
// /templates/_platform/editor-kit.js, loaded before this file. What's left
// here is genuinely rose-invitation's own: its data-action handlers, the
// ceremony on/off guard, and which render() to call after each edit.
//
// The toolbar, buy modal and edit ⇄ preview navigation are NOT here either -
// they are the platform's shared chrome (/templates/_platform/toolbar.js),
// mounted at the bottom of this file.
(function () {
  const RI = window.RoseInvite;
  const kit = window.BalconyEditorKit && window.BalconyEditorKit.init(RI);
  if (!kit) return;

  const cfg = RI.config;
  const esc = kit.esc;
  const { saveNow, toast, openPop, closePop, listMove, listRemove, pickPhoto } = kit;

  // ---- Ceremony schedule follows the wedding date ---------------------------
  // weddingDate IS the Vivaah ceremony's date - everything else in the
  // ceremony list is scheduled relative to it, in the order the rites
  // actually run (same offsets config.js's DEFAULTS use to seed a brand-new
  // invitation). A host who has removed a ceremony from the CATALOG id set
  // simply has no matching entry to update.
  const VIVAAH_OFFSETS = { ring: -2, mehendi: -1, haldi: -1, sangeet: -1, vivaah: 0, reception: 1 };

  // Pure calendar-component arithmetic (Date.UTC/getUTC*, no timezone
  // conversion) - `new Date(iso)` would read the bare string as UTC and land
  // a day early anywhere west of Greenwich.
  function addDaysISO(iso, days) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!m) return iso;
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    d.setUTCDate(d.getUTCDate() + days);
    return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
  }

  function syncCeremoniesToVivaah(weddingISO) {
    (cfg.ceremonies || []).forEach((c) => {
      const offset = VIVAAH_OFFSETS[c.id];
      if (offset !== undefined) c.date = addDaysISO(weddingISO, offset);
    });
  }

  // ---- Re-render whichever section a [data-edit-input] field belongs to -----
  // The kit persists the value and announces {path, value}; only rose knows
  // that "weddingDate" needs the date scene redrawn, and that clearing a
  // ceremony's time (an empty value on a ".time" path) needs the ceremony
  // deck redrawn so that card falls back to its "+ Add time" button.
  document.addEventListener('sutra:field-changed', (e) => {
    const { path, value } = e.detail;
    if (path === 'weddingDate') {
      RI.render.date();
      // The date just moved - carry the whole ceremony schedule with it
      // (Vivaah onto the new date, the rest re-spaced around it) rather than
      // leaving the two to drift apart until a host manually fixes each one.
      syncCeremoniesToVivaah(value);
      saveNow();
      RI.render.ceremonies();
    }
    if (/\.time$/.test(path) && value === '') RI.render.ceremonies();
    // A ceremony's own date changed - re-render so the RSVP preview (which
    // mirrors included ceremonies' dates) picks it up too, see render.ceremonies.
    if (/^ceremonies\.\d+\.date$/.test(path)) RI.render.ceremonies();
  });

  // ---- Auto-remove an emptied card -------------------------------------------
  // The compliments and notes cards can't sit on the invitation with no text.
  // When a host blurs one of their editable fields and the WHOLE card is now
  // blank, remove the card automatically (it can be restored anytime). We hook
  // focusout (which bubbles) because contenteditable [data-edit] fields don't
  // emit sutra:field-changed; the kit's input handler has already written the
  // value into cfg by the time focus leaves the field.
  document.addEventListener('focusout', (e) => {
    const el = e.target.closest ? e.target.closest('[data-edit]') : null;
    if (!el) return;
    const path = el.dataset.edit || '';

    if (path.indexOf('compliments.') === 0) {
      const c = cfg.compliments;
      const hasText = (c.lead || '').trim() || (c.lines || []).some((l) => (l || '').trim());
      if (c.enabled && !hasText) {
        c.enabled = false;
        saveNow();
        RI.render.compliments();
        toast('Empty compliments card removed - restore it anytime.');
      }
    } else if (path.indexOf('notes.') === 0) {
      const n = cfg.notes;
      const hasText = (n.lead || '').trim() || (n.text || '').trim();
      if (n.enabled && !hasText) {
        n.enabled = false;
        saveNow();
        RI.render.notes();
        toast('Empty note card removed - restore it anytime.');
      }
    } else if (/^ceremonies\.\d+\.name$/.test(path)) {
      // ---- Renamed ceremony -------------------------------------------------
      // The name is shown in four places (the deck card being edited, the RSVP
      // date cards, the calendar popup and the platform RSVP event list), and
      // only the first of them is this element. Re-render the section on blur
      // so the other three catch up - the same thing a ceremony DATE edit does,
      // and for the same reason. On blur rather than per keystroke: redrawing
      // the deck under a caret would take the field out from under the host.
      saveNow();
      RI.render.ceremonies();
    } else {
      // ---- Shared venue across ceremonies -----------------------------------
      // The FIRST ceremony's venue (Ring) is the shared default for the whole
      // event - editing it fills every OTHER ceremony that hasn't been
      // individually overridden, so a host only has to type the address once
      // and then override just the ceremonies that are actually somewhere
      // else. Editing any other ceremony's venue marks THAT one overridden
      // instead of cascading from it - otherwise fixing Reception's address
      // would blast that same address onto every ceremony still following
      // the default.
      const vm = /^ceremonies\.(\d+)\.venue$/.exec(path);
      if (vm) {
        const i = +vm[1];
        const list = cfg.ceremonies || [];
        const c = list[i];
        if (c) {
          if (i === 0) {
            list.forEach((other, j) => {
              if (j !== 0 && !other.venueCustom) other.venue = c.venue;
            });
          } else {
            c.venueCustom = true;
          }
          saveNow();
          RI.render.ceremonies();
        }
      }
    }
  });

  // ---- Framing an added ceremony's photo -----------------------------------
  // The picture area is the only control it has. Four gestures share it, told
  // apart by what the pointer does rather than by separate widgets:
  //
  //   tap            choose a photo, or swap the one that is there
  //   drag           move the picture inside its corner of the card
  //   wheel / pinch  zoom in and out
  //
  // Everything is written onto the <img> directly rather than by re-rendering:
  // a re-render mid-gesture would rebuild the element under the pointer and
  // drop the very gesture that caused it.
  const CEREMONY_ZOOM_MAX = 3;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const clampCeremonyZoom = (z) => clamp(z, RI.CEREMONY_ZOOM_MIN, CEREMONY_ZOOM_MAX);

  function ceremonyAt(box) {
    const c = box && (cfg.ceremonies || [])[+box.dataset.cphoto];
    return c && c.custom ? c : null;
  }

  const ceremonyImg = (box) => box.querySelector('.cere-card__photo-img');

  // The framing itself lives in render.js, so a picture is laid out the same
  // way for a guest as it is mid-drag here. This only hands it the numbers.
  function applyCeremonyFrame(box, c) {
    const el = ceremonyImg(box);
    if (!el) return;
    el.dataset.zoom = clampCeremonyZoom(+c.zoom || 1);
    el.dataset.posX = Number.isFinite(+c.posX) ? +c.posX : 50;
    el.dataset.posY = Number.isFinite(+c.posY) ? +c.posY : 50;
    RI.framePhoto(el);
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
  // parts, so the card's own paper shows through them, as it does round the
  // built-in artwork.
  function pickCeremonyPhoto(c) {
    if (!RI.canEdit('ceremonies')) return;
    let fresh = true;   // only on the first call: a zoom made before the
                        // upload lands belongs to this same picture
    pickPhoto((url) => {
      if (fresh) { delete c.zoom; delete c.posX; delete c.posY; fresh = false; }
      c.art = url;
      saveNow();
      RI.render.ceremonies();
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
      // dividing by how much bigger than its box the picture is, so it keeps
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
      if (moved) saveNow();
      else pickCeremonyPhoto(c);
    };

    box.addEventListener('pointermove', move);
    box.addEventListener('pointerup', up);
    box.addEventListener('pointercancel', up);
  });

  // ---- Ceremony on/off toggle -------------------------------------------------
  // Not in the shared kit: "keep at least one ceremony enabled" is a rule
  // specific to this template's concept of ceremonies, not a generic
  // [data-edit-toggle] behavior.
  document.addEventListener('change', (e) => {
    const input = e.target;
    if (!(input.matches && input.matches('[data-edit-toggle]'))) return;
    const path = input.dataset.editToggle;
    if (!input.checked && cfg.ceremonies.filter(RI.ceremonyLive).length <= 1) {
      input.checked = true;
      toast('Keep at least one ceremony - this section always appears');
      return;
    }
    kit.setVal(path, input.checked);
    saveNow();
    RI.render.ceremonies();
  });

  // ---- Delegated click actions -----------------------------------------------
  // These are rose-invitation's OWN editing actions. The toolbar's actions
  // (preview, back-to-edit, buy, finalize, reset, …) live in the shared
  // toolbar.js, which runs its own delegated listener - each ignores the
  // other's data-actions, so the two coexist without double-handling.
  const actions = {
    // Sections on/off
    'section-remove': (btn) => {
      const s = btn.dataset.section;
      if (s === 'gallery') cfg.gallery.enabled = false;
      if (s === 'compliments') cfg.compliments.enabled = false;
      if (s === 'notes') cfg.notes.enabled = false;
      if (s === 'instagram') cfg.social.instagram = false;
      saveNow();
      renderSection(s);
    },
    'section-restore': (btn) => {
      const s = btn.dataset.section;
      if (s === 'gallery') {
        cfg.gallery.enabled = true;
        if (!cfg.gallery.items.length) cfg.gallery.items.push({ type: 'photo', image: '', caption: '' });
      }
      if (s === 'compliments') cfg.compliments.enabled = true;
      if (s === 'notes') cfg.notes.enabled = true;
      if (s === 'instagram') cfg.social.instagram = true;
      saveNow();
      renderSection(s);
    },

    // Family cards
    'parent-card-remove': (btn) => {
      cfg.parents.cards[+btn.dataset.index].enabled = false;
      saveNow();
      RI.render.details();
    },
    'parent-card-add': (btn) => {
      cfg.parents.cards[+btn.dataset.index].enabled = true;
      saveNow();
      RI.render.details();
    },

    // Gallery cards
    'gallery-add': (btn) => {
      if (cfg.gallery.items.length >= 10) return;
      const type = btn.dataset.type;
      cfg.gallery.items.push(type === 'story'
        ? { type: 'story', text: '' }
        : { type: type, image: '', caption: '' });
      saveNow();
      RI.render.gallery();
    },
    'gallery-remove': (btn) => {
      // Keep at least one card while the section is present - removing the last
      // one isn't "empty gallery", it's "remove the whole section" (the ✕ Remove
      // gallery chip does that). Nudge the host toward the right control.
      if (cfg.gallery.items.length <= 1) {
        toast('Keep at least one card here - or use “✕ Remove gallery” to take the whole section out.');
        return;
      }
      listRemove('gallery.items', +btn.dataset.index);
      saveNow();
      RI.render.gallery();
    },
    'gallery-move': (btn) => {
      listMove('gallery.items', +btn.dataset.index, +btn.dataset.dir);
      saveNow();
      RI.render.gallery();
    },
    'gallery-photo': (btn) => pickPhotoFor(+btn.dataset.index),
    'gallery-scroll': (btn) => {
      const scroller = document.getElementById('galleryScroll');
      if (scroller) {
        scroller.scrollBy({ left: (+btn.dataset.dir) * scroller.clientWidth * 0.6, behavior: 'smooth' });
      }
    },

    // Ceremony time (optional)
    'ceremony-time-remove': (btn) => {
      cfg.ceremonies[+btn.dataset.index].time = '';
      saveNow();
      RI.render.ceremonies();
    },
    'ceremony-time-add': (btn) => {
      const i = +btn.dataset.index;
      cfg.ceremonies[i].time = '12:00';
      saveNow();
      RI.render.ceremonies();
      const input = document.querySelector('[data-edit-input="ceremonies.' + i + '.time"]');
      if (input) { input.focus(); if (input.showPicker) try { input.showPicker(); } catch (_) { /* ignore */ } }
    },

    // A ceremony of the host's own (see CUSTOM_CEREMONY_MAX in config.js). It
    // starts on the wedding date at the shared venue, unnamed and without a
    // photo - so hidden from guests until the host has given it both.
    'ceremony-add': () => {
      if (!RI.canEdit('ceremonies')) return;
      if (!Array.isArray(cfg.ceremonies)) cfg.ceremonies = [];
      const list = cfg.ceremonies;
      if (list.filter((c) => c.custom).length >= RI.CUSTOM_CEREMONY_MAX) {
        toast('Up to ' + RI.CUSTOM_CEREMONY_MAX + ' ceremonies of your own');
        return;
      }
      list.push({
        // Its RSVP key for good, as a catalog ceremony's id is - and never one
        // of the catalog's.
        id: 'own-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        custom: true,
        name: '',
        art: '',
        date: cfg.weddingDate || '',
        time: '',
        venue: (list[0] && list[0].venue) || '',
        mapUrl: '',
        enabled: true,
      });
      saveNow();
      RI.render.ceremonies();

      // Sorted in by date, it may not land at the end - take the host to it.
      const nameEl = document.querySelector('[data-edit="ceremonies.' + (list.length - 1) + '.name"]');
      if (nameEl) {
        nameEl.closest('.cere-edit').scrollIntoView({ behavior: 'smooth', block: 'center' });
        nameEl.focus({ preventScroll: true });
      }
      toast('Added - give it a name, a date and a photo.');
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
    // catalog ones are switched off instead. Every ceremony is keyed by its own
    // id, so taking one out moves nobody else's replies. A photo is asked
    // about first.
    'ceremony-remove': (btn) => {
      const list = cfg.ceremonies || [];
      const i = +btn.dataset.index;
      const c = list[i];
      if (!c || !c.custom || !RI.canEdit('ceremonies')) return;
      if (RI.ceremonyLive(c) && list.filter(RI.ceremonyLive).length <= 1) {
        toast('Keep at least one ceremony - the schedule always appears.');
        return;
      }

      const drop = () => {
        list.splice(i, 1);
        saveNow();
        RI.render.ceremonies();
      };
      if (!(c.art || '').trim()) { drop(); return; }

      const pop = openPop(btn,
        '<h4>Delete this ceremony?</h4>' +
        '<p class="edit-pop__note">It comes off the invitation straight away, with its photo. ' +
        'You can add it again later, but you will need the photo again.</p>' +
        '<div class="edit-pop__confirm">' +
        '<button type="button" class="edit-pop__btn edit-pop__btn--danger" data-confirm-remove>Delete</button>' +
        '<button type="button" class="edit-pop__btn" data-confirm-cancel>Keep it</button>' +
        '</div>');
      pop.querySelector('[data-confirm-remove]').addEventListener('click', () => { closePop(); drop(); });
      pop.querySelector('[data-confirm-cancel]').addEventListener('click', () => closePop());
    },

    // Compliment lines
    'compliment-line-add': () => {
      cfg.compliments.lines.push('');
      saveNow();
      RI.render.compliments();
      const spans = document.querySelectorAll('.compliment__line [data-edit]');
      if (spans.length) spans[spans.length - 1].focus();
    },
    'compliment-line-remove': (btn) => {
      listRemove('compliments.lines', +btn.dataset.index);
      saveNow();
      RI.render.compliments();
    },

    // Opening invocation - pick the tradition and (for Hindu) the regional
    // script; the popover's <select>s are wired in wireInvocationPop().
    'invocation-pick': (btn) => {
      const pop = openPop(btn, invocationPopHtml());
      wireInvocationPop(pop);
    },

    // Export / Import of the raw config JSON were removed: the host's edits are
    // owned by the platform (autosaved to the event draft over the bridge), so
    // a local JSON round-trip had no meaning here and only confused people.

    // Instagram URL popover (save) - igPop is set just below, where it's opened.
    'ig-save': () => {
      const input = igPop && igPop.querySelector('input');
      if (input) {
        cfg.social.instagramUrl = input.value.trim() || 'https://www.instagram.com/';
        saveNow();
      }
      closePop();
    },
  };

  // Set when the Instagram URL popover opens (see the click handler below);
  // 'ig-save' reads the input back out of it.
  let igPop = null;

  function renderSection(s) {
    if (s === 'gallery') RI.render.gallery();
    if (s === 'compliments') RI.render.compliments();
    if (s === 'notes') RI.render.notes();
    if (s === 'instagram') RI.render.social();
  }

  // ---- Opening-invocation picker ---------------------------------------------
  // Custom (non-native) dropdowns so the option list can be fully styled and the
  // native scripts render in their own fonts. Two dropdowns: Tradition, and -
  // for traditions with a native script - Script (its script(s) shown as the
  // phrase itself, plus English). A live preview shows the single card line.

  // Max length for a host's own invocation line (it renders large, so keep it
  // short enough not to overflow the opening card).
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

  // Symbol dropdown - each option shows the artwork + label; the trigger shows
  // the current pick. Its own thumbnail helper handles the "No symbol" case.
  function symThumb(s) {
    return s.src
      ? '<img class="inv-dd__sym" src="' + esc(s.src) + '" alt="" />'
      : '<span class="inv-dd__sym inv-dd__sym--none">-</span>';
  }

  function symbolBlock() {
    const cur = RI.symbolById(cfg.invocation.symbol);
    const options = RI.SYMBOLS.map((s) => (
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

  // Opening-invocation dropdown - ONE grouped list (no separate Script dropdown):
  // under each tradition heading, the invocation line in English AND in its
  // native script(s). Picking an option sets both the tradition and the script.
  function invocationBlock() {
    const inv = cfg.invocation;
    const rels = RI.INVOCATIONS;
    const cur = RI.invocationLines(inv); // the currently resolved line

    let menu = '';
    Object.keys(rels).forEach((relKey) => {
      const rel = rels[relKey];
      // Heading that visibly divides one tradition's options from the next.
      menu += '<div class="inv-dd__group">' + esc(rel.label) + '</div>';
      // English transliteration.
      const engOn = inv.religion === relKey && cur.isEnglish;
      menu += ddOption('inv', relKey + ':english', rel.english, engOn, '', false);
      // Native-script line(s).
      Object.keys(rel.scripts).forEach((sk) => {
        const s = rel.scripts[sk];
        const on = inv.religion === relKey && !cur.isEnglish && cur.script === sk;
        menu += ddOption('inv', relKey + ':' + sk, s.text, on, "'" + s.font + "'", !!s.rtl);
      });
    });

    // Custom free-text line, and a "no line" choice.
    menu += '<div class="inv-dd__group">Other</div>';
    menu += ddOption('inv', 'custom', '✎ Write your own…', cur.isCustom, '', false);
    menu += ddOption('inv', 'blank', 'No invocation line', cur.isBlank, '', false);

    // The trigger + font reflect the special states.
    const triggerText = cur.isCustom ? (cur.text || 'Write your own…')
      : cur.isBlank ? 'No invocation line'
      : cur.text;
    const curFont = (cur.isEnglish || cur.isCustom || cur.isBlank || !cur.font) ? '' : "'" + cur.font + "'";
    const block = ddBlock('inv', 'Invocation', triggerText, curFont, cur.isBlank ? false : cur.rtl, menu);

    // Text input, shown only while "Write your own…" is the current choice.
    const customInput = cur.isCustom
      ? '<input type="text" class="inv-custom" maxlength="' + INVOCATION_MAX + '" value="' + esc(inv.custom || '') + '" placeholder="Write your invocation line…" />' +
        '<div class="inv-custom__count">' + (inv.custom || '').length + ' / ' + INVOCATION_MAX + '</div>'
      : '';

    return block + customInput;
  }

  function invocationPopHtml() {
    const line = RI.invocationLines(cfg.invocation);
    const sym = RI.symbolById(cfg.invocation.symbol);

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

  // Wires the popover's custom dropdowns via ONE delegated listener (attached
  // once - the pop element survives innerHTML rebuilds, so re-adding would stack
  // handlers). Toggles open/close, applies a selection, and rebuilds the markup.
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
            // Special single-token value: 'custom' or 'blank'. Keep the religion,
            // just switch the script.
            cfg.invocation.script = parts[0];
          } else {
            // "religion:script" (script = 'english' or a native key).
            cfg.invocation.religion = parts[0];
            cfg.invocation.script = parts[1];
          }
        }
        saveNow();
        RI.render.invocation();
        pop.innerHTML = invocationPopHtml();
        // Focus the custom field right away when the host chose "Write your own".
        const ci = pop.querySelector('.inv-custom');
        if (ci) ci.focus();
        return;
      }

      // A click anywhere else in the popover closes any open menu.
      pop.querySelectorAll('.inv-dd.is-open').forEach((d) => d.classList.remove('is-open'));
    });

    // Live custom line: update config + card on each keystroke, then rebuild the
    // pop (preview/trigger) while restoring the input's focus + caret.
    pop.addEventListener('input', (e) => {
      const inp = e.target.closest('.inv-custom');
      if (!inp) return;
      // Enforce the cap even on paste (maxlength misses programmatic input).
      if (inp.value.length > INVOCATION_MAX) inp.value = inp.value.slice(0, INVOCATION_MAX);
      cfg.invocation.custom = inp.value;
      saveNow();
      RI.render.invocation();
      const caret = inp.selectionStart;
      pop.innerHTML = invocationPopHtml();
      const next = pop.querySelector('.inv-custom');
      if (next) { next.focus(); try { next.setSelectionRange(caret, caret); } catch (_) { /* ignore */ } }
    });
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest ? e.target.closest('[data-action]') : null;
    if (btn && actions[btn.dataset.action]) {
      actions[btn.dataset.action](btn);
      return;
    }
    // Instagram button in edit mode → URL popover instead of the guest modal
    if (RI.mode === 'edit') {
      const ig = e.target.closest ? e.target.closest('#igBtn') : null;
      if (ig && cfg.social.instagram) {
        igPop = openPop(ig,
          '<h4>Instagram page link</h4>' +
          '<input type="url" placeholder="https://www.instagram.com/yourpage" value="' + esc(cfg.social.instagramUrl) + '" />' +
          '<div class="edit-pop__actions"><button class="edit-btn edit-btn--primary" type="button" data-action="ig-save">Save</button></div>');
        igPop.querySelector('input').focus();
      }
    }
  });

  // ---- Gallery: plain drag-to-scroll while editing ----------------------------
  // (The swing/pendulum physics in gallery.js stay exclusive to the final view;
  // here the couple just browses left/right to see where cards sit.)
  if (RI.mode === 'edit') {
    const scroller = document.getElementById('galleryScroll');
    if (scroller) {
      let down = false;
      let dragged = false;
      let startX = 0;
      let startScroll = 0;

      scroller.addEventListener('pointerdown', (e) => {
        if (e.pointerType !== 'mouse' || e.button !== 0) return; // touch scrolls natively
        // Don't hijack controls, text, or a photo being dragged within its frame.
        if (e.target.closest('button, input, [data-edit], .polaroid__photo.is-adjustable')) return;
        down = true;
        dragged = false;
        startX = e.clientX;
        startScroll = scroller.scrollLeft;
      });

      window.addEventListener('pointermove', (e) => {
        if (!down) return;
        const dx = e.clientX - startX;
        if (!dragged && Math.abs(dx) > 4) {
          dragged = true;
          scroller.classList.add('is-dragging');
        }
        if (dragged) scroller.scrollLeft = startScroll - dx;
      });

      const endDrag = () => {
        down = false;
        scroller.classList.remove('is-dragging');
      };
      window.addEventListener('pointerup', endDrag);
      window.addEventListener('pointercancel', endDrag);
    }
  }

  // ---- Framing a gallery photo -------------------------------------------------
  // The picture area is the only control its frame has. Four gestures share it,
  // and they are told apart by what the pointer does rather than by separate
  // widgets - the same arrangement the other templates use:
  //
  //   tap            choose a photo, or swap the one that is there
  //   drag           move the picture inside its frame
  //   wheel / pinch  zoom in and out
  //
  // Everything lands on the item's px/py/zoom, which RI.photoStyle turns into
  // the same inline style render.js writes - so the live view, the saved config
  // and what guests see can never disagree.

  // A new picture starts centred and unzoomed: the old framing was chosen for
  // a different image and almost never suits this one.
  function pickPhotoFor(i) {
    const item = cfg.gallery.items[i];
    if (!item) return;
    pickPhoto((url) => {
      item.image = url;
      delete item.px;
      delete item.py;
      delete item.zoom;
      RI.render.gallery();
    });
  }

  function setFraming(i, next) {
    const item = cfg.gallery.items[i];
    if (!item) return;
    const f = RI.photoFrame(Object.assign({}, item, next));
    item.px = Math.round(f.px * 10) / 10;
    item.py = Math.round(f.py * 10) / 10;
    item.zoom = Math.round(f.zoom * 100) / 100;
    const img = document.querySelector('.polaroid__photo.is-adjustable[data-index="' + i + '"] .polaroid__img');
    if (img) img.style.cssText = RI.photoStyle(item);
  }

  if (RI.mode === 'edit') {
    // Pointers currently down on the photo being adjusted, by pointerId. One
    // pointer pans; a second turns the gesture into a pinch.
    let gesture = null;

    const spread = (pts) => Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);

    document.addEventListener('pointerdown', (e) => {
      const view = e.target.closest && e.target.closest('.polaroid__photo.is-adjustable');
      if (!view) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      const i = +view.dataset.index;
      if (gesture && gesture.i !== i) return;
      if (!gesture) {
        const rect = view.getBoundingClientRect();
        // How far the picture overhangs the frame at zoom 1 on each axis, as
        // object-fit:cover lays it out: 1 on the axis it fits exactly, more on
        // the one it crops. Unknown until the image has loaded - 1 then.
        const img = view.querySelector('.polaroid__img');
        let cx = 1, cy = 1;
        if (img && img.naturalWidth && img.naturalHeight && rect.width && rect.height) {
          const cover = Math.max(rect.width / img.naturalWidth, rect.height / img.naturalHeight);
          cx = img.naturalWidth * cover / rect.width;
          cy = img.naturalHeight * cover / rect.height;
        }
        // downX/downY and moved are what separate a tap from a drag: a press
        // that never travels is a tap, whatever else it touched on the way.
        gesture = { i, view, w: rect.width, h: rect.height, cx, cy, pts: new Map(),
                    moved: false, downX: e.clientX, downY: e.clientY };
      }
      gesture.pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      try { view.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
      e.preventDefault();
      startStroke();
    });

    // (Re)anchor the gesture on the current pointers - called whenever a finger
    // lands or lifts, so going from pinch back to pan never jumps.
    function startStroke() {
      const f = RI.photoFrame(cfg.gallery.items[gesture.i]);
      const pts = Array.from(gesture.pts.values());
      gesture.start = { px: f.px, py: f.py, zoom: f.zoom, x: pts[0].x, y: pts[0].y };
      gesture.startSpread = pts.length > 1 ? spread(pts) : 0;
    }

    document.addEventListener('pointermove', (e) => {
      if (!gesture || !gesture.pts.has(e.pointerId)) return;
      gesture.pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const pts = Array.from(gesture.pts.values());
      const s = gesture.start;
      // A second finger is never a tap, and nor is 3px of travel.
      if (pts.length > 1 || Math.abs(e.clientX - gesture.downX) > 3 ||
          Math.abs(e.clientY - gesture.downY) > 3) gesture.moved = true;

      if (pts.length > 1 && gesture.startSpread) {
        setFraming(gesture.i, { zoom: s.zoom * (spread(pts) / gesture.startSpread) });
        return;
      }
      // Dragging the picture right shows more of its left side, so position
      // moves against the pointer. With object-position and transform-origin
      // both at px/py, the picture shifts (c * zoom - 1) frame-widths across
      // px's whole 0-100 range - dividing by that keeps it under the finger
      // at any zoom. An axis with no overhang has nothing to reveal.
      const rx = gesture.cx * s.zoom - 1;
      const ry = gesture.cy * s.zoom - 1;
      const next = {};
      if (rx > 0.001) next.px = s.px - (pts[0].x - s.x) / gesture.w / rx * 100;
      if (ry > 0.001) next.py = s.py - (pts[0].y - s.y) / gesture.h / ry * 100;
      setFraming(gesture.i, next);
    });

    function endPointer(e) {
      if (!gesture || !gesture.pts.has(e.pointerId)) return;
      gesture.pts.delete(e.pointerId);
      if (gesture.pts.size) { startStroke(); return; }
      const { i, moved } = gesture;
      gesture = null;
      // Handled here rather than with a click listener because the pointer is
      // captured: the browser retargets the click, so a handler on the frame
      // would never see it.
      if (moved) kit.scheduleSave();
      else pickPhotoFor(i);
    }
    document.addEventListener('pointerup', endPointer);
    document.addEventListener('pointercancel', endPointer);

    // A plain scroll over the picture zooms it. A trackpad pinch arrives as a
    // ctrlKey wheel in Chrome, Edge, Firefox and Safari alike and lands here
    // too. preventDefault matters twice over: it stops the page scrolling out
    // from under the gesture, and stops the ctrl variant zooming the whole
    // page. An empty frame has nothing to zoom, so the wheel is left alone
    // there and the page scrolls as usual.
    document.addEventListener('wheel', (e) => {
      const view = e.target.closest && e.target.closest('.polaroid__photo.is-adjustable');
      if (!view) return;
      const i = +view.dataset.index;
      const item = cfg.gallery.items[i];
      if (!item || !item.image) return;
      e.preventDefault();
      // The two are metered differently on purpose. A pinch sends a stream of
      // small deltas and should track the fingers, so it stays proportional.
      // A wheel notch is a single delta whose size varies wildly between mice
      // and engines - proportional, it crossed the whole zoom range in half a
      // dozen notches - so it steps by a fixed amount instead, the same one
      // the other templates use.
      const zoom = RI.photoFrame(item).zoom;
      if (e.ctrlKey) {
        const d = Math.max(-40, Math.min(40, e.deltaY * (e.deltaMode === 1 ? 16 : 1)));
        setFraming(i, { zoom: zoom * Math.exp(-d * 0.005) });
      } else {
        setFraming(i, { zoom: zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08) });
      }
      kit.scheduleSave();
    }, { passive: false });
  }

  // ---- Mount the shared platform toolbar -------------------------------------
  // The bar, buy modal and edit ⇄ preview navigation are the platform's, not
  // rose-invitation's (see /templates/_platform/toolbar.js). We hand it only
  // what is genuinely ours: how to persist, reset and finalize THIS template's
  // config, and - in the host editor - how to carry the event payload across
  // the edit ⇄ preview page change (RI.platformHash, set by platform-adapter.js).
  if (window.BalconyToolbar) {
    window.BalconyToolbar.mount({
      mode: RI.mode,
      trial: RI.trial,
      platform: !!RI.platform,
      // false → first-time go-live ("Make it Live"); true → re-push ("Push to
      // live"); undefined (standalone/dev) keeps the default label.
      published: RI.hasPublished,
      // Flush any debounced autosave, then persist, before the toolbar navigates.
      save: () => kit.flushSave(),
      reset: () => RI.reset(),
      finalize: () => { cfg.finalized = true; RI.save(); },
      platformHash: RI.platformHash || null,
      // rose's trial unlocks the couple's names first, so keep that specific
      // invitation over the toolbar's generic "make it yours".
      labels: RI.trial ? { editTrial: 'Try editing - the names are yours to change' } : null,
    });
  }
})();
