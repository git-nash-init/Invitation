-- Saves or edits a UPI ID. (Replaces an earlier draft whose variable name clashed with a column.)
create or replace function public.admin_upi_save(
  p_id int, p_label text, p_vpa text, p_payee_name text, p_active boolean, p_daily_limit int
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_vpa text := lower(btrim(coalesce(p_vpa, '')));
  v_name text := btrim(coalesce(p_payee_name, ''));
  v_label text := left(btrim(coalesce(p_label, '')), 60);
  v_active int := case when p_active then 1 else 0 end;
  v_limit int := greatest(coalesce(p_daily_limit, 0), 0);
begin
  if not public.is_admin() then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  if v_vpa !~ '^[a-z0-9._-]+@[a-z0-9.-]+$' or char_length(v_vpa) > 60 then
    return jsonb_build_object('ok', false, 'error', 'That does not look like a UPI ID (example: name@okhdfcbank).');
  end if;
  if v_name = '' or char_length(v_name) > 60 then
    return jsonb_build_object('ok', false, 'error', 'Receiver name is required, exactly as payers see it in their UPI app.');
  end if;

  if p_id is null then
    insert into bot.upi_accounts (label, vpa, payee_name, active, daily_limit)
    values (v_label, v_vpa, v_name, v_active, v_limit);
  else
    update bot.upi_accounts
      set label = v_label, vpa = v_vpa, payee_name = v_name, active = v_active, daily_limit = v_limit
      where id = p_id;
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

revoke execute on function public.admin_upi_save(int, text, text, text, boolean, int) from public, anon;
grant execute on function public.admin_upi_save(int, text, text, text, boolean, int) to authenticated;
