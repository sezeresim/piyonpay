import { loadEnv } from './env'

describe('loadEnv', () => {
  it('applies defaults when optional vars are missing', () => {
    const env = loadEnv({
      MONGODB_URI: 'mongodb://127.0.0.1:27018/piyonpay',
    })
    expect(env.PORT).toBe(3000)
    expect(env.ROOM_TTL_HOURS).toBe(24)
    expect(env.ROOM_ADMIN_HOLD_MINUTES).toBe(15)
  })

  it('coerces numeric string env vars', () => {
    const env = loadEnv({
      MONGODB_URI: 'mongodb://mongo:27017/piyonpay',
      PORT: '4000',
      ROOM_TTL_HOURS: '12',
      ROOM_ADMIN_HOLD_MINUTES: '30',
    })
    expect(env.PORT).toBe(4000)
    expect(env.ROOM_TTL_HOURS).toBe(12)
    expect(env.ROOM_ADMIN_HOLD_MINUTES).toBe(30)
  })

  it('rejects invalid PORT', () => {
    expect(() =>
      loadEnv({
        MONGODB_URI: 'mongodb://127.0.0.1:27018/piyonpay',
        PORT: 'not-a-number',
      }),
    ).toThrow(/Invalid environment variables/)
  })
})
