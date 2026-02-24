-- =============================================
-- Prestatario Database Schema
-- =============================================

-- Enable RLS
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;

-- =============================================
-- PROFILES TABLE
-- =============================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  currency text default 'DOP',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

-- Trigger for new user
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================
-- CONTACTS TABLE
-- =============================================
create table if not exists public.contacts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  phone text,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.contacts enable row level security;
create policy "Users manage own contacts" on public.contacts
  for all using (auth.uid() = user_id);

-- =============================================
-- LOANS TABLE
-- =============================================
-- Tabla de préstamos
create table if not exists public.loans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  contact_id uuid references public.contacts(id) on delete set null,
  borrower_name text not null,
  amount decimal(12,2) not null check (amount > 0),
  total_paid decimal(12,2) default 0,
  interest_rate decimal(5,2) default 0,
  installments integer default 1,
  tags text[] default '{}',
  description text,
  loan_date date default current_date not null,
  due_date date,
  status text default 'active' check (status in ('active', 'returned', 'overdue')),
  returned_date date,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.loans enable row level security;
create policy "Users manage own loans" on public.loans
  for all using (auth.uid() = user_id);

-- =============================================
-- LOAN PAYMENTS TABLE
-- =============================================
-- Tabla de abonos/pagos parciales (NUEVA)
create table if not exists public.loan_payments (
  id uuid default gen_random_uuid() primary key,
  loan_id uuid references public.loans(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount decimal(12,2) not null check (amount > 0),
  payment_date date default current_date not null,
  notes text,
  created_at timestamptz default now() not null
);

alter table public.loan_payments enable row level security;
create policy "Users manage own payments" on public.loan_payments
  for all using (auth.uid() = user_id);

-- =============================================
-- LOAN ATTACHMENTS TABLE
-- =============================================
-- Tabla de adjuntos/evidencias
create table if not exists public.loan_attachments (
  id uuid default gen_random_uuid() primary key,
  loan_id uuid references public.loans(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  file_path text not null,
  file_name text not null,
  type text not null check (type in ('transfer', 'payment')),
  created_at timestamptz default now() not null
);

alter table public.loan_attachments enable row level security;
create policy "Users manage own attachments" on public.loan_attachments
  for all using (auth.uid() = user_id);

-- Index for fast queries
create index if not exists idx_loans_user_status on public.loans(user_id, status);
create index if not exists idx_loans_contact on public.loans(contact_id);
create index if not exists idx_contacts_user on public.contacts(user_id);

-- =============================================
-- MIGRATION (run these on existing databases)
-- =============================================
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS interest_rate decimal(5,2) DEFAULT 0;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS installments integer DEFAULT 1;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
