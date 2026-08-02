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

export type AvatarOption = {
  id: AvatarId
  emoji: string
  hue: number
}

/** Curated playful set — no uploads, works everywhere. */
export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: 'fox', emoji: '🦊', hue: 55 },
  { id: 'owl', emoji: '🦉', hue: 80 },
  { id: 'lion', emoji: '🦁', hue: 75 },
  { id: 'panda', emoji: '🐼', hue: 260 },
  { id: 'frog', emoji: '🐸', hue: 140 },
  { id: 'unicorn', emoji: '🦄', hue: 310 },
  { id: 'robot', emoji: '🤖', hue: 210 },
  { id: 'alien', emoji: '👽', hue: 130 },
  { id: 'cat', emoji: '🐱', hue: 40 },
  { id: 'dog', emoji: '🐶', hue: 50 },
  { id: 'dragon', emoji: '🐲', hue: 150 },
  { id: 'crown', emoji: '👑', hue: 90 },
]

export function isAvatarId(value: unknown): value is AvatarId {
  return typeof value === 'string' && (AVATAR_IDS as readonly string[]).includes(value)
}

export function sanitizeAvatarId(value: unknown, fallback: AvatarId = DEFAULT_AVATAR_ID): AvatarId {
  return isAvatarId(value) ? value : fallback
}

export function getAvatarOption(id?: string | null): AvatarOption {
  const safe = sanitizeAvatarId(id)
  return AVATAR_OPTIONS.find((item) => item.id === safe) ?? AVATAR_OPTIONS[0]
}
