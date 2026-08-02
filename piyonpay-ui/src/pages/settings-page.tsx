import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { AppShell } from '@/components/app-shell'
import { BrandMark } from '@/components/illustrations'
import { PageMotion } from '@/components/page-motion'
import { Button } from '@/components/ui/button'
import { LOCALES, useLocale, messages } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export function SettingsPage() {
  const { locale, setLocale, t } = useLocale()

  return (
    <AppShell title={t('settings.title')}>
      <PageMotion className="flex flex-1 flex-col gap-5">
        <section className="rounded-[1.75rem] border border-border/50 bg-card/80 p-5 text-center">
          <BrandMark size="xl" className="mx-auto rounded-[1.35rem]" />
          <h1 className="mt-3 font-heading text-2xl font-bold">{t('settings.profileName')}</h1>
          <p className="text-sm text-muted-foreground">{t('settings.subtitle')}</p>
        </section>

        <section className="space-y-2 rounded-[1.5rem] border border-border/50 bg-card/70 p-4">
          <h2 className="mb-2 font-heading text-lg font-semibold">{t('settings.language')}</h2>
          <p className="mb-3 text-sm text-muted-foreground">{t('settings.languageHint')}</p>
          {LOCALES.map((item) => {
            const selected = locale === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === locale) return
                  setLocale(item.id)
                  toast.success(messages[item.id]['settings.saved'])
                }}
                className={cn(
                  'flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-left transition-colors',
                  selected
                    ? 'border-primary bg-primary/15 ring-2 ring-primary/25'
                    : 'border-border/60 bg-background/50 hover:border-primary/40',
                )}
              >
                <div>
                  <p className="font-medium">{item.nativeLabel}</p>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                </div>
                {selected && <span className="text-sm font-medium text-primary">✓</span>}
              </button>
            )
          })}
        </section>

        <Button asChild variant="ghost" className="h-12 rounded-2xl text-muted-foreground">
          <Link to="/">{t('nav.back')}</Link>
        </Button>
      </PageMotion>
    </AppShell>
  )
}
