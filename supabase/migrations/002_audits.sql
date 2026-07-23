create table if not exists public.audits (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  report jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists audits_user_created_at_idx on public.audits (user_id, created_at desc);

alter table public.audits enable row level security;

create policy "Users read own audits" on public.audits for select using (auth.uid() = user_id);
create policy "Users create own audits" on public.audits for insert with check (auth.uid() = user_id);
create policy "Users update own audits" on public.audits for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete own audits" on public.audits for delete using (auth.uid() = user_id);
