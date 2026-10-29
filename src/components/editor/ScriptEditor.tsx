import React, { useState } from 'react';
import { Episode, EpisodeStatus, PrompterSettings } from '../../types';
import { generateChunks, countWords, calculateReadingTime, formatDuration } from '../../services/textChunker';
import { 
  Play, 
  Save, 
  Sparkles, 
  FileText, 
  Clock, 
  Layers, 
  Tag, 
  StickyNote, 
  Download, 
  Check, 
  ArrowLeft,
  Sliders,
  Type
} from 'lucide-react';

interface ScriptEditorProps {
  episode: Episode;
  settings: PrompterSettings;
  onSaveEpisode: (updated: Episode) => void;
  onStartPrompter: () => void;
}

export const ScriptEditor: React.FC<ScriptEditorProps> = ({
  episode,
  settings,
  onSaveEpisode,
  onStartPrompter
}) => {
  const [title, setTitle] = useState(episode.title);
  const [category, setCategory] = useState(episode.category);
  const [status, setStatus] = useState<EpisodeStatus>(episode.status);
  const [content, setContent] = useState(episode.content);
  const [notes, setNotes] = useState(episode.notes || '');
  const [tagsInput, setTagsInput] = useState(episode.tags ? episode.tags.join('، ') : '');
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);

  // Real-time chunk preview
  const chunks = React.useMemo(() => {
    return generateChunks(
      content,
      settings.chunkMode,
      settings.wordsPerChunk,
      settings.wordsPerMinute,
      settings.outroThresholdChunks
    );
  }, [content, settings.chunkMode, settings.wordsPerChunk, settings.wordsPerMinute, settings.outroThresholdChunks]);

  const totalWords = countWords(content);
  const totalDuration = calculateReadingTime(totalWords, settings.wordsPerMinute);

  const handleSave = () => {
    const updated: Episode = {
      ...episode,
      title,
      category,
      status,
      content,
      notes,
      tags: tagsInput.split(/[،,]/).map(t => t.trim()).filter(Boolean),
      updatedAt: new Date().toISOString()
    };
    onSaveEpisode(updated);
    setShowSavedFeedback(true);
    setTimeout(() => setShowSavedFeedback(false), 2000);
  };

  const insertCue = (cueText: string) => {
    setContent(prev => {
      const trimmed = prev.trimEnd();
      return trimmed + (trimmed.length > 0 ? '\n' : '') + `[${cueText}] `;
    });
  };

  const exportAsTxt = () => {
    const element = document.createElement('a');
    const file = new Blob([`عنوان الحلقة: ${title}\nالقسم: ${category}\n\nالسكريبت:\n${content}`], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `${title.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="flex-1 flex flex-col bg-studio-50 overflow-hidden select-none">
      {/* Editor Header Bar */}
      <div className="bg-white border-b border-studio-200 px-6 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-studio-900">محرر السكريبت واستوديو الإعداد</h2>
            <p className="text-xs text-studio-500">قم بصياغة النص وتنسيقه مع معاينة حية لتقسيم الجمل</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Export button */}
          <button
            onClick={exportAsTxt}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-studio-100 hover:bg-studio-200 text-studio-700 flex items-center gap-1.5 transition-colors"
            title="تصدير السكريبت كملف نصي TXT"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">تصدير TXT</span>
          </button>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-studio-800 hover:bg-studio-900 text-white flex items-center gap-1.5 transition-all shadow-xs"
          >
            {showSavedFeedback ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
            <span>{showSavedFeedback ? 'تم الحفظ!' : 'حفظ التغييرات'}</span>
          </button>

          {/* Launch Prompter Button */}
          <button
            onClick={() => {
              handleSave();
              onStartPrompter();
            }}
            className="px-5 py-2 rounded-xl text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-md shadow-blue-600/25 transition-all active:scale-95"
          >
            <Play className="w-4 h-4" />
            <span>بدء التلقين فوراً</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left/Main Column: Script Input & Details */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-4 border-l border-studio-200 bg-white">
          
          {/* Episode Title & Category */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-studio-700 mb-1">عنوان الحلقة</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="أدخل عنوان الحلقة هنا..."
                className="w-full px-3.5 py-2 text-sm font-bold bg-studio-50 border border-studio-200 rounded-xl text-studio-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-studio-700 mb-1">تصنيف البرنامج</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold bg-studio-50 border border-studio-200 rounded-xl text-studio-800 focus:bg-white focus:border-blue-500 outline-none"
              >
                <option value="بودكاست">بودكاست تقني / حواري</option>
                <option value="أخبار">نشرة أخبار</option>
                <option value="يوتيوب">فيديو يوتيوب</option>
                <option value="تيك توك وريلز">تيك توك / شورتس / ريلز</option>
                <option value="تطوير ذات">تطوير ذات وإنتاجية</option>
                <option value="مقابلة">مقابلة خاصة</option>
              </select>
            </div>
          </div>

          {/* Quick Stage Cue Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-bold text-studio-500 whitespace-nowrap flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              إشارات وإرشادات الإلقاء:
            </span>
            <button
              onClick={() => insertCue('وقفة للتنفس')}
              className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 font-medium whitespace-nowrap transition-colors"
            >
              + وقفة للتنفس
            </button>
            <button
              onClick={() => insertCue('نبرة حماسية وتأكيد')}
              className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 font-medium whitespace-nowrap transition-colors"
            >
              + نبرة حماسية
            </button>
            <button
              onClick={() => insertCue('ابتسامة وترحيب')}
              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 font-medium whitespace-nowrap transition-colors"
            >
              + ابتسامة وترحيب
            </button>
            <button
              onClick={() => insertCue('فاصل')}
              className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100 font-medium whitespace-nowrap transition-colors"
            >
              + فاصل
            </button>
          </div>

          {/* The Rich Textarea */}
          <div className="flex-1 flex flex-col min-h-[300px]">
            <label className="block text-xs font-bold text-studio-700 mb-1">
              نص السكريبت الكامل (يدعم العربية والإنجليزية في نفس الجملة)
            </label>
            <textarea
              dir="auto"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="اكتب أو الصق نص السكريبت هنا... التطبيق سيقوم بتقسيمه تلقائياً لجمل يمكنك التنقل بينها بريموت أو كيبورد."
              className="flex-1 w-full p-4 text-sm leading-relaxed bg-studio-50 border border-studio-200 rounded-xl text-studio-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none resize-none font-arabic"
            />
          </div>

          {/* Notes & Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-studio-100">
            <div>
              <label className="block text-xs font-medium text-studio-600 mb-1 flex items-center gap-1">
                <StickyNote className="w-3.5 h-3.5 text-studio-400" />
                ملاحظات المذيع ومخرج الحلقة
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثال: ضبط الإضاءة الزرقاء، استخدام مايك Shure SM7B..."
                className="w-full px-3 py-1.5 text-xs bg-studio-50 border border-studio-200 rounded-lg text-studio-800 outline-none focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-studio-600 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-studio-400" />
                الوسوم (مفصولة بفواصل)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="ذكاء اصطناعي، يوتيوب، تعليمي..."
                className="w-full px-3 py-1.5 text-xs bg-studio-50 border border-studio-200 rounded-lg text-studio-800 outline-none focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Live Chunk Segmentation & Teleprompter Preview */}
        <div className="w-full lg:w-96 flex flex-col bg-studio-50 border-t lg:border-t-0 lg:border-r border-studio-200 overflow-hidden">
          {/* Preview Header */}
          <div className="p-4 bg-white border-b border-studio-200 flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-studio-900 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              معاينة تقسيم الجمل الحية ({chunks.length} جملة)
            </h3>
            <span className="text-[11px] font-sans font-bold text-studio-500">
              ~{formatDuration(totalDuration)}
            </span>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 gap-2 p-3 bg-studio-100/60 border-b border-studio-200 text-xs">
            <div className="bg-white p-2.5 rounded-lg border border-studio-200/60 text-center">
              <span className="block text-studio-400 text-[10px] font-bold">إجمالي الكلمات</span>
              <strong className="text-sm font-sans text-studio-800">{totalWords}</strong>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-studio-200/60 text-center">
              <span className="block text-studio-400 text-[10px] font-bold">وقت الإلقاء التقديري</span>
              <strong className="text-sm font-sans text-studio-800">~{formatDuration(totalDuration)}</strong>
            </div>
          </div>

          {/* List of segmented chunks */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {chunks.map((chunk, idx) => (
              <div
                key={chunk.id}
                className={`p-3 rounded-xl border text-right transition-all select-text ${
                  chunk.isOutro 
                    ? 'bg-red-50/60 border-red-200 text-red-950'
                    : 'bg-white border-studio-200 text-studio-800 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1 text-[10px] font-mono text-studio-400">
                  <span className="font-bold text-studio-600 font-arabic">جملة #{idx + 1}</span>
                  <div className="flex items-center gap-2">
                    <span>{chunk.wordCount} كلمة</span>
                    <span>~{chunk.estimatedSeconds} ثانية</span>
                  </div>
                </div>

                <p dir="auto" className="text-xs font-medium leading-relaxed">
                  {chunk.text}
                </p>

                {chunk.isOutro && (
                  <span className="inline-block mt-1.5 text-[9px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                    ختام الحلقة (Outro)
                  </span>
                )}
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
};
