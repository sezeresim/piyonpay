import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

const pageMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
}

export function PageMotion({ children, className }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion()
  const motionProps = reduceMotion
    ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : pageMotion

  return (
    <motion.section
      {...motionProps}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.section>
  )
}
