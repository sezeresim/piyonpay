export const AVATAR_IDS = [
  'fox',
  'owl',
  'lion',
  'panda',
  'frog',
  'unicorn',
  'robot',
  'alien',
  'cat',
  'dog',
  'dragon',
  'crown',
] as const

export type AvatarId = (typeof AVATAR_IDS)[number]

export const DEFAULT_AVATAR_ID: AvatarId = 'fox'

export function isAvatarId(value: unknown): value is AvatarId {
  return typeof value === 'string' && (AVATAR_IDS as readonly string[]).includes(value)
}

export function sanitizeAvatarId(value: unknown, fallback: AvatarId = DEFAULT_AVATAR_ID): AvatarId {
  return isAvatarId(value) ? value : fallback
}
