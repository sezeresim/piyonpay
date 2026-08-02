import { test, expect } from '@playwright/test'
import {
  clearSeatSession,
  createFormInputs,
  createRoomAsBanker,
  joinFormInputs,
  newCleanPage,
  prepareCleanContext,
} from './helpers/session'

test.beforeEach(async ({ context, page }) => {
  await prepareCleanContext(context)
  await clearSeatSession(page)
})

test('create game button stays disabled until PIN is 4 digits', async ({ page }) => {
  await page.goto('/rooms/create')
  const submit = page.getByRole('button', { name: 'Create Game' })
  await expect(submit).toBeDisabled()

  const { pin } = createFormInputs(page)
  await pin.fill('12')
  await expect(submit).toBeDisabled()

  await pin.fill('1234')
  await expect(submit).toBeEnabled()
})

test('banker can create a room and land in lobby', async ({ page }) => {
  const pin = '4242'
  const code = await createRoomAsBanker(page, {
    nickname: 'HostAda',
    roomName: 'Friday Night',
    pin,
  })

  await expect(page).toHaveURL(new RegExp(`/rooms/${code}$`, 'i'))
  await expect(page.getByRole('heading', { name: 'Friday Night' })).toBeVisible()
  await expect(page.getByText(pin)).toBeVisible()
  await expect(page.getByText('HostAda · You')).toBeVisible()
  await expect(page.getByText('Banker')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Start Game' })).toBeDisabled()
  await expect(page.getByText('Need 2+ players')).toBeVisible()
})

test('home shows continue card after creating a room', async ({ page }) => {
  const code = await createRoomAsBanker(page, { pin: '9999' })

  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'My Games' })).toBeVisible()
  await expect(page.getByText('Active room')).toBeVisible()
  await expect(page.getByText(code)).toBeVisible()
  await expect(page.getByText('Continue')).toBeVisible()

  await page.getByRole('link', { name: /Active room/ }).click()
  await expect(page).toHaveURL(new RegExp(`/rooms/${code}$`, 'i'))
  await expect(page.getByText('Lobby', { exact: true })).toBeVisible()
})

test('wrong join PIN shows an error toast', async ({ browser }) => {
  const banker = await newCleanPage(browser)
  const code = await createRoomAsBanker(banker.page, { pin: '1111' })

  const joiner = await newCleanPage(browser)
  await joiner.page.goto('/rooms/join')
  const inputs = joinFormInputs(joiner.page)
  await inputs.nickname.fill('Intruder')
  await inputs.code.fill(code)
  await inputs.pin.fill('0000')
  await joiner.page.getByRole('button', { name: 'Join' }).click()

  await expect(joiner.page.getByText('Incorrect PIN.')).toBeVisible()
  await expect(joiner.page).toHaveURL(/\/rooms\/join$/)

  await banker.context.close()
  await joiner.context.close()
})
