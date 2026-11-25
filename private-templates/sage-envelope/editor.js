// The Sage Envelope - Studio Editor
(function () {
  const SE = window.SageEnvelope;
  if (!SE || SE.mode !== 'edit') return;

  function setPath(obj, path, val) {
    const parts = path.replace(/\]/g, '').split(/[.\[]/);
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      cur = cur[parts[i]];
      if (!cur) return;
    }
    cur[parts[parts.length - 1]] = val;
  }

  document.body.addEventListener('input', function (e) {
    const el = e.target.closest('[data-edit]');
    if (!el) return;
    const path = el.dataset.edit;
    const val = el.textContent.trim();
    // The same line shown in more than one place (cover and page) follows along as it is typed.
    document.querySelectorAll('[data-edit="' + path.replace(/"/g, '') + '"]').forEach(function (o) {
      if (o !== el) o.textContent = el.textContent;
    });
    setPath(SE.config, path, val);
    if (typeof SE.save === 'function') SE.save();
  });

  // ---- Events: add one, remove one, set its map link -------------------------------------------
  // A host keeps only the events they are holding. A new one starts with placeholder words to type over.
  var mapTimer = null;
  function redraw() { if (typeof SE.reRender === 'function') SE.reRender(); }
  function saveNow() { if (typeof SE.save === 'function') SE.save(); }

  document.addEventListener('click', function (e) {
    var list = SE.config.ceremonies;
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
      list.push({ id: 'own-' + Date.now().toString(36), name: 'New event', date: 'Date', time: 'Time', venue: first.venue || 'Venue', mapUrl: '' });
      saveNow();
      redraw();
      var names = document.querySelectorAll('.sage-ceremony-card h3[data-edit]');
      var last = names[names.length - 1];
      if (last) { last.scrollIntoView({ block: 'center', behavior: 'smooth' }); last.focus({ preventScroll: true }); }
    }
  }, true);

  document.addEventListener('input', function (e) {
    var el = e.target;
    if (!el || !el.hasAttribute || !el.hasAttribute('data-ev-map')) return;
    var item = (SE.config.ceremonies || [])[+el.getAttribute('data-ev-map')];
    if (!item) return;
    item.mapUrl = el.value.trim();
    clearTimeout(mapTimer);
    mapTimer = setTimeout(saveNow, 500);
  });
  // The link on the card appears, or goes, once the host has finished typing it.
  document.addEventListener('change', function (e) {
    if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-ev-map')) redraw();
  });

  if (window.BalconyToolbar && typeof window.BalconyToolbar.mount === 'function') {
    window.BalconyToolbar.mount(SE);
  }
})();
