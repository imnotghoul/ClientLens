create table if not exists public.wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance numeric(12,2) not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  yookassa_payment_id text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending', 'succeeded', 'canceled')),
  credited_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.wallets enable row level security;
alter table public.payment_orders enable row level security;
drop policy if exists "Users read own wallet" on public.wallets;
create policy "Users read own wallet" on public.wallets for select using (auth.uid() = user_id);
drop policy if exists "Users read own payment orders" on public.payment_orders;
create policy "Users read own payment orders" on public.payment_orders for select using (auth.uid() = user_id);

create or replace function public.credit_yookassa_payment(p_payment_id text, p_user_id uuid, p_amount numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_status text;
begin
  select status into existing_status from public.payment_orders where yookassa_payment_id = p_payment_id for update;
  if existing_status = 'succeeded' then return; end if;

  if existing_status is null then
    insert into public.payment_orders (yookassa_payment_id, user_id, amount, status, credited_at)
    values (p_payment_id, p_user_id, p_amount, 'succeeded', now());
  else
    update public.payment_orders
      set status = 'succeeded', credited_at = now(), amount = p_amount, user_id = p_user_id
      where yookassa_payment_id = p_payment_id;
  end if;

  insert into public.wallets (user_id, balance, updated_at)
  values (p_user_id, p_amount, now())
  on conflict (user_id) do update set balance = public.wallets.balance + excluded.balance, updated_at = now();
end;
$$;

revoke all on function public.credit_yookassa_payment(text, uuid, numeric) from public, anon, authenticated;
grant execute on function public.credit_yookassa_payment(text, uuid, numeric) to service_role;
