import { test, expect } from '@playwright/test'
import { clearSeatSession, mockApiRoutes, prepareCleanContext } from './helpers/session'

test.beforeEach(async ({ context, page }) => {
  await prepareCleanContext(context)
  await mockApiRoutes(page)
  await clearSeatSession(page)
})

test('home shows brand and primary actions', async ({ page }) => {
  await expect(page.getByText('PiyonPay').first()).toBeVisible()
  await expect(page.getByText('Digital game bank').first()).toBeVisible()
  await expect(page.getByRole('link', { name: 'Create Game' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Join Game' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'My Games' })).toBeVisible()
  await expect(page.getByText('No active games yet')).toBeVisible()
})

test('create and join shortcuts navigate correctly', async ({ page }) => {
  await page.getByRole('link', { name: 'Create Game' }).click()
  await expect(page).toHaveURL(/\/rooms\/create$/)
  await expect(page.getByText('Create Game').first()).toBeVisible()

  await page.getByRole('link', { name: 'Home', exact: true }).click()
  await page.getByRole('link', { name: 'Join Game' }).click()
  await expect(page).toHaveURL(/\/rooms\/join$/)
  await expect(page.getByText('Join Game').first()).toBeVisible()
})
