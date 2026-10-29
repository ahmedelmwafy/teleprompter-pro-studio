import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Episode, PrompterSettings, ScriptChunk } from '../../types';
import { generateChunks, formatDuration } from '../../services/textChunker';
import { audioSpeech } from '../../services/audioSpeechService';
import { controllerSync } from '../../services/controllerSyncService';
import confetti from 'canvas-confetti';
import { 
  ChevronRight, 
  ChevronLeft, 
  Play, 
  Pause, 
  RotateCcw, 
  Maximize, 
  Minimize, 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  FlipHorizontal, 
  Type, 
  Sliders, 
  Sparkles,
  AlertCircle,
  Eye,
  Clock,
  Compass,
  CheckCircle,
  Bookmark
} from 'lucide-react';

interface TeleprompterViewProps {
  episode: Episode;
  settings: PrompterSettings;
  onUpdateSettings: (newSettings: PrompterSettings) => void;
  onUpdateEpisodeProgress: (episodeId: string, chunkIndex: number) => void;
  onMarkRecorded: (episodeId: string) => void;
  onSwitchToEditor: () => void;
  onOpenVoiceModal?: () => void;
}

export const TeleprompterView: React.FC<TeleprompterViewProps> = ({
  episode,
  settings,
  onUpdateSettings,
  onUpdateEpisodeProgress,
  onMarkRecorded,
  onSwitchToEditor,
  onOpenVoiceModal
}) => {
  // Generate chunks based on episode content and settings
  const chunks: ScriptChunk[] = React.useMemo(() => {
    return generateChunks(
      episode.content,
      settings.chunkMode,
      settings.wordsPerChunk,
      settings.wordsPerMinute,
      settings.outroThresholdChunks
    );
  }, [episode.content, settings.chunkMode, settings.wordsPerChunk, settings.wordsPerMinute, settings.outroThresholdChunks]);

  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    return Math.min(episode.savedChunkIndex || 0, Math.max(0, chunks.length - 1));
  });

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState<boolean>(false);
  const [isVoiceFollowing, setIsVoiceFollowing] = useState<boolean>(settings.voiceFollowEnabled);

  const containerRef = useRef<HTMLDivElement>(null);
  const playTimerRef = useRef<any>(null);

  // Sync index when episode changes
  useEffect(() => {
    const saved = Math.min(episode.savedChunkIndex || 0, Math.max(0, chunks.length - 1));
    setCurrentIndex(saved);
    setIsPlaying(false);
  }, [episode.id]);

  const currentChunk = chunks[currentIndex] || null;
  const previousChunk = currentIndex > 0 ? chunks[currentIndex - 1] : null;
  const nextChunk = currentIndex < chunks.length - 1 ? chunks[currentIndex + 1] : null;

  // Speak when currentChunk changes if audio dictation is enabled
  useEffect(() => {
    if (currentChunk && settings.audioDictationEnabled) {
      audioSpeech.speakText(currentChunk.text, settings);

      if (nextChunk) {
        audioSpeech.prefetchAudio(nextChunk.text, settings);
      }
    }

    return () => {
      audioSpeech.stop();
    };
  }, [currentIndex, settings.audioDictationEnabled, settings.voiceProvider, settings.voiceId, settings.speechRate, settings.speechPitch, settings.speechVoiceLang]);

  // Voice tracking setup
  useEffect(() => {
    if (isVoiceFollowing && currentChunk) {
      const targetWords = currentChunk.text.replace(/\[.*?\]/g, '').split(/\s+/).filter(Boolean);
      audioSpeech.startVoiceTracking(
        () => targetWords,
        () => handleNext()
      );
    } else {
      audioSpeech.stopVoiceTracking();
    }

    return () => {
      audioSpeech.stopVoiceTracking();
    };
  }, [isVoiceFollowing, currentIndex]);

  // Handle advancing to next chunk
  const handleNext = useCallback(() => {
    setCurrentIndex(prev => {
      if (prev < chunks.length - 1) {
        const nextIdx = prev + 1;
        onUpdateEpisodeProgress(episode.id, nextIdx);
        return nextIdx;
      } else {
        // Reached the end!
        setIsPlaying(false);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
        onMarkRecorded(episode.id);
        return prev;
      }
    });
  }, [chunks.length, episode.id, onUpdateEpisodeProgress, onMarkRecorded]);

  // Handle going to previous chunk
  const handlePrev = useCallback(() => {
    setCurrentIndex(prev => {
      if (prev > 0) {
        const prevIdx = prev - 1;
        onUpdateEpisodeProgress(episode.id, prevIdx);
        return prevIdx;
      }
      return 0;
    });
  }, [episode.id, onUpdateEpisodeProgress]);

  // Reset to first
  const handleReset = useCallback(() => {
    setCurrentIndex(0);
    setIsPlaying(false);
    onUpdateEpisodeProgress(episode.id, 0);
  }, [episode.id, onUpdateEpisodeProgress]);

  // Jump to specific index
  const handleJump = useCallback((index: number) => {
    if (index >= 0 && index < chunks.length) {
      setCurrentIndex(index);
      onUpdateEpisodeProgress(episode.id, index);
    }
  }, [chunks.length, episode.id, onUpdateEpisodeProgress]);

  // Listen to remote controller actions (Phone / Tablet / BroadcastChannel / Bluetooth)
  useEffect(() => {
    const unsubscribe = controllerSync.subscribe((msg) => {
      switch (msg.type) {
        case 'NEXT':
          handleNext();
          break;
        case 'PREV':
          handlePrev();
          break;
        case 'FIRST':
          handleReset();
          break;
        case 'LAST':
          handleJump(chunks.length - 1);
          break;
        case 'JUMP':
          if (typeof msg.payload === 'number') handleJump(msg.payload);
          break;
        case 'TOGGLE_PLAY':
          setIsPlaying(p => !p);
          break;
        case 'SPEED_UP':
          onUpdateSettings({ ...settings, wordsPerMinute: Math.min(220, settings.wordsPerMinute + 10) });
          break;
        case 'SPEED_DOWN':
          onUpdateSettings({ ...settings, wordsPerMinute: Math.max(80, settings.wordsPerMinute - 10) });
          break;
        case 'FONT_LARGER':
          onUpdateSettings({ ...settings, fontSize: Math.min(72, settings.fontSize + 4) });
          break;
        case 'FONT_SMALLER':
          onUpdateSettings({ ...settings, fontSize: Math.max(24, settings.fontSize - 4) });
          break;
        case 'TOGGLE_AUDIO_DICTATION':
          onUpdateSettings({ ...settings, audioDictationEnabled: !settings.audioDictationEnabled });
          break;
      }
    });

    return unsubscribe;
  }, [handleNext, handlePrev, handleReset, handleJump, chunks.length, settings, onUpdateSettings]);

  // Keyboard navigation (Space, Arrow keys, Bluetooth Clicker)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space' || e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        handleReset();
      } else if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsPlaying(p => !p);
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, handleReset]);

  // Auto-play timer pacing
  useEffect(() => {
    if (!isPlaying || !currentChunk) {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
      return;
    }

    const duration = currentChunk.estimatedSeconds || 4;
    setTimerSecondsLeft(duration);

    playTimerRef.current = setInterval(() => {
      setTimerSecondsLeft(prev => {
        if (prev <= 1) {
          handleNext();
          return currentChunk.estimatedSeconds || 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, currentIndex, currentChunk, handleNext]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const progressPercentage = chunks.length > 0 ? Math.round(((currentIndex + 1) / chunks.length) * 100) : 0;
  const totalDurationSeconds = chunks.reduce((acc, c) => acc + c.estimatedSeconds, 0);

  if (chunks.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-studio-50">
        <AlertCircle className="w-16 h-16 text-amber-500 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-studio-900 mb-2">السكريبت فارغ أو لا يحتوي على جمل</h2>
        <p className="text-studio-500 max-w-md mb-6 text-sm">
          أضف نص الحلقة في المحرر لتبدأ جلسة التلقين الاحترافية فوراً.
        </p>
        <button
          onClick={onSwitchToEditor}
          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md"
        >
          الانتقال لمحرر السكريبت
        </button>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative flex-1 flex flex-col bg-studio-50 text-studio-900 overflow-hidden select-none transition-colors ${
        currentChunk?.isOutro ? 'border-2 border-red-400 bg-red-50/20' : ''
      }`}
    >
      {/* Top Prompter Status Bar (Light Mode Header) */}
      <div className="bg-white border-b border-studio-200 px-4 py-2.5 flex items-center justify-between shadow-xs z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-extrabold text-studio-800">
              {episode.title}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-studio-500 font-sans border-r border-studio-200 pr-3">
            <span className="bg-studio-100 text-studio-700 font-bold px-2 py-0.5 rounded">
              جملة {currentIndex + 1} من {chunks.length}
            </span>
            <span className="flex items-center gap-1 font-arabic">
              <Clock className="w-3.5 h-3.5 text-studio-400" />
              إجمالي {formatDuration(totalDurationSeconds)}
            </span>
          </div>
        </div>

        {/* Action Controls & Toggles */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Audio Dictation in Ear ("يمليني في السماعة") */}
          <div className="flex items-center">
            <button
              onClick={() => onUpdateSettings({ ...settings, audioDictationEnabled: !settings.audioDictationEnabled })}
              className={`px-2.5 py-1.5 ${onOpenVoiceModal ? 'rounded-r-lg border-l border-white/20' : 'rounded-lg'} text-xs font-bold flex items-center gap-1.5 transition-all ${
                settings.audioDictationEnabled 
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 ring-2 ring-blue-400' 
                  : 'bg-studio-100 text-studio-700 hover:bg-studio-200'
              }`}
              title="تفعيل الإملاء الصوتي في سماعة الأذن للمذيع"
            >
              {settings.audioDictationEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden md:inline">إملاء في الأذن</span>
            </button>
            {onOpenVoiceModal && (
              <button
                onClick={onOpenVoiceModal}
                className="px-2 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-900 rounded-l-lg text-[11px] font-bold transition-colors border-r border-blue-200"
                title="تخصيص واختيار الصوت البشري الطبيعي"
              >
                تغيير الصوت 🎙️
              </button>
            )}
          </div>

          {/* Voice-following toggle */}
          <button
            onClick={() => setIsVoiceFollowing(!isVoiceFollowing)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              isVoiceFollowing 
                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400' 
                : 'bg-studio-100 text-studio-700 hover:bg-studio-200'
            }`}
            title="متابعة صوت المذيع لتقديم الجمل تلقائياً"
          >
            {isVoiceFollowing ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            <span className="hidden md:inline">متابعة صوتي</span>
          </button>

          {/* Mirror Flip Mode for Studio Glass */}
          <button
            onClick={() => onUpdateSettings({ ...settings, isMirrorX: !settings.isMirrorX })}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
              settings.isMirrorX 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'bg-studio-100 text-studio-700 hover:bg-studio-200'
            }`}
            title="انعكاس للشاشات الزجاجية (Mirror Mode)"
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>

          {/* Quick Settings Drawer Toggle */}
          <button
            onClick={() => setShowSettingsPanel(!showSettingsPanel)}
            className={`p-1.5 rounded-lg transition-colors ${
              showSettingsPanel ? 'bg-studio-800 text-white' : 'bg-studio-100 text-studio-700 hover:bg-studio-200'
            }`}
            title="إعدادات التلقين والخط"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-studio-100 text-studio-700 hover:bg-studio-200 transition-colors"
            title="وضع ملء الشاشة"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Outro Alert Warning Banner */}
      {currentChunk?.isOutro && (
        <div className="bg-red-500 text-white text-xs font-extrabold py-1.5 px-4 flex items-center justify-center gap-2 shadow-sm animate-pulse">
          <AlertCircle className="w-4 h-4" />
          <span>تنبيه ختام الحلقة: أنت الآن في الجزء الأخير من السكريبت (Outro)</span>
        </div>
      )}

      {/* Main Reading Stage (Teleprompter Display) */}
      <div 
        className={`flex-1 flex flex-col justify-center items-center px-6 md:px-16 py-8 overflow-hidden relative ${
          settings.isMirrorX ? 'prompter-mirror' : ''
        }`}
      >
        <div className="max-w-4xl w-full flex flex-col items-center justify-center text-center space-y-6">
          
          {/* 1. Previous Sentence (Dimmed) */}
          {settings.showPrevious && (
            <div 
              style={{ opacity: settings.dimmedOpacity }}
              className="w-full text-center transition-all duration-300 filter blur-[0.4px] hover:blur-none cursor-pointer"
              onClick={handlePrev}
            >
              {previousChunk ? (
                <p 
                  dir="auto"
                  className="text-studio-500 font-medium leading-relaxed"
                  style={{ fontSize: `${Math.round(settings.fontSize * 0.58)}px` }}
                >
                  {previousChunk.text}
                </p>
              ) : (
                <p className="text-studio-400 text-sm font-sans italic opacity-40">
                  بداية الحلقة
                </p>
              )}
            </div>
          )}

          {/* 2. CURRENT ACTIVE SENTENCE (Centerpiece) */}
          <div className="w-full relative py-6 px-8 rounded-2xl bg-white border border-studio-200/90 shadow-lg shadow-studio-200/50 transition-all duration-300">
            {/* Cue Badge if any (e.g. [وقفة للتنفس], [نبرة حماسية]) */}
            {currentChunk?.cueType && currentChunk.cueType !== 'normal' && (
              <div className="inline-flex items-center gap-1.5 mb-3 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                {currentChunk.cueType === 'pause' && 'وقفة للتنفس والتركيز'}
                {currentChunk.cueType === 'emphasis' && 'نبرة حماسية وتأكيد'}
                {currentChunk.cueType === 'bilingual' && 'مصطلحات ثنائية اللغة'}
              </div>
            )}

            {/* The Text Display */}
            <p
              dir="auto"
              style={{ 
                fontSize: `${settings.fontSize}px`,
                lineHeight: settings.lineHeight,
                fontFamily: settings.fontFamily === 'Tajawal' ? 'Tajawal, sans-serif' : 'Cairo, sans-serif'
              }}
              className="font-extrabold text-studio-950 tracking-normal transition-all duration-150 select-text"
            >
              {currentChunk?.text}
            </p>

            {/* Meta info of current sentence */}
            <div className="mt-4 pt-3 border-t border-studio-100 flex items-center justify-between text-xs text-studio-500 font-sans">
              <span className="flex items-center gap-1 font-arabic">
                <Bookmark className="w-3.5 h-3.5 text-blue-600" />
                كلمات الجملة: <strong className="text-studio-800">{currentChunk?.wordCount}</strong>
              </span>

              <span className="flex items-center gap-1 font-arabic">
                <Clock className="w-3.5 h-3.5 text-studio-400" />
                الوقت المقدر: ~<strong>{currentChunk?.estimatedSeconds} ثانية</strong>
              </span>

              {isPlaying && (
                <span className="flex items-center gap-1 text-blue-600 font-bold animate-pulse">
                  المتبقي: {timerSecondsLeft} ث
                </span>
              )}
            </div>
          </div>

          {/* 3. Upcoming Sentence (Dimmed) */}
          {settings.showUpcoming && (
            <div 
              style={{ opacity: settings.dimmedOpacity }}
              className="w-full text-center transition-all duration-300 filter blur-[0.4px] hover:blur-none cursor-pointer"
              onClick={handleNext}
            >
              {nextChunk ? (
                <p 
                  dir="auto"
                  className="text-studio-500 font-medium leading-relaxed"
                  style={{ fontSize: `${Math.round(settings.fontSize * 0.58)}px` }}
                >
                  {nextChunk.text}
                </p>
              ) : (
                <p className="text-emerald-600 text-sm font-bold opacity-70">
                  🎉 ختام السكريبت! أحسنت التسجيل
                </p>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Chunk Scrubber & Progress Bar */}
      <div className="bg-white border-t border-studio-200 px-6 py-3 flex flex-col gap-2 z-20">
        <div className="flex items-center justify-between text-xs font-semibold text-studio-600">
          <span>تقدم الإلقاء ({progressPercentage}%)</span>
          <span className="font-mono text-studio-500">
            {currentIndex + 1} / {chunks.length} جملة
          </span>
        </div>

        {/* Clickable Progress track */}
        <div 
          className="relative w-full h-2.5 bg-studio-100 rounded-full cursor-pointer overflow-hidden border border-studio-200"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickPos = (e.clientX - rect.left) / rect.width;
            // Handle RTL: clickPos inverted
            const ratio = 1 - clickPos;
            const targetIdx = Math.floor(ratio * chunks.length);
            handleJump(Math.max(0, Math.min(chunks.length - 1, targetIdx)));
          }}
        >
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-200 rounded-full"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Bottom Tactile Controller Bar (Large Buttons for Presenter) */}
        <div className="flex items-center justify-between pt-2">
          {/* Speed & Mode indicator */}
          <div className="flex items-center gap-2">
            <span className="text-xs bg-studio-100 text-studio-700 px-2.5 py-1 rounded-lg font-bold">
              {settings.wordsPerMinute} كلمة/د
            </span>
            <span className="text-xs bg-studio-100 text-studio-700 px-2.5 py-1 rounded-lg font-bold">
              خط {settings.fontSize}px
            </span>
          </div>

          {/* Core Navigation Controls */}
          <div className="flex items-center gap-2">
            {/* Prev */}
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="p-3 rounded-xl bg-studio-100 hover:bg-studio-200 disabled:opacity-40 text-studio-800 font-bold transition-all active:scale-95 shadow-xs"
              title="الجملة السابقة (السهم الأيسر)"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Play/Pause Auto-Timer */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all active:scale-95 shadow-md ${
                isPlaying 
                  ? 'bg-amber-500 text-white shadow-amber-500/25' 
                  : 'bg-studio-800 hover:bg-studio-900 text-white'
              }`}
              title="تشغيل / إيقاف التقديم التلقائي بالوقت"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              <span>{isPlaying ? 'إيقاف مؤقت' : 'تقديم زمني'}</span>
            </button>

            {/* Next (Primary Big Button) */}
            <button
              onClick={handleNext}
              disabled={currentIndex >= chunks.length - 1}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm flex items-center gap-2 shadow-md shadow-blue-600/30 transition-all active:scale-95 disabled:opacity-40"
              title="الجملة التالية (المسافة أو السهم الأيمن)"
            >
              <span>التالي</span>
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Reset */}
            <button
              onClick={handleReset}
              className="p-3 rounded-xl text-studio-500 hover:text-studio-800 hover:bg-studio-100 transition-colors"
              title="إعادة للأول (R)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Slide-in Quick Settings Panel */}
      {showSettingsPanel && (
        <div className="absolute top-14 left-4 w-72 bg-white rounded-2xl border border-studio-200 shadow-xl p-4 z-30 space-y-4 animate-slide-up">
          <div className="flex items-center justify-between border-b border-studio-100 pb-2">
            <h4 className="text-xs font-bold text-studio-900 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-blue-600" />
              تخصيص العرض والخط
            </h4>
            <button 
              onClick={() => setShowSettingsPanel(false)}
              className="text-xs text-studio-400 hover:text-studio-700"
            >
              ✕
            </button>
          </div>

          {/* Font Size Slider */}
          <div>
            <div className="flex justify-between text-xs font-medium text-studio-700 mb-1">
              <span>حجم الخط</span>
              <span className="font-mono">{settings.fontSize}px</span>
            </div>
            <input 
              type="range"
              min="24"
              max="72"
              step="2"
              value={settings.fontSize}
              onChange={(e) => onUpdateSettings({ ...settings, fontSize: Number(e.target.value) })}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Reading Speed (WPM) Slider */}
          <div>
            <div className="flex justify-between text-xs font-medium text-studio-700 mb-1">
              <span>سرعة القراءة (كلمة/د)</span>
              <span className="font-mono">{settings.wordsPerMinute} WPM</span>
            </div>
            <input 
              type="range"
              min="80"
              max="220"
              step="5"
              value={settings.wordsPerMinute}
              onChange={(e) => onUpdateSettings({ ...settings, wordsPerMinute: Number(e.target.value) })}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Sentence Splitting Mode */}
          <div>
            <label className="block text-xs font-medium text-studio-700 mb-1.5">
              أسلوب تقسيم السكريبت:
            </label>
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: 'sentence', label: 'جمل كاملة' },
                { id: 'half-sentence', label: 'أنصاف جمل' },
                { id: 'custom-words', label: 'كلمات مخصصة' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => onUpdateSettings({ ...settings, chunkMode: opt.id as any })}
                  className={`py-1.5 text-[11px] font-bold rounded-lg transition-colors border ${
                    settings.chunkMode === opt.id
                      ? 'bg-blue-50 text-blue-700 border-blue-300'
                      : 'bg-studio-50 text-studio-600 border-studio-200 hover:bg-studio-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Font Family */}
          <div>
            <label className="block text-xs font-medium text-studio-700 mb-1.5">
              نوع الخط:
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {['Tajawal', 'Cairo'].map(f => (
                <button
                  key={f}
                  onClick={() => onUpdateSettings({ ...settings, fontFamily: f as any })}
                  className={`py-1 text-xs font-bold rounded-lg border ${
                    settings.fontFamily === f 
                      ? 'bg-studio-800 text-white border-studio-800' 
                      : 'bg-studio-50 text-studio-700 border-studio-200'
                  }`}
                >
                  {f === 'Tajawal' ? 'خط تجوال' : 'خط كايرو'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
