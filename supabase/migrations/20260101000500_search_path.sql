-- =====================================================================
-- Supabase 호스팅에서는 pgcrypto 가 extensions 스키마에 설치된다.
-- (로컬 Postgres 에서는 public.) security definer 함수들이 search_path 를
-- public 으로만 잠가 두면 crypt()/gen_salt()/gen_random_bytes() 를 찾지 못한다.
-- 존재하지 않는 스키마는 search_path 에서 무시되므로 로컬에도 같은 설정이 안전하다.
-- =====================================================================
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as sig
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.prosecdef
  loop
    execute format('alter function %s set search_path = public, extensions, pg_temp', r.sig);
  end loop;
end $$;
