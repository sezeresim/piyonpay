import type { Browser, BrowserContext, Page, Route } from '@playwright/test'
import { expect } from '@playwright/test'

/** Keep UI in English for stable selectors. */
export async function prepareCleanContext(context: BrowserContext) {
  await context.addInitScript(() => {
    localStorage.setItem('piyonpay-locale', 'en')
  })
}

/** Isolated browser context with a clean English seat session. */
export async function newCleanPage(browser: Browser) {
  const context = await browser.newContext()
  await prepareCleanContext(context)
  const page = await context.newPage()
  await clearSeatSession(page)
  return { context, page }
}

/** Stub REST API for UI-only specs (navigation / home / settings). */
export async function mockApiRoutes(page: Page) {
  await page.route('**/api/**', async (route: Route) => {
    const url = route.request().url()
    if (url.includes('/api/health')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, mongo: 'up' }),
      })
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    })
  })
}

/** Wipe seat session once (not on every navigation). */
export async function clearSeatSession(page: Page) {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.removeItem('piyonpay-player')
    localStorage.removeItem('piyonpay-token')
    localStorage.removeItem('piyonpay-room')
    localStorage.removeItem('piyonpay-room-pin')
    localStorage.setItem('piyonpay-locale', 'en')
  })
  await page.reload()
  await page.getByText('PiyonPay').first().waitFor()
}

export async function gotoHome(page: Page) {
  await page.goto('/')
  await page.getByText('PiyonPay').first().waitFor()
}

/** Field labels are not wired with htmlFor — locate inputs by form order. */
export function createFormInputs(page: Page) {
  const form = page.locator('form')
  const textboxes = form.getByRole('textbox')
  const numbers = form.getByRole('spinbutton')
  return {
    nickname: textboxes.nth(0),
    roomName: textboxes.nth(1),
    pin: textboxes.nth(2),
    initialBalance: numbers.nth(0),
    bankBalance: numbers.nth(1),
  }
}

export function joinFormInputs(page: Page) {
  const form = page.locator('form')
  return {
    nickname: form.getByRole('textbox').nth(0),
    code: form.getByPlaceholder('7X2K9B'),
    pin: form.getByPlaceholder('••••'),
  }
}

export async function createRoomAsBanker(
  page: Page,
  options: {
    nickname?: string
    roomName?: string
    pin: string
  },
) {
  await page.goto('/rooms/create')
  const inputs = createFormInputs(page)
  await inputs.nickname.fill(options.nickname ?? 'Banker')
  await inputs.roomName.fill(options.roomName ?? 'E2E Table')
  await inputs.pin.fill(options.pin)
  await page.getByRole('button', { name: 'Create Game' }).click()
  await page.waitForURL(/\/rooms\/[A-Z0-9]{6}$/i)
  await expect(page.getByText('Lobby', { exact: true })).toBeVisible()
  const code = page.url().split('/').pop()?.toUpperCase() ?? ''
  expect(code).toMatch(/^[A-Z0-9]{6}$/)
  return code
}

export async function joinRoomAsPlayer(
  page: Page,
  options: { nickname: string; code: string; pin: string },
) {
  await page.goto('/rooms/join')
  const inputs = joinFormInputs(page)
  await inputs.nickname.fill(options.nickname)
  await inputs.code.fill(options.code)
  await inputs.pin.fill(options.pin)
  await expect(page.getByRole('button', { name: 'Join' })).toBeEnabled()
  await page.getByRole('button', { name: 'Join' }).click()
  await page.waitForURL(new RegExp(`/rooms/${options.code}$`, 'i'))
  await expect(page.getByText('Lobby', { exact: true })).toBeVisible()
}
