import { describe, expect, it } from 'vitest'
import { PAGE_MARGIN_CM, pageStyleContent, paperSizeCss } from './paper'

describe('paperSizeCss', () => {
  it('memetakan A4, F4, dan Letter ke nilai CSS @page', () => {
    expect(paperSizeCss('A4')).toBe('A4')
    expect(paperSizeCss('F4')).toBe('215mm 330mm')
    expect(paperSizeCss('Letter')).toBe('Letter')
  })

  it('jatuh ke A4 untuk nilai yang tidak dikenal', () => {
    expect(paperSizeCss('A5' as never)).toBe('A4')
  })
})

describe('pageStyleContent', () => {
  it('menghasilkan aturan @page dengan ukuran dan margin dokumen', () => {
    expect(pageStyleContent('A4')).toBe('@page { size: A4; margin: 2.54cm; }')
    expect(pageStyleContent('F4')).toBe('@page { size: 215mm 330mm; margin: 2.54cm; }')
    expect(PAGE_MARGIN_CM).toBe(2.54)
  })
})
