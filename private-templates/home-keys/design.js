// New Keys - a modern, editorial housewarming. The cover is a key and a lock; the key turns and the wall opens.
(function () {
  function key() {
    return '<svg class="nk2-key" viewBox="0 0 80 220" aria-hidden="true">' +
      '<circle cx="40" cy="42" r="32" fill="none" stroke="var(--mo-accent)" stroke-width="14"/>' +
      '<path d="M40 74 V206 M40 150 H66 M40 178 H60 M40 206 H70" fill="none" stroke="var(--mo-accent)" stroke-width="14" stroke-linecap="square"/></svg>';
  }
  function house(cls) {
    return '<svg class="nk2-house ' + cls + '" viewBox="0 0 300 220" aria-hidden="true">' +
      '<path class="nk2-draw" pathLength="1" d="M20 210 V104 L150 16 L280 104 V210 Z M116 210 V138 H184 V210 M52 128 H92 V168 H52 Z M208 128 H248 V168 H208 Z M200 48 V22 H232 V70" fill="none" stroke="var(--mo-ink)" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<circle class="nk2-knob" cx="170" cy="176" r="5" fill="var(--mo-accent)"/></svg>';
  }
  function strip(text) {
    return '<div class="nk2-strip" aria-hidden="true" data-no-wording><div>' + new Array(9).join('<b>' + text + '</b><i>✺</i>') + '</div></div>';
  }

  window.MomentsDesign = {
    id: 'home-keys',
    openMs: 1900,
    headings: { countdown: 'Doors open in', schedule: 'Run of show', details: 'House rules', gallery: 'The tour', venue: 'The new address', rsvp: 'Coming over?' },
    fx: { kind: 'confetti', layer: 'front', count: 0, colors: ['#2b59ff', '#111111', '#ff5c39', '#ffd23f'], burstCount: 70 },
    palettes: [
      { name: 'Blueprint', swatch: ['#f3f2ec', '#2b59ff', '#111111'], vars: { '--mo-bg': '#f3f2ec', '--mo-bg-2': '#e6e4d8', '--mo-ink': '#111111', '--mo-muted': '#55544e', '--mo-card': '#ffffff', '--mo-accent': '#2b59ff', '--mo-accent-2': '#ff5c39', '--mo-on-accent': '#ffffff' } },
      { name: 'Acid', swatch: ['#0e0e0e', '#c8ff00', '#ffffff'], vars: { '--mo-bg': '#0e0e0e', '--mo-bg-2': '#1b1b1b', '--mo-ink': '#f5f5f0', '--mo-muted': '#a8a8a0', '--mo-card': '#1b1b1b', '--mo-accent': '#c8ff00', '--mo-accent-2': '#ff4fd8', '--mo-on-accent': '#0e0e0e', '--mo-line': '#f5f5f0' } },
      { name: 'Terracotta', swatch: ['#f6eee3', '#c8553d', '#2f3e46'], vars: { '--mo-bg': '#f6eee3', '--mo-bg-2': '#ead9c4', '--mo-ink': '#2f3e46', '--mo-muted': '#62707a', '--mo-card': '#fffaf3', '--mo-accent': '#c8553d', '--mo-accent-2': '#588b8b', '--mo-on-accent': '#ffffff' } },
      { name: 'Mono red', swatch: ['#ffffff', '#e10600', '#111111'], vars: { '--mo-bg': '#ffffff', '--mo-bg-2': '#efefef', '--mo-ink': '#111111', '--mo-muted': '#5a5a5a', '--mo-card': '#ffffff', '--mo-accent': '#e10600', '--mo-accent-2': '#111111', '--mo-on-accent': '#ffffff' } }
    ],
    defaults: {
      kicker: 'We moved',
      title: 'New keys, who dis?',
      subtitle: 'Zoya and Aryan finally have a place with a door that locks. Come see it.',
      hostLine: 'Hosted by Zoya and Aryan',
      eventDate: 'Saturday, 3 April 2027',
      eventTime: '7:30 PM onwards',
      eventISO: '2027-04-03T19:30',
      venue: 'Apt 7B, The Loft House\n14 Hill Road, Bandra West, Mumbai',
      note: 'Forty-two boxes, three broken plates and one lost cat (found) later, we are in. The sofa has not arrived, so the floor is very much the vibe.',
      noteSign: 'Z + A',
      closing: 'Mi casa, su casa',
      coverTop: 'Housewarming',
      coverLine: 'Est. 2027',
      events: [
        { name: 'House tour', time: '7:30 PM', venue: 'It takes ninety seconds', mapUrl: '' },
        { name: 'Dinner on the floor', time: '8:30 PM', venue: 'Biryani, family style', mapUrl: '' },
        { name: 'Terrace and playlist', time: '10:00 PM', venue: 'Aux cord is open', mapUrl: '' }
      ],
      details: [
        { title: 'Bring', text: 'A plant, a cushion, or a bottle. Or nothing. Truly.' },
        { title: 'Wear', text: 'Socks you are proud of. Shoes stay at the door.' },
        { title: 'Finding us', text: 'Seventh floor. The lift is slow, the view is worth it.' }
      ],
      photos: [{ src: '', caption: '01 Living' }, { src: '', caption: '02 Kitchen' }, { src: '', caption: '03 Terrace' }, { src: '', caption: '04 The cat' }]
    },
    coverHtml: function (h) {
      return '<div class="nk2-wall nk2-wall--l" aria-hidden="true"></div><div class="nk2-wall nk2-wall--r" aria-hidden="true"></div>' +
        '<div class="nk2-face">' +
        h.E('coverTop', 'p', 'nk2-top', { hint: 'Small line' }) +
        h.E('title', 'h1', 'nk2-title', { keep: true, hint: 'Title' }) +
        '<div class="nk2-lock" aria-hidden="true"><span class="nk2-hole"></span>' + key() + '</div>' +
        '<button type="button" class="mo-open nk2-open" data-open>Unlock</button>' +
        h.E('coverLine', 'p', 'nk2-line', { hint: 'Small line' }) +
        '</div>';
    },
    decor: function (name) {
      if (name === 'hero') return house('nk2-house--hero');
      if (name === 'countdown') return strip('WE MOVED');
      if (name === 'gallery') return strip('COME ON IN');
      if (name === 'closing') return house('nk2-house--end');
      return '';
    },
    placeholder: function (path) {
      var n = parseInt((/\[(\d+)\]/.exec(path) || [0, 0])[1], 10) || 0;
      var shapes = [
        '<circle cx="60" cy="60" r="34" fill="var(--mo-accent)"/>',
        '<rect x="24" y="24" width="72" height="72" fill="var(--mo-accent-2)"/>',
        '<path d="M60 20 L100 96 H20Z" fill="var(--mo-accent)"/>',
        '<path d="M22 98 A76 76 0 0 1 98 22 V98Z" fill="var(--mo-accent-2)"/>'
      ];
      return '<svg viewBox="0 0 120 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="120" height="120" fill="var(--mo-bg-2)"/>' + shapes[n % 4] + '</svg>';
    },
    onReady: function () {
      // The line drawing of the house draws itself when it scrolls into view.
      if (!('IntersectionObserver' in window)) return;
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-drawn'); io.unobserve(e.target); } });
      }, { threshold: 0.3 });
      var list = document.querySelectorAll('.nk2-house');
      for (var i = 0; i < list.length; i++) io.observe(list[i]);
    }
  };
})();
