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
        <h1 className="text-2xl font-bold text-white tracking-tight">Portfolio Holdings</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Detailed asset breakdown across active mutual fund holdings
        </p>
      </div>

      {/* Summary Banner Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#121826] border border-[#1e293b]">
          <div className="text-xs text-gray-400">Total Invested</div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {formatINR(totalInvested)}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[#121826] border border-[#1e293b]">
          <div className="text-xs text-gray-400">Current Valuation</div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {formatINR(totalCurrent)}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[#121826] border border-[#1e293b]">
          <div className="text-xs text-gray-400">Unrealized Gain / Return</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            +{formatINR(totalGain)} (+{gainPercentage.toFixed(1)}%)
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="rounded-2xl bg-[#121826] border border-[#1e293b] overflow-hidden">
        <div className="p-4 border-b border-[#1e293b] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Your Mutual Funds</h3>
          <span className="text-xs text-gray-400 font-mono">{holdings.length} Positions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0e1422] text-gray-400 border-b border-[#1e293b]">
              <tr>
                <th className="py-3 px-4 font-medium">Fund Name</th>
                <th className="py-3 px-4 font-medium">Linked Goal</th>
                <th className="py-3 px-4 font-medium text-right">Invested</th>
                <th className="py-3 px-4 font-medium text-right">Current Value</th>
                <th className="py-3 px-4 font-medium text-right">Returns</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a2336] text-gray-300">
              {holdings.map((h) => {
                const gain = h.current - h.invested;
                const gainPct = h.invested > 0 ? (gain / h.invested) * 100 : 0;
                return (
                  <tr key={h.id} className="hover:bg-[#161f33]/40 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-white">
                      <div>{h.fundName}</div>
                      <div className="text-[11px] text-gray-400 font-mono">
                        {h.assetClass} · NAV ₹{h.nav.toFixed(1)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px]">
                        {h.linkedGoal}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono">
                      {formatINR(h.invested)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-white">
                      {formatINR(h.current)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono">
                      <div className="text-emerald-400 font-semibold">
                        +{formatINR(gain)}
                      </div>
                      <div className="text-[11px] text-emerald-500">
                        +{gainPct.toFixed(1)}%
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onOpenBuyMore(h)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-black font-semibold text-xs transition-all"
                        >
                          Buy More
                        </button>
                        <button
                          onClick={() => onOpenWithdrawFinPilot(h)}
                          className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white font-semibold text-xs transition-all"
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
