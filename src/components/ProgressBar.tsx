'use client';

import { motion, useReducedMotion } from 'framer-motion';

export function ProgressBar({ fraction, label }: { fraction: number; label?: string }) {
  const reduce = useReducedMotion();
  const pct = Math.max(0, Math.min(1, fraction)) * 100;
  return (
    <div aria-label={label} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-3 overflow-hidden rounded-pill bg-ink-soft">
        <motion.div
          className="h-full rounded-pill bg-gradient-to-r from-accent to-volt"
          initial={reduce ? false : { width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}
