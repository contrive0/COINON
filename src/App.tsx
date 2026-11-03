/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  CoinData, 
  ColorTheme, 
  ExchangeRateInfo, 
  SortField, 
  SortOrder, 
  CategoryFilter 
} from './types/crypto';
import { INITIAL_COINS, INITIAL_EXCHANGE_RATE } from './data/initialCoins';
import { CryptoService } from './services/cryptoService';
import { Header } from './components/Header';
import { MarketOverview } from './components/MarketOverview';
import { CoinTable } from './components/CoinTable';
import { CoinDetailModal } from './components/CoinDetailModal';
import { SettingsModal } from './components/SettingsModal';
import { soundManager } from './utils/audioAlert';

export default function App() {
  const cryptoService = CryptoService.getInstance();

  // App States
  const [coins, setCoins] = useState<CoinData[]>(INITIAL_COINS);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRateInfo>({
    rate: 0,
    prevRate: 0,
    changeRate: 0,
    source: '네이버 환율 (하나은행 기준)',
    updatedAt: '',
  });
  const [isLiveApi, setIsLiveApi] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isAutoRefresh, setIsAutoRefresh] = useState<boolean>(true);
  const [refreshInterval, setRefreshInterval] = useState<number>(15); // seconds (WebSocket provides millisecond-level live ticks)

  // Customization & Persistence
  const [colorTheme, setColorTheme] = useState<ColorTheme>(() => {
    return (localStorage.getItem('incoin_theme') as ColorTheme) || 'kr';
  });
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('incoin_favorites');
      return saved ? JSON.parse(saved) : ['BTC', 'ETH', 'SOL', 'XRP'];
    } catch {
      return ['BTC', 'ETH', 'SOL', 'XRP'];
    }
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [highAlertThreshold, setHighAlertThreshold] = useState<number>(5.0);
  const [lowAlertThreshold, setLowAlertThreshold] = useState<number>(0.0);

  // Table Sorting & Filtering (Default: 현재가 순 정렬)
  const [sortField, setSortField] = useState<SortField>('upbitPrice');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>(() => {
    try {
      const saved = localStorage.getItem('coinon_category_filter') as CategoryFilter;
      if (saved && ['all', 'favorites', 'major', 'positive', 'negative', 'high-volume'].includes(saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'all';
  });

  // Modals
  const [selectedCoin, setSelectedCoin] = useState<CoinData | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Keep ref to avoid stale state in interval
  const coinsRef = useRef<CoinData[]>(coins);
  coinsRef.current = coins;
  const exchangeRateRef = useRef<ExchangeRateInfo>(exchangeRate);
  exchangeRateRef.current = exchangeRate;
  const soundEnabledRef = useRef<boolean>(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  // Persist settings
  useEffect(() => {
    localStorage.setItem('incoin_theme', colorTheme);
  }, [colorTheme]);

  useEffect(() => {
    localStorage.setItem('incoin_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    try {
      localStorage.setItem('coinon_category_filter', categoryFilter);
    } catch {
      // ignore
    }
  }, [categoryFilter]);

  // Fetch Live Exchange Rate & Immediately Recalculate KRW for All Coins
  const updateExchangeRate = useCallback(async () => {
    const rateInfo = await cryptoService.fetchExchangeRate();
    setExchangeRate(rateInfo);
    
    // 실시간 환율을 반영하여 모든 코인의 환산 원화가 및 김프 즉시 재계산
    setCoins((prevCoins) =>
      prevCoins.map((coin) => {
        const binanceKrwPrice = coin.binancePrice * rateInfo.rate;
        const kimchiDiffPrice = coin.upbitPrice - binanceKrwPrice;
        const kimchiPremiumRate = binanceKrwPrice > 0 ? (kimchiDiffPrice / binanceKrwPrice) * 100 : 0;
        return {
          ...coin,
          binanceKrwPrice,
          kimchiDiffPrice: Math.round(kimchiDiffPrice),
          kimchiPremiumRate: Math.round(kimchiPremiumRate * 100) / 100,
        };
      })
    );
    return rateInfo;
  }, [cryptoService]);

  // Fetch Market Tickers (100% 실시간 환율로 원화 환산 및 김프 산출)
  const updateMarketData = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      // 최신 실시간 환율 확인 후 연산
      const currentLiveRate = await cryptoService.fetchExchangeRate();
      setExchangeRate(currentLiveRate);

      const { updatedCoins, isLiveApi: liveStatus } = await cryptoService.fetchLiveTickers(
        coinsRef.current,
        currentLiveRate.rate // 100% 실시간 기준 환율 적용
      );
      setCoins(updatedCoins);
      setIsLiveApi(liveStatus);

      // Sound notification check for BTC
      const btc = updatedCoins.find((c) => c.symbol === 'BTC');
      if (btc && soundEnabledRef.current) {
        if (btc.kimchiPremiumRate >= highAlertThreshold) {
          soundManager.playChime('high');
        } else if (btc.kimchiPremiumRate <= lowAlertThreshold) {
          soundManager.playChime('low');
        }
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [cryptoService, isRefreshing, highAlertThreshold, lowAlertThreshold]);

  const handleManualRefresh = useCallback(async () => {
    await updateExchangeRate();
    await updateMarketData();
  }, [updateExchangeRate, updateMarketData]);

  // Initial Load: Fetch dynamic KRW markets & subscribe to real-time Upbit WebSocket
  useEffect(() => {
    let disconnectWs: (() => void) | null = null;

    const initData = async () => {
      // 1. Fetch real-time exchange rate
      const rateInfo = await cryptoService.fetchExchangeRate();
      setExchangeRate(rateInfo);
      exchangeRateRef.current = rateInfo;

      // 2. Fetch all KRW markets dynamically from https://api.upbit.com/v1/market/all
      const allMarkets = await cryptoService.fetchUpbitMarkets(coinsRef.current);
      setCoins(allMarkets);
      coinsRef.current = allMarkets;

      // 3. Fetch initial full tickers for all KRW markets
      const { updatedCoins, isLiveApi: liveStatus } = await cryptoService.fetchLiveTickers(
        allMarkets,
        rateInfo.rate
      );
      setCoins(updatedCoins);
      coinsRef.current = updatedCoins;
      setIsLiveApi(liveStatus);

      // 4. Connect to Upbit Real-time WebSocket
      const marketCodes = allMarkets.map((c) => c.upbitMarket);
      disconnectWs = cryptoService.connectUpbitWebSocket(marketCodes, (wsData) => {
        const currentRate = exchangeRateRef.current.rate;
        setCoins((prevCoins) => {
          let hasMatch = false;
          const mapped = prevCoins.map((coin) => {
            if (coin.upbitMarket === wsData.code) {
              hasMatch = true;
              const newUpbitPrice = wsData.trade_price;
              const binanceKrwPrice = coin.binancePrice > 0 && currentRate > 0 ? coin.binancePrice * currentRate : 0;
              const kimchiDiffPrice = binanceKrwPrice > 0 ? newUpbitPrice - binanceKrwPrice : 0;
              const kimchiPremiumRate = binanceKrwPrice > 0 ? (kimchiDiffPrice / binanceKrwPrice) * 100 : 0;
              const flashState: 'up' | 'down' | null = 
                coin.upbitPrice > 0 ? (newUpbitPrice > coin.upbitPrice ? 'up' : newUpbitPrice < coin.upbitPrice ? 'down' : null) : null;

              return {
                ...coin,
                prevUpbitPrice: coin.upbitPrice,
                upbitPrice: newUpbitPrice,
                upbitChangeRate: (wsData.signed_change_rate || 0) * 100,
                upbitChangePrice: wsData.signed_change_price || 0,
                upbitVolume24h: wsData.acc_trade_price_24h || coin.upbitVolume24h,
                high52wPrice: wsData.highest_52_week_price || coin.high52wPrice,
                low52wPrice: wsData.lowest_52_week_price || coin.low52wPrice,
                high24hPrice: wsData.high_price || coin.high24hPrice,
                low24hPrice: wsData.low_price || coin.low24hPrice,
                binanceKrwPrice,
                kimchiDiffPrice: Math.round(kimchiDiffPrice),
                kimchiPremiumRate: Math.round(kimchiPremiumRate * 100) / 100,
                lastUpdated: Date.now(),
                flashState,
              };
            }
            return coin;
          });
          if (hasMatch) {
            coinsRef.current = mapped;
            return mapped;
          }
          return prevCoins;
        });
      });
    };

    initData();

    return () => {
      if (disconnectWs) disconnectWs();
    };
  }, [cryptoService]);

  // Periodic Exchange Rate Refresh (Real-time every 15s)
  useEffect(() => {
    const rateInterval = setInterval(() => {
      updateExchangeRate();
    }, 15000);
    return () => clearInterval(rateInterval);
  }, [updateExchangeRate]);

  // Live Market Data Auto-refresh Interval
  useEffect(() => {
    if (!isAutoRefresh) return;
    const intervalId = setInterval(() => {
      updateMarketData();
    }, refreshInterval * 1000);

    return () => clearInterval(intervalId);
  }, [isAutoRefresh, refreshInterval, updateMarketData]);

  // Keep selectedCoin updated in real-time if modal is open
  useEffect(() => {
    if (selectedCoin) {
      const live = coins.find((c) => c.symbol === selectedCoin.symbol);
      if (live) setSelectedCoin(live);
    }
  }, [coins]);

  // Toggle Handlers
  const handleToggleTheme = () => {
    setColorTheme((prev) => (prev === 'kr' ? 'global' : 'kr'));
  };

  const handleToggleFavorite = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol]
    );
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const btcCoin = coins.find((c) => c.symbol === 'BTC');
  const btcKimchi = btcCoin ? btcCoin.kimchiPremiumRate : 0;

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex flex-col font-sans">
      
      {/* 1. Header with CoinOn identity, real-time exchange rate, and controls */}
      <Header
        exchangeRate={exchangeRate}
        colorTheme={colorTheme}
        onToggleTheme={handleToggleTheme}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        isAutoRefresh={isAutoRefresh}
        onToggleAutoRefresh={() => setIsAutoRefresh((prev) => !prev)}
        onManualRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
        onOpenSettings={() => setIsSettingsOpen(true)}
        btcKimchi={btcKimchi}
        isLiveApi={isLiveApi}
      />

      {/* 2. Market Overview: TradingView BTC chart, screener, and disclaimer notice */}
      <MarketOverview
        coins={coins}
        colorTheme={colorTheme}
        onSelectCoin={(coin) => setSelectedCoin(coin)}
      />

      {/* 3. Main Content: Real-time Kimchi Premium Table */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-3 sm:px-6 py-4">
        <CoinTable
          coins={coins}
          colorTheme={colorTheme}
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={handleSort}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          categoryFilter={categoryFilter}
          onFilterChange={setCategoryFilter}
          favorites={favorites}
          onToggleFavorite={handleToggleFavorite}
          onSelectCoin={(coin) => setSelectedCoin(coin)}
        />
      </main>

      {/* Clean, Ad-Free Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0d1117] py-4 text-xs text-slate-400 mt-8">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-6 flex flex-wrap items-center justify-between gap-y-2">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-300">코인온 (CoinOn)</span>
            <span>·</span>
            <span>광고 없는 실시간 암호화폐 김치 프리미엄 대시보드</span>
          </div>

          <div className="flex items-center space-x-4 text-[11px] text-slate-400">
            <span>국내 마켓: 업비트 (Upbit KRW)</span>
            <span>·</span>
            <span>해외 마켓: 바이낸스 (Binance USDT)</span>
            <span>·</span>
            <span>외부 광고 및 스폰서 배너 100% 배제</span>
          </div>
        </div>
      </footer>

      {/* 4. Coin Detail Modal (Interactive popup with coin-specific TradingView chart) */}
      {selectedCoin && (
        <CoinDetailModal
          coin={selectedCoin}
          exchangeRate={exchangeRate}
          colorTheme={colorTheme}
          onClose={() => setSelectedCoin(null)}
        />
      )}

      {/* 5. Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        exchangeRate={exchangeRate}
        onRefreshExchangeRate={updateExchangeRate}
        colorTheme={colorTheme}
        onChangeColorTheme={setColorTheme}
        refreshInterval={refreshInterval}
        onChangeRefreshInterval={setRefreshInterval}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        highAlertThreshold={highAlertThreshold}
        onUpdateHighThreshold={setHighAlertThreshold}
        lowAlertThreshold={lowAlertThreshold}
        onUpdateLowThreshold={setLowAlertThreshold}
      />

    </div>
  );
}
