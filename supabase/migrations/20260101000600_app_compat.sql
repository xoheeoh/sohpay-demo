-- =====================================================================
-- 앱 화면 플로우 호환
--   · 비밀번호 확인 후 탈퇴 / PIN 재설정 (원본 앱은 PIN 대신 로그인 비밀번호로 본인 확인)
--     비밀번호 검증은 Supabase Auth 로 클라이언트가 먼저 수행하고, 여기서는 세션만 요구한다.
--   · 프로필 이메일 수정 허용
-- =====================================================================

create or replace function public.withdraw_member_confirmed()
returns json
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_uid     uuid := public.current_profile_id();
  v_balance bigint;
begin
  select balance into v_balance from public.wallets where user_id = v_uid for update;

  if v_balance > 0 then
    perform public.app_error('BALANCE_REMAINING', v_balance::text);
  end if;

  update public.profiles set status = 'WITHDRAWN' where id = v_uid;
  return json_build_object('ok', true);
end;
$$;

create or replace function public.set_pin(p_new_pin text)
returns json
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_uid uuid := public.current_profile_id();
begin
  if p_new_pin !~ '^[0-9]{6}$' then
    perform public.app_error('INVALID_PIN_FORMAT');
  end if;
  if p_new_pin ~ '^(.)\1{5}$' then
    perform public.app_error('PIN_TOO_SIMPLE');
  end if;

  update public.profiles
     set pin_hash = crypt(p_new_pin, gen_salt('bf')), pin_failures = 0, pin_locked_at = null
   where id = v_uid;

  return json_build_object('ok', true);
end;
$$;

revoke execute on function public.withdraw_member_confirmed() from public, anon;
revoke execute on function public.set_pin(text) from public, anon;
grant execute on function public.withdraw_member_confirmed() to authenticated;
grant execute on function public.set_pin(text) to authenticated;

grant update (email) on public.profiles to authenticated;
