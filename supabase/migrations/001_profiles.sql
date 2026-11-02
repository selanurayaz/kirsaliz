-- =============================================================================
-- KırsalİZ — 001_profiles
-- Kullanıcı rolleri ve auth.users ile birebir bağlı profiles tablosu.
--
-- Supabase SQL Editor'da güvenle (tekrar) çalıştırılabilir: tüm nesneler
-- "if not exists" / "or replace" / "drop ... if exists" ile oluşturulur.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. Rol enum'u
-- -----------------------------------------------------------------------------
do $$
begin
  create type public.user_role as enum (
    'citizen',
    'department_officer',
    'field_personnel',
    'admin'
  );
exception
  when duplicate_object then null;
end
$$;

-- -----------------------------------------------------------------------------
-- 2. profiles tablosu (auth.users ile 1:1)
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text check (full_name is null or char_length(full_name) <= 200),
  role        public.user_role not null default 'citizen',
  phone       text check (phone is null or char_length(phone) <= 32),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is 'Her auth kullanıcısı için uygulama profili (rol, ad soyad, telefon).';

create index if not exists profiles_role_idx on public.profiles (role);

-- -----------------------------------------------------------------------------
-- 3. updated_at otomatik güncelleme
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 4. Yetkili alanların (role, is_active, id, created_at) korunması
--    İstemci (anon / authenticated) bu alanları değiştiremez. Yalnızca
--    service_role veya veritabanı sahibi (SQL Editor) değiştirebilir.
-- -----------------------------------------------------------------------------
create or replace function public.protect_profile_privileged_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if new.role is distinct from old.role then
      raise exception 'Rol değiştirme yetkiniz yok.' using errcode = '42501';
    end if;
    if new.is_active is distinct from old.is_active then
      raise exception 'Hesap durumu değiştirme yetkiniz yok.' using errcode = '42501';
    end if;
    if new.id is distinct from old.id or new.created_at is distinct from old.created_at then
      raise exception 'Bu alanlar değiştirilemez.' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_privileged_columns on public.profiles;
create trigger profiles_protect_privileged_columns
  before update on public.profiles
  for each row execute function public.protect_profile_privileged_columns();

-- -----------------------------------------------------------------------------
-- 5. Yeni auth kullanıcısı için otomatik profil oluşturma
--    security definer: auth şemasındaki tetikleyiciden public.profiles'a
--    yazabilmek için. search_path boş tutulur ve tüm adlar şema ile yazılır.
--    Rol ASLA kullanıcı metadata'sından okunmaz; her zaman 'citizen'dır.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    left(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), 200),
    left(nullif(btrim(new.raw_user_meta_data ->> 'phone'), ''), 32)
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 6. Mevcut kullanıcılar için profil oluştur (geri doldurma)
-- -----------------------------------------------------------------------------
insert into public.profiles (id, full_name, phone)
select
  u.id,
  left(nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''), 200),
  left(nullif(btrim(u.raw_user_meta_data ->> 'phone'), ''), 32)
from auth.users u
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- 7. Row Level Security ve yetkiler
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;

-- Tablo düzeyinde yetkiler: anon hiçbir şey yapamaz; authenticated yalnızca
-- okuyabilir ve sadece full_name / phone sütunlarını güncelleyebilir.
-- Profil ekleme yalnızca tetikleyici üzerinden, silme ise auth.users silinince
-- (cascade) gerçekleşir.
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (full_name, phone) on table public.profiles to authenticated;

drop policy if exists "Kullanıcılar kendi profilini okuyabilir" on public.profiles;
create policy "Kullanıcılar kendi profilini okuyabilir"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Kullanıcılar kendi profilini güncelleyebilir" on public.profiles;
create policy "Kullanıcılar kendi profilini güncelleyebilir"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

commit;
