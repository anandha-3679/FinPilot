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
  } else if (absVal >= 10000) {
    const lakh = absVal / 100000;
    formatted = `about ₹${lakh.toFixed(1)} lakh`;
  } else {
    formatted = `₹${Math.round(absVal).toLocaleString('en-IN')}`;
  }

  return isNegative ? `-${formatted}` : formatted;
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
    )} less, and ${goalName} could be reached ${delayDesc}. Based on ${formatMonths(goalMonthsLeft)} to go and an assumed ${assumedRate}% a year.`;
  } else if (action === 'reduce') {
    const durText = reducePermanent ? 'permanently' : `for ${formatMonths(reduceDurationMonths)}`;
    const delayDesc = goalDelayMonths > 0 ? `delaying ${goalName} by ${delayText}.` : `keeping ${goalName} on schedule.`;
    targetText = `Reducing to ${formatINR(reducedAmount)}/month ${durText} means investing ${formatShortINR(
      contributionsMissed
    )} less. By ${goalDate}, that could result in ${formatShortINR(
      valueLost
    )} lower corpus, ${delayDesc}`;
  } else {
    const delayDesc = goalDelayMonths > 0 ? `delay ${goalName} by ${delayText}.` : `no delay to ${goalName}.`;
    targetText = `Withdrawing ${formatINR(withdrawAmount)} could mean ${formatShortINR(
      valueLost
    )} less at the goal date and ${delayDesc}`;
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
