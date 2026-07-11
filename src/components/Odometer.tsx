'use client';

import { useEffect, useRef } from 'react';
import { animate, useMotionValue, useReducedMotion, useTransform, motion } from 'framer-motion';

/** Game-style count-up number for the points balance. Respects reduced motion. */
export function Odometer({ value, className }: { value: number; className?: string }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v).toLocaleString('en-ZA'));
  const started = useRef(false);

  useEffect(() => {
    if (reduce) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, {
      duration: started.current ? 0.6 : 1.4,
      ease: [0.16, 1, 0.3, 1],
    });
    started.current = true;
    return () => controls.stop();
  }, [value, mv, reduce]);

  return <motion.span className={className}>{rounded}</motion.span>;
}
