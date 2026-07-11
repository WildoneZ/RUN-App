'use client';

import { useState, useTransition } from 'react';

export function DeleteAccountButton({ action }: { action: () => Promise<void> }) {
  const [arming, setArming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!arming) {
    return (
      <button
        className="w-full rounded-pill border border-accent/40 py-2 text-sm font-semibold text-accent-glow"
        onClick={() => setArming(true)}
      >
        Delete my account
      </button>
    );
  }
  return (
    <div className="space-y-2 rounded-xl bg-accent/10 p-3 text-sm">
      <p>
        This permanently deletes your account: Strava access is revoked, gait records are
        unlinked, and your history is anonymised. There’s no undo.
      </p>
      <div className="flex gap-2">
        <button
          className="flex-1 rounded-pill bg-accent py-2 font-bold text-white disabled:opacity-50"
          disabled={pending}
          onClick={() => startTransition(() => action())}
        >
          {pending ? 'Deleting…' : 'Yes, delete everything'}
        </button>
        <button className="btn-ghost flex-1 !py-2 text-sm" onClick={() => setArming(false)}>
          Keep my account
        </button>
      </div>
    </div>
  );
}
