import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Landmark, Send, Users } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { BrandMark } from '@/components/illustrations'
import { PageMotion } from '@/components/page-motion'
import { Button } from '@/components/ui/button'
import { PRODUCT_NAME } from '@/lib/brand'
import { useT } from '@/lib/i18n'
import { getSavedRoomCode } from '@/lib/session'

export function HomePage() {
  const t = useT()
  const savedRoomCode = getSavedRoomCode()
  const reduceMotion = useReducedMotion()

  return (
    <AppShell>
      <PageMotion className="flex flex-1 flex-col gap-6 py-1">
        <motion.section
          className="relative overflow-hidden rounded-[1.75rem] border border-border/50 bg-card/80 p-5 shadow-[0_20px_50px_oklch(0.1_0.04_260/0.45)]"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 24 }}
        >
          <div className="relative z-10 flex items-center gap-4">
            <BrandMark size="xl" animated={!reduceMotion} className="rounded-[1.35rem]" />
            <div className="min-w-0">
              <p className="font-heading text-3xl font-bold tracking-tight">{PRODUCT_NAME}</p>
              <p className="mt-0.5 text-sm font-medium text-amber-300/90">{t('home.eyebrow')}</p>
              <p className="mt-2 text-sm text-muted-foreground">{t('home.tagline')}</p>
            </div>
          </div>

          <div
            aria-hidden
            className="pointer-events-none absolute -right-8 -top-10 size-40 rounded-full bg-[oklch(0.75_0.12_85/0.12)] blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-12 -left-6 size-36 rounded-full bg-primary/10 blur-3xl"
          />
        </motion.section>

        <section className="grid grid-cols-2 gap-3">
          <Button
            asChild
            className="h-auto min-h-24 flex-col gap-2 rounded-[1.35rem] px-3 py-4 text-base shadow-[0_0_28px_oklch(0.9_0.2_120/0.25)]"
          >
            <Link to="/rooms/create">
              <Landmark className="size-6" />
              {t('home.createRoom')}
            </Link>
          </Button>
          <Button
            asChild
            variant="secondary"
            className="h-auto min-h-24 flex-col gap-2 rounded-[1.35rem] border border-violet-action/40 bg-[oklch(0.35_0.12_300)] px-3 py-4 text-base text-foreground hover:bg-[oklch(0.4_0.14_300)]"
          >
            <Link to="/rooms/join">
              <Users className="size-6" />
              {t('home.joinRoom')}
            </Link>
          </Button>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold">{t('home.myGames')}</h2>
          </div>

          {savedRoomCode ? (
            <Link
              to={`/rooms/${savedRoomCode}`}
              className="flex items-center gap-3 rounded-[1.35rem] border border-border/60 bg-card/90 p-4 transition-colors hover:border-primary/40"
            >
              <div className="grid size-12 place-items-center rounded-2xl bg-primary/15 text-primary">
                <Send className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{t('home.activeGame')}</p>
                <p className="font-mono text-sm text-primary">{savedRoomCode}</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                {t('home.continue')}
                <ArrowRight className="size-3.5" />
              </span>
            </Link>
          ) : (
            <div className="rounded-[1.35rem] border border-dashed border-border/70 bg-card/40 px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">{t('home.noGames')}</p>
            </div>
          )}
        </section>
      </PageMotion>
    </AppShell>
  )
}
