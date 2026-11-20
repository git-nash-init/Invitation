// The Sage Envelope - Wedding Invitation Config
(function () {
  const params = new URLSearchParams(location.search);
  const mode = params.has('edit') ? 'edit' : params.has('preview') ? 'preview' : 'view';
  const trial = params.has('trial');

  const DEFAULTS = {
    version: 1,
    finalized: false,
    invocation: { symbol: 'ganesha', religion: 'hindu', text: 'श्री गणेशाय नमः' },

    brideName: 'Ankita',
    groomName: 'Kaushik',
    title: 'Ankita & Kaushik',
    hostNames: ['Ankita', 'Kaushik'],

    welcomeText: 'Welcome to the wedding of',
    eventDate: 'Sunday, 07th Feb 2026',
    eventISO: '2026-02-07',
    venue: 'Fairmont, Udaipur',

    introNote: 'We’re counting down to the day we say “forever,” and we’re grateful to have you with us as we begin this new chapter.',

    ceremonies: [
      {
        id: 'sangeet',
        name: 'Sangeet',
        date: '5th February, 2026',
        time: '06:00 PM',
        venue: 'Grounds, Fairmont, Udaipur',
        mapUrl: 'https://maps.google.com/?q=Fairmont+Udaipur'
      },
      {
        id: 'mandap',
        name: 'Mandap Muhurat',
        date: '6th February, 2026',
        time: '10:00 AM',
        venue: 'Central Courtyard, Fairmont, Udaipur',
        mapUrl: 'https://maps.google.com/?q=Fairmont+Udaipur'
      },
      {
        id: 'wedding',
        name: 'The Wedding Ceremony',
        date: '7th February, 2026',
        time: '11:30 AM',
        venue: 'Lakeside Pavilion, Fairmont, Udaipur',
        mapUrl: 'https://maps.google.com/?q=Fairmont+Udaipur'
      },
      {
        id: 'reception',
        name: 'Grand Reception',
        date: '7th February, 2026',
        time: '07:30 PM',
        venue: 'Royal Ballroom, Fairmont, Udaipur',
        mapUrl: 'https://maps.google.com/?q=Fairmont+Udaipur'
      }
    ],

    journey: [
      { title: 'The First Spark', date: 'Spring 2022', desc: 'A serendipitous connection that sparked countless hours of shared dreams and laughter.' },
      { title: 'Growing Together', date: 'Winter 2023', desc: 'Through life’s adventures and quiet moments, finding home in each other’s presence.' },
      { title: 'The Forever Promise', date: 'Autumn 2024', desc: 'A serene twilight, a heartfelt question, and an enthusiastic yes.' }
    ],

    rsvp: {
      enabled: true,
      title: 'Kindly RSVP',
      deadline: 'Please let us know by 20th January 2026'
    }
  };

  const SE = {
    DEFAULTS: DEFAULTS,
    config: JSON.parse(JSON.stringify(DEFAULTS)),
    mode: mode,
    trial: trial,

    canEdit: function (path) {
      if (mode !== 'edit') return false;
      return true;
    },

    syncDerived: function () {
      const c = SE.config;
      c.title = (c.brideName || '') + ' & ' + (c.groomName || '');
      c.hostNames = [c.brideName || '', c.groomName || ''];
    },

    esc: function (s) {
      if (s == null) return '';
      return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
  };

  window.SageEnvelope = SE;
})();
