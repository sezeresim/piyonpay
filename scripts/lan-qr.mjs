#!/usr/bin/env node
import os from 'node:os'
import qrcode from 'qrcode-terminal'

const PORT = Number(process.env.PIYONPAY_WEB_PORT || 5173)
const WAIT_MS = Number(process.env.PIYONPAY_QR_WAIT_MS || 90_000)
const shouldWait = process.argv.includes('--wait')

function isPrivateIpv4(address) {
  return (
    address.startsWith('10.') ||
    address.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(address)
  )
}

function listLanIpv4() {
  const nets = os.networkInterfaces()
  const found = []

  for (const [name, addrs] of Object.entries(nets)) {
    for (const addr of addrs ?? []) {
      const family = addr.family
      if (family !== 'IPv4' && family !== 4) continue
      if (addr.internal) continue
      found.push({ name, address: addr.address })
    }
  }

  found.sort((a, b) => {
    const rank = (item) => {
      if (item.name === 'en0') return 0
      if (item.name.startsWith('en')) return 1
      if (isPrivateIpv4(item.address)) return 2
      return 3
    }
    return rank(a) - rank(b) || a.name.localeCompare(b.name)
  })

  return found
}

async function waitUntilReady(localUrl) {
  const deadline = Date.now() + WAIT_MS
  process.stdout.write(`Waiting for ${localUrl}/api/health`)

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${localUrl}/api/health`)
      if (response.ok) {
        process.stdout.write(' — ready\n')
        return
      }
    } catch {
      // still starting
    }
    process.stdout.write('.')
    await new Promise((resolve) => setTimeout(resolve, 1500))
  }

  process.stdout.write('\n')
  throw new Error(`Timed out waiting for UI at ${localUrl}`)
}

function printQr(url) {
  return new Promise((resolve) => {
    qrcode.generate(url, { small: true }, (qr) => {
      console.log(qr)
      resolve()
    })
  })
}

const candidates = listLanIpv4().filter((item) => isPrivateIpv4(item.address))
const primary = candidates[0]

if (!primary) {
  console.error('No LAN IPv4 address found. Connect to Wi‑Fi and retry: pnpm docker:qr')
  process.exit(1)
}

const localUrl = `http://127.0.0.1:${PORT}`
const lanUrl = `http://${primary.address}:${PORT}`

if (shouldWait) {
  await waitUntilReady(localUrl)
}

console.log('')
console.log('PiyonPay is up')
console.log(`  Local:  ${localUrl}`)
console.log(`  LAN:    ${lanUrl}`)
if (candidates.length > 1) {
  console.log('  Other interfaces:')
  for (const item of candidates.slice(1)) {
    console.log(`    - ${item.name}: http://${item.address}:${PORT}`)
  }
}
console.log('')
console.log('Scan on the same Wi‑Fi:')
await printQr(lanUrl)
console.log(`Open: ${lanUrl}`)
console.log('Logs: pnpm docker:logs')
console.log('')
