# KırsalİZ

**Konum Tabanlı Kırsal Hizmet ve Karar Destek Platformu**

KırsalİZ; köy ve kırsal bölgelerde yaşanan yol, içme suyu, kanalizasyon ve benzeri altyapı sorunlarının vatandaşlar tarafından bildirilmesini, kurum personeli tarafından değerlendirilmesini ve saha ekiplerine yönlendirilmesini sağlayan web tabanlı bir yönetim platformudur.

Sistem; vatandaş bildirimlerini tek merkezde toplamak, müdahale sürecini takip edilebilir hâle getirmek ve yöneticilere veriye dayalı karar desteği sunmak amacıyla geliştirilmektedir.

## Projenin Amacı

Kırsal bölgelerde yaşanan altyapı sorunlarında vatandaş, kurum personeli ve saha ekipleri arasındaki iletişimi güçlendirmek; hizmet taleplerinin konum, aciliyet ve etkilenen kişi sayısına göre daha düzenli yönetilmesini sağlamaktır.

## Planlanan Özellikler

- Vatandaş kaydı ve kullanıcı girişi
- Konum ve fotoğraf içeren sorun bildirimi
- İlçe, köy ve kategori seçimi
- Bildirim durumunun takip edilmesi
- Harita üzerinden sorun konumu belirleme
- Benzer bildirimlerin tespit edilmesi
- Açıklanabilir öncelik puanlaması
- Kurum personeli için talep ve olay yönetimi
- Saha personeli görevlendirme ve müdahale kaydı
- Yönetici analiz ve raporlama paneli
- Rol tabanlı yetkilendirme

## Kullanıcı Rolleri

- **Vatandaş:** Sorun bildirimi oluşturur ve süreci takip eder.
- **Kurum Personeli:** Bildirimleri inceler, sınıflandırır ve ilgili birime yönlendirir.
- **Saha Personeli:** Kendisine atanan görevleri görüntüler ve müdahale sonucunu kaydeder.
- **Yönetici:** Sistemin genel durumunu, istatistikleri ve birim performanslarını takip eder.

## Teknolojiler

- React
- TypeScript
- Vite
- Tailwind CSS
- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage
- Leaflet
- OpenStreetMap
- Recharts

## Temel İş Akışı

1. Vatandaş sorun bildirimini oluşturur.
2. Bildirime kategori, açıklama, konum ve isteğe bağlı fotoğraf eklenir.
3. Kurum personeli bildirimi inceler.
4. Benzer bildirimler aynı olay altında ilişkilendirilebilir.
5. Olay için öncelik puanı hesaplanır.
6. İlgili birim ve saha personeli görevlendirilir.
7. Saha personeli müdahale sonucunu sisteme kaydeder.
8. Vatandaş bildirimin güncel durumunu takip eder.
9. Yönetici, harita ve grafikler üzerinden genel durumu analiz eder.

## Proje Durumu

🛠️ Proje geliştirme aşamasındadır.

Veritabanı tasarımı, kullanıcı rolleri ve temel uygulama mimarisi oluşturulduktan sonra modüller aşamalı olarak geliştirilecektir.

## Veri Kaynakları

**İlçe ve köy adları** Türkiye İçişleri Bakanlığı'nın [Mülki İdare Bölümleri Envanteri](https://www.e-icisleri.gov.tr/Anasayfa/MulkiIdariBolumleri.aspx)'ne dayanır. Resmî sayfa program aracılığıyla toplu olarak okunamadığından, aynı envanterden derlenen [sabrigunes/turkey-administrative-units-dataset](https://github.com/sabrigunes/turkey-administrative-units-dataset) açık veri seti (CC0 1.0) kullanılmıştır. Veri setinin referans tarihi **Ekim 2025**'tir (depo kaydı `359332c`, 2025-10-06). Veri gerçek zamanlı değildir; bu tarihteki durumu yansıtır.

- Yalnızca **Elazığ** kayıtları içe aktarılmıştır ve yalnızca "köy" sınıfındaki kayıtlar alınmıştır (mahalle, belde ve bağlı yerleşimler dahil değildir).
- Kaynakta adlar büyük harflidir; Türkçe yazım kurallarına göre baş harfi büyük biçime çevrilmiştir. Merkez ilçe `Merkez` olarak tutulur.
- **Nüfus ve koordinat bilgisi bilinçli olarak boş (NULL) bırakılmıştır**; seçilen kaynakta bulunmadığı için uydurulmamıştır. Talebin kesin konumu, vatandaşın tarayıcısından alınan GPS bilgisiyle ayrıca sağlanır.
- İçe aktarma tarihi: 2026-11-03 (`supabase/migrations/005_real_elazig_villages.sql`).

| İlçe | Köy sayısı |
|---|---:|
| Ağın | 16 |
| Alacakaya | 10 |
| Arıcak | 10 |
| Baskil | 60 |
| Karakoçan | 88 |
| Keban | 30 |
| Kovancılar | 76 |
| Maden | 38 |
| Merkez | 132 |
| Palu | 37 |
| Sivrice | 50 |
| **Toplam** | **547** |

**Üretim verisi ile eski geliştirme seed'i:** `supabase/seed/001_demo_villages.sql` sentetik "Örnek Köy NN" kayıtları (uydurma nüfus ve koordinatlarla, `is_demo = true`) üretir ve yalnızca geliştirme/test içindir. Üretim referans verisi 005 numaralı migration ile gelen gerçek köylerdir (`is_demo = false`). Bir talep tarafından kullanılan demo köyler tarihsel bütünlük için silinmez, ancak arayüz `is_demo = true` köyleri yeni talep formunda listelemez.

## Dağıtım (Deployment)

Uygulama **Vercel** üzerinde, GitHub deposundan (`selanurayaz/kirsaliz`) yayımlanır. `main` dalına yapılan her birleştirme otomatik olarak üretime dağıtılır; pull request'ler önizleme dağıtımı alabilir. Dağıtımı Vercel'in GitHub entegrasyonu yapar; GitHub Actions yalnızca lint, tür denetimi, test ve derleme çalıştırır.

| Ayar | Değer |
|---|---|
| Framework Preset | Vite |
| Install Command | `npm install` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

`vercel.json`, React Router'ın istemci tarafı rotaları (ör. `/giris`, `/taleplerim/:id`, `/kurum`) doğrudan açıldığında veya sayfa yenilendiğinde `index.html` döndürür. Vercel önce gerçek dosyaları sunduğu için `/assets/` altındaki dosyalar ve diğer statik dosyalar olduğu gibi yüklenir.

**Ortam değişkenleri** (Vercel → Project Settings → Environment Variables):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Bu değerler yalnızca Vercel panelinde girilir, depoya eklenmez. `.env.local` yerelde kalır ve git tarafından yok sayılır; `.env.example` yalnızca yer tutucu içerir. **Supabase `service_role` anahtarı Vercel'e veya ön yüz koduna asla eklenmemelidir.**

**Supabase ayarı:** Authentication → URL Configuration bölümünde, üretim Vercel adresini (ör. `https://<proje>.vercel.app`) *Site URL* ve *Redirect URLs* listesine ekleyin. Yerel geliştirme için `http://localhost:5173` yönlendirmesini listede tutun.

## Geliştirici

**Selanur Ayaz**  
Yazılım Mühendisliği Öğrencisi

- GitHub: [selanurayaz](https://github.com/selanurayaz)

## Lisans

Bu proje [MIT Lisansı](LICENSE) kapsamında sunulmaktadır.

## Harita verisi ve atıf

Ana sayfadaki Elazığ il sınırı, OpenStreetMap (ilişki 223443) verisinden sadeleştirilmiş yerel bir SVG yoludur. Veri © OpenStreetMap katkıcıları, ODbL 1.0 (https://www.openstreetmap.org/copyright). Fırat–Keban güzergâhı stilize bir çizgidir; idari/navigasyon haritası değildir. Çalışma zamanında harita servisine istek yapılmaz. Bkz. `src/components/geo/elazig-geo.ts`.
