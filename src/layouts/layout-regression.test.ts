import { describe, expect, it } from 'vitest'
import newRequestSource from '@/pages/NewRequestPage.tsx?raw'
import authLayoutSource from '@/layouts/AuthLayout.tsx?raw'
import mainLayoutSource from '@/layouts/MainLayout.tsx?raw'

describe('düzen gerileme korumaları', () => {
  it('fieldset başlıkları (legend) yüzdürülmez: yüzen tam genişlikli legend içeriği dar sütuna iter', () => {
    expect(newRequestSource).not.toMatch(/<legend[^>]*\bfloat-/)
    expect(newRequestSource).toMatch(/<legend className="form-legend">/)
  })

  it('talep formu bölümleri fieldset içinde tam genişlikli bir kart gövdesi kullanır', () => {
    const bodies = newRequestSource.match(/<div className="card card-body min-w-0 space-y-4">/g) ?? []
    expect(bodies).toHaveLength(newRequestSource.match(/<fieldset/g)?.length ?? -1)
  })

  it('auth düzeni kabuk içinde kalan yüksekliği doldurur (marka paneli erken bitmez)', () => {
    expect(mainLayoutSource).toMatch(/<main className="flex flex-1 flex-col">/)
    expect(authLayoutSource).toMatch(/<section className="grid flex-1 /)
  })
})
