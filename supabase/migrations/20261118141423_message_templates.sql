-- Ready-made messages a host can send with a friend's name. Placeholders:
-- {friend} the friend's name, {host} the hosts' names, {link} the invitation link.
create table public.message_templates (
  id text primary key check (id ~ '^[a-z0-9-]{2,60}$'),
  label text not null check (char_length(label) between 1 and 60),
  body text not null check (char_length(body) between 10 and 600 and position('{link}' in body) > 0),
  category_slugs text[] not null default '{}',
  sort int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.message_templates enable row level security;
revoke all on public.message_templates from anon, authenticated;
grant select on public.message_templates to authenticated;
create policy "active messages are readable when signed in" on public.message_templates
  for select to authenticated using (is_active);

-- An empty category list means the message suits every template.
insert into public.message_templates (id, label, body, sort) values
  ('warm-invite', 'Warm invite',
   E'Hi {friend}! 💌 {host} would love for you to be part of the celebration.\nYour personal invitation is here: {link}', 1),
  ('save-the-date', 'Save the date',
   E'{friend}, save the date! 🗓️\nYour invitation from {host} is ready: {link}', 2),
  ('heartfelt', 'Heartfelt',
   E'Dear {friend}, it would mean the world to us to have you there. 💍\nOpen your invitation: {link}\n— {host}', 3),
  ('hinglish', 'Namaste (Hinglish)',
   E'Namaste {friend} ji 🙏\n{host} ki taraf se aapko hardik nimantran hai. Invitation yahan dekhein: {link}', 4),
  ('playful', 'Playful',
   E'{friend}, it just will not be the same without you! 🎉\nTap to see our invitation: {link}\n— {host}', 5);
