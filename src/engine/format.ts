/**
 * Formatting utilities for FinPilot & ApexBroker
 * 
 * Rules:
 * - Currency ₹ with Indian digit grouping (e.g. ₹10,53,000)
 * - Short form helper for big numbers: ₹1.82 lakh, ₹3.2 crore
 * - Strict uppercase everywhere for: SIP, SIPs, NAV, AUM, AMFI
 */

/**
 * Formats a number to Indian Rupee standard format (e.g., 1053000 -> "₹10,53,000")
 */
export function formatINR(value: number, includeDecimals = false): string {
  if (isNaN(value)) return '₹0';
  const isNegative = value < 0;
  const absVal = Math.abs(value);

  const rounded = includeDecimals ? absVal.toFixed(2) : Math.round(absVal).toString();
  const [intPart, decPart] = rounded.split('.');

  let result = '';
  if (intPart.length <= 3) {
    result = intPart;
  } else {
    const last3 = intPart.substring(intPart.length - 3);
    const otherDigits = intPart.substring(0, intPart.length - 3);
    const withCommas = otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    result = `${withCommas},${last3}`;
  }

  const formatted = decPart !== undefined ? `₹${result}.${decPart}` : `₹${result}`;
  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Short form helper for big numbers in Indian numbering system:
 * >= 1,00,00,000 -> crore
 * >= 1,00,000 -> lakh
 * e.g., 182000 -> "₹1.82 lakh", 12000000 -> "₹1.20 crore"
 */
export function formatShortINR(value: number): string {
  if (isNaN(value)) return '₹0';
  const isNegative = value < 0;
  const absVal = Math.abs(value);

  let formatted = '';
  if (absVal >= 10000000) {
    const cr = absVal / 10000000;
    formatted = `₹${cr.toFixed(2).replace(/\.?0+$/, '')} crore`;
  } else if (absVal >= 100000) {
    const lakh = absVal / 100000;
    formatted = `₹${lakh.toFixed(2).replace(/\.?0+$/, '')} lakh`;
  } else {
    // Below ₹1 lakh: always whole rupees with Indian grouping
    formatted = formatINR(absVal);
  }

  return isNegative ? `-${formatted}` : formatted;
}

export type ActionCategory = 'pause' | 'reduce' | 'withdraw' | 'keep' | 'other';

/**
 * Normalises a decision record action string or type into an ActionCategory
 */
export function getDecisionActionCategory(actionStr: string): ActionCategory {
  const lower = actionStr.toLowerCase();
  if (lower.startsWith('pause')) return 'pause';
  if (lower.startsWith('reduce')) return 'reduce';
  if (lower.startsWith('withdr') || lower.includes('withdrew') || lower.includes('cash reserve')) return 'withdraw';
  if (lower.startsWith('keep') || lower.startsWith('decided to keep')) return 'keep';
  return 'other';
}

/**
 * Re-formats any ungrouped ₹ amounts (e.g. "₹50000", "₹50,000") in text with Indian grouping.
 */
export function groupRupeesInText(text: string): string {
  return text.replace(/₹(\d[\d,]*)/g, (_m, num: string) => formatINR(Number(num.replace(/,/g, ''))));
}

/**
 * Formats duration in months to a human readable string.
 */
export function formatMonths(months: number): string {
  if (months === 0) return '0 months';
  if (months === 1) return '1 month';
  if (months < 12) return `${months} months`;
  const years = Math.floor(months / 12);
  const remaining = months % 12;
  if (remaining === 0) {
    return years === 1 ? '1 year' : `${years} years`;
  }
  return `${years} yr ${remaining} mo`;
}

/**
 * Formats a Date object or string to Indian standard date "2 Nov 2026"
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export interface ExplanationParams {
  action: 'pause' | 'reduce' | 'withdraw';
  amount: number;
  pauseMonths?: number;
  reducedAmount?: number;
  reduceDurationMonths?: number;
  reducePermanent?: boolean;
  withdrawAmount?: number;
  contributionsMissed: number;
  valueLost: number;
  goalDelayMonths: number;
  goalName: string;
  goalMonthsLeft: number;
  goalDate?: string;
  assumedRate?: number;
  selectedReason?: string;
  marketMode?: 'Calm' | 'Volatile';
}

/**
 * Builds deterministic explanation text complying with Indian formatting,
 * singular/plural months, and no duplicate currency symbols.
 */
export function buildExplanationText(params: ExplanationParams): string {
  const {
    action,
    amount,
    pauseMonths = 3,
    reducedAmount = 5000,
    reduceDurationMonths = 3,
    reducePermanent = false,
    withdrawAmount = 0,
    contributionsMissed,
    valueLost,
    goalDelayMonths,
    goalName,
    goalMonthsLeft,
    goalDate = 'Dec 2042',
    assumedRate = 12,
    selectedReason,
    marketMode = 'Calm'
  } = params;

  let targetText = '';
  const delayText = formatMonths(goalDelayMonths);

  if (action === 'pause') {
    const delayDesc = goalDelayMonths > 0 ? `${delayText} later` : 'on time';
    targetText = `Pausing ${formatINR(amount)}/month for ${formatMonths(pauseMonths)} means ${formatShortINR(
      contributionsMissed
    )} less invested. By ${goalDate}, that could mean ${formatShortINR(
      valueLost
    )} less, and ${goalName} could be reached ${delayDesc}. Based on ${goalMonthsLeft} months (${formatMonths(goalMonthsLeft)}) to go and an assumed ${assumedRate}% a year.`;
  } else if (action === 'reduce') {
    const durText = reducePermanent ? 'permanently' : `for ${formatMonths(reduceDurationMonths)}`;
    const delayDesc = goalDelayMonths > 0 ? `delaying ${goalName} by ${delayText}.` : `keeping ${goalName} on schedule.`;
    targetText = `Reducing to ${formatINR(reducedAmount)}/month ${durText} means investing ${formatShortINR(
      contributionsMissed
    )} less. By ${goalDate}, that could result in ${formatShortINR(
      valueLost
    )} lower corpus, ${delayDesc} Based on ${goalMonthsLeft} months (${formatMonths(goalMonthsLeft)}) to go and an assumed ${assumedRate}% a year.`;
  } else {
    const delayDesc = goalDelayMonths > 0 ? `delay ${goalName} by ${delayText}.` : `no delay to ${goalName}.`;
    targetText = `Withdrawing ${formatINR(withdrawAmount)} could mean ${formatShortINR(
      valueLost
    )} less by ${goalDate} and ${delayDesc} Based on ${goalMonthsLeft} months (${formatMonths(goalMonthsLeft)}) to go and an assumed ${assumedRate}% a year.`;
  }

  if (selectedReason === 'Market worry') {
    if (marketMode === 'Volatile') {
      targetText += ` Nifty 50 is down 4.2% this week. Your last 3 instalments bought at lower prices, so pausing means missing those units.`;
    } else {
      targetText += ` Markets have been steady this week.`;
    }
  }

  return targetText;
}

export interface SuggestedPlanParams {
  currentAction: 'pause' | 'reduce' | 'withdraw';
  matchedActionStr: string;
  matchedReason: string;
  matchedOutcome?: string;
  availableCash?: number;
  withdrawAmount?: number;
}

/**
 * Generates a tailored suggested plan for the CURRENT action (pause / reduce / withdraw)
 * based on the past decision record and context.
 */
export function buildSuggestedPlan(params: SuggestedPlanParams): string {
  const {
    currentAction,
    matchedActionStr,
    matchedReason,
    matchedOutcome = '',
    availableCash = 0,
    withdrawAmount = 0
  } = params;

  // Specific cash check for withdrawal
  if (currentAction === 'withdraw' && /cash/i.test(matchedActionStr) && availableCash < withdrawAmount) {
    const suggestedAmt = Math.max(1000, Math.min(availableCash, withdrawAmount));
    return `Last time cash covered this. Cash is now ${formatINR(availableCash)}, so cash alone won't cover it. Consider withdrawing a smaller amount (for example ${formatINR(suggestedAmt)}) and keeping the rest invested.`;
  }

  // If past record outcome mentions missed gains or dip costs (e.g. dec_1: "Resumed. Nifty 50 rose 7.8% while paused; you missed about ₹2,140 of gains.")
  const missedGainsMatch = matchedOutcome.match(/missed about (₹[\d,]+)/i);
  const costGainsStr = missedGainsMatch ? missedGainsMatch[1] : null;

  if (currentAction === 'withdraw') {
    if (costGainsStr) {
      return `Last time, pausing during a dip cost about ${costGainsStr} in missed gains. Consider withdrawing a smaller amount and keeping the rest invested.`;
    }
    if (matchedReason === 'Emergency') {
      if (availableCash >= withdrawAmount) {
        return `Check if available cash (${formatINR(availableCash)}) can cover this without withdrawing from your goal fund.`;
      }
      return 'Consider withdrawing a smaller amount now and keeping the rest invested toward your goal.';
    }
    if (matchedReason === 'Market worry') {
      return 'Last time, changing course during market worry had a cost. Consider withdrawing a smaller amount and keeping the rest invested.';
    }
    if (matchedReason === 'Temporary cash need') {
      return 'Consider withdrawing a smaller amount or exploring short-term cash reserves before liquidating goal units.';
    }
    if (matchedReason === 'Big purchase') {
      return 'Consider withdrawing a smaller amount now and keeping the rest invested toward your goal.';
    }
    if (matchedReason === 'Rebalancing') {
      return 'Review your allocation first; a smaller withdrawal or adjustment may be enough.';
    }
    return 'Consider withdrawing a smaller amount and keeping the rest invested.';
  }

  if (currentAction === 'reduce') {
    if (costGainsStr) {
      return `Last time, pausing cost about ${costGainsStr} in missed gains. A temporary reduction helps keep instalments active while freeing up cash.`;
    }
    if (matchedReason === 'Temporary cash need') {
      return 'Consider a temporary reduction for 1–3 months with auto-restore rather than a permanent change.';
    }
    if (matchedReason === 'Market worry') {
      return 'Consider reducing temporarily instead of a full pause so some instalments continue buying units.';
    }
    if (matchedReason === 'Emergency') {
      return 'Reduce temporarily to address immediate needs while keeping your compounding journey active.';
    }
    return 'Consider reducing temporarily with auto-restore rather than a permanent reduction.';
  }

  // currentAction === 'pause'
  if (costGainsStr) {
    return `Last time, pausing cost about ${costGainsStr} in missed gains. If you pause, set an auto-resume (e.g. 1 month) to limit missed compounding.`;
  }
  if (matchedReason === 'Temporary cash need') {
    return 'Same plan as last time: pause 1 month with auto-resume.';
  }
  if (matchedReason === 'Market worry') {
    return 'Consider reducing temporarily instead of a full pause so some instalments continue.';
  }
  if (matchedReason === 'Emergency') {
    return 'Check if available cash can fulfill the emergency without pausing ongoing SIP investments.';
  }
  return 'Pause for a short duration with auto-resume, then review at your 30-day check-in.';
}
