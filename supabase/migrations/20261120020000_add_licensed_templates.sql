-- Migration: Register 3 licensed wedding invitation templates
insert into public.templates (slug, name, tagline, category, category_slug, highlights, cover_path, sort, price, bullets) values
  ('destination-resort', 'The Grand Resort',
   'Opulent palace resort celebration with royal countdown, ceremony maps, and keepsake memories.',
   'Royal palace', 'royal-palace', 'Countdown timer, ceremony maps', '/previews/destination-resort/cover.webp', 6, 699,
   '["Royal palace card opening", "Live wedding countdown timer", "Multi-ceremony maps & RSVP"]'::jsonb),
  ('sage-envelope', 'The Sage Envelope',
   'Handcrafted sage watercolor envelope with wax seal reveal, event flow cards, and couple journey.',
   'Botanical sage', 'floral-pastel', 'Wax seal reveal, itinerary cards', '/previews/sage-envelope/cover.webp', 7, 699,
   '["Sage watercolor envelope with wax seal", "Event itinerary cards with map links", "Our journey timeline with built-in RSVP"]'::jsonb),
  ('crimson-monogram', 'The Crimson Monogram',
   'Deep royal crimson stationery with gold monogram crest, torn-paper dividers, and palace travel guide.',
   'Royal palace', 'royal-palace', 'Gold monogram, destination guide', '/previews/crimson-monogram/cover.webp', 8, 699,
   '["Royal crimson cover with gold monogram", "Torn-paper ceremony cards with maps", "Udaipur destination guide & RSVP"]'::jsonb)
on conflict (slug) do update set
  name = excluded.name,
  tagline = excluded.tagline,
  category = excluded.category,
  category_slug = excluded.category_slug,
  highlights = excluded.highlights,
  cover_path = excluded.cover_path,
  sort = excluded.sort,
  price = excluded.price,
  bullets = excluded.bullets;
