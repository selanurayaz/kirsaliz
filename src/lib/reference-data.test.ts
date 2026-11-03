import { beforeEach, describe, expect, it, vi } from 'vitest'

type Call = { method: string; args: unknown[] }

const calls: Call[] = []
let result: { data: unknown; error: unknown } = { data: [], error: null }

function builder() {
  const proxy: Record<string, unknown> = {}
  for (const method of ['select', 'eq', 'order']) {
    proxy[method] = (...args: unknown[]) => {
      calls.push({ method, args })
      return proxy
    }
  }
  proxy.then = (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve)
  return proxy
}

const from = vi.fn((table: string) => {
  calls.push({ method: 'from', args: [table] })
  return builder()
})

vi.mock('@/lib/supabase', () => ({ supabase: { from: (table: string) => from(table) } }))

const { fetchActiveDistricts, fetchVillagesByDistrict, sortByTurkishName } = await import('@/lib/reference-data')

const filters = () => calls.filter((c) => c.method === 'eq').map((c) => c.args)
const orders = () => calls.filter((c) => c.method === 'order').map((c) => c.args[0])

beforeEach(() => {
  calls.length = 0
  result = { data: [], error: null }
})

describe('fetchVillagesByDistrict', () => {
  it('yalnızca seçilen ilçenin, aktif ve demo olmayan köylerini ister', async () => {
    await fetchVillagesByDistrict('district-1')
    expect(calls[0]).toEqual({ method: 'from', args: ['villages'] })
    expect(filters()).toEqual(
      expect.arrayContaining([
        ['district_id', 'district-1'],
        ['is_active', true],
        ['is_demo', false],
      ]),
    )
  })

  it('sıralamayı ad ve kimlikle deterministik yapar', async () => {
    await fetchVillagesByDistrict('district-1')
    expect(orders()).toEqual(['name', 'id'])
  })

  it('sonuçları Türkçe alfabe sırasıyla döner', async () => {
    result = { data: [{ name: 'Zeytinlik' }, { name: 'Çamlık' }, { name: 'Ağaçlı' }, { name: 'Işıklı' }, { name: 'İkizce' }], error: null }
    const villages = await fetchVillagesByDistrict('d')
    expect(villages.map((v) => v.name)).toEqual(['Ağaçlı', 'Çamlık', 'Işıklı', 'İkizce', 'Zeytinlik'])
  })

  it('veritabanı hatasını çağırana fırlatır', async () => {
    result = { data: null, error: new Error('boom') }
    await expect(fetchVillagesByDistrict('d')).rejects.toThrow('boom')
  })
})

describe('fetchActiveDistricts', () => {
  it('yalnızca aktif ilçeleri ister ve Türkçe sıralar', async () => {
    result = { data: [{ name: 'Sivrice' }, { name: 'Ağın' }, { name: 'Karakoçan' }, { name: 'Kovancılar' }], error: null }
    const districts = await fetchActiveDistricts()
    expect(filters()).toContainEqual(['is_active', true])
    expect(districts.map((d) => d.name)).toEqual(['Ağın', 'Karakoçan', 'Kovancılar', 'Sivrice'])
  })
})

describe('sortByTurkishName', () => {
  it('girdi dizisini değiştirmez', () => {
    const input = [{ name: 'b' }, { name: 'a' }]
    sortByTurkishName(input)
    expect(input.map((i) => i.name)).toEqual(['b', 'a'])
  })
})
