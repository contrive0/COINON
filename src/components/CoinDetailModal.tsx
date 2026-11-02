import React, { useEffect } from 'react';
import { 
  X, 
  ExternalLink, 
  TrendingUp, 
  TrendingDown, 
  Calculator, 
  BarChart2, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { CoinData, ColorTheme, ExchangeRateInfo } from '../types/crypto';
import { TradingViewChart } from './TradingViewChart';
import { 
  formatKrw, 
  formatUsd, 
  formatPercent, 
  formatTradeVolume, 
  formatUsdVolume, 
  getPriceChangeColor, 
  getKimchiColor 
} from '../utils/formatters';

interface CoinDetailModalProps {
  coin: CoinData | null;
  exchangeRate: ExchangeRateInfo;
  colorTheme: ColorTheme;
  onClose: () => void;
}

export const CoinDetailModal: React.FC<CoinDetailModalProps> = ({
  coin,
  exchangeRate,
  colorTheme,
  onClose,
}) => {
  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!coin) return null;

  // 52-week position calculation (0% to 100%)
  const range52w = coin.high52wPrice - coin.low52wPrice;
  const currentPosition52w = range52w > 0 
    ? Math.min(100, Math.max(0, ((coin.upbitPrice - coin.low52wPrice) / range52w) * 100))
    : 50;

  // Direct links
  const upbitLink = `https://upbit.com/exchange?code=CRIX.UPBIT.${coin.upbitMarket}`;
  const binanceLink = `https://www.binance.com/en/trade/${coin.symbol}_USDT`;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-[#0f141d] border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#141a24]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-black text-sm shadow-md">
              {coin.symbol.slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-white">{coin.nameKo}</h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {coin.symbol}
                </span>
                <span className="text-xs text-slate-400">{coin.nameEn}</span>
              </div>
              <div className="flex items-center space-x-3 text-xs mt-0.5 font-mono-numbers">
                <span className="font-bold text-white text-sm">
                  ₩{formatKrw(coin.upbitPrice)}
                </span>
                <span className={`font-semibold ${getPriceChangeColor(coin.upbitChangeRate, colorTheme)}`}>
                  {formatPercent(coin.upbitChangeRate)} ({coin.upbitChangePrice > 0 ? '+' : ''}₩{formatKrw(coin.upbitChangePrice)})
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="text-right mr-2 hidden sm:block">
              <div className="text-[11px] text-slate-400 font-medium">김치 프리미엄</div>
              <div className={`text-base font-bold font-mono-numbers ${getKimchiColor(coin.kimchiPremiumRate, colorTheme)}`}>
                {formatPercent(coin.kimchiPremiumRate)}
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* TradingView Chart Embed for this coin */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
                <BarChart2 className="w-4 h-4 text-indigo-400" />
                <span>트레이딩뷰 실시간 차트 (BINANCE:{coin.symbol}USDT)</span>
              </div>
              <span className="text-[11px] text-slate-400">
                캔들, 보조지표, 시간봉 지원
              </span>
            </div>

            <div className="h-[360px] sm:h-[400px] w-full rounded-xl overflow-hidden border border-slate-800 bg-[#0b0e14]">
              <TradingViewChart 
                symbol={`BINANCE:${coin.symbol}USDT`}
                height="100%"
              />
            </div>
          </div>

          {/* Detailed Kimchi Premium Formula Breakdown */}
          <div className="bg-[#141a24] rounded-xl border border-slate-800 p-4">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300 mb-3">
              <Calculator className="w-4 h-4 text-emerald-400" />
              <span>김치 프리미엄 정밀 산출 내역</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono-numbers">
              
              <div className="bg-[#0f141d] p-3 rounded-lg border border-slate-800/80">
                <div className="text-[11px] text-slate-400 font-sans mb-1">업비트 가격 (KRW)</div>
                <div className="text-sm font-bold text-white">₩{formatKrw(coin.upbitPrice)}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">국내 마켓 기준가</div>
              </div>

              <div className="bg-[#0f141d] p-3 rounded-lg border border-slate-800/80">
                <div className="text-[11px] text-slate-400 font-sans mb-1">바이낸스 가격 (USD)</div>
                <div className="text-sm font-bold text-white">{formatUsd(coin.binancePrice)}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">글로벌 마켓 기준가</div>
              </div>

              <div className="bg-[#0f141d] p-3 rounded-lg border border-slate-800/80">
                <div className="text-[11px] text-slate-400 font-sans mb-1">바이낸스 환산가 (KRW)</div>
                <div className="text-sm font-bold text-indigo-300">₩{formatKrw(coin.binanceKrwPrice)}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">환율: ₩{formatKrw(exchangeRate.rate)} 적용</div>
              </div>

              <div className="bg-[#0f141d] p-3 rounded-lg border border-slate-800/80">
                <div className="text-[11px] text-slate-400 font-sans mb-1">김프 비율 및 차액</div>
                <div className={`text-sm font-bold ${getKimchiColor(coin.kimchiPremiumRate, colorTheme)}`}>
                  {formatPercent(coin.kimchiPremiumRate)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  차액: {coin.kimchiDiffPrice > 0 ? '+' : ''}₩{formatKrw(coin.kimchiDiffPrice)}
                </div>
              </div>

            </div>

            {/* Formula explanation */}
            <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>공식: ((업비트가 - 바이낸스 환산가) / 바이낸스 환산가) × 100</span>
              <span className="text-slate-400">환산가 = 바이낸스(USD) × USD/KRW 환율</span>
            </div>
          </div>

          {/* 52-Week Range Progress Bar */}
          <div className="bg-[#141a24] rounded-xl border border-slate-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300">52주 가격 범위 (최저 ~ 최고)</span>
              <span className="text-xs font-mono-numbers text-slate-400">
                현재 위치: <span className="text-indigo-400 font-bold">{currentPosition52w.toFixed(1)}%</span>
              </span>
            </div>

            {/* Range bar */}
            <div className="relative w-full h-3 bg-slate-800 rounded-full overflow-hidden mb-2">
              <div 
                className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-rose-500 rounded-full transition-all duration-500"
                style={{ width: `${currentPosition52w}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs font-mono-numbers">
              <div>
                <span className="text-[11px] text-slate-400 block font-sans">52주 최저가</span>
                <span className="font-bold text-slate-300">₩{formatKrw(coin.low52wPrice)}</span>
                <span className="text-[10px] text-slate-400 block">({formatPercent(coin.low52wDiffRate)})</span>
              </div>

              <div className="text-center">
                <span className="text-[11px] text-slate-400 block font-sans">현재가</span>
                <span className="font-bold text-white">₩{formatKrw(coin.upbitPrice)}</span>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-slate-400 block font-sans">52주 최고가</span>
                <span className="font-bold text-slate-300">₩{formatKrw(coin.high52wPrice)}</span>
                <span className="text-[10px] text-slate-400 block">({formatPercent(coin.high52wDiffRate)})</span>
              </div>
            </div>
          </div>

          {/* 24-Hour Market Stats & Volume */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono-numbers">
            <div className="bg-[#141a24] p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400 font-sans block mb-1">24시간 최고가</span>
              <span className="font-bold text-slate-200">₩{formatKrw(coin.high24hPrice)}</span>
            </div>
            <div className="bg-[#141a24] p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400 font-sans block mb-1">24시간 최저가</span>
              <span className="font-bold text-slate-200">₩{formatKrw(coin.low24hPrice)}</span>
            </div>
            <div className="bg-[#141a24] p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400 font-sans block mb-1">업비트 24h 거래대금</span>
              <span className="font-bold text-slate-200">{formatTradeVolume(coin.upbitVolume24h)}</span>
            </div>
            <div className="bg-[#141a24] p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400 font-sans block mb-1">바이낸스 24h 거래대금</span>
              <span className="font-bold text-slate-200">{formatUsdVolume(coin.binanceVolume24h)}</span>
            </div>
          </div>

          {/* Quick Direct Exchange Links (Zero ads, pure direct trading navigation) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
            <div className="flex items-center space-x-1.5 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>레퍼럴 및 광고 링크 없는 순수 거래소 바로가기</span>
            </div>

            <div className="flex items-center space-x-2">
              <a
                href={upbitLink}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded-lg bg-[#141a24] hover:bg-[#1c2433] border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <span>업비트 {coin.symbol} 거래창</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>

              <a
                href={binanceLink}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <span>바이낸스 {coin.symbol} 거래창</span>
                <ExternalLink className="w-3.5 h-3.5 text-white/80" />
              </a>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
