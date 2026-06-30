-- Collection Intelligence Platform — Database Schema
-- Run this in the Supabase SQL editor (project > SQL Editor > New query).
-- Safe to re-run on a fresh project: all CREATE statements use IF NOT EXISTS.
--
-- MIGRATION NOTE (if upgrading from the pre-auth schema):
--   The ownership_records unique constraint changed from unique(item_id) to
--   unique(user_id, item_id). Run these commands once in the SQL editor:
--
--   alter table ownership_records
--     alter column user_id set not null,
--     add constraint ownership_records_user_id_fkey
--       foreign key (user_id) references auth.users(id) on delete cascade;
--
--   alter table ownership_records
--     drop constraint ownership_records_item_id_key;
--
--   alter table ownership_records
--     add constraint ownership_records_user_id_item_id_key unique (user_id, item_id);

-- ── Categories ────────────────────────────────────────────────────────────────
create table if not exists categories (
  id         text primary key,
  name       text not null,
  source_api text not null
);

insert into categories (id, name, source_api) values
  ('pokemon', 'Pokémon Cards', 'pokemon_tcg'),
  ('games',   'Video Games',   'igdb')
on conflict (id) do nothing;

-- ── Pokemon Sets Cache ─────────────────────────────────────────────────────────
create table if not exists pokemon_sets (
  id           text primary key,
  name         text not null,
  series       text,
  total        integer not null,
  release_date text,
  logo_url     text,
  cached_at    timestamptz default now()
);

-- ── Items ─────────────────────────────────────────────────────────────────────
-- One row per unique collectible. The metadata JSONB field holds
-- category-specific attributes without requiring a separate table per category.
-- Trade-off: flexible but JSON fields are less queryable than typed columns.
create table if not exists items (
  id          uuid primary key default gen_random_uuid(),
  category_id text references categories(id),
  external_id text not null,
  name        text not null,
  image_url   text,
  set_name    text,
  metadata    jsonb default '{}',
  unique (category_id, external_id)
);

-- ── Ownership Records ─────────────────────────────────────────────────────────
-- One row per user per item. condition_status vocabulary is category-specific:
--   Pokemon: 'Near Mint' | 'Lightly Played' | 'Moderately Played' | 'Heavily Played' | 'Damaged'
--   Games:   'Backlog'   | 'In Progress'    | 'Complete'           | 'Platinumed'
create table if not exists ownership_records (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references auth.users(id) on delete cascade,
  item_id                 uuid references items(id) on delete cascade,
  quantity_owned          integer default 1,
  condition_status        text,
  hours_played            integer,
  purchase_price          numeric(10, 2),
  last_known_market_price numeric(10, 2),
  price_last_updated      timestamptz,
  created_at              timestamptz default now(),
  updated_at              timestamptz default now(),
  unique (user_id, item_id)
);

-- ── Price History ─────────────────────────────────────────────────────────────
create table if not exists price_history (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid references items(id) on delete cascade,
  source      text default 'ebay',
  price       numeric(10, 2) not null,
  currency    text default 'EUR',
  recorded_at timestamptz default now()
);

-- ── Grading Results ───────────────────────────────────────────────────────────
create table if not exists grading_results (
  id                   uuid primary key default gen_random_uuid(),
  ownership_record_id  uuid references ownership_records(id) on delete cascade,
  uploaded_image_url   text,
  reference_set_used   text,
  similarity_score     numeric(5, 4),
  estimated_grade_band text,
  created_at           timestamptz default now()
);
