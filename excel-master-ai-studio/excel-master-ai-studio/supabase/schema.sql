create table if not exists public.datasets (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, name text not null, r2_key text not null, row_count integer not null default 0, created_at timestamptz not null default now());
create table if not exists public.learning_progress (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, lesson_id text not null, completed boolean not null default false, updated_at timestamptz not null default now(), unique(user_id,lesson_id));
create table if not exists public.analysis_runs (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, dataset_id uuid references public.datasets(id) on delete set null, summary jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());
alter table public.datasets enable row level security;
alter table public.learning_progress enable row level security;
alter table public.analysis_runs enable row level security;
create policy "own datasets" on public.datasets for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "own progress" on public.learning_progress for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "own analyses" on public.analysis_runs for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
