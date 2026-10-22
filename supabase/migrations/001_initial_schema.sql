-- LogosAI — initial schema
-- Выполняется в Supabase (PostgreSQL). Включает RLS для всех таблиц.

-- 1. profiles — привязана к auth.users
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  full_name text,
  role text check (role in ('speech_therapist', 'parent'))
);

-- 2. lessons — доступ только для владельца (user_id)
create table if not exists public.lessons (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  lexical_theme text not null,
  difficulty_level text check (difficulty_level in ('low', 'medium', 'high')) not null,
  raw_json jsonb not null default '{}'::jsonb
);

-- 3. student_progress
create table if not exists public.student_progress (
  id uuid default gen_random_uuid() primary key,
  lesson_id uuid references public.lessons on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  completed_at timestamp with time zone,
  score integer check (score >= 0 and score <= 100),
  lives_wasted integer check (lives_wasted >= 0),
  unique (lesson_id, user_id)
);

-- Индексы для частых запросов
create index if not exists lessons_user_id_idx on public.lessons(user_id);
create index if not exists lessons_created_at_idx on public.lessons(created_at desc);
create index if not exists student_progress_user_id_idx on public.student_progress(user_id);
create index if not exists student_progress_lesson_id_idx on public.student_progress(lesson_id);

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.lessons enable row level security;
alter table public.student_progress enable row level security;

-- profiles: пользователь читает/пишет только свою строку
create policy "profiles select own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles insert own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles update own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- lessons: доступ только владельцу
create policy "lessons select owner"
  on public.lessons for select
  using (auth.uid() = user_id);

create policy "lessons insert owner"
  on public.lessons for insert
  with check (auth.uid() = user_id);

create policy "lessons update owner"
  on public.lessons for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "lessons delete owner"
  on public.lessons for delete
  using (auth.uid() = user_id);

-- student_progress: владелец прогресса читает/пишет свою запись
create policy "student_progress select own"
  on public.student_progress for select
  using (auth.uid() = user_id);

create policy "student_progress insert own"
  on public.student_progress for insert
  with check (auth.uid() = user_id);

create policy "student_progress update own"
  on public.student_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- Триггер обновления updated_at в profiles
-- ------------------------------------------------------------

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();
