import { beforeEach, describe, expect, it, vi } from 'vitest'
import { IMAGE_LIMITS } from '@/lib/service-request-config'

const upload = vi.fn()
vi.mock('@/lib/supabase', () => ({
  supabase: {
    storage: { from: () => ({ upload, remove: vi.fn() }) },
    from: vi.fn(),
  },
}))

const { IMAGE_UPLOAD_ERROR, formatFileSize, uploadRequestImages, validateImageFiles } = await import(
  '@/lib/service-requests'
)

function makeFile(name: string, type: string, size: number, lastModified = 1): File {
  const file = new File(['x'], name, { type, lastModified })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('formatFileSize', () => {
  it('1 MB altını KB olarak gösterir', () => {
    expect(formatFileSize(500)).toBe('1 KB')
    expect(formatFileSize(2048)).toBe('2 KB')
  })

  it('1 MB ve üstünü MB olarak gösterir', () => {
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB')
  })
})

describe('validateImageFiles', () => {
  it.each([...IMAGE_LIMITS.mimeTypes])('%s dosyasını kabul eder', (type) => {
    const { accepted, errors } = validateImageFiles([], [makeFile('a', type, 1000)])
    expect(accepted).toHaveLength(1)
    expect(errors).toEqual([])
  })

  it('desteklenmeyen türü reddeder', () => {
    const { accepted, errors } = validateImageFiles([], [makeFile('a.gif', 'image/gif', 1000)])
    expect(accepted).toEqual([])
    expect(errors[0]).toContain('desteklenmeyen')
  })

  it('tam 5 MB dosyayı kabul eder', () => {
    expect(validateImageFiles([], [makeFile('a', 'image/png', IMAGE_LIMITS.maxBytes)]).accepted).toHaveLength(1)
  })

  it('5 MB üstü dosyayı reddeder', () => {
    const { accepted, errors } = validateImageFiles([], [makeFile('a', 'image/png', IMAGE_LIMITS.maxBytes + 1)])
    expect(accepted).toEqual([])
    expect(errors[0]).toContain('5 MB')
  })

  it('boş dosyayı reddeder', () => {
    expect(validateImageFiles([], [makeFile('a', 'image/png', 0)]).errors[0]).toContain('boş')
  })

  it('tam 3 fotoğrafa izin verir, dördüncüyü reddeder', () => {
    const three = [1, 2, 3].map((i) => makeFile(`f${i}`, 'image/png', 100, i))
    const ok = validateImageFiles([], three)
    expect(ok.accepted).toHaveLength(3)
    expect(ok.errors).toEqual([])

    const over = validateImageFiles(ok.accepted, [makeFile('f4', 'image/png', 100, 4)])
    expect(over.accepted).toEqual([])
    expect(over.errors[0]).toContain(`${IMAGE_LIMITS.maxCount}`)
  })

  it('aynı dosyayı ikinci kez eklemez', () => {
    const file = makeFile('a', 'image/png', 100)
    expect(validateImageFiles([file], [makeFile('a', 'image/png', 100)]).accepted).toEqual([])
  })

  it('boş seçimde hata üretmez', () => {
    expect(validateImageFiles([], [])).toEqual({ accepted: [], errors: [] })
  })
})

describe('uploadRequestImages', () => {
  beforeEach(() => {
    upload.mockReset()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('yükleme hatasında anlaşılır bir mesaj döner ve ham ayrıntıyı sızdırmaz', async () => {
    upload.mockResolvedValue({ error: { message: 'bucket policy violation: secret detail' } })
    const result = await uploadRequestImages('req', 'user', [makeFile('a.png', 'image/png', 100)])
    expect(result.attachments).toEqual([])
    expect(result.failures).toEqual([{ fileName: 'a.png', message: IMAGE_UPLOAD_ERROR }])
    expect(JSON.stringify(result)).not.toContain('secret detail')
  })

  it('geçersiz türü yüklemeden önce reddeder', async () => {
    const result = await uploadRequestImages('req', 'user', [makeFile('a.gif', 'image/gif', 100)])
    expect(upload).not.toHaveBeenCalled()
    expect(result.failures).toHaveLength(1)
  })
})
