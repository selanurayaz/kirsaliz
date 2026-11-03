import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ImageUploader } from '@/components/ImageUploader'
import { IMAGE_LIMITS } from '@/lib/service-request-config'

function makeFile(name: string, type: string, size = 1000, lastModified = 1): File {
  const file = new File(['x'], name, { type, lastModified })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

function Harness({ initial = [] }: { initial?: File[] }) {
  const [files, setFiles] = useState<File[]>(initial)
  return <ImageUploader files={files} onChange={setFiles} />
}

// accept filtresi tarayıcıda uygulanır; bileşenin kendi doğrulamasını sınamak için kapatılır.
const user = () => userEvent.setup({ applyAccept: false })

let createObjectURL: ReturnType<typeof vi.fn>
let revokeObjectURL: ReturnType<typeof vi.fn>

beforeEach(() => {
  let counter = 0
  createObjectURL = vi.fn(() => `blob:preview-${++counter}`)
  revokeObjectURL = vi.fn()
  URL.createObjectURL = createObjectURL as unknown as typeof URL.createObjectURL
  URL.revokeObjectURL = revokeObjectURL as unknown as typeof URL.revokeObjectURL
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ImageUploader', () => {
  it('erişilebilir dosya alanı ve düğme sunar', () => {
    render(<Harness />)
    expect(screen.getByLabelText('Fotoğraf dosyaları')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fotoğraf Seç' })).toBeEnabled()
  })

  it.each(['image/jpeg', 'image/png', 'image/webp'])('%s dosyasını kabul eder', async (type) => {
    render(<Harness />)
    await user().upload(screen.getByLabelText('Fotoğraf dosyaları'), makeFile('foto', type))
    expect(await screen.findByAltText('Seçilen fotoğraf: foto')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('desteklenmeyen türü hata mesajıyla reddeder', async () => {
    render(<Harness />)
    await user().upload(screen.getByLabelText('Fotoğraf dosyaları'), makeFile('belge.pdf', 'application/pdf'))
    expect(screen.getByRole('alert')).toHaveTextContent('desteklenmeyen')
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('5 MB üstü dosyayı reddeder', async () => {
    render(<Harness />)
    await user().upload(
      screen.getByLabelText('Fotoğraf dosyaları'),
      makeFile('buyuk.png', 'image/png', IMAGE_LIMITS.maxBytes + 1),
    )
    expect(screen.getByRole('alert')).toHaveTextContent('5 MB')
  })

  it('en fazla üç fotoğrafa izin verir ve sınırda düğmeyi devre dışı bırakır', async () => {
    render(<Harness />)
    const input = screen.getByLabelText('Fotoğraf dosyaları')
    await user().upload(input, [
      makeFile('a', 'image/png', 100, 1),
      makeFile('b', 'image/png', 100, 2),
      makeFile('c', 'image/png', 100, 3),
    ])
    expect(await screen.findAllByRole('img')).toHaveLength(3)
    expect(screen.getByRole('button', { name: 'Fotoğraf sınırına ulaşıldı' })).toBeDisabled()
    expect(input).toBeDisabled()
  })

  it('fazla dosya seçilirse yalnızca sınıra kadarını ekler ve uyarır', async () => {
    render(<Harness />)
    await user().upload(screen.getByLabelText('Fotoğraf dosyaları'), [
      makeFile('a', 'image/png', 100, 1),
      makeFile('b', 'image/png', 100, 2),
      makeFile('c', 'image/png', 100, 3),
      makeFile('d', 'image/png', 100, 4),
    ])
    expect(await screen.findAllByRole('img')).toHaveLength(3)
    expect(screen.getByRole('alert')).toHaveTextContent(`${IMAGE_LIMITS.maxCount}`)
  })

  it('seçilen fotoğrafı kaldırır ve önizleme adresini serbest bırakır', async () => {
    render(<Harness />)
    await user().upload(screen.getByLabelText('Fotoğraf dosyaları'), makeFile('foto.png', 'image/png'))
    await screen.findByAltText('Seçilen fotoğraf: foto.png')

    await userEvent.click(screen.getByRole('button', { name: 'foto.png fotoğrafını kaldır' }))

    expect(screen.queryByAltText('Seçilen fotoğraf: foto.png')).not.toBeInTheDocument()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview-1')
  })

  it('bileşen kaldırılınca önizleme adreslerini serbest bırakır', async () => {
    const { unmount } = render(<Harness initial={[makeFile('a.png', 'image/png')]} />)
    await screen.findByAltText('Seçilen fotoğraf: a.png')
    const created = createObjectURL.mock.results.map((r) => r.value as string)
    unmount()
    for (const url of created) expect(revokeObjectURL).toHaveBeenCalledWith(url)
  })
})
