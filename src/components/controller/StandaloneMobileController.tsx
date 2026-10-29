import React, { useState } from 'react';
import { controllerSync } from '../../services/controllerSyncService';
import { ControllerActionType } from '../../types';
import { 
  ChevronRight, 
  ChevronLeft, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  Type, 
  Radio, 
  Smartphone,
  Gauge,
  ArrowRight
} from 'lucide-react';

interface StandaloneMobileControllerProps {
  pairingCode: string;
  onExitToMainApp: () => void;
}

export const StandaloneMobileController: React.FC<StandaloneMobileControllerProps> = ({
  pairingCode,
  onExitToMainApp
}) => {
  const [lastAction, setLastAction] = useState<string>('جاهز للتحكم');

  const send = (action: ControllerActionType, label: string) => {
    // Haptic feedback
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(35);
    }
    controllerSync.sendAction(action);
    setLastAction(label);
  };

  return (
    <div className="min-h-screen bg-studio-900 text-white flex flex-col justify-between p-4 max-w-md mx-auto select-none">
      
      {/* Top Header */}
      <div className="flex items-center justify-between py-2 border-b border-studio-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xs font-black tracking-wide">ريموت الأستوديو المحمول</h2>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>كود: {pairingCode}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onExitToMainApp}
          className="text-xs text-studio-400 hover:text-white flex items-center gap-1 py-1 px-2 rounded-lg bg-studio-800"
        >
          <span>شاشة التلقين</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Status Card */}
      <div className="my-3 p-3 rounded-2xl bg-studio-800/80 border border-studio-700/60 text-center">
        <span className="text-[10px] text-studio-400 font-bold block mb-0.5">آخر أمر تم إرساله:</span>
        <strong className="text-sm font-extrabold text-blue-400">{lastAction}</strong>
      </div>

      {/* Giant Mobile Touch Pad */}
      <div className="flex-1 flex flex-col justify-center gap-4 my-2">
        {/* Next Button (Huge, Primary) */}
        <button
          onClick={() => send('NEXT', 'الجملة التالية ⏩')}
          className="flex-1 min-h-[160px] rounded-3xl bg-blue-600 active:bg-blue-700 active:scale-[0.98] text-white flex flex-col items-center justify-center gap-3 shadow-xl shadow-blue-600/30 transition-transform"
        >
          <ChevronLeft className="w-12 h-12" />
          <span className="text-2xl font-black tracking-wide">الجملة التالية</span>
          <span className="text-xs text-blue-200">اضغط هنا للانتقال للجملة القادمة</span>
        </button>

        {/* Previous Button */}
        <button
          onClick={() => send('PREV', 'الجملة السابقة ⏪')}
          className="min-h-[100px] rounded-3xl bg-studio-800 active:bg-studio-700 active:scale-[0.98] text-white flex items-center justify-center gap-3 border border-studio-700 transition-transform shadow-lg"
        >
          <ChevronRight className="w-8 h-8" />
          <span className="text-lg font-bold">الجملة السابقة</span>
        </button>
      </div>

      {/* Secondary Fast Tools */}
      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-studio-800">
        <button
          onClick={() => send('TOGGLE_PLAY', 'تشغيل / إيقاف التقديم الزمني')}
          className="py-3 px-1 rounded-2xl bg-studio-800 active:bg-studio-700 text-center flex flex-col items-center justify-center gap-1 text-[11px] font-bold text-studio-200"
        >
          <Play className="w-4 h-4 text-amber-400" />
          <span>توقيت</span>
        </button>

        <button
          onClick={() => send('TOGGLE_AUDIO_DICTATION', 'تفعيل / إيقاف الإملاء في السماعة')}
          className="py-3 px-1 rounded-2xl bg-studio-800 active:bg-studio-700 text-center flex flex-col items-center justify-center gap-1 text-[11px] font-bold text-studio-200"
        >
          <Volume2 className="w-4 h-4 text-emerald-400" />
          <span>سماعة</span>
        </button>

        <button
          onClick={() => send('FONT_LARGER', 'تكبير حجم الخط')}
          className="py-3 px-1 rounded-2xl bg-studio-800 active:bg-studio-700 text-center flex flex-col items-center justify-center gap-1 text-[11px] font-bold text-studio-200"
        >
          <Type className="w-4 h-4 text-blue-400" />
          <span>خط +</span>
        </button>

        <button
          onClick={() => send('FIRST', 'إعادة السكريبت للأول')}
          className="py-3 px-1 rounded-2xl bg-studio-800 active:bg-studio-700 text-center flex flex-col items-center justify-center gap-1 text-[11px] font-bold text-studio-200"
        >
          <RotateCcw className="w-4 h-4 text-rose-400" />
          <span>الأول</span>
        </button>
      </div>

    </div>
  );
};
