// The Crimson Monogram - in-place editor. Click a line and type; click a picture to replace it.
(function () {
  const CM = window.CrimsonMonogram;
  if (!CM || CM.mode !== 'edit') return;

  function setPath(path, val) {
    const parts = path.split('.');
    let target = CM.config;
    for (let i = 0; i < parts.length - 1; i++) {
      if (target[parts[i]] === undefined || target[parts[i]] === null) return;
      target = target[parts[i]];
    }
    target[parts[parts.length - 1]] = val;
  }

  // Make every line the renderer marked editable typeable in place. Runs again after every redraw.
  function arm() {
    document.querySelectorAll('[data-edit-field]').forEach(function (el) {
      if (el.getAttribute('contenteditable') === 'plaintext-only') return;
      el.setAttribute('contenteditable', 'plaintext-only');
      el.spellcheck = false;
    });
  }

  const render = CM.render;
  CM.render = function () {
    render.apply(CM, arguments);
    arm();
  };
  CM.reRender = CM.render;

  let timer = null;
  document.addEventListener('input', function (e) {
    const el = e.target.closest && e.target.closest('[data-edit-field]');
    if (!el) return;
    // The icon in front of a date, time or venue is drawn by the template, not part of what is typed.
    setPath(el.getAttribute('data-edit-field'), el.textContent.replace(/^\s*(📅|⏰|📍)\s*/, '').trim());
    CM.syncDerived();
    // The same line shown in more than one place (the names on the cover, the header and the foot)
    // follows along as it is typed, and so does the monogram made from the two initials.
    document.querySelectorAll('[data-edit-field="' + el.getAttribute('data-edit-field') + '"]').forEach(function (o) {
      if (o !== el) o.textContent = el.textContent;
    });
    document.querySelectorAll('.monogram-text, .hero-monogram').forEach(function (o) { o.textContent = CM.config.monogram; });
    clearTimeout(timer);
    timer = setTimeout(function () { if (typeof CM.save === 'function') CM.save(); }, 450);
  });

  // Enter ends the line instead of adding a break.
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.closest && e.target.closest('[data-edit-field]') && !e.target.closest('.story-body, .story-quote')) {
      e.preventDefault();
      e.target.blur();
    }
  });

  // ---- Events: add one, remove one, set its map link -------------------------------------------
  // A host keeps only the events they are holding. A new one starts with placeholder words to type over.
  var mapTimer = null;
  function redraw() { if (typeof CM.reRender === 'function') CM.reRender(); }
  function saveNow() { if (typeof CM.save === 'function') CM.save(); }

  document.addEventListener('click', function (e) {
    var list = CM.config.ceremonies;
    if (!Array.isArray(list) || !e.target.closest) return;
    var rm = e.target.closest('[data-ev-remove]');
    if (rm) {
      e.preventDefault();
      e.stopPropagation();
      if (list.length <= 1) return;
      list.splice(+rm.getAttribute('data-ev-remove'), 1);
      saveNow();
      redraw();
      return;
    }
    if (e.target.closest('[data-ev-add]')) {
      e.preventDefault();
      e.stopPropagation();
      var first = list[0] || {};
      list.push({ id: 'own-' + Date.now().toString(36), name: 'New event', date: 'Date', time: 'Time', venue: first.venue || 'Venue', mapUrl: '', image: first.image || '' });
      saveNow();
      redraw();
      var names = document.querySelectorAll('.ceremony-name[data-edit-field]');
      var last = names[names.length - 1];
      if (last) { last.scrollIntoView({ block: 'center', behavior: 'smooth' }); last.focus({ preventScroll: true }); }
    }
  }, true);

  document.addEventListener('input', function (e) {
    var el = e.target;
    if (!el || !el.hasAttribute || !el.hasAttribute('data-ev-map')) return;
    var item = (CM.config.ceremonies || [])[+el.getAttribute('data-ev-map')];
    if (!item) return;
    item.mapUrl = el.value.trim();
    clearTimeout(mapTimer);
    mapTimer = setTimeout(saveNow, 500);
  });
  // The link on the card appears, or goes, once the host has finished typing it.
  document.addEventListener('change', function (e) {
    if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-ev-map')) redraw();
  });

  window.addEventListener('load', function () {
    arm();
    if (window.BalconyToolbar && typeof window.BalconyToolbar.mount === 'function') window.BalconyToolbar.mount(CM);
  });
})();
