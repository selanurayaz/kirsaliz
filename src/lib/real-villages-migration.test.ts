import { describe, expect, it } from 'vitest'
import sql from '../../supabase/migrations/005_real_elazig_villages.sql?raw'

const ELAZIG_DISTRICTS = [
  'Ağın',
  'Alacakaya',
  'Arıcak',
  'Baskil',
  'Karakoçan',
  'Keban',
  'Kovancılar',
  'Maden',
  'Merkez',
  'Palu',
  'Sivrice',
]

/** Yorum satırları hariç, ('İlçe', 'Köy') çiftlerini okur. */
function readPairs(): Array<[string, string]> {
  const code = sql
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('--'))
    .join('\n')
  return [...code.matchAll(/^\s*\('([^']+)',\s*'([^']+)'\)/gm)].map((m) => [m[1], m[2]])
}

const pairs = readPairs()

describe('005_real_elazig_villages.sql verisi', () => {
  it('köy kayıtları içerir', () => {
    expect(pairs.length).toBeGreaterThan(0)
  })

  it('sentetik "Örnek Köy" adı içermez', () => {
    expect(pairs.filter(([, village]) => /örnek/i.test(village))).toEqual([])
  })

  it('yalnızca bilinen Elazığ ilçelerini kullanır', () => {
    const unknown = pairs.filter(([district]) => !ELAZIG_DISTRICTS.includes(district))
    expect(unknown).toEqual([])
  })

  it('11 ilçenin her birinde en az bir köy vardır', () => {
    for (const district of ELAZIG_DISTRICTS) {
      expect(pairs.some(([d]) => d === district), district).toBe(true)
    }
  })

  it('mükerrer (ilçe, köy) çifti yoktur', () => {
    const seen = new Set<string>()
    const duplicates: string[] = []
    for (const [district, village] of pairs) {
      const key = `${district}|${village}`
      if (seen.has(key)) duplicates.push(key)
      seen.add(key)
    }
    expect(duplicates).toEqual([])
  })

  it('adların başı ve sonu boşluksuzdur, boş ad yoktur', () => {
    for (const [, village] of pairs) {
      expect(village).toBe(village.trim())
      expect(village.length).toBeGreaterThan(0)
    }
  })

  it('Türkçe karakterler bozulmamıştır', () => {
    expect(sql).not.toContain('�')
    expect(sql).not.toMatch(/Ã|Ä|Å/) // UTF-8'in yanlış çözülmesinden kalan izler
    expect(pairs.some(([, v]) => /[çğıöşüÇĞİÖŞÜ]/.test(v))).toBe(true)
    expect(pairs.some(([d]) => d === 'Ağın')).toBe(true)
  })

  it('Türkçe büyük/küçük harf kurallarına uygun yazılmıştır', () => {
    // "I" yalnızca sözcük başında olabilir; sözcük içinde "ı" olmalıdır (ör. "Kovancılar").
    const wrong = pairs.filter(([, v]) => /\p{L}I/u.test(v) || /\p{L}İ/u.test(v) || /^\p{Ll}/u.test(v))
    expect(wrong).toEqual([])
  })

  it('nüfus veya koordinat uydurmaz', () => {
    expect(sql).not.toMatch(/insert into public\.villages \([^)]*(population|latitude|longitude)/)
  })

  it('yalnızca gerçek (demo olmayan) kayıt ekler ve kullanılan demo köyleri korur', () => {
    expect(sql).toMatch(/select d\.id, r\.village_name, false, true/)
    expect(sql).toMatch(/not exists \(select 1 from public\.service_requests/)
    expect(sql).toMatch(/not exists \(select 1 from public\.profiles/)
  })

  it('tek transaction içindedir', () => {
    expect(sql).toMatch(/^begin;$/m)
    expect(sql).toMatch(/^commit;$/m)
  })
})
