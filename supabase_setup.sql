-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New query)

create table if not exists public.watchlist (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users(id) on delete cascade not null,
  ticker     text not null,
  created_at timestamptz default now(),
  unique(user_id, ticker)
);

-- Enable Row Level Security
alter table public.watchlist enable row level security;

-- Users can only see and modify their own watchlist
create policy "Users can view own watchlist"
  on public.watchlist for select
  using (auth.uid() = user_id);

create policy "Users can insert own watchlist"
  on public.watchlist for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own watchlist"
  on public.watchlist for delete
  using (auth.uid() = user_id);
