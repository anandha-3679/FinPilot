import React, { useState } from 'react';
import {
  TrendingUp,
  Sliders,
  Sparkles,
  Shield,
  ArrowRight,
  Brain,
  Zap,
  BarChart3
} from 'lucide-react';

interface LandingProps {
  onTryDemo: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onTryDemo }) => {
  const [loadingDemo, setLoadingDemo] = useState<boolean>(false);

  const handleDemoClick = () => {
    setLoadingDemo(true);
    setTimeout(() => {
      onTryDemo();
    }, 1200);
  };

  const scrollToHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#070b13] text-gray-100 flex flex-col selection:bg-emerald-500 selection:text-black">
      {/* Top Navbar */}
      <header className="w-full border-b border-[#162033] bg-[#090e1a]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-black font-extrabold text-base shadow-lg shadow-emerald-500/20">
              F
            </div>
            <span className="font-bold text-lg text-white tracking-tight">FinPilot</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={scrollToHowItWorks}
              className="text-xs font-semibold text-gray-400 hover:text-white transition-colors"
            >
              How it works
            </button>
            <button
              onClick={handleDemoClick}
              disabled={loadingDemo}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-semibold text-xs hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              {loadingDemo ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Signing you in to demo...
                </>
              ) : (
                <>
                  Try Demo
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-28 px-6 max-w-5xl mx-auto text-center space-y-8 flex-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          Embeddable Decision Intelligence for Brokerages
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight">
          Protecting wealth at the <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
            point of decision
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-base md:text-lg text-gray-400 leading-relaxed">
          An embeddable AI layer that explains the impact of a financial decision before it's
          finalised. The investor stays in control.
        </p>

        {/* Hero CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={handleDemoClick}
            disabled={loadingDemo}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-500 text-black font-bold text-sm hover:bg-emerald-400 shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
          >
            {loadingDemo ? 'Signing you in to the demo account…' : 'Try Demo as Aarav Mehta'}
          </button>
          <button
            onClick={scrollToHowItWorks}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#121826] border border-[#1e293b] text-gray-300 hover:text-white font-semibold text-sm transition-all"
          >
            How it works
          </button>
        </div>

        {/* 3 Industry Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-16 text-left">
          <div className="p-6 rounded-2xl bg-[#0f172a] border border-[#1e293b] space-y-2">
            <div className="text-2xl font-bold font-mono text-emerald-400">~50 lakh</div>
            <div className="text-sm font-semibold text-white">SIPs lost monthly</div>
            <p className="text-xs text-gray-400 leading-normal">
              Discontinued or prematurely paused every month across India (AMFI, Jul 2026).
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0f172a] border border-[#1e293b] space-y-2">
            <div className="text-2xl font-bold font-mono text-amber-400">Too late</div>
            <div className="text-sm font-semibold text-white">Insight arrives after</div>
            <p className="text-xs text-gray-400 leading-normal">
              Platforms notify users days after redemptions, when compound momentum is already broken.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0f172a] border border-[#1e293b] space-y-2">
            <div className="text-2xl font-bold font-mono text-cyan-400">Lost AUM</div>
            <div className="text-sm font-semibold text-white">Brokers lose at a click</div>
            <p className="text-xs text-gray-400 leading-normal">
              Brokerages bleed assets under management simply because users lack instant visibility into alternatives.
            </p>
          </div>
        </div>
      </section>

      {/* 4-Step Interactive Strip */}
      <section id="how-it-works" className="py-20 bg-[#090e1a] border-y border-[#162033] px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold text-white">How FinPilot Works</h2>
            <p className="text-xs md:text-sm text-gray-400">
              Zero backend friction · Client-side deterministic calculation · Pseudonymous session
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-[#0e1628] border border-[#1d2b45] space-y-3 relative">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold flex items-center justify-center">
                1
              </div>
              <h3 className="text-sm font-semibold text-white">Investor Taps Action</h3>
              <p className="text-xs text-gray-400">
                User clicks Pause SIP, Reduce SIP, or Withdraw inside ApexBroker.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0e1628] border border-[#1d2b45] space-y-3 relative">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold flex items-center justify-center">
                2
              </div>
              <h3 className="text-sm font-semibold text-white">Pseudonymous Payload</h3>
              <p className="text-xs text-gray-400">
                Broker sends goal targets, corpus, and action amount (zero PII/names).
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0e1628] border border-[#1d2b45] space-y-3 relative">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold flex items-center justify-center">
                3
              </div>
              <h3 className="text-sm font-semibold text-white">FinPilot Shows Impact</h3>
              <p className="text-xs text-gray-400">
                Deterministic engine models goal delays and presents 3 equal-weight alternatives.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0e1628] border border-[#1d2b45] space-y-3 relative">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold flex items-center justify-center">
                4
              </div>
              <h3 className="text-sm font-semibold text-white">User Decides & Executes</h3>
              <p className="text-xs text-gray-400">
                FinPilot never executes. The host app receives the decision and updates state.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Core Feature Cards */}
      <section className="py-20 px-6 max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-white">Core Architectural Pillars</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#0f172a] border border-[#1e293b] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Decision Memory</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Closed feedback loop: Reason → Action → Outcome → Better next suggestion. Retains context across market cycles.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0f172a] border border-[#1e293b] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Deterministic Impact Engine</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Every single rupee and delay calculation is computed mathematically by pure functions. Zero hallucinations.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0f172a] border border-[#1e293b] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Guardrailed AI Layer</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Template-driven synthesis that adheres strictly to verified metrics. No promises, no panic, and strict latency aborts.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-[#080d17] border-t border-[#162033] px-6 mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500 text-black font-extrabold flex items-center justify-center text-xs">
              F
            </div>
            <span className="font-semibold text-white">FinPilot × ApexBroker</span>
            <span>— Prototype Spec</span>
          </div>

          <button
            onClick={handleDemoClick}
            disabled={loadingDemo}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 text-black font-semibold text-xs hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 transition-all"
          >
            {loadingDemo ? 'Opening...' : 'Launch Live Demo'}
          </button>
        </div>
      </footer>
    </div>
  );
};
