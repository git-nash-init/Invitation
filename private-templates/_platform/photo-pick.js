// Photo pick - click a picture in the editor to replace it with one from the host's device.
//
// Shared by every template. A template marks each replaceable picture with data-pick-photo="<config path>"
// (in edit mode only). The picture is shrunk in the browser, uploaded to the invitation's own media folder,
// written into the config at that path, and the template redraws itself.
//
// Also provides window.EditorKit.pickPhoto(uploadUrl, callback) for templates that drive it themselves.
(function () {
  'use strict';
  if (!/[?&]edit=1(&|$)/.test(location.search)) return;

  var MAX = 1400;
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.hidden = true;
  document.body.appendChild(input);
  var pending = null;

  function runtime() {
    var keys = Object.keys(window);
    for (var i = 0; i < keys.length; i++) {
      var v;
      try { v = window[keys[i]]; } catch (e) { continue; }
      if (v && typeof v === 'object' && v !== window && v.config && typeof v.config === 'object' &&
          typeof v.mode === 'string' && !Array.isArray(v.config)) return v;
    }
    return null;
  }

  function setPath(obj, path, val) {
    var parts = String(path).replace(/\]/g, '').split(/[.\[]/);
    var cur = obj;
    for (var i = 0; i < parts.length - 1; i++) {
      cur = cur[parts[i]];
      if (!cur) return false;
    }
    cur[parts[parts.length - 1]] = val;
    return true;
  }

  function toast(text) {
    var t = document.createElement('div');
    t.setAttribute('role', 'status');
    t.textContent = text;
    t.style.cssText = 'position:fixed;left:50%;bottom:84px;transform:translateX(-50%);z-index:500;padding:10px 16px;' +
      'border-radius:999px;background:#4a0a1e;color:#fff4e2;font:600 13px system-ui,sans-serif;box-shadow:0 8px 24px rgba(74,10,30,.35)';
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 3200);
  }

  function shrink(file, done) {
    var img = new Image();
    var url = URL.createObjectURL(file);
    img.onload = function () {
      URL.revokeObjectURL(url);
      var s = Math.min(1, MAX / Math.max(img.width, img.height));
      var c = document.createElement('canvas');
      c.width = Math.round(img.width * s);
      c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      c.toBlob(function (blob) { done(blob); }, 'image/jpeg', 0.82);
    };
    img.onerror = function () { URL.revokeObjectURL(url); done(null); };
    img.src = url;
  }

  function upload(uploadUrl, blob) {
    var form = new FormData();
    form.append('image', blob, 'photo.jpg');
    return fetch(uploadUrl, { method: 'POST', credentials: 'same-origin', headers: { Accept: 'application/json' }, body: form })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  input.addEventListener('change', function () {
    var file = input.files && input.files[0];
    input.value = '';
    var job = pending;
    pending = null;
    if (!file || !job) return;
    toast('Uploading your photo…');
    shrink(file, function (blob) {
      if (!blob) { toast("Couldn't read that image"); return; }
      upload(job.uploadUrl, blob).then(function (res) {
        if (res && res.url) { job.cb(res.url); toast('Photo added'); }
        else toast("Couldn't upload the photo. Check your connection and try again.");
      });
    });
  });

  window.EditorKit = window.EditorKit || {};
  window.EditorKit.pickPhoto = function (uploadUrl, cb) {
    if (!uploadUrl) { toast('Open this invitation from your dashboard to add photos'); return; }
    pending = { uploadUrl: uploadUrl, cb: cb };
    input.click();
  };

  var css = document.createElement('style');
  css.textContent =
    '[data-pick-photo]{cursor:pointer;outline:2px dashed rgba(159,18,57,.65);outline-offset:-2px}' +
    '[data-pick-photo]:hover{outline-style:solid;filter:brightness(1.04)}';
  document.head.appendChild(css);

  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-pick-photo]');
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    var rt = runtime();
    if (!rt) return;
    var path = el.getAttribute('data-pick-photo');
    window.EditorKit.pickPhoto(rt.uploadUrl, function (url) {
      if (!setPath(rt.config, path, url)) return;
      // A picture is swapped in place; redrawing the whole page would also reset what the host has open.
      if (el.tagName === 'IMG') el.src = url;
      else if (typeof rt.reRender === 'function') rt.reRender();
      else if (typeof rt.render === 'function') rt.render();
      if (typeof rt.save === 'function') Promise.resolve(rt.save());
    });
  }, true);
})();
