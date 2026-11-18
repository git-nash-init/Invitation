-- Template files are no longer public. Marketing covers live in /covers on the site.
update public.templates set cover_path = '/covers/' || slug || '.webp'
  where slug in ('royale', 'noor', 'rose-invitation', 'papercut-magenta', 'papercut');
