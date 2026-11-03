import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  NETWORK_ERROR_MESSAGE,
  SESSION_EXPIRED_MESSAGE,
  UserFacingError,
  toUserMessage,
  toWorkflowError,
} from '@/lib/errors'

const FALLBACK = 'Genel hata.'

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('toUserMessage', () => {
  it('UserFacingError mesajını olduğu gibi korur', () => {
    expect(toUserMessage(new UserFacingError('Özel mesaj'), FALLBACK)).toBe('Özel mesaj')
  })

  it.each([
    [{ code: 'PGRST301', message: 'x' }],
    [{ code: 'PGRST303', message: 'x' }],
    [{ status: 401, message: 'x' }],
    [{ message: 'JWT expired' }],
  ])('oturum süresi hatalarını çevirir %#', (error) => {
    expect(toUserMessage(error, FALLBACK)).toBe(SESSION_EXPIRED_MESSAGE)
  })

  it('ağ hatalarını çevirir', () => {
    expect(toUserMessage(new TypeError('Failed to fetch'), FALLBACK)).toBe(NETWORK_ERROR_MESSAGE)
  })

  it('bilinmeyen hatalar için genel mesaj döner ve ham ayrıntıyı göstermez', () => {
    const message = toUserMessage({ code: '42P01', message: 'relation "profiles" does not exist' }, FALLBACK)
    expect(message).toBe(FALLBACK)
    expect(message).not.toContain('profiles')
  })

  it.each([null, undefined, 'metin', 42])('beklenmeyen değerde (%s) çökmez', (value) => {
    expect(toUserMessage(value, FALLBACK)).toBe(FALLBACK)
  })
})

describe('toWorkflowError', () => {
  it('KZ ile başlayan iş kuralı hatalarını Türkçe mesajıyla gösterir', () => {
    const error = toWorkflowError({ code: 'KZ001', message: 'Talep bu durumda atanamaz.' }, FALLBACK)
    expect(error).toBeInstanceOf(UserFacingError)
    expect(error.message).toBe('Talep bu durumda atanamaz.')
  })

  it('diğer PostgreSQL hatalarını genel mesaja çevirir', () => {
    const error = toWorkflowError(
      { code: '23505', message: 'duplicate key value violates unique constraint "x"' },
      FALLBACK,
    )
    expect(error.message).toBe(FALLBACK)
  })

  it('KZ kodlu ama mesajsız hatada genel mesaja döner', () => {
    expect(toWorkflowError({ code: 'KZ002' }, FALLBACK).message).toBe(FALLBACK)
  })

  it('oturum süresi hatasını çevirir', () => {
    expect(toWorkflowError({ code: 'PGRST301', message: 'x' }, FALLBACK).message).toBe(SESSION_EXPIRED_MESSAGE)
  })
})
