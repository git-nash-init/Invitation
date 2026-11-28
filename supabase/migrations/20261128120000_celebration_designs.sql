-- Three new categories beyond weddings, with three designs each.
-- The designs run on the shared engine in private-templates/_moments/.

insert into public.categories (slug, name, emoji, blurb, sort, is_active) values
  ('birthday', 'Birthdays', '🎂', 'Loud, bright and made to be shared', 4, true),
  ('baby-naming', 'Baby Showers and Naming', '🍼', 'Soft welcomes for the newest arrival', 5, true),
  ('housewarming-festive', 'Housewarming and Festive', '🏡', 'New homes, Diwali nights and family get-togethers', 6, true)
on conflict (slug) do update set
  name = excluded.name, emoji = excluded.emoji, blurb = excluded.blurb, sort = excluded.sort, is_active = excluded.is_active;

insert into public.templates (slug, name, tagline, category, category_slug, highlights, cover_path, sort, price, bullets) values
  ('birthday-arcade', 'Level Up',
   'A neon arcade birthday: press start, the level loads, and the countdown runs like a high score.',
   'Birthday', 'birthday', 'Arcade start screen, neon countdown', '/previews/birthday-arcade/cover.webp', 9, 699,
   '["Press-start opening with a loading bar", "Four neon colour themes", "Countdown, plan, photos, map and RSVP"]'::jsonb),
  ('birthday-confetti', 'Confetti Pop',
   'Pop the balloon to open a bright, bold birthday with confetti all the way down.',
   'Birthday', 'birthday', 'Balloon pop opening, confetti', '/previews/birthday-confetti/cover.webp', 10, 699,
   '["Tap the balloon and it pops", "Bold cards in four colour themes", "Countdown, plan, photos, map and RSVP"]'::jsonb),
  ('birthday-polaroid', 'Polaroid Party',
   'A scrapbook birthday: flip the taped polaroid and scroll through your own photos and handwritten notes.',
   'Birthday', 'birthday', 'Polaroid flip, scrapbook photos', '/previews/birthday-polaroid/cover.webp', 11, 699,
   '["A polaroid cover with your photo", "Sticky notes and a photo scrapbook", "Countdown, plan, map and RSVP"]'::jsonb),
  ('baby-cloud', 'Cloud Nine',
   'A pastel sky baby shower: the clouds part, the moon rises and the day unfolds.',
   'Baby shower', 'baby-naming', 'Clouds part, moon rises', '/previews/baby-cloud/cover.webp', 12, 699,
   '["Clouds part to open the invitation", "Soft themes for a boy, a girl or a surprise", "Countdown, plan, photos, map and RSVP"]'::jsonb),
  ('baby-jungle', 'Little Jungle',
   'A safari baby shower: the leaves swing apart and a lion cub peeks out.',
   'Baby shower', 'baby-naming', 'Leaf curtain, peeking lion cub', '/previews/baby-jungle/cover.webp', 13, 699,
   '["Leaves swing aside to reveal the day", "Four jungle colour themes", "Countdown, plan, photos, map and RSVP"]'::jsonb),
  ('baby-namkaran', 'Namkaran',
   'A naming ceremony with a swinging cradle. The name stays veiled until each guest taps to reveal it.',
   'Naming ceremony', 'baby-naming', 'Name reveal, swinging cradle', '/previews/baby-namkaran/cover.webp', 14, 699,
   '["Guests tap to reveal the name", "Marigold toran, cradle and diyas", "Muhurat, ceremony plan, map and RSVP"]'::jsonb),
  ('home-griha', 'Griha Pravesh',
   'Open the carved front door of your new home: toran above, rangoli at the step and the puja timings inside.',
   'Housewarming', 'housewarming-festive', 'Doors swing open, rangoli', '/previews/home-griha/cover.webp', 15, 699,
   '["Carved doors swing open", "Puja timings, lunch and directions", "Photos of the new home and RSVP"]'::jsonb),
  ('home-keys', 'New Keys',
   'A modern housewarming: a key turns in the lock, the wall slides open and the new address is one tap away.',
   'Housewarming', 'housewarming-festive', 'Key and lock opening, bold type', '/previews/home-keys/cover.webp', 16, 699,
   '["A key turns to unlock the invitation", "Big editorial type in four themes", "House tour photos, map and RSVP"]'::jsonb),
  ('festive-lights', 'Festival of Lights',
   'A Diwali or festive party: the screen is dark until the guest lights the diya, then the lights come on.',
   'Festive party', 'housewarming-festive', 'Light the diya, fireworks', '/previews/festive-lights/cover.webp', 17, 699,
   '["Guests light the diya to begin", "String lights and fireworks", "Evening plan, photos, map and RSVP"]'::jsonb)
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
