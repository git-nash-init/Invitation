// Polaroid Party - a scrapbook birthday. The cover is a taped polaroid; flipping it over opens the book.
(function () {
  function star(cls) {
    return '<svg class="pol-doodle ' + cls + '" viewBox="0 0 60 60" aria-hidden="true"><path d="M30 5 L36 22 L55 23 L40 34 L46 53 L30 42 L14 53 L20 34 L5 23 L24 22Z" fill="var(--mo-accent-2)" stroke="var(--mo-ink)" stroke-width="2.5" stroke-linejoin="round"/></svg>';
  }
  function heart(cls) {
    return '<svg class="pol-doodle ' + cls + '" viewBox="0 0 60 60" aria-hidden="true"><path d="M30 52 C8 36 6 20 16 13 C23 8 29 13 30 19 C31 13 37 8 44 13 C54 20 52 36 30 52Z" fill="var(--mo-accent)" stroke="var(--mo-ink)" stroke-width="2.5" stroke-linejoin="round"/></svg>';
  }
  function squiggle(cls) {
    return '<svg class="pol-doodle ' + cls + '" viewBox="0 0 120 30" aria-hidden="true"><path d="M4 16 Q14 2 24 16 T44 16 T64 16 T84 16 T104 16 T116 12" fill="none" stroke="var(--pol-pen)" stroke-width="3.5" stroke-linecap="round"/></svg>';
  }

  window.MomentsDesign = {
    id: 'birthday-polaroid',
    openMs: 1500,
    headings: { countdown: 'Days until cake', schedule: 'The plan, roughly', details: 'Notes in the margin', gallery: 'The scrapbook', venue: 'Come find us', rsvp: 'Coming? Tell us' },
    fx: { kind: 'confetti', layer: 'front', count: 0, colors: ['#d1495b', '#edae49', '#00798c', '#30638e', '#f7f1e3'], burstCount: 80 },
    palettes: [
      { name: 'Kraft paper', swatch: ['#f1e6d2', '#d1495b', '#00798c'], vars: { '--mo-bg': '#f1e6d2', '--mo-bg-2': '#e6d6b8', '--mo-ink': '#2d2a26', '--mo-muted': '#6a6157', '--mo-card': '#fffdf6', '--mo-accent': '#d1495b', '--mo-accent-2': '#edae49', '--pol-pen': '#00798c', '--pol-tape': 'rgba(237, 174, 73, 0.75)' } },
      { name: 'Pink diary', swatch: ['#ffe9ee', '#e5446d', '#7b2cbf'], vars: { '--mo-bg': '#ffe9ee', '--mo-bg-2': '#ffd3dd', '--mo-ink': '#3a1a2a', '--mo-muted': '#7a5564', '--mo-card': '#ffffff', '--mo-accent': '#e5446d', '--mo-accent-2': '#ffc857', '--pol-pen': '#7b2cbf', '--pol-tape': 'rgba(123, 44, 191, 0.4)' } },
      { name: 'Midnight zine', swatch: ['#1f1d24', '#ff5d8f', '#b8f2e6'], vars: { '--mo-bg': '#1f1d24', '--mo-bg-2': '#2b2833', '--mo-ink': '#f6f1e7', '--mo-muted': '#b7b0a3', '--mo-card': '#f6f1e7', '--mo-accent': '#ff5d8f', '--mo-accent-2': '#ffd166', '--pol-pen': '#b8f2e6', '--pol-tape': 'rgba(184, 242, 230, 0.6)' } },
      { name: 'Sage journal', swatch: ['#e9eddc', '#bc4b51', '#5b8e7d'], vars: { '--mo-bg': '#e9eddc', '--mo-bg-2': '#d8dfc4', '--mo-ink': '#283026', '--mo-muted': '#5f6b5a', '--mo-card': '#fffef8', '--mo-accent': '#bc4b51', '--mo-accent-2': '#f4a259', '--pol-pen': '#5b8e7d', '--pol-tape': 'rgba(91, 142, 125, 0.5)' } }
    ],
    defaults: {
      kicker: 'Save the date, bestie',
      title: 'Kiara’s 18th',
      subtitle: 'Eighteen years in pictures, and one very good party.',
      hostLine: 'With love from Mum, Dad and Vihaan',
      eventDate: 'Friday, 20 August 2027',
      eventTime: '7:00 PM',
      eventISO: '2027-08-20T19:00',
      venue: 'Our terrace, Flat 14B\nSea View Apartments, Juhu, Mumbai',
      note: 'I kept every photo, every ticket stub and every silly note. Now I am officially an adult and I would love you there when I blow out the candles.',
      noteSign: 'xoxo, Kiara',
      closing: 'Bring your camera roll',
      coverLine: 'a little book of big memories',
      coverPhoto: '',
      events: [
        { name: 'Snacks and stories', time: '7:00 PM', venue: 'The terrace', mapUrl: '' },
        { name: 'Polaroid wall', time: '8:00 PM', venue: 'Take one, leave one', mapUrl: '' },
        { name: 'Candles and cake', time: '9:30 PM', venue: 'Make a wish with me', mapUrl: '' }
      ],
      details: [
        { title: 'Dress', text: 'Comfy and cute. We are sitting on floor cushions.' },
        { title: 'Bring', text: 'One printed photo of us for the memory wall.' },
        { title: 'P.S.', text: 'Phones out for pictures, away for the cake.' }
      ],
      photos: [{ src: '', caption: 'first day of school' }, { src: '', caption: 'that goa trip' }, { src: '', caption: 'besties forever' }, { src: '', caption: 'sweet seventeen' }]
    },
    coverHtml: function (h) {
      var src = h.cfg.coverPhoto;
      var pick = h.edit ? ' data-pick-photo="coverPhoto"' : '';
      var img = src ? '<img class="pol-shot" src="' + h.esc(src) + '" alt=""' + pick + '>' :
        '<div class="pol-shot pol-shot--empty"' + pick + '>' + this.placeholder('cover') + (h.edit ? '<span class="mo-photo__add" data-no-wording>Add a photo</span>' : '') + '</div>';
      return star('pol-d1') + heart('pol-d2') + squiggle('pol-d3') +
        '<div class="pol-stack"><div class="pol-card pol-card--b"></div><div class="pol-card pol-card--a"></div>' +
        '<div class="pol-card pol-card--top"><i class="pol-tape"></i>' + img +
        h.E('title', 'h1', 'pol-title', { keep: true, hint: 'Title' }) + '</div></div>' +
        h.E('coverLine', 'p', 'pol-line', { hint: 'Small line' }) +
        '<button type="button" class="mo-open pol-open" data-open>Tap to flip</button>';
    },
    decor: function (name) {
      if (name === 'hero') return star('pol-h1') + heart('pol-h2') + squiggle('pol-h3');
      if (name === 'gallery') return squiggle('pol-g1');
      if (name === 'closing') return heart('pol-c1') + star('pol-c2');
      return '';
    },
    placeholder: function (path) {
      var n = parseInt((/\[(\d+)\]/.exec(path) || [0, 0])[1], 10) || 0;
      var sky = ['#f7d9c4', '#c9e4de', '#fde2e4', '#dbe7f0'][n % 4];
      return '<svg viewBox="0 0 120 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="120" height="120" fill="' + sky + '"/>' +
        '<circle cx="88" cy="32" r="14" fill="#fff6d6"/><path d="M0 92 Q30 62 60 86 T120 78 V120 H0Z" fill="#8fb9a8"/><path d="M0 104 Q40 84 70 100 T120 96 V120 H0Z" fill="#6c9a8b"/></svg>';
    }
  };
})();
