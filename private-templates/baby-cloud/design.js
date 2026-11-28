// Cloud Nine - a baby shower in a pastel sky. The clouds part and the moon rises to open it.
(function () {
  function cloud(cls) {
    return '<svg class="cl-cloud ' + cls + '" viewBox="0 0 200 90" aria-hidden="true"><path d="M30 80 C8 80 4 54 26 50 C22 28 52 16 66 34 C74 10 116 8 122 38 C144 26 170 44 160 60 C186 58 190 80 168 80Z" fill="#fff"/></svg>';
  }
  function moon() {
    return '<svg class="cl-moon" viewBox="0 0 160 160" aria-hidden="true">' +
      '<circle cx="80" cy="80" r="70" fill="var(--cl-glow)" opacity=".45"/>' +
      '<path d="M104 18 A64 64 0 1 0 142 108 A52 52 0 0 1 104 18Z" fill="var(--cl-moon)"/>' +
      '<path d="M70 86 q7 6 14 0" fill="none" stroke="#7a5c2e" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M52 70 q6 -5 12 0" fill="none" stroke="#7a5c2e" stroke-width="3" stroke-linecap="round"/>' +
      '<circle cx="62" cy="92" r="6" fill="#ff9fb5" opacity=".7"/></svg>';
  }
  function star(cls) {
    return '<svg class="cl-star ' + cls + '" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 3 L24 15 L37 16 L27 24 L30 37 L20 30 L10 37 L13 24 L3 16 L16 15Z" fill="var(--cl-moon)"/></svg>';
  }
  function mobile() {
    return '<svg class="cl-mobile" viewBox="0 0 300 150" aria-hidden="true">' +
      '<path d="M40 14 Q150 46 260 14" fill="none" stroke="var(--mo-accent)" stroke-width="3" stroke-linecap="round"/>' +
      '<g class="cl-hang cl-hang--1"><path d="M70 22 V78" stroke="var(--mo-muted)" stroke-width="1.5"/><path d="M70 78 l6 13 14 1 -11 9 4 14 -13 -8 -13 8 4 -14 -11 -9 14 -1Z" fill="var(--cl-moon)"/></g>' +
      '<g class="cl-hang cl-hang--2"><path d="M150 30 V96" stroke="var(--mo-muted)" stroke-width="1.5"/><circle cx="150" cy="112" r="16" fill="var(--mo-accent-2)"/><path d="M150 128 l-5 8 h10Z" fill="var(--mo-accent-2)"/></g>' +
      '<g class="cl-hang cl-hang--3"><path d="M230 22 V70" stroke="var(--mo-muted)" stroke-width="1.5"/><path d="M212 92 C204 92 202 82 211 80 C210 70 224 66 229 74 C234 64 250 66 251 78 C260 76 262 92 252 92Z" fill="#fff" stroke="var(--mo-line)" stroke-width="1.5"/></g></svg>';
  }

  window.MomentsDesign = {
    id: 'baby-cloud',
    openMs: 1700,
    headings: { countdown: 'Counting the sleeps', schedule: 'The afternoon', details: 'Little details', gallery: 'The story so far', venue: 'Where to find us', rsvp: 'Will you join us?' },
    fx: { kind: 'bubbles', layer: 'back', count: 22, colors: ['#ffffff', '#ffd6e5', '#cfe0ff'], burstCount: 60, burstColors: ['#ffffff', '#ffd76a', '#ffb3c7', '#9db8ff'] },
    palettes: [
      { name: 'Sky blue', swatch: ['#dff1ff', '#6c8cff', '#ffb3c7'], vars: { '--mo-bg': '#dff1ff', '--mo-bg-2': '#fdf3ff', '--mo-ink': '#27305c', '--mo-muted': '#5d678f', '--mo-accent': '#6c8cff', '--mo-accent-2': '#ffb3c7', '--cl-moon': '#ffd76a', '--cl-glow': '#fff3c4', '--mo-card': 'rgba(255, 255, 255, 0.82)' } },
      { name: 'Peach blush', swatch: ['#ffeadb', '#f08080', '#ffd6a5'], vars: { '--mo-bg': '#ffeadb', '--mo-bg-2': '#fff8f0', '--mo-ink': '#5a2d2d', '--mo-muted': '#8a5f58', '--mo-accent': '#f08080', '--mo-accent-2': '#ffd6a5', '--cl-moon': '#ffc971', '--cl-glow': '#fff1d0', '--mo-card': 'rgba(255, 255, 255, 0.85)' } },
      { name: 'Mint', swatch: ['#dcf5ec', '#2a9d8f', '#f4a261'], vars: { '--mo-bg': '#dcf5ec', '--mo-bg-2': '#f5fff9', '--mo-ink': '#1d4640', '--mo-muted': '#4f7770', '--mo-accent': '#2a9d8f', '--mo-accent-2': '#f4a261', '--cl-moon': '#ffe08a', '--cl-glow': '#fff6cf', '--mo-card': 'rgba(255, 255, 255, 0.85)' } },
      { name: 'Starry night', swatch: ['#1d1b4a', '#ffd76a', '#b9a7ff'], vars: { '--mo-bg': '#1d1b4a', '--mo-bg-2': '#352f73', '--mo-ink': '#fdf8ff', '--mo-muted': '#c9c3ee', '--mo-accent': '#b9a7ff', '--mo-accent-2': '#ffb3c7', '--cl-moon': '#ffd76a', '--cl-glow': '#fff3c4', '--mo-card': 'rgba(255, 255, 255, 0.1)', '--mo-line': 'rgba(255, 255, 255, 0.24)', '--mo-on-accent': '#1d1b4a' } }
    ],
    defaults: {
      kicker: 'A little one is on the way',
      title: 'Baby Shower for Ananya',
      subtitle: 'Come shower the mum-to-be with love, laughter and far too many snacks.',
      hostLine: 'Hosted by Nani, Dadi and the aunties',
      eventDate: 'Sunday, 6 June 2027',
      eventTime: '4:00 PM to 7:00 PM',
      eventISO: '2027-06-06T16:00',
      venue: 'The Sharma residence, 22 Lake Road\nKoregaon Park, Pune',
      note: 'We are over the moon. Before our little star arrives, we would love an afternoon with the people who mean the most to us.',
      noteSign: 'Ananya and Rohan',
      closing: 'Twinkle twinkle, see you soon',
      coverLine: 'Something small and wonderful is coming',
      events: [
        { name: 'High tea', time: '4:00 PM', venue: 'The garden', mapUrl: '' },
        { name: 'Games and guesses', time: '5:00 PM', venue: 'Boy or girl? Place your bets', mapUrl: '' },
        { name: 'Blessings and cake', time: '6:00 PM', venue: 'Inside', mapUrl: '' }
      ],
      details: [
        { title: 'Colours', text: 'Soft pastels, if you would like to match the sky.' },
        { title: 'Gifts', text: 'Your blessings are plenty. A book for the baby’s first library would be lovely.' },
        { title: 'Little ones', text: 'Children are very welcome.' }
      ],
      photos: [{ src: '', caption: 'The day we found out' }, { src: '', caption: 'First scan' }, { src: '', caption: 'The nursery' }]
    },
    coverHtml: function (h) {
      return star('cl-s1') + star('cl-s2') + star('cl-s3') + star('cl-s4') +
        '<div class="cl-sky">' + moon() + '</div>' +
        h.E('title', 'h1', 'cl-title', { keep: true, hint: 'Title' }) +
        h.E('coverLine', 'p', 'cl-line', { hint: 'Small line' }) +
        '<button type="button" class="mo-open cl-open" data-open>Open the surprise</button>' +
        '<div class="cl-bank cl-bank--l" aria-hidden="true">' + cloud('cl-c1') + cloud('cl-c2') + '</div>' +
        '<div class="cl-bank cl-bank--r" aria-hidden="true">' + cloud('cl-c3') + cloud('cl-c4') + '</div>';
    },
    decor: function (name) {
      if (name === 'hero') return mobile() + '<div class="cl-drift cl-drift--1" aria-hidden="true" data-par="0.25">' + cloud('') + '</div><div class="cl-drift cl-drift--2" aria-hidden="true" data-par="-0.15">' + cloud('') + '</div>';
      if (name === 'note' || name === 'venue') return '<div class="cl-drift cl-drift--3" aria-hidden="true" data-par="0.2">' + cloud('') + '</div>';
      if (name === 'closing') return '<div class="cl-sky cl-sky--end" aria-hidden="true">' + moon() + '</div>';
      return '';
    },
    placeholder: function (path) {
      var n = parseInt((/\[(\d+)\]/.exec(path) || [0, 0])[1], 10) || 0;
      var bg = ['#ffe3ec', '#dbe7ff', '#fff3c9', '#dcf5ec'][n % 4];
      return '<svg viewBox="0 0 120 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="120" height="120" fill="' + bg + '"/>' +
        '<path d="M22 96 C8 96 6 78 20 76 C18 62 38 54 46 66 C52 50 78 50 82 68 C96 62 112 74 104 86 C116 86 116 96 104 96Z" fill="#fff"/>' +
        '<path d="M60 22 l4 10 11 1 -8 7 3 11 -10 -6 -10 6 3 -11 -8 -7 11 -1Z" fill="#ffd76a"/></svg>';
    }
  };
})();
