import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { formatINR, formatMonths } from '../engine/format';
import { calculateImpact } from '../engine/impactEngine';
import { Holding, Goal } from '../data/seed';

interface AddInvestmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  holdings: Holding[];
  goals: Goal[];
  onConfirm: (fundName: string, amount: number, isMonthlySIP: boolean) => void;
  defaultFundName?: string;
  defaultIsSIP?: boolean;
}

export const AddInvestmentDialog: React.FC<AddInvestmentDialogProps> = ({
  isOpen,
  onClose,
  holdings,
  goals,
  onConfirm,
  defaultFundName,
  defaultIsSIP = true
}) => {
  if (!isOpen) return null;

  const [selectedFund, setSelectedFund] = useState<string>(
    defaultFundName || holdings[0]?.fundName || 'UTI Nifty 50 Index Fund'
  );
  const [amountStr, setAmountStr] = useState<string>('5000');
  const [isMonthlySIP, setIsMonthlySIP] = useState<boolean>(defaultIsSIP);

  const amount = Number(amountStr) || 0;

  // Find linked goal for the selected fund
  const holding = holdings.find((h) => h.fundName === selectedFund);
  const linkedGoalName = holding?.linkedGoal || 'Early Retirement';
  const linkedGoal = goals.find((g) => g.name === linkedGoalName) || goals[0];

  // Non-blocking live "FinPilot insight" calculation
  let insightText = '';
  if (amount > 0 && linkedGoal) {
    if (isMonthlySIP) {
      // simulate impact of adding to monthly contribution
      const baseMonths = linkedGoal.monthsLeft;
      const res = calculateImpact({
        action: 'pause',
        currentAmountOrHolding: 0,
        goalTarget: linkedGoal.target,
        goalCorpus: linkedGoal.corpusNow,
        goalMonthlyContribution: linkedGoal.monthlyContribution + amount,
        goalMonthsLeft: baseMonths
      });
      const earlierMonths = Math.max(0, linkedGoal.monthsLeft - res.baselineMonthsToTarget);
      insightText = `This adds ${formatINR(amount)}/month to ${linkedGoal.name} and brings your goal about ${formatMonths(
        earlierMonths
      )} earlier.`;
    } else {
      // one-time investment
      const res = calculateImpact({
        action: 'pause',
        currentAmountOrHolding: 0,
        goalTarget: linkedGoal.target,
        goalCorpus: linkedGoal.corpusNow + amount,
        goalMonthlyContribution: linkedGoal.monthlyContribution,
        goalMonthsLeft: linkedGoal.monthsLeft
      });
      const earlierMonths = Math.max(0, linkedGoal.monthsLeft - res.baselineMonthsToTarget);
      insightText = `This adds ${formatINR(amount)} toward ${linkedGoal.name}, about ${formatMonths(
        earlierMonths
      )} closer.`;
    }
  } else {
    insightText = 'Enter an amount to see the impact.';
  }

  const handleConfirm = () => {
    if (amount > 0) {
      onConfirm(selectedFund, amount, isMonthlySIP);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Add Investment</h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Investment Type Toggle */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setIsMonthlySIP(true)}
              className={`py-2 rounded-lg transition-all ${
                isMonthlySIP
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly SIP
            </button>
            <button
              type="button"
              onClick={() => setIsMonthlySIP(false)}
              className={`py-2 rounded-lg transition-all ${
                !isMonthlySIP
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              One-time
            </button>
          </div>

          {/* Fund Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Mutual Fund
            </label>
            <select
              value={selectedFund}
              onChange={(e) => setSelectedFund(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
            >
              {holdings.map((h) => (
                <option key={h.id} value={h.fundName}>
                  {h.fundName}
                </option>
              ))}
            </select>
          </div>

          {/* Amount input & Quick chips */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Investment Amount
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-medium">
                ₹
              </span>
              <input
                type="number"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0"
                className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
              />
            </div>
            <div className="flex gap-2 mt-2">
              {[5000, 10000, 25000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmountStr(val.toString())}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                >
                  +{formatINR(val)}
                </button>
              ))}
            </div>
          </div>

          {/* Live Non-blocking FinPilot Insight line */}
          <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-emerald-800">FinPilot insight:</span>{' '}
              <span className="text-slate-700">{insightText}</span>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              onClick={handleConfirm}
              disabled={amount <= 0}
              className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${
                amount > 0
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              Confirm Investment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
