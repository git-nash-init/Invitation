// Wording - lets a host change every fixed line of text on an invitation: section headings, button
// labels, hints, the small print. The lines a template already lets the host type into (names, dates,
// venues, notes) are not touched here.
//
// Shared by every template, the ones that exist now and any added later: nothing has to be marked up.
// A fixed line is identified by its original text. The host's replacement is stored on the invitation
// itself, in config.wording = [{ k: "<original text>", v: "<their text>" }], so it is saved and
// published with everything else, and applied here for the host and for guests alike.
//
// In the editor, the "Edit all text" button opens a panel listing every fixed line a guest can see.
// That list is read from the invitation as a guest gets it (a hidden copy of the page, loaded once
// when the panel first opens), so the editor's own buttons and labels never appear in it.
(function () {
  'use strict';

  var EDIT = /[?&]edit=1(&|$)/.test(location.search);

  // Where a fixed line cannot be: what the host types in place, form controls, and our own chrome.
  var SKIP = 'script,style,noscript,template,svg,select,option,textarea,title,' +
    '[data-fmt],[data-edit],[data-edit-field],[contenteditable],[data-no-wording],' +
    '#wd-panel,#wd-open,#tf-bar,#pratham-credit';
  // Text a template writes from the date or a counter: not wording, even though a guest sees it.
  // Nor is the invocation where the template has its own picker for it.
  var DERIVED = '.reveal-cell,.reveal-said,.date__main,.count,.bdate,.royale-card__mantra,.invite__blessing,.intro__mantra,.easel__names';

  // The template's own runtime object (window.Royale, window.Papercut, ...): live config and save().
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
  var RT = null;
  function runtime() { return RT || (RT = findRuntime()); }

  function norm(t) { return String(t == null ? '' : t).replace(/\s+/g, ' ').trim(); }
  // Saving normalises quotes and drops angle brackets (src/lib/invitations/sanitize.ts), so a stored
  // original is matched to the page's text in that same form.
  function canon(t) { return norm(t).replace(/[<>]/g, '').replace(/"/g, '”').replace(/['`]/g, '’'); }

  // The saved replacements, as original -> replacement.
  function overrides() {
    var out = new Map();
    var r = runtime();
    var list = r && r.config.wording;
    if (!Array.isArray(list)) return out;
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      if (e && typeof e.k === 'string' && typeof e.v === 'string' && e.k) out.set(canon(e.k), e.v);
    }
    return out;
  }

  // Every text node we have rewritten: which original line it is, and what we last put there. If the
  // template later writes something else into the node, it is a different line and is read afresh.
  var known = new WeakMap();
  var everWrote = false;

  function keyOf(node) {
    var k = known.get(node);
    var now = norm(node.nodeValue);
    return k && now === norm(k.wrote) ? k.key : now;
  }

  function eachLine(fn) {
    if (!document.body) return;
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) {
      var node = w.currentNode;
      if (!known.has(node) && !/\S/.test(node.nodeValue)) continue;
      var p = node.parentElement;
      if (!p || p.closest(SKIP)) continue;
      var key = keyOf(node);
      if (key) fn(node, key, p);
    }
  }

  function applyAll() {
    var map = overrides();
    if (!map.size && !everWrote) return; // nothing changed, ever: the usual case for a guest
    eachLine(function (node, key) {
      var has = map.has(canon(key));
      if (!has && !known.has(node)) return;
      var want = has ? map.get(canon(key)) : key;
      if (norm(node.nodeValue) !== norm(want)) {
        var raw = node.nodeValue;
        node.nodeValue = (/^\s*/.exec(raw) || [''])[0] + want + (/\s*$/.exec(raw.trim() ? raw : '') || [''])[0];
      }
      known.set(node, { key: key, wrote: want });
      everWrote = true;
    });
  }

  var queued = false;
  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; applyAll(); });
  }
  applyAll();
  window.addEventListener('load', applyAll);
  if (window.MutationObserver && document.body) {
    new MutationObserver(queue).observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  // The fixed lines on this page, by their original text, in page order. Called on the hidden guest
  // copy by the editor's panel.
  function isWording(key) {
    if (key.length > 300) return false;
    if (/\d/.test(key)) return false; // dates, times, counts
    if (/^[+＋×✕✓‹›◀▶]/.test(key)) return false; // an editor button left in the page
    return key === '&' || /\p{L}/u.test(key);
  }
  window.SutraWording = {
    keys: function () {
      var seen = {}, out = [];
      eachLine(function (node, key, p) {
        if (seen[key] || !isWording(key) || p.closest(DERIVED)) return;
        seen[key] = 1;
        out.push(key);
      });
      return out;
    },
  };

  if (!EDIT) return;

  // ---- The editor: a button and a panel -------------------------------------------------------
  var css = document.createElement('style');
  css.textContent =
    '#wd-open{position:fixed;left:12px;bottom:84px;z-index:2147483000;display:inline-flex;align-items:center;gap:8px;' +
    'padding:12px 14px;border:1px solid #e3c79c;border-radius:999px;background:#fff8ee;color:#6b0f2b;' +
    'font:700 13px/1 system-ui,-apple-system,"Segoe UI",sans-serif;cursor:pointer;box-shadow:0 8px 24px rgba(74,10,30,.28)}' +
    '#wd-open[hidden]{display:none}' +
    '#wd-open:hover{background:#fff1d6}#wd-open:focus-visible{outline:2px solid #9f1239;outline-offset:2px}' +
    '#wd-open b{font:700 15px/1 Georgia,serif}' +
    '@media (max-width:560px){#wd-open span{display:none}#wd-open{padding:12px}}' +
    '#wd-panel{position:fixed;top:0;right:0;bottom:0;z-index:2147483001;display:none;flex-direction:column;width:min(380px,94vw);' +
    'background:#fffaf0;color:#3b0a1a;border-left:1px solid #e3c79c;box-shadow:-18px 0 50px rgba(74,10,30,.3);' +
    'font:400 14px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif;text-align:left}' +
    '#wd-panel.is-open{display:flex}' +
    '#wd-panel *{box-sizing:border-box}' +
    '#wd-panel header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:16px 16px 12px;border-bottom:1px solid #eedcb9}' +
    '#wd-panel h2{margin:0;font:700 17px/1.2 system-ui,-apple-system,"Segoe UI",sans-serif;color:#6b0f2b}' +
    '#wd-panel header p{margin:4px 0 0;font-size:12.5px;color:#7a5560}' +
    '#wd-panel .wd-x{all:unset;display:grid;place-items:center;width:36px;height:36px;border-radius:999px;cursor:pointer;font-size:20px;color:#6b0f2b;flex:none}' +
    '#wd-panel .wd-x:hover{background:rgba(107,15,43,.1)}#wd-panel .wd-x:focus-visible{outline:2px solid #9f1239}' +
    '#wd-panel .wd-list{flex:1;overflow:auto;padding:12px 16px 24px;display:grid;gap:14px;align-content:start}' +
    '#wd-panel .wd-row{display:grid;gap:5px}' +
    '#wd-panel .wd-orig{display:flex;justify-content:space-between;gap:8px;font-size:12px;color:#7a5560}' +
    '#wd-panel .wd-orig span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '#wd-panel .wd-reset{all:unset;cursor:pointer;color:#9f1239;font-weight:600;flex:none}' +
    '#wd-panel .wd-reset[hidden]{display:none}' +
    '#wd-panel .wd-reset:focus-visible{outline:2px solid #9f1239;outline-offset:2px}' +
    '#wd-panel textarea{display:block;width:100%;min-height:40px;padding:9px 11px;border:1px solid #d9bd8f;border-radius:10px;background:#fff;' +
    'color:#3b0a1a;font:400 14px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif;resize:vertical}' +
    '#wd-panel textarea:focus{outline:2px solid #9f1239;outline-offset:1px;border-color:#9f1239}' +
    '#wd-panel .wd-row.is-changed textarea{border-color:#f5a300;background:#fffbf0}' +
    '#wd-panel .wd-msg{margin:0;color:#7a5560}' +
    '.wd-flash{outline:3px solid #f5a300!important;outline-offset:3px!important}';
  document.head.appendChild(css);

  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var open = document.createElement('button');
  open.id = 'wd-open';
  open.type = 'button';
  open.setAttribute('aria-label', 'Edit all text on the invitation');
  open.innerHTML = '<b aria-hidden="true">Aa</b><span>Edit all text</span>';
  document.body.appendChild(open);

  var panel = document.createElement('aside');
  panel.id = 'wd-panel';
  panel.setAttribute('aria-label', 'Edit all text');
  panel.innerHTML =
    '<header><div><h2>Edit all text</h2><p>Headings, buttons and small print. Names, dates and venues are typed on the invitation itself.</p></div>' +
    '<button type="button" class="wd-x" aria-label="Close">&times;</button></header>' +
    '<div class="wd-list"><p class="wd-msg">Finding the text on your invitation…</p></div>';
  document.body.appendChild(panel);
  var listEl = panel.querySelector('.wd-list');

  var keys = null;       // the fixed lines a guest sees, once read
  var loading = false;

  function setOverride(key, value) {
    var r = runtime();
    if (!r) return;
    if (!Array.isArray(r.config.wording)) r.config.wording = [];
    var list = r.config.wording;
    var at = -1;
    for (var i = 0; i < list.length; i++) if (list[i] && canon(list[i].k) === canon(key)) at = i;
    if (value === key) { if (at !== -1) list.splice(at, 1); }
    else if (at !== -1) list[at].v = value;
    else list.push({ k: key, v: value });
    everWrote = true;
    applyAll();
    save();
  }

  var saveTimer = null;
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

  function paint() {
    var map = overrides();
    var all = (keys || []).slice();
    // A replacement whose line is not on the page just now is still listed, so it can be put back.
    map.forEach(function (v, k) {
      if (!all.some(function (a) { return canon(a) === k; })) all.push(k);
    });
    if (!all.length) {
      listEl.innerHTML = '<p class="wd-msg">' + (loading ? 'Finding the text on your invitation…' : 'No fixed text was found on this invitation.') + '</p>';
      return;
    }
    listEl.innerHTML = all.map(function (k, i) {
      var changed = map.has(canon(k));
      return '<div class="wd-row' + (changed ? ' is-changed' : '') + '" data-i="' + i + '">' +
        '<label class="wd-orig" for="wd-f' + i + '"><span title="' + esc(k) + '">' + esc(k) + '</span>' +
        '<button type="button" class="wd-reset"' + (changed ? '' : ' hidden') + '>Put back</button></label>' +
        '<textarea id="wd-f' + i + '" rows="1" maxlength="300">' + esc(changed ? map.get(canon(k)) : k) + '</textarea></div>';
    }).join('');
    listEl._keys = all;
  }

  // Read the fixed lines from the invitation as a guest gets it: this page without the editor.
  function readKeys() {
    if (keys || loading) return;
    loading = true;
    var frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    frame.setAttribute('tabindex', '-1');
    frame.setAttribute('data-no-wording', '');
    frame.style.cssText = 'position:fixed;left:-10000px;top:0;width:390px;height:800px;border:0;visibility:hidden;pointer-events:none';
    var done = false;
    function collect(last) {
      if (done) return;
      var found = [];
      try { found = frame.contentWindow.SutraWording.keys(); } catch (e) { /* not ready, or gone */ }
      if (found.length || last) {
        // Keep only the lines that are fixed here too: what a guest sees as plain text but the host
        // types in place (a venue, a family name) is edited on the invitation, not in this list.
        var here = {};
        eachLine(function (node, key) { here[key] = 1; });
        var merged = keys || [];
        found.forEach(function (k) { if (here[k] && merged.indexOf(k) === -1) merged.push(k); });
        keys = merged;
      }
      if (last) { done = true; loading = false; frame.remove(); }
      if (panel.classList.contains('is-open') && !panel.contains(document.activeElement)) paint();
      else if (last && !listEl._keys) paint();
    }
    frame.addEventListener('load', function () {
      collect(false);
      // Templates that draw themselves after load get one more look before the copy is dropped.
      setTimeout(function () { collect(true); }, 1500);
    });
    frame.addEventListener('error', function () { collect(true); });
    frame.src = location.pathname + location.hash;
    document.body.appendChild(frame);
  }

  function show() {
    panel.classList.add('is-open');
    open.hidden = true;
    paint();
    readKeys();
    panel.querySelector('.wd-x').focus();
  }
  function hideP() {
    panel.classList.remove('is-open');
    open.hidden = false;
    open.focus();
  }

  open.addEventListener('click', show);
  panel.querySelector('.wd-x').addEventListener('click', hideP);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('is-open')) hideP();
  });

  function keyFor(el) {
    var row = el.closest('.wd-row');
    return row && listEl._keys ? listEl._keys[+row.getAttribute('data-i')] : null;
  }

  listEl.addEventListener('input', function (e) {
    if (e.target.tagName !== 'TEXTAREA') return;
    var key = keyFor(e.target);
    if (!key) return;
    var value = e.target.value.replace(/\s*\n\s*/g, ' ');
    setOverride(key, value);
    var row = e.target.closest('.wd-row');
    var changed = value !== key;
    row.classList.toggle('is-changed', changed);
    row.querySelector('.wd-reset').hidden = !changed;
  });

  listEl.addEventListener('click', function (e) {
    var b = e.target.closest('.wd-reset');
    if (!b) return;
    e.preventDefault();
    var key = keyFor(b);
    if (!key) return;
    setOverride(key, key);
    var row = b.closest('.wd-row');
    row.querySelector('textarea').value = key;
    row.classList.remove('is-changed');
    b.hidden = true;
  });

  // Typing in a row shows where that line is on the invitation.
  var flashed = null, flashTimer = null;
  listEl.addEventListener('focusin', function (e) {
    if (e.target.tagName !== 'TEXTAREA') return;
    var key = keyFor(e.target);
    var target = null;
    eachLine(function (node, k, p) {
      if (target || k !== key) return;
      var r = p.getBoundingClientRect();
      if (r.width && r.height) target = p;
    });
    if (flashed) flashed.classList.remove('wd-flash');
    clearTimeout(flashTimer);
    if (!target) return;
    flashed = target;
    target.classList.add('wd-flash');
    try { target.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (err) { /* older browsers */ }
    flashTimer = setTimeout(function () { target.classList.remove('wd-flash'); }, 1800);
  });
})();
