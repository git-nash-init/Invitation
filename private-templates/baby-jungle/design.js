// Little Jungle - a safari baby shower. Big leaves cover the page; they swing apart and a lion cub peeks out.
(function () {
  function leaf(cls) {
    return '<svg class="jg-leaf ' + cls + '" viewBox="0 0 200 320" aria-hidden="true">' +
      '<path d="M100 316 C20 250 0 150 30 70 C50 20 90 4 100 4 C110 4 150 20 170 70 C200 150 180 250 100 316Z" fill="var(--jg-leaf)"/>' +
      '<path d="M100 310 V20 M100 250 L44 196 M100 250 L156 196 M100 190 L36 132 M100 190 L164 132 M100 130 L52 84 M100 130 L148 84" fill="none" stroke="var(--jg-vein)" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M30 70 L62 108 M22 150 L56 168 M170 70 L138 108 M178 150 L144 168" stroke="var(--mo-bg)" stroke-width="13" stroke-linecap="round"/></svg>';
  }
  function palm(cls) {
    return '<svg class="jg-leaf ' + cls + '" viewBox="0 0 260 200" aria-hidden="true"><g fill="none" stroke="var(--jg-leaf-2)" stroke-width="16" stroke-linecap="round">' +
      '<path d="M10 190 C60 120 130 60 250 30"/><path d="M48 150 C40 110 60 70 100 40"/><path d="M92 112 C96 72 130 40 176 26"/><path d="M60 138 C100 150 150 150 196 124"/><path d="M110 98 C150 110 200 100 236 70"/></g></svg>';
  }
  function lion() {
    return '<svg class="jg-lion" viewBox="0 0 200 200" aria-hidden="true">' +
      '<g fill="var(--jg-mane)">' + [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(function (a) { return '<circle cx="100" cy="30" r="24" transform="rotate(' + a + ' 100 100)"/>'; }).join('') + '</g>' +
      '<circle cx="100" cy="100" r="58" fill="var(--jg-fur)"/>' +
      '<circle cx="56" cy="52" r="16" fill="var(--jg-fur)"/><circle cx="144" cy="52" r="16" fill="var(--jg-fur)"/><circle cx="56" cy="52" r="8" fill="#f6b8a0"/><circle cx="144" cy="52" r="8" fill="#f6b8a0"/>' +
      '<g class="jg-eyes"><ellipse cx="80" cy="94" rx="6" ry="8" fill="#3b2a1a"/><ellipse cx="120" cy="94" rx="6" ry="8" fill="#3b2a1a"/><circle cx="82" cy="91" r="2" fill="#fff"/><circle cx="122" cy="91" r="2" fill="#fff"/></g>' +
      '<ellipse cx="100" cy="122" rx="24" ry="18" fill="#fff4dc"/><path d="M92 112 h16 l-8 9Z" fill="#3b2a1a"/>' +
      '<path d="M100 121 v6 M100 127 q-8 8 -14 2 M100 127 q8 8 14 2" fill="none" stroke="#3b2a1a" stroke-width="2.5" stroke-linecap="round"/>' +
      '<circle cx="66" cy="114" r="7" fill="#f6a58c" opacity=".7"/><circle cx="134" cy="114" r="7" fill="#f6a58c" opacity=".7"/></svg>';
  }
  function paw(cls) {
    return '<svg class="jg-paw ' + cls + '" viewBox="0 0 60 60" aria-hidden="true"><g fill="var(--mo-accent-2)"><ellipse cx="30" cy="40" rx="14" ry="11"/><circle cx="12" cy="24" r="6"/><circle cx="24" cy="14" r="6"/><circle cx="38" cy="14" r="6"/><circle cx="49" cy="25" r="6"/></g></svg>';
  }

  window.MomentsDesign = {
    id: 'baby-jungle',
    openMs: 1600,
    headings: { countdown: 'The wild wait', schedule: 'The safari plan', details: 'Jungle rules', gallery: 'Our little pride', venue: 'The watering hole', rsvp: 'Join the herd?' },
    fx: { kind: 'leaves', layer: 'front', count: 12, colors: ['#5b8c5a', '#8fb996', '#e9c46a', '#3d6b4f'], burstCount: 70 },
    palettes: [
      { name: 'Safari', swatch: ['#f4f1e4', '#e07a5f', '#5b8c5a'], vars: { '--mo-bg': '#f4f1e4', '--mo-bg-2': '#e8e2c8', '--mo-ink': '#2c3a2b', '--mo-muted': '#5f6d58', '--mo-card': '#fffdf5', '--mo-accent': '#e07a5f', '--mo-accent-2': '#e9c46a', '--jg-leaf': '#5b8c5a', '--jg-leaf-2': '#3d6b4f', '--jg-vein': '#3d6b4f', '--jg-fur': '#f2b872', '--jg-mane': '#c97b3c' } },
      { name: 'Rainforest', swatch: ['#12372a', '#fbfada', '#adbc9f'], vars: { '--mo-bg': '#12372a', '--mo-bg-2': '#1d4d3c', '--mo-ink': '#fbfada', '--mo-muted': '#c4d4b6', '--mo-card': 'rgba(255, 255, 255, 0.09)', '--mo-line': 'rgba(251, 250, 218, 0.24)', '--mo-accent': '#f4a259', '--mo-accent-2': '#ffd97d', '--mo-on-accent': '#12372a', '--jg-leaf': '#2f7d5b', '--jg-leaf-2': '#43a174', '--jg-vein': '#12372a', '--jg-fur': '#f2b872', '--jg-mane': '#c97b3c' } },
      { name: 'Sunset savanna', swatch: ['#fde8d0', '#d1603d', '#7a9e7e'], vars: { '--mo-bg': '#fde8d0', '--mo-bg-2': '#fbd0a6', '--mo-ink': '#4a2416', '--mo-muted': '#85543f', '--mo-card': '#fffaf2', '--mo-accent': '#d1603d', '--mo-accent-2': '#f3b23c', '--jg-leaf': '#7a9e7e', '--jg-leaf-2': '#55795a', '--jg-vein': '#4f7455', '--jg-fur': '#f6c06f', '--jg-mane': '#b9602a' } },
      { name: 'Pastel zoo', swatch: ['#f1f8f0', '#ff8fa3', '#9ad1b0'], vars: { '--mo-bg': '#f1f8f0', '--mo-bg-2': '#dcefe0', '--mo-ink': '#33473b', '--mo-muted': '#657c6c', '--mo-card': '#ffffff', '--mo-accent': '#ff8fa3', '--mo-accent-2': '#ffd6a5', '--jg-leaf': '#9ad1b0', '--jg-leaf-2': '#6fb890', '--jg-vein': '#5aa27c', '--jg-fur': '#ffd79a', '--jg-mane': '#f0a868' } }
    ],
    defaults: {
      kicker: 'A wild one is on the way',
      title: 'Welcome to the jungle, baby',
      subtitle: 'A baby shower for Ishita and Dev, and their soon-to-arrive cub.',
      hostLine: 'Hosted by the Mehra and Kapoor families',
      eventDate: 'Saturday, 17 July 2027',
      eventTime: '11:00 AM brunch',
      eventISO: '2027-07-17T11:00',
      venue: 'The Glasshouse, Lodhi Gardens Road\nNew Delhi',
      note: 'Our pride is growing by four tiny paws. Come roar, laugh and eat with us before the adventure begins.',
      noteSign: 'Ishita and Dev',
      closing: 'See you in the jungle',
      coverLine: 'Something is hiding in the leaves',
      events: [
        { name: 'Brunch buffet', time: '11:00 AM', venue: 'The Glasshouse', mapUrl: '' },
        { name: 'Jungle games', time: '12:30 PM', venue: 'Guess the baby animal', mapUrl: '' },
        { name: 'Cake and wishes', time: '1:30 PM', venue: 'Under the big tree', mapUrl: '' }
      ],
      details: [
        { title: 'Dress code', text: 'Greens, khaki and animal print. Subtle or wild, your call.' },
        { title: 'Gift idea', text: 'Bring a book instead of a card, and sign the first page.' },
        { title: 'Cubs welcome', text: 'There is a play corner for children.' }
      ],
      photos: [{ src: '', caption: 'Mum and Dad' }, { src: '', caption: 'The first kick' }, { src: '', caption: 'Nursery, almost done' }]
    },
    coverHtml: function (h) {
      return '<div class="jg-peek" aria-hidden="true">' + lion() + '</div>' +
        h.E('title', 'h1', 'jg-title', { keep: true, hint: 'Title' }) +
        h.E('coverLine', 'p', 'jg-line', { hint: 'Small line' }) +
        '<button type="button" class="mo-open jg-open" data-open>Peek inside</button>' +
        '<div class="jg-wall" aria-hidden="true">' + leaf('jg-l1') + leaf('jg-l2') + leaf('jg-l3') + leaf('jg-l4') + palm('jg-p1') + palm('jg-p2') + '</div>';
    },
    decor: function (name) {
      if (name === 'hero') return leaf('jg-h1') + leaf('jg-h2') + palm('jg-h3') + '<div class="jg-heropeek" aria-hidden="true" data-par="0.1">' + lion() + '</div>';
      if (name === 'schedule') return paw('jg-pw1') + paw('jg-pw2') + paw('jg-pw3');
      if (name === 'gallery' || name === 'venue') return palm('jg-s1');
      if (name === 'closing') return leaf('jg-e1') + leaf('jg-e2');
      return '';
    },
    placeholder: function (path) {
      var n = parseInt((/\[(\d+)\]/.exec(path) || [0, 0])[1], 10) || 0;
      var bg = ['#f6ddb0', '#cfe3c6', '#f7c9b6', '#d6e6f2'][n % 4];
      return '<svg viewBox="0 0 120 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="120" height="120" fill="' + bg + '"/>' +
        '<circle cx="60" cy="64" r="24" fill="#f2b872"/><circle cx="42" cy="44" r="9" fill="#f2b872"/><circle cx="78" cy="44" r="9" fill="#f2b872"/>' +
        '<circle cx="52" cy="60" r="3" fill="#3b2a1a"/><circle cx="68" cy="60" r="3" fill="#3b2a1a"/><ellipse cx="60" cy="72" rx="9" ry="7" fill="#fff4dc"/><path d="M57 69 h6 l-3 4Z" fill="#3b2a1a"/>' +
        '<path d="M0 120 C10 96 26 92 34 120Z M120 120 C110 92 94 90 86 120Z" fill="#5b8c5a"/></svg>';
    }
  };
})();
