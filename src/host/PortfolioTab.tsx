import React from 'react';
import { ArrowUpRight, ArrowDownRight, Plus } from 'lucide-react';
import { formatINR, formatShortINR } from '../engine/format';
import { Holding } from '../data/seed';

interface PortfolioTabProps {
  holdings: Holding[];
  onOpenWithdrawFinPilot: (holding: Holding) => void;
  onOpenBuyMore: (holding: Holding) => void;
}

export const PortfolioTab: React.FC<PortfolioTabProps> = ({
  holdings,
  onOpenWithdrawFinPilot,
  onOpenBuyMore
}) => {
  const totalCurrent = holdings.reduce((sum, h) => sum + h.current, 0);
  const totalInvested = holdings.reduce((sum, h) => sum + h.invested, 0);
  const totalGain = totalCurrent - totalInvested;
  const gainPercentage = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Portfolio Holdings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Detailed asset breakdown across active mutual fund holdings
        </p>
      </div>

      {/* Summary Banner Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Total Invested</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            {formatINR(totalInvested)}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Current Valuation</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            {formatINR(totalCurrent)}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Unrealized Gain / Return</div>
          <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
            +{formatINR(totalGain)} (+{gainPercentage.toFixed(1)}%)
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Your Mutual Funds</h3>
          <span className="text-xs text-slate-500 font-mono font-medium">{holdings.length} Positions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">Fund Name</th>
                <th className="py-3 px-4 font-semibold">Linked Goal</th>
                <th className="py-3 px-4 font-semibold text-right">Invested</th>
                <th className="py-3 px-4 font-semibold text-right">Current Value</th>
                <th className="py-3 px-4 font-semibold text-right">Returns</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {holdings.map((h) => {
                const gain = h.current - h.invested;
                const gainPct = h.invested > 0 ? (gain / h.invested) * 100 : 0;
                return (
                  <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      <div>{h.fundName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {h.assetClass} · NAV ₹{h.nav.toFixed(1)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-medium">
                        {h.linkedGoal}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                      {formatINR(h.invested)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      {formatINR(h.current)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono">
                      <div className="text-emerald-700 font-bold">
                        +{formatINR(gain)}
                      </div>
                      <div className="text-[11px] text-emerald-800 font-semibold">
                        +{gainPct.toFixed(1)}%
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onOpenBuyMore(h)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white font-semibold text-xs transition-all shadow-xs"
                        >
                          Buy More
                        </button>
                        <button
                          onClick={() => onOpenWithdrawFinPilot(h)}
                          className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-600 hover:text-white font-semibold text-xs transition-all shadow-xs"
                        >
                          Withdraw
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
