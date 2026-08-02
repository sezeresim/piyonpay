export const API_BASE = import.meta.env.VITE_API_BASE ?? ''

// Prefer same hostname as the page so phones on LAN hit the host machine, not 127.0.0.1.
// Override with VITE_SOCKET_BASE when the API is on another host/port.
function defaultSocketBase() {
  if (import.meta.env.VITE_SOCKET_BASE) return import.meta.env.VITE_SOCKET_BASE as string
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:3000`
  }
  return API_BASE
}

export const SOCKET_BASE = defaultSocketBase()

function readApiErrorMessage(data: unknown, status: number): string {
  if (data && typeof data === 'object') {
    const body = data as { message?: unknown; error?: unknown }
    if (typeof body.message === 'string' && body.message.trim()) {
      return body.message
    }
    if (Array.isArray(body.message)) {
      const parts = body.message.filter((item): item is string => typeof item === 'string')
      if (parts.length > 0) return parts.join(' ')
    }
    if (
      typeof body.error === 'string' &&
      body.error.trim() &&
      !['Conflict', 'Bad Request', 'Forbidden', 'Not Found', 'Unauthorized'].includes(body.error)
    ) {
      return body.error
    }
  }

  if (status === 409) return 'This action conflicts with the current room state.'
  if (status >= 500) return 'Server error. Please try again.'
  return 'Request failed.'
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  let data: unknown = null
  try {
    data = await response.json()
  } catch {
    if (!response.ok) {
      throw new Error(readApiErrorMessage(null, response.status))
    }
    throw new Error('Invalid server response.')
  }

  if (!response.ok) {
    throw new Error(readApiErrorMessage(data, response.status))
  }

  return data as T
}
