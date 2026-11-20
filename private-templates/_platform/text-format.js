// Text format - lets a host change the size and the alignment of any line of text they can edit.
//
// Shared by every template. A template only has to mark each editable line with data-fmt="<config path>"
// (it does that in both edit and guest mode, so what the host chose is what guests see). The choice is
// stored on the invitation itself, in config.textStyle[path] = { size: 100, align: 'center' }, so it is
// saved and published with everything else.
//
// In the editor, clicking a line shows a small bar above it: smaller, bigger, left, centre, right, reset.
(function () {
  'use strict';

  var EDIT = /[?&]edit=1(&|$)/.test(location.search);
  var MIN = 50, MAX = 220, STEP = 10;

  // The template's own runtime object (window.Royale, window.Papercut, window.RoseInvite, ...):
  // the one that holds the live config and the save function.
  function findRuntime() {
    var keys = Object.keys(window);
    for (var i = 0; i < keys.length; i++) {
      var v;
      try { v = window[keys[i]]; } catch (e) { continue; }
      if (v && typeof v === 'object' && v !== window && v.config && typeof v.config === 'object' &&
          typeof v.mode === 'string' && !Array.isArray(v.config)) {
        return v;
      }
    }
    return null;
  }

  var RI = null;
  function runtime() { return RI || (RI = findRuntime()); }

  // "ceremonies[2].venue" and "ceremonies.2.venue" are the same line.
  function norm(path) { return String(path || '').replace(/\[(\d+)\]/g, '.$1'); }
  function styles() {
    var r = runtime();
    if (!r) return null;
    if (!r.config.textStyle || typeof r.config.textStyle !== 'object') r.config.textStyle = {};
    return r.config.textStyle;
  }

  function apply(el) {
    var all = styles();
    var s = all && all[norm(el.getAttribute('data-fmt'))];
    var size = s && Number(s.size);
    var align = s && s.align;

    if (size && size !== 100) el.style.zoom = String(size / 100);
    else el.style.removeProperty('zoom');

    if (align === 'left' || align === 'center' || align === 'right') {
      if (!el.hasAttribute('data-fmt-display') && getComputedStyle(el).display === 'inline') {
        el.setAttribute('data-fmt-display', '1');
        el.style.display = 'block';
      }
      el.style.textAlign = align;
    } else {
      el.style.removeProperty('text-align');
      if (el.hasAttribute('data-fmt-display')) {
        el.removeAttribute('data-fmt-display');
        el.style.removeProperty('display');
      }
    }
  }

  function applyAll() {
    var list = document.querySelectorAll('[data-fmt]');
    for (var i = 0; i < list.length; i++) apply(list[i]);
  }

  // ---- Applying the saved choices, in the editor and for guests -------------------------------
  var queued = false;
  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; applyAll(); });
  }
  applyAll();
  window.addEventListener('load', function () { applyAll(); setTimeout(applyAll, 600); });
  if (window.MutationObserver) {
    new MutationObserver(queue).observe(document.body, { childList: true, subtree: true });
  }

  if (!EDIT) return;

  // ---- The editor bar ----------------------------------------------------------------------
  var css = document.createElement('style');
  css.textContent =
    '#tf-bar{position:fixed;z-index:450;display:none;align-items:center;gap:2px;padding:4px;border-radius:999px;' +
    'background:#fff8ee;border:1px solid #e3c79c;box-shadow:0 8px 24px rgba(74,10,30,.28);' +
    'font:600 12px/1 system-ui,-apple-system,"Segoe UI",sans-serif;color:#6b0f2b;user-select:none;-webkit-user-select:none}' +
    '#tf-bar button{all:unset;box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;' +
    'min-width:34px;height:34px;padding:0 8px;border-radius:999px;cursor:pointer;color:#6b0f2b;font-weight:700;font-size:13px}' +
    '#tf-bar button:hover{background:rgba(107,15,43,.1)}' +
    '#tf-bar button:focus-visible{outline:2px solid #9f1239;outline-offset:1px}' +
    '#tf-bar button[aria-pressed="true"]{background:#6b0f2b;color:#fff4e2}' +
    '#tf-bar .tf-size{min-width:44px;justify-content:center;font-weight:600;color:#4a0a1e;cursor:default}' +
    '#tf-bar .tf-sep{width:1px;height:20px;margin:0 4px;background:#e3c79c}' +
    '#tf-bar svg{width:18px;height:18px;display:block}';
  document.head.appendChild(css);

  function lines(kind) {
    function l(y, x1, x2) { return '<line x1="' + x1 + '" y1="' + y + '" x2="' + x2 + '" y2="' + y + '"/>'; }
    var a = { left: [[5, 3, 17], [10, 3, 12], [15, 3, 15]], center: [[5, 3, 17], [10, 6, 14], [15, 4, 16]], right: [[5, 3, 17], [10, 8, 17], [15, 5, 17]] }[kind];
    return '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">' +
      l(a[0][0], a[0][1], a[0][2]) + l(a[1][0], a[1][1], a[1][2]) + l(a[2][0], a[2][1], a[2][2]) + '</svg>';
  }

  var bar = document.createElement('div');
  bar.id = 'tf-bar';
  bar.setAttribute('role', 'toolbar');
  bar.setAttribute('aria-label', 'Text size and alignment');
  bar.innerHTML =
    '<button type="button" data-tf="smaller" aria-label="Smaller text" title="Smaller text">A&minus;</button>' +
    '<span class="tf-size" aria-live="polite">100%</span>' +
    '<button type="button" data-tf="bigger" aria-label="Bigger text" title="Bigger text">A+</button>' +
    '<span class="tf-sep" aria-hidden="true"></span>' +
    '<button type="button" data-tf="left" aria-label="Align left" title="Align left">' + lines('left') + '</button>' +
    '<button type="button" data-tf="center" aria-label="Centre" title="Centre">' + lines('center') + '</button>' +
    '<button type="button" data-tf="right" aria-label="Align right" title="Align right">' + lines('right') + '</button>' +
    '<span class="tf-sep" aria-hidden="true"></span>' +
    '<button type="button" data-tf="reset" aria-label="Reset text style" title="Reset">Reset</button>';
  document.body.appendChild(bar);

  var current = null, hideTimer = null, saveTimer = null;

  function place() {
    if (!current) return;
    var r = current.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) { bar.style.display = 'none'; return; }
    bar.style.display = 'flex';
    var bw = bar.offsetWidth, bh = bar.offsetHeight;
    var top = r.top - bh - 8;
    if (top < 64) top = Math.min(r.bottom + 8, innerHeight - bh - 8);
    var left = Math.max(8, Math.min(r.left + r.width / 2 - bw / 2, innerWidth - bw - 8));
    bar.style.top = Math.round(top) + 'px';
    bar.style.left = Math.round(left) + 'px';
  }

  function refresh() {
    if (!current) return;
    var all = styles() || {};
    var s = all[norm(current.getAttribute('data-fmt'))] || {};
    bar.querySelector('.tf-size').textContent = (s.size || 100) + '%';
    ['left', 'center', 'right'].forEach(function (k) {
      bar.querySelector('[data-tf="' + k + '"]').setAttribute('aria-pressed', String(s.align === k));
    });
  }

  function show(el) {
    clearTimeout(hideTimer);
    current = el;
    refresh();
    place();
  }
  function hide() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(function () { current = null; bar.style.display = 'none'; }, 160);
  }

  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      var r = runtime();
      if (!r || typeof r.save !== 'function') return;
      Promise.resolve(r.save()).then(function (ok) {
        if (ok) document.dispatchEvent(new CustomEvent('sutra:saved'));
      });
    }, 400);
  }

  function change(fn) {
    if (!current) return;
    var all = styles();
    if (!all) return;
    var key = norm(current.getAttribute('data-fmt'));
    var s = all[key] || { size: 100, align: '' };
    fn(s);
    var plain = (!s.size || s.size === 100) && !s.align;
    if (plain) delete all[key]; else all[key] = { size: s.size || 100, align: s.align || '' };
    apply(current);
    refresh();
    place();
    save();
  }

  bar.addEventListener('mousedown', function (e) { e.preventDefault(); });
  bar.addEventListener('pointerdown', function (e) { e.preventDefault(); });
  bar.addEventListener('click', function (e) {
    var b = e.target.closest('[data-tf]');
    if (!b) return;
    var act = b.getAttribute('data-tf');
    change(function (s) {
      var size = s.size || 100;
      if (act === 'smaller') s.size = Math.max(MIN, size - STEP);
      else if (act === 'bigger') s.size = Math.min(MAX, size + STEP);
      else if (act === 'reset') { s.size = 100; s.align = ''; }
      else s.align = s.align === act ? '' : act;
    });
  });

  document.addEventListener('focusin', function (e) {
    var el = e.target.closest && e.target.closest('[data-fmt]');
    if (el) show(el); else if (!bar.contains(e.target)) hide();
  });
  document.addEventListener('focusout', hide);
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-fmt]');
    if (el) show(el);
  });
  window.addEventListener('scroll', place, true);
  window.addEventListener('resize', place);
})();
