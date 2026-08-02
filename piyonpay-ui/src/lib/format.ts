function localeTag() {
  if (typeof document !== 'undefined' && document.documentElement.lang) {
    return document.documentElement.lang
  }
  return 'tr-TR'
}

export const formatMoneyValue = (value: number) =>
  new Intl.NumberFormat(localeTag(), { maximumFractionDigits: 0 }).format(value)

/** Plain string with coin mark — for toasts / i18n interpolation */
export const formatMoney = (value: number) => `🪙 ${formatMoneyValue(value)}`

export const formatTime = (value: string) =>
  new Intl.DateTimeFormat(localeTag(), {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
