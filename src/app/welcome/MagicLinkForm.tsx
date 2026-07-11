'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { sendMagicLink, type FormState } from '@/lib/actions/auth';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? 'Sending…' : 'Get my magic link'}
    </button>
  );
}

export function MagicLinkForm() {
  const [state, formAction] = useFormState<FormState, FormData>(sendMagicLink, {
    ok: false,
    message: '',
  });
  return (
    <form action={formAction} className="space-y-3">
      <label className="label" htmlFor="email">
        Your email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        placeholder="you@example.com"
        className="input"
      />
      <SubmitButton />
      {state.message && (
        <p
          role="status"
          className={`rounded-xl p-3 text-sm ${state.ok ? 'bg-mint/15 text-mint' : 'bg-accent/15 text-accent-glow'}`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
