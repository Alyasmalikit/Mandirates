-- MandiRates marketplace schema for Supabase (Postgres). NOT yet run or tested: review in the SQL editor first.
create table profiles(
  id uuid primary key references auth.users on delete cascade,
  phone text not null check (phone ~ '^[6-9][0-9]{9}$'),
  name text, verified boolean not null default false,
  premium_until timestamptz, created_at timestamptz not null default now());
create table listings(
  id bigint generated always as identity primary key,
  owner uuid not null references profiles(id) on delete cascade,
  kind text not null check (kind in ('sell','buy')),
  crop text not null check (length(crop) between 2 and 40),
  qty_quintal numeric not null check (qty_quintal >= 1),
  price_per_quintal numeric not null check (price_per_quintal between 1 and 500000),
  state text not null, district text, note text check (length(note) <= 300),
  status text not null default 'active' check (status in ('active','hidden','sold')),
  created_at timestamptz not null default now());
create table reports(
  id bigint generated always as identity primary key,
  listing_id bigint not null references listings(id) on delete cascade,
  reporter uuid not null references profiles(id), reason text, created_at timestamptz not null default now(),
  unique (listing_id, reporter));
alter table profiles enable row level security;
alter table listings enable row level security;
alter table reports enable row level security;
-- Phone numbers live in profiles and are never readable by other users.
create policy "own profile read" on profiles for select using (auth.uid() = id);
create policy "own profile insert" on profiles for insert with check (auth.uid() = id);
create policy "own profile update" on profiles for update using (auth.uid() = id) with check (auth.uid() = id and verified = (select verified from profiles where id = auth.uid()));
create policy "anyone reads active listings" on listings for select using (status = 'active');
create policy "owner inserts" on listings for insert with check (auth.uid() = owner);
create policy "owner updates" on listings for update using (auth.uid() = owner) with check (auth.uid() = owner);
create policy "logged-in users report" on reports for insert with check (auth.uid() = reporter);
-- Contact is released only to Premium users, through this function.
create function get_contact(lid bigint) returns text language sql security definer set search_path = public as $$
  select p.phone from listings l join profiles p on p.id = l.owner
  where l.id = lid and l.status = 'active'
    and exists (select 1 from profiles me where me.id = auth.uid() and me.premium_until > now());
$$;
revoke all on function get_contact(bigint) from public; grant execute on function get_contact(bigint) to authenticated;
