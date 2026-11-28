// Level Up - a neon arcade birthday. The cover is a game start screen; pressing start loads the level.
window.MomentsDesign = {
  id: 'birthday-arcade',
  openMs: 1700,
  headings: {
    countdown: 'Next level in',
    schedule: 'Stages',
    details: 'Player guide',
    gallery: 'High scores',
    venue: 'The arena',
    rsvp: 'Ready, player?'
  },
  fx: { kind: 'pixels', layer: 'back', count: 34, colors: ['#ff2e88', '#2ef5ff', '#c6ff3d', '#ffffff'], burstCount: 90 },
  palettes: [
    { name: 'Neon night', swatch: ['#0b0620', '#ff2e88', '#2ef5ff'], vars: { '--mo-bg': '#0b0620', '--mo-bg-2': '#170b3a', '--mo-accent': '#ff2e88', '--mo-accent-2': '#2ef5ff', '--mo-pop': '#c6ff3d' } },
    { name: 'Vaporwave', swatch: ['#1a0b2e', '#ff7a3d', '#b967ff'], vars: { '--mo-bg': '#1a0b2e', '--mo-bg-2': '#2d1250', '--mo-accent': '#ff7a3d', '--mo-accent-2': '#b967ff', '--mo-pop': '#ffe66d' } },
    { name: 'Matrix lime', swatch: ['#050805', '#9dff3d', '#3dffb3'], vars: { '--mo-bg': '#050805', '--mo-bg-2': '#0d160c', '--mo-accent': '#9dff3d', '--mo-accent-2': '#3dffb3', '--mo-pop': '#ffffff', '--mo-on-accent': '#061006' } },
    { name: 'Ice blue', swatch: ['#06112b', '#4d9bff', '#8cf3ff'], vars: { '--mo-bg': '#06112b', '--mo-bg-2': '#0c1f4a', '--mo-accent': '#4d9bff', '--mo-accent-2': '#8cf3ff', '--mo-pop': '#ffd23d' } }
  ],
  defaults: {
    kicker: 'New level unlocked',
    title: 'Aarav turns 21',
    subtitle: 'One night. Loud music. Zero chill.',
    hostLine: 'Hosted by Riya, Kabir and the whole squad',
    eventDate: 'Saturday, 14 March 2027',
    eventTime: '8:00 PM till late',
    eventISO: '2027-03-14T20:00',
    venue: 'The Rooftop, Linking Road\nBandra West, Mumbai',
    note: 'Twenty-one years of chaos deserve a proper party. Bring your best moves and your worst dance ideas. Cake drops at midnight.',
    noteSign: 'Aarav',
    closing: 'Game on. See you there',
    coverTop: 'Player 1',
    coverLine: 'Birthday mode',
    events: [
      { name: 'Doors open', time: '8:00 PM', venue: 'The Rooftop, Bandra West', mapUrl: '' },
      { name: 'Cake and toast', time: '10:00 PM', venue: 'Main deck', mapUrl: '' },
      { name: 'Dance floor', time: '10:30 PM', venue: 'Till the DJ gives up', mapUrl: '' }
    ],
    details: [
      { title: 'Dress code', text: 'Neon, glitter, or anything that glows in the dark.' },
      { title: 'Gifts', text: 'Your presence is the present. If you insist, bring a song request.' },
      { title: 'Getting there', text: 'Parking is tight. Cabs and autos are your friends.' }
    ],
    photos: [
      { src: '', caption: 'Level 1' },
      { src: '', caption: 'Level 12' },
      { src: '', caption: 'Level 18' },
      { src: '', caption: 'Level 20' }
    ]
  },

  coverHtml: function (h) {
    return '<div class="arc-grid" aria-hidden="true"></div>' +
      '<div class="arc-sun" aria-hidden="true"></div>' +
      '<div class="arc-screen">' +
      h.E('coverTop', 'p', 'arc-p1', { hint: 'Small line' }) +
      h.E('title', 'h1', 'arc-title', { keep: true, hint: 'Title' }) +
      h.E('coverLine', 'p', 'arc-mode', { hint: 'Line under the title' }) +
      '<button type="button" class="mo-open arc-start" data-open>Press start</button>' +
      '<p class="arc-coin" aria-hidden="true" data-no-wording>INSERT COIN ● ● ●</p>' +
      '<div class="arc-load" aria-hidden="true"><i></i></div>' +
      '</div>';
  },

  heroHtml: function (h) {
    return h.E('kicker', 'p', 'mo-kicker arc-kicker', { hint: 'Small line' }) +
      h.E('title', 'h1', 'mo-title arc-glitch', { keep: true, hint: 'Title' }) +
      h.E('subtitle', 'p', 'mo-subtitle', { hint: 'One line about it' });
  },

  decor: function (name) {
    if (name === 'hero') return '<div class="arc-grid arc-grid--hero" aria-hidden="true" data-par="0.12"></div><div class="arc-sun arc-sun--hero" aria-hidden="true" data-par="0.2"></div>';
    return '';
  },

  placeholder: function () {
    return '<svg viewBox="0 0 120 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<rect width="120" height="120" fill="var(--mo-bg-2)"/>' +
      '<g fill="var(--mo-accent)"><rect x="40" y="38" width="12" height="12"/><rect x="68" y="38" width="12" height="12"/><rect x="28" y="50" width="64" height="12"/><rect x="28" y="62" width="64" height="12"/><rect x="40" y="74" width="40" height="12"/><rect x="52" y="86" width="16" height="10"/></g>' +
      '<g fill="var(--mo-accent-2)" opacity=".9"><rect x="40" y="50" width="12" height="12"/></g></svg>';
  }
};
