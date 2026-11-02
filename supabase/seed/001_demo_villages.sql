-- =============================================================================
-- KırsalİZ — seed/001_demo_villages
-- DEMO / PİLOT VERİSİ
--
-- !! BU KAYITLARIN TAMAMI SENTETİKTİR !!
-- "Örnek Köy NN" adlı köyler, nüfus değerleri ve koordinatlar gerçek bir kurum
-- verisi DEĞİLDİR; yalnızca pilot geliştirme ve test amacıyla uydurulmuştur.
-- Koordinatlar Elazığ Merkez ve Sivrice çevresinde rastgele noktalardır; gerçek
-- köylerin konumunu göstermez. Tüm kayıtlar is_demo = true ile işaretlenir.
--
-- ÖN KOŞUL: migrations/002_reference_data.sql çalıştırılmış olmalıdır
-- (districts tablosu ve ilçe kayıtları gerekir).
--
-- Tekrar çalıştırılabilir: (district_id, name) benzersiz olduğundan mevcut
-- kayıtlar atlanır, mükerrer kayıt oluşmaz. Mevcut kayıtlar değiştirilmez.
--
-- Demo verilerini temizlemek için:
--   delete from public.villages where is_demo;
-- =============================================================================

begin;

insert into public.villages (district_id, name, population, latitude, longitude, is_demo)
select d.id, v.name, v.population, v.latitude, v.longitude, true
from (values
  -- Merkez (sentetik)
  ('Merkez',  'Örnek Köy 01', 412, 38.6892, 39.2431),
  ('Merkez',  'Örnek Köy 02', 275, 38.7125, 39.1874),
  ('Merkez',  'Örnek Köy 03', 638, 38.6347, 39.2956),
  ('Merkez',  'Örnek Köy 04', 189, 38.7410, 39.3122),
  ('Merkez',  'Örnek Köy 05', 356, 38.6021, 39.1983),
  -- Sivrice (sentetik)
  ('Sivrice', 'Örnek Köy 06', 298, 38.4573, 39.3115),
  ('Sivrice', 'Örnek Köy 07', 154, 38.4218, 39.2764),
  ('Sivrice', 'Örnek Köy 08', 467, 38.4896, 39.3478),
  ('Sivrice', 'Örnek Köy 09', 223, 38.4035, 39.3302),
  ('Sivrice', 'Örnek Köy 10', 341, 38.4712, 39.2589)
) as v (district_name, name, population, latitude, longitude)
join public.districts d on d.name = v.district_name
on conflict (district_id, name) do nothing;

commit;
