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

## Geliştirici

**Selanur Ayaz**  
Yazılım Mühendisliği Öğrencisi

- GitHub: [selanurayaz](https://github.com/selanurayaz)

## Lisans

Bu proje [MIT Lisansı](LICENSE) kapsamında sunulmaktadır.
