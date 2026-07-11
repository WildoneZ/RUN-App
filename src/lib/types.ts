export type UserRole = 'customer' | 'admin';

export interface SessionUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  onboarded: boolean;
  marketingOptIn: boolean;
  leaderboardOptIn: boolean;
}

export type RunCategory = 'road' | 'trail' | 'other';

export interface Activity {
  id: string;
  name: string | null;
  sportType: string;
  category: RunCategory;
  distanceM: number;
  movingTimeS: number;
  startedAt: string; // ISO
  isManual: boolean;
  pointsAwarded: number;
}

export interface LedgerEntry {
  id: string;
  source:
    | 'run'
    | 'purchase'
    | 'event'
    | 'gait'
    | 'challenge_bonus'
    | 'adjustment'
    | 'redemption'
    | 'redemption_refund';
  activityRef: string | null;
  points: number;
  reason: string | null;
  createdAt: string;
}

export interface PointsRule {
  id: string;
  key: string;
  label: string;
  category: 'run' | 'purchase' | 'event' | 'other';
  pointsPerKm: number | null;
  pointsPerR100: number | null;
  flatPoints: number | null;
  dailyCap: number | null;
  multiplier: number;
  allowManualActivities: boolean;
  enabled: boolean;
  version: number;
}

export interface Reward {
  id: string;
  title: string;
  description: string | null;
  pointsCost: number;
  kind: 'discount_amount' | 'discount_percent' | 'perk';
  valueRands: number | null;
  perkCode: string | null;
  expiryDays: number;
  active: boolean;
  sort: number;
}

export type RedemptionStatus = 'pending' | 'issued' | 'failed' | 'refunded' | 'used' | 'expired';

export interface Redemption {
  id: string;
  rewardTitle: string;
  pointsSpent: number;
  status: RedemptionStatus;
  code: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface Purchase {
  id: string;
  orderNumber: string;
  processedAt: string;
  totalRands: number;
  items: { title: string; quantity: number; isShoe: boolean }[];
}

export interface HomeData {
  balance: number;
  weekKm: number;
  weekRuns: number;
  streakWeeks: number;
  nextReward: { title: string; pointsCost: number } | null;
  recentLedger: LedgerEntry[];
}

export interface AdminCustomerSummary {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  stravaLinked: boolean;
  shopifyLinked: boolean;
  lastActivityAt: string | null;
  createdAt: string;
}
