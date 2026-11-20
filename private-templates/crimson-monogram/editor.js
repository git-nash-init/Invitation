// The Crimson Monogram - In-Place Studio Editor
(function () {
  const CM = window.CrimsonMonogram;
  if (!CM || CM.mode !== 'edit') return;

  function initEditor() {
    document.addEventListener('click', function (e) {
      const fieldEl = e.target.closest('[data-edit-field]');
      if (!fieldEl) return;

      const path = fieldEl.getAttribute('data-edit-field');
      const currentVal = fieldEl.innerText.trim();

      const newVal = window.prompt('Edit ' + path + ':', currentVal);
      if (newVal === null || newVal === currentVal) return;

      const parts = path.split('.');
      let target = CM.config;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!target[parts[i]]) target[parts[i]] = {};
        target = target[parts[i]];
      }
      target[parts[parts.length - 1]] = newVal;

      CM.syncDerived();
      CM.render();

      if (typeof CM.save === 'function') {
        CM.save();
      }
    });

    if (window.BalconyToolbar && typeof window.BalconyToolbar.mount === 'function') {
      window.BalconyToolbar.mount(CM);
    }
  }

  window.addEventListener('load', initEditor);
})();
