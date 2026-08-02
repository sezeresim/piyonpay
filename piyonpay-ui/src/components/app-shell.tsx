import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  DoorClosed,
  Gamepad2,
  Home,
  LogOut,
  MoreVertical,
  PlusCircle,
  Settings,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { BrandMark } from '@/components/illustrations'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { PRODUCT_NAME } from '@/lib/brand'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export function AppShell({
  children,
  roomCode,
  hideNav = false,
  title,
  onLeaveRoom,
  onCloseGame,
  onFinalizeRoom,
  isBanker = false,
  roomClosed = false,
}: {
  children: ReactNode
  roomCode?: string
  hideNav?: boolean
  title?: string
  onLeaveRoom?: () => void
  onCloseGame?: () => void
  onFinalizeRoom?: () => void
  isBanker?: boolean
  roomClosed?: boolean
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const t = useT()
  const reduceMotion = useReducedMotion()
  const [menuOpen, setMenuOpen] = useState(false)
  const showBottomNav = !hideNav && !roomCode

  const leaveSession = () => {
    setMenuOpen(false)
    if (onLeaveRoom) {
      onLeaveRoom()
      return
    }
    navigate('/')
  }

  const navItems = [
    { to: '/', label: t('nav.home'), icon: Home, match: (p: string) => p === '/' },
    {
      to: '/rooms/create',
      label: t('nav.create'),
      icon: PlusCircle,
      match: (p: string) => p.startsWith('/rooms/create'),
    },
    {
      to: '/rooms/join',
      label: t('nav.join'),
      icon: Users,
      match: (p: string) => p.startsWith('/rooms/join'),
    },
    {
      to: '/settings',
      label: t('nav.profile'),
      icon: UserRound,
      match: (p: string) => p.startsWith('/settings'),
    },
  ]

  return (
    <div
      className={cn(
        'mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pt-[max(0.75rem,env(safe-area-inset-top))] md:max-w-md',
        showBottomNav
          ? 'pb-[calc(5.25rem+env(safe-area-inset-bottom))]'
          : 'pb-[max(1.25rem,env(safe-area-inset-bottom))]',
      )}
    >
      <motion.div
        className="flex flex-1 flex-col"
        animate={
          reduceMotion
            ? undefined
            : menuOpen
              ? { x: -28, scale: 0.965, opacity: 0.72 }
              : { x: 0, scale: 1, opacity: 1 }
        }
        transition={{ type: 'spring', stiffness: 280, damping: 28, mass: 0.85 }}
        style={{ transformOrigin: 'left center' }}
      >
        <header className="mb-5 flex items-center justify-between gap-3">
          <Link
            to="/"
            className="flex min-w-0 items-center gap-2.5 rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <BrandMark />
            <span className="min-w-0">
              <span className="block font-heading text-lg font-bold tracking-tight">
                {title ?? PRODUCT_NAME}
              </span>
              {!title && (
                <span className="block text-[11px] font-medium tracking-wide text-amber-300/90 uppercase">
                  {t('home.eyebrow')}
                </span>
              )}
            </span>
          </Link>

          <div className="flex items-center gap-1.5">
            {roomCode && (
              <>
                <Badge className="h-9 gap-1.5 border-0 bg-primary/15 px-3 font-mono text-sm text-primary">
                  <Gamepad2 className="size-3.5" />
                  {roomCode}
                </Badge>
                <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                  <SheetTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-lg"
                      className="size-11 rounded-2xl"
                      aria-label={t('nav.menu')}
                    >
                      <MoreVertical />
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="right"
                    className="w-[min(18rem,82vw)] gap-0 border-l border-border/60 bg-card/95 p-0 backdrop-blur-xl duration-300 data-[side=right]:data-open:slide-in-from-right-full data-[side=right]:data-closed:slide-out-to-right-full"
                    showCloseButton={false}
                  >
                    <SheetHeader className="border-b border-border/50 p-5">
                      <SheetTitle className="font-heading text-xl font-bold">
                        {t('nav.menu')}
                      </SheetTitle>
                      <SheetDescription className="font-mono text-xs tracking-wide text-primary">
                        {roomCode}
                      </SheetDescription>
                    </SheetHeader>

                    <nav className="flex flex-col gap-1 p-3">
                      <AnimatePresence>
                        {menuOpen && (
                          <>
                            <motion.div
                              initial={
                                reduceMotion
                                  ? false
                                  : { opacity: 0, x: 36 }
                              }
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.05, type: 'spring', stiffness: 320, damping: 26 }}
                            >
                              <Button
                                asChild
                                variant="ghost"
                                className="h-12 w-full justify-start gap-3 rounded-2xl px-4 text-base"
                                onClick={() => setMenuOpen(false)}
                              >
                                <Link to="/settings">
                                  <Settings className="size-5" />
                                  {t('nav.settings')}
                                </Link>
                              </Button>
                            </motion.div>
                            {isBanker && onCloseGame && !roomClosed && (
                              <motion.div
                                initial={
                                  reduceMotion ? false : { opacity: 0, x: 36 }
                                }
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                  delay: 0.1,
                                  type: 'spring',
                                  stiffness: 320,
                                  damping: 26,
                                }}
                              >
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="h-12 w-full justify-start gap-3 rounded-2xl px-4 text-base text-amber-300 hover:bg-amber-300/10 hover:text-amber-200"
                                  onClick={() => {
                                    setMenuOpen(false)
                                    onCloseGame()
                                  }}
                                >
                                  <DoorClosed className="size-5" />
                                  {t('close.action')}
                                </Button>
                              </motion.div>
                            )}
                            {isBanker && onFinalizeRoom && roomClosed && (
                              <motion.div
                                initial={
                                  reduceMotion ? false : { opacity: 0, x: 36 }
                                }
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                  delay: 0.1,
                                  type: 'spring',
                                  stiffness: 320,
                                  damping: 26,
                                }}
                              >
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="h-12 w-full justify-start gap-3 rounded-2xl px-4 text-base text-destructive hover:bg-destructive/10 hover:text-destructive"
                                  onClick={() => {
                                    setMenuOpen(false)
                                    onFinalizeRoom()
                                  }}
                                >
                                  <Trash2 className="size-5" />
                                  {t('close.finalize')}
                                </Button>
                              </motion.div>
                            )}
                            {!isBanker && (
                              <motion.div
                                initial={
                                  reduceMotion
                                    ? false
                                    : { opacity: 0, x: 36 }
                                }
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                  delay: 0.12,
                                  type: 'spring',
                                  stiffness: 320,
                                  damping: 26,
                                }}
                              >
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="h-12 w-full justify-start gap-3 rounded-2xl px-4 text-base text-destructive hover:bg-destructive/10 hover:text-destructive"
                                  onClick={leaveSession}
                                >
                                  <LogOut className="size-5" />
                                  {t('nav.leaveRoom')}
                                </Button>
                              </motion.div>
                            )}
                          </>
                        )}
                      </AnimatePresence>
                    </nav>
                  </SheetContent>
                </Sheet>
              </>
            )}
            {!showBottomNav && !roomCode && (
              <Button
                asChild
                variant="ghost"
                size="icon-lg"
                className="size-11 rounded-2xl"
                aria-label={t('nav.settings')}
              >
                <Link to="/settings">
                  <Settings />
                </Link>
              </Button>
            )}
          </div>
        </header>

        {children}
      </motion.div>

      {showBottomNav && (
        <nav
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-card/95 backdrop-blur-xl"
          style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
        >
          <div className="mx-auto grid max-w-lg grid-cols-4 gap-1 px-3 pt-2 md:max-w-md">
            {navItems.map((item) => {
              const active = item.match(location.pathname)
              const Icon = item.icon
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition-colors',
                    active
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon className={cn('size-5', active && 'drop-shadow-[0_0_8px_oklch(0.9_0.2_120/0.6)]')} />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </nav>
      )}
    </div>
  )
}
