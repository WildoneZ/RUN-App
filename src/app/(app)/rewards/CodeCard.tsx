'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

/** Big code + QR for the till. High contrast, works on a dim phone screen. */
export function CodeCard({
  code,
  title,
  expiresAt,
}: {
  code: string;
  title: string;
  expiresAt: string | null;
}) {
  const [qr, setQr] = useState<string | null>(null);
  useEffect(() => {
    QRCode.toDataURL(code, { width: 240, margin: 1 }).then(setQr).catch(() => setQr(null));
  }, [code]);

  return (
    <div className="card border-mint/40 bg-white text-ink">
      <p className="text-center text-xs font-bold uppercase tracking-widest text-ink/50">
        {title}
      </p>
      {qr && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qr} alt={`QR code for ${code}`} className="mx-auto mt-2 h-44 w-44" />
      )}
      <p className="mt-2 text-center font-mono text-2xl font-extrabold tracking-[0.15em]">
        {code}
      </p>
      {expiresAt && (
        <p className="mt-1 text-center text-xs font-semibold text-ink/50">
          Valid until{' '}
          {new Date(expiresAt).toLocaleDateString('en-ZA', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      )}
      <p className="mt-2 text-center text-xs text-ink/60">
        Show this at the till — single use, in store only.
      </p>
    </div>
  );
}
