-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Profiles ───────────────────────────────────────────────────────────────
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text not null unique,
  avatar_url  text,
  created_at  timestamptz not null default now()
);
alter table profiles enable row level security;
create policy "profiles: read all"   on profiles for select using (true);
create policy "profiles: own insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles: own update" on profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)));
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─── Categories ─────────────────────────────────────────────────────────────
create table categories (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  weight      int  not null default 10 check (weight between 1 and 30),
  emoji       text not null default '🍞',
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
alter table categories enable row level security;
create policy "categories: read all"   on categories for select using (true);
create policy "categories: auth insert" on categories for insert with check (auth.uid() is not null);
create policy "categories: auth update" on categories for update using (auth.uid() is not null);
create policy "categories: auth delete" on categories for delete using (auth.uid() is not null);

-- Seed default categories
insert into categories (name, weight, emoji) values
  ('Brot',              20, '🥖'),
  ('Fleisch / Tofu',    20, '🥩'),
  ('Sauce',             15, '🫙'),
  ('Frische & Kräuter', 20, '🌿'),
  ('Authentizität',     15, '🏮'),
  ('Preis-Leistung',    10, '💰');

-- ─── Restaurants ────────────────────────────────────────────────────────────
create table restaurants (
  id               uuid primary key default uuid_generate_v4(),
  name             text not null,
  address          text not null,
  neighborhood     text not null default '',
  lat              double precision,
  lng              double precision,
  google_maps_url  text,
  website          text,
  cover_photo_url  text,
  created_by       uuid not null references profiles(id) on delete cascade,
  created_at       timestamptz not null default now()
);
alter table restaurants enable row level security;
create policy "restaurants: read all"   on restaurants for select using (true);
create policy "restaurants: auth insert" on restaurants for insert with check (auth.uid() is not null);
create policy "restaurants: owner update" on restaurants for update using (auth.uid() = created_by);
create policy "restaurants: owner delete" on restaurants for delete using (auth.uid() = created_by);

-- ─── Reviews ────────────────────────────────────────────────────────────────
create table reviews (
  id             uuid primary key default uuid_generate_v4(),
  restaurant_id  uuid not null references restaurants(id) on delete cascade,
  user_id        uuid not null references profiles(id) on delete cascade,
  scores         jsonb not null default '{}',
  total_score    numeric(4,2) not null default 0,
  photos         text[] not null default '{}',
  notes          text,
  visited_at     date not null default current_date,
  created_at     timestamptz not null default now(),
  unique(restaurant_id, user_id)
);
alter table reviews enable row level security;
create policy "reviews: read all"    on reviews for select using (true);
create policy "reviews: auth insert" on reviews for insert with check (auth.uid() = user_id);
create policy "reviews: own upsert"  on reviews for update using (auth.uid() = user_id);
create policy "reviews: own delete"  on reviews for delete using (auth.uid() = user_id);

-- ─── Aggregate view ─────────────────────────────────────────────────────────
create or replace view restaurants_with_stats as
select
  r.*,
  coalesce(round(avg(rv.total_score)::numeric, 2), 0) as avg_score,
  count(rv.id)::int                                    as review_count
from restaurants r
left join reviews rv on rv.restaurant_id = r.id
group by r.id;

-- ─── Storage ────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public) values
  ('restaurant-photos', 'restaurant-photos', true),
  ('review-photos',     'review-photos',     true)
on conflict do nothing;

create policy "storage: public read" on storage.objects
  for select using (bucket_id in ('restaurant-photos','review-photos'));
create policy "storage: auth upload" on storage.objects
  for insert with check (auth.uid() is not null and bucket_id in ('restaurant-photos','review-photos'));
create policy "storage: auth delete" on storage.objects
  for delete using (auth.uid() is not null);
