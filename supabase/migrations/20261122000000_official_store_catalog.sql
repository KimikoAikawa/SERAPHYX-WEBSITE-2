alter table public.server_config
  add column if not exists events_address text not null default 'seraphyxgames.atbp.fun',
  add column if not exists events_port text not null default '19506';

update public.server_config
set java_address = case when java_address = '' then 'play.seraphyx.fun' else java_address end,
    bedrock_address = case when bedrock_address = '' then 'play.seraphyx.fun' else bedrock_address end,
    bedrock_port = case when bedrock_port = '' then '19293' else bedrock_port end
where id = 1;

alter table public.products
  add column if not exists slug text,
  add column if not exists category text not null default 'Other',
  add column if not exists available boolean not null default true,
  add column if not exists featured boolean not null default false,
  add column if not exists image_url text,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists products_slug_unique
  on public.products (slug)
  where slug is not null;

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  currency text not null,
  created_at timestamptz not null default now()
);

alter table public.order_items enable row level security;

create or replace function public.can_manage_content()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_roles
    where user_id = auth.uid()
      and role in ('owner', 'administrator', 'editor')
  );
$$;

revoke all on function public.can_manage_content() from public;
grant execute on function public.can_manage_content() to anon, authenticated;

grant usage on schema public to anon, authenticated;
grant select on public.admin_roles, public.server_config, public.features, public.rules,
  public.titles, public.products, public.announcements, public.staff, public.leaderboard_entries
  to anon, authenticated;
grant insert, update, delete on public.server_config, public.products to authenticated;
grant select on public.order_items to authenticated;

drop policy if exists "Admins can update server config" on public.server_config;
create policy "Admins can update server config"
  on public.server_config for update
  using (public.can_manage_content())
  with check (public.can_manage_content());

drop policy if exists "Admins can insert server config" on public.server_config;
create policy "Admins can insert server config"
  on public.server_config for insert
  with check (public.can_manage_content());

drop policy if exists "Admins can manage products" on public.products;
create policy "Admins can manage products"
  on public.products for all
  using (public.can_manage_content())
  with check (public.can_manage_content());

drop policy if exists "Admins can read order items" on public.order_items;
create policy "Admins can read order items"
  on public.order_items for select
  using (public.can_manage_content());

insert into public.products (
  slug, name, description, price_cents, currency, category, published, available,
  featured, display_order, benefits
)
values
  ('token-1', '1 Token', 'Optional in-game token package.', 500, 'PHP', 'Tokens', true, true, false, 1, '[]'::jsonb),
  ('token-5', '5 Tokens', 'Optional in-game token package.', 2000, 'PHP', 'Tokens', true, true, false, 2, '[]'::jsonb),
  ('token-32', '32 Tokens', 'Optional in-game token package.', 10000, 'PHP', 'Tokens', true, true, false, 3, '[]'::jsonb),
  ('token-64', '64 Tokens', 'Optional in-game token package.', 18000, 'PHP', 'Tokens', true, true, false, 4, '[]'::jsonb),
  ('crate-key-astral', 'Astral', 'Optional Astral crate key.', 500, 'PHP', 'Crate Keys', true, true, false, 5, '[]'::jsonb),
  ('crate-key-nebula', 'Nebula', 'Optional Nebula crate key.', 1000, 'PHP', 'Crate Keys', true, true, false, 6, '[]'::jsonb),
  ('crate-key-cosmos', 'Cosmos', 'Optional Cosmos crate key.', 1500, 'PHP', 'Crate Keys', true, true, false, 7, '[]'::jsonb),
  ('crate-key-zenith', 'Zenith', 'Optional Zenith crate key.', 2000, 'PHP', 'Crate Keys', true, true, false, 8, '[]'::jsonb),
  ('crate-key-supernova', 'Supernova', 'Optional Supernova crate key.', 3000, 'PHP', 'Crate Keys', true, true, false, 9, '[]'::jsonb),
  ('points-10', '10 Points', 'Optional points package.', 100, 'PHP', 'Points', true, true, false, 10, '[]'::jsonb),
  ('points-150', '150 Points', 'Optional points package.', 1000, 'PHP', 'Points', true, true, false, 11, '[]'::jsonb),
  ('points-500', '500 Points', 'Optional points package.', 2500, 'PHP', 'Points', true, true, false, 12, '[]'::jsonb),
  ('points-1100', '1,100 Points', 'Optional points package.', 5000, 'PHP', 'Points', true, true, false, 13, '[]'::jsonb),
  ('celestial-angel', 'ANGEL', 'Rankup material only. This purchase does not automatically grant the corresponding in-game rank. You must already have the required previous rank and satisfy the in-game progression conditions.', 5000, 'PHP', 'Celestial', true, true, false, 14, '[]'::jsonb),
  ('celestial-archangel', 'ARCHANGEL', 'Rankup material only. This purchase does not automatically grant the corresponding in-game rank. You must already have the required previous rank and satisfy the in-game progression conditions.', 10000, 'PHP', 'Celestial', true, true, false, 15, '[]'::jsonb),
  ('celestial-dominion', 'DOMINION', 'Rankup material only. This purchase does not automatically grant the corresponding in-game rank. You must already have the required previous rank and satisfy the in-game progression conditions.', 15000, 'PHP', 'Celestial', true, true, false, 16, '[]'::jsonb),
  ('celestial-cherubim', 'CHERUBIM', 'Rankup material only. This purchase does not automatically grant the corresponding in-game rank. You must already have the required previous rank and satisfy the in-game progression conditions.', 20000, 'PHP', 'Celestial', true, true, false, 17, '[]'::jsonb),
  ('celestial-seraphim', 'SERAPHIM', 'Rankup material only. This purchase does not automatically grant the corresponding in-game rank. You must already have the required previous rank and satisfy the in-game progression conditions.', 25000, 'PHP', 'Celestial', true, true, false, 18, '[]'::jsonb),
  ('celestial-ophanim', 'OPHANIM', 'Rankup material only. This purchase does not automatically grant the corresponding in-game rank. You must already have the required previous rank and satisfy the in-game progression conditions.', 30000, 'PHP', 'Celestial', true, true, false, 19, '[]'::jsonb),
  ('celestial-empyrean', 'EMPYREAN', 'Rankup material only. This purchase does not automatically grant the corresponding in-game rank. You must already have the required previous rank and satisfy the in-game progression conditions.', 35000, 'PHP', 'Celestial', true, true, false, 20, '[]'::jsonb),
  ('infernal-fiend', 'FIEND', 'Rankup material only. This purchase does not automatically grant the corresponding in-game rank. You must already have the required previous rank and satisfy the in-game progression conditions.', 5000, 'PHP', 'Infernal', true, true, false, 21, '[]'::jsonb),
  ('infernal-archfiend', 'ARCHFIEND', 'Rankup material only. This purchase does not automatically grant the corresponding in-game rank. You must already have the required previous rank and satisfy the in-game progression conditions.', 10000, 'PHP', 'Infernal', true, true, false, 22, '[]'::jsonb),
  ('infernal-demon', 'DEMON', 'Rankup material only. This purchase does not automatically grant the corresponding in-game rank. You must already have the required previous rank and satisfy the in-game progression conditions.', 15000, 'PHP', 'Infernal', true, true, false, 23, '[]'::jsonb),
  ('infernal-archdemon', 'ARCHDEMON', 'Rankup material only. This purchase does not automatically grant the corresponding in-game rank. You must already have the required previous rank and satisfy the in-game progression conditions.', 20000, 'PHP', 'Infernal', true, true, false, 24, '[]'::jsonb),
  ('infernal-leviathan', 'LEVIATHAN', 'Rankup material only. This purchase does not automatically grant the corresponding in-game rank. You must already have the required previous rank and satisfy the in-game progression conditions.', 25000, 'PHP', 'Infernal', true, true, false, 25, '[]'::jsonb),
  ('infernal-behemoth', 'BEHEMOTH', 'Rankup material only. This purchase does not automatically grant the corresponding in-game rank. You must already have the required previous rank and satisfy the in-game progression conditions.', 30000, 'PHP', 'Infernal', true, true, false, 26, '[]'::jsonb),
  ('infernal-lucifer', 'LUCIFER', 'Rankup material only. This purchase does not automatically grant the corresponding in-game rank. You must already have the required previous rank and satisfy the in-game progression conditions.', 35000, 'PHP', 'Infernal', true, true, false, 27, '[]'::jsonb),
  ('custom-title', 'Custom Title', 'Purchase is for a custom title. Naming restrictions, approval, and delivery conditions are subject to administrator configuration.', 5000, 'PHP', 'Custom Title', true, true, false, 28, '[]'::jsonb)
on conflict (slug) where slug is not null
do update set
  name = excluded.name,
  description = excluded.description,
  price_cents = excluded.price_cents,
  currency = excluded.currency,
  category = excluded.category,
  published = excluded.published,
  available = excluded.available,
  display_order = excluded.display_order,
  updated_at = now();
