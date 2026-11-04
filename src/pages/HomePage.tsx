import { Link } from 'react-router'
import { ArrowRight, CheckCircle2, MapPinned, Route as RouteIcon, Wrench } from 'lucide-react'
import { ElazigMapVisual } from '@/components/geo/ElazigMapVisual'
import { RiverScrollStory } from '@/components/geo/RiverScrollStory'
import { WorkflowRiverStop } from '@/components/geo/WorkflowRiverStop'
import { ELAZIG_GEO_ATTRIBUTION } from '@/components/geo/elazig-geo'
import { ROUTES } from '@/lib/constants'

const values = [
  ['Konumlu bildirim', 'Her talep bir ilçe ve köye bağlanır; isterseniz cihaz konumunuz da eklenir.'],
  ['Şeffaf durum takibi', 'Talebiniz alındı, incelemede, görevlendirildi ya da çözüldü: aşamayı her an görürsünüz.'],
  ['Doğru birime yönlendirme', 'Her talep kategorisi sorumlu birime bağlıdır; talep o birimin yetkilisine ulaşır.'],
  ['Saha personeli akışı', 'Birim yetkilisi talebi saha personeline atar; personel işe başlar ve sonucu kaydeder.'],
  ['Kayıtlı durum geçmişi', 'Her geçiş tarih ve notuyla saklanır; talep sahibi geçmişi sonradan da görebilir.'],
] as const

const handoffs = [
  {
    role: 'Vatandaş',
    does: 'Sorunu bildirir, talebini ve geçmişini izler; gerekirse talebini iptal eder.',
    next: 'Talep, kategorisine bağlı birime düşer.',
  },
  {
    role: 'Birim yetkilisi',
    does: 'Biriminin taleplerini inceler; kabul eder veya gerekçesiyle reddeder.',
    next: 'Kabul edilen talebi saha personeline atar.',
  },
  {
    role: 'Saha personeli',
    does: 'Kendisine atanan işi başlatır ve çözüm notunu kaydeder.',
    next: 'Sonuç, vatandaşın durum geçmişinde görünür.',
  },
  {
    role: 'Yönetici',
    does: 'Kullanıcı rollerini ve birim atamalarını yönetir; hesapları etkinleştirir veya pasifleştirir.',
    next: null,
  },
] as const

/** Bölüm girişi: geniş ekranda nehrin sol yakasında, sağa yaslı; nehir metnin üzerinden geçmez. */
function SectionIntro({ title, children }: { title: string; children: string }) {
  return (
    <div className="mb-10 max-md:pl-10 md:grid md:grid-cols-[1fr_3rem_1fr] md:gap-x-8">
      <div className="max-w-xl md:max-w-md md:justify-self-end md:text-right">
        <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
        <p className="mt-4 text-base text-navy-muted">{children}</p>
      </div>
    </div>
  )
}

/** Yalnızca küçük ekranda nehrin yanındaki metni sağa iter (nehir sol kenarda aktığı için). */
const CLEAR_RIVER = 'max-md:pl-10'

export function HomePage() {
  return (
    <>
      {/* Hero: tek baskın görsel — Elazığ ve Fırat; nehir haritadan sayfaya akar */}
      <section className="overflow-hidden bg-primary-dark text-white">
        <div className="page-container grid items-center gap-8 pt-12 pb-14 sm:pt-16 lg:grid-cols-[5fr_6fr] lg:gap-6 lg:pt-20 lg:pb-16">
          <div className="max-w-xl">
            <h1 className="text-[2rem] leading-[1.1] font-extrabold tracking-tight !text-white sm:text-5xl">
              Köyünüzdeki sorun, doğru birime ulaşsın.
            </h1>
            <p className="mt-5 text-lg text-primary-soft">
              Elazığ’daki köy ve mahallelerde yol, su ve altyapı sorunlarını konumuyla bildirin; talebinizin her aşamasını
              takip edin.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Link to={ROUTES.register} className="btn btn-lg btn-on-dark">
                Talep oluşturmak için kayıt olun <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                to={ROUTES.login}
                className="rounded-sm text-base font-semibold text-white underline decoration-white/40 underline-offset-4 hover:decoration-white focus-visible:outline-white"
              >
                Hesabım var, giriş yap
              </Link>
            </div>
          </div>

          <div className="ml-auto w-full max-w-sm sm:max-w-md lg:max-w-none lg:translate-x-6">
            <ElazigMapVisual />
          </div>
        </div>
      </section>

      <RiverScrollStory>
        {/* Değer: kartsız, editoryal liste; nehir iki sütunun arasından geçer */}
        <section className="bg-white py-14 sm:py-20">
          <div className="page-container grid gap-8 md:grid-cols-[1fr_3rem_1fr] md:gap-x-8">
            <div className={`${CLEAR_RIVER} md:max-w-md md:justify-self-end md:self-start md:pl-0 md:text-right md:sticky md:top-24`}>
              <h2 className="text-3xl font-bold tracking-tight">Bildirimden çözüme kadar kayıt altında</h2>
              <p className="mt-4 text-base text-navy-muted">
                KırsalİZ, kırsaldaki hizmet taleplerinin kaybolmamasını sağlar: kim, nerede, neyi bildirdi ve talep şimdi
                hangi aşamada — hepsi tek yerde.
              </p>
            </div>
            <dl className={`${CLEAR_RIVER} divide-y divide-line border-y border-line md:col-start-3 md:pl-0`}>
              {values.map(([title, text]) => (
                <div key={title} className="py-4">
                  <dt className="font-semibold text-primary">{title}</dt>
                  <dd className="mt-1 text-base text-navy-muted">{text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Nehir iş akışı */}
        <section id="nasil-calisir" className="bg-page py-14 sm:py-20">
          <div className="page-container">
            <SectionIntro title="Bir talep nehir gibi akar">
              Bildirimden çözüme kadar dört durak. Her durak uygulamadaki gerçek bir aşamadır.
            </SectionIntro>

            <ol aria-label="Talep akışının dört durağı" className="relative">
              <WorkflowRiverStop title="Sorunu Bildir" actor="Vatandaş" icon={MapPinned} side="left">
                <p>İlçe ve köyü seçin, kategoriyi belirleyin, sorunu anlatın; dilerseniz konum ve fotoğraf ekleyin.</p>
                <p>Talebiniz bir takip koduyla kaydedilir.</p>
              </WorkflowRiverStop>
              <WorkflowRiverStop title="İlgili Birime Yönlendir" actor="Birim yetkilisi" icon={RouteIcon} side="right">
                <p>Talep, kategorisine bağlı birimin önüne düşer. Yetkili talebi inceler, kabul eder ya da gerekçesiyle reddeder.</p>
              </WorkflowRiverStop>
              <WorkflowRiverStop title="Sahada Müdahale Et" actor="Saha personeli" icon={Wrench} side="left">
                <p>Kabul edilen talep birimdeki bir saha personeline atanır. Personel işi başlatır ve ilerlemeyi not düşer.</p>
              </WorkflowRiverStop>
              <WorkflowRiverStop title="Çözümü Takip Et" actor="Vatandaş" icon={CheckCircle2} side="right">
                <p>Çözüm kaydedildiğinde talep kapanır. Durum geçmişinde her aşamayı tarihi ve notuyla görebilirsiniz.</p>
              </WorkflowRiverStop>
            </ol>
          </div>
        </section>

        {/* Roller: nehrin iki yakasında devir zinciri */}
        <section id="hakkinda" className="bg-white pt-14 pb-16 sm:pt-20 sm:pb-24">
          <div className="page-container">
            <SectionIntro title="Talep elden ele ilerler">
              Her rol yalnızca kendi işini görür ve talebi bir sonraki role devreder. Herkes yalnızca yetkisi olan bilgilere erişir.
            </SectionIntro>

            <ol aria-label="Roller ve devir sırası">
              {handoffs.map((h, i) => (
                <li
                  key={h.role}
                  className="grid grid-cols-[2.5rem_1fr] gap-x-4 pb-8 last:pb-0 md:grid-cols-[1fr_3rem_1fr] md:gap-x-8"
                >
                  <span aria-hidden="true" className="relative z-10 flex h-10 justify-center pt-2 md:col-start-2">
                    <span
                      className={`h-4 w-4 rounded-full border-4 border-white ring-2 ${
                        h.next ? 'bg-primary ring-primary' : 'bg-navy ring-navy'
                      }`}
                    />
                  </span>
                  <div
                    className={`col-start-2 min-w-0 md:row-start-1 ${
                      i % 2 === 0 ? 'md:col-start-1 md:text-right' : 'md:col-start-3'
                    }`}
                  >
                    <h3 className="text-xl font-bold text-navy">{h.role}</h3>
                    <p className="mt-1 max-w-md text-base text-navy-muted md:inline-block">{h.does}</p>
                    {h.next && (
                      <p className={`mt-2 flex items-start gap-2 text-base font-medium text-navy ${i % 2 === 0 ? 'md:justify-end' : ''}`}>
                        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-primary md:hidden" aria-hidden="true" />
                        <span className="max-w-md">{h.next}</span>
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </RiverScrollStory>

      {/* Kapanış: nehir çözüme ulaşır */}
      <section className="relative bg-primary-dark text-white">
        <span
          aria-hidden="true"
          className="absolute top-0 left-9 z-10 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white bg-water text-white md:left-1/2"
        >
          <CheckCircle2 className="h-6 w-6" />
        </span>
        <div className="page-container flex flex-col gap-6 pt-16 pb-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl max-md:pl-10">
            <h2 className="text-3xl font-bold tracking-tight !text-white">Sorunu bildirin, yolculuğunu izleyin.</h2>
            <p className="mt-3 text-lg text-primary-soft">
              Hesap oluşturun, ilk talebinizi iletin ve çözüme kadar her adımı görün.
            </p>
          </div>
          <Link to={ROUTES.register} className="btn btn-lg btn-on-dark shrink-0 max-md:ml-10">
            Kayıt Ol <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <p className="page-container pb-5 text-sm text-primary-border">
          Elazığ sınırı: {ELAZIG_GEO_ATTRIBUTION}. KırsalİZ bağımsız bir yazılım çalışmasıdır ve bir kamu kurumunun resmî
          hizmeti değildir.
        </p>
      </section>
    </>
  )
}
