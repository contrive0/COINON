import React, { useState } from 'react';
import { 
  BarChart3, 
  LineChart, 
  SlidersHorizontal, 
  ChevronDown, 
  ChevronUp, 
  Flame, 
  Info,
  Maximize2
} from 'lucide-react';
import { TradingViewChart } from './TradingViewChart';
import { TradingViewScreener } from './TradingViewScreener';
import { CoinData, ColorTheme } from '../types/crypto';
import { formatKrw, formatPercent, formatUsd, getPriceChangeColor, getKimchiColor } from '../utils/formatters';

interface MarketOverviewProps {
  coins: CoinData[];
  colorTheme: ColorTheme;
  onSelectCoin: (coin: CoinData) => void;
}

export const MarketOverview: React.FC<MarketOverviewProps> = ({
  coins,
  colorTheme,
  onSelectCoin,
}) => {
  const [activeTab, setActiveTab] = useState<'chart' | 'screener' | 'cards'>('chart');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BINANCE:BTCUSDT');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Top 5 highlight coins
  const majorCoins = coins.slice(0, 5);

  const majorChartOptions = [
    { label: 'BTC/USDT', symbol: 'BINANCE:BTCUSDT' },
    { label: 'ETH/USDT', symbol: 'BINANCE:ETHUSDT' },
    { label: 'SOL/USDT', symbol: 'BINANCE:SOLUSDT' },
    { label: 'XRP/USDT', symbol: 'BINANCE:XRPUSDT' },
    { label: 'DOGE/USDT', symbol: 'BINANCE:DOGEUSDT' },
  ];

  return (
    <div className="bg-[#0f141d] border-b border-slate-800/80">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 py-3">
        
        {/* Top Mini Cards Bar (Always visible or compact) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 mb-3">
          {majorCoins.map((coin) => {
            const isSelected = selectedSymbol.includes(coin.symbol);
            return (
              <div
                key={coin.symbol}
                onClick={() => {
                  setSelectedSymbol(`BINANCE:${coin.symbol}USDT`);
                  if (activeTab !== 'chart') setActiveTab('chart');
                }}
                className={`p-2.5 rounded-lg border transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'bg-[#182030] border-indigo-500/50 shadow-md shadow-indigo-500/10'
                    : 'bg-[#131822] hover:bg-[#161d2a] border-slate-800/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-white text-xs sm:text-sm">{coin.symbol}</span>
                    <span className="text-[11px] text-slate-400">{coin.nameKo}</span>
                  </div>
                  <div className={`text-[11px] font-mono-numbers px-1.5 py-0.5 rounded font-semibold ${getKimchiColor(coin.kimchiPremiumRate, colorTheme)} bg-slate-900/60`}>
                    김프 {formatPercent(coin.kimchiPremiumRate)}
                  </div>
                </div>

                <div className="mt-1.5 flex items-baseline justify-between">
                  <div className="font-mono-numbers font-bold text-xs sm:text-sm text-slate-100">
                    ₩{formatKrw(coin.upbitPrice)}
                  </div>
                  <div className={`text-[11px] font-mono-numbers font-medium ${getPriceChangeColor(coin.upbitChangeRate, colorTheme)}`}>
                    {formatPercent(coin.upbitChangeRate)}
                  </div>
                </div>

                <div className="mt-0.5 flex items-center justify-between text-[10px] text-slate-400 font-mono-numbers">
                  <span>{formatUsd(coin.binancePrice)}</span>
                  <span>차액 {coin.kimchiDiffPrice > 0 ? '+' : ''}₩{formatKrw(coin.kimchiDiffPrice)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tab Selector & Collapse Control */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
          <div className="flex items-center space-x-1 p-1 bg-[#131822] rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => {
                setActiveTab('chart');
                setIsCollapsed(false);
              }}
              className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all ${
                activeTab === 'chart' && !isCollapsed
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LineChart className="w-3.5 h-3.5" />
              <span>실시간 바이낸스 차트</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('screener');
                setIsCollapsed(false);
              }}
              className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all ${
                activeTab === 'screener' && !isCollapsed
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>시장 스크리너</span>
            </button>
          </div>

          {/* If chart active, allow switching between BTC, ETH, SOL, etc. */}
          {activeTab === 'chart' && !isCollapsed && (
            <div className="hidden sm:flex items-center space-x-1 text-xs">
              {majorChartOptions.map((opt) => (
                <button
                  key={opt.symbol}
                  onClick={() => setSelectedSymbol(opt.symbol)}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    selectedSymbol === opt.symbol
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                      : 'text-slate-400 hover:text-slate-200 bg-[#141a24] border border-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* Collapse/Expand Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="px-2.5 py-1.5 rounded-md bg-[#131822] hover:bg-[#18202d] border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium flex items-center gap-1 transition-colors"
          >
            {isCollapsed ? (
              <>
                <span>차트/도구 펼치기</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>위젯 접기</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

        {/* Embedded Widget Viewport */}
        {!isCollapsed && (
          <div className="mt-2 space-y-2">
            {activeTab === 'chart' && (
              <div className="h-[380px] sm:h-[430px] w-full">
                <TradingViewChart symbol={selectedSymbol} height="100%" />
              </div>
            )}

            {activeTab === 'screener' && (
              <div className="h-[430px] w-full">
                <TradingViewScreener height="100%" />
              </div>
            )}

            {/* TradingView Disclaimer Notice (MANDATORY REQUIREMENT) */}
            <div className="flex items-center justify-center text-xs text-slate-400 py-1 gap-1.5 bg-[#0d1117] rounded border border-slate-800/60">
              <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>트레이딩뷰는 차트, 스탁스크리너 도구 등으로 시장분석을 지원합니다</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
