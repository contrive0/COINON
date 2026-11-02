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
    rate: INITIAL_EXCHANGE_RATE,
    prevRate: INITIAL_EXCHANGE_RATE,
    changeRate: 0.15,
    source: '외환 실시간 기준율',
    updatedAt: new Date().toLocaleTimeString('ko-KR'),
  });
  const [isLiveApi, setIsLiveApi] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isAutoRefresh, setIsAutoRefresh] = useState<boolean>(true);
  const [refreshInterval, setRefreshInterval] = useState<number>(2); // seconds

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

  // Table Sorting & Filtering
  const [sortField, setSortField] = useState<SortField>('kimchiPremiumRate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

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

  // Fetch Exchange Rate
  const updateExchangeRate = useCallback(async () => {
    const rateInfo = await cryptoService.fetchExchangeRate();
    setExchangeRate(rateInfo);
  }, [cryptoService]);

  // Fetch Market Tickers
  const updateMarketData = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      const { updatedCoins, isLiveApi: liveStatus } = await cryptoService.fetchLiveTickers(
        coinsRef.current,
        exchangeRateRef.current.rate
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

  // Initial Load
  useEffect(() => {
    updateExchangeRate();
    updateMarketData();
  }, []);

  // Periodic Exchange Rate Refresh (Every 60s)
  useEffect(() => {
    const rateInterval = setInterval(() => {
      updateExchangeRate();
    }, 60000);
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

  // Average Kimchi Premium
  const avgKimchi = coins.length > 0 
    ? coins.reduce((acc, c) => acc + c.kimchiPremiumRate, 0) / coins.length 
    : 0;

  const btcCoin = coins.find((c) => c.symbol === 'BTC');
  const btcKimchi = btcCoin ? btcCoin.kimchiPremiumRate : 0;

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex flex-col font-sans">
      
      {/* 1. Header with InCoin identity, real-time exchange rate, and controls */}
      <Header
        exchangeRate={exchangeRate}
        colorTheme={colorTheme}
        onToggleTheme={handleToggleTheme}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        isAutoRefresh={isAutoRefresh}
        onToggleAutoRefresh={() => setIsAutoRefresh((prev) => !prev)}
        onManualRefresh={updateMarketData}
        isRefreshing={isRefreshing}
        onOpenSettings={() => setIsSettingsOpen(true)}
        avgKimchi={avgKimchi}
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
        onUpdateExchangeRate={(rate, isManual) => {
          setExchangeRate((prev) => ({
            ...prev,
            rate,
            source: isManual ? '사용자 직접 지정' : '외환 실시간 기준율',
            updatedAt: new Date().toLocaleTimeString('ko-KR'),
          }));
        }}
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
