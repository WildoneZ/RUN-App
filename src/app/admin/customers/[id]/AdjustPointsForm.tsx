'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { adjustPoints, type AdjustState } from '@/lib/actions/admin';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary !py-2 text-sm" disabled={pending}>
      {pending ? 'Applying…' : 'Apply adjustment'}
    </button>
  );
}

/** Goodwill/fix adjustments: signed points + mandatory reason, logged forever. */
export function AdjustPointsForm({ customerId }: { customerId: string }) {
  const [state, formAction] = useFormState<AdjustState, FormData>(adjustPoints, {
    ok: false,
    message: '',
  });
  return (
    <form action={formAction} className="card space-y-3">
      <h2 className="font-display font-bold">Manual points adjustment</h2>
      <input type="hidden" name="customer_id" value={customerId} />
      <div className="flex flex-wrap gap-3">
        <div className="w-32">
          <label className="label" htmlFor="points">Points (±)</label>
          <input id="points" name="points" type="number" required className="input" placeholder="e.g. 50" />
        </div>
        <div className="min-w-[240px] flex-1">
          <label className="label" htmlFor="reason">Reason (logged on the ledger)</label>
          <input
            id="reason"
            name="reason"
            required
            minLength={5}
            className="input"
            placeholder="e.g. Goodwill — till offline on Saturday"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Submit />
        {state.message && (
          <p className={`text-sm ${state.ok ? 'text-mint' : 'text-accent-glow'}`} role="status">
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
