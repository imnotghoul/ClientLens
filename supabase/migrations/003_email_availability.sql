-- Used only during registration to give a clear duplicate-email message.
-- Keep the function small and read-only; signup still remains the source of truth.
create or replace function public.is_email_available(candidate text)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select not exists (
    select 1
    from auth.users
    where lower(email) = lower(trim(candidate))
  );
$$;

revoke all on function public.is_email_available(text) from public;
grant execute on function public.is_email_available(text) to anon, authenticated;
