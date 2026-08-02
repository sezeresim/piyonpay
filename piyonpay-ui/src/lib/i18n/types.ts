export type Locale = 'en' | 'tr'

export const LOCALES: { id: Locale; label: string; nativeLabel: string }[] = [
  { id: 'en', label: 'English', nativeLabel: 'English' },
  { id: 'tr', label: 'Turkish', nativeLabel: 'Türkçe' },
]

export const LOCALE_STORAGE_KEY = 'piyonpay-locale'

export function detectLocale(): Locale {
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (saved === 'en' || saved === 'tr') return saved
  } catch {
    // ignore
  }
  if (typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('tr')) {
    return 'tr'
  }
  return 'en'
}
