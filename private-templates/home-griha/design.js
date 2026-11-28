// Griha Pravesh - a traditional housewarming. The cover is the front door of the new home; it swings open.
(function () {
  function toran() {
    var s = '';
    for (var i = 0; i < 11; i++) {
      var x = 20 + i * 36;
      s += i % 2 === 0
        ? '<g transform="translate(' + x + ' 26)"><circle r="13" fill="var(--gp-gold)"/><circle r="8" fill="var(--mo-accent)"/><circle r="3.5" fill="var(--gp-gold)"/></g>'
        : '<path transform="translate(' + x + ' 16)" d="M0 0 C-11 14 -9 40 0 54 C9 40 11 14 0 0Z" fill="var(--gp-leaf)"/>';
    }
    return '<svg class="gp-toran" viewBox="0 0 400 78" preserveAspectRatio="xMidYMin meet" aria-hidden="true"><path d="M0 16 H400" stroke="var(--gp-leaf)" stroke-width="4"/>' + s + '</svg>';
  }
  function panel(side) {
    var knobX = side === 'l' ? 84 : 16;
    return '<svg class="gp-leafdoor" viewBox="0 0 100 220" preserveAspectRatio="none" aria-hidden="true">' +
      '<rect width="100" height="220" fill="var(--gp-wood)"/>' +
      '<rect x="10" y="12" width="80" height="84" rx="4" fill="none" stroke="var(--gp-wood-2)" stroke-width="5"/>' +
      '<rect x="10" y="112" width="80" height="96" rx="4" fill="none" stroke="var(--gp-wood-2)" stroke-width="5"/>' +
      '<g fill="var(--gp-gold)"><circle cx="50" cy="54" r="12"/><circle cx="50" cy="54" r="5" fill="var(--gp-wood)"/><circle cx="50" cy="160" r="12"/><circle cx="50" cy="160" r="5" fill="var(--gp-wood)"/>' +
      '<circle cx="20" cy="22" r="3"/><circle cx="80" cy="22" r="3"/><circle cx="20" cy="86" r="3"/><circle cx="80" cy="86" r="3"/><circle cx="20" cy="122" r="3"/><circle cx="80" cy="122" r="3"/><circle cx="20" cy="198" r="3"/><circle cx="80" cy="198" r="3"/></g>' +
      '<circle cx="' + knobX + '" cy="108" r="7" fill="var(--gp-gold)" stroke="var(--gp-wood-2)" stroke-width="2"/></svg>';
  }
  function rangoli(cls) {
    var p = '';
    for (var i = 0; i < 8; i++) p += '<g transform="rotate(' + i * 45 + ' 100 100)"><path d="M100 14 C118 44 118 66 100 86 C82 66 82 44 100 14Z" fill="var(--mo-accent)"/><path d="M100 36 C108 52 108 62 100 74 C92 62 92 52 100 36Z" fill="var(--gp-gold)"/><circle cx="100" cy="8" r="4" fill="var(--gp-leaf)"/></g>';
    return '<svg class="gp-rangoli ' + cls + '" viewBox="0 0 200 200" aria-hidden="true">' + p + '<circle cx="100" cy="100" r="16" fill="var(--gp-gold)"/><circle cx="100" cy="100" r="7" fill="var(--mo-accent)"/></svg>';
  }
  function kalash() {
    return '<svg class="gp-kalash" viewBox="0 0 120 150" aria-hidden="true">' +
      '<path d="M60 6 C50 22 52 30 60 38 C68 30 70 22 60 6Z" fill="var(--gp-leaf)"/><path d="M36 34 C36 20 50 26 56 40Z M84 34 C84 20 70 26 64 40Z" fill="var(--gp-leaf)"/>' +
      '<circle cx="60" cy="46" r="15" fill="#b5651d"/>' +
      '<path d="M40 60 H80 V68 C104 78 106 124 80 138 H40 C14 124 16 78 40 68Z" fill="var(--gp-gold)"/>' +
      '<path d="M40 60 H80" stroke="var(--mo-accent)" stroke-width="6" stroke-linecap="round"/><path d="M30 98 H90" stroke="var(--mo-accent)" stroke-width="4"/>' +
      '<path d="M60 84 l5 9 10 1 -8 7 3 10 -10 -6 -10 6 3 -10 -8 -7 10 -1Z" fill="var(--mo-accent)"/></svg>';
  }

  window.MomentsDesign = {
    id: 'home-griha',
    openMs: 1900,
    headings: { countdown: 'Until we open the door', schedule: 'The day', details: 'Good to know', gallery: 'Our new home', venue: 'Our new address', rsvp: 'Will you come home?' },
    fx: { kind: 'petals', layer: 'front', count: 14, colors: ['#f4a300', '#c1121f', '#ffcf56', '#e85d04'], burstCount: 80 },
    palettes: [
      { name: 'Vermilion', swatch: ['#fdf0d5', '#c1121f', '#f4a300'], vars: { '--mo-bg': '#fdf0d5', '--mo-bg-2': '#f7dcaa', '--mo-ink': '#3a1f0d', '--mo-muted': '#7a5a3f', '--mo-accent': '#c1121f', '--gp-gold': '#f4a300', '--gp-leaf': '#386641', '--gp-wood': '#7f4f24', '--gp-wood-2': '#582f0e' } },
      { name: 'Teak and jasmine', swatch: ['#f8f4e9', '#588157', '#bc8a5f'], vars: { '--mo-bg': '#f8f4e9', '--mo-bg-2': '#e9e2cc', '--mo-ink': '#33291c', '--mo-muted': '#6f6250', '--mo-accent': '#588157', '--gp-gold': '#dda15e', '--gp-leaf': '#3a5a40', '--gp-wood': '#9c6644', '--gp-wood-2': '#6f4518' } },
      { name: 'Indigo haveli', swatch: ['#eef1fb', '#1d3fbf', '#f2b134'], vars: { '--mo-bg': '#eef1fb', '--mo-bg-2': '#d5dcf6', '--mo-ink': '#141c4a', '--mo-muted': '#4b5587', '--mo-accent': '#e4572e', '--gp-gold': '#f2b134', '--gp-leaf': '#2a9d8f', '--gp-wood': '#27429f', '--gp-wood-2': '#162a70' } },
      { name: 'Rosewood', swatch: ['#fff0ef', '#9d174d', '#e9b949'], vars: { '--mo-bg': '#fff0ef', '--mo-bg-2': '#fbd5d5', '--mo-ink': '#4a0d24', '--mo-muted': '#84525f', '--mo-accent': '#9d174d', '--gp-gold': '#e9b949', '--gp-leaf': '#588157', '--gp-wood': '#7c2d3f', '--gp-wood-2': '#4a0d24' } }
    ],
    defaults: {
      kicker: 'गृह प्रवेश · Housewarming',
      title: 'The Iyers have a new home',
      subtitle: 'Come step in with us. The first cup of chai is on the house.',
      hostLine: 'Lakshmi, Venkat, Anu and little Kabir',
      eventDate: 'Sunday, 24 January 2027',
      eventTime: 'Puja at 9:00 AM, lunch to follow',
      eventISO: '2027-01-24T09:00',
      venue: 'Flat 1204, Tower C, Palm Meadows\nWhitefield, Bengaluru',
      note: 'After years of dreaming and many months of dust, the door is finally ours to open. A home is only a house until the people we love walk in.',
      noteSign: 'The Iyer family',
      closing: 'Our door is open',
      coverTop: 'A new door opens',
      coverLine: 'and we want you on the other side',
      events: [
        { name: 'Griha Pravesh puja', time: '9:00 AM', venue: 'At the new home', mapUrl: '' },
        { name: 'Boiling of the milk', time: '10:15 AM', venue: 'In the new kitchen', mapUrl: '' },
        { name: 'Lunch', time: '12:30 PM', venue: 'Community hall, ground floor', mapUrl: '' }
      ],
      details: [
        { title: 'Parking', text: 'Visitor parking is at Gate 2. Tell security you are here for 1204.' },
        { title: 'Footwear', text: 'Shoes off at the door, please. We have a rack ready.' },
        { title: 'No gifts, please', text: 'Bring your blessings and an empty stomach.' }
      ],
      photos: [{ src: '', caption: 'The living room' }, { src: '', caption: 'The balcony view' }, { src: '', caption: 'Kabir’s room' }]
    },
    coverHtml: function (h) {
      return h.E('coverTop', 'p', 'gp-top', { hint: 'Small line' }) +
        '<div class="gp-house"><div class="gp-arch">' + toran() +
        '<div class="gp-inside" aria-hidden="true">' + kalash() + '</div>' +
        '<div class="gp-door gp-door--l" aria-hidden="true">' + panel('l') + '</div>' +
        '<div class="gp-door gp-door--r" aria-hidden="true">' + panel('r') + '</div>' +
        '</div>' + rangoli('gp-step') + '</div>' +
        h.E('title', 'h1', 'gp-title', { keep: true, hint: 'Title' }) +
        h.E('coverLine', 'p', 'gp-line', { hint: 'Small line' }) +
        '<button type="button" class="mo-open gp-open" data-open>Open the door</button>';
    },
    decor: function (name) {
      if (name === 'hero') return toran() + rangoli('gp-r1');
      if (name === 'note') return '<div class="gp-kal" aria-hidden="true">' + kalash() + '</div>';
      if (name === 'venue') return rangoli('gp-r2');
      if (name === 'closing') return rangoli('gp-r3');
      return '';
    },
    placeholder: function (path) {
      var n = parseInt((/\[(\d+)\]/.exec(path) || [0, 0])[1], 10) || 0;
      var bg = ['#ffe0b0', '#f9cfc4', '#dfe9cf', '#f6e3b4'][n % 4];
      return '<svg viewBox="0 0 120 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="120" height="120" fill="' + bg + '"/>' +
        '<path d="M24 62 L60 30 L96 62 V98 H24Z" fill="#fff8ea" stroke="#7f4f24" stroke-width="4" stroke-linejoin="round"/><path d="M16 66 L60 26 L104 66" fill="none" stroke="#c1121f" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<rect x="50" y="68" width="20" height="30" fill="#7f4f24"/><rect x="32" y="68" width="12" height="12" fill="#f4a300"/><rect x="76" y="68" width="12" height="12" fill="#f4a300"/></svg>';
    }
  };
})();
