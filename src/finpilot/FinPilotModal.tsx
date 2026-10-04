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
import { formatINR, formatShortINR, formatMonths, buildExplanationText, groupRupeesInText } from '../engine/format';
import { DecisionRecord } from '../data/seed';
import { CompassLogo } from './CompassLogo';
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
  // Middle-card "smaller amount" slider; null = default 50% of the request
  const [smallerOverride, setSmallerOverride] = useState<number | null>(null);
  const smallerAmount = Math.max(
    1,
    Math.min(smallerOverride ?? Math.round(withdrawAmount * 0.5), withdrawAmount)
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
      setSmallerOverride(null);
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
      withdrawAmount: payload.action === 'withdraw' ? smallerAmount : withdrawAmount,
      annualRate: annualRateDecimal
    });
  }, [
    payload,
    reducedAmount,
    reduceDurationMonths,
    reducePermanent,
    withdrawAmount,
    smallerAmount,
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
      if (selectedReason === 'Market worry' || selectedReason === 'Rebalancing') {
        return 'withdraw_smaller';
      }
      // Big purchase / Other: no suggestion
      return null;
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

    const targetText = buildExplanationText({
      action: payload.action,
      amount: payload.amount,
      pauseMonths,
      reducedAmount,
      reduceDurationMonths,
      reducePermanent,
      withdrawAmount,
      contributionsMissed: currentImpact.contributionsMissed,
      valueLost: currentImpact.valueLost,
      goalDelayMonths: currentImpact.goalDelayMonths,
      goalName: payload.goalName,
      goalMonthsLeft: payload.goalMonthsLeft,
      assumedRate,
      selectedReason,
      marketMode
    });

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
        payload.action === 'withdraw'
          ? selectedAlternative === 'withdraw_smaller'
            ? smallerAmount
            : withdrawAmount
          : undefined,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button
                onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200/60 transition-colors"
                title="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2.5">
                <span className="rounded-lg bg-emerald-100 ring-1 ring-emerald-700/40 p-0.5 inline-flex">
                  <CompassLogo size={32} showText={false} />
                </span>
                <span className="text-xs uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  FinPilot Intelligence
                </span>
                <span className="text-xs text-slate-600">
                  Pseudonymous session: <span className="font-mono font-medium">{payload.anonUserId}</span>
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                {payload.action === 'pause' && 'Review your SIP change'}
                {payload.action === 'reduce' && 'Review your SIP change'}
                {payload.action === 'withdraw' && `Review Withdrawal: ${payload.fundName}`}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
            title="Cancel (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3-Step Wizard Stepper */}
        <div className="px-6 py-3 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div
              className={`flex items-center gap-2 ${
                step >= 1 ? 'text-emerald-700 font-semibold' : 'text-slate-400'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === 1
                    ? 'bg-emerald-600 text-white'
                    : step > 1
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                1
              </div>
              <span className="text-sm font-medium">Why</span>
            </div>
            <div className="w-8 h-px bg-slate-200" />
            <div
              className={`flex items-center gap-2 ${
                step >= 2 ? 'text-emerald-700 font-semibold' : 'text-slate-400'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === 2
                    ? 'bg-emerald-600 text-white'
                    : step > 2
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                2
              </div>
              <span className="text-sm font-medium">Impact</span>
            </div>
            <div className="w-8 h-px bg-slate-200" />
            <div
              className={`flex items-center gap-2 ${
                step >= 3 ? 'text-emerald-700 font-semibold' : 'text-slate-400'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === 3
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                3
              </div>
              <span className="text-sm font-medium">Confirm</span>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            Linked Goal: <span className="text-slate-900 font-medium">{payload.goalName}</span>
          </div>
        </div>

        {/* Modal Scrollable Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* STEP 1: WHY + DECISION MEMORY */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">
                  What is prompting this decision?
                </label>
                <p className="text-xs text-slate-500 mb-3">
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
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                            : 'bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-200/60'
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
                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 text-emerald-800 text-sm font-bold">
                    <History className="w-4 h-4 text-emerald-700" />
                    You've been here before ({matchedMemory.date})
                  </div>
                  <div className="text-xs text-slate-700 space-y-1">
                    <p>
                      <span className="text-slate-500 font-medium">Previous Action:</span> {groupRupeesInText(matchedMemory.action)}
                    </p>
                    <p>
                      <span className="text-slate-500 font-medium">Observed Outcome:</span>{' '}
                      {/^awaiting/i.test(matchedMemory.outcome ?? '') || !matchedMemory.outcome
                        ? 'Awaiting outcome (30-day check-in)'
                        : groupRupeesInText(matchedMemory.outcome)}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-100/70 border border-emerald-300 text-xs text-emerald-900">
                    <span className="font-semibold">Suggested plan from past outcome:</span>{' '}
                    {matchedMemory.reasonCategory === 'Temporary cash need'
                      ? 'Same plan as last time: pause 1 month with auto-resume.'
                      : matchedMemory.reasonCategory === 'Market worry'
                      ? 'Consider reducing temporarily instead of a full pause so some instalments continue.'
                      : matchedMemory.reasonCategory === 'Emergency'
                      ? 'Check if available cash can fulfill the emergency without reducing portfolio equity.'
                      : matchedMemory.reasonCategory === 'Big purchase'
                      ? 'Consider withdrawing a smaller amount now and keeping the rest invested toward your goal.'
                      : matchedMemory.reasonCategory === 'Rebalancing'
                      ? 'Review your allocation first; a smaller adjustment may be enough.'
                      : 'Take a smaller step first (a reduced amount or shorter pause), then review at your 30-day check-in.'}
                  </div>
                </div>
              )}

              {/* Memory Settings & Privacy */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <label className="flex items-center gap-3 cursor-pointer text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={rememberDecision}
                    onChange={(e) => setRememberDecision(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 bg-white border-slate-300 focus:ring-emerald-500"
                  />
                  <span>Remember this decision (Decision Memory)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowMemoryManager(!showMemoryManager)}
                  className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-1"
                >
                  <History className="w-3.5 h-3.5" />
                  View / delete my decision memory ({decisions.length})
                </button>
              </div>

              {/* Manage Decision Memory modal toggle */}
              {showMemoryManager && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Stored Decision Memory Records
                  </h4>
                  {decisions.length === 0 ? (
                    <p className="text-xs text-slate-500">No decision records stored.</p>
                  ) : (
                    <div className="space-y-2">
                      {decisions.map((dec) => (
                        <div
                          key={dec.id}
                          className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-white border border-slate-200 shadow-xs"
                        >
                          <div>
                            <span className="font-semibold text-slate-900">{dec.reasonCategory}</span>{' '}
                            <span className="text-slate-500">({dec.date})</span>
                            <div className="text-slate-600 text-[11px]">{dec.action}</div>
                          </div>
                          <button
                            onClick={() => onDeleteDecision(dec.id)}
                            className="px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded transition-colors font-medium"
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
                  className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                    selectedReason
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
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
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                {payload.action === 'pause' && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-slate-800">
                        Pause duration (1–24 months):
                      </span>
                      <span className="text-sm font-mono text-emerald-700 font-bold">
                        {formatMonths(pauseMonths)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      {[1, 3, 6, 12].map((m) => (
                        <button
                          key={m}
                          onClick={() => setPauseMonths(m)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                            pauseMonths === m
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
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
                      className="w-full accent-emerald-600"
                    />
                    {(pauseMonths < 1 || pauseMonths > 24) && (
                      <p className="text-xs text-rose-600 mt-1">
                        Pause duration must be between 1 and 24 months.
                      </p>
                    )}
                  </div>
                )}

                {payload.action === 'reduce' && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-slate-800">
                        New Monthly SIP Amount:
                      </span>
                      <span className="text-sm font-mono text-emerald-700 font-bold">
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
                        className="flex-1 accent-emerald-600"
                      />
                      <input
                        type="number"
                        min={1}
                        max={payload.amount - 1}
                        value={reducedAmount}
                        onChange={(e) => setReducedAmount(Number(e.target.value))}
                        className="w-28 px-2 py-1 bg-white border border-slate-300 rounded-lg text-sm font-mono text-right text-slate-900"
                      />
                    </div>
                    {reducedAmount >= payload.amount && (
                      <p className="text-xs text-rose-600">
                        Reduced amount must be less than current amount ({formatINR(payload.amount)})
                      </p>
                    )}

                    {/* Time-bound duration vs Permanent toggle (Item 3) */}
                    <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-700 font-medium">Duration:</span>
                        <div className="flex items-center gap-1.5">
                          {[1, 3, 6, 12].map((m) => (
                            <button
                              key={m}
                              disabled={reducePermanent}
                              onClick={() => setReduceDurationMonths(m)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                !reducePermanent && reduceDurationMonths === m
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40'
                              }`}
                            >
                              {m} mo
                            </button>
                          ))}
                        </div>
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                        <input
                          type="checkbox"
                          checked={reducePermanent}
                          onChange={(e) => setReducePermanent(e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-600 bg-white border-slate-300"
                        />
                        <span>Make permanent</span>
                      </label>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {reducePermanent
                        ? 'Reduction applies for the entire remaining horizon.'
                        : `Reduce to ${formatINR(reducedAmount)} for ${formatMonths(reduceDurationMonths)}, then auto-restore.`}
                    </p>
                  </div>
                )}

                {payload.action === 'withdraw' && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-slate-800">
                        Withdrawal amount (Max {formatINR(payload.amount)}):
                      </span>
                      <span className="text-sm font-mono text-emerald-700 font-bold">
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
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
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
                      className="w-full accent-emerald-600"
                    />
                    {(withdrawAmount <= 0 || withdrawAmount > payload.amount) && (
                      <p className="text-xs text-rose-600 mt-1">
                        Please enter a valid amount between ₹1 and {formatINR(payload.amount)}.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* 1) 3 Impact Tiles */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-xs">
                  <div className="text-xs text-slate-500 font-medium">Goal Delay</div>
                  <div className="text-2xl font-bold font-mono text-amber-600 mt-1">
                    +{formatMonths(currentImpact.goalDelayMonths)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Postpones target milestone
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-xs">
                  <div className="text-xs text-slate-500 font-medium">Projected Value Lost</div>
                  <div className="text-2xl font-bold font-mono text-rose-600 mt-1">
                    {formatINR(currentImpact.valueLost)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Compounded over remaining horizon
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-xs">
                  <div className="text-xs text-slate-500 font-medium">
                    {payload.action === 'withdraw'
                      ? 'Remaining Holding'
                      : 'Contributions Missed'}
                  </div>
                  <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                    {payload.action === 'withdraw'
                      ? formatINR(currentImpact.remainingHolding)
                      : formatINR(currentImpact.contributionsMissed)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {payload.action === 'withdraw'
                      ? 'Retained fund balance'
                      : 'Out-of-pocket savings'}
                  </div>
                </div>
              </div>

              {/* 2) Goal Status Transition Badge */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-700 font-medium">Goal Health Transition:</span>
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {currentImpact.statusBefore}
                  </span>
                  <span className="text-slate-400">→</span>
                  <span
                    className={`px-2.5 py-1 rounded border ${
                      currentImpact.statusAfter === 'On track'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : currentImpact.statusAfter === 'Slightly behind'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {currentImpact.statusAfter}
                  </span>
                </div>
              </div>

              {/* 3) Guardrailed Simulated AI Explanation */}
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>AI-generated wording</span>
                  </div>
                  {aiGenerating && (
                    <span className="text-[10px] text-slate-500 animate-pulse font-medium">
                      Synthesizing insight...
                    </span>
                  )}
                </div>
                {aiAborted ? (
                  <p className="text-xs text-amber-700 italic font-medium">
                    Detailed explanation unavailable, showing numbers only.
                  </p>
                ) : (
                  <p className="text-xs text-slate-800 leading-relaxed font-sans">
                    {aiText}
                  </p>
                )}
              </div>

              {/* 4) 3 EQUAL-SIZE, EQUAL-WEIGHT ALTERNATIVE CARDS (All using current input/slider values) */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Available Alternatives (Choose one to proceed)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Card 1: Keep active / Keep invested */}
                  <div
                    onClick={() => {
                      setSelectedAlternative('keep');
                      setStep(3);
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between group shadow-xs ${
                      selectedAlternative === 'keep'
                        ? 'bg-emerald-50/60 border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200 hover:border-emerald-400 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {payload.action === 'withdraw' ? 'Keep invested' : 'Keep SIP active'}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Maintain baseline growth without compromising retirement goals.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-xs font-mono">
                      <div className="text-emerald-700 font-bold">Goal Delay: 0 months</div>
                      <div className="text-slate-500">Value Lost: ₹0</div>
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
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between group relative shadow-xs ${
                      selectedAlternative === 'reduce' || selectedAlternative === 'withdraw_smaller'
                        ? 'bg-emerald-50/60 border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200 hover:border-emerald-400 hover:bg-slate-50'
                    }`}
                  >
                    {(suggestedOptionKey === 'reduce' || suggestedOptionKey === 'withdraw_smaller') && (
                      <span className="absolute -top-2.5 right-3 text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full shadow-xs">
                        Suggested for you
                      </span>
                    )}
                    <div>
                      <div className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {payload.action === 'withdraw'
                          ? 'Withdraw a smaller amount'
                          : `Reduce to ${formatINR(reducedAmount)}/mo`}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {payload.action === 'withdraw'
                          ? `Withdraw ${formatINR(smallerAmount)} and keep the rest invested.`
                          : reducePermanent
                          ? 'Permanent reduction over horizon.'
                          : `Reduce for ${reduceDurationMonths} months, then auto-restore.`}
                      </p>
                      {payload.action === 'withdraw' && (
                        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="range"
                            aria-label="Smaller withdrawal amount"
                            min={1000}
                            max={Math.max(1000, withdrawAmount)}
                            step={1000}
                            value={smallerAmount}
                            onChange={(e) => setSmallerOverride(Number(e.target.value))}
                            className="w-full accent-emerald-600"
                          />
                          <div className="text-xs font-mono font-semibold text-emerald-800">{formatINR(smallerAmount)}</div>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-xs font-mono">
                      <div className="text-amber-700 font-bold">
                        Goal Delay: +{formatMonths(alt2Impact.goalDelayMonths)}
                      </div>
                      <div className="text-slate-500">
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
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between group relative shadow-xs ${
                          selectedAlternative === 'use_cash'
                            ? 'bg-emerald-50/60 border-emerald-500 ring-2 ring-emerald-500/20'
                            : 'bg-white border-slate-200 hover:border-emerald-400 hover:bg-slate-50'
                        }`}
                      >
                        {suggestedOptionKey === 'use_cash' && (
                          <span className="absolute -top-2.5 right-3 text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full shadow-xs">
                            Suggested for you
                          </span>
                        )}
                        <div>
                          <div className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                            Use available cash instead
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Deploy {formatINR(withdrawAmount)} from your {formatINR(payload.availableCash)} cash reserve.
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-xs font-mono">
                          <div className="text-emerald-700 font-bold">Goal Delay: 0 months</div>
                          <div className="text-slate-500">Value Lost: ₹0</div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 opacity-60 flex flex-col justify-between">
                        <div>
                          <div className="text-sm font-semibold text-slate-500">
                            Use cash instead (Unavailable)
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            Available cash ({formatINR(payload.availableCash)}) is lower than withdrawal request.
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-400">
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
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between group relative shadow-xs ${
                        selectedAlternative === 'pause_autoresume'
                          ? 'bg-emerald-50/60 border-emerald-500 ring-2 ring-emerald-500/20'
                          : 'bg-white border-slate-200 hover:border-emerald-400 hover:bg-slate-50'
                      }`}
                    >
                      {suggestedOptionKey === 'pause_autoresume' && (
                        <span className="absolute -top-2.5 right-3 text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full shadow-xs">
                          Suggested for you
                        </span>
                      )}
                      <div>
                        <div className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          Pause with auto-resume ({pauseMonths} mo)
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Resumes automatically on {getResumeDateString(pauseMonths)}
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-xs font-mono">
                        <div className="text-amber-700 font-bold">
                          Goal Delay: +{formatMonths(alt3Impact.goalDelayMonths)}
                        </div>
                        <div className="text-slate-500">
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
                    className="text-xs text-slate-500 hover:text-slate-800 underline underline-offset-4 decoration-slate-400 transition-colors font-medium"
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
                <div className="border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowChartSection(!showChartSection)}
                    className="w-full px-4 py-3 text-left flex items-center justify-between text-xs font-semibold text-slate-800 hover:bg-slate-100"
                  >
                    <span className="flex items-center gap-2">
                      <LineChartIcon className="w-3.5 h-3.5 text-emerald-600" />
                      Goal Trajectory: Last 24 Months Before Goal Date
                      <span className="text-[10px] text-amber-700 font-mono font-medium">
                        (Gap at goal date: {formatShortINR(gapAtGoalDate)})
                      </span>
                    </span>
                    {showChartSection ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </button>

                  {showChartSection && (
                    <div className="p-4 border-t border-slate-200 bg-white space-y-3">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">
                          Focusing on final 24 months (Month {Math.max(0, payload.goalMonthsLeft - 24)} to {payload.goalMonthsLeft})
                        </span>
                        <div className="flex items-center gap-4 font-medium">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                            <span className="text-slate-700">If you stay</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                            <span className="text-slate-700">If you change</span>
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
                              stroke="#94a3b8"
                              fontSize={10}
                              tickFormatter={(v) => `m${v}`}
                            />
                            <YAxis
                              stroke="#94a3b8"
                              fontSize={10}
                              tickFormatter={(v) => formatShortINR(v)}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#ffffff',
                                borderColor: '#cbd5e1',
                                borderRadius: '8px',
                                fontSize: '11px',
                                color: '#0f172a'
                              }}
                              formatter={(val: any) => [formatShortINR(Number(val)), 'Corpus']}
                            />
                            <ReferenceLine
                              y={payload.goalTarget}
                              stroke="#e11d48"
                              strokeDasharray="3 3"
                              label={{
                                value: `Target: ${formatShortINR(payload.goalTarget)}`,
                                fill: '#e11d48',
                                fontSize: 10,
                                position: 'top'
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="corpusBefore"
                              stroke="#059669"
                              strokeWidth={2}
                              dot={false}
                            />
                            <Line
                              type="monotone"
                              dataKey="corpusAfter"
                              stroke="#d97706"
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
                  <div className="border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowDipsTable(!showDipsTable)}
                      className="w-full px-4 py-3 text-left flex items-center justify-between text-xs font-semibold text-slate-800 hover:bg-slate-100"
                    >
                      <span className="flex items-center gap-1.5">
                        <TrendingDown className="w-3.5 h-3.5 text-amber-600" />
                        How past dips have played out (Historical drawdowns)
                      </span>
                      {showDipsTable ? (
                        <ChevronUp className="w-4 h-4 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      )}
                    </button>

                    {showDipsTable && (
                      <div className="p-4 border-t border-slate-200 bg-white space-y-2">
                        <div className="text-[10px] text-slate-500 italic text-right">
                          Illustrative sample data, not a forecast
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="text-slate-500 border-b border-slate-200">
                                <th className="pb-2">Market Drawdown</th>
                                <th className="pb-2">Historical Frequency</th>
                                <th className="pb-2">Typical Recovery</th>
                              </tr>
                            </thead>
                            <tbody className="text-slate-700 divide-y divide-slate-100 font-mono">
                              <tr>
                                <td className="py-2 text-amber-700 font-semibold">-5% dip</td>
                                <td className="py-2">2–3 times / year</td>
                                <td className="py-2 text-emerald-700 font-semibold">3–6 weeks</td>
                              </tr>
                              <tr>
                                <td className="py-2 text-amber-700 font-semibold">-10% correction</td>
                                <td className="py-2">Once / 18 months</td>
                                <td className="py-2 text-emerald-700 font-semibold">8–14 weeks</td>
                              </tr>
                              <tr>
                                <td className="py-2 text-rose-700 font-semibold">-15% bear move</td>
                                <td className="py-2">Once / 3–4 years</td>
                                <td className="py-2 text-emerald-700 font-semibold">18–28 weeks</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* "Why am I seeing this?" collapsible inspection panel */}
                <div className="border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowWhyPanel(!showWhyPanel)}
                    className="w-full px-4 py-3 text-left flex items-center justify-between text-xs font-semibold text-slate-800 hover:bg-slate-100"
                  >
                    <span className="flex items-center gap-2">
                      <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                      Why am I seeing this? (Deterministic calculation parameters)
                    </span>
                    {showWhyPanel ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </button>
                  {showWhyPanel && (
                    <div className="p-4 border-t border-slate-200 space-y-3 text-xs text-slate-700 bg-white">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 font-medium">Assumed Annual Return:</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            max={30}
                            value={assumedRate}
                            onChange={(e) => setAssumedRate(Number(e.target.value))}
                            className="w-16 px-2 py-0.5 bg-slate-50 border border-slate-300 rounded text-right font-mono text-slate-900"
                          />
                          <span className="font-medium text-slate-700">% p.a.</span>
                        </div>
                      </div>
                      <div className="space-y-1 font-mono text-[11px] text-slate-600">
                        <p>Monthly rate: r = (1 + {assumedRate}%)^(1/12) - 1</p>
                        <p>Goal Months Left (n): {payload.goalMonthsLeft}</p>
                        <p>Corpus Base: {formatINR(payload.goalCorpus)}</p>
                        <p>Formula: Σ a * (1+r)^(n-k) strictly evaluated</p>
                      </div>
                      <p className="text-[11px] text-slate-500 italic">
                        AI wording only; every number comes from a fixed deterministic calculation.
                      </p>
                    </div>
                  )}
                </div>

                {/* Disclaimer */}
                <div className="text-[11px] text-slate-500 leading-normal">
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
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4 shadow-xs">
                <h4 className="text-sm font-bold text-slate-900">Review Your Choice</h4>
                <div className="divide-y divide-slate-200 text-xs">
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-500 font-medium">Selected Decision:</span>
                    <span className="font-bold text-emerald-800 text-right">
                      {selectedAlternative === 'keep' && 'Keep investment active'}
                      {selectedAlternative === 'reduce' &&
                        `Reduce SIP to ${formatINR(reducedAmount)}/mo ${
                          reducePermanent
                            ? '(Permanent)'
                            : `for ${formatMonths(reduceDurationMonths)} (auto-restore on ${getResumeDateString(
                                reduceDurationMonths
                              )})`
                        }`}
                      {selectedAlternative === 'pause_autoresume' &&
                        `Pause for ${formatMonths(pauseMonths)} (auto-resumes on ${getResumeDateString(
                          pauseMonths
                        )})`}
                      {selectedAlternative === 'use_cash' &&
                        `Use cash reserve (${formatINR(withdrawAmount)})`}
                      {selectedAlternative === 'withdraw_smaller' &&
                        `Withdraw ${formatINR(smallerAmount)}`}
                      {selectedAlternative === 'custom' &&
                        (payload.action === 'withdraw'
                          ? `Withdraw ${formatINR(withdrawAmount)}`
                          : `Pause for ${formatMonths(pauseMonths)} (manual resume)`)}
                    </span>
                  </div>
                  {selectedAlternative === 'use_cash' && (
                    <>
                      <div className="py-2.5 flex justify-between">
                        <span className="text-slate-500 font-medium">Withdrawal:</span>
                        <span className="text-emerald-700 font-semibold">cancelled</span>
                      </div>
                      <div className="py-2.5 flex justify-between">
                        <span className="text-slate-500 font-medium">Cash balance after:</span>
                        <span className="text-slate-900 font-mono font-bold">
                          {formatINR(Math.max(0, payload.availableCash - withdrawAmount))}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-500 font-medium">Reason Category:</span>
                    <span className="text-slate-900 font-semibold">{selectedReason}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-500 font-medium">Goal Delay:</span>
                    <span className="text-amber-700 font-mono font-bold">
                      +{formatMonths(selectedImpact.goalDelayMonths)}
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-500 font-medium">Estimated Value Lost:</span>
                    <span className="text-rose-700 font-mono font-bold">
                      {formatINR(selectedImpact.valueLost)}
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-500 font-medium">Goal Status Impact:</span>
                    <span className="text-slate-900 font-bold">
                      {selectedImpact.statusBefore} → {selectedImpact.statusAfter}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
                Nothing changes until you select Done. ApexBroker will execute your choice.
              </div>

              {/* Action Buttons for Step 3 */}
              <div className="flex items-center justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-800 font-semibold transition-colors"
                >
                  ← Back to Impact
                </button>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-800 font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!isInputValid()}
                    onClick={handleConfirmDecision}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                      isInputValid()
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
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
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Esc to exit without changes</span>
          <span className="font-semibold tracking-wider text-slate-700">
            Powered by FinPilot
          </span>
        </div>
      </div>
    </div>
  );
};
