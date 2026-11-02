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
      result = result.filter((c) => c.kimchiPremiumRate > 0);
    } else if (categoryFilter === 'negative') {
      result = result.filter((c) => c.kimchiPremiumRate < 0);
    } else if (categoryFilter === 'high-volume') {
      result = result.filter((c) => c.upbitVolume24h >= 100000000000); // 1,000억원 이상
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
          valA = a.upbitPrice;
          valB = b.upbitPrice;
          break;
        case 'kimchiPremiumRate':
          valA = a.kimchiPremiumRate;
          valB = b.kimchiPremiumRate;
          break;
        case 'upbitChangeRate':
          valA = a.upbitChangeRate;
          valB = b.upbitChangeRate;
          break;
        case 'high52wDiffRate':
          valA = a.high52wDiffRate;
          valB = b.high52wDiffRate;
          break;
        case 'low52wDiffRate':
          valA = a.low52wDiffRate;
          valB = b.low52wDiffRate;
          break;
        case 'upbitVolume24h':
          valA = a.upbitVolume24h;
          valB = b.upbitVolume24h;
          break;
        default:
          valA = a.kimchiPremiumRate;
          valB = b.kimchiPremiumRate;
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
      {/* Search and Category Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => onFilterChange('all')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              categoryFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-[#141a24] text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            전체 ({coins.length})
          </button>

          <button
            onClick={() => onFilterChange('favorites')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1 transition-colors ${
              categoryFilter === 'favorites'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-[#141a24] text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${favorites.length > 0 ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span>즐겨찾기 ({favorites.length})</span>
          </button>

          <button
            onClick={() => onFilterChange('major')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              categoryFilter === 'major'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-[#141a24] text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            메이저 코인
          </button>

          <button
            onClick={() => onFilterChange('positive')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1 transition-colors ${
              categoryFilter === 'positive'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'bg-[#141a24] text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Flame className="w-3 h-3 text-rose-400" />
            <span>김프 양수</span>
          </button>

          <button
            onClick={() => onFilterChange('negative')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1 transition-colors ${
              categoryFilter === 'negative'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                : 'bg-[#141a24] text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <TrendingDown className="w-3 h-3 text-blue-400" />
            <span>역프 (할인)</span>
          </button>

          <button
            onClick={() => onFilterChange('high-volume')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              categoryFilter === 'high-volume'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-[#141a24] text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            거래대금 1천억↑
          </button>
        </div>

        {/* Search Input Box */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="코인명 / 심볼 검색 (예: BTC, 비트)"
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
      <div className="overflow-x-auto rounded-xl border border-slate-800/90 bg-[#0f141d] shadow-2xl">
        <table className="w-full text-left border-collapse min-w-[880px]">
          <thead>
            <tr className="bg-[#141a24]/90 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider select-none">
              
              {/* 1. 코인이름 */}
              <th 
                onClick={() => onSort('symbol')}
                className="py-3 px-3.5 cursor-pointer hover:text-slate-200 transition-colors w-[18%] sticky left-0 z-10 bg-[#141a24]"
              >
                <div className="flex items-center group">
                  <span>코인이름</span>
                  {renderSortIndicator('symbol')}
                </div>
              </th>

              {/* 2. 현재가 */}
              <th 
                onClick={() => onSort('upbitPrice')}
                className="py-3 px-3 text-right cursor-pointer hover:text-slate-200 transition-colors w-[15%]"
              >
                <div className="flex items-center justify-end group">
                  <span>현재가 (업비트 / 바이낸스)</span>
                  {renderSortIndicator('upbitPrice')}
                </div>
              </th>

              {/* 3. 김프 */}
              <th 
                onClick={() => onSort('kimchiPremiumRate')}
                className="py-3 px-3 text-right cursor-pointer hover:text-slate-200 transition-colors w-[13%]"
              >
                <div className="flex items-center justify-end group">
                  <span>김프 (비율 / 차액)</span>
                  {renderSortIndicator('kimchiPremiumRate')}
                </div>
              </th>

              {/* 4. 전일대비 */}
              <th 
                onClick={() => onSort('upbitChangeRate')}
                className="py-3 px-3 text-right cursor-pointer hover:text-slate-200 transition-colors w-[13%]"
              >
                <div className="flex items-center justify-end group">
                  <span>전일대비</span>
                  {renderSortIndicator('upbitChangeRate')}
                </div>
              </th>

              {/* 5. 고가대비(52주) */}
              <th 
                onClick={() => onSort('high52wDiffRate')}
                className="py-3 px-3 text-right cursor-pointer hover:text-slate-200 transition-colors w-[13%]"
              >
                <div className="flex items-center justify-end group">
                  <span>고가대비 (52주)</span>
                  {renderSortIndicator('high52wDiffRate')}
                </div>
              </th>

              {/* 6. 저가대비(52주) */}
              <th 
                onClick={() => onSort('low52wDiffRate')}
                className="py-3 px-3 text-right cursor-pointer hover:text-slate-200 transition-colors w-[13%]"
              >
                <div className="flex items-center justify-end group">
                  <span>저가대비 (52주)</span>
                  {renderSortIndicator('low52wDiffRate')}
                </div>
              </th>

              {/* 7. 거래액(일) */}
              <th 
                onClick={() => onSort('upbitVolume24h')}
                className="py-3 px-3.5 text-right cursor-pointer hover:text-slate-200 transition-colors w-[15%]"
              >
                <div className="flex items-center justify-end group">
                  <span>거래액(24H)</span>
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
              filteredCoins.map((coin, index) => {
                const isFavorite = favorites.includes(coin.symbol);
                const flashClass = 
                  coin.flashState === 'up' 
                    ? (colorTheme === 'kr' ? 'flash-up' : 'flash-green') 
                    : coin.flashState === 'down' 
                    ? 'flash-down' 
                    : '';

                return (
                  <tr
                    key={coin.symbol}
                    onClick={() => onSelectCoin(coin)}
                    className={`hover:bg-[#151c27] transition-colors cursor-pointer group ${flashClass}`}
                  >
                    
                    {/* 1. 코인이름 (Sticky left column) */}
                    <td className="py-2.5 px-3.5 font-sans sticky left-0 z-10 bg-[#0f141d] group-hover:bg-[#151c27] transition-colors border-r border-slate-800/40">
                      <div className="flex items-center space-x-2.5">
                        <button
                          onClick={(e) => onToggleFavorite(coin.symbol, e)}
                          className="p-1 rounded text-slate-600 hover:text-amber-400 transition-colors focus:outline-none"
                          title={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                        >
                          <Star 
                            className={`w-3.5 h-3.5 ${
                              isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-600 hover:text-slate-400'
                            }`} 
                          />
                        </button>

                        <div className="flex flex-col min-w-0">
                          {/* Row 1: Korean Name & Symbol */}
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-slate-100 group-hover:text-indigo-300 transition-colors truncate">
                              {coin.nameKo}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-400">
                              {coin.symbol}
                            </span>
                          </div>
                          {/* Row 2: English Name */}
                          <div className="text-[10px] text-slate-400 truncate">
                            {coin.nameEn}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 2. 현재가 (2-Row: Upbit KRW / Binance USD) */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex flex-col items-end">
                        {/* Row 1: Upbit Price */}
                        <div className="font-bold text-slate-100">
                          ₩{formatKrw(coin.upbitPrice)}
                        </div>
                        {/* Row 2: Binance USD Price & Converted KRW */}
                        <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                          <span>{formatUsd(coin.binancePrice)}</span>
                          <span className="text-slate-400">·</span>
                          <span>₩{formatKrw(coin.binanceKrwPrice)}</span>
                        </div>
                      </div>
                    </td>

                    {/* 3. 김프 (2-Row: Kimp % / Diff KRW) */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex flex-col items-end">
                        {/* Row 1: Kimp % */}
                        <div className={`font-bold text-sm ${getKimchiColor(coin.kimchiPremiumRate, colorTheme)}`}>
                          {formatPercent(coin.kimchiPremiumRate)}
                        </div>
                        {/* Row 2: Kimp Diff KRW */}
                        <div className={`text-[11px] ${getKimchiColor(coin.kimchiPremiumRate, colorTheme)} opacity-90`}>
                          {coin.kimchiDiffPrice > 0 ? '+' : ''}₩{formatKrw(coin.kimchiDiffPrice)}
                        </div>
                      </div>
                    </td>

                    {/* 4. 전일대비 (2-Row: Change % / Change KRW) */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex flex-col items-end">
                        {/* Row 1: Change % */}
                        <div className={`font-bold ${getPriceChangeColor(coin.upbitChangeRate, colorTheme)}`}>
                          {formatPercent(coin.upbitChangeRate)}
                        </div>
                        {/* Row 2: Change KRW */}
                        <div className={`text-[11px] ${getPriceChangeColor(coin.upbitChangeRate, colorTheme)} opacity-90`}>
                          {coin.upbitChangePrice > 0 ? '+' : ''}₩{formatKrw(coin.upbitChangePrice)}
                        </div>
                      </div>
                    </td>

                    {/* 5. 고가대비(52주) (2-Row: High Diff % / 52w High Price) */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex flex-col items-end">
                        {/* Row 1: High Diff % */}
                        <div className="text-slate-300 font-medium">
                          {formatPercent(coin.high52wDiffRate)}
                        </div>
                        {/* Row 2: 52w High Price */}
                        <div className="text-[11px] text-slate-400">
                          ₩{formatKrw(coin.high52wPrice)}
                        </div>
                      </div>
                    </td>

                    {/* 6. 저가대비(52주) (2-Row: Low Diff % / 52w Low Price) */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex flex-col items-end">
                        {/* Row 1: Low Diff % */}
                        <div className="text-slate-300 font-medium">
                          {formatPercent(coin.low52wDiffRate)}
                        </div>
                        {/* Row 2: 52w Low Price */}
                        <div className="text-[11px] text-slate-400">
                          ₩{formatKrw(coin.low52wPrice)}
                        </div>
                      </div>
                    </td>

                    {/* 7. 거래액(일) (2-Row: Upbit Vol / Binance Vol) */}
                    <td className="py-2.5 px-3.5 text-right">
                      <div className="flex flex-col items-end">
                        {/* Row 1: Upbit KRW Volume */}
                        <div className="font-bold text-slate-200">
                          {formatTradeVolume(coin.upbitVolume24h)}
                        </div>
                        {/* Row 2: Binance USD Volume */}
                        <div className="text-[11px] text-slate-400">
                          {formatUsdVolume(coin.binanceVolume24h)}
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
