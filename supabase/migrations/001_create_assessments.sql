-- Prototype schema for Dr. Fungus.
-- Run this in a Supabase project after authentication is added.

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  image_path text not null,
  concern text not null,
  notes text,
  status text not null default 'awaiting_analysis'
    check (status in ('awaiting_analysis', 'processing', 'complete', 'needs_review', 'failed')),
  diagnostic_result jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.assessments enable row level security;

create policy "Users can read their own assessments"
on public.assessments for select
using (auth.uid() = user_id);

create policy "Users can create their own assessments"
on public.assessments for insert
with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('foot-assessments', 'foot-assessments', false)
on conflict (id) do nothing;

create policy "Users can upload their own assessment images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'foot-assessments'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can read their own assessment images"
on storage.objects for select to authenticated
using (
  bucket_id = 'foot-assessments'
  and exists (
    select 1 from public.assessments
    where assessments.image_path = storage.objects.name
      and assessments.user_id = auth.uid()
  )
);
