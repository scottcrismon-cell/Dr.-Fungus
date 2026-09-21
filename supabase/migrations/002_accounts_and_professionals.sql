-- Role-aware accounts and professional directory for Dr. Fungus.
-- Subscription state is server-controlled; clients cannot activate listings.

create type public.account_type as enum ('patient', 'professional');
create type public.verification_status as enum ('draft', 'pending', 'verified', 'rejected');
create type public.subscription_status as enum ('inactive', 'trialing', 'active', 'past_due', 'canceled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  account_type public.account_type not null default 'patient',
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.professional_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  display_name text,
  credentials text,
  specialty text,
  practice_name text,
  city text,
  state text,
  postal_code text,
  accepts_telehealth boolean not null default false,
  verification_status public.verification_status not null default 'draft',
  listing_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.professional_subscriptions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  status public.subscription_status not null default 'inactive',
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

create index professional_profiles_postal_code_idx
on public.professional_profiles (postal_code)
where verification_status = 'verified' and listing_active = true;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, account_type, full_name)
  values (
    new.id,
    case
      when new.raw_user_meta_data ->> 'account_type' = 'professional'
        then 'professional'::public.account_type
      else 'patient'::public.account_type
    end,
    new.raw_user_meta_data ->> 'full_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.professional_profiles enable row level security;
alter table public.professional_subscriptions enable row level security;

create policy "Users can read their profile"
on public.profiles for select using (auth.uid() = id);

create policy "Users can update their profile"
on public.profiles for update using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Professionals can create their own professional profile"
on public.professional_profiles for insert
with check (
  auth.uid() = user_id
  and verification_status = 'draft'
  and listing_active = false
  and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.account_type = 'professional'
  )
);

create policy "Professionals can update their own professional profile"
on public.professional_profiles for update using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.protect_professional_listing_status()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('anon', 'authenticated') and (
    new.verification_status is distinct from old.verification_status
    or new.listing_active is distinct from old.listing_active
  ) then
    raise exception 'Verification and listing status are managed by Dr. Fungus.';
  end if;
  return new;
end;
$$;

create trigger protect_professional_listing_status
before update on public.professional_profiles
for each row execute procedure public.protect_professional_listing_status();

create policy "Owners and visitors can read eligible professional profiles"
on public.professional_profiles for select
using (
  auth.uid() = user_id
  or (verification_status = 'verified' and listing_active = true)
);

create policy "Professionals can read their subscription"
on public.professional_subscriptions for select
using (auth.uid() = user_id);

-- No client insert/update policies exist for professional_subscriptions.
-- A trusted Stripe webhook using the service role updates subscription status
-- and sets professional_profiles.listing_active only after verification.
