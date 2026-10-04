import React, { useState, useEffect } from 'react';
import {
  Bell,
  User,
  LogOut,
  RotateCcw,
  Info,
  Shield,
  Layers,
  Sparkles,
  TrendingUp,
  X
} from 'lucide-react';
import { useAppStore } from './state/store';
import { Landing } from './landing/Landing';
import { DashboardTab } from './host/DashboardTab';
import { PortfolioTab } from './host/PortfolioTab';
import { SIPsTab } from './host/SIPsTab';
import { GoalsTab } from './host/GoalsTab';
import { ActivityTab } from './host/ActivityTab';
import { AddInvestmentDialog } from './host/AddInvestmentDialog';
import { FinPilotModal, FinPilotPayload, FinPilotDecision } from './finpilot/FinPilotModal';
import { HiddenDemoPanel } from './host/HiddenDemoPanel';
import { Holding, SIP } from './data/seed';

export function App() {
  const {
    state,
    resetDemo,
    setMarketMode,
    setLlmSpeed,
    deleteDecision,
    applyFinPilotDecision,
    resumeSIP,
    addInvestment,
    removeToast
  } = useAppStore();

  // Navigation State: 'landing' or host tabs
  const [currentView, setCurrentView] = useState<'landing' | 'app'>('landing');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'portfolio' | 'sips' | 'goals' | 'activity'>('dashboard');

  // Modals & Panels
  const [showDemoBanner, setShowDemoBanner] = useState<boolean>(true);
  const [showDemoPanel, setShowDemoPanel] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  // Add Investment Host Modal
  const [addInvestOpen, setAddInvestOpen] = useState<boolean>(false);
  const [addInvestFund, setAddInvestFund] = useState<string | undefined>(undefined);
  const [addInvestIsSIP, setAddInvestIsSIP] = useState<boolean>(true);

  // FinPilot Modal State
  const [finPilotOpen, setFinPilotOpen] = useState<boolean>(false);
  const [finPilotPayload, setFinPilotPayload] = useState<FinPilotPayload | null>(null);

  // Keyboard shortcut listener for 'D' (Hidden demo panel)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (e.key === 'd' || e.key === 'D') {
        setShowDemoPanel((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handlers to open FinPilot from ApexBroker host actions
  const handleOpenPauseFinPilot = (sip: SIP) => {
    const holding = state.holdings.find((h) => h.fundName === sip.fundName);
    const goal = state.goals.find((g) => g.name === sip.linkedGoal) || state.goals[0];

    setFinPilotPayload({
      action: 'pause',
      fundName: sip.fundName,
      assetClass: holding?.assetClass,
      amount: sip.amount,
      goalName: goal.name,
      goalTarget: goal.target,
      goalCorpus: goal.corpusNow,
      goalMonthlyContribution: goal.monthlyContribution,
      goalMonthsLeft: goal.monthsLeft,
      availableCash: state.availableCash,
      anonUserId: 'u_4821'
    });
    setFinPilotOpen(true);
  };

  const handleOpenReduceFinPilot = (sip: SIP) => {
    const holding = state.holdings.find((h) => h.fundName === sip.fundName);
    const goal = state.goals.find((g) => g.name === sip.linkedGoal) || state.goals[0];

    setFinPilotPayload({
      action: 'reduce',
      fundName: sip.fundName,
      assetClass: holding?.assetClass,
      amount: sip.amount,
      goalName: goal.name,
      goalTarget: goal.target,
      goalCorpus: goal.corpusNow,
      goalMonthlyContribution: goal.monthlyContribution,
      goalMonthsLeft: goal.monthsLeft,
      availableCash: state.availableCash,
      anonUserId: 'u_4821'
    });
    setFinPilotOpen(true);
  };

  const handleOpenWithdrawFinPilot = (holding: Holding) => {
    const goal = state.goals.find((g) => g.name === holding.linkedGoal) || state.goals[0];

    setFinPilotPayload({
      action: 'withdraw',
      fundName: holding.fundName,
      assetClass: holding.assetClass,
      amount: holding.current,
      goalName: goal.name,
      goalTarget: goal.target,
      goalCorpus: goal.corpusNow,
      goalMonthlyContribution: goal.monthlyContribution,
      goalMonthsLeft: goal.monthsLeft,
      availableCash: state.availableCash,
      anonUserId: 'u_4821'
    });
    setFinPilotOpen(true);
  };

  // FinPilot Decision callback
  const handleFinPilotDecision = (decision: FinPilotDecision) => {
    if (!finPilotPayload) return;

    applyFinPilotDecision({
      decisionType: decision.decision,
      fundName: finPilotPayload.fundName,
      reasonCategory: decision.reasonCategory,
      newAmount: decision.newAmount,
      pauseMonths: decision.months,
      withdrawAmount: decision.withdrawAmount,
      rememberDecision: decision.rememberDecision
    });
  };

  // If on landing page
  if (currentView === 'landing') {
    return <Landing onTryDemo={() => setCurrentView('app')} />;
  }

  return (
    <div className="min-h-screen bg-[#070b13] text-gray-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* Host App Header (ApexBroker) */}
      <header className="sticky top-0 z-30 bg-[#090e1a]/90 backdrop-blur-md border-b border-[#162033]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <div
              onClick={() => setCurrentView('landing')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-black font-extrabold text-sm shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                A
              </div>
              <span className="font-bold text-base text-white tracking-tight">ApexBroker</span>
            </div>

            {/* Main Tabs Navigation */}
            <nav className="hidden md:flex items-center gap-1 p-1 bg-[#0f172a] border border-[#1e293b] rounded-xl text-xs font-semibold">
              {(
                [
                  { id: 'dashboard', label: 'Dashboard' },
                  { id: 'portfolio', label: 'Portfolio' },
                  { id: 'sips', label: 'SIPs' },
                  { id: 'goals', label: 'Goals' },
                  { id: 'activity', label: 'Activity' }
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-emerald-500 text-black shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Right Header: Bell, User Menu, Hidden Panel toggle */}
          <div className="flex items-center gap-3">
            {/* Notification Bell with check-in count */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-xl bg-[#0f172a] border border-[#1e293b] text-gray-300 hover:text-white hover:border-gray-700 transition-colors relative"
                title="Notifications & 30-day Check-ins"
              >
                <Bell className="w-4 h-4" />
                {state.checkIns.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-black text-[10px] font-bold flex items-center justify-center">
                    {state.checkIns.length}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-[#0d1424] border border-[#1f293d] rounded-2xl shadow-2xl p-4 text-xs space-y-3 z-40 animate-fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                    <span className="font-bold text-white">Scheduled Check-ins</span>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {state.checkIns.length === 0 ? (
                    <p className="text-gray-500 py-2">No pending notifications.</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {state.checkIns.map((chk) => (
                        <div
                          key={chk.id}
                          className="p-2.5 rounded-xl bg-[#121c2e] border border-[#1f2d48] space-y-1"
                        >
                          <div className="font-semibold text-white">{chk.title}</div>
                          <div className="text-gray-400 text-[11px]">{chk.description}</div>
                          <div className="text-[10px] text-emerald-400 font-mono">
                            Scheduled: {chk.date}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 pl-3 rounded-xl bg-[#0f172a] border border-[#1e293b] hover:border-gray-700 transition-colors text-xs text-left"
              >
                <span className="hidden sm:inline font-semibold text-white">Aarav Mehta</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  AM
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-[#0d1424] border border-[#1f293d] rounded-2xl shadow-2xl p-2 text-xs z-40 animate-fade-in space-y-1">
                  <div className="px-3 py-2 border-b border-gray-800">
                    <div className="font-bold text-white">Aarav Mehta</div>
                    <div className="text-gray-400 font-mono text-[11px]">ID: u_4821</div>
                  </div>
                  <button
                    onClick={() => {
                      resetDemo();
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-gray-300 hover:bg-[#152033] hover:text-white flex items-center gap-2 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    Reset demo data
                  </button>
                  <button
                    onClick={() => {
                      setCurrentView('landing');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-red-400 hover:bg-red-950/30 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Exit demo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Dismissible Demo Guidance Banner */}
      {showDemoBanner && (
        <div className="bg-gradient-to-r from-emerald-950/70 via-[#0d1e2e] to-blue-950/60 border-b border-emerald-500/20 px-6 py-2.5 text-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-500 text-black font-bold text-[10px] uppercase">
                Demo Account
              </span>
              <span className="text-gray-200">
                Sample account with pre-loaded portfolio data. Try{' '}
                <strong
                  onClick={() => setActiveTab('sips')}
                  className="text-emerald-400 cursor-pointer underline underline-offset-2"
                >
                  SIPs → Pause SIP on UTI Nifty 50
                </strong>{' '}
                to see FinPilot Decision Intelligence in action.
              </span>
            </div>
            <button
              onClick={() => setShowDemoBanner(false)}
              className="text-gray-400 hover:text-white shrink-0"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full">
        {activeTab === 'dashboard' && (
          <DashboardTab
            holdings={state.holdings}
            sips={state.sips}
            goals={state.goals}
            availableCash={state.availableCash}
            onOpenAddInvestment={() => {
              setAddInvestFund(state.holdings[0]?.fundName);
              setAddInvestIsSIP(true);
              setAddInvestOpen(true);
            }}
            onNavigateToTab={(t) => setActiveTab(t)}
          />
        )}

        {activeTab === 'portfolio' && (
          <PortfolioTab
            holdings={state.holdings}
            onOpenWithdrawFinPilot={handleOpenWithdrawFinPilot}
            onOpenBuyMore={(h) => {
              setAddInvestFund(h.fundName);
              setAddInvestIsSIP(false);
              setAddInvestOpen(true);
            }}
          />
        )}

        {activeTab === 'sips' && (
          <SIPsTab
            sips={state.sips}
            onOpenPauseFinPilot={handleOpenPauseFinPilot}
            onOpenReduceFinPilot={handleOpenReduceFinPilot}
            onResumeSIP={resumeSIP}
          />
        )}

        {activeTab === 'goals' && <GoalsTab goals={state.goals} />}

        {activeTab === 'activity' && (
          <ActivityTab
            decisions={state.decisions}
            activities={state.activities}
            checkIns={state.checkIns}
            onDeleteDecision={deleteDecision}
          />
        )}
      </main>

      {/* FinPilot Embeddable Modal */}
      <FinPilotModal
        isOpen={finPilotOpen}
        onClose={() => setFinPilotOpen(false)}
        payload={finPilotPayload}
        decisions={state.decisions}
        onDecision={handleFinPilotDecision}
        onDeleteDecision={deleteDecision}
        marketMode={state.marketMode}
        llmSpeed={state.llmSpeed}
      />

      {/* Plain Host Add Investment Dialog */}
      <AddInvestmentDialog
        isOpen={addInvestOpen}
        onClose={() => setAddInvestOpen(false)}
        holdings={state.holdings}
        goals={state.goals}
        onConfirm={(fund, amt, isSip) => addInvestment(fund, amt, isSip)}
        defaultFundName={addInvestFund}
        defaultIsSIP={addInvestIsSIP}
      />

      {/* Hidden Demo Control Panel ('D' shortcut) */}
      <HiddenDemoPanel
        isOpen={showDemoPanel}
        onClose={() => setShowDemoPanel(false)}
        marketMode={state.marketMode}
        onSetMarketMode={setMarketMode}
        llmSpeed={state.llmSpeed}
        onSetLlmSpeed={setLlmSpeed}
        onResetDemo={resetDemo}
      />

      {/* Toast Notification Container */}
      <div className="fixed bottom-4 left-4 z-50 space-y-2 pointer-events-none">
        {state.toasts.map((toast) => (
          <div
            key={toast.id}
            className="p-3 px-4 rounded-xl bg-[#0f172a] border border-emerald-500/40 text-xs text-white shadow-2xl flex items-center gap-2 pointer-events-auto animate-fade-in"
          >
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-white ml-2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
