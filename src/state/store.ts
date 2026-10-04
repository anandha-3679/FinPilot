import { useState, useEffect } from 'react';
import {
  Holding,
  SIP,
  Goal,
  DecisionRecord,
  ActivityItem,
  CheckInReminder,
  SEED_HOLDINGS,
  SEED_SIPS,
  SEED_GOALS,
  SEED_DECISIONS,
  SEED_ACTIVITIES,
  SEED_CHECKINS,
  USER_INFO
} from '../data/seed';
import { calculateImpact } from '../engine/impactEngine';

export interface AppState {
  holdings: Holding[];
  sips: SIP[];
  goals: Goal[];
  decisions: DecisionRecord[];
  activities: ActivityItem[];
  checkIns: CheckInReminder[];
  availableCash: number;
  marketMode: 'Calm' | 'Volatile';
  llmSpeed: 'Fast' | 'Slow';
  toasts: { id: string; message: string; type?: 'success' | 'info' }[];
}

const STORAGE_KEY = 'finpilot_apex_broker_state_v1';

function getInitialState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to parse state from localStorage', err);
  }
  return {
    holdings: SEED_HOLDINGS,
    sips: SEED_SIPS,
    goals: SEED_GOALS,
    decisions: SEED_DECISIONS,
    activities: SEED_ACTIVITIES,
    checkIns: SEED_CHECKINS,
    availableCash: USER_INFO.availableCash,
    marketMode: 'Calm',
    llmSpeed: 'Fast',
    toasts: []
  };
}

export function useAppStore() {
  const [state, setState] = useState<AppState>(getInitialState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error('Failed to persist state', err);
    }
  }, [state]);

  const addToast = (message: string, type: 'success' | 'info' = 'success') => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setState((prev) => ({
      ...prev,
      toasts: [...prev.toasts, { id, message, type }]
    }));
    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        toasts: prev.toasts.filter((t) => t.id !== id)
      }));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setState((prev) => ({
      ...prev,
      toasts: prev.toasts.filter((t) => t.id !== id)
    }));
  };

  const resetDemo = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState({
      holdings: SEED_HOLDINGS,
      sips: SEED_SIPS,
      goals: SEED_GOALS,
      decisions: SEED_DECISIONS,
      activities: SEED_ACTIVITIES,
      checkIns: SEED_CHECKINS,
      availableCash: USER_INFO.availableCash,
      marketMode: 'Calm',
      llmSpeed: 'Fast',
      toasts: []
    });
    addToast('Demo state reset to sample data', 'info');
  };

  const setMarketMode = (mode: 'Calm' | 'Volatile') => {
    setState((prev) => ({ ...prev, marketMode: mode }));
  };

  const setLlmSpeed = (speed: 'Fast' | 'Slow') => {
    setState((prev) => ({ ...prev, llmSpeed: speed }));
  };

  const deleteDecision = (id: string) => {
    setState((prev) => ({
      ...prev,
      decisions: prev.decisions.filter((d) => d.id !== id),
      activities: [
        {
          id: `act_${Date.now()}`,
          date: '2 Nov 2026',
          type: 'DECISION_SAVED',
          title: 'Memory record deleted',
          description: 'A Decision Memory entry was deleted.'
        },
        ...prev.activities
      ]
    }));
    addToast('Decision Memory record deleted', 'info');
  };

  // Execute a decision finalized in FinPilot
  const applyFinPilotDecision = (params: {
    decisionType: 'keep' | 'reduce' | 'pause_autoresume' | 'pause_proceed' | 'reduce_amount' | 'use_cash' | 'withdraw_anyway';
    fundName: string;
    reasonCategory: string;
    newAmount?: number;
    pauseMonths?: number;
    withdrawAmount?: number;
    rememberDecision?: boolean;
  }) => {
    const {
      decisionType,
      fundName,
      reasonCategory,
      newAmount,
      pauseMonths = 3,
      withdrawAmount = 0,
      rememberDecision = true
    } = params;

    setState((prev) => {
      let updatedHoldings = [...prev.holdings];
      let updatedSIPs = [...prev.sips];
      let updatedCash = prev.availableCash;
      let updatedDecisions = [...prev.decisions];
      let updatedActivities = [...prev.activities];
      let updatedCheckIns = [...prev.checkIns];

      // Format resume date (today = Nov 2026)
      const resumeMonth = 11 + pauseMonths; // 1-indexed
      const resYear = 2026 + Math.floor((resumeMonth - 1) / 12);
      const resMoIndex = ((resumeMonth - 1) % 12);
      const moNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const resumeDateStr = `5 ${moNames[resMoIndex]} ${resYear}`;

      if (decisionType === 'keep') {
        // No modification to SIP or Holding
        if (rememberDecision) {
          updatedDecisions = [
            {
              id: `dec_${Date.now()}`,
              date: '2 Nov 2026',
              reasonCategory,
              action: `Decided to keep ${fundName} active`,
              durationOrAmount: 'No change',
              outcome: 'Awaiting outcome (30-day check-in).',
              fundName
            },
            ...updatedDecisions
          ];
        }
      } else if (decisionType === 'pause_autoresume' || decisionType === 'pause_proceed') {
        const isAuto = decisionType === 'pause_autoresume';
        updatedSIPs = updatedSIPs.map((s) => {
          if (s.fundName === fundName) {
            return {
              ...s,
              status: 'Paused',
              pausedUntil: resumeDateStr,
              autoResumes: isAuto
            };
          }
          return s;
        });

        if (rememberDecision) {
          updatedDecisions = [
            {
              id: `dec_${Date.now()}`,
              date: '2 Nov 2026',
              reasonCategory,
              action: `Paused ${fundName} for ${pauseMonths} mo${isAuto ? ' (auto-resume)' : ''}`,
              durationOrAmount: `${pauseMonths} months`,
              outcome: 'Awaiting outcome (30-day check-in).',
              fundName
            },
            ...updatedDecisions
          ];
        }

        updatedActivities = [
          {
            id: `act_${Date.now()}`,
            date: '2 Nov 2026',
            type: 'SIP_PAUSE',
            title: `SIP Paused: ${fundName}`,
            description: `Paused for ${pauseMonths} months (until ${resumeDateStr})`
          },
          ...updatedActivities
        ];

        updatedCheckIns = [
          {
            id: `chk_${Date.now()}`,
            date: '2 Dec 2026',
            title: 'Ready to resume your SIP?',
            description: `Check-in scheduled for your paused ${fundName} SIP.`,
            actionType: 'resume_sip'
          },
          ...updatedCheckIns
        ];
      } else if (decisionType === 'reduce' || decisionType === 'reduce_amount') {
        const targetAmount = newAmount !== undefined ? newAmount : 0;
        updatedSIPs = updatedSIPs.map((s) => {
          if (s.fundName === fundName) {
            return {
              ...s,
              amount: targetAmount
            };
          }
          return s;
        });

        if (rememberDecision) {
          updatedDecisions = [
            {
              id: `dec_${Date.now()}`,
              date: '2 Nov 2026',
              reasonCategory,
              action: `Reduced ${fundName} to ₹${targetAmount}/mo`,
              durationOrAmount: `₹${targetAmount}/mo`,
              outcome: 'Awaiting outcome (30-day check-in).',
              fundName
            },
            ...updatedDecisions
          ];
        }

        updatedActivities = [
          {
            id: `act_${Date.now()}`,
            date: '2 Nov 2026',
            type: 'SIP_REDUCE',
            title: `SIP Reduced: ${fundName}`,
            description: `New monthly SIP amount set to ₹${targetAmount}`
          },
          ...updatedActivities
        ];
      } else if (decisionType === 'use_cash') {
        // Use cash instead of withdrawing from holding
        updatedCash = Math.max(0, updatedCash - withdrawAmount);

        if (rememberDecision) {
          updatedDecisions = [
            {
              id: `dec_${Date.now()}`,
              date: '2 Nov 2026',
              reasonCategory,
              action: `Used ₹${withdrawAmount} from available cash instead of fund withdrawal`,
              durationOrAmount: `₹${withdrawAmount}`,
              outcome: 'Protected portfolio investments. ₹0 goal impact.',
              fundName
            },
            ...updatedDecisions
          ];
        }

        updatedActivities = [
          {
            id: `act_${Date.now()}`,
            date: '2 Nov 2026',
            type: 'WITHDRAW',
            title: `Cash deployed: ₹${withdrawAmount}`,
            description: `Utilized available cash reserve to protect ${fundName} holding.`
          },
          ...updatedActivities
        ];
      } else if (decisionType === 'withdraw_anyway') {
        // Withdraw from holding
        updatedHoldings = updatedHoldings.map((h) => {
          if (h.fundName === fundName) {
            const nextCurrent = Math.max(0, h.current - withdrawAmount);
            return {
              ...h,
              current: nextCurrent
            };
          }
          return h;
        });
        updatedCash += withdrawAmount;

        if (rememberDecision) {
          updatedDecisions = [
            {
              id: `dec_${Date.now()}`,
              date: '2 Nov 2026',
              reasonCategory,
              action: `Withdrew ₹${withdrawAmount} from ${fundName}`,
              durationOrAmount: `₹${withdrawAmount}`,
              outcome: 'Awaiting outcome (30-day check-in).',
              fundName
            },
            ...updatedDecisions
          ];
        }

        updatedActivities = [
          {
            id: `act_${Date.now()}`,
            date: '2 Nov 2026',
            type: 'WITHDRAW',
            title: `Withdrawal executed: ${fundName}`,
            description: `Withdrew ₹${withdrawAmount}. Deposited to bank/cash balance.`
          },
          ...updatedActivities
        ];

        updatedCheckIns = [
          {
            id: `chk_${Date.now()}`,
            date: '2 Dec 2026',
            title: 'Review your withdrawal',
            description: `Review liquidity and plan replenishment for ${fundName}.`,
            actionType: 'review_withdrawal'
          },
          ...updatedCheckIns
        ];
      }

      // Re-calculate goal corpus, monthly contribution, and statuses from updated holdings & SIPs
      const updatedGoals = prev.goals.map((g) => {
        const linkedHoldings = updatedHoldings.filter((h) => g.linkedFunds.includes(h.fundName));
        const linkedSips = updatedSIPs.filter((s) => g.linkedFunds.includes(s.fundName) && s.status === 'Active');

        const newCorpus = linkedHoldings.reduce((sum, h) => sum + h.current, 0);
        const newMonthly = linkedSips.reduce((sum, s) => sum + s.amount, 0);

        // recalculate status
        const impact = calculateImpact({
          action: 'pause',
          currentAmountOrHolding: 0,
          goalTarget: g.target,
          goalCorpus: newCorpus,
          goalMonthlyContribution: newMonthly,
          goalMonthsLeft: g.monthsLeft,
          pauseMonths: 0
        });

        return {
          ...g,
          corpusNow: newCorpus,
          monthlyContribution: newMonthly,
          status: impact.statusAfter
        };
      });

      return {
        ...prev,
        holdings: updatedHoldings,
        sips: updatedSIPs,
        goals: updatedGoals,
        availableCash: updatedCash,
        decisions: updatedDecisions,
        activities: updatedActivities,
        checkIns: updatedCheckIns
      };
    });

    addToast('Saved to your decision records.');
  };

  const resumeSIP = (sipId: string) => {
    setState((prev) => {
      const targetSIP = prev.sips.find((s) => s.id === sipId);
      if (!targetSIP) return prev;

      const updatedSips = prev.sips.map((s) =>
        s.id === sipId
          ? { ...s, status: 'Active' as const, pausedUntil: undefined, autoResumes: undefined }
          : s
      );

      const updatedGoals = prev.goals.map((g) => {
        if (!g.linkedFunds.includes(targetSIP.fundName)) return g;
        const linkedSips = updatedSips.filter((s) => g.linkedFunds.includes(s.fundName) && s.status === 'Active');
        const newMonthly = linkedSips.reduce((sum, s) => sum + s.amount, 0);

        const impact = calculateImpact({
          action: 'pause',
          currentAmountOrHolding: 0,
          goalTarget: g.target,
          goalCorpus: g.corpusNow,
          goalMonthlyContribution: newMonthly,
          goalMonthsLeft: g.monthsLeft,
          pauseMonths: 0
        });

        return {
          ...g,
          monthlyContribution: newMonthly,
          status: impact.statusAfter
        };
      });

      return {
        ...prev,
        sips: updatedSips,
        goals: updatedGoals,
        activities: [
          {
            id: `act_${Date.now()}`,
            date: '2 Nov 2026',
            type: 'SIP_DEBIT',
            title: `SIP Resumed: ${targetSIP.fundName}`,
            description: `Resumed monthly instalment of ₹${targetSIP.amount}`
          },
          ...prev.activities
        ]
      };
    });
    addToast('SIP successfully resumed');
  };

  const addInvestment = (fundName: string, amount: number, isMonthlySIP: boolean) => {
    setState((prev) => {
      let updatedHoldings = [...prev.holdings];
      let updatedSips = [...prev.sips];
      let updatedCash = prev.availableCash;

      if (isMonthlySIP) {
        // find or add SIP
        const existingSip = updatedSips.find((s) => s.fundName === fundName);
        if (existingSip) {
          updatedSips = updatedSips.map((s) =>
            s.fundName === fundName ? { ...s, amount: s.amount + amount, status: 'Active' as const } : s
          );
        } else {
          updatedSips.push({
            id: `sip_${Date.now()}`,
            fundName,
            amount,
            status: 'Active',
            nextDebit: '5 Nov 2026',
            linkedGoal: 'Early Retirement',
            totalInvested: 0
          });
        }
      } else {
        // One-time investment
        updatedCash = Math.max(0, updatedCash - amount);
        updatedHoldings = updatedHoldings.map((h) => {
          if (h.fundName === fundName) {
            return {
              ...h,
              invested: h.invested + amount,
              current: h.current + amount
            };
          }
          return h;
        });
      }

      // Re-calculate goals
      const updatedGoals = prev.goals.map((g) => {
        const linkedHoldings = updatedHoldings.filter((h) => g.linkedFunds.includes(h.fundName));
        const linkedSips = updatedSips.filter((s) => g.linkedFunds.includes(s.fundName) && s.status === 'Active');

        const newCorpus = linkedHoldings.reduce((sum, h) => sum + h.current, 0);
        const newMonthly = linkedSips.reduce((sum, s) => sum + s.amount, 0);

        const impact = calculateImpact({
          action: 'pause',
          currentAmountOrHolding: 0,
          goalTarget: g.target,
          goalCorpus: newCorpus,
          goalMonthlyContribution: newMonthly,
          goalMonthsLeft: g.monthsLeft,
          pauseMonths: 0
        });

        return {
          ...g,
          corpusNow: newCorpus,
          monthlyContribution: newMonthly,
          status: impact.statusAfter
        };
      });

      return {
        ...prev,
        holdings: updatedHoldings,
        sips: updatedSips,
        goals: updatedGoals,
        availableCash: updatedCash,
        activities: [
          {
            id: `act_${Date.now()}`,
            date: '2 Nov 2026',
            type: 'INVESTMENT_ADD',
            title: isMonthlySIP ? `New SIP added: ${fundName}` : `Investment added: ${fundName}`,
            description: `Added ₹${amount} (${isMonthlySIP ? 'Monthly SIP' : 'One-time'})`,
            amount
          },
          ...prev.activities
        ]
      };
    });

    addToast('Investment order placed successfully');
  };

  return {
    state,
    addToast,
    removeToast,
    resetDemo,
    setMarketMode,
    setLlmSpeed,
    deleteDecision,
    applyFinPilotDecision,
    resumeSIP,
    addInvestment
  };
}
