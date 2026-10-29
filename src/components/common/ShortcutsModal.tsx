import React from 'react';
import { Keyboard, Radio, CheckCircle2 } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'المسافة (Space)', desc: 'الانتقال للجملة التالية فوراً', badge: 'Next' },
    { key: 'السهم الأيمن (→)', desc: 'الانتقال للجملة التالية', badge: 'Next' },
    { key: 'السهم الأيسر (←)', desc: 'الرجوع للجملة السابقة', badge: 'Prev' },
    { key: 'زر Page Down / Up', desc: 'متوافق تلقائياً مع ريموتات البلوتوث والـ Clicker', badge: 'Clicker' },
    { key: 'حرف P', desc: 'تشغيل أو إيقاف التقديم الزمني التلقائي', badge: 'Timer' },
    { key: 'حرف R', desc: 'إعادة السكريبت من الجملة الأولى (Reset)', badge: 'Restart' },
    { key: 'حرف F', desc: 'تفعيل أو إلغاء ملء الشاشة (Fullscreen)', badge: 'View' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-studio-950/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl border border-studio-200 shadow-2xl overflow-hidden animate-slide-up flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-studio-100 flex items-center justify-between bg-studio-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shadow-xs">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-studio-900">اختصارات الكيبورد والريموت</h3>
              <p className="text-xs text-studio-500">تحكم كامل دون لمس الماوس أثناء التسجيل</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-studio-400 hover:text-studio-700 rounded-xl hover:bg-studio-100"
          >
            ✕
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="p-5 space-y-2.5 overflow-y-auto">
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl bg-studio-50 border border-studio-200/70 text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-studio-800">{s.desc}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded bg-white border border-studio-200 font-mono font-bold text-studio-700 shadow-xs">
                  {s.key}
                </span>
              </div>
            </div>
          ))}

          {/* Bluetooth Note */}
          <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-900">
            <Radio className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <strong className="block font-bold">جاهز لأي ريموت لاسلكي (Bluetooth Clicker):</strong>
              <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                أي جهاز تحكم لاسلكي أو قلم ليزر بريزنتيشن يرسل إشارات PageUp / PageDown سيعمل تلقائياً معك بدون أي تعريفات إضافية!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-studio-100 bg-studio-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-studio-800 hover:bg-studio-900 text-white shadow-xs"
          >
            فهمت، شكراً
          </button>
        </div>

      </div>
    </div>
  );
};
