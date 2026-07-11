export const metadata = { title: 'Offline — RUN Rewards' };

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="text-6xl">🛰️</div>
      <h1 className="font-display text-2xl font-bold">You’re off the grid</h1>
      <p className="max-w-xs text-paper/70">
        No signal — happens on the best trails. Your points are safe and will be here when
        you’re back online.
      </p>
    </main>
  );
}
