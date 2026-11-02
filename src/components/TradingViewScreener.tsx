import React, { useEffect, useRef, useState } from 'react';

interface TradingViewScreenerProps {
  height?: number | string;
}

export const TradingViewScreener: React.FC<TradingViewScreenerProps> = ({
  height = 460,
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
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-screener.js';
    script.async = true;

    const widgetConfig = {
      width: '100%',
      height: typeof height === 'number' ? height : '100%',
      defaultColumn: 'overview',
      screener_type: 'crypto_mkt',
      displayCurrency: 'USD',
      colorTheme: 'dark',
      locale: 'kr',
      isTransparent: false,
      market: 'crypto',
      enableScrolling: true,
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
  }, [height]);

  if (loadError) {
    return (
      <div 
        className="w-full flex flex-col items-center justify-center bg-[#10141d] border border-slate-800 rounded-lg text-slate-400 p-8"
        style={{ height }}
      >
        <div className="text-sm font-medium text-slate-300 mb-1">트레이딩뷰 스크리너 로딩 중</div>
        <div className="text-xs text-slate-500">네트워크 연결 상태를 확인해 주세요.</div>
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
