// The Crimson Monogram - Template Render Engine
(function () {
  const CM = window.CrimsonMonogram;
  if (!CM) return;

  function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderOpeningCard(c) {
    return `
      <div class="crimson-cover" id="coverSection">
        <div class="crimson-frame">
          <div class="corner-ornament corner-tl"></div>
          <div class="corner-ornament corner-tr"></div>
          <div class="corner-ornament corner-bl"></div>
          <div class="corner-ornament corner-br"></div>

          <div class="crimson-crest">
            <div class="monogram-ring">
              <span class="monogram-text" data-no-wording>${esc(c.monogram || 'AK')}</span>
            </div>
          </div>

          <div class="cover-subtitle" data-fmt="welcomeText" data-edit-field="welcomeText">${esc(c.welcomeText || 'Together with their families')}</div>

          <h1 class="cover-title"><span data-fmt="brideName" data-edit-field="brideName">${esc(c.brideName || 'Ankita')}</span> <span class="amp">&amp;</span> <span data-fmt="groomName" data-edit-field="groomName">${esc(c.groomName || 'Kaushik')}</span></h1>

          <div class="cover-divider">
            <span class="divider-line"></span>
            <span class="divider-diamond">♦</span>
            <span class="divider-line"></span>
          </div>

          <p class="cover-desc" data-fmt="celebrationText" data-edit-field="celebrationText">${esc(c.celebrationText || 'Request the honour of your presence at their wedding celebrations')}</p>

          <div class="cover-date-pill">
            <span class="date-icon">🗓</span>
            <span data-fmt="eventDate" data-edit-field="eventDate">${esc(c.eventDate || '27th & 28th February, 2026')}</span>
          </div>

          <div class="cover-venue" data-fmt="venue" data-edit-field="venue">${esc(c.venue || 'Umaid Bhawan Palace, Udaipur')}</div>

          <button class="open-seal-btn" type="button" id="openInviteBtn" data-open-invite>
            <span class="seal-ring">
              <svg class="seal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
            </span>
            <span class="seal-text">Tap to open</span>
          </button>
        </div>
      </div>
    `;
  }

  function renderCeremonyCard(item, index) {
    return `
      <div class="ceremony-card" data-ceremony-index="${index}">
        <div class="ceremony-art-wrap">
          <img src="${esc(item.image)}" alt="${esc(item.name)}" class="ceremony-art" loading="lazy" decoding="async"${CM.mode === 'edit' ? ` data-pick-photo="ceremonies.${index}.image"` : ''} />
        </div>
        <div class="ceremony-details">
          <h3 class="ceremony-name" data-fmt="ceremonies.${index}.name" data-edit-field="ceremonies.${index}.name">${esc(item.name)}</h3>
          <div class="ceremony-meta">
            <span class="ceremony-date" data-fmt="ceremonies.${index}.date" data-edit-field="ceremonies.${index}.date">📅 ${esc(item.date)}</span>
            <span class="ceremony-time" data-fmt="ceremonies.${index}.time" data-edit-field="ceremonies.${index}.time">⏰ ${esc(item.time)}</span>
          </div>
          <p class="ceremony-venue" data-fmt="ceremonies.${index}.venue" data-edit-field="ceremonies.${index}.venue">📍 ${esc(item.venue)}</p>
          ${item.mapUrl ? `<a href="${esc(item.mapUrl)}" target="_blank" rel="noopener" class="ceremony-map-btn">View on Google Maps →</a>` : ''}
        </div>
      </div>
    `;
  }

  function renderGallery(gallery) {
    if (!gallery || !gallery.photos || !gallery.photos.length) return '';
    const items = gallery.photos.map((src, i) => `
      <div class="gallery-cell">
        <div class="gallery-frame">
          <img src="${esc(src)}" alt="Moment ${i + 1}" class="gallery-photo" loading="lazy" decoding="async"${CM.mode === 'edit' ? ` data-pick-photo="gallery.photos.${i}"` : ''} />
        </div>
      </div>
    `).join('');

    return `
      <section class="gallery-section">
        <div class="section-badge">Moments</div>
        <h2 class="section-title" data-fmt="gallery.title" data-edit-field="gallery.title">${esc(gallery.title || 'Moments of Love')}</h2>
        <div class="gallery-grid">
          ${items}
        </div>
      </section>
    `;
  }

  function renderTravelGuide(guide) {
    if (!guide || !guide.items || !guide.items.length) return '';
    const points = guide.items.map((pt, i) => `
      <li class="travel-point">
        <span class="point-bullet">✦</span>
        <span class="point-text" data-fmt="travelGuide.items.${i}" data-edit-field="travelGuide.items.${i}">${esc(pt)}</span>
      </li>
    `).join('');

    return `
      <section class="travel-section">
        <div class="travel-box">
          <div class="section-badge">Destination Guide</div>
          <h2 class="section-title" data-fmt="travelGuide.title" data-edit-field="travelGuide.title">${esc(guide.title || 'Travel & Destination')}</h2>
          <p class="section-sub" data-fmt="travelGuide.subtitle" data-edit-field="travelGuide.subtitle">${esc(guide.subtitle || 'Essential information for our beloved guests')}</p>
          <ul class="travel-list">
            ${points}
          </ul>
        </div>
      </section>
    `;
  }

  function renderInvitation() {
    const c = CM.config;
    const ceremoniesHtml = (c.ceremonies || []).map((item, idx) => renderCeremonyCard(item, idx)).join('');

    return `
      ${renderOpeningCard(c)}

      <main class="crimson-main" id="mainContent">
        <!-- Hero Header -->
        <header class="main-hero">
          <div class="invocation-badge" data-fmt="invocation.text" data-edit-field="invocation.text">${esc(c.invocation?.text || '॥ श्री गणेशाय नमः ॥')}</div>
          <div class="hero-crest">
            <span class="hero-monogram" data-no-wording>${esc(c.monogram || 'AK')}</span>
          </div>
          <div class="hero-lead">The Wedding Celebration of</div>
          <h1 class="hero-couple"><span data-fmt="brideName" data-edit-field="brideName">${esc(c.brideName || 'Ankita')}</span> <span class="amp">&amp;</span> <span data-fmt="groomName" data-edit-field="groomName">${esc(c.groomName || 'Kaushik')}</span></h1>
          <div class="hero-date" data-fmt="eventDate" data-edit-field="eventDate">${esc(c.eventDate || '27th & 28th February, 2026')}</div>
          <div class="hero-venue" data-fmt="venue" data-edit-field="venue">${esc(c.venue || 'Umaid Bhawan Palace, Udaipur')}</div>
        </header>

        <!-- Torn paper divider -->
        <div class="torn-divider" aria-hidden="true"></div>

        <!-- Ceremonies Section -->
        <section class="ceremonies-section" id="ceremoniesSection">
          <div class="section-badge">Celebrations</div>
          <h2 class="section-title">Wedding Ceremonies</h2>
          <p class="section-sub">Join us in celebrating the rituals of togetherness</p>

          <div class="ceremonies-stack">
            ${ceremoniesHtml}
          </div>
        </section>

        <!-- Our Story Section -->
        ${c.story ? `
          <section class="story-section">
            <div class="story-card">
              <div class="section-badge">Our Journey</div>
              <h2 class="section-title" data-fmt="story.title" data-edit-field="story.title">${esc(c.story.title || 'Our Story')}</h2>
              <p class="section-sub" data-fmt="story.subtitle" data-edit-field="story.subtitle">${esc(c.story.subtitle || 'Two souls, one beautiful journey')}</p>
              
              <div class="story-image-wrap">
                <img src="${esc(c.story.image)}" alt="Our Story" class="story-photo" loading="lazy" decoding="async"${CM.mode === 'edit' ? ` data-pick-photo="story.image"` : ''} />
              </div>

              <blockquote class="story-quote" data-fmt="story.quote" data-edit-field="story.quote">${esc(c.story.quote || '')}</blockquote>
              <p class="story-body" data-fmt="story.body" data-edit-field="story.body">${esc(c.story.body || '')}</p>
            </div>
          </section>
        ` : ''}

        <!-- Destination / Travel Guide -->
        ${renderTravelGuide(c.travelGuide)}

        <!-- Photo Gallery -->
        ${renderGallery(c.gallery)}

        <!-- RSVP Section -->
        <section class="rsvp-wrapper" id="rsvpSection">
          <div id="balcony-rsvp"></div>
        </section>

        <footer class="crimson-footer">
          <div class="footer-couple"><span data-fmt="brideName" data-edit-field="brideName">${esc(c.brideName || 'Ankita')}</span> <span class="amp">&amp;</span> <span data-fmt="groomName" data-edit-field="groomName">${esc(c.groomName || 'Kaushik')}</span></div>
          <div class="footer-note">We eagerly await your gracious presence &amp; blessings.</div>
        </footer>
      </main>
    `;
  }

  CM.render = function () {
    const root = document.getElementById('templateRoot');
    if (!root) return;
    root.innerHTML = renderInvitation();
  };
})();
