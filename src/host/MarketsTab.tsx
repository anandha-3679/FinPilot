import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  Compass,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { Holding } from '../data/seed';
import { formatINR } from '../engine/format';

interface MarketsTabProps {
  marketMode: 'Calm' | 'Volatile';
  onSetMarketMode: (mode: 'Calm' | 'Volatile') => void;
  holdings: Holding[];
  onTriggerMarketWorrySIP?: () => void;
}

export const MarketsTab: React.FC<MarketsTabProps> = ({
  marketMode,
  onSetMarketMode,
  holdings
}) => {
  const isVolatile = marketMode === 'Volatile';

  // Sample Market Indices data linked to Calm vs Volatile setting
  const indices = [
    {
      name: 'NIFTY 50',
      value: isVolatile ? '23,124.60' : '24,310.85',
      change: isVolatile ? '-1,012.40' : '+184.20',
      percent: isVolatile ? '-4.20%' : '+0.76%',
      isDown: isVolatile,
      range: '23,080 - 23,450',
      category: 'Broad Market Benchmark'
    },
    {
      name: 'BSE SENSEX',
      value: isVolatile ? '76,210.15' : '79,842.30',
      change: isVolatile ? '-3,120.00' : '+489.10',
      percent: isVolatile ? '-3.93%' : '+0.62%',
      isDown: isVolatile,
      range: '76,100 - 77,150',
      category: 'Top 30 Indian Companies'
    },
    {
      name: 'NIFTY MIDCAP 150',
      value: isVolatile ? '19,820.40' : '21,140.75',
      change: isVolatile ? '-920.80' : '+215.30',
      percent: isVolatile ? '-4.44%' : '+1.03%',
      isDown: isVolatile,
      range: '19,750 - 20,200',
      category: 'Mid Cap Growth Universe'
    },
    {
      name: 'INDIA VIX',
      value: isVolatile ? '22.84' : '12.45',
      change: isVolatile ? '+7.40' : '-0.65',
      percent: isVolatile ? '+47.9%' : '-4.96%',
      isDown: !isVolatile, // For VIX, up means fear/volatility
      range: isVolatile ? '18.2 - 23.5' : '11.8 - 13.6',
      category: 'Market Volatility Gauge'
    }
  ];

  // Sectoral trends
  const sectors = [
    { name: 'Nifty IT', change: isVolatile ? '-3.8%' : '+1.4%', down: isVolatile },
    { name: 'Nifty Bank', change: isVolatile ? '-4.1%' : '+0.5%', down: isVolatile },
    { name: 'Nifty Auto', change: isVolatile ? '-2.9%' : '+1.8%', down: isVolatile },
    { name: 'Nifty Pharma', change: isVolatile ? '-1.2%' : '+0.9%', down: isVolatile },
    { name: 'Nifty FMCG', change: isVolatile ? '-0.8%' : '+0.3%', down: isVolatile }
  ];

  // Market Insights & Commentary
  const commentary = isVolatile
    ? {
        headline: 'Global headwinds trigger temporary pullbacks across large-caps',
        summary:
          'Nifty 50 is down 4.2% this week amidst FII outflows and global bond yields. Historical analysis shows that investors continuing SIPs during such pullbacks average 16.4% lower unit acquisition costs.',
        actionGuide:
          'FinPilot reminder: Pausing now means skipping historically cheaper purchase windows.',
        sentiment: 'High Volatility (Fear sentiment prevailing)',
        fiiDiiFlow: 'FII: -₹4,210 Cr · DII: +₹4,890 Cr (Domestic institutions absorbing supply)'
      }
    : {
        headline: 'Markets remain steady and consolidate near all-time highs',
        summary:
          'Domestic liquidity and consistent monthly mutual fund SIP inflows (₹23,332 Cr AMFI benchmark) continue to support constructive sentiment. Volatility index (India VIX) remains subdued at comfortable levels.',
        actionGuide:
          'Your portfolio is compounding predictably toward active financial goals.',
        sentiment: 'Calm & Steady (Constructive compounding environment)',
        fiiDiiFlow: 'FII: +₹620 Cr · DII: +₹1,180 Cr (Net domestic institutional inflow)'
      };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Market Intelligence</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live Mock Data
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time Indian market indices, your invested fund trends, and macroeconomic sentiment context
          </p>
        </div>

        {/* Demo Mode Sync Pill */}
        <div className="flex items-center gap-2.5 p-1.5 bg-slate-100 border border-slate-200 rounded-xl self-start md:self-auto shadow-sm">
          <span className="text-xs text-slate-600 font-medium pl-2">Market Condition:</span>
          <button
            onClick={() => onSetMarketMode('Calm')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              !isVolatile
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Calm Mode
          </button>
          <button
            onClick={() => onSetMarketMode('Volatile')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isVolatile
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Volatile (-4.2%)
          </button>
        </div>
      </div>

      {/* Primary Market Indices Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {indices.map((idx) => {
          const isNegative = idx.percent.startsWith('-');
          return (
            <div
              key={idx.name}
              className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 tracking-wide">{idx.name}</span>
                  {isNegative ? (
                    <ArrowDownRight className="w-4 h-4 text-rose-500" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                  )}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">{idx.category}</div>
                <div className="text-xl font-bold font-mono text-slate-900 mt-2">{idx.value}</div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                <span className={isNegative ? 'text-rose-600 font-semibold' : 'text-emerald-600 font-semibold'}>
                  {idx.change} ({idx.percent})
                </span>
                <span className="text-[11px] text-slate-400 font-sans">24h Day Range</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Market Context Banner & Your Invested Funds */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Market Context & Sentiment (2 columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div
            className={`p-5 rounded-2xl border shadow-sm ${
              isVolatile
                ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  isVolatile ? 'bg-amber-200 text-amber-900' : 'bg-emerald-200 text-emerald-900'
                }`}
              >
                {isVolatile ? <AlertTriangle className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="font-bold text-sm tracking-tight text-slate-900">{commentary.headline}</h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                      isVolatile
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    }`}
                  >
                    {isVolatile ? 'Weekly Dip (-4.2%)' : 'Orderly Consolidation'}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{commentary.summary}</p>
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-medium text-slate-600 border-t border-slate-200/80">
                  <span>{commentary.fiiDiiFlow}</span>
                  <span className="font-bold text-slate-800">{commentary.sentiment}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sectoral Heatmap Strip */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Sectoral Momentum (Weekly Performance)</span>
              </div>
              <span className="text-[11px] text-slate-400">Sample NSE Sectors</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {sectors.map((sec) => (
                <div
                  key={sec.name}
                  className={`p-2.5 rounded-lg border text-center transition-colors ${
                    sec.down
                      ? 'bg-rose-50/50 border-rose-200 text-rose-900'
                      : 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-800">{sec.name}</div>
                  <div
                    className={`text-xs font-mono font-semibold mt-1 ${
                      sec.down ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {sec.change}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Historical Dip Recovery Guide */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
              <span className="flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-emerald-600" />
                FinPilot Behavioral Guidance on Market Dips
              </span>
              <span className="text-[11px] text-slate-400">AMFI Historical Benchmark</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              When Indian equity markets experience 4–10% drawdowns, pausing active SIPs creates an opportunity cost. 
              Historically, 100% of Nifty 50 5-year rolling SIP periods in the past 20 years have delivered positive returns, 
              with median CAGRs of 13.8%.
            </p>
          </div>
        </div>

        {/* Your Portfolio Funds In The Current Market (1 column) */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Your Invested Funds</h3>
                <p className="text-[11px] text-slate-500">Live impact in current market condition</p>
              </div>
              <span className="text-xs font-mono font-semibold text-slate-600">
                {holdings.length} Active
              </span>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {holdings.map((h) => {
                const weeklyMove = isVolatile
                  ? h.fundName.includes('Nifty')
                    ? -4.2
                    : h.fundName.includes('Mid-Cap')
                    ? -4.8
                    : -3.5
                  : h.fundName.includes('Nifty')
                  ? +0.8
                  : h.fundName.includes('Mid-Cap')
                  ? +1.2
                  : +0.6;
                const isDown = weeklyMove < 0;

                return (
                  <div key={h.id} className="py-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-slate-900 truncate max-w-[180px]">
                        {h.fundName}
                      </span>
                      <span
                        className={`text-xs font-mono font-bold ${
                          isDown ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {isDown ? '' : '+'}
                        {weeklyMove.toFixed(1)}% this wk
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Holding: {formatINR(h.current)}</span>
                      <span className="font-mono">NAV: ₹{h.nav.toFixed(1)}</span>
                    </div>

                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span>Linked goal: {h.linkedGoal}</span>
                      <span className="text-emerald-700 font-medium">SIP Active</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Smart Recommendation:</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              {isVolatile
                ? 'Your UTI Nifty 50 and Parag Parikh holdings are acquiring units at favorable NAVs. Maintain scheduled SIP debits to benefit from rupee cost averaging.'
                : 'Steady trends across all three equity holdings. All goals remain fully on track with existing monthly contributions.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
