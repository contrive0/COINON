import React, { useState } from 'react';
import { Download, Smartphone, X, Share } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, installApp } = usePWAInstall();
  const [showIosGuide, setShowIosGuide] = useState<boolean>(false);

  // If already installed as standalone PWA, don't show the install button
  if (isInstalled) {
    return null;
  }

  // If not installable and not iOS, don't clutter the header
  if (!isInstallable && !isIOS) {
    return null;
  }

  const handleInstallClick = async () => {
    const outcome = await installApp();
    if (outcome === 'ios') {
      setShowIosGuide(true);
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="px-2.5 py-1.5 rounded-md bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-indigo-600/30 transition-all border border-indigo-500/40"
        title="홈 화면에 추가하여 독립 앱(PWA)으로 사용하기"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden xs:inline">앱 설치</span>
      </button>

      {/* iOS Safari Home Screen Guide Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#141a24] border border-slate-700 rounded-2xl p-5 max-w-sm w-full text-slate-200 shadow-2xl relative">
            <button
              onClick={() => setShowIosGuide(false)}
              className="absolute top-3.5 right-3.5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">홈 화면에 코인온 추가</h4>
                <p className="text-xs text-slate-400">상단 주소창 없이 앱처럼 사용하기</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300 py-2">
              <div className="flex items-start gap-2.5 bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60">
                <div className="p-1 bg-indigo-500/20 text-indigo-300 rounded font-bold">1</div>
                <div>
                  사파리(Safari) 하단 메뉴의 <strong className="text-indigo-300">공유 버튼</strong>
                  <span className="inline-flex items-center mx-1 text-indigo-400"><Share className="w-3.5 h-3.5" /></span>을 누릅니다.
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60">
                <div className="p-1 bg-indigo-500/20 text-indigo-300 rounded font-bold">2</div>
                <div>
                  메뉴를 아래로 스크롤하여 <strong className="text-emerald-400">‘홈 화면에 추가’</strong>를 선택합니다.
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60">
                <div className="p-1 bg-indigo-500/20 text-indigo-300 rounded font-bold">3</div>
                <div>
                  우측 상단의 <strong className="text-white">‘추가’</strong>를 누르면 홈 화면에 바로 가기 앱 아이콘이 생성됩니다.
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIosGuide(false)}
              className="mt-4 w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors"
            >
              확인했습니다
            </button>
          </div>
        </div>
      )}
    </>
  );
};
