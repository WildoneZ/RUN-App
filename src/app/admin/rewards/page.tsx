import { getRewardsCatalogue } from '@/lib/data';
import { upsertReward } from '@/lib/actions/admin';
import type { Reward } from '@/lib/types';

export const metadata = { title: 'Rewards catalogue — RUN Rewards Admin' };
export const dynamic = 'force-dynamic';

function RewardForm({ reward }: { reward?: Reward }) {
  return (
    <form action={upsertReward} className="card space-y-3">
      <input type="hidden" name="id" value={reward?.id ?? ''} />
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold">{reward ? reward.title : '➕ New reward'}</h2>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked={reward?.active ?? true} className="h-5 w-5 accent-[#ff5a3c]" />
          Active
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="col-span-2">
          <label className="label">Title</label>
          <input name="title" required defaultValue={reward?.title ?? ''} className="input" />
        </div>
        <div className="col-span-2">
          <label className="label">Description</label>
          <input name="description" defaultValue={reward?.description ?? ''} className="input" />
        </div>
        <div>
          <label className="label">Points cost</label>
          <input name="points_cost" type="number" min="1" required defaultValue={reward?.pointsCost ?? ''} className="input" />
        </div>
        <div>
          <label className="label">Type</label>
          <select name="kind" defaultValue={reward?.kind ?? 'discount_amount'} className="input">
            <option value="discount_amount">Rand discount</option>
            <option value="discount_percent">% discount</option>
            <option value="perk">Perk (in-store)</option>
          </select>
        </div>
        <div>
          <label className="label">Value (R or %)</label>
          <input name="value_rands" type="number" step="0.01" min="0" defaultValue={reward?.valueRands ?? ''} className="input" />
        </div>
        <div>
          <label className="label">Expiry (days)</label>
          <input name="expiry_days" type="number" min="1" defaultValue={reward?.expiryDays ?? 30} className="input" />
        </div>
        <div>
          <label className="label">Perk code</label>
          <input name="perk_code" defaultValue={reward?.perkCode ?? ''} placeholder="gait_analysis" className="input" />
        </div>
        <div>
          <label className="label">Sort</label>
          <input name="sort" type="number" defaultValue={reward?.sort ?? 0} className="input" />
        </div>
      </div>
      <button type="submit" className="btn-primary !py-2 text-sm">
        {reward ? 'Save reward' : 'Create reward'}
      </button>
    </form>
  );
}

export default async function AdminRewardsPage() {
  const rewards = await getRewardsCatalogue(true);
  return (
    <main className="space-y-4">
      <header>
        <h1 className="font-display text-xl font-extrabold">Rewards catalogue</h1>
        <p className="text-sm text-paper/60">
          What points buy. Rand discounts mint single-use Shopify codes at redemption; perks
          issue an internal voucher code fulfilled in store.
        </p>
      </header>
      {rewards.map((reward) => (
        <RewardForm key={reward.id} reward={reward} />
      ))}
      <RewardForm />
    </main>
  );
}
