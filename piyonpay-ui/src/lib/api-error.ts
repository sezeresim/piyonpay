import type { MessageKey } from '@/lib/i18n'

const SERVER_ERROR_MAP: Record<string, MessageKey> = {
  'Room is full.': 'error.roomFull',
  'Game already started.': 'error.gameStarted',
  'At least two ready players are required.': 'error.needReady',
  'Game has not started.': 'error.gameNotStarted',
  'Sender balance is too low.': 'error.senderLow',
  'Request can no longer be completed.': 'error.requestStale',
  'Bank vault balance is too low.': 'error.vaultLow',
  'Target balance is too low.': 'error.targetLow',
  'Player not in room.': 'error.playerNotInRoom',
  'Only banker can perform this action.': 'error.onlyBanker',
  'Room not found.': 'error.roomNotFound',
  'Invalid transfer request.': 'error.invalidTransfer',
  'Invalid banker action.': 'error.invalidBankerAction',
  'Pending request not found.': 'error.pendingNotFound',
  'PIN must be 4 digits.': 'error.pinFormat',
  'Incorrect PIN.': 'error.pinWrong',
  'Room is closed.': 'error.roomClosed',
  'No other players to pay.': 'error.noOtherPlayersPay',
  'No pending requests.': 'error.noPending',
  'Banker must close the room.': 'error.bankerMustClose',
  'Room must be closed first.': 'error.roomMustCloseFirst',
  'This action conflicts with the current room state.': 'error.conflict',
  'Server error. Please try again.': 'error.server',
  'Request failed.': 'error.requestFailed',
  'Invalid server response.': 'error.invalidResponse',
}

export function localizeApiError(
  message: string,
  t: (key: MessageKey) => string,
  fallbackKey: MessageKey = 'common.error',
) {
  const key = SERVER_ERROR_MAP[message]
  return key ? t(key) : message || t(fallbackKey)
}
