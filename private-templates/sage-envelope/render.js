// The Sage Envelope - Dynamic Renderer
(function () {
  const SE = window.SageEnvelope;
  if (!SE) return;

  const cfg = SE.config;
  const edit = SE.mode === 'edit';
  const esc = SE.esc;

  function editable(el, path, val) {
    if (!el) return;
    el.textContent = val == null ? '' : val;
    el.dataset.fmt = path; // size and alignment, for guests too
    if (edit) {
      el.setAttribute('contenteditable', 'plaintext-only');
      el.dataset.edit = path;
      el.spellcheck = false;
    }
  }

  function render() {
    // Envelope cover
    editable(document.getElementById('coverBride'), 'brideName', cfg.brideName);
    editable(document.getElementById('coverGroom'), 'groomName', cfg.groomName);
    editable(document.getElementById('coverDate'), 'eventDate', cfg.eventDate);

    // Letter header
    editable(document.getElementById('letterBride'), 'brideName', cfg.brideName);
    editable(document.getElementById('letterGroom'), 'groomName', cfg.groomName);
    editable(document.getElementById('letterDate'), 'eventDate', cfg.eventDate);
    editable(document.getElementById('letterVenue'), 'venue', cfg.venue);
    editable(document.getElementById('letterNote'), 'introNote', cfg.introNote);

    // Ceremonies (Event Flow)
    const flowContainer = document.getElementById('eventFlowContainer');
    if (flowContainer && Array.isArray(cfg.ceremonies)) {
      flowContainer.innerHTML = cfg.ceremonies.map((c, i) => `
        <div class="sage-ceremony-card">
          ${edit && cfg.ceremonies.length > 1 ? `<button type="button" class="ev-remove" data-ev-remove="${i}" aria-label="Remove this event">&times; Remove</button>` : ''}
          <div class="sage-card-header">
            <h3 data-fmt="ceremonies[${i}].name" ${edit ? `contenteditable="plaintext-only" data-edit="ceremonies[${i}].name"` : ''}>${esc(c.name)}</h3>
            <span class="sage-time" data-fmt="ceremonies[${i}].time" ${edit ? `contenteditable="plaintext-only" data-edit="ceremonies[${i}].time"` : ''}>${esc(c.time)}</span>
          </div>
          <div class="sage-card-body">
            <p class="sage-date" data-fmt="ceremonies[${i}].date" ${edit ? `contenteditable="plaintext-only" data-edit="ceremonies[${i}].date"` : ''}>${esc(c.date)}</p>
            <p class="sage-venue" data-fmt="ceremonies[${i}].venue" ${edit ? `contenteditable="plaintext-only" data-edit="ceremonies[${i}].venue"` : ''}>${esc(c.venue)}</p>
            ${c.mapUrl ? `<a href="${esc(c.mapUrl)}" target="_blank" rel="noopener" class="sage-map-link">Google Maps Location ›</a>` : ''}
            ${edit ? `<label class="ev-map"><span>Map link</span><input type="url" data-ev-map="${i}" value="${esc(c.mapUrl || '')}" placeholder="Paste a Google Maps link"></label>` : ''}
          </div>
        </div>
      `).join('') + (edit ? '<div class="ev-add-wrap"><button type="button" class="ev-add" data-ev-add>+ Add an event</button></div>' : '');
    }

    // Journey
    const journeyContainer = document.getElementById('journeyContainer');
    if (journeyContainer && Array.isArray(cfg.journey)) {
      journeyContainer.innerHTML = cfg.journey.map((j, i) => `
        <div class="sage-journey-card">
          <span class="sage-journey-date" data-fmt="journey[${i}].date" ${edit ? `contenteditable="plaintext-only" data-edit="journey[${i}].date"` : ''}>${esc(j.date)}</span>
          <h4 data-fmt="journey[${i}].title" ${edit ? `contenteditable="plaintext-only" data-edit="journey[${i}].title"` : ''}>${esc(j.title)}</h4>
          <p data-fmt="journey[${i}].desc" ${edit ? `contenteditable="plaintext-only" data-edit="journey[${i}].desc"` : ''}>${esc(j.desc)}</p>
        </div>
      `).join('');
    }
  }

  render();
  SE.reRender = render;
})();
