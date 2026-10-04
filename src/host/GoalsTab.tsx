import React from 'react';
import { Target, Calendar, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { formatINR, formatShortINR, formatMonths } from '../engine/format';
import { Goal } from '../data/seed';

interface GoalsTabProps {
  goals: Goal[];
}

export const GoalsTab: React.FC<GoalsTabProps> = ({ goals }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Financial Goals</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Long-term milestones, target horizons, and current tracking statuses
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map((g) => {
          const pct = Math.min(100, Math.round((g.corpusNow / g.target) * 100));

          return (
            <div
              key={g.id}
              className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-5"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                      <Target className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{g.name}</h3>
                      <div className="text-[11px] text-slate-500">
                        Horizon: {g.targetDate} ({g.monthsLeft} months left)
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      g.status === 'On track'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : g.status === 'Slightly behind'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    {g.status}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-5 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Progress toward target</span>
                    <span className="font-mono text-emerald-700 font-bold">{pct}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        g.status === 'On track'
                          ? 'bg-emerald-600'
                          : g.status === 'Slightly behind'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Metric breakdown */}
                <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-100 text-xs">
                  <div>
                    <div className="text-slate-500 font-medium">Target</div>
                    <div className="font-mono text-slate-900 font-bold mt-0.5">
                      {formatShortINR(g.target)}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 font-medium">Corpus Now</div>
                    <div className="font-mono text-slate-900 font-bold mt-0.5">
                      {formatINR(g.corpusNow)}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 font-medium">Monthly SIP</div>
                    <div className="font-mono text-emerald-700 font-bold mt-0.5">
                      {formatINR(g.monthlyContribution)}/mo
                    </div>
                  </div>
                </div>
              </div>

              {/* Linked funds chip list */}
              <div className="pt-3 border-t border-slate-100">
                <div className="text-[11px] text-slate-500 mb-2 font-medium">Linked Portfolio Funds:</div>
                <div className="flex flex-wrap gap-1.5">
                  {g.linkedFunds.map((fund) => (
                    <span
                      key={fund}
                      className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-700 font-medium"
                    >
                      {fund}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
