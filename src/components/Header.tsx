import React from 'react';
import { 
  TrendingUp, 
  RefreshCw, 
  Settings, 
  Volume2, 
  VolumeX, 
  Globe, 
  Play, 
  Pause,
  DollarSign
} from 'lucide-react';
import { ColorTheme, ExchangeRateInfo, CoinData } from '../types/crypto';
import { formatKrw, formatExchangeRate, formatPercent, getPriceChangeColor } from '../utils/formatters';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  exchangeRate: ExchangeRateInfo;
  colorTheme: ColorTheme;
  onToggleTheme: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isAutoRefresh: boolean;
  onToggleAutoRefresh: () => void;
  onManualRefresh: () => void;
  isRefreshing: boolean;
  onOpenSettings: () => void;
  btcKimchi: number;
  isLiveApi: boolean;
  usdtCoin?: CoinData;
}

export const Header: React.FC<HeaderProps> = ({
  exchangeRate,
  colorTheme,
  onToggleTheme,
  soundEnabled,
  onToggleSound,
  isAutoRefresh,
  onToggleAutoRefresh,
  onManualRefresh,
  isRefreshing,
  onOpenSettings,
  btcKimchi,
  isLiveApi,
  usdtCoin,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#0e121a]/95 backdrop-blur-md border-b border-slate-800/90 shadow-lg">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-y-2">
          
          {/* Logo & Service Name */}
          <div className="flex items-center space-x-3 order-1">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white font-black text-sm tracking-tighter">
              ON
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                  코인온 <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">CoinOn</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Toolbar (5+ buttons on top-right for mobile) */}
          <div className="flex items-center space-x-1 sm:space-x-2 order-2 sm:order-3">
            
            {/* Korean vs Global Color Toggle */}
            <button
              onClick={onToggleTheme}
              className="px-2 py-1.5 rounded-md bg-[#161d28] hover:bg-[#1e2736] border border-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1 transition-all"
              title={colorTheme === 'kr' ? '한국식 색상 (빨강 상승 / 파랑 하락)' : '글로벌 색상 (초록 상승 / 빨강 하락)'}
            >
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">
                {colorTheme === 'kr' ? '한국식(적/청)' : '글로벌(녹/적)'}
              </span>
            </button>

            {/* Sound Alert Toggle */}
            <button
              onClick={onToggleSound}
              className={`p-1.5 rounded-md border text-xs transition-colors ${
                soundEnabled 
                  ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40' 
                  : 'bg-[#161d28] hover:bg-[#1e2736] text-slate-400 border-slate-800'
              }`}
              title={soundEnabled ? '사운드 알림 켜짐' : '사운드 알림 꺼짐'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-400" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Auto refresh pause / play */}
            <button
              onClick={onToggleAutoRefresh}
              className={`p-1.5 rounded-md border text-xs transition-colors ${
                isAutoRefresh 
                  ? 'bg-[#161d28] text-emerald-400 border-slate-800 hover:bg-[#1e2736]' 
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}
              title={isAutoRefresh ? '실시간 갱신 중 (일시정지 가능)' : '실시간 갱신 일시정지됨 (재개 가능)'}
            >
              {isAutoRefresh ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            {/* Manual refresh button */}
            <button
              onClick={onManualRefresh}
              disabled={isRefreshing}
              className="p-1.5 rounded-md bg-[#161d28] hover:bg-[#1e2736] border border-slate-800 text-slate-300 text-xs transition-all disabled:opacity-50"
              title="지금 새로고침"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
            </button>

            {/* PWA Install Button */}
            <PWAInstallButton />

            {/* Settings button */}
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-md bg-[#161d28] hover:bg-[#1e2736] border border-slate-800 text-slate-300 text-xs transition-all"
              title="대시보드 설정"
            >
              <Settings className="w-4 h-4 text-slate-300" />
            </button>
          </div>

          {/* Central Market Metrics: 환율 & 업비트 USDT & BTC 김프 (모바일에서는 5개 버튼 아래로 배치, 김프는 모바일 숨김) */}
          <div className="order-3 sm:order-2 w-full sm:w-auto flex items-center justify-around sm:justify-start space-x-2 sm:space-x-3 bg-[#141a24] px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-800 text-xs overflow-x-auto scrollbar-none">
            {/* 1. 환율 (USD/KRW) */}
            <div className="flex items-center space-x-1 sm:space-x-1.5 cursor-pointer hover:text-indigo-300 transition-colors shrink-0" onClick={onOpenSettings} title="환율 설정 클릭">
              <span className="text-slate-400 flex items-center">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400 mr-0.5" />
                <span className="hidden xs:inline">USD/KRW</span>
                <span className="xs:hidden">USD</span>
              </span>
              <span className="font-mono-numbers font-bold text-white text-xs sm:text-sm">
                {exchangeRate.rate > 0 ? `₩${formatExchangeRate(exchangeRate.rate)}` : '-'}
              </span>
              {exchangeRate.rate > 0 && (
                <span className={`text-[10px] sm:text-[11px] font-mono-numbers ${getPriceChangeColor(exchangeRate.changeRate, colorTheme)}`}>
                  ({formatPercent(exchangeRate.changeRate)})
                </span>
              )}
            </div>

            <div className="h-3.5 w-px bg-slate-700/60 shrink-0" />

            {/* 2. 업비트 USDT 가격 */}
            <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0" title="업비트 테더(USDT) 실시간 원화 가격">
              <span className="text-slate-400 flex items-center font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 inline-block" />
                <span className="hidden xs:inline">업비트 </span>USDT
              </span>
              <span className="font-mono-numbers font-bold text-emerald-400 text-xs sm:text-sm">
                {usdtCoin && usdtCoin.hasUpbitData && usdtCoin.upbitPrice > 0 
                  ? `₩${formatKrw(usdtCoin.upbitPrice)}` 
                  : '-'}
              </span>
              {usdtCoin && usdtCoin.hasUpbitData && usdtCoin.upbitPrice > 0 && (
                <span className={`text-[10px] sm:text-[11px] font-mono-numbers ${getPriceChangeColor(usdtCoin.upbitChangeRate, colorTheme)}`}>
                  ({formatPercent(usdtCoin.upbitChangeRate)})
                </span>
              )}
            </div>

            {/* 3. BTC Kimp (모바일에서만 삭제/숨김, 데스크톱에서만 노출) */}
            <div className="hidden sm:block h-3.5 w-px bg-slate-700/60 shrink-0" />
            <div className="hidden sm:flex items-center space-x-1 sm:space-x-1.5 shrink-0">
              <span className="text-slate-400">BTC 김프</span>
              <span className={`font-mono-numbers font-bold text-xs sm:text-sm ${getPriceChangeColor(btcKimchi, colorTheme)}`}>
                {btcKimchi !== 0 ? formatPercent(btcKimchi) : '-'}
              </span>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};
