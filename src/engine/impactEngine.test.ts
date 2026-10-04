import { describe, it, expect } from 'vitest';
import { calculateImpact, simulate, monthsToTarget } from './impactEngine';

describe('FinPilot Impact Engine - Section 12 Acceptance Tests', () => {
  // Goal 1: Early Retirement
  // Target: ₹1,20,00,000, n = 193 months, Corpus = ₹7,22,000, Monthly = ₹15,000
  const earlyRetirement = {
    target: 12000000,
    corpus: 722000,
    monthly: 15000,
    n: 193
  };

  // Goal 2: Home Down Payment
  // Target: ₹9,50,000, n = 47 months, Corpus = ₹3,31,000, Monthly = ₹8,000
  const homeGoal = {
    target: 950000,
    corpus: 331000,
    monthly: 8000,
    n: 47
  };

  it('Case 1: Early Retirement baseline', () => {
    const projected = simulate(earlyRetirement.corpus, earlyRetirement.monthly, earlyRetirement.n);
    const months = monthsToTarget(earlyRetirement.target, earlyRetirement.corpus, earlyRetirement.monthly);
    const pct = (projected / earlyRetirement.target) * 100;

    // Expected: projected ≈ ₹1,26,70,000 (≈105.6%) -> On track; months to target ≈ 188
    expect(projected).toBeGreaterThan(12500000);
    expect(projected).toBeLessThan(12800000);
    expect(pct).toBeGreaterThan(104.5);
    expect(pct).toBeLessThan(106.5);
    expect(months).toBe(188);
  });

  it('Case 2: Pause UTI ₹10,000 for 3 months', () => {
    const res = calculateImpact({
      action: 'pause',
      currentAmountOrHolding: 10000,
      goalTarget: earlyRetirement.target,
      goalCorpus: earlyRetirement.corpus,
      goalMonthlyContribution: earlyRetirement.monthly,
      goalMonthsLeft: earlyRetirement.n,
      pauseMonths: 3
    });

    // Expected: value lost ≈ ₹1,82,189; goal delay ≈ 2 months; status stays On track (~104%)
    expect(res.valueLost).toBeGreaterThan(180000);
    expect(res.valueLost).toBeLessThan(185000);
    expect(res.goalDelayMonths).toBe(2);
    expect(res.statusAfter).toBe('On track');
    expect(res.percentageAfter).toBeGreaterThan(103);
    expect(res.percentageAfter).toBeLessThan(105);
  });

  it('Case 3: Pause UTI ₹10,000 for 12 months', () => {
    const res = calculateImpact({
      action: 'pause',
      currentAmountOrHolding: 10000,
      goalTarget: earlyRetirement.target,
      goalCorpus: earlyRetirement.corpus,
      goalMonthlyContribution: earlyRetirement.monthly,
      goalMonthsLeft: earlyRetirement.n,
      pauseMonths: 12
    });

    // Expected: goal delay ≈ 6 months; status -> Slightly behind (~99.8%)
    expect(res.goalDelayMonths).toBe(6);
    expect(res.statusAfter).toBe('Slightly behind');
    expect(res.percentageAfter).toBeGreaterThan(99.0);
    expect(res.percentageAfter).toBeLessThan(100.2);
  });

  it('Case 4: Withdraw ₹5,18,000 (full UTI)', () => {
    const res = calculateImpact({
      action: 'withdraw',
      currentAmountOrHolding: 518000,
      goalTarget: earlyRetirement.target,
      goalCorpus: earlyRetirement.corpus,
      goalMonthlyContribution: earlyRetirement.monthly,
      goalMonthsLeft: earlyRetirement.n,
      withdrawAmount: 518000
    });

    // Expected: value lost ≈ ₹32,05,676; goal delay ≈ 27 months; status On track -> At risk (~78.9%)
    expect(res.valueLost).toBeGreaterThan(3170000);
    expect(res.valueLost).toBeLessThan(3240000);
    expect(res.goalDelayMonths).toBe(27);
    expect(res.statusAfter).toBe('At risk');
    expect(res.percentageAfter).toBeGreaterThan(77.5);
    expect(res.percentageAfter).toBeLessThan(80.5);
  });

  it('Case 5: Withdraw 25% (₹1,29,500)', () => {
    const res = calculateImpact({
      action: 'withdraw',
      currentAmountOrHolding: 518000,
      goalTarget: earlyRetirement.target,
      goalCorpus: earlyRetirement.corpus,
      goalMonthlyContribution: earlyRetirement.monthly,
      goalMonthsLeft: earlyRetirement.n,
      withdrawAmount: 129500
    });

    // Expected: value lost ≈ ₹8,01,419; goal delay ≈ 7 months; status -> Slightly behind (~98.9%)
    expect(res.valueLost).toBeGreaterThan(790000);
    expect(res.valueLost).toBeLessThan(815000);
    expect(res.goalDelayMonths).toBe(7);
    expect(res.statusAfter).toBe('Slightly behind');
    expect(res.percentageAfter).toBeGreaterThan(98.0);
    expect(res.percentageAfter).toBeLessThan(99.8);
  });

  it('Case 6: Home goal baseline', () => {
    const projected = simulate(homeGoal.corpus, homeGoal.monthly, homeGoal.n);
    const months = monthsToTarget(homeGoal.target, homeGoal.corpus, homeGoal.monthly);
    const pct = (projected / homeGoal.target) * 100;

    // Expected: ≈ 103.9% of ₹9,50,000 -> On track; months to target ≈ 45
    expect(pct).toBeGreaterThan(103.0);
    expect(pct).toBeLessThan(104.5);
    expect(months).toBe(45);
  });

  it('Case 7: Reduce Parag Parikh ₹8,000 -> ₹5,500', () => {
    const res = calculateImpact({
      action: 'reduce',
      currentAmountOrHolding: 8000,
      goalTarget: homeGoal.target,
      goalCorpus: homeGoal.corpus,
      goalMonthlyContribution: homeGoal.monthly,
      goalMonthsLeft: homeGoal.n,
      newMonthlyAmount: 5500
    });

    // Expected: value lost ≈ ₹1,47,208 (sum over whole horizon); goal delay ≈ 10 months
    expect(res.valueLost).toBeGreaterThan(145000);
    expect(res.valueLost).toBeLessThan(149000);
    expect(res.goalDelayMonths).toBe(10);
  });
});
