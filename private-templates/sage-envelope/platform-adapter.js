// Pratham platform adapter - bridges The Sage Envelope to Pratham website
(function () {
  const SE = window.SageEnvelope;
  if (!SE) return;

  const match = /[#&]platform=([A-Za-z0-9_-]+)/.exec(location.hash);
  if (!match) return;

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

  SE.commonLink = !!event.commonLink;
  SE.hasPublished = event.status !== 'draft';
  SE.hideNameField = !!(payload.guest && (payload.guest.name || payload.guest.greeting));

  const cfg = deepMerge(SE.DEFAULTS, overrides.__templateConfig || {});

  if (!overrides.__templateConfig) {
    if (Array.isArray(event.hostNames) && event.hostNames.length >= 2) {
      cfg.brideName = event.hostNames[0];
      cfg.groomName = event.hostNames[1];
    }
    if (event.date) cfg.eventISO = event.date;
  }

  SE.config = cfg;
  SE.platform = true;
  SE.syncDerived();

  SE.platformHash = function () {
    const next = Object.assign({}, payload, {
      sectionOverrides: Object.assign({}, overrides, {
        __templateConfig: JSON.parse(JSON.stringify(SE.config)),
      }),
    });
    const json = JSON.stringify(next);
    const b64 = btoa(unescape(encodeURIComponent(json)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return '#platform=' + b64;
  };

  window.parent.postMessage({ type: 'sutra:mode', mode: SE.mode }, '*');

  if (SE.mode === 'edit') {
    SE.save = function () {
      SE.syncDerived();
      window.parent.postMessage(
        { type: 'sutra:save', config: JSON.parse(JSON.stringify(SE.config)) }, '*'
      );
    };

    if (event.id) {
      SE.uploadUrl = '/api/invitations/' + encodeURIComponent(event.id) + '/media';
      SE.audioUploadUrl = '/api/invitations/' + encodeURIComponent(event.id) + '/audio';
    }
  }

  window.addEventListener('load', function () {
    window.parent.postMessage({ type: 'sutra:ready' }, '*');
  });
})();
