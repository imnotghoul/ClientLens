-- Idempotent wallet credit ledger. It also repairs succeeded payment rows
-- created before the ledger existed, without crediting them twice.
create table if not exists public.wallet_credits (
  payment_id text primary key references public.payment_orders(yookassa_payment_id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  created_at timestamptz not null default now()
);

alter table public.wallet_credits enable row level security;
drop policy if exists "Users read own wallet credits" on public.wallet_credits;
create policy "Users read own wallet credits" on public.wallet_credits
  for select using (auth.uid() = user_id);

create or replace function public.reconcile_yookassa_payment(
  p_payment_id text,
  p_user_id uuid,
  p_amount numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_user uuid;
  existing_amount numeric;
  inserted_count integer;
begin
  if p_payment_id is null or p_user_id is null or p_amount is null or p_amount <= 0 then
    raise exception 'Invalid payment credit data';
  end if;

  select user_id, amount into existing_user, existing_amount
    from public.payment_orders
    where yookassa_payment_id = p_payment_id
    for update;

  if existing_user is null then
    insert into public.payment_orders
      (yookassa_payment_id, user_id, amount, status, credited_at)
    values (p_payment_id, p_user_id, p_amount, 'succeeded', now());
  elsif existing_user <> p_user_id or existing_amount <> p_amount then
    raise exception 'Payment metadata mismatch';
  else
    update public.payment_orders
      set status = 'succeeded', credited_at = coalesce(credited_at, now())
      where yookassa_payment_id = p_payment_id;
  end if;

  insert into public.wallet_credits (payment_id, user_id, amount)
  values (p_payment_id, p_user_id, p_amount)
  on conflict (payment_id) do nothing;
  get diagnostics inserted_count = row_count;

  if inserted_count = 1 then
    insert into public.wallets (user_id, balance, updated_at)
    values (p_user_id, p_amount, now())
    on conflict (user_id) do update
      set balance = public.wallets.balance + excluded.balance,
          updated_at = now();
  end if;
end;
$$;

create or replace function public.credit_yookassa_payment(
  p_payment_id text,
  p_user_id uuid,
  p_amount numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.reconcile_yookassa_payment(p_payment_id, p_user_id, p_amount);
end;
$$;

revoke all on function public.reconcile_yookassa_payment(text, uuid, numeric) from public, anon, authenticated;
grant execute on function public.reconcile_yookassa_payment(text, uuid, numeric) to service_role;
revoke all on function public.credit_yookassa_payment(text, uuid, numeric) from public, anon, authenticated;
grant execute on function public.credit_yookassa_payment(text, uuid, numeric) to service_role;
