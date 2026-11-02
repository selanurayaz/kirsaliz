import { Link } from 'react-router'
import { ROUTES } from '@/lib/constants'

const features = [
  {
    title: 'Konumlu Bildirim',
    description: 'Yol, içme suyu, kanalizasyon ve benzeri altyapı sorunlarını konum bilgisiyle tek noktadan bildirin.',
    icon: 'M12 2C7.6 2 4 5.5 4 9.9 4 15.8 12 22 12 22s8-6.2 8-12.1C20 5.5 16.4 2 12 2zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z',
  },
  {
    title: 'Şeffaf Süreç Takibi',
    description: 'Bildiriminizin hangi aşamada olduğunu, hangi birime yönlendirildiğini anlık olarak izleyin.',
    icon: 'M9 12l2 2 4-4m5 2a8 8 0 1 1-16 0 8 8 0 0 1 16 0z',
  },
  {
    title: 'Karar Desteği',
    description: 'Aciliyet ve etkilenen kişi sayısına göre açıklanabilir önceliklendirme ile kaynaklar doğru yere yönlenir.',
    icon: 'M4 19h16M7 16V9m5 7V5m5 11v-4',
  },
]

const steps = [
  { title: 'Bildirin', description: 'Vatandaş; kategori, açıklama, konum ve isteğe bağlı fotoğrafla sorunu bildirir.' },
  { title: 'Değerlendirilsin', description: 'Kurum personeli bildirimi inceler, benzer bildirimlerle ilişkilendirir ve önceliklendirir.' },
  { title: 'Müdahale Edilsin', description: 'İlgili saha ekibi görevlendirilir ve müdahale sonucu sisteme kaydedilir.' },
  { title: 'Takip Edin', description: 'Vatandaş süreci izler, yöneticiler genel durumu analiz eder.' },
]

const roles = [
  { title: 'Vatandaş', description: 'Sorun bildirimi oluşturur ve süreci takip eder.' },
  { title: 'Kurum Personeli', description: 'Bildirimleri inceler, sınıflandırır ve ilgili birime yönlendirir.' },
  { title: 'Saha Personeli', description: 'Atanan görevleri görüntüler ve müdahale sonucunu kaydeder.' },
  { title: 'Yönetici', description: 'Genel durumu, istatistikleri ve birim performanslarını izler.' },
]

export function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-navy-800 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-500/15 px-3 py-1 text-xs font-semibold tracking-wide text-brand-300 uppercase">
              Kırsal Hizmet Platformu
            </span>
            <h1 className="text-3xl leading-tight font-bold sm:text-4xl lg:text-5xl">
              Köyünüzdeki sorunları <span className="text-brand-400">tek tıkla</span> bildirin, süreci şeffafça takip edin.
            </h1>
            <p className="max-w-xl text-base text-navy-100 sm:text-lg">
              KırsalİZ; kırsal bölgelerdeki altyapı sorunlarının vatandaşlar tarafından bildirilmesini, kurumlar
              tarafından değerlendirilmesini ve saha ekiplerine yönlendirilmesini sağlayan konum tabanlı bir hizmet ve
              karar destek platformudur.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to={ROUTES.register}
                className="rounded-md bg-brand-500 px-6 py-3 text-center text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600"
              >
                Hemen Kayıt Ol
              </Link>
              <Link
                to={ROUTES.login}
                className="rounded-md border border-navy-400 px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-navy-700"
              >
                Giriş Yap
              </Link>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="rounded-2xl border border-navy-600 bg-navy-700/60 p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-navy-100">Örnek Bildirim</p>
                <span className="rounded-full bg-brand-500/20 px-2.5 py-0.5 text-xs font-semibold text-brand-300">
                  İnceleniyor
                </span>
              </div>
              <dl className="space-y-3 text-sm">
                {[
                  ['Kategori', 'İçme Suyu'],
                  ['Konum', 'Örnek Köyü, Merkez Mah.'],
                  ['Etkilenen Kişi', '~120'],
                  ['Öncelik', 'Yüksek'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-navy-600 pb-2 last:border-0">
                    <dt className="text-navy-200">{k}</dt>
                    <dd className="font-medium text-white">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* Özellikler */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-navy-800 sm:text-3xl">Neden KırsalİZ?</h2>
            <p className="mt-3 text-slate-600">
              Vatandaş, kurum ve saha ekipleri arasındaki iletişimi güçlendiren, veriye dayalı bir hizmet yönetimi.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d={f.icon} />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-navy-800">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nasıl Çalışır */}
      <section id="nasil-calisir" className="bg-slate-100 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="mb-12 text-center text-2xl font-bold text-navy-800 sm:text-3xl">Nasıl Çalışır?</h2>
          <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className="rounded-xl bg-white p-6 shadow-sm">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-800 text-sm font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-semibold text-navy-800">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{s.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Hakkında / Roller */}
      <section id="hakkinda" className="bg-white py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-navy-800 sm:text-3xl">Hakkında</h2>
            <p className="text-slate-600">
              KırsalİZ, kırsal bölgelerde yaşanan altyapı sorunlarında hizmet taleplerinin konum, aciliyet ve etkilenen
              kişi sayısına göre daha düzenli yönetilmesini amaçlar. Bildirimler tek merkezde toplanır, müdahale süreci
              takip edilebilir hâle gelir ve yöneticilere veriye dayalı karar desteği sunulur.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {roles.map((r) => (
              <div key={r.title} className="rounded-lg border-l-4 border-brand-500 bg-slate-50 p-4">
                <h3 className="font-semibold text-navy-800">{r.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{r.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-700">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-12 text-center sm:px-6 md:flex-row md:justify-between md:text-left">
          <div>
            <h2 className="text-xl font-bold text-white sm:text-2xl">Köyünüz için bir adım atın.</h2>
            <p className="mt-1 text-brand-100">Ücretsiz hesap oluşturun ve ilk bildiriminizi yapın.</p>
          </div>
          <Link
            to={ROUTES.register}
            className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-brand-800 shadow-sm transition-colors hover:bg-brand-50"
          >
            Kayıt Ol
          </Link>
        </div>
      </section>
    </>
  )
}
