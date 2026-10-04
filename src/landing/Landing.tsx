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
import { CompassLogo } from '../finpilot/CompassLogo';

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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <header className="w-full border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CompassLogo size={30} showText={true} textColor="text-slate-900" />
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={scrollToHowItWorks}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              How it works
            </button>
            <button
              onClick={handleDemoClick}
              disabled={loadingDemo}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 shadow-sm transition-all flex items-center gap-2"
            >
              {loadingDemo ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          Embeddable Decision Intelligence for Brokerages
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Protecting wealth at the <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600">
            point of decision
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-base md:text-lg text-slate-600 leading-relaxed">
          An embeddable AI layer that explains the impact of a financial decision before it's
          finalised. The investor stays in control.
        </p>

        {/* Hero CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={handleDemoClick}
            disabled={loadingDemo}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 shadow-md transition-all flex items-center justify-center gap-2"
          >
            {loadingDemo ? 'Signing you in to the demo account…' : 'Try Demo as Aarav Mehta'}
          </button>
          <button
            onClick={scrollToHowItWorks}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:text-slate-900 hover:border-slate-400 font-semibold text-sm shadow-xs transition-all"
          >
            How it works
          </button>
        </div>

        {/* 3 Industry Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-16 text-left">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-2">
            <div className="text-2xl font-bold font-mono text-emerald-700">~50 lakh</div>
            <div className="text-sm font-semibold text-slate-900">SIPs lost monthly</div>
            <p className="text-xs text-slate-500 leading-normal">
              Discontinued or prematurely paused every month across India (AMFI, Jul 2026).
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-2">
            <div className="text-2xl font-bold font-mono text-amber-600">Too late</div>
            <div className="text-sm font-semibold text-slate-900">Insight arrives after</div>
            <p className="text-xs text-slate-500 leading-normal">
              Platforms notify users days after redemptions, when compound momentum is already broken.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-2">
            <div className="text-2xl font-bold font-mono text-teal-700">Lost AUM</div>
            <div className="text-sm font-semibold text-slate-900">Brokers lose at a click</div>
            <p className="text-xs text-slate-500 leading-normal">
              Brokerages bleed assets under management simply because users lack instant visibility into alternatives.
            </p>
          </div>
        </div>
      </section>

      {/* 4-Step Interactive Strip */}
      <section id="how-it-works" className="py-20 bg-white border-y border-slate-200 px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">How FinPilot Works</h2>
            <p className="text-xs md:text-sm text-slate-500">
              Zero backend friction · Client-side deterministic calculation · Pseudonymous session
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative hover:border-emerald-300 transition-colors">
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-mono text-xs font-bold flex items-center justify-center">
                1
              </div>
              <h3 className="text-sm font-semibold text-slate-900">Investor Taps Action</h3>
              <p className="text-xs text-slate-600">
                User clicks Pause SIP, Reduce SIP, or Withdraw inside ApexBroker.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative hover:border-emerald-300 transition-colors">
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-mono text-xs font-bold flex items-center justify-center">
                2
              </div>
              <h3 className="text-sm font-semibold text-slate-900">Pseudonymous Payload</h3>
              <p className="text-xs text-slate-600">
                Broker sends goal targets, corpus, and action amount (zero PII/names).
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative hover:border-emerald-300 transition-colors">
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-mono text-xs font-bold flex items-center justify-center">
                3
              </div>
              <h3 className="text-sm font-semibold text-slate-900">FinPilot Shows Impact</h3>
              <p className="text-xs text-slate-600">
                Deterministic engine models goal delays and presents 3 equal-weight alternatives.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative hover:border-emerald-300 transition-colors">
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-mono text-xs font-bold flex items-center justify-center">
                4
              </div>
              <h3 className="text-sm font-semibold text-slate-900">User Decides & Executes</h3>
              <p className="text-xs text-slate-600">
                FinPilot never executes. The host app receives the decision and updates state.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Core Feature Cards */}
      <section className="py-20 px-6 max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Core Architectural Pillars</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Decision Memory</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Closed feedback loop: Reason → Action → Outcome → Better next suggestion. Retains context across market cycles.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-800">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Deterministic Impact Engine</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every single rupee and delay calculation is computed mathematically by pure functions. Zero hallucinations.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Guardrailed AI Layer</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Template-driven synthesis that adheres strictly to verified metrics. No promises, no panic, and strict latency aborts.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white border-t border-slate-200 px-6 mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-2.5">
            <CompassLogo size={24} />
            <span className="font-semibold text-slate-800">FinPilot × ApexBroker</span>
            <span>— Prototype Spec</span>
          </div>

          <button
            onClick={handleDemoClick}
            disabled={loadingDemo}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 shadow-sm transition-all"
          >
            {loadingDemo ? 'Opening...' : 'Launch Live Demo'}
          </button>
        </div>
      </footer>
    </div>
  );
};

