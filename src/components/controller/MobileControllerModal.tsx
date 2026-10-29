import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { controllerSync } from '../../services/controllerSyncService';
import { 
  Smartphone, 
  ChevronRight, 
  ChevronLeft, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  Type, 
  Gauge, 
  Copy, 
  Check, 
  Radio,
  ExternalLink
} from 'lucide-react';

interface MobileControllerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pairingCode: string;
}

export const MobileControllerModal: React.FC<MobileControllerModalProps> = ({
  isOpen,
  onClose,
  pairingCode
}) => {
  const [copied, setCopied] = useState(false);
  const [lastAction, setLastAction] = useState<string>('');

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href.split('?')[0] : '';
  const controllerUrl = `${currentUrl}?mode=controller&code=${pairingCode}`;

  const triggerAction = (type: any, label: string) => {
    controllerSync.sendAction(type);
    setLastAction(`تم إرسال: ${label}`);
    setTimeout(() => setLastAction(''), 1500);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(controllerUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-studio-950/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl border border-studio-200 shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-studio-100 flex items-center justify-between bg-studio-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-studio-900">ريموت الموبايل والتحكم عن بعد</h3>
              <p className="text-xs text-studio-500">تحكم بتقديم الجمل من هاتفك أو أي شاشة ثانية دون لمس الكمبيوتر</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-studio-400 hover:text-studio-700 rounded-xl hover:bg-studio-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* QR Code & Pairing Section */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-studio-50 rounded-2xl border border-studio-200/80">
            <div className="p-2.5 bg-white rounded-xl shadow-xs border border-studio-200">
              <QRCodeSVG value={controllerUrl} size={110} />
            </div>

            <div className="flex-1 text-center sm:text-right space-y-2">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold text-studio-700">كود الاقتران النشط:</span>
                <span className="font-mono font-black text-xs bg-studio-200 text-studio-800 px-2 py-0.5 rounded">
                  {pairingCode}
                </span>
              </div>
              <p className="text-xs text-studio-500 leading-relaxed">
                امسح الرمز بكاميرا الموبايل لفتح الريموت مباشرة، أو انسخ الرابط وافتحه في أي متصفح.
              </p>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={copyLink}
                  className="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold bg-white hover:bg-studio-100 text-studio-700 border border-studio-200 flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'تم النسخ!' : 'نسخ الرابط'}</span>
                </button>

                <a
                  href={controllerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="py-1.5 px-3 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>فتح الريموت هنا</span>
                </a>
              </div>
            </div>
          </div>

          {/* Test Live Controller Pad */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-studio-800 flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-blue-600" />
                لوحة التجربة السريعة (اختبار إشارات التحكم)
              </h4>
              {lastAction && (
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full animate-fade-in">
                  {lastAction}
                </span>
              )}
            </div>

            {/* Giant tactile buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => triggerAction('PREV', 'الجملة السابقة')}
                className="py-4 px-4 rounded-2xl bg-studio-100 hover:bg-studio-200 text-studio-800 font-extrabold text-sm flex items-center justify-center gap-2 border border-studio-200 transition-all active:scale-95 shadow-xs"
              >
                <ChevronRight className="w-5 h-5" />
                <span>السابق</span>
              </button>

              <button
                onClick={() => triggerAction('NEXT', 'الجملة التالية')}
                className="py-4 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-600/30 transition-all active:scale-95"
              >
                <span>التالي</span>
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>

            {/* Secondary actions */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                onClick={() => triggerAction('TOGGLE_PLAY', 'تشغيل / إيقاف التقديم الزمني')}
                className="py-2.5 px-2 rounded-xl bg-studio-50 hover:bg-studio-100 text-studio-700 font-bold text-xs flex items-center justify-center gap-1.5 border border-studio-200"
              >
                <Play className="w-3.5 h-3.5" />
                <span>تقديم زمني</span>
              </button>

              <button
                onClick={() => triggerAction('FONT_LARGER', 'تكبير الخط')}
                className="py-2.5 px-2 rounded-xl bg-studio-50 hover:bg-studio-100 text-studio-700 font-bold text-xs flex items-center justify-center gap-1.5 border border-studio-200"
              >
                <Type className="w-3.5 h-3.5" />
                <span>خط +</span>
              </button>

              <button
                onClick={() => triggerAction('FIRST', 'رجوع للبداية')}
                className="py-2.5 px-2 rounded-xl bg-studio-50 hover:bg-studio-100 text-studio-700 font-bold text-xs flex items-center justify-center gap-1.5 border border-studio-200"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>الأول</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-studio-100 bg-studio-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-studio-800 hover:bg-studio-900 text-white shadow-xs"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
