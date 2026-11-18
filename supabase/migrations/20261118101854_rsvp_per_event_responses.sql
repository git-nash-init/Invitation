-- Templates collect an answer per ceremony plus a contact number.
alter table public.rsvps
  add column contact text check (contact is null or contact ~ '^[0-9]{6,15}$'),
  add column responses jsonb not null default '[]'::jsonb
    check (jsonb_typeof(responses) = 'array' and jsonb_array_length(responses) <= 20);

create or replace function public.submit_rsvp(
  p_slug text,
  p_code text,
  p_name text,
  p_contact text,
  p_responses jsonb,
  p_message text
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  inv public.invitations%rowtype;
  g public.guests%rowtype;
  clean_name text := btrim(coalesce(p_name, ''));
  clean_contact text := nullif(regexp_replace(coalesce(p_contact, ''), '\D', '', 'g'), '');
  clean_msg text := nullif(btrim(coalesce(p_message, '')), '');
  r jsonb;
  clean jsonb := '[]'::jsonb;
  st text;
  cnt int;
  going boolean := false;
  heads int := 0;
begin
  select * into inv from public.invitations where slug = p_slug and status = 'published';
  if not found then
    raise exception 'Invitation not found' using errcode = 'P0002';
  end if;

  if p_responses is null or jsonb_typeof(p_responses) <> 'array'
     or jsonb_array_length(p_responses) > 20 then
    raise exception 'Invalid responses' using errcode = '22023';
  end if;

  if clean_msg is not null and char_length(clean_msg) > 500 then
    raise exception 'Message is too long' using errcode = '22023';
  end if;
  if clean_contact is not null and char_length(clean_contact) not between 6 and 15 then
    raise exception 'Invalid contact number' using errcode = '22023';
  end if;

  if inv.guest_mode = 'personalised' and p_code is not null and char_length(p_code) <= 40 then
    select * into g from public.guests where code = p_code and invitation_id = inv.id;
  end if;

  -- A known guest answers under their own name.
  if g.id is not null then
    clean_name := g.name;
  end if;
  if char_length(clean_name) not between 1 and 80 then
    raise exception 'Name must be 1 to 80 characters' using errcode = '22023';
  end if;

  for r in select * from jsonb_array_elements(p_responses) loop
    st := r ->> 'status';
    if st is null or st not in ('attending', 'maybe', 'not-attending') then
      raise exception 'Invalid status' using errcode = '22023';
    end if;
    cnt := case
      when r ->> 'guestCount' ~ '^[0-9]{1,2}$' then least((r ->> 'guestCount')::int, 20)
      else null
    end;
    if st in ('attending', 'maybe') then
      going := true;
      heads := greatest(heads, coalesce(cnt, 1));
    end if;
    clean := clean || jsonb_build_array(jsonb_build_object(
      'event', left(coalesce(r ->> 'rsvpEventId', ''), 40),
      'status', st,
      'guestCount', cnt
    ));
  end loop;

  if (select count(*) from public.rsvps where invitation_id = inv.id) >= 2000 then
    raise exception 'This invitation is not accepting more replies' using errcode = 'P0001';
  end if;

  -- A personalised guest has one reply; resubmitting replaces it.
  if g.id is not null then
    delete from public.rsvps where guest_id = g.id;
  end if;

  insert into public.rsvps
    (invitation_id, guest_id, name, contact, attending, headcount, message, responses)
  values
    (inv.id, g.id, clean_name, clean_contact, going, heads, clean_msg, clean);
end;
$$;

revoke execute on function public.submit_rsvp(text, text, text, text, jsonb, text) from public;
grant execute on function public.submit_rsvp(text, text, text, text, jsonb, text) to anon, authenticated;
