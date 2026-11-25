// Destination Resort - Studio in-place editor
(function () {
  const DR = window.DestinationResort;
  if (!DR || DR.mode !== 'edit') return;

  function setPath(obj, path, val) {
    const parts = path.replace(/\]/g, '').split(/[.\[]/);
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      cur = cur[parts[i]];
      if (!cur) return;
    }
    cur[parts[parts.length - 1]] = val;
  }

  // Delegated live text input handler
  document.body.addEventListener('input', function (e) {
    const el = e.target.closest('[data-edit]');
    if (!el) return;
    const path = el.dataset.edit;
    const val = el.textContent.trim();
    // The same line shown in more than one place (cover and page) follows along as it is typed.
    document.querySelectorAll('[data-edit="' + path.replace(/"/g, '') + '"]').forEach(function (o) {
      if (o !== el) o.textContent = el.textContent;
    });
    setPath(DR.config, path, val);
    if (typeof DR.save === 'function') DR.save();
  });

  // Delegated image change handler
  document.body.addEventListener('click', function (e) {
    const photoTarget = e.target.closest('[data-pick-photo]');
    if (!photoTarget) return;
    const path = photoTarget.dataset.pickPhoto;
    if (window.EditorKit && typeof window.EditorKit.pickPhoto === 'function') {
      window.EditorKit.pickPhoto(DR.uploadUrl, function (url) {
        setPath(DR.config, path, url);
        if (typeof DR.save === 'function') DR.save();
        if (typeof DR.reRender === 'function') DR.reRender();
      });
    }
  });

  // ---- Events: add one, remove one, set its map link -------------------------------------------
  // A host keeps only the events they are holding. A new one starts with placeholder words to type over.
  var mapTimer = null;
  function redraw() { if (typeof DR.reRender === 'function') DR.reRender(); }
  function saveNow() { if (typeof DR.save === 'function') DR.save(); }

  document.addEventListener('click', function (e) {
    var list = DR.config.ceremonies;
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
      list.push({ id: 'own-' + Date.now().toString(36), name: 'New event', day: 'Day', date: 'Date', time: 'Time', venue: first.venue || 'Venue', mapUrl: '', img: first.img || '' });
      saveNow();
      redraw();
      var names = document.querySelectorAll('.ceremony-block h3[data-edit]');
      var last = names[names.length - 1];
      if (last) { last.scrollIntoView({ block: 'center', behavior: 'smooth' }); last.focus({ preventScroll: true }); }
    }
  }, true);

  document.addEventListener('input', function (e) {
    var el = e.target;
    if (!el || !el.hasAttribute || !el.hasAttribute('data-ev-map')) return;
    var item = (DR.config.ceremonies || [])[+el.getAttribute('data-ev-map')];
    if (!item) return;
    item.mapUrl = el.value.trim();
    clearTimeout(mapTimer);
    mapTimer = setTimeout(saveNow, 500);
  });
  // The link on the card appears, or goes, once the host has finished typing it.
  document.addEventListener('change', function (e) {
    if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-ev-map')) redraw();
  });

  // Mount shared platform toolbar if present
  if (window.BalconyToolbar && typeof window.BalconyToolbar.mount === 'function') {
    window.BalconyToolbar.mount(DR);
  }
})();
