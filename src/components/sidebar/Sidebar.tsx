import React, { useState } from 'react';
import { Episode, EpisodeStatus } from '../../types';
import { 
  Plus, 
  Search, 
  Mic2, 
  Clock, 
  FileText, 
  CheckCircle2, 
  Archive, 
  Edit3, 
  Trash2, 
  Smartphone, 
  Cloud, 
  Keyboard, 
  Bookmark,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { countWords, calculateReadingTime, formatDuration } from '../../services/textChunker';

interface SidebarProps {
  episodes: Episode[];
  activeEpisodeId: string;
  onSelectEpisode: (id: string) => void;
  onNewEpisode: () => void;
  onDeleteEpisode: (id: string) => void;
  onOpenControllerModal: () => void;
  onOpenCloudModal: () => void;
  onOpenShortcutsModal: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  episodes,
  activeEpisodeId,
  onSelectEpisode,
  onNewEpisode,
  onDeleteEpisode,
  onOpenControllerModal,
  onOpenCloudModal,
  onOpenShortcutsModal,
  collapsed,
  onToggleCollapse
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Filter episodes
  const filteredEpisodes = episodes.filter(ep => {
    const matchesSearch = ep.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ep.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (ep.tags && ep.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesFilter = filterStatus === 'all' || ep.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: EpisodeStatus) => {
    switch (status) {
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            جاهز للإلقاء
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <Edit3 className="w-3 h-3" />
            مسودة
          </span>
        );
      case 'recorded':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            <Mic2 className="w-3 h-3" />
            تم التسجيل
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            <Archive className="w-3 h-3" />
            مؤرشف
          </span>
        );
    }
  };

  return (
    <aside 
      className={`relative flex flex-col bg-white border-l border-studio-200 transition-all duration-300 ease-in-out select-none z-30 shadow-sm ${
        collapsed ? 'w-20' : 'w-80 md:w-88'
      }`}
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-studio-200 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Mic2 className="w-5 h-5 animate-pulse-subtle" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-studio-900 tracking-tight flex items-center gap-1.5">
                تلقين برو
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">
                  Studio
                </span>
              </h1>
              <p className="text-xs text-studio-500">المُملّي الذكي لصُنّاع المحتوى</p>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="w-full flex justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <Mic2 className="w-5 h-5" />
            </div>
          </div>
        )}

        {/* Toggle Collapse Button */}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-studio-400 hover:text-studio-700 hover:bg-studio-100 transition-colors"
          title={collapsed ? 'توسيع القائمة' : 'طي القائمة'}
        >
          {collapsed ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      </div>

      {/* New Episode Button & Search (Expanded Only) */}
      {!collapsed && (
        <div className="p-4 space-y-3 border-b border-studio-100">
          <button
            onClick={onNewEpisode}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" />
            حلقة جديدة
          </button>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-studio-400 pointer-events-none" />
            <input
              type="text"
              placeholder="بحث في السكريبتات والحلقات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-3 pr-9 py-2 text-xs bg-studio-50 border border-studio-200 rounded-lg text-studio-800 placeholder-studio-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'all', label: 'الكل' },
              { id: 'ready', label: 'جاهز' },
              { id: 'draft', label: 'مسودات' },
              { id: 'recorded', label: 'مُسجّل' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors ${
                  filterStatus === tab.id
                    ? 'bg-studio-800 text-white shadow-sm'
                    : 'bg-studio-100 text-studio-600 hover:bg-studio-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Episodes List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {filteredEpisodes.length === 0 ? (
          <div className="p-6 text-center text-studio-400">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">لا توجد حلقات مطابقة للبحث</p>
          </div>
        ) : (
          filteredEpisodes.map(ep => {
            const isActive = ep.id === activeEpisodeId;
            const words = countWords(ep.content);
            const durationSec = calculateReadingTime(words);

            if (collapsed) {
              return (
                <button
                  key={ep.id}
                  onClick={() => onSelectEpisode(ep.id)}
                  title={`${ep.title} (${formatDuration(durationSec)})`}
                  className={`w-full p-2.5 rounded-xl flex items-center justify-center transition-all ${
                    isActive 
                      ? 'bg-blue-50 text-blue-600 border border-blue-200 font-bold' 
                      : 'text-studio-600 hover:bg-studio-100'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                </button>
              );
            }

            return (
              <div
                key={ep.id}
                onClick={() => onSelectEpisode(ep.id)}
                className={`group p-3 rounded-xl border text-right cursor-pointer transition-all ${
                  isActive
                    ? 'bg-blue-50/70 border-blue-200 shadow-sm ring-1 ring-blue-500/20'
                    : 'bg-white border-studio-200/80 hover:border-studio-300 hover:bg-studio-50/70'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h3 className={`text-sm font-bold line-clamp-1 ${isActive ? 'text-blue-950' : 'text-studio-900'}`}>
                    {ep.title}
                  </h3>
                  {getStatusBadge(ep.status)}
                </div>

                <div className="flex items-center gap-3 text-xs text-studio-500 mb-2 font-sans">
                  <span className="flex items-center gap-1 font-arabic">
                    <FileText className="w-3.5 h-3.5 text-studio-400" />
                    {words} كلمة
                  </span>
                  <span className="flex items-center gap-1 font-arabic">
                    <Clock className="w-3.5 h-3.5 text-studio-400" />
                    ~{formatDuration(durationSec)}
                  </span>
                </div>

                {/* Progress / Saved Point indicator */}
                <div className="flex items-center justify-between pt-1.5 border-t border-studio-100 text-[11px]">
                  <div className="flex items-center gap-1 text-studio-500 font-medium">
                    <Bookmark className="w-3 h-3 text-amber-500" />
                    <span>مكان التوقف: الجملة {ep.savedChunkIndex + 1}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('هل أنت متأكد من حذف هذه الحلقة؟')) {
                        onDeleteEpisode(ep.id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-studio-400 hover:text-red-600 rounded transition-all"
                    title="حذف الحلقة"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Footer Actions (Light Mode Controls) */}
      <div className="p-3 border-t border-studio-200 bg-studio-50/80 space-y-1">
        <button
          onClick={onOpenControllerModal}
          className="w-full flex items-center justify-between p-2 rounded-lg text-xs font-semibold text-studio-700 hover:bg-white hover:shadow-xs transition-all border border-transparent hover:border-studio-200"
        >
          <span className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-600" />
            {!collapsed && 'ريموت الموبايل / السكرين الثانية'}
          </span>
          {!collapsed && (
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
              QR
            </span>
          )}
        </button>

        <button
          onClick={onOpenCloudModal}
          className="w-full flex items-center justify-between p-2 rounded-lg text-xs font-semibold text-studio-700 hover:bg-white hover:shadow-xs transition-all border border-transparent hover:border-studio-200"
        >
          <span className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-blue-600" />
            {!collapsed && 'سحابة Supabase & Firebase'}
          </span>
          {!collapsed && (
            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">
              Cloud
            </span>
          )}
        </button>

        <button
          onClick={onOpenShortcutsModal}
          className="w-full flex items-center justify-between p-2 rounded-lg text-xs font-semibold text-studio-700 hover:bg-white hover:shadow-xs transition-all border border-transparent hover:border-studio-200"
        >
          <span className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-studio-500" />
            {!collapsed && 'التحكم بالريموت والكيبورد'}
          </span>
          {!collapsed && <span className="text-[10px] text-studio-400 font-mono">Space/⎵</span>}
        </button>
      </div>
    </aside>
  );
};
