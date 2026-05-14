create table public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  mode text not null default 'chat',
  created_at timestamptz not null default now()
);

create index messages_user_created_idx on public.messages(user_id, created_at);

alter table public.messages enable row level security;

create policy "users select own messages" on public.messages
  for select using (auth.uid() = user_id);

create policy "users insert own messages" on public.messages
  for insert with check (auth.uid() = user_id);

create policy "users delete own messages" on public.messages
  for delete using (auth.uid() = user_id);