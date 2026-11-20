// The Crimson Monogram - Wedding Invitation Config
(function () {
  const params = new URLSearchParams(location.search);
  const mode = params.has('edit') ? 'edit' : params.has('preview') ? 'preview' : 'view';
  const trial = params.has('trial');

  const DEFAULTS = {
    version: 1,
    finalized: false,
    invocation: { symbol: 'ganesha', religion: 'hindu', text: '॥ श्री गणेशाय नमः ॥' },

    brideName: 'Ankita',
    groomName: 'Kaushik',
    title: 'Ankita & Kaushik',
    monogram: 'AK',
    hostNames: ['Ankita', 'Kaushik'],

    welcomeText: 'Together with their families',
    celebrationText: 'Request the honour of your presence at the wedding celebrations of',
    eventDate: '27th & 28th February, 2026',
    eventISO: '2026-02-27',
    venue: 'Umaid Bhawan Palace, Udaipur',

    story: {
      title: 'Our Story',
      subtitle: 'Two souls, one beautiful journey',
      quote: '“He asked, and with joyful tears I whispered forever.”',
      body: 'They’ve been inseparable since their first date over coffee, but it was on a serene evening overlooking the lake that Kaushik finally asked Ankita to make it forever. Ankita recalls: “He had recreated our very first picnic, complete with my favorite dessert. It was absolute perfection.”',
      image: '_assets/media/7de89af4960fac22e7fc4c813aa66969.jpg'
    },

    ceremonies: [
      {
        id: 'sangeet',
        name: 'Sangeet & Cocktail',
        date: 'Friday, 27th February 2026',
        time: '07:00 PM onwards',
        venue: 'Pool Side, Umaid Bhawan Palace, Udaipur',
        image: '_assets/media/3419dab3df65b4c8c814069b218f7c46.png',
        mapUrl: 'https://maps.google.com/?q=Umaid+Bhawan+Palace+Udaipur'
      },
      {
        id: 'vivah',
        name: 'The Vivah (Wedding)',
        date: 'Saturday, 28th February 2026',
        time: '01:00 PM onwards',
        venue: 'Central Lawns, Umaid Bhawan Palace, Udaipur',
        image: '_assets/media/6e5bea638bca369c073c285e33f5e214.png',
        mapUrl: 'https://maps.google.com/?q=Umaid+Bhawan+Palace+Udaipur'
      },
      {
        id: 'reception',
        name: 'Grand Reception',
        date: 'Saturday, 28th February 2026',
        time: '08:00 PM onwards',
        venue: 'Royal Ballroom, Umaid Bhawan Palace, Udaipur',
        image: '_assets/media/8fb619510ea40bc5e769acb233a0ec9a.png',
        mapUrl: 'https://maps.google.com/?q=Umaid+Bhawan+Palace+Udaipur'
      }
    ],

    travelGuide: {
      title: 'Travel & Destination Guide',
      subtitle: 'Things to know about reaching Udaipur',
      items: [
        '5 mins from Udaipur City Railway Station',
        '25–30 mins from Maharana Pratap Airport (UDR)',
        'Pre-arranged luxury shuttles and chauffeur cabs are available for all guests at arrivals'
      ]
    },

    gallery: {
      title: 'Moments of Love',
      photos: [
        '_assets/media/8f6cc492a2454cbd612902d4214f5831.jpg',
        '_assets/media/5a2eafeb481d473032301b99f5be5139.jpg',
        '_assets/media/6c39883c452c5d2f6e8445cf6c8d92cc.jpg',
        '_assets/media/f67185006ae746a2e4cdb7e5fc9dbc8d.jpg'
      ]
    },

    rsvp: {
      title: 'RSVP',
      deadline: 'Please respond by 10th February 2026',
      contact: '+91 98765 43210'
    }
  };

  const CM = {
    mode,
    trial,
    DEFAULTS,
    config: JSON.parse(JSON.stringify(DEFAULTS)),
    syncDerived() {
      const c = this.config;
      c.title = (c.brideName || 'Bride') + ' & ' + (c.groomName || 'Groom');
      c.hostNames = [c.brideName || 'Bride', c.groomName || 'Groom'];
      const bInit = (c.brideName || 'A').trim().charAt(0).toUpperCase();
      const gInit = (c.groomName || 'K').trim().charAt(0).toUpperCase();
      c.monogram = `${bInit}${gInit}`;
    }
  };

  window.CrimsonMonogram = CM;
})();
