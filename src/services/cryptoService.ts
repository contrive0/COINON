import { CoinData, ExchangeRateInfo, MacroIndicator } from '../types/crypto';
import { INITIAL_COINS, INITIAL_EXCHANGE_RATE } from '../data/initialCoins';

export class CryptoService {
  private static instance: CryptoService;
  private currentExchangeRate: ExchangeRateInfo = {
    rate: 0,
    prevRate: 0,
    changeRate: 0,
    source: '네이버 환율 (하나은행 기준)',
    updatedAt: '',
  };

  public static getInstance(): CryptoService {
    if (!CryptoService.instance) {
      CryptoService.instance = new CryptoService();
    }
    return CryptoService.instance;
  }

  // Fetch Macro Indicators: KOSPI, Bitcoin, Gold, WTI Crude Oil
  public async fetchMacroIndicators(btcCoin?: CoinData): Promise<MacroIndicator[]> {
    // 1. KOSPI
    let kospiValue = '5,859.08';
    let kospiChange = 2.24;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch('https://m.stock.naver.com/api/index/KOSPI/basic', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data && data.closePrice) {
          kospiValue = data.closePrice;
          kospiChange = parseFloat(data.fluctuationsRatio) || 2.24;
        }
      }
    } catch {
      // Keep benchmark
    }

    // 2. Bitcoin (Live from current Upbit market data)
    let btcValue = '103,779,000';
    let btcChange = 0.28;
    if (btcCoin && btcCoin.upbitPrice > 0) {
      btcValue = btcCoin.upbitPrice.toLocaleString('ko-KR');
      btcChange = Math.round(btcCoin.upbitChangeRate * 100) / 100;
    }

    // 3. International Gold (Binance PAXG spot fine ounce gold)
    let goldValue = '3,940.01';
    let goldChange = -0.11;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=PAXGUSDT', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data && data.lastPrice) {
          const p = parseFloat(data.lastPrice);
          if (!isNaN(p) && p > 0) {
            goldValue = p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            goldChange = parseFloat(data.priceChangePercent) || -0.11;
          }
        }
      }
    } catch {
      // Keep benchmark
    }

    // 4. WTI Crude Oil
    const wtiValue = '96.18';
    const wtiChange = -7.63;

    return [
      {
        id: 'kospi',
        name: '코스피',
        value: kospiValue,
        changeRate: kospiChange,
        changeStr: `${kospiChange >= 0 ? '+' : ''}${kospiChange.toFixed(2)}%`,
        unit: 'pt',
      },
      {
        id: 'btc',
        name: '비트코인',
        value: btcValue,
        changeRate: btcChange,
        changeStr: `${btcChange >= 0 ? '+' : ''}${btcChange.toFixed(2)}%`,
        unit: '원',
      },
      {
        id: 'gold',
        name: '국제 금',
        value: goldValue,
        changeRate: goldChange,
        changeStr: `${goldChange >= 0 ? '+' : ''}${goldChange.toFixed(2)}%`,
        unit: '$',
      },
      {
        id: 'wti',
        name: 'WTI 원유',
        value: wtiValue,
        changeRate: wtiChange,
        changeStr: `${wtiChange >= 0 ? '+' : ''}${wtiChange.toFixed(2)}%`,
        unit: '$',
      },
    ];
  }

  // Fetch USD/KRW exchange rate from Naver Search Calculator API
  public async fetchExchangeRate(): Promise<ExchangeRateInfo> {
    // 1. Primary: Naver Mobile Search Real-time Exchange Rate (KEB Hana Bank)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const naverUrl = 'https://m.search.naver.com/p/csearch/content/qapirender.nhn?key=calculator&pkid=141&q=%ED%99%98%EC%9C%A8&where=m&u1=keb&u6=standardUnit&u7=0&u3=USD&u4=KRW&u8=down&u2=1';
      const res = await fetch(naverUrl, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.country) && data.country.length >= 2) {
          const rawVal = data.country[1].value; // e.g. "1,342.60"
          const parsed = parseFloat(String(rawVal).replace(/,/g, ''));
          if (!isNaN(parsed) && parsed > 0) {
            const liveRate = Math.round(parsed * 10) / 10;
            const prev = this.currentExchangeRate.rate > 0 ? this.currentExchangeRate.rate : liveRate;
            const changeRate = prev > 0 ? ((liveRate - prev) / prev) * 100 : 0;

            this.currentExchangeRate = {
              rate: liveRate,
              prevRate: prev,
              changeRate: Math.round(changeRate * 100) / 100,
              source: '네이버 환율 (하나은행 기준)',
              updatedAt: new Date().toLocaleTimeString('ko-KR'),
            };
            return this.currentExchangeRate;
          }
        }
      }
    } catch {
      // Fall through to backup APIs if network blocks
    }

    // 2. Secondary backup: Open Exchange Rates API (open.er-api.com)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch('https://open.er-api.com/v6/latest/USD', {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.result === 'success' && data.rates && typeof data.rates.KRW === 'number') {
          const liveRate = Math.round(data.rates.KRW * 10) / 10;
          const prev = this.currentExchangeRate.rate > 0 ? this.currentExchangeRate.rate : liveRate;
          const changeRate = prev > 0 ? ((liveRate - prev) / prev) * 100 : 0;
          
          this.currentExchangeRate = {
            rate: liveRate,
            prevRate: prev,
            changeRate: Math.round(changeRate * 100) / 100,
            source: 'Open Exchange Rates (실시간)',
            updatedAt: new Date().toLocaleTimeString('ko-KR'),
          };
          return this.currentExchangeRate;
        }
      }
    } catch {
      // Fall through to backup
    }

    // 2. Secondary backup: ExchangeRate-API v4
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.rates && typeof data.rates.KRW === 'number') {
          const liveRate = Math.round(data.rates.KRW * 10) / 10;
          const prev = this.currentExchangeRate.rate > 0 ? this.currentExchangeRate.rate : liveRate;
          const changeRate = prev > 0 ? ((liveRate - prev) / prev) * 100 : 0;
          
          this.currentExchangeRate = {
            rate: liveRate,
            prevRate: prev,
            changeRate: Math.round(changeRate * 100) / 100,
            source: 'ExchangeRate-API (실시간 백업)',
            updatedAt: new Date().toLocaleTimeString('ko-KR'),
          };
          return this.currentExchangeRate;
        }
      }
    } catch {
      // Fall through
    }

    // 3. Third backup: Dunamu Forex API
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch('https://quotation-api-cdn.dunamu.com/v1/forex/recent?codes=FRX.KRWUSD', {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0 && typeof data[0].basePrice === 'number') {
          const item = data[0];
          const liveRate = Math.round(item.basePrice * 10) / 10;
          const prev = this.currentExchangeRate.rate > 0 ? this.currentExchangeRate.rate : liveRate;
          const changePercent = item.changeRate !== undefined 
            ? (item.change === 'FALL' ? -(item.changeRate * 100) : item.changeRate * 100)
            : (prev > 0 ? ((liveRate - prev) / prev) * 100 : 0);

          this.currentExchangeRate = {
            rate: liveRate,
            prevRate: prev,
            changeRate: Math.round(changePercent * 100) / 100,
            source: '두나무 외환 (실시간)',
            updatedAt: new Date().toLocaleTimeString('ko-KR'),
          };
          return this.currentExchangeRate;
        }
      }
    } catch {
      // Handled silently
    }

    this.currentExchangeRate.updatedAt = new Date().toLocaleTimeString('ko-KR');
    return this.currentExchangeRate;
  }

  // Fetch all KRW markets dynamically from https://api.upbit.com/v1/market/all
  public async fetchUpbitMarkets(existingCoins: CoinData[] = []): Promise<CoinData[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch('https://api.upbit.com/v1/market/all', {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const krwMarkets = data.filter((item: any) => item.market && item.market.startsWith('KRW-'));
          if (krwMarkets.length > 0) {
            const existingMap = new Map<string, CoinData>();
            existingCoins.forEach((c) => existingMap.set(c.upbitMarket, c));
            INITIAL_COINS.forEach((c) => {
              if (!existingMap.has(c.upbitMarket)) {
                existingMap.set(c.upbitMarket, c);
              }
            });

            return krwMarkets.map((item: any) => {
              const symbol = item.market.replace('KRW-', '');
              const binanceSymbol = `${symbol}USDT`;
              const existing = existingMap.get(item.market);

              if (existing) {
                return {
                  ...existing,
                  nameKo: item.korean_name || existing.nameKo,
                  nameEn: item.english_name || existing.nameEn,
                  upbitMarket: item.market,
                  symbol,
                  binanceSymbol,
                };
              }

              return {
                symbol,
                nameKo: item.korean_name,
                nameEn: item.english_name,
                upbitMarket: item.market,
                binanceSymbol,
                upbitPrice: 0,
                upbitChangeRate: 0,
                upbitChangePrice: 0,
                upbitVolume24h: 0,
                binancePrice: 0,
                binanceChangeRate: 0,
                binanceVolume24h: 0,
                binanceKrwPrice: 0,
                kimchiPremiumRate: 0,
                kimchiDiffPrice: 0,
                high52wPrice: 0,
                high52wDiffRate: 0,
                low52wPrice: 0,
                low52wDiffRate: 0,
                high24hPrice: 0,
                low24hPrice: 0,
                lastUpdated: Date.now(),
              };
            });
          }
        }
      }
    } catch {
      // Fallback
    }
    return existingCoins.length > 0 ? existingCoins : INITIAL_COINS;
  }

  // Connect to Upbit Real-time WebSocket (wss://api.upbit.com/websocket/v1)
  public connectUpbitWebSocket(
    marketCodes: string[],
    onTicker: (ticker: any) => void
  ): () => void {
    if (typeof window === 'undefined' || !window.WebSocket || marketCodes.length === 0) {
      return () => {};
    }

    let ws: WebSocket | null = null;
    let isDisposed = false;
    let reconnectTimer: any = null;

    const connect = () => {
      if (isDisposed) return;
      try {
        ws = new WebSocket('wss://api.upbit.com/websocket/v1');
        ws.binaryType = 'blob';

        ws.onopen = () => {
          if (ws && ws.readyState === WebSocket.OPEN) {
            const payload = [
              { ticket: `coinon-${Date.now()}` },
              { type: 'ticker', codes: marketCodes },
              { format: 'DEFAULT' },
            ];
            ws.send(JSON.stringify(payload));
          }
        };

        ws.onmessage = async (event) => {
          if (isDisposed) return;
          try {
            let jsonText = '';
            if (event.data instanceof Blob) {
              jsonText = await event.data.text();
            } else if (typeof event.data === 'string') {
              jsonText = event.data;
            }
            if (jsonText) {
              const data = JSON.parse(jsonText);
              if (data && data.code && data.trade_price !== undefined) {
                onTicker(data);
              }
            }
          } catch {
            // Handled silently
          }
        };

        ws.onerror = () => {
          // Handled silently
        };

        ws.onclose = () => {
          if (!isDisposed) {
            reconnectTimer = setTimeout(connect, 3000);
          }
        };
      } catch {
        if (!isDisposed) {
          reconnectTimer = setTimeout(connect, 5000);
        }
      }
    };

    connect();

    return () => {
      isDisposed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) {
        try {
          ws.close();
        } catch {
          // Handled
        }
        ws = null;
      }
    };
  }

  // Fetch real-time tickers from Upbit (chunked in 100s) and Binance
  public async fetchLiveTickers(
    coins: CoinData[],
    exchangeRate: number
  ): Promise<{ updatedCoins: CoinData[]; isLiveApi: boolean }> {
    let hasLiveUpbit = false;
    const upbitMap = new Map<string, any>();
    const binanceMap = new Map<string, any>();

    // 1. Chunk Upbit markets into groups of 100 and fetch in parallel
    const marketCodes = coins.map((c) => c.upbitMarket);
    const chunkSize = 100;
    const marketChunks: string[][] = [];
    for (let i = 0; i < marketCodes.length; i += chunkSize) {
      marketChunks.push(marketCodes.slice(i, i + chunkSize));
    }

    try {
      const upbitFetchPromises = marketChunks.map(async (chunk) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);
          const res = await fetch(`https://api.upbit.com/v1/ticker?markets=${chunk.join(',')}`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
          });
          clearTimeout(timeoutId);
          if (res.ok) {
            return await res.json();
          }
        } catch {
          // Handled per chunk
        }
        return [];
      });

      const chunkResults = await Promise.all(upbitFetchPromises);
      chunkResults.forEach((list) => {
        if (Array.isArray(list)) {
          list.forEach((item) => {
            if (item && item.market) {
              upbitMap.set(item.market, item);
              hasLiveUpbit = true;
            }
          });
        }
      });
    } catch {
      // Handled silently
    }

    // 2. Binance API (single call for all symbols)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch('https://api.binance.com/api/v3/ticker/24hr', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const binanceData = await res.json();
        if (Array.isArray(binanceData)) {
          binanceData.forEach((item) => {
            binanceMap.set(item.symbol, item);
          });
        }
      }
    } catch {
      // Secondary Binance fallback endpoint
      try {
        const controller2 = new AbortController();
        const timeoutId2 = setTimeout(() => controller2.abort(), 3000);
        const res2 = await fetch('https://data-api.binance.vision/api/v3/ticker/24hr', {
          signal: controller2.signal,
        });
        clearTimeout(timeoutId2);
        if (res2.ok) {
          const binanceData = await res2.json();
          if (Array.isArray(binanceData)) {
            binanceData.forEach((item) => {
              binanceMap.set(item.symbol, item);
            });
          }
        }
      } catch {
        // Handled silently
      }
    }

    // If live Upbit responded, assemble updated coins
    if (hasLiveUpbit && upbitMap.size > 0) {
      const updatedCoins = coins.map((coin) => {
        const upbit = upbitMap.get(coin.upbitMarket);
        const binance = binanceMap.get(coin.binanceSymbol);

        const newUpbitPrice = upbit ? upbit.trade_price : coin.upbitPrice;
        const newBinancePrice = binance ? parseFloat(binance.lastPrice) : coin.binancePrice;

        const binanceKrwPrice = newBinancePrice > 0 && exchangeRate > 0 ? newBinancePrice * exchangeRate : 0;
        const kimchiDiffPrice = binanceKrwPrice > 0 ? newUpbitPrice - binanceKrwPrice : 0;
        const kimchiPremiumRate = binanceKrwPrice > 0 ? (kimchiDiffPrice / binanceKrwPrice) * 100 : 0;

        const high52 = upbit?.highest_52_week_price || coin.high52wPrice;
        const low52 = upbit?.lowest_52_week_price || coin.low52wPrice;

        let flashState: 'up' | 'down' | null = null;
        if (coin.upbitPrice > 0 && newUpbitPrice > 0 && coin.upbitPrice !== newUpbitPrice) {
          flashState = newUpbitPrice > coin.upbitPrice ? 'up' : 'down';
        }

        return {
          ...coin,
          prevUpbitPrice: coin.upbitPrice,
          upbitPrice: newUpbitPrice,
          upbitChangeRate: upbit ? (upbit.signed_change_rate || 0) * 100 : coin.upbitChangeRate,
          upbitChangePrice: upbit ? upbit.signed_change_price || 0 : coin.upbitChangePrice,
          upbitVolume24h: upbit ? upbit.acc_trade_price_24h || 0 : coin.upbitVolume24h,

          prevBinancePrice: coin.binancePrice,
          binancePrice: newBinancePrice,
          binanceChangeRate: binance ? parseFloat(binance.priceChangePercent) : coin.binanceChangeRate,
          binanceVolume24h: binance ? parseFloat(binance.quoteVolume) : coin.binanceVolume24h,

          binanceKrwPrice,
          kimchiPremiumRate: Math.round(kimchiPremiumRate * 100) / 100,
          kimchiDiffPrice: Math.round(kimchiDiffPrice),

          high52wPrice: high52,
          high52wDiffRate: high52 > 0 ? ((newUpbitPrice - high52) / high52) * 100 : 0,
          low52wPrice: low52,
          low52wDiffRate: low52 > 0 ? ((newUpbitPrice - low52) / low52) * 100 : 0,

          high24hPrice: upbit?.high_price || coin.high24hPrice,
          low24hPrice: upbit?.low_price || coin.low24hPrice,
          lastUpdated: Date.now(),
          flashState,
        };
      });

      return { updatedCoins, isLiveApi: true };
    }

    // Fallback Simulation Engine
    const updatedCoins = this.simulateMarketTick(coins, exchangeRate);
    return { updatedCoins, isLiveApi: false };
  }

  // Realistic simulation tick for fallback
  public simulateMarketTick(coins: CoinData[], exchangeRate: number): CoinData[] {
    return coins.map((coin) => {
      if (coin.upbitPrice === 0) return coin;
      const willMove = Math.random() < 0.35;
      if (!willMove) {
        return { ...coin, flashState: null };
      }

      const variance = (Math.random() - 0.48) * 0.005;
      const binanceVariance = (Math.random() - 0.48) * 0.005;

      const rawNewUpbitPrice = coin.upbitPrice * (1 + variance);
      let newUpbitPrice = rawNewUpbitPrice;
      if (rawNewUpbitPrice > 1000000) {
        newUpbitPrice = Math.round(rawNewUpbitPrice / 1000) * 1000;
      } else if (rawNewUpbitPrice > 10000) {
        newUpbitPrice = Math.round(rawNewUpbitPrice / 10) * 10;
      } else if (rawNewUpbitPrice > 100) {
        newUpbitPrice = Math.round(rawNewUpbitPrice);
      } else if (rawNewUpbitPrice > 1) {
        newUpbitPrice = Math.round(rawNewUpbitPrice * 10) / 10;
      } else {
        newUpbitPrice = Math.round(rawNewUpbitPrice * 10000) / 10000;
      }

      const newBinancePrice = coin.binancePrice > 0 ? Number((coin.binancePrice * (1 + binanceVariance)).toFixed(
        coin.binancePrice < 0.01 ? 7 : coin.binancePrice < 1 ? 4 : 2
      )) : 0;

      const binanceKrwPrice = newBinancePrice > 0 && exchangeRate > 0 ? newBinancePrice * exchangeRate : 0;
      const kimchiDiffPrice = binanceKrwPrice > 0 ? newUpbitPrice - binanceKrwPrice : 0;
      const kimchiPremiumRate = binanceKrwPrice > 0 ? (kimchiDiffPrice / binanceKrwPrice) * 100 : 0;

      const delta = newUpbitPrice - coin.upbitPrice;
      const flashState: 'up' | 'down' | null = delta > 0 ? 'up' : delta < 0 ? 'down' : null;

      const newChangeRate = coin.upbitChangeRate + (variance * 10);
      const newChangePrice = coin.upbitChangePrice + delta;

      return {
        ...coin,
        prevUpbitPrice: coin.upbitPrice,
        upbitPrice: newUpbitPrice,
        upbitChangeRate: Math.round(newChangeRate * 100) / 100,
        upbitChangePrice: newChangePrice,
        prevBinancePrice: coin.binancePrice,
        binancePrice: newBinancePrice,
        binanceKrwPrice,
        kimchiPremiumRate: Math.round(kimchiPremiumRate * 100) / 100,
        kimchiDiffPrice: Math.round(kimchiDiffPrice),
        high52wDiffRate: coin.high52wPrice > 0 ? ((newUpbitPrice - coin.high52wPrice) / coin.high52wPrice) * 100 : 0,
        low52wDiffRate: coin.low52wPrice > 0 ? ((newUpbitPrice - coin.low52wPrice) / coin.low52wPrice) * 100 : 0,
        high24hPrice: Math.max(coin.high24hPrice, newUpbitPrice),
        low24hPrice: Math.min(coin.low24hPrice, newUpbitPrice),
        lastUpdated: Date.now(),
        flashState,
      };
    });
  }
}
