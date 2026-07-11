import type {
  Activity,
  AdminCustomerSummary,
  HomeData,
  LedgerEntry,
  PointsRule,
  Purchase,
  Redemption,
  Reward,
  SessionUser,
} from '@/lib/types';

/**
 * Demo mode fixtures: a full, coherent story so the whole experience can be
 * reviewed before any live API keys exist. Thandi has been running for six
 * weeks, bought shoes and a cap, and redeemed one reward.
 */

const daysAgo = (n: number, hour = 6): string => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 12, 0, 0);
  return d.toISOString();
};

export const demoUser: SessionUser = {
  id: 'demo-user-thandi',
  email: 'thandi@example.com',
  firstName: 'Thandi',
  lastName: 'Mokoena',
  role: 'customer',
  onboarded: true,
  marketingOptIn: true,
  leaderboardOptIn: true,
};

export const demoActivities: Activity[] = [
  { id: 'a1', name: 'Morning shakeout', sportType: 'Run', category: 'road', distanceM: 5200, movingTimeS: 1810, startedAt: daysAgo(0), isManual: false, pointsAwarded: 5 },
  { id: 'a2', name: 'Braamfontein loop', sportType: 'Run', category: 'road', distanceM: 8100, movingTimeS: 2705, startedAt: daysAgo(2), isManual: false, pointsAwarded: 8 },
  { id: 'a3', name: 'Melville Koppies trail', sportType: 'TrailRun', category: 'trail', distanceM: 12400, movingTimeS: 4980, startedAt: daysAgo(4, 7), isManual: false, pointsAwarded: 18 },
  { id: 'a4', name: 'Treadmill (manual entry)', sportType: 'Run', category: 'road', distanceM: 6000, movingTimeS: 2100, startedAt: daysAgo(6), isManual: true, pointsAwarded: 0 },
  { id: 'a5', name: 'Long Sunday run', sportType: 'Run', category: 'road', distanceM: 21100, movingTimeS: 7400, startedAt: daysAgo(7), isManual: false, pointsAwarded: 21 },
  { id: 'a6', name: 'Kudos to the Cause 5k', sportType: 'Run', category: 'road', distanceM: 5000, movingTimeS: 1650, startedAt: daysAgo(9, 18), isManual: false, pointsAwarded: 5 },
  { id: 'a7', name: 'Hennops trail adventure', sportType: 'TrailRun', category: 'trail', distanceM: 15800, movingTimeS: 6800, startedAt: daysAgo(13, 7), isManual: false, pointsAwarded: 23 },
  { id: 'a8', name: 'Easy recovery', sportType: 'Run', category: 'road', distanceM: 4300, movingTimeS: 1580, startedAt: daysAgo(16), isManual: false, pointsAwarded: 4 },
  { id: 'a9', name: 'Parkrun PB!', sportType: 'Run', category: 'road', distanceM: 5000, movingTimeS: 1495, startedAt: daysAgo(21, 8), isManual: false, pointsAwarded: 5 },
  { id: 'a10', name: 'Suikerbosrand trail', sportType: 'TrailRun', category: 'trail', distanceM: 18200, movingTimeS: 8100, startedAt: daysAgo(27, 6), isManual: false, pointsAwarded: 27 },
];

export const demoLedger: LedgerEntry[] = [
  { id: 'l1', source: 'run', activityRef: 'strava:demo-a1', points: 5, reason: null, createdAt: daysAgo(0) },
  { id: 'l2', source: 'run', activityRef: 'strava:demo-a2', points: 8, reason: null, createdAt: daysAgo(2) },
  { id: 'l3', source: 'run', activityRef: 'strava:demo-a3', points: 18, reason: null, createdAt: daysAgo(4) },
  { id: 'l4', source: 'purchase', activityRef: 'shopify_order:#1042', points: 219, reason: null, createdAt: daysAgo(5) },
  { id: 'l5', source: 'run', activityRef: 'strava:demo-a5', points: 21, reason: null, createdAt: daysAgo(7) },
  { id: 'l6', source: 'event', activityRef: 'event:kudos-june', points: 50, reason: 'Kudos to the Cause attendance', createdAt: daysAgo(9) },
  { id: 'l7', source: 'redemption', activityRef: 'redemption:r1', points: -500, reason: 'R100 off in store', createdAt: daysAgo(11) },
  { id: 'l8', source: 'run', activityRef: 'strava:demo-a7', points: 23, reason: null, createdAt: daysAgo(13) },
  { id: 'l9', source: 'gait', activityRef: 'gait:g1', points: 150, reason: 'Gait analysis visit', createdAt: daysAgo(14) },
  { id: 'l10', source: 'run', activityRef: 'strava:demo-a8', points: 4, reason: null, createdAt: daysAgo(16) },
  { id: 'l11', source: 'purchase', activityRef: 'shopify_order:#0991', points: 189, reason: null, createdAt: daysAgo(20) },
  { id: 'l12', source: 'run', activityRef: 'strava:demo-a9', points: 5, reason: null, createdAt: daysAgo(21) },
  { id: 'l13', source: 'adjustment', activityRef: null, points: 25, reason: 'Goodwill — till was offline on launch day', createdAt: daysAgo(24) },
  { id: 'l14', source: 'run', activityRef: 'strava:demo-a10', points: 27, reason: null, createdAt: daysAgo(27) },
];

export const demoBalance = demoLedger.reduce((s, l) => s + l.points, 0);

export const demoRules: PointsRule[] = [
  { id: 'r1', key: 'road_run', label: 'Road run', category: 'run', pointsPerKm: 1, pointsPerR100: null, flatPoints: null, dailyCap: 30, multiplier: 1, allowManualActivities: false, enabled: true, version: 1 },
  { id: 'r2', key: 'trail_run', label: 'Trail run', category: 'run', pointsPerKm: 1.5, pointsPerR100: null, flatPoints: null, dailyCap: 30, multiplier: 1, allowManualActivities: false, enabled: true, version: 1 },
  { id: 'r3', key: 'purchase', label: 'In-store purchase', category: 'purchase', pointsPerKm: null, pointsPerR100: 10, flatPoints: null, dailyCap: null, multiplier: 1, allowManualActivities: false, enabled: true, version: 1 },
  { id: 'r4', key: 'event_attendance', label: 'Event attendance', category: 'event', pointsPerKm: null, pointsPerR100: null, flatPoints: 50, dailyCap: null, multiplier: 1, allowManualActivities: false, enabled: true, version: 1 },
  { id: 'r5', key: 'gait_analysis', label: 'Gait analysis visit', category: 'other', pointsPerKm: null, pointsPerR100: null, flatPoints: 150, dailyCap: null, multiplier: 1, allowManualActivities: false, enabled: true, version: 1 },
];

export const demoRewards: Reward[] = [
  { id: 'w1', title: 'R100 off in store', description: 'R100 off any purchase at RUN.', pointsCost: 500, kind: 'discount_amount', valueRands: 100, perkCode: null, expiryDays: 30, active: true, sort: 1 },
  { id: 'w2', title: 'R250 off in store', description: 'R250 off any purchase at RUN.', pointsCost: 1000, kind: 'discount_amount', valueRands: 250, perkCode: null, expiryDays: 30, active: true, sort: 2 },
  { id: 'w3', title: 'R600 off new shoes', description: 'Serious mileage deserves fresh legs.', pointsCost: 2000, kind: 'discount_amount', valueRands: 600, perkCode: null, expiryDays: 45, active: true, sort: 3 },
  { id: 'w4', title: 'Free gait analysis', description: 'A full in-store gait analysis session.', pointsCost: 750, kind: 'perk', valueRands: null, perkCode: 'gait_analysis', expiryDays: 60, active: true, sort: 4 },
  { id: 'w5', title: 'Free event entry', description: 'Entry to the next RUN community event.', pointsCost: 400, kind: 'perk', valueRands: null, perkCode: 'event_entry', expiryDays: 60, active: true, sort: 5 },
];

export const demoRedemptions: Redemption[] = [
  { id: 'r1', rewardTitle: 'R100 off in store', pointsSpent: 500, status: 'used', code: 'RUN-K7M2P9XA', expiresAt: daysAgo(-19), createdAt: daysAgo(11) },
];

export const demoPurchases: Purchase[] = [
  {
    id: 'o1', orderNumber: '#1042', processedAt: daysAgo(5), totalRands: 2199,
    items: [{ title: 'Saucony Endorphin Speed 4', quantity: 1, isShoe: true }, { title: 'RUN Cap — Navy', quantity: 1, isShoe: false }],
  },
  {
    id: 'o2', orderNumber: '#0991', processedAt: daysAgo(20), totalRands: 1890,
    items: [{ title: 'Brooks Ghost 16', quantity: 1, isShoe: true }],
  },
  {
    id: 'o3', orderNumber: '#0873', processedAt: daysAgo(64), totalRands: 645,
    items: [{ title: 'Näak Energy Bars (box)', quantity: 2, isShoe: false }, { title: 'Anti-chafe balm', quantity: 1, isShoe: false }],
  },
];

export const demoGaitSessions = [
  {
    id: 'g1',
    sessionDate: daysAgo(14).slice(0, 10),
    summary: { cadence: 172, footStrike: 'midfoot', overstride: 'mild', pelvicDrop: 'within range' },
    recommendations: 'Mild overstride — try a light cadence bump (+3%). Neutral shoe suits your gait.',
    videoUrl: null,
  },
];

export function demoHomeData(): HomeData {
  const weekAgo = Date.now() - 7 * 86400000;
  const weekRuns = demoActivities.filter(
    (a) => new Date(a.startedAt).getTime() >= weekAgo && a.category !== 'other'
  );
  return {
    balance: demoBalance,
    weekKm: weekRuns.reduce((s, a) => s + a.distanceM, 0) / 1000,
    weekRuns: weekRuns.length,
    streakWeeks: 6,
    nextReward: { title: 'R250 off in store', pointsCost: 1000 },
    recentLedger: demoLedger.slice(0, 6),
  };
}

export const demoAdminCustomers: AdminCustomerSummary[] = [
  { id: 'demo-user-thandi', email: 'thandi@example.com', firstName: 'Thandi', lastName: 'Mokoena', balance: demoBalance, lifetimeEarned: demoLedger.filter((l) => l.points > 0).reduce((s, l) => s + l.points, 0), lifetimeSpent: 500, stravaLinked: true, shopifyLinked: true, lastActivityAt: daysAgo(0), createdAt: daysAgo(45) },
  { id: 'demo-user-sipho', email: 'sipho@example.com', firstName: 'Sipho', lastName: 'Dlamini', balance: 812, lifetimeEarned: 1312, lifetimeSpent: 500, stravaLinked: true, shopifyLinked: false, lastActivityAt: daysAgo(1), createdAt: daysAgo(60) },
  { id: 'demo-user-anke', email: 'anke@example.com', firstName: 'Anke', lastName: 'van Wyk', balance: 143, lifetimeEarned: 143, lifetimeSpent: 0, stravaLinked: false, shopifyLinked: true, lastActivityAt: daysAgo(12), createdAt: daysAgo(20) },
  { id: 'demo-user-james', email: 'james@example.com', firstName: 'James', lastName: 'Okafor', balance: 2310, lifetimeEarned: 3310, lifetimeSpent: 1000, stravaLinked: true, shopifyLinked: true, lastActivityAt: daysAgo(3), createdAt: daysAgo(120) },
];
