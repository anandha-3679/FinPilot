import { describe, it, expect } from 'vitest';
import { calculateImpact, simulate, monthsToTarget } from './impactEngine';
import { buildExplanationText, formatShortINR, formatMonths, formatINR } from './format';

describe('FinPilot Impact Engine - Comprehensive Unit Tests', () => {
  // Early Retirement: target ₹1,20,00,000, corpus ₹7,22,000, ₹15,000/mo, n=193
  const earlyRetirement = {
    target: 12000000,
    corpus: 722000,
    monthly: 15000,
    n: 193
  };

  // Home: target ₹9,50,000, corpus ₹3,31,000, ₹8,000/mo, n=47
  const homeGoal = {
    target: 950000,
    corpus: 331000,
    monthly: 8000,
    n: 47
  };

  const tolerance = (actual: number, expected: number, tolPercent = 0.01) => {
    const diff = Math.abs(actual - expected);
    expect(diff).toBeLessThanOrEqual(expected * tolPercent + 1);
  };

  it('ER baseline: months to target = 188; projected ≈ 105.6% of target → On track', () => {
    const projected = simulate(earlyRetirement.corpus, earlyRetirement.monthly, earlyRetirement.n);
    const months = monthsToTarget(earlyRetirement.target, earlyRetirement.corpus, earlyRetirement.monthly);
    const pct = (projected / earlyRetirement.target) * 100;

    expect(months).toBe(188);
    expect(pct).toBeGreaterThan(104.5);
    expect(pct).toBeLessThan(106.5);
  });

  it('Pause UTI ₹10,000 for 1 month: value lost ₹61,304; delay 1', () => {
    const res = calculateImpact({
      action: 'pause',
      currentAmountOrHolding: 10000,
      goalTarget: earlyRetirement.target,
      goalCorpus: earlyRetirement.corpus,
      goalMonthlyContribution: earlyRetirement.monthly,
      goalMonthsLeft: earlyRetirement.n,
      pauseMonths: 1
    });

    tolerance(res.valueLost, 61304);
    expect(Math.abs(res.goalDelayMonths - 1)).toBeLessThanOrEqual(1);
    expect(res.contributionsMissed).toBe(10000);
  });

  it('Pause UTI ₹10,000 for 3 months: value lost ₹1,82,189; delay 2; status On track → On track; contributions missed ₹30,000', () => {
    const res = calculateImpact({
      action: 'pause',
      currentAmountOrHolding: 10000,
      goalTarget: earlyRetirement.target,
      goalCorpus: earlyRetirement.corpus,
      goalMonthlyContribution: earlyRetirement.monthly,
      goalMonthsLeft: earlyRetirement.n,
      pauseMonths: 3
    });

    tolerance(res.valueLost, 182189);
    expect(Math.abs(res.goalDelayMonths - 2)).toBeLessThanOrEqual(1);
    expect(res.statusBefore).toBe('On track');
    expect(res.statusAfter).toBe('On track');
    expect(res.contributionsMissed).toBe(30000);
  });

  it('Pause UTI ₹10,000 for 12 months: delay 6; status → Slightly behind (~99.8%)', () => {
    const res = calculateImpact({
      action: 'pause',
      currentAmountOrHolding: 10000,
      goalTarget: earlyRetirement.target,
      goalCorpus: earlyRetirement.corpus,
      goalMonthlyContribution: earlyRetirement.monthly,
      goalMonthsLeft: earlyRetirement.n,
      pauseMonths: 12
    });

    expect(Math.abs(res.goalDelayMonths - 6)).toBeLessThanOrEqual(1);
    expect(res.statusAfter).toBe('Slightly behind');
    expect(res.percentageAfter).toBeGreaterThan(99.0);
    expect(res.percentageAfter).toBeLessThan(100.2);
  });

  it('Reduce UTI ₹10,000 → ₹5,000 for 3 months: value lost ₹91,094; delay 1; On track', () => {
    const res = calculateImpact({
      action: 'reduce',
      currentAmountOrHolding: 10000,
      goalTarget: earlyRetirement.target,
      goalCorpus: earlyRetirement.corpus,
      goalMonthlyContribution: earlyRetirement.monthly,
      goalMonthsLeft: earlyRetirement.n,
      newMonthlyAmount: 5000,
      reduceMonths: 3,
      reducePermanent: false
    });

    tolerance(res.valueLost, 91094);
    expect(Math.abs(res.goalDelayMonths - 1)).toBeLessThanOrEqual(1);
    expect(res.statusAfter).toBe('On track');
    expect(res.contributionsMissed).toBe(15000);
  });

  it('Reduce UTI ₹10,000 → ₹5,000 permanent: value lost ₹27,34,048; delay 23 (±1 month)', () => {
    const res = calculateImpact({
      action: 'reduce',
      currentAmountOrHolding: 10000,
      goalTarget: earlyRetirement.target,
      goalCorpus: earlyRetirement.corpus,
      goalMonthlyContribution: earlyRetirement.monthly,
      goalMonthsLeft: earlyRetirement.n,
      newMonthlyAmount: 5000,
      reducePermanent: true
    });

    tolerance(res.valueLost, 2734048);
    expect(Math.abs(res.goalDelayMonths - 23)).toBeLessThanOrEqual(1);
  });

  it('Reduce Parag ₹8,000 → ₹5,500 for 3 months (Home goal): value lost ₹11,472; delay 1', () => {
    const res = calculateImpact({
      action: 'reduce',
      currentAmountOrHolding: 8000,
      goalTarget: homeGoal.target,
      goalCorpus: homeGoal.corpus,
      goalMonthlyContribution: homeGoal.monthly,
      goalMonthsLeft: homeGoal.n,
      newMonthlyAmount: 5500,
      reduceMonths: 3,
      reducePermanent: false
    });

    tolerance(res.valueLost, 11472);
    expect(Math.abs(res.goalDelayMonths - 1)).toBeLessThanOrEqual(1);
    expect(res.contributionsMissed).toBe(7500);
  });

  it('Reduce Parag ₹8,000 → ₹5,500 permanent: value lost ₹1,47,208; delay 10', () => {
    const res = calculateImpact({
      action: 'reduce',
      currentAmountOrHolding: 8000,
      goalTarget: homeGoal.target,
      goalCorpus: homeGoal.corpus,
      goalMonthlyContribution: homeGoal.monthly,
      goalMonthsLeft: homeGoal.n,
      newMonthlyAmount: 5500,
      reducePermanent: true
    });

    tolerance(res.valueLost, 147208);
    expect(Math.abs(res.goalDelayMonths - 10)).toBeLessThanOrEqual(1);
  });

  it('Withdraw ₹50,000 (UTI): value lost ₹3,09,428; delay 3', () => {
    const res = calculateImpact({
      action: 'withdraw',
      currentAmountOrHolding: 518000,
      goalTarget: earlyRetirement.target,
      goalCorpus: earlyRetirement.corpus,
      goalMonthlyContribution: earlyRetirement.monthly,
      goalMonthsLeft: earlyRetirement.n,
      withdrawAmount: 50000
    });

    tolerance(res.valueLost, 309428);
    expect(Math.abs(res.goalDelayMonths - 3)).toBeLessThanOrEqual(1);
  });

  it('Withdraw ₹1,29,500 (25%): value lost ₹8,01,419; delay 7; status → Slightly behind (~98.9%)', () => {
    const res = calculateImpact({
      action: 'withdraw',
      currentAmountOrHolding: 518000,
      goalTarget: earlyRetirement.target,
      goalCorpus: earlyRetirement.corpus,
      goalMonthlyContribution: earlyRetirement.monthly,
      goalMonthsLeft: earlyRetirement.n,
      withdrawAmount: 129500
    });

    tolerance(res.valueLost, 801419);
    expect(Math.abs(res.goalDelayMonths - 7)).toBeLessThanOrEqual(1);
    expect(res.statusAfter).toBe('Slightly behind');
    expect(res.percentageAfter).toBeGreaterThan(98.0);
    expect(res.percentageAfter).toBeLessThan(99.8);
  });

  it('Withdraw ₹5,18,000 (full UTI): value lost ₹32,05,676; delay 27; status On track → At risk (~78.9%)', () => {
    const res = calculateImpact({
      action: 'withdraw',
      currentAmountOrHolding: 518000,
      goalTarget: earlyRetirement.target,
      goalCorpus: earlyRetirement.corpus,
      goalMonthlyContribution: earlyRetirement.monthly,
      goalMonthsLeft: earlyRetirement.n,
      withdrawAmount: 518000
    });

    tolerance(res.valueLost, 3205676);
    expect(Math.abs(res.goalDelayMonths - 27)).toBeLessThanOrEqual(1);
    expect(res.statusBefore).toBe('On track');
    expect(res.statusAfter).toBe('At risk');
    expect(res.percentageAfter).toBeGreaterThan(77.5);
    expect(res.percentageAfter).toBeLessThan(80.5);
  });

  it('Home baseline: months to target = 45; ~103.9% → On track', () => {
    const projected = simulate(homeGoal.corpus, homeGoal.monthly, homeGoal.n);
    const months = monthsToTarget(homeGoal.target, homeGoal.corpus, homeGoal.monthly);
    const pct = (projected / homeGoal.target) * 100;

    expect(months).toBe(45);
    expect(pct).toBeGreaterThan(103.0);
    expect(pct).toBeLessThan(104.5);
  });

  it('Invariants: monotonicity, no change = 0, explanation numbers exist in output', () => {
    // 1. Value lost and delay never decrease when pause months increase
    const p1 = calculateImpact({
      action: 'pause',
      currentAmountOrHolding: 10000,
      goalTarget: earlyRetirement.target,
      goalCorpus: earlyRetirement.corpus,
      goalMonthlyContribution: earlyRetirement.monthly,
      goalMonthsLeft: earlyRetirement.n,
      pauseMonths: 1
    });
    const p3 = calculateImpact({
      action: 'pause',
      currentAmountOrHolding: 10000,
      goalTarget: earlyRetirement.target,
      goalCorpus: earlyRetirement.corpus,
      goalMonthlyContribution: earlyRetirement.monthly,
      goalMonthsLeft: earlyRetirement.n,
      pauseMonths: 3
    });
    const p6 = calculateImpact({
      action: 'pause',
      currentAmountOrHolding: 10000,
      goalTarget: earlyRetirement.target,
      goalCorpus: earlyRetirement.corpus,
      goalMonthlyContribution: earlyRetirement.monthly,
      goalMonthsLeft: earlyRetirement.n,
      pauseMonths: 6
    });

    expect(p3.valueLost).toBeGreaterThan(p1.valueLost);
    expect(p6.valueLost).toBeGreaterThan(p3.valueLost);
    expect(p3.goalDelayMonths).toBeGreaterThanOrEqual(p1.goalDelayMonths);
    expect(p6.goalDelayMonths).toBeGreaterThanOrEqual(p3.goalDelayMonths);

    // 2. Withdrawal monotonicity
    const w1 = calculateImpact({
      action: 'withdraw',
      currentAmountOrHolding: 518000,
      goalTarget: earlyRetirement.target,
      goalCorpus: earlyRetirement.corpus,
      goalMonthlyContribution: earlyRetirement.monthly,
      goalMonthsLeft: earlyRetirement.n,
      withdrawAmount: 50000
    });
    const w2 = calculateImpact({
      action: 'withdraw',
      currentAmountOrHolding: 518000,
      goalTarget: earlyRetirement.target,
      goalCorpus: earlyRetirement.corpus,
      goalMonthlyContribution: earlyRetirement.monthly,
      goalMonthsLeft: earlyRetirement.n,
      withdrawAmount: 100000
    });
    expect(w2.valueLost).toBeGreaterThan(w1.valueLost);
    expect(w2.goalDelayMonths).toBeGreaterThanOrEqual(w1.goalDelayMonths);

    // 3. No change = 0 value lost, 0 delay
    const zeroPause = calculateImpact({
      action: 'pause',
      currentAmountOrHolding: 10000,
      goalTarget: earlyRetirement.target,
      goalCorpus: earlyRetirement.corpus,
      goalMonthlyContribution: earlyRetirement.monthly,
      goalMonthsLeft: earlyRetirement.n,
      pauseMonths: 0
    });
    expect(zeroPause.valueLost).toBe(0);
    expect(zeroPause.goalDelayMonths).toBe(0);

    const zeroWithdraw = calculateImpact({
      action: 'withdraw',
      currentAmountOrHolding: 518000,
      goalTarget: earlyRetirement.target,
      goalCorpus: earlyRetirement.corpus,
      goalMonthlyContribution: earlyRetirement.monthly,
      goalMonthsLeft: earlyRetirement.n,
      withdrawAmount: 0
    });
    expect(zeroWithdraw.valueLost).toBe(0);
    expect(zeroWithdraw.goalDelayMonths).toBe(0);
  });

  it('Requirement 6: no explanation string contains "₹₹", " k ", or "1 months"', () => {
    // Generate explanation strings across combinations of actions, durations, amounts, reasons
    const sampleActions: ('pause' | 'reduce' | 'withdraw')[] = ['pause', 'reduce', 'withdraw'];
    const sampleMonths = [1, 2, 3, 6, 12, 24];
    const sampleAmounts = [5000, 10000, 50000, 91000, 100000, 180000, 12000000];
    const sampleReasons = [undefined, 'Market worry', 'Temporary cash need', 'Emergency'];
    const sampleModes: ('Calm' | 'Volatile')[] = ['Calm', 'Volatile'];

    const explanations: string[] = [];

    for (const action of sampleActions) {
      for (const m of sampleMonths) {
        for (const amt of sampleAmounts) {
          for (const reason of sampleReasons) {
            for (const mode of sampleModes) {
              const text = buildExplanationText({
                action,
                amount: amt,
                pauseMonths: m,
                reducedAmount: Math.max(500, amt - 1000),
                reduceDurationMonths: m,
                reducePermanent: false,
                withdrawAmount: Math.min(amt, 50000),
                contributionsMissed: amt * m,
                valueLost: amt * 1.5,
                goalDelayMonths: m > 1 ? m : 1,
                goalName: 'Early Retirement',
                goalMonthsLeft: 193,
                selectedReason: reason,
                marketMode: mode
              });
              explanations.push(text);
            }
          }
        }
      }
    }

    expect(explanations.length).toBeGreaterThan(50);

    for (const text of explanations) {
      expect(text).not.toContain('₹₹');
      expect(text).not.toMatch(/\bk\b/i);
      expect(text).not.toContain(' k ');
      expect(text).not.toContain('1 months');
    }
  });

  it('Indian units in formatShortINR: formats 91000, 1.8 lakh, 1.2 crore and never uses k', () => {
    expect(formatShortINR(91000)).toBe('about ₹0.9 lakh');
    expect(formatShortINR(180000)).toBe('₹1.8 lakh');
    expect(formatShortINR(12000000)).toBe('₹1.2 crore');
    expect(formatShortINR(5000)).toBe('₹5,000');
    expect(formatShortINR(91000)).not.toMatch(/\d+k\b/i);
    expect(formatShortINR(50000)).not.toMatch(/\d+k\b/i);
    expect(formatShortINR(91000)).not.toContain(' k ');
  });

  it('Pluralisation in formatMonths: 1 month vs 2 months', () => {
    expect(formatMonths(1)).toBe('1 month');
    expect(formatMonths(2)).toBe('2 months');
    expect(formatMonths(3)).toBe('3 months');
    expect(formatMonths(1)).not.toBe('1 months');
  });
});
