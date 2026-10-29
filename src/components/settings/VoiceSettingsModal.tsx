import React, { useState } from 'react';
import { PrompterSettings } from '../../types';
import { audioSpeech } from '../../services/audioSpeechService';
import { 
  Volume2, 
  Sparkles, 
  Play, 
  Square, 
  Check, 
  Sliders, 
  UserCheck,
  CheckCircle2,
  Radio
} from 'lucide-react';

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PrompterSettings;
  onUpdateSettings: (settings: PrompterSettings) => void;
}

export const HUMAN_VOICES = [
  {
    id: 'ar-EG-SalmaNeural',
    name: 'سلمى — مذيعة أخبار مصرية',
    accent: 'مصر 🇪🇬',
    gender: 'نسائي',
    desc: 'صوت بشري ناعم وفصيح جداً، مخارج حروف نقية وطبيعية 100%'
  },
  {
    id: 'ar-EG-ShakirNeural',
    name: 'شاكر — معلق وثائقي وإذاعي مصري',
    accent: 'مصر 🇪🇬',
    gender: 'رجالي',
    desc: 'صوت إنسان فخم، عميق، وقوي للإلقاء الإذاعي الرسمي'
  },
  {
    id: 'ar-SA-HamedNeural',
    name: 'حامد — مذيع رسمي سعودي وخليجي',
    accent: 'السعودية 🇸🇦',
    gender: 'رجالي',
    desc: 'صوت وقور وهادئ، مثالي للبودكاست ونشرات الأخبار'
  },
  {
    id: 'ar-SA-ZariyahNeural',
    name: 'زارية — مذيعة بودكاست خليجية',
    accent: 'السعودية 🇸🇦',
    gender: 'نسائي',
    desc: 'نبرة حيوية وواضحة، تناسب المحتوى الحواري واليوتيوب'
  },
  {
    id: 'ar-AE-HamdanNeural',
    name: 'حمدان — معلق إماراتي واثق',
    accent: 'الإمارات 🇦🇪',
    gender: 'رجالي',
    desc: 'نبرة معلق إعلامي واثقة ومميزة'
  },
  {
    id: 'ar-AE-FatimaNeural',
    name: 'فاطمة — مذيعة إماراتية هادئة',
    accent: 'الإمارات 🇦🇪',
    gender: 'نسائي',
    desc: 'صوت إعلامي متزن ومريح للأذن'
  },
  {
    id: 'ar-JO-TaimNeural',
    name: 'تيم — معلق أردني وشامي',
    accent: 'الأردن / بلاد الشام 🇯🇴',
    gender: 'رجالي',
    desc: 'صوت شاب ومتحمس للمقاطع السريعة والريلز'
  },
  {
    id: 'ar-JO-SanaNeural',
    name: 'سناء — مذيعة أردنية وشامية',
    accent: 'الأردن / بلاد الشام 🇯🇴',
    gender: 'نسائي',
    desc: 'نبرة إلقاء تلفزيوني هادئة ودقيقة'
  }
];

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings
}) => {
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const [testText, setTestText] = useState('أهلاً بك، أنا صوت بشري طبيعي مية في المية، أملي عليك الجمل أثناء التسجيل بكل وضوح.');
  const selectedVoiceId = settings.voiceId || 'ar-EG-SalmaNeural';

  if (!isOpen) return null;

  const handleTestVoice = async (voiceIdToTest?: string) => {
    if (isPlayingTest) {
      audioSpeech.stop();
      setIsPlayingTest(false);
      return;
    }

    setIsPlayingTest(true);
    await audioSpeech.speakText(testText, {
      ...settings,
      voiceId: voiceIdToTest || selectedVoiceId
    });
    setIsPlayingTest(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-studio-950/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-3xl border border-studio-200 shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-studio-100 flex items-center justify-between bg-studio-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-xs">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-studio-900">أصوات بشرية حقيقية 100% (Free Neural Audio)</h3>
              <p className="text-xs text-studio-500">تم تفعيل أصوات المعلقين والمذيعين البشريين مجاناً وبدون أي روبوتية</p>
            </div>
          </div>
          <button
            onClick={() => {
              audioSpeech.stop();
              onClose();
            }}
            className="p-2 text-studio-400 hover:text-studio-700 rounded-xl hover:bg-studio-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {/* Top Notice */}
          <div className="p-3.5 bg-emerald-50/90 rounded-2xl border border-emerald-200 flex items-center gap-3 text-xs text-emerald-950 font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              جميع الأصوات المعروضة أدناه هي أصوات بشرية حقيقية (Neural Studio Voices) مجانية بالكامل وتعمل فوراً عبر السيرفر المحلي.
            </span>
          </div>

          {/* Voice Selection List */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-studio-800">
              اختر المعلق الصوتي المفضل لديك:
            </label>

            <div className="grid grid-cols-1 gap-2">
              {HUMAN_VOICES.map((v) => {
                const isSelected = selectedVoiceId === v.id;
                return (
                  <div
                    key={v.id}
                    onClick={() => {
                      onUpdateSettings({ ...settings, voiceId: v.id, voiceProvider: 'neural-human' });
                    }}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-white border-studio-200 hover:bg-studio-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected ? 'bg-blue-600 text-white shadow-xs' : 'bg-studio-100 text-studio-600'
                      }`}>
                        {v.gender === 'نسائي' ? '👩' : '👨'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-studio-900">{v.name}</h4>
                          <span className="text-[10px] bg-studio-100 text-studio-700 px-1.5 py-0.5 rounded font-medium">
                            {v.accent}
                          </span>
                        </div>
                        <p className="text-[11px] text-studio-500 mt-0.5">{v.desc}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateSettings({ ...settings, voiceId: v.id, voiceProvider: 'neural-human' });
                          handleTestVoice(v.id);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-studio-100 hover:bg-blue-600 hover:text-white text-studio-700 text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
                        title="استمع لتجربة هذا الصوت"
                      >
                        <Play className="w-3 h-3" />
                        <span>تجربة</span>
                      </button>

                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Speed / Rate Slider */}
          <div className="p-4 bg-studio-50 rounded-2xl border border-studio-200 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-studio-800">
              <span>سرعة قراءة الجمل في السماعة:</span>
              <span className="font-mono bg-white px-2 py-0.5 rounded border border-studio-200 text-blue-700">
                {settings.speechRate || 1.0}x
              </span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.3"
              step="0.05"
              value={settings.speechRate || 1.0}
              onChange={(e) => onUpdateSettings({ ...settings, speechRate: Number(e.target.value) })}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-studio-100 bg-studio-50/50 flex justify-between items-center">
          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>الصوت الحالي: {HUMAN_VOICES.find(v => v.id === selectedVoiceId)?.name.split('—')[0]}</span>
          </span>

          <button
            onClick={() => {
              audioSpeech.stop();
              onClose();
            }}
            className="px-6 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
          >
            تأكيد واختيار الصوت
          </button>
        </div>

      </div>
    </div>
  );
};
