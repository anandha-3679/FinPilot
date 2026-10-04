import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ArrowLeft,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Sliders,
  History,
  TrendingDown,
  LineChart as LineChartIcon
} from 'lucide-react';
import { calculateImpact, ImpactResult } from '../engine/impactEngine';
import { formatINR, formatShortINR, formatMonths } from '../engine/format';
import { DecisionRecord } from '../data/seed';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine
} from 'recharts';

export interface FinPilotPayload {
  action: 'pause' | 'reduce' | 'withdraw';
  fundName: string;
  assetClass?: string;
  amount: number; // for pause/reduce: current SIP amount; for withdraw: total holding value
  goalName: string;
  goalTarget: number;
  goalCorpus: number;
  goalMonthlyContribution: number;
  goalMonthsLeft: number;
  availableCash: number;
  anonUserId: string; // "u_4821"
}

export interface FinPilotDecision {
  decision:
    | 'keep'
    | 'reduce'
    | 'pause_autoresume'
    | 'pause_proceed'
    | 'reduce_amount'
    | 'use_cash'
    | 'withdraw_anyway';
  reasonCategory: string;
  newAmount?: number;
  months?: number;
  reduceMonths?: number;
  reducePermanent?: boolean;
  withdrawAmount?: number;
  rememberDecision: boolean;
  resumeDate?: string;
}

interface FinPilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  payload: FinPilotPayload | null;
  decisions: DecisionRecord[];
  onDecision: (decision: FinPilotDecision) => void;
  onDeleteDecision: (id: string) => void;
  marketMode: 'Calm' | 'Volatile';
  llmSpeed: 'Fast' | 'Slow';
}

const REASONS_SIP = [
  'Temporary cash need',
  'Market worry',
  'Found a better option',
  'Other'
];

const REASONS_WITHDRAW = [
  'Emergency',
  'Market worry',
  'Big purchase',
  'Rebalancing',
  'Other'
];

export const FinPilotModal: React.FC<FinPilotModalProps> = ({
  isOpen,
  onClose,
  payload,
  decisions,
  onDecision,
  onDeleteDecision,
  marketMode,
  llmSpeed
}) => {
  if (!isOpen || !payload) return null;

  // Wizard state: 1 = Why, 2 = Impact, 3 = Confirm
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [rememberDecision, setRememberDecision] = useState<boolean>(true);
  const [showMemoryManager, setShowMemoryManager] = useState<boolean>(false);

  // Editable action parameters (Slider/Inputs)
  const [pauseMonths, setPauseMonths] = useState<number>(3);
  const [reducedAmount, setReducedAmount] = useState<number>(
    Math.round(payload.amount * 0.5)
  );
  const [reduceDurationMonths, setReduceDurationMonths] = useState<number>(3);
  const [reducePermanent, setReducePermanent] = useState<boolean>(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(
    payload.action === 'withdraw' ? Math.min(payload.amount, 50000) : 0
  );

  // Selected alternative choice
  const [selectedAlternative, setSelectedAlternative] = useState<
    'keep' | 'reduce' | 'pause_autoresume' | 'use_cash' | 'withdraw_smaller' | 'custom'
  >(payload.action === 'withdraw' ? 'keep' : 'pause_autoresume');

  // Collapsible sections
  const [showWhyPanel, setShowWhyPanel] = useState<boolean>(false);
  const [showChartSection, setShowChartSection] = useState<boolean>(true);
  const [showDipsTable, setShowDipsTable] = useState<boolean>(true);
  const [assumedRate, setAssumedRate] = useState<number>(12); // percent

  // Simulated LLM state
  const [aiText, setAiText] = useState<string>('');
  const [aiAborted, setAiAborted] = useState<boolean>(false);
  const [aiGenerating, setAiGenerating] = useState<boolean>(false);

  // Reset states when payload changes
  useEffect(() => {
    if (payload) {
      setStep(1);
      setSelectedReason('');
      setPauseMonths(3);
      setReducedAmount(Math.round(payload.amount * 0.5));
      setReduceDurationMonths(3);
      setReducePermanent(false);
      setWithdrawAmount(payload.action === 'withdraw' ? Math.min(payload.amount, 50000) : 0);
      setSelectedAlternative(
        payload.action === 'withdraw' ? 'keep' : 'pause_autoresume'
      );
      setShowWhyPanel(false);
      setShowChartSection(true);
      setShowDipsTable(true);
      setAssumedRate(12);
    }
  }, [payload]);

  // Keyboard navigation: Escape closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Validation
  const isInputValid = () => {
    if (payload.action === 'pause') {
      return pauseMonths >= 1 && pauseMonths <= 24;
    }
    if (payload.action === 'reduce') {
      return (
        reducedAmount > 0 &&
        reducedAmount < payload.amount &&
        (reducePermanent || (reduceDurationMonths >= 1 && reduceDurationMonths <= 24))
      );
    }
    if (payload.action === 'withdraw') {
      return withdrawAmount > 0 && withdrawAmount <= payload.amount;
    }
    return true;
  };

  const annualRateDecimal = assumedRate / 100;

  // Calculate Resume Date String (Nov 2026 + months)
  const getResumeDateString = (months: number) => {
    const resumeMonth = 11 + months; // 1-indexed
    const resYear = 2026 + Math.floor((resumeMonth - 1) / 12);
    const resMoIndex = (resumeMonth - 1) % 12;
    const moNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ];
    return `5 ${moNames[resMoIndex]} ${resYear}`;
  };

  // 1. Current Slider Impact Calculation (used for header / base slider preview)
  const currentImpact: ImpactResult = calculateImpact({
    action: payload.action,
    currentAmountOrHolding: payload.amount,
    goalTarget: payload.goalTarget,
    goalCorpus: payload.goalCorpus,
    goalMonthlyContribution: payload.goalMonthlyContribution,
    goalMonthsLeft: payload.goalMonthsLeft,
    pauseMonths,
    newMonthlyAmount: reducedAmount,
    reduceMonths: reduceDurationMonths,
    reducePermanent,
    withdrawAmount,
    annualRate: annualRateDecimal
  });

  // 2. Alternative 1: Keep active / Keep invested
  const keepImpact = useMemo(() => {
    return calculateImpact({
      action: payload.action,
      currentAmountOrHolding: payload.amount,
      goalTarget: payload.goalTarget,
      goalCorpus: payload.goalCorpus,
      goalMonthlyContribution: payload.goalMonthlyContribution,
      goalMonthsLeft: payload.goalMonthsLeft,
      pauseMonths: 0,
      newMonthlyAmount: payload.amount,
      withdrawAmount: 0,
      annualRate: annualRateDecimal
    });
  }, [payload, annualRateDecimal]);

  // 3. Alternative 2: Reduce SIP (using current slider reducedAmount & duration) / Withdraw smaller
  const alt2Impact = useMemo(() => {
    return calculateImpact({
      action: payload.action === 'withdraw' ? 'withdraw' : 'reduce',
      currentAmountOrHolding: payload.amount,
      goalTarget: payload.goalTarget,
      goalCorpus: payload.goalCorpus,
      goalMonthlyContribution: payload.goalMonthlyContribution,
      goalMonthsLeft: payload.goalMonthsLeft,
      pauseMonths: 0,
      newMonthlyAmount: reducedAmount,
      reduceMonths: reduceDurationMonths,
      reducePermanent,
      withdrawAmount: withdrawAmount,
      annualRate: annualRateDecimal
    });
  }, [
    payload,
    reducedAmount,
    reduceDurationMonths,
    reducePermanent,
    withdrawAmount,
    annualRateDecimal
  ]);

  // 4. Alternative 3: Auto-resume pause (using current slider pauseMonths) / Use cash (if eligible)
  const alt3Impact = useMemo(() => {
    return calculateImpact({
      action: payload.action === 'withdraw' ? 'withdraw' : 'pause',
      currentAmountOrHolding: payload.amount,
      goalTarget: payload.goalTarget,
      goalCorpus: payload.goalCorpus,
      goalMonthlyContribution: payload.goalMonthlyContribution,
      goalMonthsLeft: payload.goalMonthsLeft,
      pauseMonths: pauseMonths,
      withdrawAmount: 0, // cash uses 0 from investment
      annualRate: annualRateDecimal
    });
  }, [payload, pauseMonths, annualRateDecimal]);

  // Check Decision Memory for matches
  const matchedMemory = decisions.find(
    (d) => d.reasonCategory.toLowerCase() === selectedReason.toLowerCase()
  );

  // Lowest value lost "Suggested for you" determination among non-Keep options fitting reason
  const suggestedOptionKey = useMemo(() => {
    if (payload.action === 'withdraw') {
      if (selectedReason === 'Emergency') {
        if (payload.availableCash >= withdrawAmount) {
          return 'use_cash';
        }
        return 'withdraw_smaller';
      }
      if (selectedReason === 'Market worry') {
        return 'withdraw_smaller';
      }
      return 'withdraw_smaller';
    } else {
      // SIP actions
      if (selectedReason === 'Temporary cash need') {
        return 'pause_autoresume';
      }
      if (selectedReason === 'Market worry') {
        // Shorter pause or temporary reduce: pick whichever has lower value lost
        return alt2Impact.valueLost <= alt3Impact.valueLost
          ? 'reduce'
          : 'pause_autoresume';
      }
      // General lowest impact among non-keep options
      return alt2Impact.valueLost <= alt3Impact.valueLost
        ? 'reduce'
        : 'pause_autoresume';
    }
  }, [
    payload,
    selectedReason,
    withdrawAmount,
    alt2Impact.valueLost,
    alt3Impact.valueLost
  ]);

  // Impact specifically for the selected alternative (Used in Step 3 Confirm & live summary)
  const selectedImpact: ImpactResult = useMemo(() => {
    if (selectedAlternative === 'keep') {
      return keepImpact;
    }
    if (selectedAlternative === 'reduce' || selectedAlternative === 'withdraw_smaller') {
      return alt2Impact;
    }
    if (selectedAlternative === 'pause_autoresume' || selectedAlternative === 'use_cash') {
      return alt3Impact;
    }
    // 'custom' / anyway option
    return currentImpact;
  }, [
    selectedAlternative,
    keepImpact,
    alt2Impact,
    alt3Impact,
    currentImpact
  ]);

  // Simulated Guardrailed LLM typeout with 800ms abort rule
  useEffect(() => {
    if (step !== 2) return;

    let targetText = '';
    const goalDate = 'Dec 2042';

    if (payload.action === 'pause') {
      targetText = `Pausing ₹${formatINR(payload.amount)}/month for ${pauseMonths} months means about ${formatShortINR(
        currentImpact.contributionsMissed
      )} less invested. By ${goalDate}, that could mean about ${formatShortINR(
        currentImpact.valueLost
      )} less, and ${payload.goalName} could be reached about ${
        currentImpact.goalDelayMonths
      } months later. Based on ${payload.goalMonthsLeft} months to go and an assumed ${assumedRate}% a year.`;
    } else if (payload.action === 'reduce') {
      const durText = reducePermanent
        ? 'permanently'
        : `for ${reduceDurationMonths} months`;
      targetText = `Reducing to ₹${formatINR(reducedAmount)}/month ${durText} means investing about ${formatShortINR(
        currentImpact.contributionsMissed
      )} less. By ${goalDate}, that could result in about ${formatShortINR(
        currentImpact.valueLost
      )} lower corpus, delaying ${payload.goalName} by about ${
        currentImpact.goalDelayMonths
      } months.`;
    } else {
      targetText = `Withdrawing ₹${formatINR(withdrawAmount)} could mean about ${formatShortINR(
        currentImpact.valueLost
      )} less at the goal date and delay ${payload.goalName} by about ${
        currentImpact.goalDelayMonths
      } months.`;
    }

    if (selectedReason === 'Market worry') {
      if (marketMode === 'Volatile') {
        targetText += ` Nifty 50 is down 4.2% this week. Your last 3 instalments bought at lower prices, so pausing means missing those units.`;
      } else {
        targetText += ` Markets have been steady this week.`;
      }
    }

    setAiGenerating(true);
    setAiAborted(false);
    setAiText('');

    const totalDuration = llmSpeed === 'Fast' ? 400 : 1500;

    if (totalDuration > 800) {
      const abortTimer = setTimeout(() => {
        setAiAborted(true);
        setAiGenerating(false);
      }, 800);
      return () => clearTimeout(abortTimer);
    } else {
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(1, elapsed / totalDuration);
        const charsToShow = Math.floor(progress * targetText.length);
        setAiText(targetText.slice(0, charsToShow));

        if (progress >= 1) {
          clearInterval(interval);
          setAiGenerating(false);
        }
      }, 30);

      return () => clearInterval(interval);
    }
  }, [
    step,
    payload,
    pauseMonths,
    reducedAmount,
    reduceDurationMonths,
    reducePermanent,
    withdrawAmount,
    selectedReason,
    marketMode,
    llmSpeed,
    assumedRate
  ]);

  const handleConfirmDecision = () => {
    let decisionType: FinPilotDecision['decision'] = 'keep';
    let chosenResumeDate: string | undefined = getResumeDateString(pauseMonths);

    if (selectedAlternative === 'keep') {
      decisionType = 'keep';
    } else if (selectedAlternative === 'reduce') {
      decisionType = 'reduce';
      chosenResumeDate = !reducePermanent ? getResumeDateString(reduceDurationMonths) : undefined;
    } else if (selectedAlternative === 'pause_autoresume') {
      decisionType = 'pause_autoresume';
      chosenResumeDate = getResumeDateString(pauseMonths);
    } else if (selectedAlternative === 'use_cash') {
      decisionType = 'use_cash';
    } else if (selectedAlternative === 'withdraw_smaller') {
      decisionType = 'withdraw_anyway';
    } else if (selectedAlternative === 'custom') {
      if (payload.action === 'withdraw') {
        decisionType = 'withdraw_anyway';
      } else {
        decisionType = 'pause_proceed';
      }
    }

    onDecision({
      decision: decisionType,
      reasonCategory: selectedReason || 'General',
      newAmount:
        payload.action === 'reduce' || selectedAlternative === 'reduce'
          ? reducedAmount
          : undefined,
      months:
        payload.action === 'pause' || selectedAlternative === 'pause_autoresume'
          ? pauseMonths
          : undefined,
      reduceMonths: reduceDurationMonths,
      reducePermanent,
      withdrawAmount:
        payload.action === 'withdraw' ? withdrawAmount : undefined,
      rememberDecision,
      resumeDate: chosenResumeDate
    });
    onClose();
  };

  // Trajectory Zoomed View (last 24 months before goal date)
  const zoomedTrajectory = useMemo(() => {
    const n = payload.goalMonthsLeft;
    const startM = Math.max(0, n - 24);
    return currentImpact.trajectory.filter((p) => p.month >= startM);
  }, [payload.goalMonthsLeft, currentImpact.trajectory]);

  const gapAtGoalDate = Math.max(
    0,
    currentImpact.projectedBefore - currentImpact.projectedAfter
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl bg-[#111827] border border-[#1f293d] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="px-6 py-4 bg-[#0d1424] border-b border-[#1f293d] flex items-center justify-between">
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button
                onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
                title="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  FinPilot Intelligence
                </span>
                <span className="text-xs text-gray-400">
                  Anonymous session: <span className="font-mono">{payload.anonUserId}</span>
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">
                {payload.action === 'pause' && 'Review your SIP change'}
                {payload.action === 'reduce' && 'Review your SIP change'}
                {payload.action === 'withdraw' && `Review Withdrawal: ${payload.fundName}`}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
            title="Cancel (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3-Step Wizard Stepper */}
        <div className="px-6 py-3 bg-[#0a0e1a] border-b border-[#1f293d] flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div
              className={`flex items-center gap-2 ${
                step >= 1 ? 'text-emerald-400' : 'text-gray-500'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === 1
                    ? 'bg-emerald-500 text-black'
                    : step > 1
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-gray-800 text-gray-400'
                }`}
              >
                1
              </div>
              <span className="text-sm font-medium">Why</span>
            </div>
            <div className="w-8 h-px bg-gray-700" />
            <div
              className={`flex items-center gap-2 ${
                step >= 2 ? 'text-emerald-400' : 'text-gray-500'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === 2
                    ? 'bg-emerald-500 text-black'
                    : step > 2
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-gray-800 text-gray-400'
                }`}
              >
                2
              </div>
              <span className="text-sm font-medium">Impact</span>
            </div>
            <div className="w-8 h-px bg-gray-700" />
            <div
              className={`flex items-center gap-2 ${
                step >= 3 ? 'text-emerald-400' : 'text-gray-500'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === 3
                    ? 'bg-emerald-500 text-black'
                    : 'bg-gray-800 text-gray-400'
                }`}
              >
                3
              </div>
              <span className="text-sm font-medium">Confirm</span>
            </div>
          </div>
          <div className="text-xs text-gray-400">
            Linked Goal: <span className="text-white font-medium">{payload.goalName}</span>
          </div>
        </div>

        {/* Modal Scrollable Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* STEP 1: WHY + DECISION MEMORY */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  What is prompting this decision?
                </label>
                <p className="text-xs text-gray-400 mb-3">
                  We store categories only, never free-text or personal data.
                </p>
                <div className="flex flex-wrap gap-2">
                  {(payload.action === 'withdraw' ? REASONS_WITHDRAW : REASONS_SIP).map(
                    (reason) => (
                      <button
                        key={reason}
                        onClick={() => setSelectedReason(reason)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          selectedReason === reason
                            ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                            : 'bg-[#151f33] text-gray-300 border border-[#1f2d48] hover:border-gray-600'
                        }`}
                      >
                        {reason}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Decision Memory Match ("You've been here before") */}
              {matchedMemory && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-[#182338] to-[#121c2e] border border-emerald-500/30 space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                    <History className="w-4 h-4" />
                    You've been here before ({matchedMemory.date})
                  </div>
                  <div className="text-xs text-gray-300 space-y-1">
                    <p>
                      <span className="text-gray-400">Previous Action:</span> {matchedMemory.action}
                    </p>
                    <p>
                      <span className="text-gray-400">Observed Outcome:</span> {matchedMemory.outcome}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-300">
                    <span className="font-semibold">Suggested plan from past outcome:</span>{' '}
                    {matchedMemory.reasonCategory === 'Temporary cash need' &&
                      'Same plan as last time: pause 1 month with auto-resume.'}
                    {matchedMemory.reasonCategory === 'Market worry' &&
                      'Consider reducing temporarily instead of a full pause so some instalments continue.'}
                    {matchedMemory.reasonCategory === 'Emergency' &&
                      'Check if available cash can fulfill the emergency without reducing portfolio equity.'}
                  </div>
                </div>
              )}

              {/* Memory Settings & Privacy */}
              <div className="pt-4 border-t border-[#1f293d] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <label className="flex items-center gap-3 cursor-pointer text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={rememberDecision}
                    onChange={(e) => setRememberDecision(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 bg-gray-900 border-gray-700 focus:ring-emerald-500"
                  />
                  <span>Remember this decision (Decision Memory)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowMemoryManager(!showMemoryManager)}
                  className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <History className="w-3.5 h-3.5" />
                  View / delete my decision memory ({decisions.length})
                </button>
              </div>

              {/* Manage Decision Memory modal toggle */}
              {showMemoryManager && (
                <div className="p-4 rounded-xl bg-[#0e1626] border border-[#1f293d] space-y-3">
                  <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Stored Decision Memory Records
                  </h4>
                  {decisions.length === 0 ? (
                    <p className="text-xs text-gray-500">No decision records stored.</p>
                  ) : (
                    <div className="space-y-2">
                      {decisions.map((dec) => (
                        <div
                          key={dec.id}
                          className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-[#141e33] border border-[#1f2d48]"
                        >
                          <div>
                            <span className="font-semibold text-white">{dec.reasonCategory}</span>{' '}
                            <span className="text-gray-400">({dec.date})</span>
                            <div className="text-gray-400 text-[11px]">{dec.action}</div>
                          </div>
                          <button
                            onClick={() => onDeleteDecision(dec.id)}
                            className="px-2 py-1 text-xs text-red-400 hover:bg-red-950/40 rounded transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons for Step 1 */}
              <div className="flex justify-end pt-4">
                <button
                  disabled={!selectedReason}
                  onClick={() => setStep(2)}
                  className={`px-6 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    selectedReason
                      ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Analyze Impact →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: IMPACT & ALTERNATIVES */}
          {/* Order per Item 9: 1) Tiles, 2) Status chip, 3) Explanation, 4) Alternatives, 5) Chart & Dips table collapsible below */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Dynamic Action Input Controls (Sliders & Switches) */}
              <div className="p-4 rounded-xl bg-[#0f172a] border border-[#1f293d] space-y-4">
                {payload.action === 'pause' && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-300">
                        Pause duration (1–24 months):
                      </span>
                      <span className="text-sm font-mono text-emerald-400 font-bold">
                        {pauseMonths} months
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      {[1, 3, 6, 12].map((m) => (
                        <button
                          key={m}
                          onClick={() => setPauseMonths(m)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                            pauseMonths === m
                              ? 'bg-emerald-500 text-black'
                              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          {m} mo
                        </button>
                      ))}
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={24}
                      value={pauseMonths}
                      onChange={(e) => setPauseMonths(Number(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                    {(pauseMonths < 1 || pauseMonths > 24) && (
                      <p className="text-xs text-red-400 mt-1">
                        Pause duration must be between 1 and 24 months.
                      </p>
                    )}
                  </div>
                )}

                {payload.action === 'reduce' && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-300">
                        New Monthly SIP Amount:
                      </span>
                      <span className="text-sm font-mono text-emerald-400 font-bold">
                        {formatINR(reducedAmount)}/mo
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={500}
                        max={payload.amount - 500}
                        step={500}
                        value={reducedAmount}
                        onChange={(e) => setReducedAmount(Number(e.target.value))}
                        className="flex-1 accent-emerald-500"
                      />
                      <input
                        type="number"
                        min={1}
                        max={payload.amount - 1}
                        value={reducedAmount}
                        onChange={(e) => setReducedAmount(Number(e.target.value))}
                        className="w-28 px-2 py-1 bg-gray-900 border border-gray-700 rounded-lg text-sm font-mono text-right"
                      />
                    </div>
                    {reducedAmount >= payload.amount && (
                      <p className="text-xs text-red-400">
                        Reduced amount must be less than current amount ({formatINR(payload.amount)})
                      </p>
                    )}

                    {/* Time-bound duration vs Permanent toggle (Item 3) */}
                    <div className="pt-2 border-t border-gray-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-300">Duration:</span>
                        <div className="flex items-center gap-1.5">
                          {[1, 3, 6, 12].map((m) => (
                            <button
                              key={m}
                              disabled={reducePermanent}
                              onClick={() => setReduceDurationMonths(m)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                !reducePermanent && reduceDurationMonths === m
                                  ? 'bg-emerald-500 text-black'
                                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-40'
                              }`}
                            >
                              {m} mo
                            </button>
                          ))}
                        </div>
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                        <input
                          type="checkbox"
                          checked={reducePermanent}
                          onChange={(e) => setReducePermanent(e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-500 bg-gray-900 border-gray-700"
                        />
                        <span>Make permanent</span>
                      </label>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      {reducePermanent
                        ? 'Reduction applies for the entire remaining horizon.'
                        : `Reduce to ${formatINR(reducedAmount)} for ${reduceDurationMonths} months, then auto-restore.`}
                    </p>
                  </div>
                )}

                {payload.action === 'withdraw' && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-300">
                        Withdrawal amount (Max {formatINR(payload.amount)}):
                      </span>
                      <span className="text-sm font-mono text-emerald-400 font-bold">
                        {formatINR(withdrawAmount)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      {[0.1, 0.25, 0.5, 1].map((pct) => (
                        <button
                          key={pct}
                          onClick={() => setWithdrawAmount(Math.round(payload.amount * pct))}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                            withdrawAmount === Math.round(payload.amount * pct)
                              ? 'bg-emerald-500 text-black'
                              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          {pct === 1 ? 'Full' : `${pct * 100}%`}
                        </button>
                      ))}
                    </div>
                    <input
                      type="range"
                      min={1000}
                      max={payload.amount}
                      step={1000}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                    {(withdrawAmount <= 0 || withdrawAmount > payload.amount) && (
                      <p className="text-xs text-red-400 mt-1">
                        Please enter a valid amount between ₹1 and {formatINR(payload.amount)}.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* 1) 3 Impact Tiles */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#131b2e] border border-[#1f293d]">
                  <div className="text-xs text-gray-400">Goal Delay</div>
                  <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
                    +{formatMonths(currentImpact.goalDelayMonths)}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1">
                    Postpones target milestone
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#131b2e] border border-[#1f293d]">
                  <div className="text-xs text-gray-400">Projected Value Lost</div>
                  <div className="text-2xl font-bold font-mono text-red-400 mt-1">
                    {formatINR(currentImpact.valueLost)}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1">
                    Compounded over remaining horizon
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#131b2e] border border-[#1f293d]">
                  <div className="text-xs text-gray-400">
                    {payload.action === 'withdraw'
                      ? 'Remaining Holding'
                      : 'Contributions Missed'}
                  </div>
                  <div className="text-2xl font-bold font-mono text-white mt-1">
                    {payload.action === 'withdraw'
                      ? formatINR(currentImpact.remainingHolding)
                      : formatINR(currentImpact.contributionsMissed)}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1">
                    {payload.action === 'withdraw'
                      ? 'Retained fund balance'
                      : 'Out-of-pocket savings'}
                  </div>
                </div>
              </div>

              {/* 2) Goal Status Transition Badge */}
              <div className="p-3 rounded-xl bg-[#131b2e] border border-[#1f293d] flex items-center justify-between">
                <span className="text-xs text-gray-300">Goal Health Transition:</span>
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {currentImpact.statusBefore}
                  </span>
                  <span className="text-gray-400">→</span>
                  <span
                    className={`px-2.5 py-1 rounded border ${
                      currentImpact.statusAfter === 'On track'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : currentImpact.statusAfter === 'Slightly behind'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : 'bg-red-500/20 text-red-400 border-red-500/30'
                    }`}
                  >
                    {currentImpact.statusAfter}
                  </span>
                </div>
              </div>

              {/* 3) Guardrailed Simulated AI Explanation */}
              <div className="p-4 rounded-xl bg-[#141e33] border border-blue-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI-generated wording</span>
                  </div>
                  {aiGenerating && (
                    <span className="text-[10px] text-gray-400 animate-pulse">
                      Synthesizing insight...
                    </span>
                  )}
                </div>
                {aiAborted ? (
                  <p className="text-xs text-amber-400 italic">
                    Detailed explanation unavailable, showing numbers only.
                  </p>
                ) : (
                  <p className="text-xs text-gray-200 leading-relaxed font-sans">
                    {aiText}
                  </p>
                )}
              </div>

              {/* 4) 3 EQUAL-SIZE, EQUAL-WEIGHT ALTERNATIVE CARDS (All using current input/slider values) */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Available Alternatives (Choose one to proceed)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Card 1: Keep active / Keep invested */}
                  <div
                    onClick={() => {
                      setSelectedAlternative('keep');
                      setStep(3);
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between group ${
                      selectedAlternative === 'keep'
                        ? 'bg-[#15233c] border-emerald-500'
                        : 'bg-[#131d31] border-[#1f2e4d] hover:border-emerald-500/60'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                        {payload.action === 'withdraw' ? 'Keep invested' : 'Keep SIP active'}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Maintain baseline growth without compromising retirement goals.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-800 space-y-1 text-xs font-mono">
                      <div className="text-emerald-400 font-semibold">Goal Delay: 0 months</div>
                      <div className="text-gray-400">Value Lost: ₹0</div>
                    </div>
                  </div>

                  {/* Card 2: Reduce SIP / Withdraw smaller amount (Using current slider values!) */}
                  <div
                    onClick={() => {
                      if (payload.action === 'withdraw') {
                        setSelectedAlternative('withdraw_smaller');
                      } else {
                        setSelectedAlternative('reduce');
                      }
                      setStep(3);
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between group relative ${
                      selectedAlternative === 'reduce' || selectedAlternative === 'withdraw_smaller'
                        ? 'bg-[#15233c] border-emerald-500'
                        : 'bg-[#131d31] border-[#1f2e4d] hover:border-emerald-500/60'
                    }`}
                  >
                    {(suggestedOptionKey === 'reduce' || suggestedOptionKey === 'withdraw_smaller') && (
                      <span className="absolute -top-2.5 right-3 text-[10px] font-semibold bg-emerald-500 text-black px-2 py-0.5 rounded-full shadow">
                        Suggested for you
                      </span>
                    )}
                    <div>
                      <div className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                        {payload.action === 'withdraw'
                          ? `Withdraw ${formatINR(withdrawAmount)}`
                          : `Reduce to ${formatINR(reducedAmount)}/mo`}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {payload.action === 'withdraw'
                          ? 'Withdraw the specified partial amount while preserving remaining balance.'
                          : reducePermanent
                          ? 'Permanent reduction over horizon.'
                          : `Reduce for ${reduceDurationMonths} months, then auto-restore.`}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-800 space-y-1 text-xs font-mono">
                      <div className="text-amber-400 font-semibold">
                        Goal Delay: +{formatMonths(alt2Impact.goalDelayMonths)}
                      </div>
                      <div className="text-gray-400">
                        Value Lost: {formatINR(alt2Impact.valueLost)}
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Auto-resume pause / Use cash (only if availableCash >= withdrawAmount) */}
                  {payload.action === 'withdraw' ? (
                    payload.availableCash >= withdrawAmount ? (
                      <div
                        onClick={() => {
                          setSelectedAlternative('use_cash');
                          setStep(3);
                        }}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between group relative ${
                          selectedAlternative === 'use_cash'
                            ? 'bg-[#15233c] border-emerald-500'
                            : 'bg-[#131d31] border-[#1f2e4d] hover:border-emerald-500/60'
                        }`}
                      >
                        {suggestedOptionKey === 'use_cash' && (
                          <span className="absolute -top-2.5 right-3 text-[10px] font-semibold bg-emerald-500 text-black px-2 py-0.5 rounded-full shadow">
                            Suggested for you
                          </span>
                        )}
                        <div>
                          <div className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                            Use available cash instead
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            Deploy {formatINR(withdrawAmount)} from your {formatINR(payload.availableCash)} cash reserve.
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-800 space-y-1 text-xs font-mono">
                          <div className="text-emerald-400 font-semibold">Goal Delay: 0 months</div>
                          <div className="text-gray-400">Value Lost: ₹0</div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-[#101726] border border-gray-800 opacity-60 flex flex-col justify-between">
                        <div>
                          <div className="text-sm font-semibold text-gray-400">
                            Use cash instead (Unavailable)
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Available cash ({formatINR(payload.availableCash)}) is lower than withdrawal request.
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-800 text-[11px] text-gray-500">
                          Cash balance insufficient
                        </div>
                      </div>
                    )
                  ) : (
                    <div
                      onClick={() => {
                        setSelectedAlternative('pause_autoresume');
                        setStep(3);
                      }}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between group relative ${
                        selectedAlternative === 'pause_autoresume'
                          ? 'bg-[#15233c] border-emerald-500'
                          : 'bg-[#131d31] border-[#1f2e4d] hover:border-emerald-500/60'
                      }`}
                    >
                      {suggestedOptionKey === 'pause_autoresume' && (
                        <span className="absolute -top-2.5 right-3 text-[10px] font-semibold bg-emerald-500 text-black px-2 py-0.5 rounded-full shadow">
                          Suggested for you
                        </span>
                      )}
                      <div>
                        <div className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                          Pause with auto-resume ({pauseMonths} mo)
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Resumes automatically on {getResumeDateString(pauseMonths)}
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-gray-800 space-y-1 text-xs font-mono">
                        <div className="text-amber-400 font-semibold">
                          Goal Delay: +{formatMonths(alt3Impact.goalDelayMonths)}
                        </div>
                        <div className="text-gray-400">
                          Value Lost: {formatINR(alt3Impact.valueLost)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quiet Single "...anyway" text link */}
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      setSelectedAlternative('custom');
                      setStep(3);
                    }}
                    className="text-xs text-gray-400 hover:text-white underline underline-offset-4 decoration-gray-600 transition-colors"
                  >
                    {payload.action === 'withdraw'
                      ? 'Withdraw anyway'
                      : 'Pause anyway (without auto-resume)'}
                  </button>
                </div>
              </div>

              {/* 5) Collapsible Chart & Dips Table Below Alternatives (Item 9) */}
              <div className="space-y-4 pt-2">
                {/* Trajectory Chart: Collapsible, Zoomed to last 24 months, with gap label */}
                <div className="border border-[#1f293d] rounded-xl bg-[#0f172a] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowChartSection(!showChartSection)}
                    className="w-full px-4 py-3 text-left flex items-center justify-between text-xs font-semibold text-gray-300 hover:bg-[#131c30]"
                  >
                    <span className="flex items-center gap-2">
                      <LineChartIcon className="w-3.5 h-3.5 text-emerald-400" />
                      Goal Trajectory: Last 24 Months Before Goal Date
                      <span className="text-[10px] text-amber-400 font-mono">
                        (Gap at goal date: {formatShortINR(gapAtGoalDate)})
                      </span>
                    </span>
                    {showChartSection ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>

                  {showChartSection && (
                    <div className="p-4 border-t border-[#1f293d] space-y-3">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-400">
                          Focusing on final 24 months (Month {Math.max(0, payload.goalMonthsLeft - 24)} to {payload.goalMonthsLeft})
                        </span>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                            <span className="text-gray-300">If you stay</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                            <span className="text-gray-300">If you change</span>
                          </div>
                        </div>
                      </div>

                      <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={zoomedTrajectory}
                            margin={{ top: 10, right: 15, left: 15, bottom: 5 }}
                          >
                            <XAxis
                              dataKey="month"
                              stroke="#64748b"
                              fontSize={10}
                              tickFormatter={(v) => `m${v}`}
                            />
                            <YAxis
                              stroke="#64748b"
                              fontSize={10}
                              tickFormatter={(v) => formatShortINR(v)}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#0f172a',
                                borderColor: '#1e293b',
                                borderRadius: '8px',
                                fontSize: '11px'
                              }}
                              formatter={(val: any) => [formatShortINR(Number(val)), 'Corpus']}
                            />
                            <ReferenceLine
                              y={payload.goalTarget}
                              stroke="#ef4444"
                              strokeDasharray="3 3"
                              label={{
                                value: `Target: ${formatShortINR(payload.goalTarget)}`,
                                fill: '#ef4444',
                                fontSize: 10,
                                position: 'top'
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="corpusBefore"
                              stroke="#00d09c"
                              strokeWidth={2}
                              dot={false}
                            />
                            <Line
                              type="monotone"
                              dataKey="corpusAfter"
                              stroke="#f59e0b"
                              strokeWidth={2}
                              strokeDasharray="4 4"
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>

                {/* Market Worry Drawdown Reference Table (Collapsible) */}
                {selectedReason === 'Market worry' && (
                  <div className="border border-[#1f293d] rounded-xl bg-[#0f172a] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowDipsTable(!showDipsTable)}
                      className="w-full px-4 py-3 text-left flex items-center justify-between text-xs font-semibold text-gray-300 hover:bg-[#131c30]"
                    >
                      <span className="flex items-center gap-1.5">
                        <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
                        How past dips have played out (Historical drawdowns)
                      </span>
                      {showDipsTable ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </button>

                    {showDipsTable && (
                      <div className="p-4 border-t border-[#1f293d] space-y-2">
                        <div className="text-[10px] text-gray-500 italic text-right">
                          Illustrative sample data, not a forecast
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="text-gray-400 border-b border-gray-800">
                                <th className="pb-2">Market Drawdown</th>
                                <th className="pb-2">Historical Frequency</th>
                                <th className="pb-2">Typical Recovery</th>
                              </tr>
                            </thead>
                            <tbody className="text-gray-300 divide-y divide-gray-800/60 font-mono">
                              <tr>
                                <td className="py-2 text-amber-400">-5% dip</td>
                                <td className="py-2">2–3 times / year</td>
                                <td className="py-2 text-emerald-400">3–6 weeks</td>
                              </tr>
                              <tr>
                                <td className="py-2 text-amber-400">-10% correction</td>
                                <td className="py-2">Once / 18 months</td>
                                <td className="py-2 text-emerald-400">8–14 weeks</td>
                              </tr>
                              <tr>
                                <td className="py-2 text-red-400">-15% bear move</td>
                                <td className="py-2">Once / 3–4 years</td>
                                <td className="py-2 text-emerald-400">18–28 weeks</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* "Why am I seeing this?" collapsible inspection panel */}
                <div className="border border-[#1f293d] rounded-xl bg-[#0d1424] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowWhyPanel(!showWhyPanel)}
                    className="w-full px-4 py-3 text-left flex items-center justify-between text-xs font-semibold text-gray-300 hover:bg-[#121c30]"
                  >
                    <span className="flex items-center gap-2">
                      <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                      Why am I seeing this? (Deterministic calculation parameters)
                    </span>
                    {showWhyPanel ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  {showWhyPanel && (
                    <div className="p-4 border-t border-[#1f293d] space-y-3 text-xs text-gray-300 bg-[#0a0f1d]">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Assumed Annual Return:</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            max={30}
                            value={assumedRate}
                            onChange={(e) => setAssumedRate(Number(e.target.value))}
                            className="w-16 px-2 py-0.5 bg-gray-900 border border-gray-700 rounded text-right font-mono"
                          />
                          <span>% p.a.</span>
                        </div>
                      </div>
                      <div className="space-y-1 font-mono text-[11px] text-gray-400">
                        <p>Monthly rate: r = (1 + {assumedRate}%)^(1/12) - 1</p>
                        <p>Goal Months Left (n): {payload.goalMonthsLeft}</p>
                        <p>Corpus Base: {formatINR(payload.goalCorpus)}</p>
                        <p>Formula: Σ a * (1+r)^(n-k) strictly evaluated</p>
                      </div>
                      <p className="text-[11px] text-gray-500 italic">
                        AI wording only; every number comes from a fixed deterministic calculation.
                      </p>
                    </div>
                  )}
                </div>

                {/* Disclaimer */}
                <div className="text-[11px] text-gray-500 leading-normal">
                  Educational estimate, not investment advice. Returns are not guaranteed. You stay in control.
                  {payload.action === 'withdraw' &&
                    ' Exit load or tax may apply; check your fund details.'}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: CONFIRM (Item 1: Must show goal delay, value lost & status for option actually selected) */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-[#0f172a] border border-[#1f293d] space-y-4">
                <h4 className="text-sm font-semibold text-white">Review Your Choice</h4>
                <div className="divide-y divide-gray-800 text-xs">
                  <div className="py-2.5 flex justify-between">
                    <span className="text-gray-400">Selected Decision:</span>
                    <span className="font-semibold text-emerald-400">
                      {selectedAlternative === 'keep' && 'Keep investment active'}
                      {selectedAlternative === 'reduce' &&
                        `Reduce SIP to ${formatINR(reducedAmount)}/mo ${
                          reducePermanent
                            ? '(Permanent)'
                            : `for ${reduceDurationMonths} months (auto-restore on ${getResumeDateString(
                                reduceDurationMonths
                              )})`
                        }`}
                      {selectedAlternative === 'pause_autoresume' &&
                        `Pause for ${pauseMonths} months (auto-resumes on ${getResumeDateString(
                          pauseMonths
                        )})`}
                      {selectedAlternative === 'use_cash' &&
                        `Use cash reserve (${formatINR(withdrawAmount)})`}
                      {selectedAlternative === 'withdraw_smaller' &&
                        `Withdraw ${formatINR(withdrawAmount)}`}
                      {selectedAlternative === 'custom' &&
                        (payload.action === 'withdraw'
                          ? `Withdraw ${formatINR(withdrawAmount)}`
                          : `Pause for ${pauseMonths} months (manual resume)`)}
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-gray-400">Reason Category:</span>
                    <span className="text-white font-medium">{selectedReason}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-gray-400">Goal Delay:</span>
                    <span className="text-amber-400 font-mono font-semibold">
                      +{formatMonths(selectedImpact.goalDelayMonths)}
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-gray-400">Estimated Value Lost:</span>
                    <span className="text-red-400 font-mono font-semibold">
                      {formatINR(selectedImpact.valueLost)}
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-gray-400">Goal Status Impact:</span>
                    <span className="text-white font-semibold">
                      {selectedImpact.statusBefore} → {selectedImpact.statusAfter}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-300">
                Nothing changes until you select Done. ApexBroker will execute your choice.
              </div>

              {/* Action Buttons for Step 3 */}
              <div className="flex items-center justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white transition-colors"
                >
                  ← Back to Impact
                </button>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!isInputValid()}
                    onClick={handleConfirmDecision}
                    className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                      isInputValid()
                        ? 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-lg shadow-emerald-500/20'
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-[#0a0f1d] border-t border-[#1f293d] flex items-center justify-between text-xs text-gray-500">
          <span>Esc to exit without changes</span>
          <span className="font-semibold tracking-wider text-gray-400">
            Powered by FinPilot
          </span>
        </div>
      </div>
    </div>
  );
};
