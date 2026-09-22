import { describe, expect, it } from 'vitest'
import { appVersion } from './appVersion'

describe('appVersion', () => {
  it('selalu mengembalikan string yang tidak kosong', () => {
    const value = appVersion()
    expect(typeof value).toBe('string')
    expect(value.trim()).not.toBe('')
  })

  it('memakai nilai suntikan build saat tersedia', () => {
    // Vite mengganti ekspresi ini saat build atau dev. Di test nilai bisa 'dev',
    // karena itu pengecekan hanya memastikan bentuknya masuk akal.
    expect(appVersion()).toMatch(/^(\d+\.\d+\.\d+|dev)$/)
  })
})
