import { test, expect } from '@playwright/test'
import { clearSeatSession, prepareCleanContext } from './helpers/session'

test.beforeEach(async ({ context, page }) => {
  await prepareCleanContext(context)
  await clearSeatSession(page)
})

test('language switch updates UI strings', async ({ page }) => {
  await page.goto('/settings')
  await expect(page.getByRole('heading', { name: 'Language' })).toBeVisible()

  await page.getByRole('button', { name: /Türkçe/ }).click()
  await expect(page.getByText('Dil güncellendi.')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Dil' })).toBeVisible()

  await page.getByRole('link', { name: 'Ana sayfa', exact: true }).click()
  await expect(page.getByRole('link', { name: 'Oyun Kur' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Oyuna Katıl' })).toBeVisible()
})
