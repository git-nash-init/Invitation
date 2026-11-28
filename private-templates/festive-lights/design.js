// Festival of Lights - a Diwali or festive party. The cover is dark with one unlit diya; lighting it opens the night.
(function () {
  function diya(cls) {
    return '<svg class="fl-diya ' + (cls || '') + '" viewBox="0 0 160 150" aria-hidden="true">' +
      '<g class="fl-flame"><path d="M80 6 C104 40 100 62 80 74 C60 62 56 40 80 6Z" fill="var(--fl-gold)"/><path d="M80 34 C90 50 88 62 80 68 C72 62 70 50 80 34Z" fill="#fff6d6"/></g>' +
      '<path d="M14 84 H146 C142 122 114 140 80 140 C46 140 18 122 14 84Z" fill="var(--mo-accent)"/>' +
      '<path d="M14 84 H146" stroke="var(--fl-gold)" stroke-width="7" stroke-linecap="round"/>' +
      '<path d="M40 104 q10 10 20 0 t20 0 t20 0 t20 0" fill="none" stroke="var(--fl-gold)" stroke-width="3"/>' +
      '<circle cx="80" cy="122" r="5" fill="var(--fl-gold)"/></svg>';
  }
  function lights(cls) {
    var b = '', cols = ['var(--fl-gold)', 'var(--mo-accent)', 'var(--mo-accent-2)', '#7df9ff'];
    for (var i = 0; i < 10; i++) {
      var x = 20 + i * 40, y = 14 + Math.sin(i / 9 * Math.PI) * 30;
      b += '<g class="fl-bulb" style="--i:' + i + ';color:' + cols[i % 4] + '"><path d="M' + x + ' ' + (y - 2).toFixed(1) + ' v8" stroke="#4a4470" stroke-width="3"/><ellipse cx="' + x + '" cy="' + (y + 16).toFixed(1) + '" rx="8" ry="11" fill="currentColor"/></g>';
    }
    return '<svg class="fl-lights ' + (cls || '') + '" viewBox="0 0 400 80" preserveAspectRatio="xMidYMin meet" aria-hidden="true"><path d="M0 8 Q200 78 400 8" fill="none" stroke="#4a4470" stroke-width="2.5"/>' + b + '</svg>';
  }
  function mandala(cls) {
    var p = '';
    for (var i = 0; i < 16; i++) p += '<g transform="rotate(' + i * 22.5 + ' 150 150)"><path d="M150 16 C166 52 166 78 150 104 C134 78 134 52 150 16Z" fill="none" stroke="var(--fl-gold)" stroke-width="2"/><circle cx="150" cy="8" r="3.5" fill="var(--mo-accent)"/></g>';
    return '<svg class="fl-mandala ' + cls + '" viewBox="0 0 300 300" aria-hidden="true">' + p +
      '<circle cx="150" cy="150" r="44" fill="none" stroke="var(--mo-accent-2)" stroke-width="2.5"/><circle cx="150" cy="150" r="26" fill="none" stroke="var(--fl-gold)" stroke-width="2" stroke-dasharray="4 6"/><circle cx="150" cy="150" r="142" fill="none" stroke="var(--fl-gold)" stroke-width="1.2" stroke-dasharray="2 10"/></svg>';
  }

  window.MomentsDesign = {
    id: 'festive-lights',
    openMs: 2000,
    headings: { countdown: 'The night begins in', schedule: 'The evening', details: 'Before you come', gallery: 'Last year’s sparkle', venue: 'Follow the lights', rsvp: 'Will you light up our night?' },
    fx: { kind: 'sparks', layer: 'back', count: 0, colors: ['#ffc857', '#ff6b35', '#e0218a', '#7df9ff', '#ffffff'], burstCount: 110 },
    palettes: [
      { name: 'Midnight gold', swatch: ['#120a2e', '#ffc857', '#ff6b35'], vars: { '--mo-bg': '#120a2e', '--mo-bg-2': '#24124d', '--mo-accent': '#ff6b35', '--mo-accent-2': '#e0218a', '--fl-gold': '#ffc857' } },
      { name: 'Royal purple', swatch: ['#1e0b36', '#f9c74f', '#c77dff'], vars: { '--mo-bg': '#1e0b36', '--mo-bg-2': '#3c096c', '--mo-accent': '#c77dff', '--mo-accent-2': '#ff5d8f', '--fl-gold': '#f9c74f', '--mo-on-accent': '#1e0b36' } },
      { name: 'Emerald night', swatch: ['#04231c', '#ffd166', '#06d6a0'], vars: { '--mo-bg': '#04231c', '--mo-bg-2': '#0b3d30', '--mo-accent': '#06d6a0', '--mo-accent-2': '#f78c6b', '--fl-gold': '#ffd166', '--mo-on-accent': '#04231c' } },
      { name: 'Rose night', swatch: ['#2b0a1e', '#ffd6a5', '#ff4d8d'], vars: { '--mo-bg': '#2b0a1e', '--mo-bg-2': '#4a1033', '--mo-accent': '#ff4d8d', '--mo-accent-2': '#ff9e00', '--fl-gold': '#ffd6a5' } }
    ],
    defaults: {
      kicker: 'शुभ दीपावली · Festival of lights',
      title: 'Diwali at the Kapoors',
      subtitle: 'Cards, sweets, and a sky full of sparkle. You know the drill.',
      hostLine: 'Hosted by Neha, Sameer and family',
      eventDate: 'Friday, 29 October 2027',
      eventTime: '7:00 PM onwards',
      eventISO: '2027-10-29T19:00',
      venue: 'Kapoor House, 5 Garden Enclave\nSouth Extension, New Delhi',
      note: 'The diyas are out, the mithai is ordered, and the card table is ready to end friendships. Come celebrate the brightest night of the year with us.',
      noteSign: 'The Kapoors',
      closing: 'Wishing you light and laughter',
      coverTop: 'It is dark in here',
      coverLine: 'Light the diya to begin',
      events: [
        { name: 'Lakshmi puja', time: '7:00 PM', venue: 'Living room', mapUrl: '' },
        { name: 'Dinner and mithai', time: '8:00 PM', venue: 'Buffet on the lawn', mapUrl: '' },
        { name: 'Taash night', time: '9:30 PM', venue: 'Teen patti till late', mapUrl: '' }
      ],
      details: [
        { title: 'Dress code', text: 'Festive and fabulous. Sequins are encouraged.' },
        { title: 'Green Diwali', text: 'We are skipping loud crackers. Sparklers and diyas only.' },
        { title: 'Bring', text: 'Your lucky cards and a sweet tooth.' }
      ],
      photos: [{ src: '', caption: 'The rangoli' }, { src: '', caption: 'Card sharks' }, { src: '', caption: 'Everyone, somehow' }]
    },
    coverHtml: function (h) {
      return lights('fl-lights--cover') +
        '<div class="fl-glow" aria-hidden="true"></div>' +
        h.E('coverTop', 'p', 'fl-top', { hint: 'Small line' }) +
        h.E('title', 'h1', 'fl-title', { keep: true, hint: 'Title' }) +
        '<div class="fl-lamp">' + diya() + '</div>' +
        '<button type="button" class="mo-open fl-open" data-open>Light the diya</button>' +
        h.E('coverLine', 'p', 'fl-line', { hint: 'Small line' });
    },
    decor: function (name) {
      if (name === 'hero') return lights('') + mandala('fl-m1');
      if (name === 'countdown') return '<div class="fl-row" aria-hidden="true">' + diya('fl-diya--sm') + diya('fl-diya--sm') + diya('fl-diya--sm') + diya('fl-diya--sm') + diya('fl-diya--sm') + '</div>';
      if (name === 'venue') return mandala('fl-m2');
      if (name === 'gallery') return lights('');
      if (name === 'closing') return '<div class="fl-lamp fl-lamp--end" aria-hidden="true">' + diya() + '</div>';
      return '';
    },
    placeholder: function (path) {
      var n = parseInt((/\[(\d+)\]/.exec(path) || [0, 0])[1], 10) || 0;
      var bg = ['#2d1763', '#4a1033', '#0b3d30', '#3c096c'][n % 4];
      return '<svg viewBox="0 0 120 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="120" height="120" fill="' + bg + '"/>' +
        '<g fill="none" stroke="#ffc857" stroke-width="2.5" stroke-linecap="round">' + [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(function (a) { return '<path transform="rotate(' + a + ' 60 54)" d="M60 40 V22"/>'; }).join('') + '</g>' +
        '<circle cx="60" cy="54" r="6" fill="#fff6d6"/><path d="M34 96 H86 C84 108 74 112 60 112 C46 112 36 108 34 96Z" fill="#ff6b35"/><path d="M60 78 C66 86 65 91 60 94 C55 91 54 86 60 78Z" fill="#ffc857"/></svg>';
    },
    onReady: function (MO) {
      // The diyas in the row light up one by one as they come into view.
      if (!('IntersectionObserver' in window)) return;
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-lit'); io.unobserve(e.target); } });
      }, { threshold: 0.5 });
      var rows = document.querySelectorAll('.fl-row');
      for (var i = 0; i < rows.length; i++) io.observe(rows[i]);
    }
  };
})();
