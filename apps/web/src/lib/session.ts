import { DEFAULT_AVATAR_ID, sanitizeAvatarId, type AvatarId } from '@/lib/avatars'

const PLAYER_KEY = 'piyonpay-player'
const TOKEN_KEY = 'piyonpay-token'
const ROOM_KEY = 'piyonpay-room'
const AVATAR_KEY = 'piyonpay-avatar'
const PIN_KEY = 'piyonpay-room-pin'

export function getSavedPlayerId() {
  return localStorage.getItem(PLAYER_KEY) ?? ''
}

export function getSavedPlayerToken() {
  return localStorage.getItem(TOKEN_KEY) ?? ''
}

export function getSavedRoomCode() {
  return localStorage.getItem(ROOM_KEY) ?? ''
}

export function getSavedAvatar(): AvatarId {
  return sanitizeAvatarId(localStorage.getItem(AVATAR_KEY), DEFAULT_AVATAR_ID)
}

export function saveAvatar(avatar: AvatarId) {
  localStorage.setItem(AVATAR_KEY, avatar)
}

export function getSavedRoomPin(roomCode?: string) {
  const code = (roomCode ?? getSavedRoomCode()).toUpperCase()
  if (!code) return ''
  const raw = localStorage.getItem(PIN_KEY)
  if (!raw) return ''
  try {
    const parsed = JSON.parse(raw) as { code?: string; pin?: string }
    if (parsed.code === code && typeof parsed.pin === 'string') return parsed.pin
  } catch {
    /* ignore */
  }
  return ''
}

export function saveSession(
  playerId: string,
  roomCode: string,
  options?: { pin?: string; token?: string },
) {
  const code = roomCode.toUpperCase()
  localStorage.setItem(PLAYER_KEY, playerId)
  localStorage.setItem(ROOM_KEY, code)
  if (options?.token) {
    localStorage.setItem(TOKEN_KEY, options.token)
  }
  if (options?.pin && /^\d{4}$/.test(options.pin)) {
    localStorage.setItem(PIN_KEY, JSON.stringify({ code, pin: options.pin }))
  }
}

export function clearSession() {
  localStorage.removeItem(PLAYER_KEY)
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(ROOM_KEY)
  localStorage.removeItem(PIN_KEY)
}
