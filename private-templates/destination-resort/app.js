// Destination Resort - Interactivity & Opening Flow
(function () {
  const DR = window.DestinationResort;
  if (!DR) return;

  const openBtn = document.getElementById('openInvite');
  const cover = document.getElementById('resortCover');
  const pageWrapper = document.querySelector('.page-wrapper');

  function openInvitation() {
    if (cover.classList.contains('resort-cover--opened')) return;
    cover.classList.add('resort-cover--opened');
    setTimeout(() => {
      cover.style.display = 'none';
    }, 1200);

    // Start background music if present
    if (window.BalconyMusic && typeof window.BalconyMusic.play === 'function') {
      window.BalconyMusic.play();
    }
  }

  if (openBtn) {
    openBtn.addEventListener('click', openInvitation);
  }
  if (cover) {
    cover.addEventListener('click', function (e) {
      if (e.target === openBtn || openBtn.contains(e.target)) return;
      openInvitation();
    });
  }

  // Auto countdown based on cfg.eventISO
  function initCountdown() {
    const el = document.querySelector('.time-countdown');
    if (!el) return;
    const target = new Date(DR.config.eventISO || '2026-02-14').getTime();

    function update() {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      const dEl = el.querySelector('.counter-days .count');
      const hEl = el.querySelector('.counter-hours .count');
      const mEl = el.querySelector('.counter-mins .count');
      const sEl = el.querySelector('.counter-secs .count');

      if (dEl) dEl.textContent = String(days).padStart(2, '0');
      if (hEl) hEl.textContent = String(hours).padStart(2, '0');
      if (mEl) mEl.textContent = String(mins).padStart(2, '0');
      if (sEl) sEl.textContent = String(secs).padStart(2, '0');
    }

    update();
    setInterval(update, 1000);
  }

  initCountdown();
})();
