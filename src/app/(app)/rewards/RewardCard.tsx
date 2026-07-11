'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { redeemReward, type RedeemResult } from '@/lib/actions/rewards';
import { CodeCard } from './CodeCard';
import type { Reward } from '@/lib/types';

const KIND_ICON = { discount_amount: '💸', discount_percent: '🏷️', perk: '✨' } as const;

export function RewardCard({ reward, balance }: { reward: Reward; balance: number }) {
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<RedeemResult | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const affordable = balance >= reward.pointsCost;

  const redeem = () =>
    startTransition(async () => {
      const res = await redeemReward(reward.id);
      setResult(res);
      setConfirming(false);
      if (res.ok) router.refresh(); // balance + wallet update from the server
    });

  return (
    <div className={`card ${affordable ? '' : 'opacity-70'}`}>
      <div className="flex items-center gap-3">
        <span className="text-3xl" aria-hidden>
          {KIND_ICON[reward.kind]}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display font-bold">{reward.title}</p>
          {reward.description && (
            <p className="truncate text-xs text-paper/60">{reward.description}</p>
          )}
        </div>
        <button
          className={affordable ? 'btn-primary !px-4 !py-2 text-sm' : 'btn-ghost !px-4 !py-2 text-sm'}
          disabled={!affordable || pending}
          onClick={() => setConfirming(true)}
        >
          {reward.pointsCost.toLocaleString('en-ZA')} pts
        </button>
      </div>

      <AnimatePresence>
        {confirming && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 rounded-xl bg-ink-soft p-3 text-sm">
              <p>
                Swap <strong>{reward.pointsCost.toLocaleString('en-ZA')} points</strong> for{' '}
                <strong>{reward.title}</strong>? The code expires {reward.expiryDays} days after
                you claim it.
              </p>
              <div className="mt-3 flex gap-2">
                <button className="btn-primary flex-1 !py-2 text-sm" onClick={redeem} disabled={pending}>
                  {pending ? 'Unlocking…' : 'Yes, claim it!'}
                </button>
                <button className="btn-ghost flex-1 !py-2 text-sm" onClick={() => setConfirming(false)}>
                  Not yet
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-3"
          >
            {result.ok && result.code ? (
              <div className="space-y-2">
                <CodeCard code={result.code} title={reward.title} expiresAt={result.expiresAt ?? null} />
                <button className="btn-ghost w-full !py-2 text-sm" onClick={() => setResult(null)}>
                  Done
                </button>
              </div>
            ) : (
              <p className="rounded-xl bg-accent/15 p-3 text-sm text-accent-glow" role="alert">
                {result.message}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
