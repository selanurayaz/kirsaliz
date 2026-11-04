-- =============================================================================
-- KırsalİZ — 006_user_profile
-- Kullanıcının kendi profilini güvenle güncellemesi: public.update_my_profile().
--
-- ÖN KOŞUL: 001–005 çalıştırılmış olmalıdır.
--
-- NEDEN GEREKLİ?
--   * 001: authenticated yalnızca profiles(full_name, phone) sütunlarını
--     güncelleyebilir. village_id için sütun yetkisi YOKTUR; bu yüzden vatandaş
--     köyünü doğrudan güncelleyemez. Yetkiyi genişletmek yerine (sütun yetkisi
--     doğrulama yapamaz) dar kapsamlı bir RPC eklenir.
--   * profiles tablosunda district_id sütunu YOKTUR: ilçe, köyün district_id
--     değerinden türetilir. Yeni sütun eklenmez (mevcut modeli bozmaz).
--
-- YETKİ KARARLARI
--   * Tablo yetkileri/RLS DEĞİŞMEZ. Doğrudan UPDATE yetkisi hâlâ yalnızca
--     full_name ve phone içindir; role, is_active, department_id, village_id,
--     id, created_at doğrudan değiştirilemez (001'deki tetikleyici + yetkiler).
--   * security definer GEREKLİDİR: village_id için sütun yetkisi verilmediğinden
--     fonksiyon sahibi olarak yazar. Güvenlik önlemleri:
--       - search_path boş, tüm nesneler şema ile yazılı,
--       - hedef satır YALNIZCA auth.uid() ile belirlenir (kullanıcı kimliği
--         parametresi YOKTUR → başkasının profili güncellenemez),
--       - hesap aktif olmalıdır,
--       - yalnızca full_name, phone ve (vatandaşlar için) village_id yazılır;
--         role, is_active, department_id asla dokunulmaz,
--       - anon ve public için EXECUTE kapalı; yalnızca authenticated çalıştırır.
--   * Birim (department_id) kimse tarafından bu RPC ile değişmez; değişiklik
--     yalnızca admin_update_user_access (004) üzerinden yapılır.
--   * Personel (citizen dışı roller) köy değiştiremez.
--
-- Supabase SQL Editor'da güvenle (tekrar) çalıştırılabilir.
-- =============================================================================

begin;

create or replace function public.update_my_profile(
  p_full_name      text,
  p_phone          text,
  p_village_id     uuid    default null,
  p_update_village boolean default false
)
returns public.profiles
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid     uuid := (select auth.uid());
  v_old     public.profiles%rowtype;
  v_name    text := nullif(btrim(p_full_name), '');
  v_phone   text := nullif(btrim(p_phone), '');
  v_village uuid;
  v_result  public.profiles%rowtype;
begin
  if v_uid is null then
    raise exception 'Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın.' using errcode = 'KZ401';
  end if;

  -- Satır kilidi; yalnızca kendi satırı (parametre ile kimlik alınmaz).
  select * into v_old from public.profiles p where p.id = v_uid for update;
  if not found then
    raise exception 'Profil bulunamadı.' using errcode = 'KZ404';
  end if;

  if not v_old.is_active then
    raise exception 'Hesabınız pasif durumda.' using errcode = 'KZ403';
  end if;

  if v_name is null then
    raise exception 'Lütfen adınızı ve soyadınızı girin.' using errcode = 'KZ001';
  end if;
  if char_length(v_name) > 200 then
    raise exception 'Ad soyad en fazla 200 karakter olabilir.' using errcode = 'KZ001';
  end if;
  if v_phone is not null and char_length(v_phone) > 32 then
    raise exception 'Telefon numarası en fazla 32 karakter olabilir.' using errcode = 'KZ001';
  end if;

  v_village := v_old.village_id;

  if p_update_village then
    if v_old.role <> 'citizen' then
      raise exception 'Köy bilgisi yalnızca vatandaş hesaplarında değiştirilebilir.' using errcode = 'KZ403';
    end if;

    if p_village_id is not null and p_village_id is distinct from v_old.village_id then
      -- Yeni köy: mevcut, aktif, demo olmayan ve aktif bir ilçeye bağlı olmalı.
      if not exists (
        select 1
        from public.villages v
        join public.districts d on d.id = v.district_id
        where v.id = p_village_id
          and v.is_active
          and not v.is_demo
          and d.is_active
      ) then
        raise exception 'Seçilen köy geçerli değil veya seçilemez.' using errcode = 'KZ001';
      end if;
    end if;

    v_village := p_village_id;
  end if;

  update public.profiles p
     set full_name = v_name,
         phone = v_phone,
         village_id = v_village
   where p.id = v_uid
  returning * into v_result;

  return v_result;
end;
$$;

comment on function public.update_my_profile(text, text, uuid, boolean) is
  'Oturumdaki kullanıcının kendi ad soyad, telefon ve (vatandaş için) köy bilgisini günceller.';

revoke all on function public.update_my_profile(text, text, uuid, boolean) from public, anon;
grant execute on function public.update_my_profile(text, text, uuid, boolean) to authenticated;

commit;
