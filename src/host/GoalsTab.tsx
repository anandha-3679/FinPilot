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
        <h1 className="text-2xl font-bold text-white tracking-tight">Financial Goals</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Long-term milestones, target horizons, and current tracking statuses
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map((g) => {
          const pct = Math.min(100, Math.round((g.corpusNow / g.target) * 100));

          return (
            <div
              key={g.id}
              className="p-6 rounded-2xl bg-[#121826] border border-[#1e293b] flex flex-col justify-between space-y-5"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Target className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{g.name}</h3>
                      <div className="text-[11px] text-gray-400">
                        Horizon: {g.targetDate} ({g.monthsLeft} months left)
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                      g.status === 'On track'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : g.status === 'Slightly behind'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}
                  >
                    {g.status}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-5 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Progress toward target</span>
                    <span className="font-mono text-emerald-400 font-bold">{pct}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-gray-800 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        g.status === 'On track'
                          ? 'bg-emerald-500'
                          : g.status === 'Slightly behind'
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Metric breakdown */}
                <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-gray-800/80 text-xs">
                  <div>
                    <div className="text-gray-400">Target</div>
                    <div className="font-mono text-white font-bold mt-0.5">
                      {formatShortINR(g.target)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">Corpus Now</div>
                    <div className="font-mono text-white font-bold mt-0.5">
                      {formatINR(g.corpusNow)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">Monthly SIP</div>
                    <div className="font-mono text-emerald-400 font-bold mt-0.5">
                      {formatINR(g.monthlyContribution)}/mo
                    </div>
                  </div>
                </div>
              </div>

              {/* Linked funds chip list */}
              <div className="pt-3 border-t border-gray-800/80">
                <div className="text-[11px] text-gray-400 mb-2">Linked Portfolio Funds:</div>
                <div className="flex flex-wrap gap-1.5">
                  {g.linkedFunds.map((fund) => (
                    <span
                      key={fund}
                      className="px-2.5 py-1 rounded-lg bg-[#0e1524] border border-[#1f2d48] text-[11px] text-gray-300"
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
