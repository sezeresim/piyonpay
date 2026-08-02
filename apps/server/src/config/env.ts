import { z } from 'zod'

const envSchema = z.object({
  MONGODB_URI: z
    .string()
    .min(1)
    .default('mongodb://127.0.0.1:27019/piyonpay?directConnection=true'),
  PORT: z.coerce.number().int().positive().default(3000),
  ROOM_TTL_HOURS: z.coerce.number().positive().default(24),
  ROOM_ADMIN_HOLD_MINUTES: z.coerce.number().positive().default(15),
  THROTTLE_TTL_MS: z.coerce.number().int().positive().default(60_000),
  /** Set to 0 to disable HTTP rate limiting (useful for e2e). */
  THROTTLE_LIMIT: z.coerce.number().int().nonnegative().default(60),
  THROTTLE_TRANSFER_LIMIT: z.coerce.number().int().nonnegative().default(20),
})

export type Env = z.infer<typeof envSchema>

let cached: Env | null = null

/** Validate process.env once at startup; fail fast on bad config. */
export function loadEnv(env: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(env)
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('\n')
    throw new Error(`Invalid environment variables:\n${details}`)
  }
  cached = result.data
  return result.data
}

export function getEnv(): Env {
  if (!cached) {
    return loadEnv()
  }
  return cached
}
