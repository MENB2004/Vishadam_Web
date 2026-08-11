-- BURN — core schema: submissions + feedback

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  input_text text not null default '',
  lang text not null default 'en',
  keyword text,
  bucket text not null default 'general',
  response_line text not null,
  created_at timestamptz not null default now()
);

create index if not exists submissions_created_at_idx
  on public.submissions (created_at desc);

create index if not exists submissions_bucket_idx
  on public.submissions (bucket);

alter table public.submissions enable row level security;

create policy "anon can insert submissions"
  on public.submissions for insert
  to anon
  with check (true);

create policy "anon can read submissions"
  on public.submissions for select
  to anon
  using (true);

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions (id) on delete cascade,
  vote boolean not null,
  created_at timestamptz not null default now()
);

create index if not exists feedback_submission_idx
  on public.feedback (submission_id);

alter table public.feedback enable row level security;

create policy "anon can insert feedback"
  on public.feedback for insert
  to anon
  with check (true);

alter publication supabase_realtime add table public.submissions;
