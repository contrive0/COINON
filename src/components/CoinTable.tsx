import React, { useMemo } from 'react';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Star, 
  Search, 
  X, 
  Filter,
  Flame,
  TrendingDown,
  Sparkles
} from 'lucide-react';
import { CoinData, ColorTheme, SortField, SortOrder, CategoryFilter } from '../types/crypto';
import { 
  formatKrw, 
  formatUsd, 
  formatPercent, 
  formatTradeVolume, 
  formatUsdVolume,
  getPriceChangeColor, 
  getKimchiColor 
} from '../utils/formatters';

interface CoinTableProps {
  coins: CoinData[];
  colorTheme: ColorTheme;
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categoryFilter: CategoryFilter;
  onFilterChange: (filter: CategoryFilter) => void;
  favorites: string[];
  onToggleFavorite: (symbol: string, e: React.MouseEvent) => void;
  onSelectCoin: (coin: CoinData) => void;
}

export const CoinTable: React.FC<CoinTableProps> = ({
  coins,
  colorTheme,
  sortField,
  sortOrder,
  onSort,
  searchQuery,
  onSearchChange,
  categoryFilter,
  onFilterChange,
  favorites,
  onToggleFavorite,
  onSelectCoin,
}) => {
  // Filter coins by category & search query
  const filteredCoins = useMemo(() => {
    let result = [...coins];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.symbol.toLowerCase().includes(q) ||
          c.nameKo.toLowerCase().includes(q) ||
          c.nameEn.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (categoryFilter === 'favorites') {
      result = result.filter((c) => favorites.includes(c.symbol));
    } else if (categoryFilter === 'major') {
      const majors = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'SUI'];
      result = result.filter((c) => majors.includes(c.symbol));
    } else if (categoryFilter === 'positive') {
      result = result.filter((c) => !!c.hasUpbitData && !!c.hasBinanceData && c.kimchiPremiumRate > 0);
    } else if (categoryFilter === 'negative') {
      result = result.filter((c) => !!c.hasUpbitData && !!c.hasBinanceData && c.kimchiPremiumRate < 0);
    } else if (categoryFilter === 'high-volume') {
      result = result.filter((c) => !!c.hasUpbitData && c.upbitVolume24h >= 100000000000); // 1,000억원 이상
    }

    // Sorting
    result.sort((a, b) => {
      let valA: number | string = 0;
      let valB: number | string = 0;

      switch (sortField) {
        case 'symbol':
          valA = a.symbol;
          valB = b.symbol;
          break;
        case 'upbitPrice':
          valA = a.hasUpbitData ? a.upbitPrice : -1;
          valB = b.hasUpbitData ? b.upbitPrice : -1;
          break;
        case 'kimchiPremiumRate':
          valA = (a.hasUpbitData && a.hasBinanceData) ? a.kimchiPremiumRate : -999999;
          valB = (b.hasUpbitData && b.hasBinanceData) ? b.kimchiPremiumRate : -999999;
          break;
        case 'upbitChangeRate':
          valA = a.hasUpbitData ? a.upbitChangeRate : -999999;
          valB = b.hasUpbitData ? b.upbitChangeRate : -999999;
          break;
        case 'high52wDiffRate':
          valA = a.hasUpbitData ? a.high52wDiffRate : -999999;
          valB = b.hasUpbitData ? b.high52wDiffRate : -999999;
          break;
        case 'low52wDiffRate':
          valA = a.hasUpbitData ? a.low52wDiffRate : -999999;
          valB = b.hasUpbitData ? b.low52wDiffRate : -999999;
          break;
        case 'upbitVolume24h':
          valA = a.hasUpbitData ? a.upbitVolume24h : -1;
          valB = b.hasUpbitData ? b.upbitVolume24h : -1;
          break;
        default:
          valA = (a.hasUpbitData && a.hasBinanceData) ? a.kimchiPremiumRate : -999999;
          valB = (b.hasUpbitData && b.hasBinanceData) ? b.kimchiPremiumRate : -999999;
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      return sortOrder === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });

    return result;
  }, [coins, searchQuery, categoryFilter, favorites, sortField, sortOrder]);

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 ml-1 inline opacity-40 group-hover:opacity-100 transition-opacity" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-indigo-400 ml-1 inline font-bold" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-indigo-400 ml-1 inline font-bold" />
    );
  };

  return (
    <div className="w-full">
      {/* Search and Category Filter Toolbar (전체, ★ 즐, 메이저, 김프, 역프, 거래대금, 검색) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mb-2.5">
        {/* Category Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
          <button
            onClick={() => onFilterChange('all')}
            className={`px-2.5 py-1.5 rounded font-medium whitespace-nowrap transition-colors ${
              categoryFilter === 'all'
                ? 'bg-[#1e2533] text-white border border-slate-600 shadow-sm'
                : 'bg-[#141a24] text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            전체
          </button>

          <button
            onClick={() => onFilterChange('favorites')}
            className={`px-2.5 py-1.5 rounded font-medium flex items-center gap-1 whitespace-nowrap transition-colors ${
              categoryFilter === 'favorites'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                : 'bg-[#141a24] text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>즐</span>
          </button>

          <button
            onClick={() => onFilterChange('major')}
            className={`px-2.5 py-1.5 rounded font-medium whitespace-nowrap transition-colors ${
              categoryFilter === 'major'
                ? 'bg-indigo-600 text-white border border-indigo-500 shadow-sm'
                : 'bg-[#141a24] text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            메이저
          </button>

          <button
            onClick={() => onFilterChange('positive')}
            className={`px-2.5 py-1.5 rounded font-medium flex items-center gap-1 whitespace-nowrap transition-colors ${
              categoryFilter === 'positive'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-sm'
                : 'bg-[#141a24] text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Flame className="w-3 h-3 text-rose-400" />
            <span>김프</span>
          </button>

          <button
            onClick={() => onFilterChange('negative')}
            className={`px-2.5 py-1.5 rounded font-medium flex items-center gap-1 whitespace-nowrap transition-colors ${
              categoryFilter === 'negative'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50 shadow-sm'
                : 'bg-[#141a24] text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <TrendingDown className="w-3 h-3 text-blue-400" />
            <span>역프</span>
          </button>

          <button
            onClick={() => onFilterChange('high-volume')}
            className={`px-2.5 py-1.5 rounded font-medium whitespace-nowrap transition-colors ${
              categoryFilter === 'high-volume'
                ? 'bg-indigo-600 text-white border border-indigo-500 shadow-sm'
                : 'bg-[#141a24] text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            거래대금
          </button>
        </div>

        {/* Search Input Box */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="BTC, 암호화폐 검색"
            className="w-full bg-[#131822] border border-slate-800 rounded-lg pl-9 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Real-time Price Table */}
      <div className="w-full overflow-x-auto rounded-xl border border-slate-800/90 bg-[#0f141d] shadow-2xl">
        <table className="w-full text-left border-collapse table-fixed md:table-auto">
          <thead>
            <tr className="bg-[#141a24]/90 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider select-none">
              
              {/* 1. 이름 */}
              <th 
                onClick={() => onSort('symbol')}
                className="py-2.5 sm:py-3 px-1.5 sm:px-2 md:px-3 cursor-pointer hover:text-slate-200 transition-colors w-[26%] sm:w-[22%] md:w-[18%]"
              >
                <div className="flex items-center group">
                  <span>이름</span>
                  {renderSortIndicator('symbol')}
                </div>
              </th>

              {/* 2. 현재가 */}
              <th 
                onClick={() => onSort('upbitPrice')}
                className="py-2.5 sm:py-3 px-1.5 sm:px-2 md:px-3 text-right cursor-pointer hover:text-slate-200 transition-colors w-[24%] sm:w-[22%] md:w-[16%]"
              >
                <div className="flex items-center justify-end group">
                  <span>현재가</span>
                  {renderSortIndicator('upbitPrice')}
                </div>
              </th>

              {/* 3. 김프 */}
              <th 
                onClick={() => onSort('kimchiPremiumRate')}
                className="py-2.5 sm:py-3 px-1 sm:px-2 md:px-2.5 text-right cursor-pointer hover:text-slate-200 transition-colors w-[16%] sm:w-[15%] md:w-[13%]"
              >
                <div className="flex items-center justify-end group">
                  <span>김프</span>
                  {renderSortIndicator('kimchiPremiumRate')}
                </div>
              </th>

              {/* 4. 전일대비 */}
              <th 
                onClick={() => onSort('upbitChangeRate')}
                className="py-2.5 sm:py-3 px-1 sm:px-2 md:px-2.5 text-right cursor-pointer hover:text-slate-200 transition-colors w-[17%] sm:w-[15%] md:w-[13%]"
              >
                <div className="flex items-center justify-end group">
                  <span>전일대비</span>
                  {renderSortIndicator('upbitChangeRate')}
                </div>
              </th>

              {/* 5. 고가대비(52주) - Desktop only */}
              <th 
                onClick={() => onSort('high52wDiffRate')}
                className="hidden md:table-cell py-3 px-3 text-right cursor-pointer hover:text-slate-200 transition-colors w-[12%]"
              >
                <div className="flex items-center justify-end group">
                  <span>고가대비(52주)</span>
                  {renderSortIndicator('high52wDiffRate')}
                </div>
              </th>

              {/* 6. 저가대비(52주) - Desktop only */}
              <th 
                onClick={() => onSort('low52wDiffRate')}
                className="hidden md:table-cell py-3 px-3 text-right cursor-pointer hover:text-slate-200 transition-colors w-[12%]"
              >
                <div className="flex items-center justify-end group">
                  <span>저가대비(52주)</span>
                  {renderSortIndicator('low52wDiffRate')}
                </div>
              </th>

              {/* 7. 거래액(일) */}
              <th 
                onClick={() => onSort('upbitVolume24h')}
                className="py-2.5 sm:py-3 px-1.5 sm:px-2 md:px-3 text-right cursor-pointer hover:text-slate-200 transition-colors w-[17%] sm:w-[16%] md:w-[16%]"
              >
                <div className="flex items-center justify-end group">
                  <span>거래액(일)</span>
                  {renderSortIndicator('upbitVolume24h')}
                </div>
              </th>

            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60 text-xs font-mono-numbers">
            {filteredCoins.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Search className="w-8 h-8 text-slate-600" />
                    <p className="text-sm font-medium text-slate-400">조건에 일치하는 코인이 없습니다</p>
                    <p className="text-xs text-slate-600">검색어를 변경하거나 필터를 해제해 보세요.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredCoins.map((coin) => {
                const isFavorite = favorites.includes(coin.symbol);
                const flashClass = 
                  coin.flashState === 'up' 
                    ? (colorTheme === 'kr' ? 'flash-up' : 'flash-green') 
                    : coin.flashState === 'down' 
                    ? 'flash-down' 
                    : '';

                // Calculate Binance KRW volume matching screenshot
                const binanceKrwVolume = coin.binancePrice > 0 && coin.binanceKrwPrice
                  ? coin.binanceVolume24h * (coin.binanceKrwPrice / coin.binancePrice)
                  : (coin.binanceVolume24h || 0) * 1442.5;

                return (
                  <tr
                    key={coin.symbol}
                    onClick={() => onSelectCoin(coin)}
                    className={`hover:bg-[#151c27] transition-colors cursor-pointer group ${flashClass}`}
                  >
                    
                    {/* 1. 코인이름: 1행(아이콘 + 한글명), 2행(별 + 심볼(BTC) + 미니차트/지갑) */}
                    <td className="py-2 sm:py-2.5 px-1.5 sm:px-2 md:px-3 font-sans truncate">
                      <div className="flex flex-col min-w-0">
                        {/* 1행: 코인 아이콘 + 한글명 (예: 🟠 비트코인) */}
                        <div className="flex items-center space-x-1 sm:space-x-1.5 min-w-0">
                          <img 
                            src={`https://static.upbit.com/logos/${coin.symbol}.png`}
                            alt={coin.symbol}
                            className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full shrink-0 object-contain"
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                          />
                          <span className="font-bold text-slate-100 group-hover:text-indigo-300 transition-colors truncate text-[11px] sm:text-xs">
                            {coin.nameKo}
                          </span>
                        </div>

                        {/* 2행: 즐겨찾기(별) + 심볼(BTC) + 미니 차트/지갑 아이콘 */}
                        <div className="flex items-center space-x-1 text-[10px] text-slate-400 mt-0.5 min-w-0">
                          <button
                            onClick={(e) => onToggleFavorite(coin.symbol, e)}
                            className="p-0.5 -ml-0.5 rounded text-slate-600 hover:text-amber-400 transition-colors focus:outline-none shrink-0"
                            title={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                          >
                            <Star 
                              className={`w-3 h-3 ${
                                isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-600 hover:text-slate-400'
                              }`} 
                            />
                          </button>
                          <span className="font-semibold text-slate-400 truncate">
                            {coin.symbol}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 2. 현재가: 1행(업비트 현재가), 2행(해외 환산가) */}
                    <td className="py-2 sm:py-2.5 px-1.5 sm:px-2 md:px-3 text-right">
                      <div className="flex flex-col items-end">
                        {/* 1행: 업비트 현재가 */}
                        <div className="font-bold text-slate-100 text-[11px] sm:text-xs">
                          {coin.hasUpbitData && coin.upbitPrice > 0 ? (
                            formatKrw(coin.upbitPrice)
                          ) : (
                            <span className="text-slate-500 font-normal">-</span>
                          )}
                        </div>
                        {/* 2행: 해외 환산가 */}
                        <div className="text-[10px] sm:text-[11px] text-slate-400">
                          {coin.hasBinanceData && coin.binancePrice > 0 && coin.binanceKrwPrice > 0 ? (
                            <span>{formatKrw(coin.binanceKrwPrice)}</span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 3. 김프: 1행(김프 %), 2행(차액) */}
                    <td className="py-2 sm:py-2.5 px-1 sm:px-2 md:px-2.5 text-right">
                      <div className="flex flex-col items-end">
                        {coin.hasUpbitData && coin.hasBinanceData && coin.binancePrice > 0 ? (
                          <>
                            {/* 1행: 김프 % */}
                            <div className={`font-bold text-[11px] sm:text-xs ${getKimchiColor(coin.kimchiPremiumRate, colorTheme)}`}>
                              {formatPercent(coin.kimchiPremiumRate)}
                            </div>
                            {/* 2행: 차액 */}
                            <div className={`text-[10px] sm:text-[11px] ${getKimchiColor(coin.kimchiPremiumRate, colorTheme)} opacity-90`}>
                              {formatKrw(coin.kimchiDiffPrice)}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-slate-500 text-xs">-</div>
                            <div className="text-slate-500 text-[10px] sm:text-[11px]">-</div>
                          </>
                        )}
                      </div>
                    </td>

                    {/* 4. 전일대비: 1행(등락률 %), 2행(변동금액) */}
                    <td className="py-2 sm:py-2.5 px-1 sm:px-2 md:px-2.5 text-right">
                      <div className="flex flex-col items-end">
                        {coin.hasUpbitData ? (
                          <>
                            {/* 1행: 등락률 % */}
                            <div className={`font-bold text-[11px] sm:text-xs ${getPriceChangeColor(coin.upbitChangeRate, colorTheme)}`}>
                              {formatPercent(coin.upbitChangeRate)}
                            </div>
                            {/* 2행: 변동금액 */}
                            <div className={`text-[10px] sm:text-[11px] ${getPriceChangeColor(coin.upbitChangeRate, colorTheme)} opacity-90`}>
                              {coin.upbitChangePrice > 0 ? '+' : ''}{formatKrw(coin.upbitChangePrice)}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-slate-500 text-xs">-</div>
                            <div className="text-slate-500 text-[10px] sm:text-[11px]">-</div>
                          </>
                        )}
                      </div>
                    </td>

                    {/* 5. 고가대비(52주) - Desktop only */}
                    <td className="hidden md:table-cell py-2.5 px-3 text-right">
                      <div className="flex flex-col items-end">
                        {coin.hasUpbitData && coin.high52wPrice > 0 ? (
                          <>
                            <div className="text-slate-300 font-medium">
                              {formatPercent(coin.high52wDiffRate)}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {formatKrw(coin.high52wPrice)}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-slate-500 text-xs">-</div>
                            <div className="text-slate-500 text-[11px]">-</div>
                          </>
                        )}
                      </div>
                    </td>

                    {/* 6. 저가대비(52주) - Desktop only */}
                    <td className="hidden md:table-cell py-2.5 px-3 text-right">
                      <div className="flex flex-col items-end">
                        {coin.hasUpbitData && coin.low52wPrice > 0 ? (
                          <>
                            <div className="text-slate-300 font-medium">
                              {formatPercent(coin.low52wDiffRate)}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {formatKrw(coin.low52wPrice)}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-slate-500 text-xs">-</div>
                            <div className="text-slate-500 text-[11px]">-</div>
                          </>
                        )}
                      </div>
                    </td>

                    {/* 7. 거래액(일): 1행(업비트 일거래액), 2행(해외 일거래액 환산) */}
                    <td className="py-2 sm:py-2.5 px-1.5 sm:px-2 md:px-3 text-right">
                      <div className="flex flex-col items-end">
                        {/* 1행: 업비트 일 거래대금 */}
                        <div className="font-bold text-slate-200 text-[11px] sm:text-xs">
                          {coin.hasUpbitData && coin.upbitVolume24h > 0 ? (
                            formatTradeVolume(coin.upbitVolume24h)
                          ) : (
                            <span className="text-slate-500 font-normal">-</span>
                          )}
                        </div>
                        {/* 2행: 바이낸스 일 거래대금 (원화 환산) */}
                        <div className="text-[10px] sm:text-[11px] text-slate-400">
                          {coin.hasBinanceData && coin.binancePrice > 0 && binanceKrwVolume > 0 ? (
                            formatTradeVolume(binanceKrwVolume)
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </div>
                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer info */}
      <div className="mt-2.5 flex flex-wrap items-center justify-between text-xs text-slate-400 px-1">
        <div>
          총 <span className="font-bold text-slate-300">{filteredCoins.length}</span>개 종목 표시 중 · 행을 클릭하면 상세 차트와 김프 분석이 열립니다
        </div>
        <div className="flex items-center space-x-3">
          <span>업비트 KRW 마켓</span>
          <span>·</span>
          <span>바이낸스 USDT 마켓</span>
        </div>
      </div>
    </div>
  );
};
