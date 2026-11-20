// The Crimson Monogram - Template Interaction Controller
(function () {
  const CM = window.CrimsonMonogram;
  if (!CM) return;

  function initApp() {
    CM.render();

    const cover = document.getElementById('coverSection');
    const main = document.getElementById('mainContent');
    const openBtn = document.getElementById('openInviteBtn');

    function openInvitation() {
      if (cover) {
        cover.classList.add('opened');
      }
      if (main) {
        main.classList.add('visible');
      }
      if (window.BalconyMusic && typeof window.BalconyMusic.play === 'function') {
        window.BalconyMusic.play();
      }
    }

    if (openBtn) {
      openBtn.addEventListener('click', openInvitation);
    }

    if (cover) {
      cover.addEventListener('click', function (e) {
        if (e.target.closest('button') || e.target.closest('[data-open-invite]') || e.target.closest('.crimson-frame')) {
          openInvitation();
        }
      });
    }

    // Support edit mode direct reveal
    if (CM.mode === 'edit' || CM.mode === 'preview') {
      const p = new URLSearchParams(location.search);
      if (p.has('opened') || p.get('step') === 'content') {
        openInvitation();
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
