// The Sage Envelope - Interactivity & Envelope Opening
(function () {
  const SE = window.SageEnvelope;
  if (!SE) return;

  const openBtn = document.getElementById('openEnvelope');
  const cover = document.getElementById('envelopeCover');

  function openEnvelope() {
    if (cover.classList.contains('sage-envelope-cover--opened')) return;
    cover.classList.add('sage-envelope-cover--opened');

    if (window.BalconyMusic && typeof window.BalconyMusic.play === 'function') {
      window.BalconyMusic.play();
    }

    setTimeout(() => {
      cover.style.display = 'none';
    }, 1000);
  }

  if (openBtn) {
    openBtn.addEventListener('click', openEnvelope);
  }
  if (cover) {
    cover.addEventListener('click', function (e) {
      openEnvelope();
    });
  }
})();
