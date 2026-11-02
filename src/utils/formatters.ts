import { ColorTheme } from '../types/crypto';

// Format KRW Price
export function formatKrw(price: number): string {
  if (price === undefined || price === null || isNaN(price)) return '0';
  if (price >= 1000) {
    return price.toLocaleString('ko-KR', { maximumFractionDigits: 0 });
  } else if (price >= 100) {
    return price.toLocaleString('ko-KR', { maximumFractionDigits: 1 });
  } else if (price >= 1) {
    return price.toLocaleString('ko-KR', { maximumFractionDigits: 2 });
  } else {
    return price.toLocaleString('ko-KR', { maximumFractionDigits: 4 });
  }
}

// Format USD Price
export function formatUsd(price: number): string {
  if (price === undefined || price === null || isNaN(price)) return '$0.00';
  if (price >= 1000) {
    return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } else if (price >= 1) {
    return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 3 });
  } else if (price >= 0.01) {
    return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  } else {
    return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 7 });
  }
}

// Format Volume (억원 / 조원 / $B / $M)
export function formatTradeVolume(krwVolume: number): string {
  if (!krwVolume || isNaN(krwVolume)) return '0억';
  const trillion = 1000000000000;
  const hundredMillion = 100000000;

  if (krwVolume >= trillion) {
    return (krwVolume / trillion).toFixed(1) + '조';
  } else if (krwVolume >= hundredMillion) {
    return Math.round(krwVolume / hundredMillion).toLocaleString('ko-KR') + '억';
  } else {
    return (krwVolume / 10000).toLocaleString('ko-KR') + '만';
  }
}

export function formatUsdVolume(usdVolume: number): string {
  if (!usdVolume || isNaN(usdVolume)) return '$0';
  if (usdVolume >= 1000000000) {
    return '$' + (usdVolume / 1000000000).toFixed(2) + 'B';
  } else if (usdVolume >= 1000000) {
    return '$' + (usdVolume / 1000000).toFixed(1) + 'M';
  } else {
    return '$' + (usdVolume / 1000).toFixed(0) + 'K';
  }
}

// Format Percentage
export function formatPercent(percent: number, showSign: boolean = true): string {
  if (percent === undefined || percent === null || isNaN(percent)) return '0.00%';
  const sign = percent > 0 ? '+' : '';
  const formatted = percent.toFixed(2) + '%';
  return showSign && percent > 0 ? sign + formatted : formatted;
}

// Color Class based on theme and value
export function getPriceChangeColor(val: number, theme: ColorTheme = 'kr'): string {
  if (val > 0) {
    return theme === 'kr' ? 'text-rose-500' : 'text-emerald-400';
  } else if (val < 0) {
    return theme === 'kr' ? 'text-blue-400' : 'text-rose-500';
  }
  return 'text-slate-400';
}

// Background tint for badges/highlights
export function getPriceChangeBg(val: number, theme: ColorTheme = 'kr'): string {
  if (val > 0) {
    return theme === 'kr' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  } else if (val < 0) {
    return theme === 'kr' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  }
  return 'bg-slate-800 text-slate-400 border-slate-700';
}

// Kimchi Premium specific color
export function getKimchiColor(kimp: number, theme: ColorTheme = 'kr'): string {
  if (kimp > 0) {
    return theme === 'kr' ? 'text-rose-500' : 'text-emerald-400';
  } else if (kimp < 0) {
    return 'text-blue-400 font-semibold'; // 역프
  }
  return 'text-slate-400';
}
