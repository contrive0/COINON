export interface CoinData {
  symbol: string;           // e.g. "BTC"
  nameKo: string;           // e.g. "비트코인"
  nameEn: string;           // e.g. "Bitcoin"
  upbitMarket: string;      // e.g. "KRW-BTC"
  binanceSymbol: string;    // e.g. "BTCUSDT"
  
  // Upbit data (KRW)
  upbitPrice: number;
  prevUpbitPrice?: number;
  upbitChangeRate: number;  // 24h change %
  upbitChangePrice: number; // 24h change amount
  upbitVolume24h: number;   // 24h trade amount in KRW
  
  // Binance data (USD)
  binancePrice: number;
  prevBinancePrice?: number;
  binanceChangeRate: number;
  binanceVolume24h: number; // 24h trade amount in USD
  
  // Calculated Kimchi Premium
  binanceKrwPrice: number;  // binancePrice * exchangeRate
  kimchiPremiumRate: number;// ((upbitPrice - binanceKrwPrice) / binanceKrwPrice) * 100
  kimchiDiffPrice: number;  // upbitPrice - binanceKrwPrice
  
  // 52-Week High & Low
  high52wPrice: number;
  high52wDiffRate: number;  // ((upbitPrice - high52wPrice) / high52wPrice) * 100
  low52wPrice: number;
  low52wDiffRate: number;   // ((upbitPrice - low52wPrice) / low52wPrice) * 100
  
  // 24h High & Low
  high24hPrice: number;
  low24hPrice: number;
  
  // UI state
  lastUpdated: number;
  flashState?: 'up' | 'down' | null;
}

export type SortField = 
  | 'symbol' 
  | 'upbitPrice' 
  | 'kimchiPremiumRate' 
  | 'upbitChangeRate' 
  | 'high52wDiffRate' 
  | 'low52wDiffRate' 
  | 'upbitVolume24h';

export type SortOrder = 'asc' | 'desc';

export type CategoryFilter = 
  | 'all' 
  | 'favorites' 
  | 'major' 
  | 'positive' 
  | 'negative' 
  | 'high-volume';

export type ColorTheme = 'kr' | 'global'; // kr: red up / blue down, global: green up / red down

export interface ExchangeRateInfo {
  rate: number;
  prevRate: number;
  changeRate: number;
  source: string;
  updatedAt: string;
}
