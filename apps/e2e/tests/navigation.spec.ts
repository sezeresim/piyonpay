import { test, expect } from '@playwright/test'
import { clearSeatSession, mockApiRoutes, prepareCleanContext } from './helpers/session'

test.beforeEach(async ({ context, page }) => {
  await prepareCleanContext(context)
  await mockApiRoutes(page)
  await clearSeatSession(page)
})

test('bottom nav reaches create, join, and profile', async ({ page }) => {
  await page.getByRole('link', { name: 'Create', exact: true }).click()
  await expect(page).toHaveURL(/\/rooms\/create$/)

  await page.getByRole('link', { name: 'Join', exact: true }).click()
  await expect(page).toHaveURL(/\/rooms\/join$/)

  await page.getByRole('link', { name: 'Profile', exact: true }).click()
  await expect(page).toHaveURL(/\/settings$/)
  await expect(page.getByRole('heading', { name: 'Language' })).toBeVisible()

  await page.getByRole('link', { name: 'Home', exact: true }).click()
  await expect(page).toHaveURL(/\/$/)
})

test('unknown routes redirect home', async ({ page }) => {
  await page.goto('/this-does-not-exist')
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByText('PiyonPay').first()).toBeVisible()
})
