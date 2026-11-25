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

  // Mount shared platform toolbar if present
  if (window.BalconyToolbar && typeof window.BalconyToolbar.mount === 'function') {
    window.BalconyToolbar.mount(DR);
  }
})();
