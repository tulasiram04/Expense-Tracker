-- My Expense Tracker Supabase Database Schema
-- Paste these queries in the Supabase SQL Editor (SQL Editor -> New Query) to setup your database.

-- =========================================================================
-- 1. DROP EXISTING TABLE & TRIGGERS (FOR CLEAN SLATE IF NEEDED)
-- =========================================================================
-- drop trigger if exists on_auth_user_created on auth.users;
-- drop function if exists public.handle_new_user();
-- drop table if exists public.budgets;
-- drop table if exists public.transactions;
-- drop table if exists public.categories;
-- drop table if exists public.profiles;

-- =========================================================================
-- 2. CREATE TABLES
-- =========================================================================

-- Profile Settings Table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  avatar_url text,
  currency text default 'INR',
  theme_color text default '#2563EB',
  notifications_enabled boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  last_login timestamp with time zone default timezone('utc'::text, now())
);

-- Categories Table
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade, -- Nullable for default global categories
  name text not null,
  type text not null check (type in ('income', 'expense')),
  icon text not null, -- FontAwesome class name
  color text not null, -- Hex color code
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Transactions Table
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  date date not null default current_date,
  time time without time zone not null default current_time,
  type text not null check (type in ('income', 'expense')),
  category text not null,
  source text not null, -- Account source: 'IOB Bank', 'Jio Payments Bank', 'Cash', or custom source
  description text,
  amount numeric not null check (amount > 0),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Budget Planner Table
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  category text not null,
  amount numeric not null check (amount >= 0),
  month text not null, -- Format YYYY-MM
  created_at timestamp with time zone default timezone('utc'::text, now()),
  constraint unique_user_category_month unique (user_id, category, month)
);

-- =========================================================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- =========================================================================
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;

-- =========================================================================
-- 4. CREATE RLS POLICIES
-- =========================================================================

-- --- profiles policies ---
create policy "Allow users to read their own profile" 
  on public.profiles for select 
  using (auth.uid() = id);

create policy "Allow users to update their own profile" 
  on public.profiles for update 
  using (auth.uid() = id);

create policy "Allow users to insert their own profile" 
  on public.profiles for insert 
  with check (auth.uid() = id);

-- --- categories policies ---
create policy "Allow users to read global or their own custom categories" 
  on public.categories for select 
  using (user_id is null or auth.uid() = user_id);

create policy "Allow users to insert their own categories" 
  on public.categories for insert 
  with check (auth.uid() = user_id);

create policy "Allow users to update their own categories" 
  on public.categories for update 
  using (auth.uid() = user_id);

create policy "Allow users to delete their own categories" 
  on public.categories for delete 
  using (auth.uid() = user_id);

-- --- transactions policies ---
create policy "Allow users to read their own transactions" 
  on public.transactions for select 
  using (auth.uid() = user_id);

create policy "Allow users to insert their own transactions" 
  on public.transactions for insert 
  with check (auth.uid() = user_id);

create policy "Allow users to update their own transactions" 
  on public.transactions for update 
  using (auth.uid() = user_id);

create policy "Allow users to delete their own transactions" 
  on public.transactions for delete 
  using (auth.uid() = user_id);

-- --- budgets policies ---
create policy "Allow users to read their own budgets" 
  on public.budgets for select 
  using (auth.uid() = user_id);

create policy "Allow users to insert their own budgets" 
  on public.budgets for insert 
  with check (auth.uid() = user_id);

create policy "Allow users to update their own budgets" 
  on public.budgets for update 
  using (auth.uid() = user_id);

create policy "Allow users to delete their own budgets" 
  on public.budgets for delete 
  using (auth.uid() = user_id);

-- =========================================================================
-- 5. TRIGGER FOR AUTOMATIC PROFILE CREATION ON USER SIGNUP
-- =========================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, currency, theme_color, notifications_enabled)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'INR',
    '#2563EB',
    true
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================================================
-- 6. INDEXES FOR PERFORMANCE OPTIMIZATION
-- =========================================================================
create index idx_transactions_user_date on public.transactions(user_id, date);
create index idx_transactions_user_category on public.transactions(user_id, category);
create index idx_budgets_user_month on public.budgets(user_id, month);
create index idx_categories_user on public.categories(user_id);
