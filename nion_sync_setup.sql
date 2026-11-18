-- Nion: online saving ("Sync across devices")
-- Paste ALL of this into Supabase > SQL Editor > New query, then press Run.

create table if not exists public.nion_sync (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  rev integer not null default 1,
  updated_at timestamptz not null default now()
);

create table if not exists public.nion_packs (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  sid text not null,
  t bigint not null default 0,
  data jsonb,
  primary key (user_id, sid)
);

-- Each person can only ever see and change their own saved data.
alter table public.nion_sync enable row level security;
alter table public.nion_packs enable row level security;

drop policy if exists "own sync row" on public.nion_sync;
create policy "own sync row" on public.nion_sync for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own packs" on public.nion_packs;
create policy "own packs" on public.nion_packs for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update, delete on public.nion_sync, public.nion_packs to authenticated;
