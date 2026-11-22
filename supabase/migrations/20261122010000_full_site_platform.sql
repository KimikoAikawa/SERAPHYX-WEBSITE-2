alter table public.features
  add column if not exists video_url text,
  add column if not exists season_id uuid,
  add column if not exists updated_at timestamptz not null default now();

alter table public.rules
  add column if not exists updated_at timestamptz not null default now();

alter table public.staff
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists featured boolean not null default false;

alter table public.titles
  add column if not exists category text not null default 'Not configured',
  add column if not exists featured boolean not null default false,
  add column if not exists published boolean not null default false,
  add column if not exists reward text not null default '',
  add column if not exists updated_at timestamptz not null default now();

alter table public.announcements
  add column if not exists author_name text not null default '',
  add column if not exists display_order integer not null default 0,
  add column if not exists season_id uuid,
  add column if not exists scheduled_at timestamptz;

alter table public.products
  add column if not exists season_id uuid;

create table if not exists public.rule_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.punishment_steps (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  display_order integer not null default 0,
  published boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  banner_url text,
  starts_at timestamptz,
  ends_at timestamptz,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create unique index if not exists seasons_single_active
  on public.seasons ((status)) where status = 'active';

create table if not exists public.downloads (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category text not null default 'General',
  version text not null default '',
  storage_path text not null unique,
  file_name text not null,
  content_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  published boolean not null default false,
  season_id uuid references public.seasons(id) on delete set null,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '""'::jsonb,
  is_public boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.media
  add column if not exists storage_path text;

alter table public.orders
  add column if not exists customer_username text not null default '',
  add column if not exists customer_contact text not null default '',
  add column if not exists payment_status text not null default 'pending',
  add column if not exists fulfillment_status text not null default 'unfulfilled',
  add column if not exists delivery_notes text not null default '',
  add column if not exists idempotency_key text,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists orders_idempotency_key_unique
  on public.orders (idempotency_key) where idempotency_key is not null;

create table if not exists public.payment_records (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  provider text not null,
  provider_reference text,
  webhook_event_id text unique,
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null,
  status text not null check (status in ('pending', 'verified', 'failed', 'refunded')),
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.fulfillment_records (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null check (action in ('processing', 'fulfilled', 'cancelled', 'note')),
  note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists announcements_publication_order
  on public.announcements (status, publish_at desc, display_order);
create index if not exists downloads_public_order
  on public.downloads (published, created_at desc);
create index if not exists features_public_order
  on public.features (published, display_order);
create index if not exists staff_public_order
  on public.staff (published, display_order);
create index if not exists rules_category_order
  on public.rules (category, published, display_order);
create index if not exists leaderboard_order
  on public.leaderboard_entries (updated_at desc);
create index if not exists orders_status_order
  on public.orders (payment_status, fulfillment_status, created_at desc);
create index if not exists order_items_order_id
  on public.order_items (order_id);

insert into public.rule_categories (name, display_order) values
  ('General Rules', 1),
  ('Gameplay Rules', 2),
  ('Anti-Lag Rules', 3),
  ('Discord Rules', 4),
  ('Safety Rules', 5),
  ('Ticket Rules', 6),
  ('Punishments', 7)
on conflict (name) do nothing;

insert into public.punishment_steps (name, display_order) values
  ('Warning', 1),
  ('Mute / Kick', 2),
  ('Temporary Ban', 3),
  ('Permanent Ban', 4)
on conflict (name) do nothing;

insert into public.titles (
  id, name, description, requirements, rarity, reward, special_conditions,
  category, featured, published, display_order, discord_only
)
select
  title_id,
  case when title_id = 49 then 'Elijah''s Circle' else 'Title slot ' || lpad(title_id::text, 2, '0') end,
  case when title_id = 49
    then 'Discord-only recognition awarded through personal recognition by the server owner. Difficult to earn and not an automatically obtainable Minecraft title.'
    else 'Title details have not yet been supplied.'
  end,
  case when title_id = 49 then 'Personally recognized by the server owner.' else 'Requirements not yet supplied.' end,
  case when title_id = 49 then 'Special Recognition' else 'Not configured' end,
  '',
  case when title_id = 49 then 'Discord-only; not automatically unlockable or purchasable.' else '' end,
  case when title_id = 49 then 'Special Recognition' else 'Not configured' end,
  false,
  title_id = 49,
  title_id,
  title_id = 49
from generate_series(1, 49) as title_id
on conflict (id) do nothing;

insert into public.site_settings (key, value, is_public) values
  ('store_introduction', jsonb_build_array(
    'Hello, @everyone!',
    'After careful consideration, we''ve realized that relying entirely on a grind-focused, fair-to-play system may not be enough to sustain the server in the long run.',
    'To help keep SERAPHYX running and support its continued development, we''re introducing optional purchases for certain in-game items.',
    'These purchases are completely optional. You can either support the server by purchasing them or obtain these items through regular gameplay. Nothing is forcing you to spend money to enjoy the server!'
  ), true),
  ('store_support_message', jsonb_build_array(
    'Every donation and purchase means a lot to us.',
    'Your support helps cover server expenses, maintain its services, and fund future updates and improvements.',
    'As a small token of appreciation, every supporter will also receive an exclusive Donator Title!',
    'Thank you for being part of SERAPHYX and helping us keep the server alive. Whether you choose to support us by purchasing or simply enjoy grinding for everything in-game, we appreciate you just the same.',
    'Your support keeps SERAPHYX alive!'
  ), true),
  ('rankup_disclaimer', to_jsonb('Purchasing a rankup material does not automatically grant the corresponding in-game rank. You must already have the required previous rank and satisfy all in-game progression conditions. For example, a player purchasing LUCIFER must already have BEHEMOTH and still meet the LUCIFER progression requirements.'::text), true),
  ('custom_title_policy', to_jsonb('Custom title naming restrictions, approval, and delivery conditions have not yet been configured.'::text), true),
  ('support_links', '{"general":"","bug_report":"","player_report":"","staff_report":"","appeal":"","gameplay":"","store_purchase":""}'::jsonb, true),
  ('support_faqs', '[
    {"question":"How do I join SERAPHYX SMP?","answer":"Open the Server page for the current Java and Bedrock connection details and setup instructions."},
    {"question":"Can I complete a store purchase on this website?","answer":"Not yet. The official catalog is visible, but checkout remains disabled until a payment provider is securely configured."},
    {"question":"Does buying a rankup material automatically grant a rank?","answer":"No. You must already have the required previous rank and satisfy all in-game progression requirements."}
  ]'::jsonb, true),
  ('leaderboard_source_configured', 'false'::jsonb, true),
  ('leaderboard_source_label', '""'::jsonb, true),
  ('homepage_intro', '""'::jsonb, true),
  ('homepage_hero_title', to_jsonb('ENTER THE WORLD OF'::text), true),
  ('homepage_hero_subtitle', to_jsonb('Gather your friends. Explore the realm. Forge a story that lasts.'::text), true)
on conflict (key) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'announcements_season_id_fkey' and conrelid = 'public.announcements'::regclass
  ) then
    alter table public.announcements add constraint announcements_season_id_fkey
      foreign key (season_id) references public.seasons(id) on delete set null;
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'products_season_id_fkey' and conrelid = 'public.products'::regclass
  ) then
    alter table public.products add constraint products_season_id_fkey
      foreign key (season_id) references public.seasons(id) on delete set null;
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'features_season_id_fkey' and conrelid = 'public.features'::regclass
  ) then
    alter table public.features add constraint features_season_id_fkey
      foreign key (season_id) references public.seasons(id) on delete set null;
  end if;
end;
$$;

alter table public.rule_categories enable row level security;
alter table public.punishment_steps enable row level security;
alter table public.seasons enable row level security;
alter table public.downloads enable row level security;
alter table public.site_settings enable row level security;
alter table public.payment_records enable row level security;
alter table public.fulfillment_records enable row level security;

create or replace function public.can_manage_content()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_roles
    where user_id = auth.uid()
      and role in ('owner', 'administrator', 'editor')
  );
$$;

create or replace function public.is_site_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_roles
    where user_id = auth.uid() and role = 'owner'
  );
$$;

revoke all on function public.can_manage_content() from public;
revoke all on function public.is_site_owner() from public;
grant execute on function public.can_manage_content() to anon, authenticated;
grant execute on function public.is_site_owner() to authenticated;

drop policy if exists "Managers can manage features" on public.features;
create policy "Managers can manage features" on public.features
  for all using (public.can_manage_content()) with check (public.can_manage_content());
drop policy if exists "Managers can manage rules" on public.rules;
create policy "Managers can manage rules" on public.rules
  for all using (public.can_manage_content()) with check (public.can_manage_content());
drop policy if exists "Managers can manage titles" on public.titles;
create policy "Managers can manage titles" on public.titles
  for all using (public.can_manage_content()) with check (public.can_manage_content());
drop policy if exists "Managers can manage announcements" on public.announcements;
create policy "Managers can manage announcements" on public.announcements
  for all using (public.can_manage_content()) with check (public.can_manage_content());
drop policy if exists "Managers can manage staff" on public.staff;
create policy "Managers can manage staff" on public.staff
  for all using (public.can_manage_content()) with check (public.can_manage_content());
drop policy if exists "Managers can manage leaderboard" on public.leaderboard_entries;
create policy "Managers can manage leaderboard" on public.leaderboard_entries
  for all using (public.can_manage_content()) with check (public.can_manage_content());
drop policy if exists "Managers can manage server config" on public.server_config;
create policy "Managers can manage server config" on public.server_config
  for all using (public.can_manage_content()) with check (public.can_manage_content());
drop policy if exists "Managers can manage products" on public.products;
create policy "Managers can manage products" on public.products
  for all using (public.can_manage_content()) with check (public.can_manage_content());

drop policy if exists "Public can read rule categories" on public.rule_categories;
create policy "Public can read rule categories" on public.rule_categories
  for select using (true);
drop policy if exists "Managers can manage rule categories" on public.rule_categories;
create policy "Managers can manage rule categories" on public.rule_categories
  for all using (public.can_manage_content()) with check (public.can_manage_content());
drop policy if exists "Public can read punishment steps" on public.punishment_steps;
create policy "Public can read punishment steps" on public.punishment_steps
  for select using (published);
drop policy if exists "Managers can manage punishment steps" on public.punishment_steps;
create policy "Managers can manage punishment steps" on public.punishment_steps
  for all using (public.can_manage_content()) with check (public.can_manage_content());
drop policy if exists "Public can read published seasons" on public.seasons;
create policy "Public can read published seasons" on public.seasons
  for select using (status in ('active', 'archived'));
drop policy if exists "Managers can manage seasons" on public.seasons;
create policy "Managers can manage seasons" on public.seasons
  for all using (public.can_manage_content()) with check (public.can_manage_content());
drop policy if exists "Public can read published downloads" on public.downloads;
create policy "Public can read published downloads" on public.downloads
  for select using (published);
drop policy if exists "Managers can manage downloads" on public.downloads;
create policy "Managers can manage downloads" on public.downloads
  for all using (public.can_manage_content()) with check (public.can_manage_content());
drop policy if exists "Public can read public site settings" on public.site_settings;
create policy "Public can read public site settings" on public.site_settings
  for select using (is_public);
drop policy if exists "Managers can manage site settings" on public.site_settings;
create policy "Managers can manage site settings" on public.site_settings
  for all using (public.can_manage_content()) with check (public.can_manage_content());
drop policy if exists "Managers can read payment records" on public.payment_records;
create policy "Managers can read payment records" on public.payment_records
  for select using (public.can_manage_content());
drop policy if exists "Managers can read fulfillment records" on public.fulfillment_records;
create policy "Managers can read fulfillment records" on public.fulfillment_records
  for select using (public.can_manage_content());
drop policy if exists "Managers can read orders" on public.orders;
create policy "Managers can read orders" on public.orders
  for select using (public.can_manage_content());
drop policy if exists "Managers can read order items" on public.order_items;
create policy "Managers can read order items" on public.order_items
  for select using (public.can_manage_content());
drop policy if exists "Owners can read all admin roles" on public.admin_roles;
create policy "Owners can read all admin roles" on public.admin_roles
  for select using (public.is_site_owner());

drop policy if exists "Public can read titles" on public.titles;
drop policy if exists "Public can read published titles" on public.titles;
create policy "Public can read published titles" on public.titles
  for select using (published);
drop policy if exists "Public can read published products" on public.products;
drop policy if exists "Public can read available published products" on public.products;
create policy "Public can read available published products" on public.products
  for select using (published and available);
drop policy if exists "Public can read published announcements" on public.announcements;
create policy "Public can read published announcements" on public.announcements
  for select using (
    status = 'published'
    and coalesce(scheduled_at, publish_at, created_at) <= now()
  );
drop policy if exists "Public can read leaderboard" on public.leaderboard_entries;
drop policy if exists "Public can read verified leaderboard" on public.leaderboard_entries;
create policy "Public can read verified leaderboard" on public.leaderboard_entries
  for select using (
    exists (
      select 1 from public.site_settings s
      where s.key = 'leaderboard_source_configured'
        and s.is_public
        and s.value = 'true'::jsonb
    )
  );
grant select on public.rule_categories, public.punishment_steps, public.seasons,
  public.downloads to anon, authenticated;
grant select on public.site_settings to anon, authenticated;
grant select, insert, update, delete on public.rule_categories, public.punishment_steps,
  public.seasons, public.downloads, public.site_settings,
  public.features, public.rules, public.titles, public.announcements, public.staff,
  public.leaderboard_entries to authenticated;
grant select on public.orders to authenticated;
grant select on public.order_items, public.payment_records, public.fulfillment_records to authenticated;
grant select on public.admin_roles to authenticated;
grant select, insert, update, delete on public.media to authenticated;
grant select on public.media to anon;

drop policy if exists "Public can read media records" on public.media;
create policy "Public can read media records" on public.media
  for select using (true);
drop policy if exists "Managers can manage media records" on public.media;
create policy "Managers can manage media records" on public.media
  for all using (public.can_manage_content()) with check (public.can_manage_content());

create or replace function public.manage_admin_role(p_user_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_count integer;
begin
  if not public.is_site_owner() then
    raise exception 'Only an owner can manage administrator roles' using errcode = '42501';
  end if;
  if p_user_id is null then
    raise exception 'A valid account is required' using errcode = '22023';
  end if;
  if p_role is not null and p_role not in ('owner', 'administrator', 'editor', 'moderator') then
    raise exception 'Invalid administrator role' using errcode = '22023';
  end if;
  lock table public.admin_roles in exclusive mode;
  if p_role is distinct from 'owner' then
    select count(*) into owner_count from public.admin_roles where role = 'owner';
    if owner_count <= 1 and exists (
      select 1 from public.admin_roles where user_id = p_user_id and role = 'owner'
    ) then
      raise exception 'The last owner cannot be removed or demoted' using errcode = '23514';
    end if;
  end if;
  if p_role is null then
    delete from public.admin_roles where user_id = p_user_id;
  else
    insert into public.admin_roles (user_id, role) values (p_user_id, p_role)
    on conflict (user_id) do update set role = excluded.role;
  end if;
end;
$$;
revoke all on function public.manage_admin_role(uuid, text) from public;
grant execute on function public.manage_admin_role(uuid, text) to authenticated;

create or replace function public.activate_season(p_season_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.can_manage_content() then
    raise exception 'Not authorized to manage seasons' using errcode = '42501';
  end if;
  update public.seasons set status = 'archived', updated_at = now()
    where status = 'active' and id <> p_season_id;
  update public.seasons set status = 'active', updated_at = now()
    where id = p_season_id and status <> 'active';
  if not found and not exists (select 1 from public.seasons where id = p_season_id and status = 'active') then
    raise exception 'Season not found' using errcode = 'P0002';
  end if;
end;
$$;
revoke all on function public.activate_season(uuid) from public;
grant execute on function public.activate_season(uuid) to authenticated;

create or replace function public.review_order_payment(p_order_id uuid, p_decision text, p_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.can_manage_content() then
    raise exception 'Not authorized to review orders' using errcode = '42501';
  end if;
  if p_decision is null or p_decision not in ('verified', 'failed') then
    raise exception 'Payment review must be verified or failed' using errcode = '22023';
  end if;
  update public.orders
    set payment_status = p_decision, updated_at = now()
    where id = p_order_id;
  if not found then
    raise exception 'Order not found' using errcode = 'P0002';
  end if;
  insert into public.payment_records (order_id, provider, amount_cents, currency, status, verified_at)
    select id, 'manual_review', amount_cents, currency, p_decision,
      case when p_decision = 'verified' then now() else null end
    from public.orders where id = p_order_id;
  insert into public.fulfillment_records (order_id, actor_id, action, note)
    values (p_order_id, auth.uid(), 'note', coalesce(p_note, 'Payment marked ' || p_decision));
end;
$$;
revoke all on function public.review_order_payment(uuid, text, text) from public;
grant execute on function public.review_order_payment(uuid, text, text) to authenticated;

create or replace function public.update_order_fulfillment(p_order_id uuid, p_status text, p_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.can_manage_content() then
    raise exception 'Not authorized to fulfill orders' using errcode = '42501';
  end if;
  if p_status is null or p_status not in ('processing', 'fulfilled', 'cancelled') then
    raise exception 'Invalid fulfillment status' using errcode = '22023';
  end if;
  if p_status in ('processing', 'fulfilled') and not exists (
    select 1 from public.orders where id = p_order_id and payment_status = 'verified'
  ) then
    raise exception 'Payment must be verified before fulfillment' using errcode = '23514';
  end if;
  update public.orders set fulfillment_status = p_status,
    delivery_notes = coalesce(p_note, ''), updated_at = now()
    where id = p_order_id;
  if not found then
    raise exception 'Order not found' using errcode = 'P0002';
  end if;
  insert into public.fulfillment_records (order_id, actor_id, action, note)
    values (p_order_id, auth.uid(), p_status, coalesce(p_note, ''));
end;
$$;
revoke all on function public.update_order_fulfillment(uuid, text, text) from public;
grant execute on function public.update_order_fulfillment(uuid, text, text) to authenticated;

create or replace function public.prevent_season_deletion()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Seasons are archived rather than deleted' using errcode = '23514';
end;
$$;
drop trigger if exists seasons_cannot_be_deleted on public.seasons;
create trigger seasons_cannot_be_deleted before delete on public.seasons
  for each row execute function public.prevent_season_deletion();

create or replace function public.list_site_admins()
returns table (user_id uuid, email text, role text, created_at timestamptz)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_site_owner() then
    raise exception 'Only an owner can view administrator accounts' using errcode = '42501';
  end if;
  return query
    select u.id, u.email::text, r.role, u.created_at
    from auth.users u
    left join public.admin_roles r on r.user_id = u.id
    order by u.created_at;
end;
$$;
revoke all on function public.list_site_admins() from public;
grant execute on function public.list_site_admins() to authenticated;

create or replace function public.record_admin_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  row_data jsonb;
  entity_key text;
begin
  row_data := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  entity_key := coalesce(row_data ->> 'id', row_data ->> 'user_id', row_data ->> 'key', 'settings');
  insert into public.audit_logs (actor_id, action, entity_type, entity_id)
  values (auth.uid(), lower(tg_op), tg_table_name, entity_key);
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function public.set_record_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'server_config', 'features', 'rules', 'rule_categories', 'punishment_steps',
    'titles', 'products', 'announcements', 'staff', 'leaderboard_entries',
    'seasons', 'downloads', 'site_settings', 'orders',
    'fulfillment_records', 'admin_roles', 'media'
  ] loop
    execute format('drop trigger if exists audit_admin_changes on public.%I', table_name);
    execute format(
      'create trigger audit_admin_changes after insert or update or delete on public.%I for each row execute function public.record_admin_audit()',
      table_name
    );
  end loop;
  foreach table_name in array array[
    'server_config', 'features', 'rules', 'rule_categories', 'punishment_steps',
    'titles', 'products', 'announcements', 'staff', 'leaderboard_entries',
    'seasons', 'downloads', 'site_settings', 'orders'
  ] loop
    execute format('drop trigger if exists set_updated_at on public.%I', table_name);
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function public.set_record_updated_at()',
      table_name
    );
  end loop;
end;
$$;

alter table public.audit_logs enable row level security;
drop policy if exists "Managers can read audit logs" on public.audit_logs;
create policy "Managers can read audit logs" on public.audit_logs
  for select using (public.can_manage_content());
grant select on public.audit_logs to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('site-media', 'site-media', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('download-files', 'download-files', false, 104857600, null)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view site media" on storage.objects;
create policy "Public can view site media" on storage.objects
  for select using (bucket_id = 'site-media');
drop policy if exists "Managers can upload site media" on storage.objects;
create policy "Managers can upload site media" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'site-media' and public.can_manage_content()
    and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists "Managers can update site media" on storage.objects;
create policy "Managers can update site media" on storage.objects
  for update to authenticated using (
    bucket_id = 'site-media' and public.can_manage_content()
  ) with check (bucket_id = 'site-media' and public.can_manage_content());
drop policy if exists "Managers can delete site media" on storage.objects;
create policy "Managers can delete site media" on storage.objects
  for delete to authenticated using (bucket_id = 'site-media' and public.can_manage_content());
drop policy if exists "Managers can upload downloads" on storage.objects;
create policy "Managers can upload downloads" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'download-files' and public.can_manage_content()
    and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists "Managers can update downloads" on storage.objects;
create policy "Managers can update downloads" on storage.objects
  for update to authenticated using (
    bucket_id = 'download-files' and public.can_manage_content()
  ) with check (bucket_id = 'download-files' and public.can_manage_content());
drop policy if exists "Managers can delete downloads" on storage.objects;
create policy "Managers can delete downloads" on storage.objects
  for delete to authenticated using (bucket_id = 'download-files' and public.can_manage_content());
drop policy if exists "Public can download published files" on storage.objects;
create policy "Public can download published files" on storage.objects
  for select using (
    bucket_id = 'download-files' and exists (
      select 1 from public.downloads d
      where d.storage_path = name and d.published
    )
  );
