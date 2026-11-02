import React, { useState } from 'react';
import { X, DollarSign, Palette, Clock, Bell, RotateCcw, Check } from 'lucide-react';
import { ColorTheme, ExchangeRateInfo } from '../types/crypto';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  exchangeRate: ExchangeRateInfo;
  onUpdateExchangeRate: (rate: number, isManual: boolean) => void;
  colorTheme: ColorTheme;
  onChangeColorTheme: (theme: ColorTheme) => void;
  refreshInterval: number; // in seconds
  onChangeRefreshInterval: (interval: number) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  highAlertThreshold: number;
  onUpdateHighThreshold: (val: number) => void;
  lowAlertThreshold: number;
  onUpdateLowThreshold: (val: number) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  exchangeRate,
  onUpdateExchangeRate,
  colorTheme,
  onChangeColorTheme,
  refreshInterval,
  onChangeRefreshInterval,
  soundEnabled,
  onToggleSound,
  highAlertThreshold,
  onUpdateHighThreshold,
  lowAlertThreshold,
  onUpdateLowThreshold,
}) => {
  const [customRate, setCustomRate] = useState<string>(exchangeRate.rate.toString());
  const [isManual, setIsManual] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSaveRate = () => {
    const parsed = parseFloat(customRate);
    if (!isNaN(parsed) && parsed > 500 && parsed < 3000) {
      onUpdateExchangeRate(parsed, isManual);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-[#0f141d] border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#141a24]">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>대시보드 환경설정</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6 text-xs text-slate-200 max-h-[75vh] overflow-y-auto">
          
          {/* 1. Exchange Rate Settings */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                USD/KRW 기준 환율 설정
              </span>
              <span className="text-[11px] text-slate-400">현재: ₩{exchangeRate.rate.toLocaleString()}</span>
            </div>

            <div className="space-y-2 bg-[#131822] p-3 rounded-lg border border-slate-800">
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={customRate}
                  onChange={(e) => {
                    setCustomRate(e.target.value);
                    setIsManual(true);
                  }}
                  step="0.1"
                  className="bg-[#0b0e14] border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono-numbers text-xs w-full focus:outline-none focus:border-indigo-500"
                  placeholder="환율 입력 (예: 1442.5)"
                />
                <button
                  onClick={handleSaveRate}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium whitespace-nowrap transition-colors"
                >
                  적용
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>데이터 소스: {exchangeRate.source}</span>
                <button
                  onClick={() => {
                    setIsManual(false);
                    onUpdateExchangeRate(1442.5, false);
                    setCustomRate('1442.5');
                  }}
                  className="text-indigo-400 hover:underline"
                >
                  실시간 자동수신 복원
                </button>
              </div>
            </div>
          </div>

          {/* 2. Color Scheme Setting */}
          <div>
            <div className="font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-indigo-400" />
              등락 색상 테마
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onChangeColorTheme('kr')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  colorTheme === 'kr'
                    ? 'bg-indigo-600/15 border-indigo-500/50 shadow-sm'
                    : 'bg-[#131822] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white">한국 거래소 표준</span>
                  {colorTheme === 'kr' && <Check className="w-4 h-4 text-indigo-400" />}
                </div>
                <div className="flex items-center space-x-2 text-[11px]">
                  <span className="text-rose-500 font-semibold">▲ 상승 (빨강)</span>
                  <span className="text-blue-400 font-semibold">▼ 하락 (파랑)</span>
                </div>
              </button>

              <button
                onClick={() => onChangeColorTheme('global')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  colorTheme === 'global'
                    ? 'bg-indigo-600/15 border-indigo-500/50 shadow-sm'
                    : 'bg-[#131822] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white">글로벌 표준</span>
                  {colorTheme === 'global' && <Check className="w-4 h-4 text-indigo-400" />}
                </div>
                <div className="flex items-center space-x-2 text-[11px]">
                  <span className="text-emerald-400 font-semibold">▲ 상승 (초록)</span>
                  <span className="text-rose-500 font-semibold">▼ 하락 (빨강)</span>
                </div>
              </button>
            </div>
          </div>

          {/* 3. Auto Refresh Interval */}
          <div>
            <div className="font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              실시간 자동 갱신 주기
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 5].map((sec) => (
                <button
                  key={sec}
                  onClick={() => onChangeRefreshInterval(sec)}
                  className={`py-2 rounded-lg border text-center font-mono-numbers font-medium transition-all ${
                    refreshInterval === sec
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                      : 'bg-[#131822] text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {sec}초 간격
                </button>
              ))}
            </div>
          </div>

          {/* 4. Sound & Alert Thresholds */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-purple-400" />
                김프 알림음 및 임계치
              </span>
              <button
                onClick={onToggleSound}
                className={`px-2.5 py-1 rounded text-[11px] font-medium border ${
                  soundEnabled
                    ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {soundEnabled ? '사운드 켜짐' : '사운드 꺼짐'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-[#131822] p-3 rounded-lg border border-slate-800 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">고김프 알림 기준 (%)</label>
                <input
                  type="number"
                  value={highAlertThreshold}
                  onChange={(e) => onUpdateHighThreshold(parseFloat(e.target.value) || 5)}
                  className="bg-[#0b0e14] border border-slate-700 rounded px-2.5 py-1 text-white w-full font-mono-numbers"
                  step="0.5"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">역프 알림 기준 (%)</label>
                <input
                  type="number"
                  value={lowAlertThreshold}
                  onChange={(e) => onUpdateLowThreshold(parseFloat(e.target.value) || 0)}
                  className="bg-[#0b0e14] border border-slate-700 rounded px-2.5 py-1 text-white w-full font-mono-numbers"
                  step="0.5"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-[#141a24] flex items-center justify-between">
          <span className="text-[11px] text-slate-500">설정은 브라우저에 자동 저장됩니다</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
          >
            완료
          </button>
        </div>

      </div>
    </div>
  );
};
