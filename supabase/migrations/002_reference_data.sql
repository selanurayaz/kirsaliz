-- =============================================================================
-- KırsalİZ — 002_reference_data
-- Referans verileri: ilçeler, köyler, birimler (departmanlar), talep kategorileri.
-- Ayrıca profiles tablosuna department_id / village_id bağlantıları ve RLS'te
-- kullanılacak public.is_admin() fonksiyonu eklenir.
--
-- ÖN KOŞUL: 001_profiles.sql çalıştırılmış olmalıdır (profiles, user_role,
-- public.set_updated_at() burada kullanılır).
--
-- Supabase SQL Editor'da güvenle (tekrar) çalıştırılabilir: tablolar
-- "if not exists", fonksiyonlar "or replace", politikalar "drop ... if exists",
-- seed verileri "on conflict do nothing" ile yazılır.
--
-- Demo köyler bu dosyada DEĞİL, supabase/seed/001_demo_villages.sql içindedir.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. districts — ilçeler
-- -----------------------------------------------------------------------------
create table if not exists public.districts (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(btrim(name)) between 1 and 100),
  code        text check (code is null or char_length(code) <= 20),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint districts_name_key unique (name),
  constraint districts_code_key unique (code)   -- NULL kodlar çakışmaz
);

comment on table public.districts is 'İl içindeki ilçeler (Elazığ).';

-- -----------------------------------------------------------------------------
-- 2. villages — köyler
-- -----------------------------------------------------------------------------
create table if not exists public.villages (
  id           uuid primary key default gen_random_uuid(),
  district_id  uuid not null references public.districts (id) on delete restrict,
  name         text not null check (char_length(btrim(name)) between 1 and 150),
  population   integer check (population is null or population >= 0),
  latitude     double precision check (latitude is null or latitude between -90 and 90),
  longitude    double precision check (longitude is null or longitude between -180 and 180),
  is_demo      boolean not null default false,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint villages_district_name_key unique (district_id, name),
  -- Enlem ve boylam ya birlikte dolu ya birlikte boş olmalı.
  constraint villages_coordinates_pair_chk check ((latitude is null) = (longitude is null))
);

comment on table public.villages is 'Köyler. is_demo = true kayıtlar sentetik pilot verisidir, kurumsal veri değildir.';

create index if not exists villages_district_id_idx on public.villages (district_id);
create index if not exists villages_active_idx on public.villages (district_id, name) where is_active;

-- -----------------------------------------------------------------------------
-- 3. departments — birimler
-- -----------------------------------------------------------------------------
create table if not exists public.departments (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(btrim(name)) between 1 and 150),
  description  text check (description is null or char_length(description) <= 1000),
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint departments_name_key unique (name)
);

comment on table public.departments is 'Talepleri ele alan kurum birimleri.';

-- -----------------------------------------------------------------------------
-- 4. request_categories — talep kategorileri (her biri bir birime bağlı)
-- -----------------------------------------------------------------------------
create table if not exists public.request_categories (
  id             uuid primary key default gen_random_uuid(),
  department_id  uuid not null references public.departments (id) on delete restrict,
  name           text not null check (char_length(btrim(name)) between 1 and 150),
  slug           text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 100),
  description    text check (description is null or char_length(description) <= 1000),
  icon           text check (icon is null or char_length(icon) <= 50),
  color          text check (color is null or color ~ '^#[0-9A-Fa-f]{6}$'),
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint request_categories_slug_key unique (slug),
  constraint request_categories_department_name_key unique (department_id, name)
);

comment on table public.request_categories is 'Vatandaş talep kategorileri; her kategori sorumlu birime bağlıdır.';

create index if not exists request_categories_department_id_idx
  on public.request_categories (department_id);

-- -----------------------------------------------------------------------------
-- 5. updated_at tetikleyicileri (001'de tanımlı public.set_updated_at)
-- -----------------------------------------------------------------------------
drop trigger if exists districts_set_updated_at on public.districts;
create trigger districts_set_updated_at
  before update on public.districts
  for each row execute function public.set_updated_at();

drop trigger if exists villages_set_updated_at on public.villages;
create trigger villages_set_updated_at
  before update on public.villages
  for each row execute function public.set_updated_at();

drop trigger if exists departments_set_updated_at on public.departments;
create trigger departments_set_updated_at
  before update on public.departments
  for each row execute function public.set_updated_at();

drop trigger if exists request_categories_set_updated_at on public.request_categories;
create trigger request_categories_set_updated_at
  before update on public.request_categories
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 6. profiles: department_id ve village_id (nullable)
--    department_id: ileride birim yetkilileri ve saha personeli için.
--    village_id: vatandaş veya köy temsilcisi için.
--    Mevcut roller ve kimlik doğrulama davranışı DEĞİŞMEZ. İstemci bu
--    sütunları güncelleyemez (001'deki sütun bazlı UPDATE yetkisi yalnızca
--    full_name ve phone içindir).
-- -----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists department_id uuid references public.departments (id) on delete set null,
  add column if not exists village_id    uuid references public.villages (id)    on delete set null;

create index if not exists profiles_department_id_idx on public.profiles (department_id);
create index if not exists profiles_village_id_idx on public.profiles (village_id);

-- -----------------------------------------------------------------------------
-- 7. public.is_admin() — RLS politikaları için yeniden kullanılabilir kontrol
--    * security definer: fonksiyon sahibi olarak çalışır ve profiles'taki RLS'i
--      atlar; böylece politika içinden profiles okunurken özyineleme olmaz.
--    * auth.uid() kullanır; parametre almaz, dolayısıyla başka kullanıcının
--      yetkisi sorgulanamaz.
--    * search_path boş; tüm nesne adları şema ile yazılır.
--    * Yalnızca rolü admin VE hesabı aktif olan kullanıcı için true döner.
-- -----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
      and p.is_active
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- -----------------------------------------------------------------------------
-- 8. Row Level Security ve yetkiler
--    anon: hiçbir yetki yok. authenticated: tablo yetkisi var, ancak yazma
--    işlemleri RLS politikalarıyla yalnızca aktif adminlere açıktır.
-- -----------------------------------------------------------------------------
alter table public.districts          enable row level security;
alter table public.villages           enable row level security;
alter table public.departments        enable row level security;
alter table public.request_categories enable row level security;

revoke all on table public.districts          from anon, authenticated;
revoke all on table public.villages           from anon, authenticated;
revoke all on table public.departments        from anon, authenticated;
revoke all on table public.request_categories from anon, authenticated;

grant select, insert, update, delete on table public.districts          to authenticated;
grant select, insert, update, delete on table public.villages           to authenticated;
grant select, insert, update, delete on table public.departments        to authenticated;
grant select, insert, update, delete on table public.request_categories to authenticated;

-- Okuma: giriş yapmış herkes aktif kayıtları görür. Aktif adminler yönetim
-- ekranları için pasif kayıtları da görebilir.
-- Yazma: yalnızca aktif adminler (insert / update / delete).

-- districts
drop policy if exists "Aktif ilçeler okunabilir" on public.districts;
create policy "Aktif ilçeler okunabilir"
  on public.districts for select to authenticated
  using (is_active or (select public.is_admin()));

drop policy if exists "Adminler ilçe ekleyebilir" on public.districts;
create policy "Adminler ilçe ekleyebilir"
  on public.districts for insert to authenticated
  with check ((select public.is_admin()));

drop policy if exists "Adminler ilçe güncelleyebilir" on public.districts;
create policy "Adminler ilçe güncelleyebilir"
  on public.districts for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Adminler ilçe silebilir" on public.districts;
create policy "Adminler ilçe silebilir"
  on public.districts for delete to authenticated
  using ((select public.is_admin()));

-- villages
drop policy if exists "Aktif köyler okunabilir" on public.villages;
create policy "Aktif köyler okunabilir"
  on public.villages for select to authenticated
  using (is_active or (select public.is_admin()));

drop policy if exists "Adminler köy ekleyebilir" on public.villages;
create policy "Adminler köy ekleyebilir"
  on public.villages for insert to authenticated
  with check ((select public.is_admin()));

drop policy if exists "Adminler köy güncelleyebilir" on public.villages;
create policy "Adminler köy güncelleyebilir"
  on public.villages for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Adminler köy silebilir" on public.villages;
create policy "Adminler köy silebilir"
  on public.villages for delete to authenticated
  using ((select public.is_admin()));

-- departments
drop policy if exists "Aktif birimler okunabilir" on public.departments;
create policy "Aktif birimler okunabilir"
  on public.departments for select to authenticated
  using (is_active or (select public.is_admin()));

drop policy if exists "Adminler birim ekleyebilir" on public.departments;
create policy "Adminler birim ekleyebilir"
  on public.departments for insert to authenticated
  with check ((select public.is_admin()));

drop policy if exists "Adminler birim güncelleyebilir" on public.departments;
create policy "Adminler birim güncelleyebilir"
  on public.departments for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Adminler birim silebilir" on public.departments;
create policy "Adminler birim silebilir"
  on public.departments for delete to authenticated
  using ((select public.is_admin()));

-- request_categories
drop policy if exists "Aktif kategoriler okunabilir" on public.request_categories;
create policy "Aktif kategoriler okunabilir"
  on public.request_categories for select to authenticated
  using (is_active or (select public.is_admin()));

drop policy if exists "Adminler kategori ekleyebilir" on public.request_categories;
create policy "Adminler kategori ekleyebilir"
  on public.request_categories for insert to authenticated
  with check ((select public.is_admin()));

drop policy if exists "Adminler kategori güncelleyebilir" on public.request_categories;
create policy "Adminler kategori güncelleyebilir"
  on public.request_categories for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Adminler kategori silebilir" on public.request_categories;
create policy "Adminler kategori silebilir"
  on public.request_categories for delete to authenticated
  using ((select public.is_admin()));

-- -----------------------------------------------------------------------------
-- 9. Seed: Elazığ ilçeleri
-- -----------------------------------------------------------------------------
insert into public.districts (name) values
  ('Ağın'),
  ('Alacakaya'),
  ('Arıcak'),
  ('Baskil'),
  ('Karakoçan'),
  ('Keban'),
  ('Kovancılar'),
  ('Maden'),
  ('Merkez'),
  ('Palu'),
  ('Sivrice')
on conflict (name) do nothing;

-- -----------------------------------------------------------------------------
-- 10. Seed: birimler
-- -----------------------------------------------------------------------------
insert into public.departments (name, description) values
  ('Yol ve Ulaşım Hizmetleri', 'Köy yolları, yol onarımı ve kış hizmetleri.'),
  ('Su ve Kanal Hizmetleri',   'İçme suyu şebekesi, kanalizasyon ve altyapı arızaları.'),
  ('Tarımsal Hizmetler',       'Sulama kanalları ve tarımsal altyapı hizmetleri.'),
  ('Çevre ve Atık Yönetimi',   'Atık toplama, çevre kirliliği ve temizlik hizmetleri.'),
  ('İmar ve Yapı Kontrol',     'Kaçak ve riskli yapıların denetimi, imar işleri.')
on conflict (name) do nothing;

-- -----------------------------------------------------------------------------
-- 11. Seed: talep kategorileri (sorumlu birime ad üzerinden bağlanır)
-- -----------------------------------------------------------------------------
insert into public.request_categories (department_id, name, slug, description, icon, color)
select d.id, c.name, c.slug, c.description, c.icon, c.color
from (values
  ('Yol ve Ulaşım Hizmetleri', 'Yol hasarı',               'yol-hasari',
     'Köy yolunda çökme, çatlak veya bozulma.',               'road',           '#B45309'),
  ('Yol ve Ulaşım Hizmetleri', 'Çukur',                    'cukur',
     'Yolda araç ve yaya güvenliğini tehdit eden çukur.',     'circle-dashed',  '#92400E'),
  ('Yol ve Ulaşım Hizmetleri', 'Kar nedeniyle kapalı yol',  'kar-nedeniyle-kapali-yol',
     'Kar veya buzlanma nedeniyle ulaşıma kapalı yol.',       'snowflake',      '#0369A1'),
  ('Su ve Kanal Hizmetleri',   'İçme suyu kesintisi',       'icme-suyu-kesintisi',
     'Köyde içme suyunun kesilmesi veya basıncın düşmesi.',   'droplet-off',    '#0E7490'),
  ('Su ve Kanal Hizmetleri',   'Boru patlağı',              'boru-patlagi',
     'Su isale veya şebeke hattında patlak ya da sızıntı.',   'pipe',           '#1D4ED8'),
  ('Su ve Kanal Hizmetleri',   'Kanalizasyon taşması',      'kanalizasyon-tasmasi',
     'Kanalizasyon hattında tıkanma veya taşma.',             'waves',          '#6D28D9'),
  ('Tarımsal Hizmetler',       'Sulama kanalı sorunu',      'sulama-kanali-sorunu',
     'Sulama kanalında yıkılma, tıkanma veya su kaybı.',      'sprout',         '#15803D'),
  ('Çevre ve Atık Yönetimi',   'Atık ve çevre kirliliği',   'atik-ve-cevre-kirliligi',
     'Biriken atık, vahşi depolama veya çevre kirliliği.',    'trash',          '#4D7C0F'),
  ('İmar ve Yapı Kontrol',     'Kaçak veya riskli yapı',    'kacak-veya-riskli-yapi',
     'Ruhsatsız inşaat veya yıkılma riski taşıyan yapı.',     'building-warning','#B91C1C')
) as c (department_name, name, slug, description, icon, color)
join public.departments d on d.name = c.department_name
on conflict (slug) do nothing;

commit;
