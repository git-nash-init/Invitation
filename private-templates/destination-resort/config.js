// The Grand Resort - Wedding Invitation Config
(function () {
  const params = new URLSearchParams(location.search);
  const mode = params.has('edit') ? 'edit' : params.has('preview') ? 'preview' : 'view';
  const trial = params.has('trial');

  const DEFAULTS = {
    version: 1,
    finalized: false,
    invocation: { symbol: 'ganesha', religion: 'hindu', script: 'devanagari', text: 'श्री गणेशाय नमः' },
    
    brideName: 'Ankita',
    groomName: 'Kaushik',
    title: 'Ankita & Kaushik',
    hostNames: ['Ankita', 'Kaushik'],
    
    tagline1: "We're making it official.",
    tagline2: "You're making it special.",
    
    eventDate: 'February 14 & 15, 2026',
    eventISO: '2026-02-14',
    venue: 'The Grand Heritage Palace, Udaipur',
    
    countdownTitle: 'Days to Our Wedding',
    
    groom: {
      name: 'Kaushik Sharma',
      bio: 'Kindhearted, thoughtful, and the calm in any storm. Kaushik brings warmth and laughter to every single room he enters.',
      photo: 'images/couple-1.png',
      parents: 'Son of Smt. Sunita & Shri Ramesh Chandra Sharma'
    },
    bride: {
      name: 'Ankita Mehta',
      bio: 'Vibrant, passionate, and an endless spark of joy. Ankita loves deep conversations, spontaneous road trips, and warm filter coffee.',
      photo: 'images/couple-2.png',
      parents: 'Daughter of Smt. Nandini & Shri Vikram Mehta'
    },
    
    story: {
      title: 'Our Story, Told in Smiles & Memories',
      subtitle: 'From a chance meeting over filter coffee to promising forever beneath the stars.',
      chapters: [
        { title: 'The First Hello', date: 'October 2022', desc: 'A cozy corner café in Bandra. Two cups of espresso and three hours that felt like ten minutes.', img: 'images/story-1.png' },
        { title: 'The Road Trip', date: 'December 2023', desc: 'A spontaneous drive to the hills of Udaipur where we realized life is simply better together.', img: 'images/story-2.png' },
        { title: 'She Said Yes', date: 'November 2024', desc: 'Under a golden sunset overlooking the lake, he asked and with joyful tears she said yes.', img: 'images/story-3.png' }
      ]
    },
    
    ceremonies: [
      {
        id: 'haldi',
        name: 'Haldi Ceremony',
        day: 'Saturday',
        date: '14 Feb 2026',
        time: '10:00 AM',
        venue: 'Poolside Courtyard, The Grand Heritage Palace',
        mapQuery: 'The Grand Heritage Palace Udaipur',
        mapUrl: 'https://maps.google.com/?q=The+Grand+Heritage+Palace+Udaipur',
        img: 'images/haldi.png'
      },
      {
        id: 'mehendi',
        name: 'Mehendi & Sangeet',
        day: 'Saturday',
        date: '14 Feb 2026',
        time: '06:30 PM',
        venue: 'Royal Ballroom, The Grand Heritage Palace',
        mapQuery: 'The Grand Heritage Palace Udaipur',
        mapUrl: 'https://maps.google.com/?q=The+Grand+Heritage+Palace+Udaipur',
        img: 'images/mehendi.png'
      },
      {
        id: 'wedding',
        name: 'The Wedding (Vivaah)',
        day: 'Sunday',
        date: '15 Feb 2026',
        time: '11:00 AM',
        venue: 'Mandap Pavilion, The Grand Heritage Palace',
        mapQuery: 'The Grand Heritage Palace Udaipur',
        mapUrl: 'https://maps.google.com/?q=The+Grand+Heritage+Palace+Udaipur',
        img: 'images/wedding.png'
      },
      {
        id: 'reception',
        name: 'Reception & Dinner',
        day: 'Sunday',
        date: '15 Feb 2026',
        time: '07:30 PM',
        venue: 'Lakeside Lawn, The Grand Heritage Palace',
        mapQuery: 'The Grand Heritage Palace Udaipur',
        mapUrl: 'https://maps.google.com/?q=The+Grand+Heritage+Palace+Udaipur',
        img: 'images/reception.png'
      }
    ],
    
    gallery: [
      { src: 'images/resource/couple.jpg', caption: 'Together Forever' },
      { src: 'images/gallery/1.png', caption: 'Laughter & Light' },
      { src: 'images/story-4.png', caption: 'Unforgettable Moments' },
      { src: 'images/story-5.png', caption: 'The Journey Ahead' }
    ],
    
    rsvp: {
      enabled: true,
      title: 'Will You Grace Us With Your Presence?',
      deadline: 'Please reply by 25th January 2026'
    }
  };

  const DR = {
    DEFAULTS: DEFAULTS,
    config: JSON.parse(JSON.stringify(DEFAULTS)),
    mode: mode,
    trial: trial,
    
    canEdit: function (path) {
      if (mode !== 'edit') return false;
      return true;
    },
    
    syncDerived: function () {
      const c = DR.config;
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

  window.DestinationResort = DR;
})();
