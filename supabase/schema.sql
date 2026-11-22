create extension if not exists pgcrypto;

create table if not exists admin_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','administrator','editor','moderator')),
  created_at timestamptz not null default now()
);

create table if not exists server_config (
  id integer primary key default 1 check (id = 1),
  java_address text not null default '',
  bedrock_address text not null default '',
  bedrock_port text not null default '',
  java_version text not null default '',
  bedrock_version text not null default '',
  events_address text not null default 'seraphyxgames.atbp.fun',
  events_port text not null default '19506',
  crossplay text not null default 'not-configured',
  description text not null default '',
  gameplay_type text not null default '',
  discord_invite text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists features (
  id uuid primary key default gen_random_uuid(), title text not null, description text not null default '',
  image_url text, category text not null default 'General', featured boolean not null default false,
  published boolean not null default false, display_order integer not null default 0, created_at timestamptz not null default now()
);

create table if not exists rules (
  id uuid primary key default gen_random_uuid(), category text not null, content text not null,
  display_order integer not null default 0, published boolean not null default true, updated_at timestamptz not null default now()
);

create table if not exists titles (
  id integer primary key check (id between 1 and 49), name text not null, description text not null default '',
  requirements text not null default '', rarity text not null default 'Not configured', reward text not null default '',
  special_conditions text not null default '', image_url text, display_order integer not null default 0,
  discord_only boolean not null default false
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(), name text not null, description text not null default '',
  price_cents integer not null default 0 check (price_cents >= 0), currency text not null default 'USD',
  benefits jsonb not null default '[]'::jsonb, published boolean not null default false, display_order integer not null default 0
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id),
  provider text not null, provider_order_id text unique, status text not null,
  amount_cents integer not null check (amount_cents >= 0), currency text not null,
  metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

create table if not exists announcements (
  id uuid primary key default gen_random_uuid(), title text not null, description text not null default '',
  featured_image text, author_id uuid references auth.users(id), category text not null default 'General',
  status text not null default 'draft' check (status in ('draft','published')), pinned boolean not null default false,
  publish_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists staff (
  id uuid primary key default gen_random_uuid(), minecraft_name text not null, discord_name text,
  position text not null, biography text not null default '', profile_image text,
  display_order integer not null default 0, published boolean not null default true
);

create table if not exists media (
  id uuid primary key default gen_random_uuid(), file_name text not null, file_url text not null,
  content_type text not null, size_bytes bigint not null, uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists leaderboard_entries (
  id uuid primary key default gen_random_uuid(), player_name text not null, wins integer not null default 0,
  playtime_minutes integer not null default 0, kills integer not null default 0,
  other_stats jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(), actor_id uuid references auth.users(id),
  action text not null, entity_type text not null, entity_id text, details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

insert into server_config (id) values (1) on conflict (id) do nothing;

alter table admin_roles enable row level security;
alter table server_config enable row level security;
alter table features enable row level security;
alter table rules enable row level security;
alter table titles enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table announcements enable row level security;
alter table staff enable row level security;
alter table media enable row level security;
alter table leaderboard_entries enable row level security;
alter table audit_logs enable row level security;

create policy "Public can read published content" on features for select using (published);
create policy "Public can read published rules" on rules for select using (published);
create policy "Public can read titles" on titles for select using (true);
create policy "Public can read published products" on products for select using (published);
create policy "Public can read published announcements" on announcements for select using (status = 'published');
create policy "Public can read published staff" on staff for select using (published);
create policy "Public can read leaderboard" on leaderboard_entries for select using (true);
create policy "Public can read server config" on server_config for select using (true);
create policy "Users can read their own admin role" on admin_roles
  for select using (user_id = auth.uid());

create or replace function is_admin()
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from admin_roles where user_id = auth.uid());
$$;

grant usage on schema public to anon, authenticated;
grant select on admin_roles, server_config, features, rules, titles, products,
  announcements, staff, leaderboard_entries to anon, authenticated;
grant insert, update, delete on server_config, features, rules, titles, products,
  announcements, staff, leaderboard_entries to authenticated;
