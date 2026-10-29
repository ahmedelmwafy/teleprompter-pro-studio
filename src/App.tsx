import React, { useState } from 'react';
import { Episode, PrompterSettings, CloudConfig } from './types';
import { storageService } from './services/storageService';
import { Sidebar } from './components/sidebar/Sidebar';
import { TeleprompterView } from './components/prompter/TeleprompterView';
import { ScriptEditor } from './components/editor/ScriptEditor';
import { MobileControllerModal } from './components/controller/MobileControllerModal';
import { StandaloneMobileController } from './components/controller/StandaloneMobileController';
import { CloudSettingsModal } from './components/settings/CloudSettingsModal';
import { VoiceSettingsModal } from './components/settings/VoiceSettingsModal';
import { ShortcutsModal } from './components/common/ShortcutsModal';
import { 
  Tv, 
  FileEdit, 
  Smartphone,
  Settings,
  Volume2
} from 'lucide-react';

export const App: React.FC = () => {
  // Check if opened as standalone mobile remote controller via query params
  const [isStandaloneController, setIsStandaloneController] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('mode') === 'controller';
    }
    return false;
  });

  const [episodes, setEpisodes] = useState<Episode[]>(() => storageService.getEpisodes());
  const [activeEpisodeId, setActiveEpisodeId] = useState<string>(() => storageService.getActiveEpisodeId());
  const [currentView, setCurrentView] = useState<'prompter' | 'editor'>('prompter');
  const [settings, setSettings] = useState<PrompterSettings>(() => storageService.getSettings());
  const [cloudConfig, setCloudConfig] = useState<CloudConfig>(() => storageService.getCloudConfig());

  // Modals state
  const [isControllerModalOpen, setIsControllerModalOpen] = useState(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Active episode object
  const activeEpisode = episodes.find(e => e.id === activeEpisodeId) || episodes[0];

  // Save settings on update
  const handleUpdateSettings = (newSettings: PrompterSettings) => {
    setSettings(newSettings);
    storageService.saveSettings(newSettings);
  };

  // Select episode
  const handleSelectEpisode = (id: string) => {
    setActiveEpisodeId(id);
    storageService.setActiveEpisodeId(id);
  };

  // Create new episode
  const handleNewEpisode = () => {
    const newEp: Episode = {
      id: `ep-${Date.now()}`,
      title: `حلقة جديدة ${episodes.length + 1}`,
      category: 'بودكاست',
      status: 'draft',
      content: 'أهلاً بكم في هذه الحلقة الجديدة.\nسنتناول اليوم موضوعاً في غاية الأهمية.\n[وقفة للتنفس]\nدعونا نبدأ بالنقاط الأساسية أولاً.',
      savedChunkIndex: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['جديد']
    };

    const updated = [newEp, ...episodes];
    setEpisodes(updated);
    storageService.saveEpisodes(updated);
    setActiveEpisodeId(newEp.id);
    storageService.setActiveEpisodeId(newEp.id);
    setCurrentView('editor');
  };

  // Delete episode
  const handleDeleteEpisode = (id: string) => {
    const updated = episodes.filter(e => e.id !== id);
    setEpisodes(updated);
    storageService.saveEpisodes(updated);
    if (activeEpisodeId === id && updated.length > 0) {
      setActiveEpisodeId(updated[0].id);
      storageService.setActiveEpisodeId(updated[0].id);
    }
  };

  // Save episode edits from editor
  const handleSaveEpisode = (updatedEpisode: Episode) => {
    storageService.saveSingleEpisode(updatedEpisode);
    setEpisodes(storageService.getEpisodes());
  };

  // Update saved reading progress (where presenter stopped)
  const handleUpdateEpisodeProgress = (episodeId: string, chunkIndex: number) => {
    storageService.updateSavedChunkIndex(episodeId, chunkIndex);
    setEpisodes(prev => prev.map(ep => ep.id === episodeId ? { ...ep, savedChunkIndex: chunkIndex } : ep));
  };

  // Mark episode as recorded
  const handleMarkRecorded = (episodeId: string) => {
    const updated = episodes.map(ep => {
      if (ep.id === episodeId) {
        return { ...ep, status: 'recorded' as const };
      }
      return ep;
    });
    setEpisodes(updated);
    storageService.saveEpisodes(updated);
  };

  // If phone opened directly as standalone remote
  if (isStandaloneController) {
    return (
      <StandaloneMobileController 
        pairingCode={settings.controllerCode || 'STUDIO-789'}
        onExitToMainApp={() => {
          window.history.replaceState({}, '', window.location.pathname);
          setIsStandaloneController(false);
        }}
      />
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-studio-50 text-studio-900 font-arabic select-none antialiased">
      
      {/* 1. Main Sidebar (Light Mode) */}
      <Sidebar
        episodes={episodes}
        activeEpisodeId={activeEpisodeId}
        onSelectEpisode={handleSelectEpisode}
        onNewEpisode={handleNewEpisode}
        onDeleteEpisode={handleDeleteEpisode}
        onOpenControllerModal={() => setIsControllerModalOpen(true)}
        onOpenCloudModal={() => setIsCloudModalOpen(true)}
        onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* 2. Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
        
        {/* Top App Bar (Light Mode Header) */}
        <header className="h-14 border-b border-studio-200 bg-white px-4 md:px-6 flex items-center justify-between shrink-0 shadow-xs z-10">
          
          {/* View Mode Switcher Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-studio-100 rounded-xl border border-studio-200/80">
            <button
              onClick={() => setCurrentView('prompter')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentView === 'prompter'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-studio-600 hover:text-studio-900'
              }`}
            >
              <Tv className="w-4 h-4" />
              <span>شاشة التلقين (Prompter)</span>
            </button>

            <button
              onClick={() => setCurrentView('editor')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentView === 'editor'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-studio-600 hover:text-studio-900'
              }`}
            >
              <FileEdit className="w-4 h-4" />
              <span>محرر السكريبت (Editor)</span>
            </button>
          </div>

          {/* Quick Status and Mobile Remote Quick Trigger */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsVoiceModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold transition-colors"
              title="تغيير واختيار صوت المذيع البشري والإملاء"
            >
              <Volume2 className="w-3.5 h-3.5 text-blue-600" />
              <span>صوت الإملاء: {settings.voiceId?.includes('Salma') ? 'سلمى 👩' : settings.voiceId?.includes('Shakir') ? 'شاكر 👨' : settings.voiceId?.includes('Hamed') ? 'حامد 🇸🇦' : 'صوت إنسان 🎙️'}</span>
            </button>

            <button
              onClick={() => setIsControllerModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              <span>اقتران الهاتف: {settings.controllerCode}</span>
            </button>

            <button
              onClick={() => setIsCloudModalOpen(true)}
              className="p-2 rounded-xl bg-studio-100 hover:bg-studio-200 text-studio-700 transition-colors"
              title="إعدادات المزامنة مع Supabase و Firebase"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Dynamic View Display */}
        {currentView === 'prompter' ? (
          <TeleprompterView
            episode={activeEpisode}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onUpdateEpisodeProgress={handleUpdateEpisodeProgress}
            onMarkRecorded={handleMarkRecorded}
            onSwitchToEditor={() => setCurrentView('editor')}
            onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
          />
        ) : (
          <ScriptEditor
            episode={activeEpisode}
            settings={settings}
            onSaveEpisode={handleSaveEpisode}
            onStartPrompter={() => setCurrentView('prompter')}
          />
        )}

      </main>

      {/* 3. Global Modals */}
      <VoiceSettingsModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      <MobileControllerModal
        isOpen={isControllerModalOpen}
        onClose={() => setIsControllerModalOpen(false)}
        pairingCode={settings.controllerCode}
      />

      <CloudSettingsModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
        config={cloudConfig}
        onUpdateConfig={(cfg) => setCloudConfig(cfg)}
      />

      <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

    </div>
  );
};

export default App;
