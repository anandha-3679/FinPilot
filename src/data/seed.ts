export interface Holding {
  id: string;
  fundName: string;
  invested: number;
  current: number;
  linkedGoal: string;
  assetClass: string;
  units: number;
  nav: number;
}

export interface SIP {
  id: string;
  fundName: string;
  amount: number;
  status: 'Active' | 'Paused';
  nextDebit: string;
  linkedGoal: string;
  totalInvested: number;
  pausedUntil?: string;
  autoResumes?: boolean;
}

export interface Goal {
  id: string;
  name: string;
  target: number;
  targetDate: string; // "Dec 2042"
  monthsLeft: number; // 193
  corpusNow: number;
  monthlyContribution: number;
  linkedFunds: string[];
  status: 'On track' | 'Slightly behind' | 'At risk';
}

export interface DecisionRecord {
  id: string;
  date: string;
  reasonCategory: string;
  action: string;
  durationOrAmount: string;
  outcome: string;
  fundName?: string;
}

export interface ActivityItem {
  id: string;
  date: string;
  type: 'SIP_DEBIT' | 'SIP_PAUSE' | 'SIP_REDUCE' | 'WITHDRAW' | 'INVESTMENT_ADD' | 'DECISION_SAVED';
  title: string;
  description: string;
  amount?: number;
}

export interface CheckInReminder {
  id: string;
  date: string;
  title: string;
  description: string;
  actionType: 'resume_sip' | 'review_withdrawal' | 'general';
  relatedId?: string;
}

export const SEED_HOLDINGS: Holding[] = [
  {
    id: 'h_1',
    fundName: 'UTI Nifty 50 Index Fund',
    invested: 420000,
    current: 518000,
    linkedGoal: 'Early Retirement',
    assetClass: 'Large Cap Index',
    units: 3241.5,
    nav: 159.8
  },
  {
    id: 'h_2',
    fundName: 'Parag Parikh Flexi Cap Fund',
    invested: 260000,
    current: 331000,
    linkedGoal: 'Home Down Payment',
    assetClass: 'Flexi Cap',
    units: 4127.1,
    nav: 80.2
  },
  {
    id: 'h_3',
    fundName: 'HDFC Mid-Cap Opportunities Fund',
    invested: 180000,
    current: 204000,
    linkedGoal: 'Early Retirement',
    assetClass: 'Mid Cap',
    units: 1165.7,
    nav: 175.0
  }
];

export const SEED_SIPS: SIP[] = [
  {
    id: 'sip_1',
    fundName: 'UTI Nifty 50 Index Fund',
    amount: 10000,
    status: 'Active',
    nextDebit: '5 Nov 2026',
    linkedGoal: 'Early Retirement',
    totalInvested: 420000
  },
  {
    id: 'sip_2',
    fundName: 'Parag Parikh Flexi Cap Fund',
    amount: 8000,
    status: 'Active',
    nextDebit: '5 Nov 2026',
    linkedGoal: 'Home Down Payment',
    totalInvested: 260000
  },
  {
    id: 'sip_3',
    fundName: 'HDFC Mid-Cap Opportunities Fund',
    amount: 5000,
    status: 'Active',
    nextDebit: '5 Nov 2026',
    linkedGoal: 'Early Retirement',
    totalInvested: 180000
  }
];

export const SEED_GOALS: Goal[] = [
  {
    id: 'g_1',
    name: 'Early Retirement',
    target: 12000000,
    targetDate: 'Dec 2042',
    monthsLeft: 193,
    corpusNow: 722000, // UTI 5,18,000 + HDFC 2,04,000
    monthlyContribution: 15000, // UTI 10,000 + HDFC 5,000
    linkedFunds: ['UTI Nifty 50 Index Fund', 'HDFC Mid-Cap Opportunities Fund'],
    status: 'On track'
  },
  {
    id: 'g_2',
    name: 'Home Down Payment',
    target: 950000,
    targetDate: 'Oct 2030',
    monthsLeft: 47,
    corpusNow: 331000, // Parag Parikh
    monthlyContribution: 8000, // Parag Parikh
    linkedFunds: ['Parag Parikh Flexi Cap Fund'],
    status: 'On track'
  }
];

export const SEED_DECISIONS: DecisionRecord[] = [
  {
    id: 'dec_1',
    date: '12 Mar 2026',
    reasonCategory: 'Market worry',
    action: 'Paused UTI SIP (₹10,000/mo)',
    durationOrAmount: '6 weeks',
    outcome: 'Resumed. Nifty 50 rose 7.8% while paused; you missed about ₹2,140 of gains.',
    fundName: 'UTI Nifty 50 Index Fund'
  },
  {
    id: 'dec_2',
    date: '18 Jun 2026',
    reasonCategory: 'Temporary cash need',
    action: 'Paused UTI SIP (₹10,000/mo)',
    durationOrAmount: '1 month',
    outcome: 'Resumed on schedule, no goal impact.',
    fundName: 'UTI Nifty 50 Index Fund'
  },
  {
    id: 'dec_3',
    date: '2 Feb 2026',
    reasonCategory: 'Emergency',
    action: 'Withdrew ₹20,000',
    durationOrAmount: '₹20,000',
    outcome: 'No goal impact.',
    fundName: 'UTI Nifty 50 Index Fund'
  }
];

export const SEED_ACTIVITIES: ActivityItem[] = [
  {
    id: 'act_1',
    date: '5 Oct 2026',
    type: 'SIP_DEBIT',
    title: 'Monthly SIP executed',
    description: 'Auto-debited ₹23,000 across 3 active funds',
    amount: 23000
  },
  {
    id: 'act_2',
    date: '18 Jun 2026',
    type: 'DECISION_SAVED',
    title: 'Decision recorded',
    description: 'Paused UTI Nifty 50 Index Fund for 1 month (Temporary cash need)'
  },
  {
    id: 'act_3',
    date: '12 Mar 2026',
    type: 'DECISION_SAVED',
    title: 'Decision recorded',
    description: 'Paused UTI Nifty 50 Index Fund for 6 weeks (Market worry)'
  }
];

export const SEED_CHECKINS: CheckInReminder[] = [
  {
    id: 'chk_1',
    date: '18 Jul 2026',
    title: 'SIP Auto-Resume Check',
    description: 'UTI Nifty 50 Index Fund auto-resumed on schedule.',
    actionType: 'resume_sip',
    relatedId: 'sip_1'
  }
];

export const USER_INFO = {
  id: 'u_4821',
  name: 'Aarav Mehta',
  today: 'Monday, 2 Nov 2026',
  nextSIPDebit: '5 Nov 2026',
  availableCash: 62000
};
