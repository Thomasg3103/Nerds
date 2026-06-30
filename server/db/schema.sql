-- Collection Intelligence Platform — Database Schema
-- Run this in the Supabase SQL editor (project > SQL Editor > New query).
-- Safe to re-run: all statements use IF NOT EXISTS.

-- ── Categories ────────────────────────────────────────────────────────────────
-- One row per collectible type. Seeded with the two MVP categories.
create table if not exists categories (
  id         text primary key,  -- e.g. 'pokemon', 'games'
  name       text not null,
  source_api text not null       -- e.g. 'pokemon_tcg', 'igdb'
);

insert into categories (id, name, source_api) values
  ('pokemon', 'Pokémon Cards', 'pokemon_tcg'),
  ('games',   'Video Games',   'igdb')
on conflict (id) do nothing;

-- ── Pokemon Sets Cache ─────────────────────────────────────────────────────────
-- Stores set metadata fetched from the Pokemon TCG API so we don't hit the
-- external API on every page load. Refreshed on demand by the backend.
create table if not exists pokemon_sets (
  id           text primary key,  -- e.g. 'base1', 'sv1'
  name         text not null,
  series       text,
  total        integer not null,
  release_date text,
  logo_url     text,
  cached_at    timestamptz default now()
);

-- ── Items ─────────────────────────────────────────────────────────────────────
-- One row per unique collectible (a specific card, a specific game).
-- The metadata JSONB field holds category-specific attributes (rarity, platform,
-- etc.) without requiring a separate table per category.
-- Trade-off: flexible but JSON fields are less queryable than typed columns.
create table if not exists items (
  id          uuid primary key default gen_random_uuid(),
  category_id text references categories(id),
  external_id text not null,   -- ID in the source API (e.g. 'base1-4')
  name        text not null,
  image_url   text,
  set_name    text,            -- null for categories without sets (e.g. games)
  metadata    jsonb default '{}',
  unique (category_id, external_id)
);

-- ── Ownership Records ─────────────────────────────────────────────────────────
-- One row per item the user owns. Condition vocabulary is category-specific:
--   Pokemon: 'Near Mint' | 'Lightly Played' | 'Moderately Played' | 'Heavily Played' | 'Damaged'
--   Games:   'Backlog'   | 'In Progress'    | 'Complete'           | 'Platinumed'
-- user_id is nullable for now — will reference auth.users once auth is added.
create table if not exists ownership_records (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid,
  item_id                uuid references items(id) on delete cascade,
  quantity_owned         integer default 1,
  condition_status       text,
  hours_played           integer,         -- games only
  purchase_price         numeric(10, 2),
  last_known_market_price numeric(10, 2),
  price_last_updated     timestamptz,
  created_at             timestamptz default now(),
  updated_at             timestamptz default now(),
  -- Pre-auth: one record per item. This constraint becomes unique(user_id, item_id)
  -- once authentication is implemented.
  unique (item_id)
);

-- ── Price History ─────────────────────────────────────────────────────────────
-- Append-only log of eBay price snapshots (Phase 2).
create table if not exists price_history (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid references items(id) on delete cascade,
  source      text default 'ebay',
  price       numeric(10, 2) not null,
  currency    text default 'EUR',
  recorded_at timestamptz default now()
);

-- ── Grading Results ───────────────────────────────────────────────────────────
-- Output of the CV condition grading tool (Phase 3).
create table if not exists grading_results (
  id                   uuid primary key default gen_random_uuid(),
  ownership_record_id  uuid references ownership_records(id) on delete cascade,
  uploaded_image_url   text,
  reference_set_used   text,
  similarity_score     numeric(5, 4),  -- 0.0000 – 1.0000
  estimated_grade_band text,
  created_at           timestamptz default now()
);
