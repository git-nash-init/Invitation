// Namkaran - a naming ceremony. The cover shows a swinging cradle and keeps the name veiled; the tap reveals it.
(function () {
  function toran() {
    var s = '';
    for (var i = 0; i < 11; i++) {
      var x = 20 + i * 36, y = 20 + Math.sin(i / 10 * Math.PI) * 30;
      if (i % 2 === 0) {
        s += '<g transform="translate(' + x + ' ' + y.toFixed(1) + ')"><circle r="13" fill="var(--nk-marigold)"/><circle r="8" fill="var(--mo-accent)"/><circle r="3.5" fill="var(--nk-marigold)"/></g>';
      } else {
        s += '<path transform="translate(' + x + ' ' + (y - 4).toFixed(1) + ')" d="M0 0 C-11 14 -9 38 0 50 C9 38 11 14 0 0Z" fill="var(--nk-leaf)"/>';
      }
    }
    return '<svg class="nk-toran" viewBox="0 0 400 100" preserveAspectRatio="xMidYMin meet" aria-hidden="true"><path d="M0 14 Q200 84 400 14" fill="none" stroke="var(--nk-leaf)" stroke-width="3"/>' + s + '</svg>';
  }
  function cradle() {
    return '<svg class="nk-cradle" viewBox="0 0 240 240" aria-hidden="true">' +
      '<path d="M36 226 L64 30 M204 226 L176 30 M56 30 H184" fill="none" stroke="var(--nk-wood)" stroke-width="9" stroke-linecap="round"/>' +
      '<circle cx="64" cy="30" r="9" fill="var(--nk-marigold)"/><circle cx="176" cy="30" r="9" fill="var(--nk-marigold)"/>' +
      '<g class="nk-swing"><path d="M84 32 V120 M156 32 V120" stroke="var(--nk-marigold)" stroke-width="3"/>' +
      '<path d="M66 118 H174 C174 164 150 184 120 184 C90 184 66 164 66 118Z" fill="var(--mo-accent)"/>' +
      '<path d="M66 118 H174" stroke="var(--nk-marigold)" stroke-width="7" stroke-linecap="round"/>' +
      '<path d="M78 136 q8 8 16 0 t16 0 t16 0 t16 0 t16 0" fill="none" stroke="var(--nk-marigold)" stroke-width="2.5"/>' +
      '<circle cx="120" cy="106" r="17" fill="#f5c9a3"/><path d="M112 106 q3 3 6 0 M123 106 q3 3 6 0" fill="none" stroke="#6a3b1f" stroke-width="2" stroke-linecap="round"/><path d="M115 113 q5 4 10 0" fill="none" stroke="#6a3b1f" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M104 100 C106 84 134 84 136 100 C128 92 112 92 104 100Z" fill="#3b2415"/><circle cx="120" cy="96" r="2.4" fill="var(--mo-accent)"/></g></svg>';
  }
  function diya(cls) {
    return '<svg class="nk-diya ' + cls + '" viewBox="0 0 80 80" aria-hidden="true"><path class="nk-flame" d="M40 8 C50 22 50 32 40 38 C30 32 30 22 40 8Z" fill="var(--nk-marigold)"/>' +
      '<path d="M8 44 H72 C70 62 56 70 40 70 C24 70 10 62 8 44Z" fill="var(--mo-accent)"/><path d="M8 44 H72" stroke="var(--nk-marigold)" stroke-width="4" stroke-linecap="round"/></svg>';
  }
  function mandala(cls) {
    var p = '';
    for (var i = 0; i < 12; i++) p += '<path transform="rotate(' + i * 30 + ' 100 100)" d="M100 18 C112 44 112 60 100 76 C88 60 88 44 100 18Z" fill="none" stroke="var(--nk-marigold)" stroke-width="2.5"/>';
    return '<svg class="nk-mandala ' + cls + '" viewBox="0 0 200 200" aria-hidden="true">' + p + '<circle cx="100" cy="100" r="22" fill="none" stroke="var(--mo-accent)" stroke-width="3"/><circle cx="100" cy="100" r="90" fill="none" stroke="var(--nk-marigold)" stroke-width="1.5" stroke-dasharray="3 9"/></svg>';
  }

  window.MomentsDesign = {
    id: 'baby-namkaran',
    openMs: 2100,
    headings: { countdown: 'The auspicious day', schedule: 'The ceremony', details: 'For our guests', gallery: 'Our little blessing', venue: 'Where we gather', rsvp: 'Will you bless us with your presence?' },
    fx: { kind: 'petals', layer: 'front', count: 16, colors: ['#ffba08', '#f48c06', '#e85d04', '#ffd166'], burstCount: 90 },
    palettes: [
      { name: 'Marigold', swatch: ['#fff7e6', '#e85d04', '#ffba08'], vars: { '--mo-bg': '#fff7e6', '--mo-bg-2': '#ffe9bf', '--mo-ink': '#5a0f14', '--mo-muted': '#8a5a45', '--mo-accent': '#e85d04', '--nk-marigold': '#ffba08', '--nk-leaf': '#386641', '--nk-wood': '#7f4f24' } },
      { name: 'Rose and gold', swatch: ['#fff0f3', '#c9184a', '#e0aa3e'], vars: { '--mo-bg': '#fff0f3', '--mo-bg-2': '#ffd9e2', '--mo-ink': '#590d22', '--mo-muted': '#8a4f60', '--mo-accent': '#c9184a', '--nk-marigold': '#e0aa3e', '--nk-leaf': '#588157', '--nk-wood': '#7f4f24' } },
      { name: 'Peacock', swatch: ['#eaf7f7', '#006d77', '#e9b949'], vars: { '--mo-bg': '#eaf7f7', '--mo-bg-2': '#c9ecec', '--mo-ink': '#073b4c', '--mo-muted': '#3f6b78', '--mo-accent': '#006d77', '--nk-marigold': '#e9b949', '--nk-leaf': '#2a9d8f', '--nk-wood': '#5c4033' } },
      { name: 'Sandal and green', swatch: ['#f6efe0', '#386641', '#bc6c25'], vars: { '--mo-bg': '#f6efe0', '--mo-bg-2': '#e9dcbf', '--mo-ink': '#283618', '--mo-muted': '#606c38', '--mo-accent': '#386641', '--nk-marigold': '#dda15e', '--nk-leaf': '#606c38', '--nk-wood': '#bc6c25' } }
    ],
    defaults: {
      kicker: 'नामकरण · Naming ceremony',
      title: 'Aarohi',
      subtitle: 'Daughter of Meera and Arjun Sharma',
      hostLine: 'With the blessings of her grandparents',
      eventDate: 'Thursday, 11 November 2027',
      eventTime: 'Muhurat at 10:30 AM',
      eventISO: '2027-11-11T10:30',
      venue: 'Sharma Niwas, 8 Temple Street\nMalleswaram, Bengaluru',
      note: 'Our home has a new heartbeat. With joy and gratitude, we invite you to bless our daughter as she receives her name.',
      noteSign: 'Meera and Arjun',
      closing: 'Your blessings mean the world',
      coverTop: 'Our little one has a name',
      coverLine: 'Tap to hear it first',
      meaning: 'Aarohi: a musical note, ever rising',
      events: [
        { name: 'Ganesh puja', time: '9:30 AM', venue: 'Sharma Niwas', mapUrl: '' },
        { name: 'Naming ceremony', time: '10:30 AM', venue: 'The name is whispered, then announced', mapUrl: '' },
        { name: 'Lunch', time: '12:30 PM', venue: 'Traditional meal on banana leaves', mapUrl: '' }
      ],
      details: [
        { title: 'Attire', text: 'Traditional wear. Bright colours are most welcome.' },
        { title: 'Blessings only', text: 'Please do not bring gifts. Your blessings are all she needs.' },
        { title: 'Elders', text: 'Seating and help are arranged for senior guests.' }
      ],
      photos: [{ src: '', caption: 'Day one' }, { src: '', caption: 'Tiny fingers' }, { src: '', caption: 'With Dadi' }]
    },
    coverHtml: function (h) {
      return toran() +
        h.E('coverTop', 'p', 'nk-top', { hint: 'Small line' }) +
        cradle() +
        '<div class="nk-veil">' + h.E('title', 'h1', 'nk-name', { keep: true, hint: 'The name' }) + '</div>' +
        h.E('coverLine', 'p', 'nk-line', { hint: 'Small line' }) +
        '<button type="button" class="mo-open nk-open" data-open>Reveal the name</button>';
    },
    heroHtml: function (h) {
      return h.E('kicker', 'p', 'mo-kicker', { hint: 'Small line' }) +
        h.E('title', 'h1', 'mo-title nk-hero-name', { keep: true, hint: 'The name' }) +
        h.E('meaning', 'p', 'nk-meaning', { hint: 'What the name means' }) +
        h.E('subtitle', 'p', 'mo-subtitle', { hint: 'Parents' });
    },
    decor: function (name) {
      if (name === 'hero') return toran() + mandala('nk-m1');
      if (name === 'countdown') return diya('nk-dy1') + diya('nk-dy2');
      if (name === 'venue') return mandala('nk-m2');
      if (name === 'closing') return diya('nk-dy3');
      return '';
    },
    placeholder: function (path) {
      var n = parseInt((/\[(\d+)\]/.exec(path) || [0, 0])[1], 10) || 0;
      var bg = ['#ffe3a3', '#ffd0b5', '#fbe7c6', '#e3efd3'][n % 4];
      return '<svg viewBox="0 0 120 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="120" height="120" fill="' + bg + '"/>' +
        '<g transform="translate(60 62)">' + [0, 45, 90, 135, 180, 225, 270, 315].map(function (a) { return '<path transform="rotate(' + a + ')" d="M0 -34 C9 -22 9 -12 0 -4 C-9 -12 -9 -22 0 -34Z" fill="#f48c06" opacity=".85"/>'; }).join('') + '<circle r="9" fill="#ffba08"/></g></svg>';
    }
  };
})();
