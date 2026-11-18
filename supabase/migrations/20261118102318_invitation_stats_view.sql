create or replace view public.invitation_stats
with (security_invoker = true) as
select
  i.id as invitation_id,
  (select count(*) from public.guests g where g.invitation_id = i.id)::int as guests,
  count(r.id)::int as replies,
  coalesce(sum(r.headcount) filter (where r.attending), 0)::int as headcount
from public.invitations i
left join public.rsvps r on r.invitation_id = i.id
group by i.id;

revoke all on public.invitation_stats from anon, authenticated;
grant select on public.invitation_stats to authenticated;
