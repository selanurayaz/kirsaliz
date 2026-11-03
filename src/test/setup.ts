import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => {
  cleanup()
})

// jsdom, <dialog> öğesinin showModal/close yöntemlerini uygulamaz.
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open')
  }
}

// Önizleme adresleri için gerçek Blob URL'si gerekmez.
if (!URL.createObjectURL) {
  URL.createObjectURL = vi.fn(() => 'blob:test')
}
if (!URL.revokeObjectURL) {
  URL.revokeObjectURL = vi.fn()
}
