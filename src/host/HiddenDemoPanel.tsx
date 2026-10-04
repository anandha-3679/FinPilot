import React from 'react';
import { Settings2, X, RefreshCw } from 'lucide-react';

interface HiddenDemoPanelProps {
  isOpen: boolean;
  onClose: () => void;
  marketMode: 'Calm' | 'Volatile';
  onSetMarketMode: (mode: 'Calm' | 'Volatile') => void;
  llmSpeed: 'Fast' | 'Slow';
  onSetLlmSpeed: (speed: 'Fast' | 'Slow') => void;
  onResetDemo: () => void;
}

export const HiddenDemoPanel: React.FC<HiddenDemoPanelProps> = ({
  isOpen,
  onClose,
  marketMode,
  onSetMarketMode,
  llmSpeed,
  onSetLlmSpeed,
  onResetDemo
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-white border border-slate-300 rounded-2xl shadow-xl p-4 text-xs space-y-4 animate-fade-in backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1.5 font-bold text-slate-800">
          <Settings2 className="w-4 h-4 text-emerald-600" />
          <span>Demo Controls (Press 'D' to toggle)</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Market Mode */}
      <div className="space-y-1.5">
        <label className="text-slate-600 font-medium">Market Condition Mode:</label>
        <div className="grid grid-cols-2 p-1 bg-slate-100 border border-slate-200 rounded-xl">
          <button
            onClick={() => onSetMarketMode('Calm')}
            className={`py-1.5 rounded-lg font-semibold transition-all ${
              marketMode === 'Calm'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Calm
          </button>
          <button
            onClick={() => onSetMarketMode('Volatile')}
            className={`py-1.5 rounded-lg font-semibold transition-all ${
              marketMode === 'Volatile'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Volatile (-4.2%)
          </button>
        </div>
      </div>

      {/* Simulated LLM Speed */}
      <div className="space-y-1.5">
        <label className="text-slate-600 font-medium">Simulated LLM Latency:</label>
        <div className="grid grid-cols-2 p-1 bg-slate-100 border border-slate-200 rounded-xl">
          <button
            onClick={() => onSetLlmSpeed('Fast')}
            className={`py-1.5 rounded-lg font-semibold transition-all ${
              llmSpeed === 'Fast'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Fast (400ms)
          </button>
          <button
            onClick={() => onSetLlmSpeed('Slow')}
            className={`py-1.5 rounded-lg font-semibold transition-all ${
              llmSpeed === 'Slow'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Slow (1500ms / Abort)
          </button>
        </div>
        <p className="text-[10px] text-slate-500">
          Slow mode tests the &gt;800ms abort fallback rule.
        </p>
      </div>

      {/* Reset Demo */}
      <div className="pt-2 border-t border-slate-200">
        <button
          onClick={onResetDemo}
          className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium flex items-center justify-center gap-2 transition-colors border border-slate-200"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset Demo to Seed Data
        </button>
      </div>
    </div>
  );
};
