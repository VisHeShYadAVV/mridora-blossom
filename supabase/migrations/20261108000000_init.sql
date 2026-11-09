-- MRIDORA CMS schema. Row-level security is the access control: the browser only
-- ever holds the public anon key, so every rule the site relies on is enforced here.

create type public.staff_role as enum
  ('super_admin','website_admin','product_manager','content_editor','seo_manager','sales_manager');
create type public.product_status as enum ('draft','active','archived');
create type public.rfq_status as enum ('new','reviewing','quoted','negotiating','won','lost','closed');

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role public.staff_role not null,
  created_at timestamptz not null default now()
);

-- If the user has a verified MFA factor, staff access requires an MFA-verified session.
create function public.has_role(allowed public.staff_role[]) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.admin_users a
    where a.user_id = auth.uid() and a.role = any(allowed)
  ) and (
    coalesce(auth.jwt()->>'aal','') = 'aal2'
    or not exists (select 1 from auth.mfa_factors f where f.user_id = auth.uid() and f.status = 'verified')
  );
$$;

create function public.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select public.has_role(enum_range(null::public.staff_role));
$$;

create table public.site_settings (
  key text primary key check (key in ('general','content','seo')),
  value jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table public.collections (
  code text primary key check (code ~ '^[A-Z]{2}$'),
  slug text not null unique,
  name text not null,
  tagline text not null default '',
  description text not null default '',
  seo_title text not null default '',
  seo_description text not null default '',
  image text not null default '',
  sort_order int not null default 0,
  published boolean not null default true
);

create table public.subcategories (
  id text primary key,
  collection_code text not null references public.collections(code) on update cascade,
  code text not null check (code ~ '^[A-Z]{2}$'),
  slug text not null,
  name text not null,
  description text not null default '',
  seo_title text not null default '',
  seo_description text not null default '',
  sort_order int not null default 0,
  published boolean not null default true,
  unique (collection_code, code),
  unique (collection_code, slug)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique check (sku ~ '^MRD-[A-Z]{2}-[A-Z]{2}-[0-9]{4,}$'),
  slug text not null unique,
  name text not null,
  subcategory_id text not null references public.subcategories(id),
  status public.product_status not null default 'draft',
  featured boolean not null default false,
  new_arrival boolean not null default false,
  is_sample boolean not null default false,
  sort_order int not null default 0,
  data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_subcategory_idx on public.products (subcategory_id);
create index products_status_idx on public.products (status);

-- Per-subcategory SKU counters, so the number of a deleted product is never reused.
create table public.sku_counters (
  subcategory_id text primary key references public.subcategories(id) on delete cascade,
  last_value int not null default 0
);

create table public.rfqs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status public.rfq_status not null default 'new',
  company text not null check (char_length(company) between 1 and 300),
  contact_name text not null default '' check (char_length(contact_name) <= 300),
  country text not null check (char_length(country) between 1 and 300),
  email text not null check (char_length(email) <= 300 and email like '%@%'),
  phone text not null default '' check (char_length(phone) <= 300),
  items jsonb not null default '[]' check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) <= 200),
  material text not null default '' check (char_length(material) <= 300),
  colour_finish text not null default '' check (char_length(colour_finish) <= 300),
  customization text not null default '' check (char_length(customization) <= 300),
  packaging text not null default '' check (char_length(packaging) <= 300),
  destination text not null default '' check (char_length(destination) <= 300),
  incoterm text not null default '' check (char_length(incoterm) <= 300),
  message text not null default '' check (char_length(message) <= 5000),
  attachment_path text check (char_length(attachment_path) <= 300),
  internal_notes text not null default '',
  quote_reference text not null default '',
  follow_up_date date
);
create index rfqs_created_idx on public.rfqs (created_at desc);

create table public.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  user_id uuid,
  action text not null,
  entity text not null,
  entity_id text,
  old_row jsonb,
  new_row jsonb
);

create function public.write_audit() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  r jsonb := to_jsonb(coalesce(new, old));
begin
  insert into public.audit_log (user_id, action, entity, entity_id, old_row, new_row)
  values (auth.uid(), lower(tg_op), tg_table_name,
          coalesce(r->>'sku', r->>'id', r->>'code', r->>'key', r->>'user_id'),
          case when tg_op = 'INSERT' then null else to_jsonb(old) end,
          case when tg_op = 'DELETE' then null else to_jsonb(new) end);
  return coalesce(new, old);
end $$;

create function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();
create trigger settings_touch before update on public.site_settings for each row execute function public.touch_updated_at();

create trigger audit after insert or update or delete on public.products for each row execute function public.write_audit();
create trigger audit after insert or update or delete on public.collections for each row execute function public.write_audit();
create trigger audit after insert or update or delete on public.subcategories for each row execute function public.write_audit();
create trigger audit after insert or update or delete on public.site_settings for each row execute function public.write_audit();
create trigger audit after insert or update or delete on public.rfqs for each row execute function public.write_audit();
create trigger audit after insert or update or delete on public.admin_users for each row execute function public.write_audit();

create function public.next_sku(sub_id text) returns text
language plpgsql security definer set search_path = '' as $$
declare
  sub public.subcategories;
  prefix text;
  existing int;
  seq int;
begin
  if not public.has_role(array['super_admin','website_admin','product_manager']::public.staff_role[]) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select * into sub from public.subcategories where id = sub_id;
  if not found then raise exception 'unknown subcategory %', sub_id; end if;
  prefix := 'MRD-' || sub.collection_code || '-' || sub.code || '-';
  select coalesce(max(substring(sku from '[0-9]+$')::int), 0) into existing
    from public.products where sku like prefix || '%';
  insert into public.sku_counters (subcategory_id, last_value) values (sub_id, existing + 1)
    on conflict (subcategory_id) do update
    set last_value = greatest(public.sku_counters.last_value, existing) + 1
    returning last_value into seq;
  return prefix || lpad(seq::text, 4, '0');
end $$;

-- The account must already exist in Supabase Auth; only a super admin can grant access.
create function public.grant_staff_role(target_email text, target_role public.staff_role) returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid;
begin
  if not public.has_role(array['super_admin']::public.staff_role[]) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select id into uid from auth.users where lower(email) = lower(target_email);
  if uid is null then raise exception 'No account exists for that email. Create it in Supabase Auth first.'; end if;
  insert into public.admin_users (user_id, email, role) values (uid, lower(target_email), target_role)
    on conflict (user_id) do update set role = excluded.role;
end $$;

-- Row-level security
alter table public.admin_users enable row level security;
alter table public.site_settings enable row level security;
alter table public.collections enable row level security;
alter table public.subcategories enable row level security;
alter table public.products enable row level security;
alter table public.sku_counters enable row level security;
alter table public.rfqs enable row level security;
alter table public.audit_log enable row level security;

create policy "own row or super admin" on public.admin_users for select to authenticated
  using (user_id = auth.uid() or public.has_role(array['super_admin']::public.staff_role[]));
create policy "super admin updates" on public.admin_users for update to authenticated
  using (public.has_role(array['super_admin']::public.staff_role[]))
  with check (public.has_role(array['super_admin']::public.staff_role[]));
create policy "super admin removes others" on public.admin_users for delete to authenticated
  using (public.has_role(array['super_admin']::public.staff_role[]) and user_id <> auth.uid());

create policy "public read" on public.site_settings for select to anon, authenticated using (true);
-- Company identifiers and contact details ('general') are kept apart from editorial content.
create policy "write by section" on public.site_settings for all to authenticated
  using (
    public.has_role(array['super_admin','website_admin']::public.staff_role[])
    or (key = 'content' and public.has_role(array['content_editor']::public.staff_role[]))
    or (key = 'seo' and public.has_role(array['seo_manager']::public.staff_role[]))
  ) with check (
    public.has_role(array['super_admin','website_admin']::public.staff_role[])
    or (key = 'content' and public.has_role(array['content_editor']::public.staff_role[]))
    or (key = 'seo' and public.has_role(array['seo_manager']::public.staff_role[]))
  );

create policy "read published" on public.collections for select to anon, authenticated using (published or public.is_staff());
create policy "catalogue write" on public.collections for all to authenticated
  using (public.has_role(array['super_admin','website_admin','product_manager']::public.staff_role[]))
  with check (public.has_role(array['super_admin','website_admin','product_manager']::public.staff_role[]));

create policy "read published" on public.subcategories for select to anon, authenticated using (published or public.is_staff());
create policy "catalogue write" on public.subcategories for all to authenticated
  using (public.has_role(array['super_admin','website_admin','product_manager']::public.staff_role[]))
  with check (public.has_role(array['super_admin','website_admin','product_manager']::public.staff_role[]));

create policy "read active" on public.products for select to anon, authenticated using (status = 'active' or public.is_staff());
create policy "catalogue write" on public.products for all to authenticated
  using (public.has_role(array['super_admin','website_admin','product_manager']::public.staff_role[]))
  with check (public.has_role(array['super_admin','website_admin','product_manager']::public.staff_role[]));

-- Visitors can create an enquiry but cannot read any, and only buyer-facing columns are
-- writable, so a submission cannot set its own status or internal notes.
revoke all on public.rfqs from anon, authenticated;
grant insert (company, country, email, phone, items, material, colour_finish, customization,
              packaging, destination, incoterm, message, attachment_path)
  on public.rfqs to anon, authenticated;
grant select, update, delete on public.rfqs to authenticated;
create policy "anyone can submit" on public.rfqs for insert to anon, authenticated with check (true);
create policy "sales read" on public.rfqs for select to authenticated
  using (public.has_role(array['super_admin','website_admin','sales_manager']::public.staff_role[]));
create policy "sales update" on public.rfqs for update to authenticated
  using (public.has_role(array['super_admin','website_admin','sales_manager']::public.staff_role[]))
  with check (public.has_role(array['super_admin','website_admin','sales_manager']::public.staff_role[]));
create policy "super admin delete" on public.rfqs for delete to authenticated
  using (public.has_role(array['super_admin']::public.staff_role[]));

revoke all on public.audit_log from anon, authenticated;
grant select on public.audit_log to authenticated;
create policy "super admin reads" on public.audit_log for select to authenticated
  using (public.has_role(array['super_admin']::public.staff_role[]));

revoke all on public.sku_counters from anon, authenticated;
revoke execute on function public.next_sku(text) from public, anon;
revoke execute on function public.grant_staff_role(text, public.staff_role) from public, anon;
grant execute on function public.next_sku(text) to authenticated;
grant execute on function public.grant_staff_role(text, public.staff_role) to authenticated;

-- Storage
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('media', 'media', true, 20971520,
   array['image/jpeg','image/png','image/webp','image/avif','video/mp4','application/pdf']),
  ('rfq-attachments', 'rfq-attachments', false, 10485760,
   array['application/pdf','image/jpeg','image/png','image/webp','image/vnd.dwg','application/acad',
         'application/dxf','image/vnd.dxf','application/octet-stream']);

create policy "media write" on storage.objects for all to authenticated
  using (bucket_id = 'media' and public.has_role(array['super_admin','website_admin','product_manager','content_editor']::public.staff_role[]))
  with check (bucket_id = 'media' and public.has_role(array['super_admin','website_admin','product_manager','content_editor']::public.staff_role[]));
create policy "media read" on storage.objects for select to anon, authenticated using (bucket_id = 'media');
create policy "rfq upload" on storage.objects for insert to anon, authenticated with check (bucket_id = 'rfq-attachments');
create policy "rfq read" on storage.objects for select to authenticated
  using (bucket_id = 'rfq-attachments' and public.has_role(array['super_admin','website_admin','sales_manager']::public.staff_role[]));
