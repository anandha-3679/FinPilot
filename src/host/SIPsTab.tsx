import React from 'react';
import { Pause, Play, Sliders, Calendar, ArrowUpRight } from 'lucide-react';
import { formatINR } from '../engine/format';
import { SIP } from '../data/seed';

interface SIPsTabProps {
  sips: SIP[];
  onOpenPauseFinPilot: (sip: SIP) => void;
  onOpenReduceFinPilot: (sip: SIP) => void;
  onResumeSIP: (sipId: string) => void;
}

export const SIPsTab: React.FC<SIPsTabProps> = ({
  sips,
  onOpenPauseFinPilot,
  onOpenReduceFinPilot,
  onResumeSIP
}) => {
  const activeSips = sips.filter((s) => s.status === 'Active');
  const pausedSips = sips.filter((s) => s.status === 'Paused');
  const totalMonthly = activeSips.reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Systematic Investment Plans (SIPs)</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active mandates, monthly contributions, and flexible pause/reduce management
          </p>
        </div>
        <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="text-xs text-slate-500 font-medium">Total Monthly SIP:</div>
          <div className="text-base font-bold font-mono text-emerald-700">
            {formatINR(totalMonthly)}/mo
          </div>
        </div>
      </div>

      {/* Grid of SIP Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sips.map((sip) => (
          <div
            key={sip.id}
            className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 hover:shadow-sm transition-all"
          >
            <div>
              <div className="flex items-center justify-between">
                <span
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${
                    sip.status === 'Active'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  {sip.status === 'Paused' && sip.pausedUntil
                    ? `Paused until ${sip.pausedUntil} · auto-resumes`
                    : sip.status}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {sip.status === 'Active' ? `Next debit: ${sip.nextDebit}` : 'Debit suspended'}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 mt-3 leading-snug">
                {sip.fundName}
              </h3>
              <div className="text-xs text-slate-500 mt-1">
                Linked goal: <span className="text-slate-800 font-semibold">{sip.linkedGoal}</span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-slate-500 font-medium">Monthly Amount</div>
                  <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                    {formatINR(sip.amount)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 font-medium">Total Invested</div>
                  <div className="text-base font-bold font-mono text-slate-700 mt-0.5">
                    {formatINR(sip.totalInvested)}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons for SIP */}
            <div className="pt-2 border-t border-slate-100">
              {sip.status === 'Paused' ? (
                <button
                  onClick={() => onResumeSIP(sip.id)}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 flex items-center justify-center gap-1.5 transition-all shadow-xs"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Resume SIP
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onOpenPauseFinPilot(sip)}
                    className="py-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-600 hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    Pause SIP
                  </button>
                  <button
                    onClick={() => onOpenReduceFinPilot(sip)}
                    className="py-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-600 hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    Reduce SIP
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
