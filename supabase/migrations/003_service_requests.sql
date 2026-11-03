-- =============================================================================
-- KırsalİZ — 003_service_requests
-- Vatandaş hizmet talepleri: talepler, durum geçmişi, fotoğraf ekleri,
-- RLS politikaları ve özel Storage bucket'ı (service-request-images).
--
-- ÖN KOŞUL: 001_profiles.sql ve 002_reference_data.sql çalıştırılmış olmalıdır
-- (profiles, user_role, public.set_updated_at(), public.is_admin(), districts,
-- villages, departments, request_categories burada kullanılır).
--
-- Supabase SQL Editor'da güvenle (tekrar) çalıştırılabilir: tablolar
-- "if not exists", fonksiyonlar "or replace", tetikleyiciler ve politikalar
-- "drop ... if exists" ile oluşturulur.
--
-- Güvenlik ilkesi: tarayıcıdan gelen ayrıcalıklı değerlere (citizen_id,
-- department_id, status, assigned_to, resolved_at, tracking_code) asla
-- güvenilmez. Bunlar hem sütun bazlı yetkilerle hem de tetikleyicilerle
-- veritabanı tarafında belirlenir.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. Enum'lar
-- -----------------------------------------------------------------------------
do $$
begin
  create type public.service_request_status as enum (
    'submitted',     -- Alındı
    'under_review',  -- İnceleniyor
    'assigned',      -- Atandı
    'in_progress',   -- İşlemde
    'resolved',      -- Çözüldü
    'rejected',      -- Reddedildi
    'cancelled'      -- İptal Edildi
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  -- Vatandaşın kendi değerlendirmesi olan aciliyet düzeyi (resmi öncelik değildir).
  create type public.request_urgency as enum ('low', 'normal', 'high');
exception
  when duplicate_object then null;
end
$$;

-- -----------------------------------------------------------------------------
-- 2. service_requests — hizmet talepleri
-- -----------------------------------------------------------------------------
create table if not exists public.service_requests (
  id             uuid primary key default gen_random_uuid(),
  tracking_code  text not null,
  -- restrict: kullanıcı silinse bile resmi talep kaydı sessizce yok olmasın.
  citizen_id     uuid not null references auth.users (id) on delete restrict,
  village_id     uuid not null references public.villages (id) on delete restrict,
  category_id    uuid not null references public.request_categories (id) on delete restrict,
  department_id  uuid not null references public.departments (id) on delete restrict,
  assigned_to    uuid references public.profiles (id) on delete set null,
  title          text not null,
  description    text not null,
  address        text,
  latitude       double precision,
  longitude      double precision,
  urgency        public.request_urgency not null default 'normal',
  status         public.service_request_status not null default 'submitted',
  resolved_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint service_requests_tracking_code_key unique (tracking_code),
  constraint service_requests_tracking_code_format_chk
    check (tracking_code ~ '^KIZ-[0-9]{8}-[0-9A-F]{8}$'),
  constraint service_requests_title_chk
    check (char_length(btrim(title)) between 5 and 120),
  constraint service_requests_description_chk
    check (char_length(btrim(description)) between 20 and 2000),
  constraint service_requests_address_chk
    check (address is null or char_length(address) <= 300),
  -- Enlem ve boylam ya birlikte dolu ya birlikte boş olmalı.
  constraint service_requests_coordinates_pair_chk
    check ((latitude is null) = (longitude is null)),
  constraint service_requests_latitude_chk
    check (latitude is null or latitude between -90 and 90),
  constraint service_requests_longitude_chk
    check (longitude is null or longitude between -180 and 180),
  -- Çözüm tarihi yalnızca "çözüldü" durumunda dolu olur.
  constraint service_requests_resolved_at_chk
    check ((status = 'resolved') = (resolved_at is not null))
);

comment on table public.service_requests is 'Vatandaşların oluşturduğu kırsal hizmet talepleri.';
comment on column public.service_requests.urgency is 'Vatandaşın kendi değerlendirmesi; resmi öncelik değildir.';

create index if not exists service_requests_citizen_created_idx
  on public.service_requests (citizen_id, created_at desc);
create index if not exists service_requests_village_id_idx on public.service_requests (village_id);
create index if not exists service_requests_category_id_idx on public.service_requests (category_id);
create index if not exists service_requests_department_id_idx on public.service_requests (department_id);
create index if not exists service_requests_assigned_to_idx
  on public.service_requests (assigned_to) where assigned_to is not null;
create index if not exists service_requests_status_idx on public.service_requests (status);
create index if not exists service_requests_created_at_idx on public.service_requests (created_at desc);

-- -----------------------------------------------------------------------------
-- 3. service_request_history — durum geçmişi
--    Kayıtlar yalnızca tetikleyicilerle (security definer) yazılır; istemcinin
--    doğrudan ekleme yetkisi yoktur. Personel ekranları eklendiğinde not
--    ekleme için ayrı bir politika/fonksiyon tanımlanabilir.
-- -----------------------------------------------------------------------------
create table if not exists public.service_request_history (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references public.service_requests (id) on delete cascade,
  status      public.service_request_status not null,
  note        text check (note is null or char_length(note) <= 1000),
  changed_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

comment on table public.service_request_history is 'Talebin durum değişikliği geçmişi (zaman çizelgesi).';

create index if not exists service_request_history_request_idx
  on public.service_request_history (request_id, created_at);
create index if not exists service_request_history_changed_by_idx
  on public.service_request_history (changed_by) where changed_by is not null;

-- -----------------------------------------------------------------------------
-- 4. service_request_attachments — fotoğraf ekleri
--    storage_path yapısı: {owner_id}/{request_id}/{dosya_adi}
-- -----------------------------------------------------------------------------
create table if not exists public.service_request_attachments (
  id             uuid primary key default gen_random_uuid(),
  request_id     uuid not null references public.service_requests (id) on delete cascade,
  owner_id       uuid not null references auth.users (id) on delete restrict,
  storage_path   text not null,
  original_name  text not null check (char_length(original_name) between 1 and 255),
  mime_type      text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  file_size      integer not null check (file_size > 0 and file_size <= 5242880),
  created_at     timestamptz not null default now(),
  constraint service_request_attachments_storage_path_key unique (storage_path),
  -- Dosya yolu, sahibi ve talebiyle tutarlı olmalı.
  constraint service_request_attachments_path_chk
    check (storage_path like owner_id::text || '/' || request_id::text || '/%')
);

comment on table public.service_request_attachments is 'Talebe eklenen fotoğraflar (özel Storage bucket kayıtları).';

create index if not exists service_request_attachments_request_idx
  on public.service_request_attachments (request_id);
create index if not exists service_request_attachments_owner_idx
  on public.service_request_attachments (owner_id);

-- -----------------------------------------------------------------------------
-- 5. Yardımcı fonksiyonlar
--    security definer fonksiyonlar: search_path boş, nesneler şema ile yazılı,
--    yetkiler daraltılmış. Hiçbiri rol/yetki değiştirmez; yalnızca okur.
-- -----------------------------------------------------------------------------

-- Metni güvenle uuid'e çevirir; geçersizse null döner (storage yollarında
-- hatalı bir cast sorguyu çökertmesin diye).
create or replace function public.try_uuid(p_text text)
returns uuid
language sql
immutable
parallel safe
set search_path = ''
as $$
  select case
    when p_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then p_text::uuid
    else null
  end;
$$;

-- Oturumdaki kullanıcının hesabı aktif mi?
create or replace function public.is_active_user()
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
      and p.is_active
  );
$$;

-- Oturumdaki kullanıcı, verilen birimin aktif birim yetkilisi mi?
create or replace function public.is_department_officer(p_department_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_department_id is not null
    and exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'department_officer'
        and p.is_active
        and p.department_id = p_department_id
    );
$$;

-- Talep, oturumdaki vatandaşa mı ait?
create or replace function public.owns_request(p_request_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_request_id is not null
    and exists (
      select 1
      from public.service_requests r
      where r.id = p_request_id
        and r.citizen_id = (select auth.uid())
    );
$$;

-- Talep, oturumdaki aktif saha personeline mi atanmış?
-- Rol şu anda 'field_personnel' olmalı ve personelin birimi talebin birimiyle
-- eşleşmelidir (rol/birim sonradan değişirse erişim otomatik kapanır).
create or replace function public.is_assigned_field_personnel(p_request_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and p_request_id is not null
    and exists (
      select 1
      from public.service_requests r
      join public.profiles p on p.id = r.assigned_to
      where r.id = p_request_id
        and p.id = (select auth.uid())
        and p.is_active
        and p.role = 'field_personnel'
        and p.department_id is not null
        and p.department_id = r.department_id
    );
$$;

-- Oturumdaki kullanıcı talebi görebilir mi?
-- (sahibi vatandaş, admin, talebin biriminin yetkilisi veya atanan saha personeli)
create or replace function public.can_access_request(p_request_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_request_id is not null
    and exists (
      select 1
      from public.service_requests r
      where r.id = p_request_id
        and (
          r.citizen_id = (select auth.uid())
          or public.is_admin()
          or public.is_department_officer(r.department_id)
          or public.is_assigned_field_personnel(r.id)
        )
    );
$$;

revoke all on function public.try_uuid(text)                 from public, anon;
revoke all on function public.is_active_user()               from public, anon;
revoke all on function public.is_department_officer(uuid)    from public, anon;
revoke all on function public.owns_request(uuid)             from public, anon;
revoke all on function public.can_access_request(uuid)       from public, anon;
revoke all on function public.is_assigned_field_personnel(uuid) from public, anon;

grant execute on function public.try_uuid(text)              to authenticated;
grant execute on function public.is_active_user()            to authenticated;
grant execute on function public.is_department_officer(uuid) to authenticated;
grant execute on function public.owns_request(uuid)          to authenticated;
grant execute on function public.can_access_request(uuid)    to authenticated;
grant execute on function public.is_assigned_field_personnel(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- 6. Tetikleyiciler
-- -----------------------------------------------------------------------------

-- 6.1 INSERT öncesi: ayrıcalıklı alanları sunucu tarafında belirle ve doğrula.
create or replace function public.service_requests_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid         uuid := (select auth.uid());
  v_department  uuid;
  v_category_ok boolean;
  v_village_ok  boolean;
  v_code        text;
  v_attempt     integer := 0;
begin
  if v_uid is null then
    raise exception 'Talep oluşturmak için oturum açmalısınız.' using errcode = '42501';
  end if;

  if not public.is_active_user() then
    raise exception 'Hesabınız talep oluşturmaya uygun değil.' using errcode = '42501';
  end if;

  -- Kategori ve sorumlu birim (birim, kategoriden alınır; istemciden değil).
  select c.department_id, (c.is_active and d.is_active)
    into v_department, v_category_ok
  from public.request_categories c
  join public.departments d on d.id = c.department_id
  where c.id = new.category_id;

  if v_department is null or not v_category_ok then
    raise exception 'Geçersiz veya pasif talep kategorisi.' using errcode = '23514';
  end if;

  -- Köy ve bağlı olduğu ilçe aktif olmalı.
  select (v.is_active and di.is_active)
    into v_village_ok
  from public.villages v
  join public.districts di on di.id = v.district_id
  where v.id = new.village_id;

  if v_village_ok is not true then
    raise exception 'Geçersiz veya pasif köy/ilçe.' using errcode = '23514';
  end if;

  -- Ayrıcalıklı alanları zorla.
  new.id            := gen_random_uuid();
  new.citizen_id    := v_uid;
  new.department_id := v_department;
  new.status        := 'submitted';
  new.assigned_to   := null;
  new.resolved_at   := null;
  new.created_at    := now();
  new.updated_at    := now();

  -- Metin alanlarını temizle.
  new.title       := btrim(new.title);
  new.description := btrim(new.description);
  new.address     := nullif(btrim(new.address), '');

  -- Okunabilir, benzersiz takip kodu: KIZ-YYYYMMDD-XXXXXXXX
  loop
    v_code := 'KIZ-'
      || to_char(now() at time zone 'Europe/Istanbul', 'YYYYMMDD')
      || '-'
      || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (
      select 1 from public.service_requests r where r.tracking_code = v_code
    );
    v_attempt := v_attempt + 1;
    if v_attempt > 10 then
      raise exception 'Takip kodu üretilemedi, lütfen tekrar deneyin.';
    end if;
  end loop;
  new.tracking_code := v_code;

  return new;
end;
$$;

-- 6.2 INSERT sonrası: ilk geçmiş kaydı.
create or replace function public.service_requests_after_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.service_request_history (request_id, status, note, changed_by)
  values (new.id, new.status, 'Talep alındı.', new.citizen_id);
  return new;
end;
$$;

-- 6.3 UPDATE öncesi: değişmez alanları koru, çözüm tarihini yönet, atamayı doğrula.
create or replace function public.service_requests_before_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Oturumlu istemciler (auth.uid() dolu) bu alanları hiçbir koşulda değiştiremez
  -- (sütun yetkileri zaten engeller; bu ikinci savunma katmanıdır). Fonksiyon
  -- security definer olduğundan current_user yerine auth.uid() kullanılır;
  -- SQL Editor / service_role bakım işlemleri etkilenmez.
  if (select auth.uid()) is not null then
    if new.id            is distinct from old.id
       or new.tracking_code is distinct from old.tracking_code
       or new.citizen_id    is distinct from old.citizen_id
       or new.village_id    is distinct from old.village_id
       or new.category_id   is distinct from old.category_id
       or new.department_id is distinct from old.department_id
       or new.created_at    is distinct from old.created_at then
      raise exception 'Bu alanlar değiştirilemez.' using errcode = '42501';
    end if;
  end if;

  -- resolved_at yalnızca durum değişiminde sunucu tarafından yönetilir.
  if new.status is distinct from old.status then
    new.resolved_at := case when new.status = 'resolved' then now() else null end;
  else
    new.resolved_at := old.resolved_at;
  end if;

  -- Atanan kişi: aynı birimdeki aktif saha personeli olmalı.
  if new.assigned_to is not null
     and new.assigned_to is distinct from old.assigned_to
     and not exists (
       select 1
       from public.profiles p
       where p.id = new.assigned_to
         and p.is_active
         and p.role = 'field_personnel'
         and p.department_id = new.department_id
     ) then
    raise exception 'Atanan kişi, talebin biriminde görevli aktif saha personeli olmalıdır.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

-- 6.4 UPDATE sonrası: durum değiştiyse geçmişe yaz.
create or replace function public.service_requests_after_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    insert into public.service_request_history (request_id, status, changed_by)
    values (new.id, new.status, (select auth.uid()));
  end if;
  return new;
end;
$$;

-- 6.5 Ek eklenmeden önce: talep başına en fazla 3 fotoğraf.
create or replace function public.service_request_attachments_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'Fotoğraf eklemek için oturum açmalısınız.' using errcode = '42501';
  end if;

  -- Yalnızca talebin sahibi ek ekleyebilir.
  if not exists (
    select 1
    from public.service_requests r
    where r.id = new.request_id
      and r.citizen_id = v_uid
  ) then
    raise exception 'Bu talebe fotoğraf ekleme yetkiniz yok.' using errcode = '42501';
  end if;

  -- owner_id tarayıcıdan gelen değere güvenilmeden sunucuda belirlenir.
  new.owner_id := v_uid;

  -- Dosya yolu {user_id}/{request_id}/ ile başlamalı.
  if new.storage_path is null
     or left(new.storage_path, char_length(v_uid::text || '/' || new.request_id::text || '/'))
        is distinct from (v_uid::text || '/' || new.request_id::text || '/') then
    raise exception 'Geçersiz dosya yolu.' using errcode = '23514';
  end if;

  if (
    select count(*)
    from public.service_request_attachments a
    where a.request_id = new.request_id
  ) >= 3 then
    raise exception 'Bir talebe en fazla 3 fotoğraf eklenebilir.' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function public.service_requests_before_insert()            from public, anon, authenticated;
revoke all on function public.service_requests_after_insert()             from public, anon, authenticated;
revoke all on function public.service_requests_before_update()            from public, anon, authenticated;
revoke all on function public.service_requests_after_update()             from public, anon, authenticated;
revoke all on function public.service_request_attachments_before_insert() from public, anon, authenticated;

drop trigger if exists service_requests_a_before_insert on public.service_requests;
create trigger service_requests_a_before_insert
  before insert on public.service_requests
  for each row execute function public.service_requests_before_insert();

drop trigger if exists service_requests_z_after_insert on public.service_requests;
create trigger service_requests_z_after_insert
  after insert on public.service_requests
  for each row execute function public.service_requests_after_insert();

drop trigger if exists service_requests_a_before_update on public.service_requests;
create trigger service_requests_a_before_update
  before update on public.service_requests
  for each row execute function public.service_requests_before_update();

drop trigger if exists service_requests_set_updated_at on public.service_requests;
create trigger service_requests_set_updated_at
  before update on public.service_requests
  for each row execute function public.set_updated_at();

drop trigger if exists service_requests_z_after_update on public.service_requests;
create trigger service_requests_z_after_update
  after update on public.service_requests
  for each row execute function public.service_requests_after_update();

drop trigger if exists service_request_attachments_a_before_insert on public.service_request_attachments;
create trigger service_request_attachments_a_before_insert
  before insert on public.service_request_attachments
  for each row execute function public.service_request_attachments_before_insert();

-- -----------------------------------------------------------------------------
-- 7. Tablo yetkileri ve Row Level Security
--    anon: hiçbir yetki yok.
--    authenticated: yalnızca gereken sütun/işlem yetkileri; asıl kısıtlama RLS ile.
-- -----------------------------------------------------------------------------
alter table public.service_requests            enable row level security;
alter table public.service_request_history     enable row level security;
alter table public.service_request_attachments enable row level security;

revoke all on table public.service_requests            from anon, authenticated;
revoke all on table public.service_request_history     from anon, authenticated;
revoke all on table public.service_request_attachments from anon, authenticated;

grant select on table public.service_requests to authenticated;
-- Vatandaş yalnızca içerik alanlarını gönderebilir; citizen_id, department_id,
-- status, assigned_to, resolved_at ve tracking_code için INSERT yetkisi yoktur.
grant insert (village_id, category_id, title, description, address, latitude, longitude, urgency)
  on table public.service_requests to authenticated;
-- Güncelleme yalnızca durum ve atama için (RLS ile admin / birim yetkilisine açık).
grant update (status, assigned_to) on table public.service_requests to authenticated;

grant select on table public.service_request_history to authenticated;

grant select on table public.service_request_attachments to authenticated;
-- owner_id istemciden alınmaz; tetikleyici auth.uid() ile doldurur.
grant insert (request_id, storage_path, original_name, mime_type, file_size)
  on table public.service_request_attachments to authenticated;

-- 7.1 service_requests politikaları
drop policy if exists "Talepler görüntülenebilir" on public.service_requests;
create policy "Talepler görüntülenebilir"
  on public.service_requests for select to authenticated
  using (
    citizen_id = (select auth.uid())
    or (select public.is_admin())
    or (select public.is_department_officer(department_id))
    or (select public.is_assigned_field_personnel(id))
  );

drop policy if exists "Vatandaşlar kendi adlarına talep oluşturabilir" on public.service_requests;
create policy "Vatandaşlar kendi adlarına talep oluşturabilir"
  on public.service_requests for insert to authenticated
  with check (citizen_id = (select auth.uid()));

drop policy if exists "Admin ve birim yetkilileri talepleri güncelleyebilir" on public.service_requests;
create policy "Admin ve birim yetkilileri talepleri güncelleyebilir"
  on public.service_requests for update to authenticated
  using (
    (select public.is_admin())
    or (select public.is_department_officer(department_id))
  )
  with check (
    (select public.is_admin())
    or (select public.is_department_officer(department_id))
  );

-- 7.2 service_request_history politikaları (yalnızca okuma)
drop policy if exists "Talep geçmişi görüntülenebilir" on public.service_request_history;
create policy "Talep geçmişi görüntülenebilir"
  on public.service_request_history for select to authenticated
  using ((select public.can_access_request(request_id)));

-- 7.3 service_request_attachments politikaları
-- (WITH CHECK, BEFORE tetikleyicisinden sonra değerlendirilir; owner_id nihai değerdir.)
drop policy if exists "Talep ekleri görüntülenebilir" on public.service_request_attachments;
create policy "Talep ekleri görüntülenebilir"
  on public.service_request_attachments for select to authenticated
  using ((select public.can_access_request(request_id)));

drop policy if exists "Vatandaşlar kendi taleplerine ek ekleyebilir" on public.service_request_attachments;
create policy "Vatandaşlar kendi taleplerine ek ekleyebilir"
  on public.service_request_attachments for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and (select public.owns_request(request_id))
  );

-- -----------------------------------------------------------------------------
-- 8. Storage: özel bucket ve storage.objects politikaları
--    Yol yapısı: {user_id}/{request_id}/{benzersiz_dosya_adi}
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'service-request-images',
  'service-request-images',
  false,
  5242880,  -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Yükleme: yalnızca kendi klasörüne ve kendi talebinin klasörüne.
drop policy if exists "Talep görselleri: kendi klasörüne yükleme" on storage.objects;
create policy "Talep görselleri: kendi klasörüne yükleme"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'service-request-images'
    and coalesce(array_length(storage.foldername(name), 1), 0) = 2
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.owns_request(public.try_uuid((storage.foldername(name))[2])))
  );

-- Okuma: kendi klasörü; admin, birim yetkilisi ve atanan saha personeli ise
-- talebe erişim yetkisi üzerinden. try_uuid geçersiz yollarda null döner.
drop policy if exists "Talep görselleri: okuma" on storage.objects;
create policy "Talep görselleri: okuma"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'service-request-images'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select public.can_access_request(public.try_uuid((storage.foldername(name))[2])))
    )
  );

-- Silme: yalnızca kendi klasöründeki dosyalar.
drop policy if exists "Talep görselleri: kendi dosyasını silme" on storage.objects;
create policy "Talep görselleri: kendi dosyasını silme"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'service-request-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

commit;
