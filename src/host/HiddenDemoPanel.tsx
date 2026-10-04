import React, { useState } from 'react';
import { Settings2, X, RefreshCw, Zap } from 'lucide-react';

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
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-[#0d1424] border border-[#23324d] rounded-2xl shadow-2xl p-4 text-xs space-y-4 animate-fade-in backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-gray-800 pb-2">
        <div className="flex items-center gap-1.5 font-bold text-white">
          <Settings2 className="w-4 h-4 text-emerald-400" />
          <span>Demo Controls (Press 'D' to toggle)</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-white rounded hover:bg-gray-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Market Mode */}
      <div className="space-y-1.5">
        <label className="text-gray-400 font-medium">Market Condition Mode:</label>
        <div className="grid grid-cols-2 p-1 bg-gray-950 border border-gray-800 rounded-xl">
          <button
            onClick={() => onSetMarketMode('Calm')}
            className={`py-1.5 rounded-lg font-semibold transition-all ${
              marketMode === 'Calm'
                ? 'bg-emerald-500 text-black shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Calm
          </button>
          <button
            onClick={() => onSetMarketMode('Volatile')}
            className={`py-1.5 rounded-lg font-semibold transition-all ${
              marketMode === 'Volatile'
                ? 'bg-amber-500 text-black shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Volatile (-4.2%)
          </button>
        </div>
      </div>

      {/* Simulated LLM Speed */}
      <div className="space-y-1.5">
        <label className="text-gray-400 font-medium">Simulated LLM Latency:</label>
        <div className="grid grid-cols-2 p-1 bg-gray-950 border border-gray-800 rounded-xl">
          <button
            onClick={() => onSetLlmSpeed('Fast')}
            className={`py-1.5 rounded-lg font-semibold transition-all ${
              llmSpeed === 'Fast'
                ? 'bg-emerald-500 text-black shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Fast (400ms)
          </button>
          <button
            onClick={() => onSetLlmSpeed('Slow')}
            className={`py-1.5 rounded-lg font-semibold transition-all ${
              llmSpeed === 'Slow'
                ? 'bg-blue-500 text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Slow (1500ms / Abort)
          </button>
        </div>
        <p className="text-[10px] text-gray-500">
          Slow mode tests the &gt;800ms abort fallback rule from Section 9.
        </p>
      </div>

      {/* Reset Demo */}
      <div className="pt-2 border-t border-gray-800">
        <button
          onClick={onResetDemo}
          className="w-full py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset Demo to Seed Data
        </button>
      </div>
    </div>
  );
};
