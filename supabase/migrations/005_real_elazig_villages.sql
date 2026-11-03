-- =============================================================================
-- KırsalİZ — 005_real_elazig_villages
-- Sentetik köy verisinin yerine Elazığ'ın gerçek köy kayıtlarını yükler.
--
-- VERİ KAYNAĞI
--   Türkiye İçişleri Bakanlığı, Mülki İdare Bölümleri Envanteri:
--     https://www.e-icisleri.gov.tr/Anasayfa/MulkiIdariBolumleri.aspx
--   Resmî sayfa program aracılığıyla (toplu olarak) okunamadığından, aynı
--   envanterden derlenen açık veri seti kullanılmıştır:
--     https://github.com/sabrigunes/turkey-administrative-units-dataset
--     (csv/cities.csv, csv/districts.csv, csv/villages.csv; CC0 1.0;
--      veri seti referans tarihi: Ekim 2025; depo kaydı 359332c, 2025-10-06)
--   Yalnızca il = Elazığ (plaka 23) kayıtları ve yalnızca "köy" sınıfındaki
--   kayıtlar alınmıştır; mahalle, belde ve bağlı yerleşimler dahil DEĞİLDİR.
--   Adlar kaynakta BÜYÜK HARFLİDİR; Türkçe yazım kurallarına göre (tr-TR)
--   baş harfi büyük biçime çevrilmiştir. Başka hiçbir alan değiştirilmemiştir.
--   Nüfus ve koordinat bilgisi kaynakta bulunmadığından UYDURULMAMIŞTIR (NULL).
--   Veri gerçek zamanlı değildir; yukarıdaki referans tarihini yansıtır.
--
-- İçe aktarma tarihi: 2026-11-03
-- İçe aktarılan köy sayısı (ilçe bazında):
--   Ağın         16
--   Alacakaya    10
--   Arıcak       10
--   Baskil       60
--   Karakoçan    88
--   Keban        30
--   Kovancılar   76
--   Maden        38
--   Merkez      132
--   Palu         37
--   Sivrice      50
--   TOPLAM      547
--
-- DAVRANIŞ
--   * Tek transaction; hata olursa hiçbir değişiklik kalıcı olmaz.
--   * Tekrar çalıştırılabilir: (district_id, name) üzerinden upsert yapılır;
--     mevcut nüfus/koordinat değerleri korunur, yalnızca is_demo = false ve
--     is_active = true yapılır.
--   * Her ilçe adı districts tablosunda tam bir kayda çözümlenmezse işlem durur.
--   * Demo ("Örnek Köy NN") köyler yalnızca HİÇBİR talep veya profil
--     tarafından kullanılmıyorsa silinir. Kullanılanlar tarihsel bütünlük için
--     is_demo = true olarak KALIR; arayüz is_demo = true köyleri listelemez.
--     Mevcut talepler başka bir köye taşınmaz, silinmez.
--   * Tablo yapısı, kısıt, RLS ve fonksiyonlara dokunulmaz.
--
-- ÖN KOŞUL: 002_reference_data.sql (ve 003, 004) uygulanmış olmalıdır.
-- =============================================================================

begin;

create temporary table _real_villages (
  district_name text not null,
  village_name  text not null,
  primary key (district_name, village_name)
) on commit drop;

insert into _real_villages (district_name, village_name) values
  ('Ağın', 'Altınayva'),
  ('Ağın', 'Aşağıyabanlı'),
  ('Ağın', 'Bademli'),
  ('Ağın', 'Bahadırlar'),
  ('Ağın', 'Balkayası'),
  ('Ağın', 'Beyelması'),
  ('Ağın', 'Demirçarık'),
  ('Ağın', 'Dibekli'),
  ('Ağın', 'Kaşpınar'),
  ('Ağın', 'Modanlı'),
  ('Ağın', 'Öğrendik'),
  ('Ağın', 'Pulköy'),
  ('Ağın', 'Samançay'),
  ('Ağın', 'Saraycık'),
  ('Ağın', 'Yedibağ'),
  ('Ağın', 'Yenipayam'),
  ('Alacakaya', 'Bakladamlar'),
  ('Alacakaya', 'Çakmakkaya'),
  ('Alacakaya', 'Çanakça'),
  ('Alacakaya', 'Çataklı'),
  ('Alacakaya', 'Esenlik'),
  ('Alacakaya', 'Gürçubuk'),
  ('Alacakaya', 'Halkalı'),
  ('Alacakaya', 'İncebayır'),
  ('Alacakaya', 'Kayranlı'),
  ('Alacakaya', 'Yalnızdamlar'),
  ('Arıcak', 'Bozçavuş'),
  ('Arıcak', 'Çavuşdere'),
  ('Arıcak', 'Çevrecik'),
  ('Arıcak', 'Erbağı'),
  ('Arıcak', 'Göründü'),
  ('Arıcak', 'Kambertepe'),
  ('Arıcak', 'Karakaş'),
  ('Arıcak', 'Küplüce'),
  ('Arıcak', 'Ormanpınar'),
  ('Arıcak', 'Yoğunbilek'),
  ('Baskil', 'Akdemir'),
  ('Baskil', 'Akuşağı'),
  ('Baskil', 'Aladikme'),
  ('Baskil', 'Alangören'),
  ('Baskil', 'Altınuşağı'),
  ('Baskil', 'Aşağıkuluşağı'),
  ('Baskil', 'Beşbölük'),
  ('Baskil', 'Bilaluşağı'),
  ('Baskil', 'Bozoğlak'),
  ('Baskil', 'Çavuşlu'),
  ('Baskil', 'Çiğdemlik'),
  ('Baskil', 'Deliktaş'),
  ('Baskil', 'Demirlibahçe'),
  ('Baskil', 'Doğancık'),
  ('Baskil', 'Düğüntepe'),
  ('Baskil', 'Emirhan'),
  ('Baskil', 'Eskiköy'),
  ('Baskil', 'Gemici'),
  ('Baskil', 'Habibuşağı'),
  ('Baskil', 'Hacıhüseyinler'),
  ('Baskil', 'Hacımehmetli'),
  ('Baskil', 'Hacımustafaköy'),
  ('Baskil', 'Hacıuşağı'),
  ('Baskil', 'Harabekayış'),
  ('Baskil', 'Hüyükköy'),
  ('Baskil', 'Işıklar'),
  ('Baskil', 'İçlikaval'),
  ('Baskil', 'İmikuşağı'),
  ('Baskil', 'Kadıköy'),
  ('Baskil', 'Karaali'),
  ('Baskil', 'Karagedik'),
  ('Baskil', 'Karakaş'),
  ('Baskil', 'Karoğlu'),
  ('Baskil', 'Kayabeyli'),
  ('Baskil', 'Kızıluşağı'),
  ('Baskil', 'Koçyolu'),
  ('Baskil', 'Konacık'),
  ('Baskil', 'Konalga'),
  ('Baskil', 'Kumlutarla'),
  ('Baskil', 'Kuşsarayı'),
  ('Baskil', 'Kutlugün'),
  ('Baskil', 'Meydancık'),
  ('Baskil', 'Paşakonağı'),
  ('Baskil', 'Pınarlı'),
  ('Baskil', 'Resulkahya'),
  ('Baskil', 'Sarıtaş'),
  ('Baskil', 'Söğütdere'),
  ('Baskil', 'Suyatağı'),
  ('Baskil', 'Şahaplı'),
  ('Baskil', 'Şahindere'),
  ('Baskil', 'Şeyh Hasan'),
  ('Baskil', 'Şituşağı'),
  ('Baskil', 'Tatlıpayam'),
  ('Baskil', 'Tavşanuşağı'),
  ('Baskil', 'Topaluşağı'),
  ('Baskil', 'Yalındam'),
  ('Baskil', 'Yaylanlı'),
  ('Baskil', 'Yeniocak'),
  ('Baskil', 'Yıldızlı'),
  ('Baskil', 'Yukarıkuluşağı'),
  ('Karakoçan', 'Ağamezraası'),
  ('Karakoçan', 'Akarbaşı'),
  ('Karakoçan', 'Akbulak'),
  ('Karakoçan', 'Akçiçek'),
  ('Karakoçan', 'Akkuş'),
  ('Karakoçan', 'Akpınar'),
  ('Karakoçan', 'Akyokuş'),
  ('Karakoçan', 'Alabal'),
  ('Karakoçan', 'Alayağmur'),
  ('Karakoçan', 'Altınoluk'),
  ('Karakoçan', 'Aşağıovacık'),
  ('Karakoçan', 'Bağlıağaç'),
  ('Karakoçan', 'Bahçecik'),
  ('Karakoçan', 'Balcalı'),
  ('Karakoçan', 'Bardaklı'),
  ('Karakoçan', 'Başyurt'),
  ('Karakoçan', 'Bazlama'),
  ('Karakoçan', 'Beydere'),
  ('Karakoçan', 'Bulgurcuk'),
  ('Karakoçan', 'Cumhuriyet'),
  ('Karakoçan', 'Çalıkaya'),
  ('Karakoçan', 'Çamardı'),
  ('Karakoçan', 'Çan'),
  ('Karakoçan', 'Çanakçı'),
  ('Karakoçan', 'Çatalyol'),
  ('Karakoçan', 'Çavuşyolu'),
  ('Karakoçan', 'Çayırdam'),
  ('Karakoçan', 'Çayırgülü'),
  ('Karakoçan', 'Çelebi'),
  ('Karakoçan', 'Çıtak'),
  ('Karakoçan', 'Demirdelen'),
  ('Karakoçan', 'Demirtaş'),
  ('Karakoçan', 'Demirtepe'),
  ('Karakoçan', 'Deveci'),
  ('Karakoçan', 'Doğanoğlu'),
  ('Karakoçan', 'Dumluyazı'),
  ('Karakoçan', 'Durmuşköy'),
  ('Karakoçan', 'Gözerek'),
  ('Karakoçan', 'Güllüce'),
  ('Karakoçan', 'Gümüşakar'),
  ('Karakoçan', 'Gündeğdi'),
  ('Karakoçan', 'Hamurkesen'),
  ('Karakoçan', 'Hamzalı'),
  ('Karakoçan', 'İsabey'),
  ('Karakoçan', 'Kalecik'),
  ('Karakoçan', 'Kalkankaya'),
  ('Karakoçan', 'Karaçan'),
  ('Karakoçan', 'Karakoçan'),
  ('Karakoçan', 'Karapınar'),
  ('Karakoçan', 'Karasakal'),
  ('Karakoçan', 'Kavakdere'),
  ('Karakoçan', 'Kavalcık'),
  ('Karakoçan', 'Keklikköy'),
  ('Karakoçan', 'Kırgıl'),
  ('Karakoçan', 'Kızılca'),
  ('Karakoçan', 'Kızılpınar'),
  ('Karakoçan', 'Kocadayı'),
  ('Karakoçan', 'Koçyiğitler'),
  ('Karakoçan', 'Korudibi'),
  ('Karakoçan', 'Köryusuf'),
  ('Karakoçan', 'Kulundere'),
  ('Karakoçan', 'Kuşbayırı'),
  ('Karakoçan', 'Kuşçu'),
  ('Karakoçan', 'Kümbet'),
  ('Karakoçan', 'Mahmutlu'),
  ('Karakoçan', 'Maksutali'),
  ('Karakoçan', 'Mirahmet'),
  ('Karakoçan', 'Okçular'),
  ('Karakoçan', 'Ormancık'),
  ('Karakoçan', 'Özlüce'),
  ('Karakoçan', 'Pamuklu'),
  ('Karakoçan', 'Paşayaylası'),
  ('Karakoçan', 'Pilavtepe'),
  ('Karakoçan', 'Sağın'),
  ('Karakoçan', 'Sarıbaşak'),
  ('Karakoçan', 'Sarıhan'),
  ('Karakoçan', 'Savucak'),
  ('Karakoçan', 'Tekardıç'),
  ('Karakoçan', 'Üçbudak'),
  ('Karakoçan', 'Yalıntaş'),
  ('Karakoçan', 'Yenice'),
  ('Karakoçan', 'Yenikaya'),
  ('Karakoçan', 'Yeniköy'),
  ('Karakoçan', 'Yeşilbelen'),
  ('Karakoçan', 'Yoğunağaç'),
  ('Karakoçan', 'Yukarıovacık'),
  ('Karakoçan', 'Yücekonak'),
  ('Karakoçan', 'Yüzev'),
  ('Keban', 'Akçatepe'),
  ('Keban', 'Akgömlek'),
  ('Keban', 'Altınkürek'),
  ('Keban', 'Altıyaka'),
  ('Keban', 'Aslankaşı'),
  ('Keban', 'Aşağıçakmak'),
  ('Keban', 'Bademli'),
  ('Keban', 'Bahçeli'),
  ('Keban', 'Bayındır'),
  ('Keban', 'Beydeğirmeni'),
  ('Keban', 'Bölükçalı'),
  ('Keban', 'Büklümlü'),
  ('Keban', 'Çalık'),
  ('Keban', 'Çevrekaya'),
  ('Keban', 'Denizli'),
  ('Keban', 'Dürümlü'),
  ('Keban', 'Gökbelen'),
  ('Keban', 'Göldere'),
  ('Keban', 'Güneytepe'),
  ('Keban', 'Kopuzlu'),
  ('Keban', 'Koyunuşağı'),
  ('Keban', 'Kurşunkaya'),
  ('Keban', 'Kuşçu'),
  ('Keban', 'Nimri'),
  ('Keban', 'Örenyaka'),
  ('Keban', 'Sağdıçlar'),
  ('Keban', 'Taşkesen'),
  ('Keban', 'Topkıran'),
  ('Keban', 'Ulupınar'),
  ('Keban', 'Üçpınar'),
  ('Kovancılar', 'Adalı'),
  ('Kovancılar', 'Akmezra'),
  ('Kovancılar', 'Aşağıdemirci'),
  ('Kovancılar', 'Aşağıkanatlı'),
  ('Kovancılar', 'Aşağıköse'),
  ('Kovancılar', 'Aşağımirahmet'),
  ('Kovancılar', 'Avlağı'),
  ('Kovancılar', 'Bağgülü'),
  ('Kovancılar', 'Bayramyazı'),
  ('Kovancılar', 'Beşpınar'),
  ('Kovancılar', 'Bilalköy'),
  ('Kovancılar', 'Çakırkaş'),
  ('Kovancılar', 'Çatakbaşı'),
  ('Kovancılar', 'Çaybağı'),
  ('Kovancılar', 'Çelebi'),
  ('Kovancılar', 'Çiftlikköy'),
  ('Kovancılar', 'Değirmentaşı'),
  ('Kovancılar', 'Demirci'),
  ('Kovancılar', 'Durmuşlar'),
  ('Kovancılar', 'Ekinbağı'),
  ('Kovancılar', 'Ekinözü'),
  ('Kovancılar', 'Gedikyurt'),
  ('Kovancılar', 'Göçmezler'),
  ('Kovancılar', 'Gökçedal'),
  ('Kovancılar', 'Gözecik'),
  ('Kovancılar', 'Gülçatı'),
  ('Kovancılar', 'Hacımekke'),
  ('Kovancılar', 'Hacısam'),
  ('Kovancılar', 'İğdeli'),
  ('Kovancılar', 'İsaağamezrası'),
  ('Kovancılar', 'Kaçar'),
  ('Kovancılar', 'Karabük'),
  ('Kovancılar', 'Karaman'),
  ('Kovancılar', 'Karasungur'),
  ('Kovancılar', 'Karıncaköy'),
  ('Kovancılar', 'Kavakköy'),
  ('Kovancılar', 'Kayalık'),
  ('Kovancılar', 'Kolluca'),
  ('Kovancılar', 'Köprüdere'),
  ('Kovancılar', 'Kuşağacı'),
  ('Kovancılar', 'Kuşçuköy'),
  ('Kovancılar', 'Muratbağı'),
  ('Kovancılar', 'Mustafaköy'),
  ('Kovancılar', 'Nişankaya'),
  ('Kovancılar', 'Okçular'),
  ('Kovancılar', 'Osmanağaköy'),
  ('Kovancılar', 'Payamlı'),
  ('Kovancılar', 'Salkımlı'),
  ('Kovancılar', 'Saraybahçe'),
  ('Kovancılar', 'Sarıbuğday'),
  ('Kovancılar', 'Soğanlı'),
  ('Kovancılar', 'Soğukpınar'),
  ('Kovancılar', 'Sürekli'),
  ('Kovancılar', 'Şekerci'),
  ('Kovancılar', 'Şenova'),
  ('Kovancılar', 'Tabanözü'),
  ('Kovancılar', 'Taşçanak'),
  ('Kovancılar', 'Taşören'),
  ('Kovancılar', 'Tatarköy'),
  ('Kovancılar', 'Tepebağı'),
  ('Kovancılar', 'Topağaç'),
  ('Kovancılar', 'Uyandık'),
  ('Kovancılar', 'Uzunova'),
  ('Kovancılar', 'Vali Fahribey'),
  ('Kovancılar', 'Yarımca'),
  ('Kovancılar', 'Yazıbaşı'),
  ('Kovancılar', 'Yenidam'),
  ('Kovancılar', 'Yeniköy'),
  ('Kovancılar', 'Yeşildere'),
  ('Kovancılar', 'Yeşilköy'),
  ('Kovancılar', 'Yılbaşı'),
  ('Kovancılar', 'Yoncalıbayır'),
  ('Kovancılar', 'Yukarıdemirli'),
  ('Kovancılar', 'Yukarıkanatlı'),
  ('Kovancılar', 'Yukarıkazanlar'),
  ('Kovancılar', 'Yukarımirahmet'),
  ('Maden', 'Ağadibek'),
  ('Maden', 'Akboğa'),
  ('Maden', 'Altıntarla'),
  ('Maden', 'Arslantaşı'),
  ('Maden', 'Bahçedere'),
  ('Maden', 'Cumhuriyetçi'),
  ('Maden', 'Çakıroğlu'),
  ('Maden', 'Çalkaya'),
  ('Maden', 'Çayırköy'),
  ('Maden', 'Çitliköy'),
  ('Maden', 'Durmuştepe'),
  ('Maden', 'Dutpınar'),
  ('Maden', 'Eğrikavak'),
  ('Maden', 'Gezin'),
  ('Maden', 'Hanevleri'),
  ('Maden', 'Hatunköy'),
  ('Maden', 'Işıktepe'),
  ('Maden', 'Karatop'),
  ('Maden', 'Kartaldere'),
  ('Maden', 'Kaşlıca'),
  ('Maden', 'Kavak'),
  ('Maden', 'Kayalar'),
  ('Maden', 'Kızıltepe'),
  ('Maden', 'Koçkonağı'),
  ('Maden', 'Kumyazı'),
  ('Maden', 'Küçükova'),
  ('Maden', 'Naldöken'),
  ('Maden', 'Örtülü'),
  ('Maden', 'Plajköy'),
  ('Maden', 'Polatköy'),
  ('Maden', 'Sağrılı'),
  ('Maden', 'Tekevler'),
  ('Maden', 'Tepecik'),
  ('Maden', 'Topaluşağı'),
  ('Maden', 'Yenibahçe'),
  ('Maden', 'Yeşilova'),
  ('Maden', 'Yıldızhan'),
  ('Maden', 'Yoncapınar'),
  ('Merkez', 'Acıpayam'),
  ('Merkez', 'Akçakale'),
  ('Merkez', 'Alaca'),
  ('Merkez', 'Alatarla'),
  ('Merkez', 'Alpağut'),
  ('Merkez', 'Altınkuşak'),
  ('Merkez', 'Arındık'),
  ('Merkez', 'Avcılı'),
  ('Merkez', 'Aydıncık'),
  ('Merkez', 'Aydınlar'),
  ('Merkez', 'Badempınarı'),
  ('Merkez', 'Bağdere'),
  ('Merkez', 'Bağlarca'),
  ('Merkez', 'Balıbey'),
  ('Merkez', 'Ballıca'),
  ('Merkez', 'Balpınar'),
  ('Merkez', 'Beşikköy'),
  ('Merkez', 'Beşoluk'),
  ('Merkez', 'Beydalı'),
  ('Merkez', 'Beydoğmuş'),
  ('Merkez', 'Bölüklü'),
  ('Merkez', 'Bulutlu'),
  ('Merkez', 'Cevizdere'),
  ('Merkez', 'Cipköy'),
  ('Merkez', 'Çağlar'),
  ('Merkez', 'Çalıca'),
  ('Merkez', 'Çatalharman'),
  ('Merkez', 'Çöteli'),
  ('Merkez', 'Dallıca'),
  ('Merkez', 'Dambüyük'),
  ('Merkez', 'Dedepınarı'),
  ('Merkez', 'Değirmenönü'),
  ('Merkez', 'Dereboğazı'),
  ('Merkez', 'Doğankuş'),
  ('Merkez', 'Durupınar'),
  ('Merkez', 'Elmapınarı'),
  ('Merkez', 'Erbildi'),
  ('Merkez', 'Esenkent'),
  ('Merkez', 'Fatmalı'),
  ('Merkez', 'Gedikyolu'),
  ('Merkez', 'Gökçe'),
  ('Merkez', 'Gölardı'),
  ('Merkez', 'Gölköy'),
  ('Merkez', 'Gözebaşı'),
  ('Merkez', 'Gözpınar'),
  ('Merkez', 'Gülpınar'),
  ('Merkez', 'Gümüşbağlar'),
  ('Merkez', 'Günaçtı'),
  ('Merkez', 'Günbağı'),
  ('Merkez', 'Güneyçayırı'),
  ('Merkez', 'Güzelyalı'),
  ('Merkez', 'Güzelyurt'),
  ('Merkez', 'Hal'),
  ('Merkez', 'Harmantepe'),
  ('Merkez', 'Hıdırbaba'),
  ('Merkez', 'Hoşköy'),
  ('Merkez', 'Işıkyolu'),
  ('Merkez', 'İçme'),
  ('Merkez', 'İkitepe'),
  ('Merkez', 'Kalkantepe'),
  ('Merkez', 'Kaplıkaya'),
  ('Merkez', 'Karaali'),
  ('Merkez', 'Karaçavuş'),
  ('Merkez', 'Karasaz'),
  ('Merkez', 'Karataş'),
  ('Merkez', 'Kavakpınar'),
  ('Merkez', 'Kavaktepe'),
  ('Merkez', 'Kelmahmut'),
  ('Merkez', 'Kepektaş'),
  ('Merkez', 'Kıraçköy'),
  ('Merkez', 'Koçharmanı'),
  ('Merkez', 'Koçkale'),
  ('Merkez', 'Konakalmaz'),
  ('Merkez', 'Koparuşağı'),
  ('Merkez', 'Korucu'),
  ('Merkez', 'Koruköy'),
  ('Merkez', 'Kozluk'),
  ('Merkez', 'Körpe'),
  ('Merkez', 'Kumla'),
  ('Merkez', 'Kurtdere'),
  ('Merkez', 'Kuşhane'),
  ('Merkez', 'Kuşluyazı'),
  ('Merkez', 'Kuyulu'),
  ('Merkez', 'Küllük'),
  ('Merkez', 'Meşeli'),
  ('Merkez', 'Muratçık'),
  ('Merkez', 'Nuralı'),
  ('Merkez', 'Obuz'),
  ('Merkez', 'Ortaçalı'),
  ('Merkez', 'Oymaağaç'),
  ('Merkez', 'Örençay'),
  ('Merkez', 'Pelteköy'),
  ('Merkez', 'Pirinççi'),
  ('Merkez', 'Poyraz'),
  ('Merkez', 'Sakabaşı'),
  ('Merkez', 'Salkaya'),
  ('Merkez', 'Sancaklı'),
  ('Merkez', 'Sarıbük'),
  ('Merkez', 'Sarıçubuk'),
  ('Merkez', 'Sarıgül'),
  ('Merkez', 'Sarıkamış'),
  ('Merkez', 'Sarılı'),
  ('Merkez', 'Sarıyakup'),
  ('Merkez', 'Sedeftepe'),
  ('Merkez', 'Serince'),
  ('Merkez', 'Sinanköy'),
  ('Merkez', 'Sultanuşağı'),
  ('Merkez', 'Sünköy'),
  ('Merkez', 'Sütlüce'),
  ('Merkez', 'Şabanlı'),
  ('Merkez', 'Şahaplı'),
  ('Merkez', 'Şehsuvar'),
  ('Merkez', 'Şeyhacı'),
  ('Merkez', 'Tadım'),
  ('Merkez', 'Temürköy'),
  ('Merkez', 'Tepeköy'),
  ('Merkez', 'Tohumlu'),
  ('Merkez', 'Uzuntarla'),
  ('Merkez', 'Üçağaç'),
  ('Merkez', 'Ürünveren'),
  ('Merkez', 'Yalındamlar'),
  ('Merkez', 'Yalnız'),
  ('Merkez', 'Yazıpınarı'),
  ('Merkez', 'Yedigöze'),
  ('Merkez', 'Yenikapı'),
  ('Merkez', 'Yenikonak'),
  ('Merkez', 'Yolçatı'),
  ('Merkez', 'Yolüstü'),
  ('Merkez', 'Yukarıçakmak'),
  ('Merkez', 'Yukarıdemirtaş'),
  ('Merkez', 'Yünlüce'),
  ('Merkez', 'Yürekli'),
  ('Palu', 'Akyürek'),
  ('Palu', 'Altınölçek'),
  ('Palu', 'Andılar'),
  ('Palu', 'Arındık'),
  ('Palu', 'Atikköy'),
  ('Palu', 'Baltaşı'),
  ('Palu', 'Beydoğan'),
  ('Palu', 'Bozçanak'),
  ('Palu', 'Bölükelma'),
  ('Palu', 'Burgudere'),
  ('Palu', 'Büyükçaltı'),
  ('Palu', 'Damlapınar'),
  ('Palu', 'Gemtepe'),
  ('Palu', 'Gökdere'),
  ('Palu', 'Güllüce'),
  ('Palu', 'Gümeçbağlar'),
  ('Palu', 'Gümüşkaynak'),
  ('Palu', 'Hasbey'),
  ('Palu', 'Karacabağ'),
  ('Palu', 'Karasalkım'),
  ('Palu', 'Karataş'),
  ('Palu', 'Kasıl'),
  ('Palu', 'Kayahisar'),
  ('Palu', 'Kayaönü'),
  ('Palu', 'Keklikdere'),
  ('Palu', 'Kırkbulak'),
  ('Palu', 'Köklüce'),
  ('Palu', 'Küçükçaltı'),
  ('Palu', 'Örencik'),
  ('Palu', 'Örgülü'),
  ('Palu', 'Seydili'),
  ('Palu', 'Tarhanaköy'),
  ('Palu', 'Umutkaya'),
  ('Palu', 'Üçdeğirmenler'),
  ('Palu', 'Yarımtepe'),
  ('Palu', 'Yeşilbayır'),
  ('Palu', 'Ziver'),
  ('Sivrice', 'Akbuğday'),
  ('Sivrice', 'Akseki'),
  ('Sivrice', 'Alaattinköy'),
  ('Sivrice', 'Alıncık'),
  ('Sivrice', 'Aşağıçanakçı'),
  ('Sivrice', 'Başkaynak'),
  ('Sivrice', 'Bekçitepe'),
  ('Sivrice', 'Canuşağı'),
  ('Sivrice', 'Çatakkaya'),
  ('Sivrice', 'Çevrimtaş'),
  ('Sivrice', 'Çortunlu'),
  ('Sivrice', 'Dedeyolu'),
  ('Sivrice', 'Dereboynu'),
  ('Sivrice', 'Dikmen'),
  ('Sivrice', 'Doğanbağı'),
  ('Sivrice', 'Dörtbölük'),
  ('Sivrice', 'Duygulu'),
  ('Sivrice', 'Elmasuyu'),
  ('Sivrice', 'Gelindere'),
  ('Sivrice', 'Görgülü'),
  ('Sivrice', 'Gözeli'),
  ('Sivrice', 'Günbalı'),
  ('Sivrice', 'Güneyköy'),
  ('Sivrice', 'Hacılar'),
  ('Sivrice', 'Haftasar'),
  ('Sivrice', 'Ilıncak'),
  ('Sivrice', 'Kalaba'),
  ('Sivrice', 'Kamışlık'),
  ('Sivrice', 'Kavakköy'),
  ('Sivrice', 'Kavallı'),
  ('Sivrice', 'Kayabağları'),
  ('Sivrice', 'Kayapınar'),
  ('Sivrice', 'Kılıçkaya'),
  ('Sivrice', 'Kösebayır'),
  ('Sivrice', 'Kürkköy'),
  ('Sivrice', 'Mollaali'),
  ('Sivrice', 'Nergize'),
  ('Sivrice', 'Soğukpınar'),
  ('Sivrice', 'Sürek'),
  ('Sivrice', 'Tarlatepe'),
  ('Sivrice', 'Taşlıyayla'),
  ('Sivrice', 'Topaluşağı'),
  ('Sivrice', 'Uslu'),
  ('Sivrice', 'Üçlerce'),
  ('Sivrice', 'Üğrük'),
  ('Sivrice', 'Yaruşağı'),
  ('Sivrice', 'Yedikardeş'),
  ('Sivrice', 'Yedipınar'),
  ('Sivrice', 'Yukarıçanakçı'),
  ('Sivrice', 'Yürekkaya');

-- 1. Doğrulama: her ilçe adı tam bir ilçe kaydına çözümlenmeli.
do $$
declare
  v_missing text;
  v_ambiguous text;
begin
  select string_agg(distinct r.district_name, ', ')
    into v_missing
  from _real_villages r
  where not exists (select 1 from public.districts d where d.name = r.district_name);

  if v_missing is not null then
    raise exception 'İlçe bulunamadı: %', v_missing;
  end if;

  select string_agg(r.district_name, ', ')
    into v_ambiguous
  from (
    select r2.district_name
    from (select distinct district_name from _real_villages) r2
    join public.districts d on d.name = r2.district_name
    group by r2.district_name
    having count(*) <> 1
  ) r;

  if v_ambiguous is not null then
    raise exception 'İlçe adı birden fazla kayda çözümleniyor: %', v_ambiguous;
  end if;
end
$$;

-- 2. Gerçek köyleri ekle / güncelle (nüfus ve koordinatlara dokunulmaz).
insert into public.villages (district_id, name, is_demo, is_active)
select d.id, r.village_name, false, true
from _real_villages r
join public.districts d on d.name = r.district_name
on conflict (district_id, name)
do update set is_demo = false, is_active = true;

-- 3. Kullanılmayan demo köyleri sil; kullanılanlar is_demo = true olarak kalır.
delete from public.villages v
where v.is_demo
  and not exists (select 1 from public.service_requests sr where sr.village_id = v.id)
  and not exists (select 1 from public.profiles p where p.village_id = v.id);

-- 4. Sonuç doğrulaması.
do $$
declare
  v_imported integer;
  v_present  integer;
  v_empty    text;
begin
  select count(*) into v_imported from _real_villages;

  select count(*)
    into v_present
  from _real_villages r
  join public.districts d on d.name = r.district_name
  join public.villages v on v.district_id = d.id and v.name = r.village_name
  where not v.is_demo and v.is_active;

  if v_present <> v_imported then
    raise exception 'Köy sayısı uyuşmuyor: beklenen %, bulunan %', v_imported, v_present;
  end if;

  select string_agg(d.name, ', ')
    into v_empty
  from public.districts d
  where d.is_active
    and not exists (
      select 1 from public.villages v
      where v.district_id = d.id and not v.is_demo and v.is_active
    );

  if v_empty is not null then
    raise exception 'Gerçek köyü olmayan ilçe(ler): %', v_empty;
  end if;

  raise notice 'Gerçek köy sayısı: %; kalan demo köy sayısı: %',
    v_imported, (select count(*) from public.villages where is_demo);
end
$$;

commit;
