import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Info,
  LineChart,
  SlidersHorizontal
} from 'lucide-react';
import { TradingViewChart } from './TradingViewChart';
import { TradingViewScreener } from './TradingViewScreener';
import { CoinData, ColorTheme, MacroIndicator } from '../types/crypto';
import { CryptoService } from '../services/cryptoService';

interface MarketOverviewProps {
  coins: CoinData[];
  colorTheme: ColorTheme;
  onSelectCoin: (coin: CoinData) => void;
}

const TIMEFRAMES = [
  { label: '1시', interval: '60' },
  { label: '4시', interval: '240' },
  { label: '날', interval: 'D' },
  { label: '주', interval: 'W' },
  { label: '달', interval: 'M' },
  { label: '15분', interval: '15' },
];

export const MarketOverview: React.FC<MarketOverviewProps> = ({
  coins,
  colorTheme,
  onSelectCoin,
}) => {
  const cryptoService = CryptoService.getInstance();
  const [activeTab, setActiveTab] = useState<'chart' | 'screener'>('chart');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BINANCE:BTCUSDT');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isCoinDropdownOpen, setIsCoinDropdownOpen] = useState<boolean>(false);

  // Timeframe selector with LocalStorage persistence (Default: 'D' for "날")
  const [chartInterval, setChartInterval] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('coinon_chart_interval');
      if (saved && ['15', '60', '240', 'D', 'W', 'M'].includes(saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'D';
  });

  const handleSelectInterval = (interval: string) => {
    setChartInterval(interval);
    try {
      localStorage.setItem('coinon_chart_interval', interval);
    } catch {
      // ignore
    }
  };

  // Top 4 Macro Indicators (코스피, 비트코인, 국제 금, WTI 원유)
  const [macros, setMacros] = useState<MacroIndicator[]>([
    { id: 'kospi', name: '코스피', value: '5,859.08', changeRate: 2.24, changeStr: '+2.24%', unit: 'pt' },
    { id: 'btc', name: '비트코인', value: '103,779,000', changeRate: 0.28, changeStr: '+0.28%', unit: '원' },
    { id: 'gold', name: '국제 금', value: '3,940.01', changeRate: -0.11, changeStr: '-0.11%', unit: '$' },
    { id: 'wti', name: 'WTI 원유', value: '96.18', changeRate: -7.63, changeStr: '-7.63%', unit: '$' },
  ]);

  // Sync Macro Data with live updates
  const btcCoin = useMemo(() => coins.find((c) => c.symbol === 'BTC'), [coins]);

  useEffect(() => {
    let isSubscribed = true;

    const updateMacros = async () => {
      const liveMacros = await cryptoService.fetchMacroIndicators(btcCoin);
      if (isSubscribed && liveMacros && liveMacros.length > 0) {
        setMacros(liveMacros);
      }
    };

    updateMacros();
    const interval = setInterval(updateMacros, 15000);
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [cryptoService, btcCoin]);

  const majorCoinsList = [
    { label: 'BTC 바이낸스', symbol: 'BINANCE:BTCUSDT', name: '비트코인' },
    { label: 'ETH 바이낸스', symbol: 'BINANCE:ETHUSDT', name: '이더리움' },
    { label: 'SOL 바이낸스', symbol: 'BINANCE:SOLUSDT', name: '솔라나' },
    { label: 'XRP 바이낸스', symbol: 'BINANCE:XRPUSDT', name: '리플' },
    { label: 'DOGE 바이낸스', symbol: 'BINANCE:DOGEUSDT', name: '도지코인' },
  ];

  const currentCoinLabel = majorCoinsList.find((c) => c.symbol === selectedSymbol)?.label || 'BTC 바이낸스';

  return (
    <div className="bg-[#0b0e14] border-b border-slate-800/80">
      <div className="max-w-[1600px] mx-auto px-2.5 sm:px-6 py-2.5">
        
        {/* 1. 맨 위: 코스피, 비트코인, 국제금, WTI원유 4개 카드 */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5 mb-2.5">
          {macros.map((m) => {
            const isPositive = m.changeRate >= 0;
            return (
              <div
                key={m.id}
                className="bg-[#141822] border border-slate-800 rounded-lg p-2 sm:p-2.5 flex flex-col justify-between shadow-sm hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center space-x-1.5 text-[11px] sm:text-xs text-slate-300 font-medium truncate">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isPositive ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                  <span className="truncate">{m.name}</span>
                </div>
                <div className="mt-1 font-mono-numbers font-bold text-xs sm:text-sm md:text-base text-white tracking-tight truncate">
                  {m.value}
                </div>
                <div className={`mt-0.5 text-[10px] sm:text-xs font-mono-numbers font-semibold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {m.changeStr}
                </div>
              </div>
            );
          })}
        </div>

        {/* 2. 중간: 차트 헤더 및 타임프레임 컨트롤러 */}
        <div className="flex items-center justify-between py-1 border-t border-slate-800/60 text-xs">
          
          {/* Left: 차트 제목 & 접기/펼치기 & 코인 선택 드롭다운 */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex items-center space-x-1 font-bold text-slate-200 hover:text-white transition-colors"
            >
              <span>차트</span>
              {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>

            {/* Coin selector dropdown */}
            {!isCollapsed && activeTab === 'chart' && (
              <div className="relative">
                <button
                  onClick={() => setIsCoinDropdownOpen(!isCoinDropdownOpen)}
                  className="px-2 py-1 rounded bg-[#151c27] hover:bg-[#1a2332] border border-slate-700/80 text-white font-medium text-xs flex items-center space-x-1 transition-all"
                >
                  <span>{currentCoinLabel}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {isCoinDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1 w-40 bg-[#141a24] border border-slate-700 rounded-lg shadow-2xl py-1 z-30">
                    {majorCoinsList.map((item) => (
                      <button
                        key={item.symbol}
                        onClick={() => {
                          setSelectedSymbol(item.symbol);
                          setIsCoinDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${
                          selectedSymbol === item.symbol ? 'text-indigo-400 font-bold bg-slate-800/60' : 'text-slate-300'
                        }`}
                      >
                        <span>{item.label}</span>
                        <span className="text-[10px] text-slate-500">{item.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: 봉 단위 [ 1시 | 4시 | 날 | 주 | 달 | 15분 ] (LocalStorage 기억) */}
          {!isCollapsed && activeTab === 'chart' && (
            <div className="flex items-center space-x-0.5 sm:space-x-1">
              {TIMEFRAMES.map((tf) => {
                const isActive = chartInterval === tf.interval;
                return (
                  <button
                    key={tf.interval}
                    onClick={() => handleSelectInterval(tf.interval)}
                    className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded text-[11px] sm:text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-[#1e2533] text-white border border-slate-500 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    {tf.label}
                  </button>
                );
              })}

              {/* Screener mode switch */}
              <button
                onClick={() => setActiveTab(activeTab === 'chart' ? 'screener' : 'chart')}
                className="hidden sm:inline-flex ml-2 px-2 py-0.5 rounded text-[11px] text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700"
                title="스크리너 보기 전환"
              >
                스크리너
              </button>
            </div>
          )}

          {/* If Screener active */}
          {!isCollapsed && activeTab === 'screener' && (
            <button
              onClick={() => setActiveTab('chart')}
              className="px-2.5 py-1 rounded text-xs text-indigo-400 hover:underline font-medium"
            >
              차트로 돌아가기
            </button>
          )}

        </div>

        {/* 3. 트레이딩뷰 실시간 차트 뷰포트 */}
        {!isCollapsed && (
          <div className="mt-1 space-y-1.5">
            {activeTab === 'chart' && (
              <div className="h-[320px] sm:h-[400px] w-full rounded-lg overflow-hidden border border-slate-800 bg-[#0b0e14]">
                <TradingViewChart 
                  key={`${selectedSymbol}-${chartInterval}`}
                  symbol={selectedSymbol} 
                  interval={chartInterval}
                  height="100%" 
                />
              </div>
            )}

            {activeTab === 'screener' && (
              <div className="h-[380px] sm:h-[420px] w-full rounded-lg overflow-hidden border border-slate-800 bg-[#0b0e14]">
                <TradingViewScreener height="100%" />
              </div>
            )}

            {/* TradingView Disclaimer Notice (MANDATORY REQUIREMENT) */}
            <div className="flex items-center justify-center text-[11px] text-slate-400 py-1 gap-1.5 bg-[#0d1117] rounded border border-slate-800/60">
              <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>트레이딩뷰는 차트, 스탁스크리너 도구 등으로 시장분석을 지원합니다</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
