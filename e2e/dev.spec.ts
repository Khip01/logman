import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('galeri komponen menampilkan seluruh seksi', async ({ page }) => {
  await page.goto('/dev/components')
  await expect(page.getByRole('heading', { name: 'Galeri Komponen' })).toBeVisible()
  for (const section of [
    'button',
    'input-dan-field',
    'kontrol-pilihan',
    'select-dan-combobox',
    'badge-dan-kbd',
    'dialog,-popover,-tooltip',
    'spinner',
    'card',
    'separator',
    'empty-state',
  ]) {
    await expect(page.getByTestId(`galeri-${section}`)).toBeVisible()
  }
})

test('galeri komponen lolos audit aksesibilitas', async ({ page }) => {
  await page.goto('/dev/components')
  await expect(page.getByRole('heading', { name: 'Galeri Komponen' })).toBeVisible()

  const results = await new AxeBuilder({ page }).analyze()
  const serious = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  )
  expect(serious).toEqual([])
})

test('dialog galeri bisa dibuka dan ditutup', async ({ page }) => {
  await page.goto('/dev/components')
  await page.getByRole('button', { name: 'Buka Dialog' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Tutup' }).click()
  await expect(page.getByRole('dialog')).toBeHidden()
})

test('katalog motion menampilkan seluruh preset', async ({ page }) => {
  await page.goto('/dev/motion')
  await expect(page.getByRole('heading', { name: 'Katalog Motion' })).toBeVisible()
  for (const name of [
    'page',
    'overlay',
    'sidebar',
    'staggerList dan listItem',
    'pulse',
    'tierPreview',
  ]) {
    await expect(page.getByTestId(`motion-${name}`)).toBeVisible()
  }
})

test('katalog motion mengikuti tier yang dipilih', async ({ page }) => {
  await page.goto('/dev/motion')
  await page.getByRole('radio', { name: 'Mati' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'mati')
  await expect(page.getByText('Nonaktif di tier ini')).toBeVisible()
})
