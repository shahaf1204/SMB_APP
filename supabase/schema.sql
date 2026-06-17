-- הריצי ב-Supabase → SQL Editor (פעם אחת)
-- Authentication → Providers → Email: כבו «Confirm email» לחוויית הרשמה מיידית

create table if not exists public.app_snapshots (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  snapshot jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_snapshots enable row level security;

create policy "snapshots_select_own"
  on public.app_snapshots for select
  using (auth.uid() = user_id);

create policy "snapshots_insert_own"
  on public.app_snapshots for insert
  with check (auth.uid() = user_id);

create policy "snapshots_update_own"
  on public.app_snapshots for update
  using (auth.uid() = user_id);

create index if not exists app_snapshots_updated_at_idx
  on public.app_snapshots (updated_at desc);
