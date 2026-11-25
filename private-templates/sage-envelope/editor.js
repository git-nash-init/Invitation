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

  if (window.BalconyToolbar && typeof window.BalconyToolbar.mount === 'function') {
    window.BalconyToolbar.mount(SE);
  }
})();
