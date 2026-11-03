-- =============================================================================
-- KırsalİZ — 004_staff_workflow
-- Kurum iş akışı: admin, birim yetkilisi ve saha personeli için güvenli RPC
-- fonksiyonları, durum geçiş kuralları, geçmiş notları ve admin kullanıcı/rol
-- yönetimi (erişim denetim kaydı ile).
--
-- ÖN KOŞUL: 001, 002 ve 003 çalıştırılmış olmalıdır.
--
-- Supabase SQL Editor'da güvenle (tekrar) çalıştırılabilir: tablolar
-- "if not exists", fonksiyonlar "or replace", politikalar "drop ... if exists".
--
-- Temel ilke: service_requests üzerinde istemciye doğrudan UPDATE yetkisi
-- YOKTUR. Tüm durum/atama değişiklikleri aşağıdaki security definer RPC
-- fonksiyonlarından geçer. Yetki; auth.uid() ve profiles tablosundaki rol,
-- birim ve aktiflik bilgisinden sunucuda belirlenir — tarayıcıdan gelen hiçbir
-- rol/birim bilgisine güvenilmez.
--
-- Hata kodları: Kullanıcıya gösterilmesi güvenli, Türkçe iş kuralı hataları
-- 'KZ' ile başlayan özel SQLSTATE kodlarıyla fırlatılır (KZ001 geçersiz işlem,
-- KZ401 oturum yok, KZ403 yetkisiz, KZ404 bulunamadı/yetkisiz). Arayüz yalnızca
-- bu kodlu hataların mesajını gösterir; diğer hatalar genel mesaja çevrilir.
--
-- İLK ADMİN: Bu dosya kimseyi otomatik admin yapmaz. İlk admin için README /
-- teslim notundaki tek seferlik SQL şablonunu elle çalıştırın.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. Erişim denetim kaydı: profile_access_history
--    Yalnızca admin RPC'si yazar; yalnızca aktif adminler okuyabilir.
-- -----------------------------------------------------------------------------
create table if not exists public.profile_access_history (
  id                 uuid primary key default gen_random_uuid(),
  target_user_id     uuid references auth.users (id) on delete set null,
  changed_by         uuid references auth.users (id) on delete set null,
  old_role           public.user_role not null,
  new_role           public.user_role not null,
  old_department_id  uuid references public.departments (id) on delete set null,
  new_department_id  uuid references public.departments (id) on delete set null,
  old_is_active      boolean not null,
  new_is_active      boolean not null,
  created_at         timestamptz not null default now()
);

comment on table public.profile_access_history is 'Kullanıcı rol/birim/aktiflik değişikliklerinin denetim kaydı (yalnızca admin RPC yazar).';

create index if not exists profile_access_history_target_idx
  on public.profile_access_history (target_user_id, created_at desc);
create index if not exists profile_access_history_created_idx
  on public.profile_access_history (created_at desc);

alter table public.profile_access_history enable row level security;

revoke all on table public.profile_access_history from anon, authenticated;
grant select on table public.profile_access_history to authenticated;

drop policy if exists "Adminler erişim geçmişini okuyabilir" on public.profile_access_history;
create policy "Adminler erişim geçmişini okuyabilir"
  on public.profile_access_history for select to authenticated
  using ((select public.is_admin()));

-- -----------------------------------------------------------------------------
-- 2. service_requests üzerindeki doğrudan UPDATE yetkisini kaldır
--    (003'teki sütun yetkisi ve geniş UPDATE politikası). SELECT/INSERT aynen kalır.
-- -----------------------------------------------------------------------------
revoke update on table public.service_requests from anon, authenticated;
revoke update (status, assigned_to) on table public.service_requests from anon, authenticated;

drop policy if exists "Admin ve birim yetkilileri talepleri güncelleyebilir" on public.service_requests;

-- -----------------------------------------------------------------------------
-- 3. İç yardımcı fonksiyonlar (istemciye açık DEĞİL; yalnızca diğer
--    security definer fonksiyonlar tarafından çağrılır)
-- -----------------------------------------------------------------------------

-- Oturumdaki kullanıcının kimliği, rolü ve birimi. Oturum yoksa veya hesap
-- pasifse hata fırlatır.
create or replace function public.workflow_actor(
  out o_id uuid,
  out o_role public.user_role,
  out o_department_id uuid
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  o_id := (select auth.uid());
  if o_id is null then
    raise exception 'Bu işlem için oturum açmalısınız.' using errcode = 'KZ401';
  end if;

  select p.role, p.department_id
    into o_role, o_department_id
  from public.profiles p
  where p.id = o_id and p.is_active;

  if not found then
    raise exception 'Hesabınız pasif durumda veya profiliniz bulunamadı.' using errcode = 'KZ403';
  end if;
end;
$$;

-- Admin ya da talebin biriminin yetkilisi mi? (rol ve birim sunucuda okunmuş olmalı)
create or replace function public.workflow_can_manage(
  p_role public.user_role,
  p_actor_department_id uuid,
  p_request_department_id uuid
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_role = 'admin'
      or (p_role = 'department_officer'
          and p_actor_department_id is not null
          and p_actor_department_id = p_request_department_id);
$$;

-- Not temizleme/doğrulama: kırpar, uzunluğu denetler, boşsa null döner.
create or replace function public.workflow_clean_note(p_note text, p_required boolean)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
begin
  if p_required and (v_note is null or char_length(v_note) < 10) then
    raise exception 'Lütfen en az 10 karakterlik anlamlı bir açıklama yazın.' using errcode = 'KZ001';
  end if;
  if v_note is not null and char_length(v_note) > 600 then
    raise exception 'Açıklama en fazla 600 karakter olabilir.' using errcode = 'KZ001';
  end if;
  return v_note;
end;
$$;

-- Durum/atama değişikliğini uygular. Geçmiş notu, yalnızca bu işlem boyunca
-- geçerli (transaction-local) ayarlarla tetikleyiciye iletilir; ayarlar talep
-- kimliğiyle eşleşmedikçe tetikleyici tarafından kullanılmaz ve işlem sonunda
-- temizlenir. Bu fonksiyon istemciye açık değildir.
create or replace function public.workflow_apply(
  p_request_id uuid,
  p_status public.service_request_status,
  p_assigned_to uuid,
  p_note text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform set_config('kirsaliz.history_request_id', p_request_id::text, true);
  perform set_config('kirsaliz.history_note', coalesce(p_note, ''), true);

  update public.service_requests r
     set status = p_status,
         assigned_to = p_assigned_to
   where r.id = p_request_id;

  perform set_config('kirsaliz.history_request_id', '', true);
  perform set_config('kirsaliz.history_note', '', true);
end;
$$;

revoke all on function public.workflow_actor()                                   from public, anon, authenticated;
revoke all on function public.workflow_can_manage(public.user_role, uuid, uuid)  from public, anon, authenticated;
revoke all on function public.workflow_clean_note(text, boolean)                 from public, anon, authenticated;
revoke all on function public.workflow_apply(uuid, public.service_request_status, uuid, text)
  from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 4. Tetikleyiciler: geçerli durum geçişleri ve geçmiş notu
-- -----------------------------------------------------------------------------

-- 4.1 UPDATE öncesi (003'ün genişletilmiş hali): değişmez alanlar, çözüm tarihi,
--     atama doğrulaması ve DURUM GEÇİŞ MATRİSİ.
create or replace function public.service_requests_before_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Oturumlu istemciler değişmez alanları hiçbir koşulda değiştiremez.
  -- (SQL Editor / service_role bakım işlemleri auth.uid() null olduğundan etkilenmez.)
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

    -- Geçerli durum geçişleri (aynı duruma "geçiş" sayılmaz).
    if new.status is distinct from old.status
       and not (
         (old.status = 'submitted'    and new.status in ('under_review', 'assigned', 'rejected', 'cancelled'))
      or (old.status = 'under_review' and new.status in ('assigned', 'rejected', 'cancelled'))
      or (old.status = 'assigned'     and new.status in ('in_progress', 'rejected'))
      or (old.status = 'in_progress'  and new.status in ('resolved', 'rejected', 'assigned'))
       ) then
      raise exception 'Talebin mevcut durumundan istenen duruma geçiş yapılamaz.' using errcode = 'KZ001';
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
      using errcode = 'KZ001';
  end if;

  return new;
end;
$$;

-- 4.2 UPDATE sonrası: durum VEYA atama değiştiyse TEK bir geçmiş satırı yaz.
--     Not, yalnızca workflow_apply'ın bu talep için ayarladığı işlem-yerel
--     değerden okunur; changed_by her zaman auth.uid()'dir (sahte olamaz).
create or replace function public.service_requests_after_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_note text;
begin
  if new.status is distinct from old.status
     or (new.assigned_to is distinct from old.assigned_to and new.assigned_to is not null) then

    if nullif(current_setting('kirsaliz.history_request_id', true), '') = new.id::text then
      v_note := nullif(current_setting('kirsaliz.history_note', true), '');
    end if;

    insert into public.service_request_history (request_id, status, note, changed_by)
    values (new.id, new.status, left(v_note, 1000), (select auth.uid()));
  end if;
  return new;
end;
$$;

-- (Tetikleyici bağlantıları 003'te kurulmuştur; fonksiyon gövdeleri yukarıda değiştirildi.)
revoke all on function public.service_requests_before_update() from public, anon, authenticated;
revoke all on function public.service_requests_after_update()  from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 5. Talep iş akışı RPC'leri
-- -----------------------------------------------------------------------------

-- 5.1 İncelemeye al: submitted -> under_review (admin / birim yetkilisi)
create or replace function public.review_service_request(p_request_id uuid, p_note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid  uuid;
  v_role public.user_role;
  v_dept uuid;
  v_req  public.service_requests%rowtype;
  v_note text := public.workflow_clean_note(p_note, false);
begin
  select a.o_id, a.o_role, a.o_department_id into v_uid, v_role, v_dept from public.workflow_actor() a;

  select * into v_req from public.service_requests r where r.id = p_request_id for update;
  if not found or not public.workflow_can_manage(v_role, v_dept, v_req.department_id) then
    raise exception 'Talep bulunamadı veya bu işlem için yetkiniz yok.' using errcode = 'KZ404';
  end if;

  if v_req.status <> 'submitted' then
    raise exception 'Yalnızca "Alındı" durumundaki talepler incelemeye alınabilir.' using errcode = 'KZ001';
  end if;

  perform public.workflow_apply(
    v_req.id, 'under_review', v_req.assigned_to,
    'Talep incelemeye alındı.' || coalesce(' ' || v_note, '')
  );
end;
$$;

-- 5.2 Ata / yeniden ata (admin / birim yetkilisi) -> status = assigned
create or replace function public.assign_service_request(
  p_request_id uuid,
  p_field_personnel_id uuid,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid    uuid;
  v_role   public.user_role;
  v_dept   uuid;
  v_req    public.service_requests%rowtype;
  v_target public.profiles%rowtype;
  v_note   text := public.workflow_clean_note(p_note, false);
begin
  select a.o_id, a.o_role, a.o_department_id into v_uid, v_role, v_dept from public.workflow_actor() a;

  select * into v_req from public.service_requests r where r.id = p_request_id for update;
  if not found or not public.workflow_can_manage(v_role, v_dept, v_req.department_id) then
    raise exception 'Talep bulunamadı veya bu işlem için yetkiniz yok.' using errcode = 'KZ404';
  end if;

  if v_req.status not in ('submitted', 'under_review', 'assigned', 'in_progress') then
    raise exception 'Bu durumdaki talep için atama yapılamaz.' using errcode = 'KZ001';
  end if;

  select * into v_target from public.profiles p where p.id = p_field_personnel_id;
  if not found
     or not v_target.is_active
     or v_target.role <> 'field_personnel'
     or v_target.department_id is distinct from v_req.department_id then
    raise exception 'Seçilen kişi bu birimde görevli aktif bir saha personeli değil.' using errcode = 'KZ001';
  end if;

  if v_req.assigned_to is not distinct from v_target.id then
    raise exception 'Talep zaten bu personele atanmış.' using errcode = 'KZ001';
  end if;

  perform public.workflow_apply(
    v_req.id, 'assigned', v_target.id,
    case when v_req.assigned_to is null
      then 'Talep saha personeline atandı: '
      else 'Talep yeniden atandı: '
    end || coalesce(v_target.full_name, 'Adsız personel') || '.' || coalesce(' ' || v_note, '')
  );
end;
$$;

-- 5.3 Çalışmaya başla: assigned -> in_progress (yalnızca atanan saha personeli)
create or replace function public.start_service_request(p_request_id uuid, p_note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid  uuid;
  v_role public.user_role;
  v_dept uuid;
  v_req  public.service_requests%rowtype;
  v_note text := public.workflow_clean_note(p_note, false);
begin
  select a.o_id, a.o_role, a.o_department_id into v_uid, v_role, v_dept from public.workflow_actor() a;

  select * into v_req from public.service_requests r where r.id = p_request_id for update;
  if not found
     or v_role <> 'field_personnel'
     or v_req.assigned_to is distinct from v_uid
     or v_dept is distinct from v_req.department_id then
    raise exception 'Talep bulunamadı veya bu işlem için yetkiniz yok.' using errcode = 'KZ404';
  end if;

  if v_req.status <> 'assigned' then
    raise exception 'Yalnızca "Atandı" durumundaki işe başlanabilir.' using errcode = 'KZ001';
  end if;

  perform public.workflow_apply(
    v_req.id, 'in_progress', v_req.assigned_to,
    'Çalışmaya başlandı.' || coalesce(' ' || v_note, '')
  );
end;
$$;

-- 5.4 Çözüldü: in_progress -> resolved (yalnızca atanan saha personeli, açıklama zorunlu)
create or replace function public.resolve_service_request(p_request_id uuid, p_note text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid  uuid;
  v_role public.user_role;
  v_dept uuid;
  v_req  public.service_requests%rowtype;
  v_note text := public.workflow_clean_note(p_note, true);
begin
  select a.o_id, a.o_role, a.o_department_id into v_uid, v_role, v_dept from public.workflow_actor() a;

  select * into v_req from public.service_requests r where r.id = p_request_id for update;
  if not found
     or v_role <> 'field_personnel'
     or v_req.assigned_to is distinct from v_uid
     or v_dept is distinct from v_req.department_id then
    raise exception 'Talep bulunamadı veya bu işlem için yetkiniz yok.' using errcode = 'KZ404';
  end if;

  if v_req.status <> 'in_progress' then
    raise exception 'Yalnızca "İşlemde" durumundaki talep çözüldü olarak işaretlenebilir.' using errcode = 'KZ001';
  end if;

  perform public.workflow_apply(v_req.id, 'resolved', v_req.assigned_to, 'Talep çözüldü: ' || v_note);
end;
$$;

-- 5.5 Reddet (admin / birim yetkilisi, açıklama zorunlu)
create or replace function public.reject_service_request(p_request_id uuid, p_note text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid  uuid;
  v_role public.user_role;
  v_dept uuid;
  v_req  public.service_requests%rowtype;
  v_note text := public.workflow_clean_note(p_note, true);
begin
  select a.o_id, a.o_role, a.o_department_id into v_uid, v_role, v_dept from public.workflow_actor() a;

  select * into v_req from public.service_requests r where r.id = p_request_id for update;
  if not found or not public.workflow_can_manage(v_role, v_dept, v_req.department_id) then
    raise exception 'Talep bulunamadı veya bu işlem için yetkiniz yok.' using errcode = 'KZ404';
  end if;

  if v_req.status not in ('submitted', 'under_review', 'assigned', 'in_progress') then
    raise exception 'Sonuçlanmış bir talep reddedilemez.' using errcode = 'KZ001';
  end if;

  perform public.workflow_apply(v_req.id, 'rejected', v_req.assigned_to, 'Talep reddedildi: ' || v_note);
end;
$$;

-- 5.6 Vatandaş iptali: yalnızca kendi talebi, submitted / under_review iken
create or replace function public.cancel_my_service_request(p_request_id uuid, p_note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid  uuid;
  v_role public.user_role;
  v_dept uuid;
  v_req  public.service_requests%rowtype;
  v_note text := public.workflow_clean_note(p_note, false);
begin
  select a.o_id, a.o_role, a.o_department_id into v_uid, v_role, v_dept from public.workflow_actor() a;

  select * into v_req from public.service_requests r where r.id = p_request_id for update;
  if not found or v_req.citizen_id is distinct from v_uid then
    raise exception 'Talep bulunamadı veya bu işlem için yetkiniz yok.' using errcode = 'KZ404';
  end if;

  if v_req.status not in ('submitted', 'under_review') then
    raise exception 'Atanmış veya işleme alınmış talepler iptal edilemez.' using errcode = 'KZ001';
  end if;

  perform public.workflow_apply(
    v_req.id, 'cancelled', v_req.assigned_to,
    'Talep vatandaş tarafından iptal edildi.' || coalesce(' ' || v_note, '')
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- 6. Personel sorgu RPC'leri
-- -----------------------------------------------------------------------------

-- 6.1 Atanabilir saha personeli (yalnızca id, ad, birim, aktiflik)
create or replace function public.get_available_field_personnel(p_department_id uuid)
returns table (id uuid, full_name text, department_id uuid, is_active boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid  uuid;
  v_role public.user_role;
  v_dept uuid;
begin
  select a.o_id, a.o_role, a.o_department_id into v_uid, v_role, v_dept from public.workflow_actor() a;

  if not (v_role = 'admin' or (v_role = 'department_officer' and v_dept is not null and v_dept = p_department_id)) then
    raise exception 'Bu birimin personel listesine erişim yetkiniz yok.' using errcode = 'KZ403';
  end if;

  return query
    select p.id, p.full_name, p.department_id, p.is_active
    from public.profiles p
    where p.department_id = p_department_id
      and p.role = 'field_personnel'
      and p.is_active
    order by p.full_name nulls last, p.id;
end;
$$;

-- 6.2 Taleplerle ilişkili kişi adları (vatandaş ve atanan personel).
--     profiles RLS'i başkasının profilini okumaya izin vermediğinden bu bilgi
--     yalnızca erişim yetkili personel için bu fonksiyonla sağlanır.
create or replace function public.get_staff_request_people(p_request_ids uuid[])
returns table (request_id uuid, citizen_name text, assigned_name text)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid  uuid;
  v_role public.user_role;
  v_dept uuid;
begin
  select a.o_id, a.o_role, a.o_department_id into v_uid, v_role, v_dept from public.workflow_actor() a;

  if v_role = 'citizen' then
    raise exception 'Bu bilgilere erişim yetkiniz yok.' using errcode = 'KZ403';
  end if;
  if coalesce(array_length(p_request_ids, 1), 0) > 200 then
    raise exception 'Çok fazla talep istendi.' using errcode = 'KZ001';
  end if;

  return query
    select r.id, cp.full_name, ap.full_name
    from public.service_requests r
    left join public.profiles cp on cp.id = r.citizen_id
    left join public.profiles ap on ap.id = r.assigned_to
    where r.id = any (p_request_ids)
      and (
        v_role = 'admin'
        or (v_role = 'department_officer' and r.department_id = v_dept)
        or (v_role = 'field_personnel' and r.assigned_to = v_uid and r.department_id = v_dept)
      );
end;
$$;

-- 6.3 Panel özeti: kapsam rolden belirlenir (admin: tümü/isteğe bağlı birim,
--     birim yetkilisi: kendi birimi, saha personeli: kendisine atananlar).
create or replace function public.get_staff_request_summary(p_department_id uuid default null)
returns table (status public.service_request_status, total bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid  uuid;
  v_role public.user_role;
  v_dept uuid;
begin
  select a.o_id, a.o_role, a.o_department_id into v_uid, v_role, v_dept from public.workflow_actor() a;

  if v_role = 'citizen' then
    raise exception 'Bu bilgilere erişim yetkiniz yok.' using errcode = 'KZ403';
  end if;

  return query
    select r.status, count(*)::bigint
    from public.service_requests r
    where (
        (v_role = 'admin' and (p_department_id is null or r.department_id = p_department_id))
        or (v_role = 'department_officer' and r.department_id = v_dept)
        or (v_role = 'field_personnel' and r.assigned_to = v_uid and r.department_id = v_dept)
      )
    group by r.status;
end;
$$;

-- -----------------------------------------------------------------------------
-- 7. Admin kullanıcı ve rol yönetimi RPC'leri
--    Kullanıcılar Supabase Auth'ta oluşturulur (kayıt veya panel); burada
--    yalnızca mevcut profillerin erişimi yönetilir. Şifre/token asla döndürülmez.
-- -----------------------------------------------------------------------------

create or replace function public.admin_list_users()
returns table (
  id uuid,
  email text,
  full_name text,
  phone text,
  role public.user_role,
  department_id uuid,
  department_name text,
  village_id uuid,
  is_active boolean,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not public.is_admin() then
    raise exception 'Bu işlem yalnızca yöneticiler içindir.' using errcode = 'KZ403';
  end if;

  return query
    select p.id, u.email::text, p.full_name, p.phone, p.role,
           p.department_id, d.name, p.village_id, p.is_active, p.created_at
    from public.profiles p
    join auth.users u on u.id = p.id
    left join public.departments d on d.id = p.department_id
    order by p.created_at desc;
end;
$$;

create or replace function public.admin_update_user_access(
  p_user_id uuid,
  p_role public.user_role,
  p_department_id uuid,
  p_is_active boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid      uuid := (select auth.uid());
  v_old      public.profiles%rowtype;
  v_new_dept uuid;
begin
  if v_uid is null or not public.is_admin() then
    raise exception 'Bu işlem yalnızca yöneticiler içindir.' using errcode = 'KZ403';
  end if;

  if p_user_id is null or p_role is null or p_is_active is null then
    raise exception 'Eksik bilgi gönderildi.' using errcode = 'KZ001';
  end if;

  if p_user_id = v_uid then
    raise exception 'Kendi rolünüzü veya hesap durumunuzu değiştiremezsiniz.' using errcode = 'KZ001';
  end if;

  select * into v_old from public.profiles p where p.id = p_user_id for update;
  if not found then
    raise exception 'Kullanıcı bulunamadı.' using errcode = 'KZ404';
  end if;

  -- Birim kuralları
  if p_role in ('department_officer', 'field_personnel') then
    if p_department_id is null or not exists (
      select 1 from public.departments d where d.id = p_department_id and d.is_active
    ) then
      raise exception 'Bu rol için geçerli ve aktif bir birim seçmelisiniz.' using errcode = 'KZ001';
    end if;
    v_new_dept := p_department_id;
  else
    v_new_dept := null;  -- vatandaş ve admin için birim tutulmaz
  end if;

  if v_old.role = p_role
     and v_old.department_id is not distinct from v_new_dept
     and v_old.is_active = p_is_active then
    return;  -- değişiklik yok
  end if;

  update public.profiles p
     set role = p_role,
         department_id = v_new_dept,
         is_active = p_is_active
   where p.id = p_user_id;

  insert into public.profile_access_history (
    target_user_id, changed_by,
    old_role, new_role,
    old_department_id, new_department_id,
    old_is_active, new_is_active
  ) values (
    p_user_id, v_uid,
    v_old.role, p_role,
    v_old.department_id, v_new_dept,
    v_old.is_active, p_is_active
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- 8. Fonksiyon yetkileri: public/anon kapalı, yalnızca authenticated çalıştırır
-- -----------------------------------------------------------------------------
revoke all on function public.review_service_request(uuid, text)            from public, anon;
revoke all on function public.assign_service_request(uuid, uuid, text)      from public, anon;
revoke all on function public.start_service_request(uuid, text)             from public, anon;
revoke all on function public.resolve_service_request(uuid, text)           from public, anon;
revoke all on function public.reject_service_request(uuid, text)            from public, anon;
revoke all on function public.cancel_my_service_request(uuid, text)         from public, anon;
revoke all on function public.get_available_field_personnel(uuid)           from public, anon;
revoke all on function public.get_staff_request_people(uuid[])              from public, anon;
revoke all on function public.get_staff_request_summary(uuid)               from public, anon;
revoke all on function public.admin_list_users()                            from public, anon;
revoke all on function public.admin_update_user_access(uuid, public.user_role, uuid, boolean)
  from public, anon;

grant execute on function public.review_service_request(uuid, text)            to authenticated;
grant execute on function public.assign_service_request(uuid, uuid, text)      to authenticated;
grant execute on function public.start_service_request(uuid, text)             to authenticated;
grant execute on function public.resolve_service_request(uuid, text)           to authenticated;
grant execute on function public.reject_service_request(uuid, text)            to authenticated;
grant execute on function public.cancel_my_service_request(uuid, text)         to authenticated;
grant execute on function public.get_available_field_personnel(uuid)           to authenticated;
grant execute on function public.get_staff_request_people(uuid[])              to authenticated;
grant execute on function public.get_staff_request_summary(uuid)               to authenticated;
grant execute on function public.admin_list_users()                            to authenticated;
grant execute on function public.admin_update_user_access(uuid, public.user_role, uuid, boolean)
  to authenticated;

commit;
