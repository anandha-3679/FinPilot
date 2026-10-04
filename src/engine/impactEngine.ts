/**
 * Deterministic Impact Engine for FinPilot
 * Pure functions only - zero external dependencies or API calls.
 * 
 * Spec formulas (Section 7):
 * r = (1 + 0.12)^(1/12) - 1
 * simulate(corpus, monthlyContribution, months, adjustments) -> projected value at month `months`
 *   v = corpus
 *   for k = 1..months: v = v*(1+r) + contribution_k
 * monthsToTarget(target, corpus, contribution, adjustments) -> smallest k with v >= target (cap 1200)
 * valueLost (pause m months, amount a) = Σ_{k=1..m} a * (1+r)^(n-k)
 * valueLost (reduce from old to new)   = Σ_{k=1..n} (old-new) * (1+r)^(n-k)
 * valueLost (withdraw W)               = W * (1+r)^n
 * contributionsMissed: pause = a*m ; reduce = (old-new)*n
 * goalDelayMonths = max(0, monthsToTarget(changed) - monthsToTarget(baseline))
 * projectedAtGoalDate = simulate(..., n, adjustments)
 * status = projectedAtGoalDate / target: >=100% "On track" ; >=90% "Slightly behind" ; else "At risk"
 */

export interface SimulationAdjustment {
  month: number; // 1-indexed month
  contributionDelta: number; // e.g. -10000 if paused
}

export type GoalStatus = 'On track' | 'Slightly behind' | 'At risk';

export interface TrajectoryPoint {
  month: number;
  corpusBefore: number;
  corpusAfter: number;
}

export interface ImpactResult {
  valueLost: number;
  goalDelayMonths: number;
  contributionsMissed: number;
  remainingHolding: number;
  projectedBefore: number;
  projectedAfter: number;
  statusBefore: GoalStatus;
  statusAfter: GoalStatus;
  percentageBefore: number;
  percentageAfter: number;
  baselineMonthsToTarget: number;
  changedMonthsToTarget: number;
  trajectory: TrajectoryPoint[];
}

export const ANNUAL_RETURN_DEFAULT = 0.12;

/**
 * Calculates monthly effective compound rate from annual rate:
 * r = (1 + annualRate)^(1/12) - 1
 */
export function getMonthlyRate(annualRate: number = ANNUAL_RETURN_DEFAULT): number {
  return Math.pow(1 + annualRate, 1 / 12) - 1;
}

/**
 * Simulates corpus progression over given months with optional per-month contribution adjustments.
 * Note: Contributions happen at month-end.
 */
export function simulate(
  corpus: number,
  monthlyContribution: number,
  months: number,
  adjustments: Record<number, number> = {},
  annualRate: number = ANNUAL_RETURN_DEFAULT
): number {
  const r = getMonthlyRate(annualRate);
  let v = corpus;
  for (let k = 1; k <= months; k++) {
    const adj = adjustments[k] || 0;
    const contributionK = Math.max(0, monthlyContribution + adj);
    v = v * (1 + r) + contributionK;
  }
  return v;
}

/**
 * Finds smallest month k where corpus reaches or exceeds target (capped at 1200).
 */
export function monthsToTarget(
  target: number,
  corpus: number,
  monthlyContribution: number,
  adjustments: Record<number, number> = {},
  annualRate: number = ANNUAL_RETURN_DEFAULT,
  capMonths: number = 1200
): number {
  const r = getMonthlyRate(annualRate);
  let v = corpus;
  if (v >= target) return 0;

  for (let k = 1; k <= capMonths; k++) {
    const adj = adjustments[k] || 0;
    const contributionK = Math.max(0, monthlyContribution + adj);
    v = v * (1 + r) + contributionK;
    if (v >= target) {
      return k;
    }
  }
  return capMonths;
}

/**
 * Computes goal status category from projected corpus vs target.
 */
export function getGoalStatus(projected: number, target: number): GoalStatus {
  if (target <= 0) return 'On track';
  const ratio = projected / target;
  if (ratio >= 0.99999) return 'On track'; // tolerance for float precision
  if (ratio >= 0.90) return 'Slightly behind';
  return 'At risk';
}

export interface CalculateImpactParams {
  action: 'pause' | 'reduce' | 'withdraw';
  currentAmountOrHolding: number; // for pause/reduce: current SIP amount; for withdraw: current holding value
  goalTarget: number;
  goalCorpus: number;
  goalMonthlyContribution: number;
  goalMonthsLeft: number; // n
  pauseMonths?: number; // m (for pause)
  newMonthlyAmount?: number; // for reduce
  reduceMonths?: number; // N months (default 3) for reduce
  reducePermanent?: boolean; // if false, auto-restores after reduceMonths
  withdrawAmount?: number; // W (for withdraw)
  annualRate?: number; // default 0.12
}

/**
 * Master impact computation function adhering to Section 7 specs.
 */
export function calculateImpact(params: CalculateImpactParams): ImpactResult {
  const {
    action,
    currentAmountOrHolding,
    goalTarget,
    goalCorpus,
    goalMonthlyContribution,
    goalMonthsLeft: n,
    pauseMonths = 3,
    newMonthlyAmount = 0,
    reduceMonths = 3,
    reducePermanent = false,
    withdrawAmount = 0,
    annualRate = ANNUAL_RETURN_DEFAULT
  } = params;

  const r = getMonthlyRate(annualRate);

  let valueLost = 0;
  let contributionsMissed = 0;
  let remainingHolding = currentAmountOrHolding;
  const adjustments: Record<number, number> = {};
  let modifiedStartCorpus = goalCorpus;

  if (action === 'pause') {
    const m = Math.min(pauseMonths, n);
    const a = currentAmountOrHolding;
    contributionsMissed = a * m;

    // valueLost = Σ_{k=1..m} a * (1+r)^(n-k)
    let sumLost = 0;
    for (let k = 1; k <= m; k++) {
      sumLost += a * Math.pow(1 + r, n - k);
      adjustments[k] = -a;
    }
    valueLost = sumLost;
  } else if (action === 'reduce') {
    const oldAmount = currentAmountOrHolding;
    const newAmount = newMonthlyAmount;
    const delta = Math.max(0, oldAmount - newAmount);

    if (reducePermanent) {
      contributionsMissed = delta * n;
      let sumLost = 0;
      for (let k = 1; k <= n; k++) {
        sumLost += delta * Math.pow(1 + r, n - k);
        adjustments[k] = -delta;
      }
      for (let k = n + 1; k <= 1200; k++) {
        adjustments[k] = -delta;
      }
      valueLost = sumLost;
    } else {
      const N = Math.min(reduceMonths, n);
      contributionsMissed = delta * N;
      let sumLost = 0;
      for (let k = 1; k <= N; k++) {
        sumLost += delta * Math.pow(1 + r, n - k);
        adjustments[k] = -delta;
      }
      valueLost = sumLost;
    }
  } else if (action === 'withdraw') {
    const W = Math.min(withdrawAmount, currentAmountOrHolding);
    remainingHolding = Math.max(0, currentAmountOrHolding - W);
    modifiedStartCorpus = Math.max(0, goalCorpus - W);

    // valueLost = W * (1+r)^n
    valueLost = W * Math.pow(1 + r, n);
    contributionsMissed = 0;
  }

  // Trajectories & projections
  const baselineMonths = monthsToTarget(goalTarget, goalCorpus, goalMonthlyContribution, {}, annualRate);
  const changedMonths = monthsToTarget(goalTarget, modifiedStartCorpus, goalMonthlyContribution, adjustments, annualRate);
  const goalDelayMonths = Math.max(0, changedMonths - baselineMonths);

  const projectedBefore = simulate(goalCorpus, goalMonthlyContribution, n, {}, annualRate);
  const projectedAfter = simulate(modifiedStartCorpus, goalMonthlyContribution, n, adjustments, annualRate);

  const statusBefore = getGoalStatus(projectedBefore, goalTarget);
  const statusAfter = getGoalStatus(projectedAfter, goalTarget);

  const percentageBefore = (projectedBefore / goalTarget) * 100;
  const percentageAfter = (projectedAfter / goalTarget) * 100;

  // Trajectory points for charts: sample points across 0..n, and every month in the last 24 months (n-24..n)
  const trajectoryMap = new Map<number, TrajectoryPoint>();
  const step = Math.max(1, Math.floor(n / 30));
  for (let m = 0; m <= n; m += step) {
    const b = m === 0 ? goalCorpus : simulate(goalCorpus, goalMonthlyContribution, m, {}, annualRate);
    const a = m === 0 ? modifiedStartCorpus : simulate(modifiedStartCorpus, goalMonthlyContribution, m, adjustments, annualRate);
    trajectoryMap.set(m, { month: m, corpusBefore: Math.round(b), corpusAfter: Math.round(a) });
  }
  // Include every month for the last 24 months for zoom view
  const zoomStart = Math.max(0, n - 24);
  for (let m = zoomStart; m <= n; m++) {
    if (!trajectoryMap.has(m)) {
      const b = simulate(goalCorpus, goalMonthlyContribution, m, {}, annualRate);
      const a = simulate(modifiedStartCorpus, goalMonthlyContribution, m, adjustments, annualRate);
      trajectoryMap.set(m, { month: m, corpusBefore: Math.round(b), corpusAfter: Math.round(a) });
    }
  }
  const trajectory = Array.from(trajectoryMap.values()).sort((x, y) => x.month - y.month);

  return {
    valueLost: Math.round(valueLost),
    goalDelayMonths,
    contributionsMissed: Math.round(contributionsMissed),
    remainingHolding: Math.round(remainingHolding),
    projectedBefore: Math.round(projectedBefore),
    projectedAfter: Math.round(projectedAfter),
    statusBefore,
    statusAfter,
    percentageBefore,
    percentageAfter,
    baselineMonthsToTarget: baselineMonths,
    changedMonthsToTarget: changedMonths,
    trajectory
  };
}
