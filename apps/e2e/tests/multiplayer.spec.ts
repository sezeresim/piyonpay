import { test, expect, type Browser } from '@playwright/test'
import { createRoomAsBanker, joinRoomAsPlayer, newCleanPage } from './helpers/session'

async function startTwoPlayerGame(browser: Browser, pin = '2468') {
  const banker = await newCleanPage(browser)
  const player = await newCleanPage(browser)

  const code = await createRoomAsBanker(banker.page, {
    nickname: 'BankerBo',
    roomName: 'Live Table',
    pin,
  })

  await joinRoomAsPlayer(player.page, {
    nickname: 'PlayerPat',
    code,
    pin,
  })

  await expect(banker.page.getByText('PlayerPat')).toBeVisible()
  await expect(player.page.getByText('BankerBo')).toBeVisible()

  await player.page.getByRole('button', { name: 'I am Ready' }).click()
  await expect(player.page.getByRole('button', { name: 'Cancel Ready' })).toBeVisible()
  await expect(banker.page.getByText('Ready').first()).toBeVisible()

  await banker.page.getByRole('button', { name: 'Start Game' }).click()
  await expect(banker.page.getByText('Your balance')).toBeVisible()
  await expect(player.page.getByText('Your balance')).toBeVisible()

  return { banker, player, code, pin }
}

test('second player joins lobby with code and PIN', async ({ browser }) => {
  const banker = await newCleanPage(browser)
  const player = await newCleanPage(browser)
  const pin = '1357'

  const code = await createRoomAsBanker(banker.page, {
    nickname: 'Host',
    roomName: 'Join Spec',
    pin,
  })

  await joinRoomAsPlayer(player.page, {
    nickname: 'Guest',
    code,
    pin,
  })

  await expect(banker.page.getByText(/2\/\d+ players/)).toBeVisible()
  await expect(player.page.getByText('Guest · You')).toBeVisible()
  await expect(player.page.getByText('Host', { exact: true }).first()).toBeVisible()
  await expect(player.page.getByRole('button', { name: 'I am Ready' })).toBeVisible()
  await expect(banker.page.getByRole('button', { name: 'Start Game' })).toBeDisabled()

  await banker.context.close()
  await player.context.close()
})

test('ready + start moves both clients into the game', async ({ browser }) => {
  const { banker, player } = await startTwoPlayerGame(browser)

  await expect(banker.page.getByText('BankerBo · Host')).toBeVisible()
  await expect(player.page.getByText('PlayerPat')).toBeVisible()
  await expect(banker.page.getByRole('tab', { name: 'Transfer' })).toBeVisible()
  await expect(banker.page.getByText('Bank vault')).toBeVisible()

  await banker.context.close()
  await player.context.close()
})

test('player can transfer money to banker', async ({ browser }) => {
  const { banker, player } = await startTwoPlayerGame(browser, '7788')

  // Non-bankers only see the transfer panel (no tabs).
  await player.page.getByRole('button', { name: /BankerBo/ }).click()
  await player.page.locator('form').getByRole('spinbutton').fill('100')
  await player.page.getByRole('button', { name: 'Send', exact: true }).click()

  await expect(player.page.getByText('Payment sent.')).toBeVisible()

  await expectBalanceNear(player.page, 1400)
  await expectBalanceNear(banker.page, 1600)

  await banker.page.getByRole('button', { name: /History/ }).click()
  await expect(banker.page.getByText('PlayerPat → BankerBo')).toBeVisible()

  await banker.context.close()
  await player.context.close()
})

test('banker can issue money from the vault', async ({ browser }) => {
  const { banker, player } = await startTwoPlayerGame(browser, '5566')

  await banker.page.getByRole('tab', { name: 'Bank' }).click()
  await banker.page.getByRole('button', { name: /PlayerPat/ }).click()

  const amountInput = banker.page.locator('form').getByRole('spinbutton')
  await amountInput.fill('250')
  await banker.page.getByRole('button', { name: 'Apply' }).click()

  await expect(banker.page.getByText('Money issued.')).toBeVisible()
  await expectBalanceNear(player.page, 1750)

  await banker.context.close()
  await player.context.close()
})

test('non-banker can leave the room from the menu', async ({ browser }) => {
  const banker = await newCleanPage(browser)
  const player = await newCleanPage(browser)
  const pin = '9090'
  const code = await createRoomAsBanker(banker.page, { nickname: 'StayHost', pin })
  await joinRoomAsPlayer(player.page, { nickname: 'Leaver', code, pin })

  await player.page.getByRole('button', { name: 'Menu' }).click()
  await player.page.getByRole('button', { name: 'Leave room' }).click()

  await expect(player.page.getByText('You left the room.')).toBeVisible()
  await expect(player.page).toHaveURL(/\/$/)
  await expect(banker.page.getByText(/1\/\d+ players/)).toBeVisible()
  await expect(banker.page.getByText('Leaver')).toHaveCount(0)

  await banker.context.close()
  await player.context.close()
})

/** Money uses locale formatting (e.g. 1,500) next to a coin icon. */
async function expectBalanceNear(page: Page, amount: number) {
  const formatted = new Intl.NumberFormat('en', { maximumFractionDigits: 0 }).format(amount)
  await expect(page.getByText(formatted, { exact: true }).first()).toBeVisible()
}
