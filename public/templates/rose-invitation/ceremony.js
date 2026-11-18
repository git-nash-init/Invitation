// Ceremonies: a stack of cards. Swipe the front card left or right and it drops
// behind the deck; the next card comes to the front. GSAP animates the fan and
// settle for smoothness, with a CSS-transition fallback if GSAP is missing.
(function () {
  if (window.RoseInvite && RoseInvite.mode === 'edit') return; // edit mode: deck becomes a grid
  const deck = document.getElementById('ceremonyDeck');
  if (!deck) return;

  const cards = Array.from(deck.querySelectorAll('.cere-card'));
  if (!cards.length) return;

  const splash = document.getElementById('deckSplash');
  const G = window.gsap;

  // Resting pose for each depth (0 = front). Behind cards fan out slightly.
  const SLOTS = [
    { x: 0, y: 0, r: 0, s: 1 },
    { x: 26, y: -10, r: 4, s: 0.965 },
    { x: -26, y: -16, r: -4, s: 0.93 },
    { x: 10, y: -22, r: 2, s: 0.9 },
    { x: -8, y: -28, r: -1.5, s: 0.87 },
    { x: 18, y: -33, r: 3, s: 0.845 },
    { x: -16, y: -38, r: -2.5, s: 0.82 },
  ];
  const slotFor = (pos) => SLOTS[Math.min(pos, SLOTS.length - 1)];
  const toStr = (v) => `translate(${v.x}px, ${v.y}px) rotate(${v.r}deg) scale(${v.s})`;

  // With GSAP we drive transforms ourselves, so kill the CSS transition.
  if (G) cards.forEach((c) => { c.style.transition = 'none'; });

  // Move a card to a pose - animated (tween) or instantly (set)
  function place(el, v, animate) {
    if (G) {
      const props = { x: v.x, y: v.y, rotation: v.r, scale: v.s };
      if (animate) G.to(el, Object.assign({ duration: 0.55, ease: 'power3.out', overwrite: true }, props));
      else G.set(el, props);
    } else {
      el.style.transform = toStr(v);
    }
  }

  // order[0] is the front card
  let order = cards.map((_, i) => i);

  // Swap the splash to the front card's image (with a little pop)
  function updateSplash() {
    if (!splash) return;
    const src = cards[order[0]].dataset.splash;
    if (!src || splash.getAttribute('src') === src) return;
    splash.src = src;
    splash.style.animation = 'none';
    void splash.offsetWidth; // reflow so the animation can replay
    splash.style.animation = '';
  }

  function layout(animate) {
    order.forEach((cardIdx, pos) => {
      const el = cards[cardIdx];
      el.style.zIndex = String(cards.length - pos);
      place(el, slotFor(pos), animate);
    });
    updateSplash();
  }

  layout(false); // initial pose, no animation

  // Send the current front card behind the deck; others shuffle forward.
  function sendToBack() {
    const movedIdx = order[0];
    cards[movedIdx].style.zIndex = '0'; // drop behind immediately
    order.shift();
    order.push(movedIdx);
    layout(true);
  }

  const THRESHOLD = 110; // px past which a swipe commits

  let dragging = false;
  let startX = 0;
  let startY = 0;
  let dx = 0;
  let frontEl = null;

  deck.addEventListener('pointerdown', (e) => {
    frontEl = cards[order[0]];
    if (!frontEl.contains(e.target) && e.target !== frontEl) return;
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    dx = 0;
    if (G) G.killTweensOf(frontEl);
    frontEl.classList.add('is-dragging');
    frontEl.setPointerCapture(e.pointerId);
  });

  deck.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    dx = e.clientX - startX;
    const dy = (e.clientY - startY) * 0.25;
    if (G) {
      G.set(frontEl, { x: dx, y: dy, rotation: dx * 0.05 });
    } else {
      frontEl.style.transform = `translate(${dx}px, ${dy}px) rotate(${dx * 0.05}deg)`;
    }
  });

  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    frontEl.classList.remove('is-dragging');
    try { frontEl.releasePointerCapture(e.pointerId); } catch (_) { /* ignore */ }

    if (Math.abs(dx) > THRESHOLD) {
      sendToBack();               // tuck behind the deck
    } else {
      place(frontEl, slotFor(0), true); // snap back to front
    }
  }

  deck.addEventListener('pointerup', endDrag);
  deck.addEventListener('pointercancel', endDrag);
})();
