-- Second stage of the CMS: per-user permissions, editable pages with draft/publish/schedule,
-- version history, media library, compliance documents, redirects, enquiry activity and analytics.

alter table public.admin_users add column permissions jsonb not null default '{}';

-- Default permission matrix. A user's "permissions" overrides it per "area.action".
create function public.role_can(r public.staff_role, area text, action text) returns boolean
language sql immutable set search_path = '' as $$
  select case r
    when 'super_admin' then true
    when 'website_admin' then area <> 'users'
    when 'product_manager' then area = 'catalogue'
      or (area in ('media','documents') and action in ('read','edit'))
    when 'content_editor' then (area = 'pages' and action in ('read','edit'))
      or (area = 'media' and action in ('read','edit'))
      or (area = 'catalogue' and action = 'read')
    when 'seo_manager' then area = 'seo'
      or (area = 'analytics')
      or (area in ('pages','catalogue') and action in ('read','edit'))
      or (area = 'media' and action = 'read')
    when 'sales_manager' then (area = 'enquiries' and action <> 'delete')
      or (area = 'analytics' and action = 'read')
      or (area = 'catalogue' and action = 'read')
      or (area = 'documents' and action = 'read')
    else false end;
$$;

create function public.can(area text, action text) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare
  u public.admin_users;
  override text;
begin
  select * into u from public.admin_users where user_id = auth.uid();
  if not found then return false; end if;
  if coalesce(auth.jwt()->>'aal','') <> 'aal2'
     and exists (select 1 from auth.mfa_factors f where f.user_id = auth.uid() and f.status = 'verified') then
    return false;
  end if;
  override := u.permissions->>(area || '.' || action);
  if override is not null then return override::boolean; end if;
  return public.role_can(u.role, area, action);
end $$;

-- Replace the role-list policies from the first migration.
drop policy "own row or super admin" on public.admin_users;
drop policy "super admin updates" on public.admin_users;
drop policy "super admin removes others" on public.admin_users;
create policy "own row or user managers" on public.admin_users for select to authenticated
  using (user_id = auth.uid() or public.can('users','read'));
create policy "user managers update" on public.admin_users for update to authenticated
  using (public.can('users','edit')) with check (public.can('users','edit'));
create policy "user managers remove others" on public.admin_users for delete to authenticated
  using (public.can('users','delete') and user_id <> auth.uid());

alter table public.site_settings drop constraint site_settings_key_check;
alter table public.site_settings add constraint site_settings_key_check
  check (key in ('general','content','seo','design','nav','forms','technical','catalogue'));
create function public.settings_area(k text) returns text language sql immutable set search_path = '' as $$
  select case k when 'general' then 'company' when 'content' then 'pages' when 'seo' then 'seo'
    when 'design' then 'design' when 'nav' then 'design' when 'forms' then 'enquiries'
    when 'technical' then 'technical' when 'catalogue' then 'catalogue' end;
$$;
drop policy "write by section" on public.site_settings;
create policy "write by section" on public.site_settings for all to authenticated
  using (public.can(public.settings_area(key),'edit')) with check (public.can(public.settings_area(key),'edit'));

drop policy "catalogue write" on public.collections;
drop policy "catalogue write" on public.subcategories;
drop policy "catalogue write" on public.products;
drop policy "read published" on public.collections;
drop policy "read published" on public.subcategories;
drop policy "read active" on public.products;
create policy "read published" on public.collections for select to anon, authenticated using (published or public.can('catalogue','read'));
create policy "read published" on public.subcategories for select to anon, authenticated using (published or public.can('catalogue','read'));
create policy "read active" on public.products for select to anon, authenticated using (status = 'active' or public.can('catalogue','read'));
create policy "insert" on public.collections for insert to authenticated with check (public.can('catalogue','edit'));
create policy "update" on public.collections for update to authenticated using (public.can('catalogue','edit')) with check (public.can('catalogue','edit'));
create policy "delete" on public.collections for delete to authenticated using (public.can('catalogue','delete'));
create policy "insert" on public.subcategories for insert to authenticated with check (public.can('catalogue','edit'));
create policy "update" on public.subcategories for update to authenticated using (public.can('catalogue','edit')) with check (public.can('catalogue','edit'));
create policy "delete" on public.subcategories for delete to authenticated using (public.can('catalogue','delete'));
create policy "insert" on public.products for insert to authenticated with check (public.can('catalogue','edit'));
create policy "update" on public.products for update to authenticated using (public.can('catalogue','edit')) with check (public.can('catalogue','edit'));
create policy "delete" on public.products for delete to authenticated using (public.can('catalogue','delete'));

-- Making a product live needs "publish"; scheduled publication runs as the system.
alter table public.products add column publish_at timestamptz;
create index products_publish_at_idx on public.products (publish_at) where publish_at is not null;
create function public.guard_product_publish() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(current_setting('mridora.system', true), '') = 'on' or auth.uid() is null then return new; end if;
  if (new.status = 'active' and (tg_op = 'INSERT' or old.status <> 'active'))
     or (new.publish_at is distinct from (case when tg_op = 'INSERT' then null else old.publish_at end)) then
    if not public.can('catalogue','publish') then
      raise exception 'You do not have permission to publish products.' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;
create trigger guard_publish before insert or update on public.products for each row execute function public.guard_product_publish();

drop policy "sales read" on public.rfqs;
drop policy "sales update" on public.rfqs;
drop policy "super admin delete" on public.rfqs;
create policy "read" on public.rfqs for select to authenticated using (public.can('enquiries','read'));
create policy "update" on public.rfqs for update to authenticated using (public.can('enquiries','edit')) with check (public.can('enquiries','edit'));
create policy "delete" on public.rfqs for delete to authenticated using (public.can('enquiries','delete'));

drop policy "super admin reads" on public.audit_log;
create policy "activity readers" on public.audit_log for select to authenticated using (public.can('users','read'));

create or replace function public.next_sku(sub_id text) returns text
language plpgsql security definer set search_path = '' as $$
declare
  sub public.subcategories;
  prefix text;
  existing int;
  seq int;
begin
  if not public.can('catalogue','edit') then raise exception 'not allowed' using errcode = '42501'; end if;
  select * into sub from public.subcategories where id = sub_id;
  if not found then raise exception 'unknown subcategory %', sub_id; end if;
  prefix := 'MRD-' || sub.collection_code || '-' || sub.code || '-';
  select coalesce(max(substring(sku from '[0-9]+$')::int), 0) into existing from public.products where sku like prefix || '%';
  insert into public.sku_counters (subcategory_id, last_value) values (sub_id, existing + 1)
    on conflict (subcategory_id) do update set last_value = greatest(public.sku_counters.last_value, existing) + 1
    returning last_value into seq;
  return prefix || lpad(seq::text, 4, '0');
end $$;

create or replace function public.grant_staff_role(target_email text, target_role public.staff_role) returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid;
begin
  if not public.can('users','edit') then raise exception 'not allowed' using errcode = '42501'; end if;
  select id into uid from auth.users where lower(email) = lower(target_email);
  if uid is null then raise exception 'No account exists for that email. Create it in Supabase Auth first.'; end if;
  insert into public.admin_users (user_id, email, role) values (uid, lower(target_email), target_role)
    on conflict (user_id) do update set role = excluded.role;
end $$;

-- Pages. "pages" holds only what is live and is public; drafts live in a staff-only table.
create table public.pages (
  slug text primary key check (slug ~ '^[a-z0-9-]+$'),
  title text not null,
  published boolean not null default true,
  sections jsonb not null default '[]',
  seo_title text not null default '',
  seo_description text not null default '',
  canonical text not null default '',
  og_image text not null default '',
  noindex boolean not null default false,
  published_at timestamptz,
  updated_at timestamptz not null default now()
);
create table public.page_drafts (
  slug text primary key check (slug ~ '^[a-z0-9-]+$'),
  title text not null,
  sections jsonb not null default '[]',
  seo_title text not null default '',
  seo_description text not null default '',
  canonical text not null default '',
  og_image text not null default '',
  noindex boolean not null default false,
  publish_at timestamptz,
  updated_by uuid,
  updated_at timestamptz not null default now()
);
create index page_drafts_publish_at_idx on public.page_drafts (publish_at) where publish_at is not null;
create trigger touch before update on public.page_drafts for each row execute function public.touch_updated_at();

-- Reusable sections saved from the page builder.
create table public.section_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  section jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.pages enable row level security;
alter table public.page_drafts enable row level security;
alter table public.section_templates enable row level security;
create policy "public read" on public.pages for select to anon, authenticated using (true);
create policy "drafts read" on public.page_drafts for select to authenticated using (public.can('pages','read'));
create policy "drafts insert" on public.page_drafts for insert to authenticated with check (public.can('pages','edit'));
create policy "drafts update" on public.page_drafts for update to authenticated using (public.can('pages','edit')) with check (public.can('pages','edit'));
create policy "drafts delete" on public.page_drafts for delete to authenticated using (public.can('pages','delete'));
create policy "read" on public.section_templates for select to authenticated using (public.can('pages','read'));
create policy "write" on public.section_templates for all to authenticated using (public.can('pages','edit')) with check (public.can('pages','edit'));
-- Live pages change only through the functions below.
revoke insert, update, delete on public.pages from anon, authenticated;

create function public.apply_draft(p_slug text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.pages (slug, title, published, sections, seo_title, seo_description, canonical, og_image, noindex, published_at, updated_at)
    select slug, title, true, sections, seo_title, seo_description, canonical, og_image, noindex, now(), now()
    from public.page_drafts where slug = p_slug
  on conflict (slug) do update set title = excluded.title, published = true, sections = excluded.sections,
    seo_title = excluded.seo_title, seo_description = excluded.seo_description, canonical = excluded.canonical,
    og_image = excluded.og_image, noindex = excluded.noindex, published_at = now(), updated_at = now();
  update public.page_drafts set publish_at = null where slug = p_slug;
end $$;
revoke execute on function public.apply_draft(text) from public, anon, authenticated;

create function public.publish_page(p_slug text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.can('pages','publish') then raise exception 'You do not have permission to publish pages.' using errcode = '42501'; end if;
  if not exists (select 1 from public.page_drafts where slug = p_slug) then raise exception 'Save the page first.'; end if;
  perform public.apply_draft(p_slug);
end $$;

create function public.unpublish_page(p_slug text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.can('pages','publish') then raise exception 'You do not have permission to unpublish pages.' using errcode = '42501'; end if;
  insert into public.pages (slug, title, published, sections) values (p_slug, p_slug, false, '[]')
    on conflict (slug) do update set published = false, sections = '[]', updated_at = now();
  update public.page_drafts set publish_at = null where slug = p_slug;
end $$;

create function public.schedule_page(p_slug text, p_at timestamptz) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.can('pages','publish') then raise exception 'You do not have permission to schedule pages.' using errcode = '42501'; end if;
  update public.page_drafts set publish_at = p_at where slug = p_slug;
end $$;

-- Applies anything due. Called when the site refreshes its data, so no cron job is needed;
-- it can only publish what staff with permission already scheduled.
create function public.run_due_publications() returns void
language plpgsql security definer set search_path = '' as $$
declare
  r record;
begin
  perform set_config('mridora.system', 'on', true);
  for r in select slug from public.page_drafts where publish_at <= now() loop
    perform public.apply_draft(r.slug);
  end loop;
  update public.products set status = 'active', publish_at = null where publish_at <= now();
  perform set_config('mridora.system', '', true);
end $$;
grant execute on function public.run_due_publications() to anon, authenticated;

-- Page drafts must not set their own schedule by direct write.
create function public.guard_draft_schedule() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null
     and new.publish_at is distinct from (case when tg_op = 'INSERT' then null else old.publish_at end)
     and coalesce(current_setting('mridora.system', true), '') <> 'on'
     and not public.can('pages','publish') then
    raise exception 'You do not have permission to schedule pages.' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger guard_schedule before insert or update on public.page_drafts for each row execute function public.guard_draft_schedule();

create or replace function public.write_audit() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  r jsonb := to_jsonb(coalesce(new, old));
begin
  insert into public.audit_log (user_id, action, entity, entity_id, old_row, new_row)
  values (auth.uid(), lower(tg_op), tg_table_name,
          coalesce(r->>'sku', r->>'slug', r->>'code', r->>'key', r->>'id', r->>'user_id'),
          case when tg_op = 'INSERT' then null else to_jsonb(old) end,
          case when tg_op = 'DELETE' then null else to_jsonb(new) end);
  return coalesce(new, old);
end $$;
create trigger audit after insert or update or delete on public.pages for each row execute function public.write_audit();
create trigger audit after insert or update or delete on public.page_drafts for each row execute function public.write_audit();

-- Version history for one record, for staff who can read that area.
create function public.entity_history(p_entity text, p_id text)
returns table (id bigint, at timestamptz, action text, who text, new_row jsonb)
language plpgsql stable security definer set search_path = '' as $$
declare
  area text := case p_entity
    when 'products' then 'catalogue' when 'collections' then 'catalogue' when 'subcategories' then 'catalogue'
    when 'pages' then 'pages' when 'page_drafts' then 'pages' when 'site_settings' then 'pages' end;
begin
  if area is null or not public.can(area, 'read') then raise exception 'not allowed' using errcode = '42501'; end if;
  return query
    select a.id, a.at, a.action, coalesce(u.email, 'System'), a.new_row
    from public.audit_log a left join public.admin_users u on u.user_id = a.user_id
    where a.entity = p_entity and a.entity_id = p_id and a.new_row is not null
    order by a.id desc limit 50;
end $$;

-- Staff-only settings, such as email templates, that visitors must not read.
create table public.private_settings (
  key text primary key,
  value jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
alter table public.private_settings enable row level security;
create policy "enquiry managers" on public.private_settings for all to authenticated
  using (public.can('enquiries','edit')) with check (public.can('enquiries','edit'));

create table public.redirects (
  id uuid primary key default gen_random_uuid(),
  from_path text not null unique check (from_path ~ '^/[^/]'),
  to_path text not null check (to_path ~ '^(/|https://)'),
  code int not null default 301 check (code in (301, 302)),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (from_path <> to_path)
);
alter table public.redirects enable row level security;
create policy "public read" on public.redirects for select to anon, authenticated using (true);
create policy "seo write" on public.redirects for all to authenticated using (public.can('seo','edit')) with check (public.can('seo','edit'));

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  path text not null unique,
  url text not null,
  name text not null,
  folder text not null default 'general',
  tags text[] not null default '{}',
  kind text not null default 'image',
  mime text not null default '',
  size_bytes bigint not null default 0,
  alt text not null default '',
  created_by uuid,
  created_at timestamptz not null default now()
);
create index media_folder_idx on public.media_assets (folder);
alter table public.media_assets enable row level security;
create policy "read" on public.media_assets for select to authenticated using (public.can('media','read'));
create policy "insert" on public.media_assets for insert to authenticated with check (public.can('media','edit'));
create policy "update" on public.media_assets for update to authenticated using (public.can('media','edit')) with check (public.can('media','edit'));
create policy "delete" on public.media_assets for delete to authenticated using (public.can('media','delete'));

-- Compliance and company documents. Files sit in a private bucket; a visitor can only reach
-- one that has been approved, marked public and has not expired.
create type public.document_status as enum ('pending','approved','rejected');
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  doc_type text not null default 'Other',
  file_path text not null unique,
  file_name text not null default '',
  product_sku text,
  expiry_date date,
  is_public boolean not null default false,
  status public.document_status not null default 'pending',
  approved_by uuid,
  approved_at timestamptz,
  notes text not null default '',
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create index documents_sku_idx on public.documents (product_sku);
create function public.guard_document_approval() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then return new; end if;
  if (tg_op = 'INSERT' and new.status <> 'pending')
     or (tg_op = 'UPDATE' and new.status <> old.status) then
    if not public.can('documents','publish') then
      raise exception 'You do not have permission to approve documents.' using errcode = '42501';
    end if;
    new.approved_by := auth.uid();
    new.approved_at := now();
  end if;
  -- Replacing the file sends an approved document back for review.
  if tg_op = 'UPDATE' and new.file_path <> old.file_path and new.status = old.status then
    new.status := 'pending';
    new.approved_by := null;
    new.approved_at := null;
  end if;
  return new;
end $$;
create trigger guard_approval before insert or update on public.documents for each row execute function public.guard_document_approval();
create trigger audit after insert or update or delete on public.documents for each row execute function public.write_audit();
alter table public.documents enable row level security;
create policy "public approved" on public.documents for select to anon, authenticated
  using ((status = 'approved' and is_public and (expiry_date is null or expiry_date >= current_date)) or public.can('documents','read'));
create policy "insert" on public.documents for insert to authenticated with check (public.can('documents','edit'));
create policy "update" on public.documents for update to authenticated using (public.can('documents','edit')) with check (public.can('documents','edit'));
create policy "delete" on public.documents for delete to authenticated using (public.can('documents','delete'));

create table public.rfq_activity (
  id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null references public.rfqs(id) on delete cascade,
  at timestamptz not null default now(),
  kind text not null default 'note',
  body text not null,
  created_by uuid default auth.uid(),
  author_email text not null default ''
);
create index rfq_activity_rfq_idx on public.rfq_activity (rfq_id);
alter table public.rfq_activity enable row level security;
create policy "read" on public.rfq_activity for select to authenticated using (public.can('enquiries','read'));
create policy "insert" on public.rfq_activity for insert to authenticated with check (public.can('enquiries','edit'));

create table public.login_events (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  user_id uuid not null default auth.uid(),
  email text not null default '',
  event text not null check (event in ('sign_in','sign_out','timeout')),
  user_agent text not null default '' check (char_length(user_agent) <= 500)
);
alter table public.login_events enable row level security;
create policy "own insert" on public.login_events for insert to authenticated with check (user_id = auth.uid());
create policy "read" on public.login_events for select to authenticated using (public.can('users','read'));

-- First-party measurement. No IP address or personal data is stored.
create table public.analytics_events (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  type text not null check (type in ('pageview','product_view','collection_view','search','rfq')),
  path text not null default '' check (char_length(path) <= 300),
  label text not null default '' check (char_length(label) <= 200),
  source text not null default '' check (char_length(source) <= 100),
  country text not null default '' check (char_length(country) <= 2),
  session_id text not null default '' check (char_length(session_id) <= 64)
);
create index analytics_at_idx on public.analytics_events (at);
alter table public.analytics_events enable row level security;
revoke all on public.analytics_events from anon, authenticated;
grant insert (type, path, label, source, country, session_id) on public.analytics_events to anon, authenticated;
create policy "anyone records" on public.analytics_events for insert to anon, authenticated with check (true);

create function public.analytics_summary(p_days int) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  since timestamptz := now() - make_interval(days => least(greatest(p_days, 1), 366));
  top jsonb;
begin
  if not public.can('analytics','read') then raise exception 'not allowed' using errcode = '42501'; end if;
  with e as (select * from public.analytics_events where at >= since)
  select jsonb_build_object(
    'visitors', (select count(distinct session_id) from e where session_id <> ''),
    'pageviews', (select count(*) from e where type = 'pageview'),
    'rfqEvents', (select count(*) from e where type = 'rfq'),
    'countries', (select coalesce(jsonb_agg(x), '[]') from (select country as label, count(distinct session_id) as value from e where country <> '' group by 1 order by 2 desc limit 15) x),
    'sources', (select coalesce(jsonb_agg(x), '[]') from (select coalesce(nullif(source,''),'Direct') as label, count(distinct session_id) as value from e where type = 'pageview' group by 1 order by 2 desc limit 15) x),
    'pages', (select coalesce(jsonb_agg(x), '[]') from (select path as label, count(*) as value from (select distinct on (session_id) session_id, path from e where type = 'pageview' and session_id <> '' order by session_id, at) first_pages group by 1 order by 2 desc limit 15) x),
    'products', (select coalesce(jsonb_agg(x), '[]') from (select label, count(*) as value from e where type = 'product_view' group by 1 order by 2 desc limit 15) x),
    'collections', (select coalesce(jsonb_agg(x), '[]') from (select label, count(*) as value from e where type = 'collection_view' group by 1 order by 2 desc limit 15) x),
    'searches', (select coalesce(jsonb_agg(x), '[]') from (select lower(label) as label, count(*) as value from e where type = 'search' group by 1 order by 2 desc limit 15) x),
    'daily', (select coalesce(jsonb_agg(x order by x.label), '[]') from (select to_char(at, 'YYYY-MM-DD') as label, count(distinct session_id) as value from e group by 1) x)
  ) into top;
  return top;
end $$;

revoke execute on function public.analytics_summary(int) from public, anon;
revoke execute on function public.publish_page(text) from public, anon;
revoke execute on function public.unpublish_page(text) from public, anon;
revoke execute on function public.schedule_page(text, timestamptz) from public, anon;
revoke execute on function public.entity_history(text, text) from public, anon;
grant execute on function public.analytics_summary(int), public.publish_page(text), public.unpublish_page(text),
  public.schedule_page(text, timestamptz), public.entity_history(text, text) to authenticated;

-- Limits automated floods of the public quote form. Counts are per hour.
create function public.limit_rfq_rate() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.rfqs where email = lower(new.email) and created_at > now() - interval '1 hour') >= 5
     or (select count(*) from public.rfqs where created_at > now() - interval '1 hour') >= 200 then
    raise exception 'too many enquiries' using errcode = 'P0001';
  end if;
  new.email := lower(new.email);
  return new;
end $$;
create trigger limit_rate before insert on public.rfqs for each row execute function public.limit_rfq_rate();

-- Storage
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('documents', 'documents', false, 26214400, array['application/pdf','image/jpeg','image/png','image/webp']);
drop policy "media write" on storage.objects;
drop policy "rfq read" on storage.objects;
create policy "media insert" on storage.objects for insert to authenticated with check (bucket_id = 'media' and public.can('media','edit'));
create policy "media update" on storage.objects for update to authenticated using (bucket_id = 'media' and public.can('media','edit')) with check (bucket_id = 'media' and public.can('media','edit'));
create policy "media delete" on storage.objects for delete to authenticated using (bucket_id = 'media' and public.can('media','delete'));
create policy "rfq read" on storage.objects for select to authenticated using (bucket_id = 'rfq-attachments' and public.can('enquiries','read'));
create policy "documents insert" on storage.objects for insert to authenticated with check (bucket_id = 'documents' and public.can('documents','edit'));
create policy "documents staff read" on storage.objects for select to authenticated using (bucket_id = 'documents' and public.can('documents','read'));
create policy "documents delete" on storage.objects for delete to authenticated using (bucket_id = 'documents' and public.can('documents','delete'));
create policy "documents public read" on storage.objects for select to anon, authenticated using (
  bucket_id = 'documents' and exists (
    select 1 from public.documents d where d.file_path = name and d.status = 'approved' and d.is_public
      and (d.expiry_date is null or d.expiry_date >= current_date)));

-- has_role is superseded by can().
drop function public.is_staff();
drop function public.has_role(public.staff_role[]);
