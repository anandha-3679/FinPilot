import React, { useState } from 'react';
import { History, Trash2, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { DecisionRecord, ActivityItem, CheckInReminder } from '../data/seed';
import { groupRupeesInText } from '../engine/format';

interface ActivityTabProps {
  decisions: DecisionRecord[];
  activities: ActivityItem[];
  checkIns: CheckInReminder[];
  onDeleteDecision: (id: string) => void;
}

export const ActivityTab: React.FC<ActivityTabProps> = ({
  decisions,
  activities,
  checkIns,
  onDeleteDecision
}) => {
  const [subTab, setSubTab] = useState<'memory' | 'transactions' | 'checkins'>('memory');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Activity & Intelligence</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit logs, 30-day scheduled check-ins, and user Decision Memory records
          </p>
        </div>

        {/* Sub-tab pills */}
        <div className="flex items-center p-1 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold self-start md:self-auto">
          <button
            onClick={() => setSubTab('memory')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              subTab === 'memory'
                ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Decision Memory ({decisions.length})
          </button>
          <button
            onClick={() => setSubTab('checkins')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              subTab === 'checkins'
                ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            30-day Check-ins ({checkIns.length})
          </button>
          <button
            onClick={() => setSubTab('transactions')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              subTab === 'transactions'
                ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Transaction Log ({activities.length})
          </button>
        </div>
      </div>

      {/* Subtab 1: Decision Memory Records */}
      {subTab === 'memory' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
            <span className="font-semibold text-emerald-800">About Decision Memory:</span> When you
            confirm a choice with memory enabled, FinPilot tracks the context and monitors the
            actual market outcome to guide your next decision loop.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {decisions.map((dec) => (
              <div
                key={dec.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {dec.reasonCategory}
                    </span>
                    <span className="text-xs font-mono text-slate-500">{dec.date}</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mt-3">{groupRupeesInText(dec.action)}</h3>
                  <div className="text-xs text-slate-500 mt-0.5 font-mono">
                    Amount / Duration: {groupRupeesInText(dec.durationOrAmount)}
                  </div>

                  <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">
                      Recorded Outcome
                    </div>
                    {!dec.outcome || /^awaiting outcome/i.test(dec.outcome) ? 'Awaiting 30-day check-in' : groupRupeesInText(dec.outcome)}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => onDeleteDecision(dec.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Record
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subtab 2: 30-Day Check-Ins */}
      {subTab === 'checkins' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
            <span className="font-semibold text-emerald-800">Scheduled Check-ins:</span> Proactive
            prompts scheduled 30 days after pauses or withdrawals to review habit resumption.
          </div>

          <div className="space-y-3">
            {checkIns.map((chk) => (
              <div
                key={chk.id}
                className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{chk.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{chk.description}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 font-mono text-xs text-slate-500">
                  {chk.date}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subtab 3: Transaction Log */}
      {subTab === 'transactions' && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Full Platform Audit Log</h3>
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {activities.map((act) => (
              <div
                key={act.id}
                className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors"
              >
                <div>
                  <div className="font-semibold text-slate-900">{act.title}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">{act.description}</div>
                </div>
                <div className="text-right font-mono text-slate-500 text-xs shrink-0 ml-4">{act.date}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
