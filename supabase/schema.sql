-- Run this once in Supabase → SQL Editor.

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  resume jsonb,                 -- structured resume parsed by Claude
  prefs jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company text not null,
  title text not null,
  location text,
  url text,
  deadline text,
  status text not null default 'Saved',
  notes text,
  created_at timestamptz default now()
);
create index if not exists jobs_user_idx on public.jobs(user_id, created_at desc);

create table if not exists public.usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default current_date,
  kind text not null,           -- 'ai' or 'search'
  count int not null default 0,
  primary key (user_id, day, kind)
);

alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.usage enable row level security;

create policy "own profile" on public.profiles for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own jobs" on public.jobs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "read own usage" on public.usage for select
  using (auth.uid() = user_id);

-- Atomically checks and increments today's usage. Returns true if allowed.
create or replace function public.consume_quota(p_kind text, p_limit int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  if auth.uid() is null then
    return false;
  end if;
  insert into public.usage (user_id, day, kind, count)
  values (auth.uid(), current_date, p_kind, 1)
  on conflict (user_id, day, kind)
  do update set count = public.usage.count + 1
  returning count into v_count;
  return v_count <= p_limit;
end;
$$;
revoke all on function public.consume_quota(text, int) from public;
grant execute on function public.consume_quota(text, int) to authenticated;
