import { getPointsRules } from '@/lib/data';
import { updatePointsRule } from '@/lib/actions/admin';

export const metadata = { title: 'Points rules — RUN Rewards Admin' };
export const dynamic = 'force-dynamic';

export default async function AdminRulesPage() {
  const rules = await getPointsRules();
  return (
    <main className="space-y-4">
      <header>
        <h1 className="font-display text-xl font-extrabold">Points rules</h1>
        <p className="text-sm text-paper/60">
          The formulas behind every point. Saving bumps the rule’s version — future activities
          score with the new numbers; history is never rewritten.
        </p>
      </header>

      {rules.map((rule) => (
        <form key={rule.id} action={updatePointsRule} className="card space-y-3">
          <input type="hidden" name="id" value={rule.id} />
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold">
              {rule.label} <span className="text-xs font-normal text-paper/40">v{rule.version} · {rule.key}</span>
            </h2>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="enabled" defaultChecked={rule.enabled} className="h-5 w-5 accent-[#ff5a3c]" />
              Enabled
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {rule.category === 'run' && (
              <div>
                <label className="label">Pts / km</label>
                <input name="points_per_km" type="number" step="0.1" min="0" defaultValue={rule.pointsPerKm ?? ''} className="input" />
              </div>
            )}
            {rule.category === 'purchase' && (
              <div>
                <label className="label">Pts / R100</label>
                <input name="points_per_r100" type="number" step="0.5" min="0" defaultValue={rule.pointsPerR100 ?? ''} className="input" />
              </div>
            )}
            {(rule.category === 'event' || rule.category === 'other') && (
              <div>
                <label className="label">Flat pts</label>
                <input name="flat_points" type="number" min="0" defaultValue={rule.flatPoints ?? ''} className="input" />
              </div>
            )}
            <div>
              <label className="label">Daily cap</label>
              <input name="daily_cap" type="number" min="0" defaultValue={rule.dailyCap ?? ''} placeholder="none" className="input" />
            </div>
            <div>
              <label className="label">Multiplier</label>
              <input name="multiplier" type="number" step="0.1" min="0" defaultValue={rule.multiplier} className="input" />
            </div>
            {rule.category === 'run' && (
              <label className="col-span-2 flex items-end gap-2 pb-3 text-sm">
                <input
                  type="checkbox"
                  name="allow_manual_activities"
                  defaultChecked={rule.allowManualActivities}
                  className="h-5 w-5 accent-[#ff5a3c]"
                />
                Allow manual (non-GPS) entries
              </label>
            )}
          </div>
          <button type="submit" className="btn-primary !py-2 text-sm">Save rule</button>
        </form>
      ))}
    </main>
  );
}
