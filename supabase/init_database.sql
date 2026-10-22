-- ============================================================================
-- LogosAI — Инициализация базы данных Supabase
-- Единый SQL-скрипт для вставки в Supabase SQL Editor
-- ============================================================================

-- 0. Расширения
create extension if not exists pgcrypto;

-- ============================================================================
-- 1. Таблица profiles — профили пользователей (логопеды и родители)
-- ============================================================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  full_name text,
  role text check (role in ('speech_therapist', 'parent'))
);

comment on table public.profiles is 'Профили пользователей (логопеды и родители)';
comment on column public.profiles.role is 'Роль: speech_therapist или parent';

-- ============================================================================
-- 2. Триггер автосоздания профиля при регистрации нового пользователя
--    в auth.users ( Supabase Auth )
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, updated_at, full_name, role)
  values (
    new.id,
    now(),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'role'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ============================================================================
-- 3. Таблица lessons — сгенерированные ИИ уроки
-- ============================================================================
create table if not exists public.lessons (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  lexical_theme text not null,
  difficulty_level text check (difficulty_level in ('low', 'medium', 'high')) not null,
  raw_json jsonb not null default '{}'::jsonb
);

comment on table public.lessons is 'Сгенерированные ИИ уроки (структура в raw_json)';

-- ============================================================================
-- 4. Таблица student_progress — аналитика прохождения уроков
-- ============================================================================
create table if not exists public.student_progress (
  id uuid default gen_random_uuid() primary key,
  lesson_id uuid references public.lessons(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  score integer check (score >= 0 and score <= 100),
  lives_wasted integer check (lives_wasted >= 0),
  unique (lesson_id, user_id)
);

comment on table public.student_progress is 'Прогресс и результаты прохождения уроков';

-- ============================================================================
-- 5. Индексы для ускорения частых запросов
-- ============================================================================
create index if not exists lessons_user_id_idx on public.lessons(user_id);
create index if not exists lessons_created_at_idx on public.lessons(created_at desc);
create index if not exists student_progress_user_id_idx on public.student_progress(user_id);
create index if not exists student_progress_lesson_id_idx on public.student_progress(lesson_id);

-- ============================================================================
-- 6. Row Level Security (RLS) — безопасность на уровне строк
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.lessons enable row level security;
alter table public.student_progress enable row level security;

-- --- profiles: пользователь читает и обновляет только свой профиль ---
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- --- lessons: только владелец урока (user_id = auth.uid()) может
--     создавать, читать, обновлять и удалять свои уроки ---
create policy "lessons_select_owner"
  on public.lessons for select
  to authenticated
  using (auth.uid() = user_id);

create policy "lessons_insert_owner"
  on public.lessons for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "lessons_update_owner"
  on public.lessons for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "lessons_delete_owner"
  on public.lessons for delete
  to authenticated
  using (auth.uid() = user_id);

-- --- student_progress: запись и чтение результатов только для своего прогресса ---
create policy "student_progress_select_own"
  on public.student_progress for select
  to authenticated
  using (auth.uid() = user_id);

create policy "student_progress_insert_own"
  on public.student_progress for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "student_progress_update_own"
  on public.student_progress for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================================
-- 7. Права доступа к схеме и таблицам
-- ============================================================================
grant usage on schema public to authenticated, anon;
grant all on all tables in schema public to authenticated;
grant all on all sequences in schema public to authenticated;

-- ============================================================================
-- Готово. Примените этот скрипт в Supabase SQL Editor.
-- ============================================================================
