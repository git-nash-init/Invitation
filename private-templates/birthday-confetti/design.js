// Confetti Pop - a loud, bright birthday. The cover is a bunch of balloons; popping the big one opens it.
(function () {
  function balloon(cls, color) {
    return '<svg class="pop-balloon ' + cls + '" viewBox="0 0 100 170" aria-hidden="true">' +
      '<path d="M50 118 C52 132 44 144 50 168" fill="none" stroke="var(--mo-ink)" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M50 6 C78 6 94 30 94 58 C94 90 68 114 50 114 C32 114 6 90 6 58 C6 30 22 6 50 6Z" fill="' + color + '" stroke="var(--mo-ink)" stroke-width="3.5"/>' +
      '<path d="M44 112 L56 112 L52 122 L48 122Z" fill="' + color + '" stroke="var(--mo-ink)" stroke-width="3"/>' +
      '<path d="M26 40 C30 26 40 20 48 19" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/></svg>';
  }
  function bunting() {
    var flags = '';
    var cols = ['var(--mo-accent)', 'var(--mo-accent-2)', 'var(--mo-pop)', 'var(--pop-4)', 'var(--pop-5)'];
    for (var i = 0; i < 9; i++) {
      var x = 10 + i * 42, y = 14 + Math.sin(i / 8 * Math.PI) * 26;
      flags += '<path d="M' + x + ' ' + y.toFixed(1) + ' l34 0 l-17 34Z" fill="' + cols[i % 5] + '" stroke="var(--mo-ink)" stroke-width="2.5" stroke-linejoin="round"/>';
    }
    return '<svg class="pop-bunting" viewBox="0 0 400 90" preserveAspectRatio="xMidYMin meet" aria-hidden="true">' +
      '<path d="M0 8 Q200 78 400 8" fill="none" stroke="var(--mo-ink)" stroke-width="2.5"/>' + flags + '</svg>';
  }

  window.MomentsDesign = {
    id: 'birthday-confetti',
    openMs: 1300,
    headings: { countdown: 'Party starts in', schedule: 'What is happening', details: 'The small print', gallery: 'Cute then, cuter now', venue: 'Where the party is', rsvp: 'Are you in?' },
    fx: { kind: 'confetti', layer: 'front', count: 26, colors: ['#ff4d6d', '#ffbe0b', '#3a86ff', '#8338ec', '#06d6a0'], burstCount: 120 },
    palettes: [
      { name: 'Party pop', swatch: ['#fff6e9', '#ff4d6d', '#3a86ff'], vars: { '--mo-bg': '#fff6e9', '--mo-bg-2': '#ffe6c7', '--mo-ink': '#1c1530', '--mo-muted': '#5a5170', '--mo-card': '#ffffff', '--mo-line': '#1c1530', '--mo-accent': '#ff4d6d', '--mo-accent-2': '#ffbe0b', '--mo-pop': '#3a86ff', '--pop-4': '#8338ec', '--pop-5': '#06d6a0', '--mo-on-accent': '#ffffff' } },
      { name: 'Sorbet', swatch: ['#fff5f7', '#ff8fab', '#7bdff2'], vars: { '--mo-bg': '#fff5f7', '--mo-bg-2': '#ffe5ec', '--mo-accent': '#ff8fab', '--mo-accent-2': '#fcd581', '--mo-pop': '#7bdff2', '--pop-4': '#b79ced', '--pop-5': '#b2f7ef', '--mo-on-accent': '#2b1b2b' } },
      { name: 'Bold primary', swatch: ['#ffffff', '#e63946', '#1d3fbf'], vars: { '--mo-bg': '#ffffff', '--mo-bg-2': '#f1f1f1', '--mo-accent': '#e63946', '--mo-accent-2': '#ffd60a', '--mo-pop': '#1d3fbf', '--pop-4': '#111111', '--pop-5': '#2a9d8f' } },
      { name: 'Midnight party', swatch: ['#161032', '#ff4d6d', '#ffe45e'], vars: { '--mo-bg': '#161032', '--mo-bg-2': '#231a4d', '--mo-ink': '#fff8ea', '--mo-muted': '#c9c0e6', '--mo-card': '#241b52', '--mo-line': '#fff8ea', '--mo-accent': '#ff4d6d', '--mo-accent-2': '#ffe45e', '--mo-pop': '#4cc9f0', '--pop-4': '#b5179e', '--pop-5': '#80ffdb' } }
    ],
    defaults: {
      kicker: 'Big birthday energy',
      title: 'Myra is turning 25',
      subtitle: 'Cake, chaos and a playlist we will regret tomorrow.',
      hostLine: 'Thrown with love by her favourite humans',
      eventDate: 'Sunday, 9 May 2027',
      eventTime: '6:30 PM onwards',
      eventISO: '2027-05-09T18:30',
      venue: 'The Garden Café, 12th Main\nIndiranagar, Bengaluru',
      note: 'A quarter of a century of being fabulous calls for confetti. Come hungry, come happy, and come ready to sing loudly and badly.',
      noteSign: 'Team Myra',
      closing: 'Do not be late. There is cake',
      coverLine: 'One balloon stands between you and a party',
      events: [
        { name: 'Welcome drinks', time: '6:30 PM', venue: 'Garden deck', mapUrl: '' },
        { name: 'Games and photo booth', time: '7:30 PM', venue: 'Inside', mapUrl: '' },
        { name: 'Cake cutting', time: '9:00 PM', venue: 'Everyone gather round', mapUrl: '' }
      ],
      details: [
        { title: 'Wear', text: 'Your brightest colour. Black is banned for one night.' },
        { title: 'Bring', text: 'An embarrassing story about the birthday girl.' },
        { title: 'Gifts', text: 'Totally optional. Hugs are mandatory.' }
      ],
      photos: [{ src: '', caption: 'Age 3' }, { src: '', caption: 'Age 12' }, { src: '', caption: 'Age 21' }, { src: '', caption: 'Last year' }]
    },
    coverHtml: function (h) {
      return bunting() +
        '<div class="pop-bunch">' + balloon('pop-b1', 'var(--mo-accent-2)') + balloon('pop-b2', 'var(--mo-pop)') + balloon('pop-b3', 'var(--pop-5)') + balloon('pop-main', 'var(--mo-accent)') +
        '<span class="pop-bang" aria-hidden="true" data-no-wording>POP!</span></div>' +
        h.E('title', 'h1', 'pop-title', { keep: true, hint: 'Title' }) +
        '<button type="button" class="mo-open pop-open" data-open>Tap to pop</button>' +
        h.E('coverLine', 'p', 'pop-line', { hint: 'Small line' });
    },
    decor: function (name) {
      if (name === 'hero') return bunting() + '<span class="pop-dot pop-dot--1" aria-hidden="true" data-par="0.3"></span><span class="pop-dot pop-dot--2" aria-hidden="true" data-par="-0.2"></span><span class="pop-dot pop-dot--3" aria-hidden="true" data-par="0.18"></span>';
      if (name === 'countdown' || name === 'gallery') return '<div class="pop-strip" aria-hidden="true" data-no-wording><div>' + new Array(9).join('<b>HIP HIP HOORAY</b><i>★</i>') + '</div></div>';
      return '';
    },
    placeholder: function (path) {
      var cols = ['var(--mo-accent)', 'var(--mo-pop)', 'var(--mo-accent-2)', 'var(--pop-4)'];
      var n = parseInt((/\[(\d+)\]/.exec(path) || [0, 0])[1], 10) || 0;
      return '<svg viewBox="0 0 120 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="120" height="120" fill="' + cols[n % 4] + '"/>' +
        '<circle cx="60" cy="58" r="26" fill="#fff" opacity=".94"/><circle cx="51" cy="54" r="3.5" fill="#222"/><circle cx="69" cy="54" r="3.5" fill="#222"/>' +
        '<path d="M49 64 Q60 76 71 64" fill="none" stroke="#222" stroke-width="3" stroke-linecap="round"/>' +
        '<path d="M44 34 L60 12 L76 34Z" fill="var(--mo-accent-2)" stroke="#222" stroke-width="2.5" stroke-linejoin="round"/><circle cx="60" cy="12" r="4" fill="#fff" stroke="#222" stroke-width="2"/></svg>';
    }
  };
})();
