import React, { useEffect, useRef, useState } from 'react';

interface TradingViewChartProps {
  symbol?: string; // e.g., 'BINANCE:BTCUSDT' or 'UPBIT:BTCKRW'
  height?: number | string;
  autosize?: boolean;
  interval?: string;
}

export const TradingViewChart: React.FC<TradingViewChartProps> = ({
  symbol = 'BINANCE:BTCUSDT',
  height = 420,
  autosize = true,
  interval = 'D',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setLoadError(false);
    container.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.width = '100%';
    widgetDiv.style.height = '100%';
    container.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;

    const widgetConfig = {
      autosize: autosize,
      width: '100%',
      height: typeof height === 'number' ? height : '100%',
      symbol: symbol,
      interval: interval,
      timezone: 'Asia/Seoul',
      theme: 'dark',
      style: '1',
      locale: 'kr',
      enable_publishing: false,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      backgroundColor: 'rgba(11, 14, 20, 1)',
      gridColor: 'rgba(30, 41, 59, 0.4)',
      hide_volume: false,
      support_host: 'https://www.tradingview.com',
    };

    script.innerHTML = JSON.stringify(widgetConfig);

    script.onerror = () => {
      setLoadError(true);
    };

    container.appendChild(script);

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [symbol, height, autosize, interval]);

  if (loadError) {
    return (
      <div 
        className="w-full flex flex-col items-center justify-center bg-[#10141d] border border-slate-800 rounded-lg text-slate-400 p-8"
        style={{ height }}
      >
        <div className="text-sm font-medium text-slate-300 mb-1">트레이딩뷰 차트 위젯 로딩 중</div>
        <div className="text-xs text-slate-500">네트워크 연결을 확인하거나 새로고침해 주세요. (심볼: {symbol})</div>
      </div>
    );
  }

  return (
    <div 
      className="tradingview-widget-container w-full overflow-hidden rounded-lg border border-slate-800/80 bg-[#0b0e14]"
      style={{ height }}
      ref={containerRef}
    />
  );
};
