// Destination Resort - Dynamic Renderer
(function () {
  const DR = window.DestinationResort;
  if (!DR) return;

  const cfg = DR.config;
  const edit = DR.mode === 'edit';
  const esc = DR.esc;

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
    // Opening screen names
    editable(document.getElementById('coverBride'), 'brideName', cfg.brideName);
    editable(document.getElementById('coverGroom'), 'groomName', cfg.groomName);
    editable(document.getElementById('coverDate'), 'eventDate', cfg.eventDate);
    editable(document.getElementById('coverVenue'), 'venue', cfg.venue);

    // Hero banner names and taglines
    editable(document.getElementById('heroBride'), 'brideName', cfg.brideName);
    editable(document.getElementById('heroGroom'), 'groomName', cfg.groomName);
    editable(document.getElementById('heroDate'), 'eventDate', cfg.eventDate);
    editable(document.getElementById('heroVenue'), 'venue', cfg.venue);
    editable(document.getElementById('heroTagline1'), 'tagline1', cfg.tagline1);
    editable(document.getElementById('heroTagline2'), 'tagline2', cfg.tagline2);

    // Groom profile
    editable(document.getElementById('groomNameText'), 'groom.name', cfg.groom.name);
    editable(document.getElementById('groomBioText'), 'groom.bio', cfg.groom.bio);
    editable(document.getElementById('groomParentsText'), 'groom.parents', cfg.groom.parents);
    const groomImg = document.getElementById('groomImg');
    if (groomImg && cfg.groom.photo) groomImg.src = cfg.groom.photo;
    if (groomImg && edit) groomImg.setAttribute('data-pick-photo', 'groom.photo');

    // Bride profile
    editable(document.getElementById('brideNameText'), 'bride.name', cfg.bride.name);
    editable(document.getElementById('brideBioText'), 'bride.bio', cfg.bride.bio);
    editable(document.getElementById('brideParentsText'), 'bride.parents', cfg.bride.parents);
    const brideImg = document.getElementById('brideImg');
    if (brideImg && cfg.bride.photo) brideImg.src = cfg.bride.photo;
    if (brideImg && edit) brideImg.setAttribute('data-pick-photo', 'bride.photo');

    // Ceremonies list
    const ceremonyContainer = document.getElementById('ceremonyContainer');
    if (ceremonyContainer && Array.isArray(cfg.ceremonies)) {
      ceremonyContainer.innerHTML = cfg.ceremonies.map((c, i) => `
        <div class="col-lg-6 col-md-6 col-sm-12 ceremony-block">
          <div class="inner-box wow fadeInUp animated" style="visibility: visible; animation-name: fadeInUp;">
            ${edit && cfg.ceremonies.length > 1 ? `<button type="button" class="ev-remove" data-ev-remove="${i}" aria-label="Remove this event">&times; Remove</button>` : ''}
            <div class="image-box">
              <figure class="image"><img src="${esc(c.img)}" alt="${esc(c.name)}" loading="lazy" decoding="async"${edit ? ` data-pick-photo="ceremonies[${i}].img"` : ''}></figure>
            </div>
            <div class="lower-content">
              <h3 data-fmt="ceremonies[${i}].name" ${edit ? `contenteditable="plaintext-only" data-edit="ceremonies[${i}].name"` : ''}>${esc(c.name)}</h3>
              <div class="date-time">
                <span data-fmt="ceremonies[${i}].day" ${edit ? `contenteditable="plaintext-only" data-edit="ceremonies[${i}].day"` : ''}>${esc(c.day)}</span>, 
                <span data-fmt="ceremonies[${i}].date" ${edit ? `contenteditable="plaintext-only" data-edit="ceremonies[${i}].date"` : ''}>${esc(c.date)}</span> • 
                <span data-fmt="ceremonies[${i}].time" ${edit ? `contenteditable="plaintext-only" data-edit="ceremonies[${i}].time"` : ''}>${esc(c.time)}</span>
              </div>
              <div class="venue-location">
                <p data-fmt="ceremonies[${i}].venue" ${edit ? `contenteditable="plaintext-only" data-edit="ceremonies[${i}].venue"` : ''}>${esc(c.venue)}</p>
                ${c.mapUrl ? `<a href="${esc(c.mapUrl)}" target="_blank" rel="noopener" class="map-link">View on Google Maps ›</a>` : ''}
                ${edit ? `<label class="ev-map"><span>Map link</span><input type="url" data-ev-map="${i}" value="${esc(c.mapUrl || '')}" placeholder="Paste a Google Maps link"></label>` : ''}
              </div>
            </div>
          </div>
        </div>
      `).join('') + (edit ? '<div class="col-12 ev-add-wrap"><button type="button" class="ev-add" data-ev-add>+ Add an event</button></div>' : '');
    }

    // Story chapters
    const storyContainer = document.getElementById('storyContainer');
    if (storyContainer && cfg.story && Array.isArray(cfg.story.chapters)) {
      storyContainer.innerHTML = cfg.story.chapters.map((ch, i) => `
        <div class="story-item">
          <div class="story-img"><img src="${esc(ch.img)}" alt="${esc(ch.title)}" loading="lazy" decoding="async"${edit ? ` data-pick-photo="story.chapters[${i}].img"` : ''}></div>
          <div class="story-text">
            <span class="story-date" data-fmt="story.chapters[${i}].date" ${edit ? `contenteditable="plaintext-only" data-edit="story.chapters[${i}].date"` : ''}>${esc(ch.date)}</span>
            <h4 data-fmt="story.chapters[${i}].title" ${edit ? `contenteditable="plaintext-only" data-edit="story.chapters[${i}].title"` : ''}>${esc(ch.title)}</h4>
            <p data-fmt="story.chapters[${i}].desc" ${edit ? `contenteditable="plaintext-only" data-edit="story.chapters[${i}].desc"` : ''}>${esc(ch.desc)}</p>
          </div>
        </div>
      `).join('');
    }

    // Gallery
    const galleryContainer = document.getElementById('galleryContainer');
    if (galleryContainer && Array.isArray(cfg.gallery)) {
      galleryContainer.innerHTML = cfg.gallery.map((g, i) => `
        <div class="gallery-item" ${edit ? `data-gallery-idx="${i}"` : ''}>
          <img src="${esc(g.src)}" alt="${esc(g.caption || '')}" loading="lazy" decoding="async"${edit ? ` data-pick-photo="gallery[${i}].src"` : ''}>
          ${g.caption ? `<div class="gallery-caption" data-fmt="gallery[${i}].caption" ${edit ? `contenteditable="plaintext-only" data-edit="gallery[${i}].caption"` : ''}>${esc(g.caption)}</div>` : ''}
        </div>
      `).join('');
    }
  }

  // Run render before animations and interactions
  render();
  DR.reRender = render;
})();
