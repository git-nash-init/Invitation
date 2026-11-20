// Pratham platform adapter - bridges Destination Resort to the Pratham website
(function () {
  const DR = window.DestinationResort;
  if (!DR) return;

  const match = /[#&]platform=([A-Za-z0-9_-]+)/.exec(location.hash);
  if (!match) return; // Standalone / demo mode

  let payload;
  try {
    const b64 = match[1].replace(/-/g, '+').replace(/_/g, '/');
    payload = JSON.parse(decodeURIComponent(escape(atob(b64))));
  } catch (_) {
    return;
  }

  function deepMerge(base, over) {
    if (Array.isArray(base) || Array.isArray(over)) return over !== undefined ? over : base;
    if (typeof base !== 'object' || base === null) return over !== undefined ? over : base;
    if (typeof over !== 'object' || over === null) return base;
    const out = {};
    Object.keys(base).forEach((k) => { out[k] = deepMerge(base[k], over[k]); });
    Object.keys(over).forEach((k) => { if (!(k in base)) out[k] = over[k]; });
    return out;
  }

  const event = payload.event || {};
  const overrides = payload.sectionOverrides || {};

  DR.commonLink = !!event.commonLink;
  DR.hasPublished = event.status !== 'draft';
  DR.hideNameField = !!(payload.guest && (payload.guest.name || payload.guest.greeting));

  const cfg = deepMerge(DR.DEFAULTS, overrides.__templateConfig || {});

  if (!overrides.__templateConfig) {
    if (Array.isArray(event.hostNames) && event.hostNames.length >= 2) {
      cfg.brideName = event.hostNames[0];
      cfg.groomName = event.hostNames[1];
    }
    if (event.date) cfg.eventISO = event.date;
  }

  DR.config = cfg;
  DR.platform = true;
  DR.syncDerived();

  DR.platformHash = function () {
    const next = Object.assign({}, payload, {
      sectionOverrides: Object.assign({}, overrides, {
        __templateConfig: JSON.parse(JSON.stringify(DR.config)),
      }),
    });
    const json = JSON.stringify(next);
    const b64 = btoa(unescape(encodeURIComponent(json)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return '#platform=' + b64;
  };

  window.parent.postMessage({ type: 'sutra:mode', mode: DR.mode }, '*');

  if (DR.mode === 'edit') {
    DR.save = function () {
      DR.syncDerived();
      window.parent.postMessage(
        { type: 'sutra:save', config: JSON.parse(JSON.stringify(DR.config)) }, '*'
      );
    };

    if (event.id) {
      DR.uploadUrl = '/api/invitations/' + encodeURIComponent(event.id) + '/media';
      DR.audioUploadUrl = '/api/invitations/' + encodeURIComponent(event.id) + '/audio';
    }
  }

  window.addEventListener('load', function () {
    window.parent.postMessage({ type: 'sutra:ready' }, '*');
  });
})();
