// Scroll-reveal effects with GSAP ScrollTrigger: sections gently rise and fade
// in as they scroll into view. If GSAP/ScrollTrigger aren't available (or the
// user prefers reduced motion), nothing is hidden - content just shows normally.
(function () {
  if (window.RoseInvite && RoseInvite.mode === 'edit') return; // edit mode: nothing hidden
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  if (!gsap || !ScrollTrigger) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  gsap.registerPlugin(ScrollTrigger);

  // Elements to reveal on scroll. (Welcome scene and the family cards keep their
  // own existing animations and are intentionally left out.)
  // .compliment-card / .notes-card are deliberately NOT here any more. They now
  // use the same CSS reveal as the family cards (.has-reveal / .is-visible in
  // styles.css, observed in app.js), which adds the staggered inner cascade
  // this tween cannot do. The two systems cannot coexist on one element:
  // gsap.from() animates from the given values TO the element's current
  // computed values, and app.js applies .has-reveal - which sets opacity 0 -
  // before this file runs, so GSAP captured 0 as the destination and tweened
  // 0 -> 0, pinning an inline opacity:0 that outranks .is-visible. The cards
  // were invisible for good. Same reason .invite--detail was already excluded.
  const targets = [
    '.ceremonies__title',
    '.deck-wrap',
    '.scene--social .socials',
    '#balcony-rsvp', // shared platform RSVP (was the template's own .rsvp)
    '.easel',
  ];

  targets.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => {
      gsap.from(el, {
        opacity: 0,
        y: 46,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          once: true,
        },
      });
    });
  });

  // --- Scrub parallax: decorative layers drift as you scroll through ---------

  // Gallery backdrop parallaxes vertically as the section passes through.
  if (document.querySelector('.scene--gallery')) {
    gsap.fromTo('.scene--gallery',
      { backgroundPositionY: '40%' },
      {
        backgroundPositionY: '60%',
        ease: 'none',
        scrollTrigger: {
          trigger: '.scene--gallery',
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });
  }

  // Recalculate positions once everything (images, fonts) has loaded.
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
