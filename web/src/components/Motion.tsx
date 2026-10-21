import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'

const EASE = [0.22, 1, 0.36, 1] as const

// A grid whose cells fade up on arrival and slide into place when a filter
// adds or removes neighbours. Reduced-motion users get plain swaps (MotionConfig in App).
export function AnimatedGrid<T>({ items, keyOf, render, className, tail }: { items: T[]; keyOf: (t: T) => string; render: (t: T) => ReactNode; className: string; tail?: ReactNode }) {
  return (
    <motion.div layout className={className}>
      <AnimatePresence mode="popLayout">
        {items.map((t, i) => (
          <motion.div
            key={keyOf(t)}
            layout
            className="grid-cell"
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: EASE, delay: Math.min(i, 10) * 0.025 } }}
            exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.18 } }}
          >
            {render(t)}
          </motion.div>
        ))}
        {tail && (
          <motion.div key="tail" layout className="grid-cell" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.15 } }}>
            {tail}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Fades a section's heading up as it scrolls into view, once.
export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  )
}

// Cross-fades between pages of the hash router.
export function PageTransition({ id, children }: { id: string; children: ReactNode }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.28, ease: EASE }}>
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
