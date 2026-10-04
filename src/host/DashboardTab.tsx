import React from 'react';
import {
  TrendingUp,
  Wallet,
  Calendar,
  Target,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  Plus
} from 'lucide-react';
import { formatINR, formatShortINR } from '../engine/format';
import { Holding, SIP, Goal } from '../data/seed';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface DashboardTabProps {
  holdings: Holding[];
  sips: SIP[];
  goals: Goal[];
  availableCash: number;
  onOpenAddInvestment: () => void;
  onNavigateToTab: (tab: 'portfolio' | 'sips' | 'goals' | 'activity') => void;
}

const DONUT_COLORS = ['#00d09c', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];

export const DashboardTab: React.FC<DashboardTabProps> = ({
  holdings,
  sips,
  goals,
  availableCash,
  onOpenAddInvestment,
  onNavigateToTab
}) => {
  const totalCurrent = holdings.reduce((sum, h) => sum + h.current, 0);
  const totalInvested = holdings.reduce((sum, h) => sum + h.invested, 0);
  const totalGain = totalCurrent - totalInvested;
  const gainPercentage = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;
  const totalMonthlySIP = sips
    .filter((s) => s.status === 'Active')
    .reduce((sum, s) => sum + s.amount, 0);

  // Allocation Donut Data
  const allocationData = holdings.map((h) => ({
    name: h.fundName,
    value: h.current
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting and Top Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Welcome back, Aarav 👋
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Portfolio overview · Monday, 2 Nov 2026
          </p>
        </div>
        <button
          onClick={onOpenAddInvestment}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-black font-semibold text-xs hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Investment
        </button>
      </div>

      {/* Top 3 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#121826] border border-[#1e293b] flex flex-col justify-between">
          <div>
            <div className="text-xs text-gray-400 font-medium">Total Portfolio Value</div>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {formatINR(totalCurrent)}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between text-xs">
            <span className="text-gray-400">Total Returns:</span>
            <span className="font-mono text-emerald-400 font-semibold flex items-center gap-0.5">
              +{formatINR(totalGain)} ({gainPercentage.toFixed(1)}%)
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#121826] border border-[#1e293b] flex flex-col justify-between">
          <div>
            <div className="text-xs text-gray-400 font-medium">Available Cash Balance</div>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {formatINR(availableCash)}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between text-xs">
            <span className="text-gray-400">Liquidity status:</span>
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Ready for deployment
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#121826] border border-[#1e293b] flex flex-col justify-between">
          <div>
            <div className="text-xs text-gray-400 font-medium">Monthly Active SIPs</div>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {formatINR(totalMonthlySIP)}/mo
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between text-xs">
            <span className="text-gray-400">Next Scheduled Debit:</span>
            <span className="font-mono text-gray-200 font-medium">5 Nov 2026</span>
          </div>
        </div>
      </div>

      {/* Grid: Allocation Donut & Active SIPs */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Allocation Donut Card (3 columns) */}
        <div className="lg:col-span-3 p-5 rounded-2xl bg-[#121826] border border-[#1e293b] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Portfolio Allocation</h3>
            <span className="text-xs text-gray-400 font-mono">
              {holdings.length} Funds
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-4">
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {allocationData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={DONUT_COLORS[index % DONUT_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '8px',
                      fontSize: '11px'
                    }}
                    formatter={(val: any) => [formatINR(Number(val)), 'Current Value']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend colors strictly matching segments */}
            <div className="space-y-2.5">
              {holdings.map((h, idx) => (
                <div key={h.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length] }}
                    />
                    <span className="text-gray-300 truncate">{h.fundName}</span>
                  </div>
                  <span className="font-mono text-gray-200 shrink-0">
                    {formatShortINR(h.current)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Active SIP list preview (2 columns) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#121826] border border-[#1e293b] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Active SIPs</h3>
            <button
              onClick={() => onNavigateToTab('sips')}
              className="text-xs text-emerald-400 hover:underline flex items-center gap-0.5"
            >
              Manage <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-3">
            {sips.map((sip) => (
              <div
                key={sip.id}
                className="p-3 rounded-xl bg-[#0f172a] border border-[#1e293b] flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-semibold text-white truncate max-w-[150px]">
                    {sip.fundName}
                  </div>
                  <div className="text-[11px] text-gray-400">
                    Linked: {sip.linkedGoal}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-emerald-400">
                    {formatINR(sip.amount)}/mo
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {sip.status === 'Active' ? 'Next 5 Nov' : 'Paused'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Goal Progress Overview */}
      <div className="p-5 rounded-2xl bg-[#121826] border border-[#1e293b] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Linked Goal Health</h3>
          <button
            onClick={() => onNavigateToTab('goals')}
            className="text-xs text-emerald-400 hover:underline flex items-center gap-0.5"
          >
            View all goals <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((g) => {
            const pct = Math.min(100, Math.round((g.corpusNow / g.target) * 100));
            return (
              <div
                key={g.id}
                className="p-4 rounded-xl bg-[#0f172a] border border-[#1e293b] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">{g.name}</h4>
                    <div className="text-xs text-gray-400">
                      Target: {formatShortINR(g.target)} by {g.targetDate}
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
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
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Current Corpus:</span>
                    <span className="font-mono text-gray-200">
                      {formatINR(g.corpusNow)} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
