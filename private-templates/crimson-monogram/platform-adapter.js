// Pratham platform adapter - bridges Crimson Monogram to the Pratham website
(function () {
  const CM = window.CrimsonMonogram;
  if (!CM) return;

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

  CM.commonLink = !!event.commonLink;
  CM.hasPublished = event.status !== 'draft';
  CM.hideNameField = !!(payload.guest && (payload.guest.name || payload.guest.greeting));

  const cfg = deepMerge(CM.DEFAULTS, overrides.__templateConfig || {});

  if (!overrides.__templateConfig) {
    if (Array.isArray(event.hostNames) && event.hostNames.length >= 2) {
      cfg.brideName = event.hostNames[0];
      cfg.groomName = event.hostNames[1];
    }
    if (event.date) cfg.eventISO = event.date;
  }

  CM.config = cfg;
  CM.platform = true;
  CM.syncDerived();

  CM.platformHash = function () {
    const next = Object.assign({}, payload, {
      sectionOverrides: Object.assign({}, overrides, {
        __templateConfig: JSON.parse(JSON.stringify(CM.config)),
      }),
    });
    const json = JSON.stringify(next);
    const b64 = btoa(unescape(encodeURIComponent(json)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return '#platform=' + b64;
  };

  window.parent.postMessage({ type: 'sutra:mode', mode: CM.mode }, '*');

  if (CM.mode === 'edit') {
    CM.save = function () {
      CM.syncDerived();
      window.parent.postMessage(
        { type: 'sutra:save', config: JSON.parse(JSON.stringify(CM.config)) }, '*'
      );
    };

    if (event.id) {
      CM.uploadUrl = '/api/invitations/' + encodeURIComponent(event.id) + '/media';
      CM.audioUploadUrl = '/api/invitations/' + encodeURIComponent(event.id) + '/audio';
    }
  }

  window.addEventListener('load', function () {
    window.parent.postMessage({ type: 'sutra:ready' }, '*');
  });
})();
