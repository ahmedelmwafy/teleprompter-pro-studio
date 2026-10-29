import React, { useState } from 'react';
import { CloudConfig } from '../../types';
import { storageService } from '../../services/storageService';
import { 
  Cloud, 
  Database, 
  Flame, 
  Check, 
  ExternalLink, 
  RefreshCw, 
  Download, 
  Upload, 
  ShieldCheck, 
  Key, 
  Copy,
  Info
} from 'lucide-react';

interface CloudSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: CloudConfig;
  onUpdateConfig: (config: CloudConfig) => void;
}

export const CloudSettingsModal: React.FC<CloudSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig
}) => {
  const [activeTab, setActiveTab] = useState<'supabase' | 'firebase' | 'backup'>('supabase');
  const [formData, setFormData] = useState<CloudConfig>(config);
  const [syncStatus, setSyncStatus] = useState<{ loading: boolean; message: string; success?: boolean }>({
    loading: false,
    message: ''
  });
  const [copiedSchema, setCopiedSchema] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    storageService.saveCloudConfig(formData);
    onUpdateConfig(formData);
  };

  const handleSyncSupabase = async () => {
    handleSave();
    setSyncStatus({ loading: true, message: 'جارٍ الاتصال بـ Supabase والمزامنة...' });
    const res = await storageService.syncWithSupabase(formData);
    setSyncStatus({ loading: false, message: res.message, success: res.success });
  };

  const handleSyncFirebase = async () => {
    handleSave();
    setSyncStatus({ loading: true, message: 'جارٍ الاتصال بـ Firebase والمزامنة...' });
    const res = await storageService.syncWithFirebase(formData);
    setSyncStatus({ loading: false, message: res.message, success: res.success });
  };

  const downloadBackup = () => {
    const json = storageService.exportBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teleprompter-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = storageService.importBackup(content);
        if (ok) {
          alert('تم استيراد النسخة الاحتياطية بنجاح!');
          window.location.reload();
        } else {
          alert('فشل استيراد الملف، تأكد من صحة التنسيق');
        }
      }
    };
    reader.readAsText(file);
  };

  const supabaseSqlSchema = `-- جدول الحلقات لمزامنة التلقين
create table if not exists episodes (
  id text primary key,
  title text not null,
  category text,
  status text default 'draft',
  content text,
  saved_chunk_index integer default 0,
  tags text[],
  updated_at timestamp with time zone default timezone('utc'::text, now())
);`;

  return (
    <div className="fixed inset-0 z-50 bg-studio-950/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-3xl border border-studio-200 shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-studio-100 flex items-center justify-between bg-studio-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shadow-xs">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-studio-900">المزامنة السحابية وقواعد البيانات</h3>
              <p className="text-xs text-studio-500">اربط الحلقات والسكريبتات مع Supabase أو Firebase</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-studio-400 hover:text-studio-700 rounded-xl hover:bg-studio-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Cloud Navigation Tabs */}
        <div className="flex border-b border-studio-200 bg-studio-50/50 p-2 gap-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('supabase')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'supabase'
                ? 'bg-white text-emerald-800 shadow-xs border border-studio-200'
                : 'text-studio-600 hover:bg-studio-100'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-600" />
            <span>Supabase Cloud</span>
          </button>

          <button
            onClick={() => setActiveTab('firebase')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'firebase'
                ? 'bg-white text-amber-800 shadow-xs border border-studio-200'
                : 'text-studio-600 hover:bg-studio-100'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-600" />
            <span>Firebase Cloud</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'backup'
                ? 'bg-white text-blue-800 shadow-xs border border-studio-200'
                : 'text-studio-600 hover:bg-studio-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>نسخ احتياطي محلي</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Supabase Tab */}
          {activeTab === 'supabase' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-emerald-950">قاعدة بيانات Supabase (PostgreSQL)</h4>
                  <p className="text-[11px] text-emerald-700">تخزين الحلقات ومزامنتها فورياً عبر جميع أجهزتك</p>
                </div>
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs"
                >
                  <span>لوحة Supabase</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div>
                <label className="block text-xs font-bold text-studio-700 mb-1">Project URL (رابط المشروع)</label>
                <input
                  type="text"
                  placeholder="https://xyzcompany.supabase.co"
                  value={formData.supabaseUrl}
                  onChange={(e) => setFormData({ ...formData, supabaseUrl: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono bg-studio-50 border border-studio-200 rounded-xl text-studio-900 outline-none focus:bg-white focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-studio-700 mb-1">Anon Public API Key</label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  value={formData.supabaseAnonKey}
                  onChange={(e) => setFormData({ ...formData, supabaseAnonKey: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono bg-studio-50 border border-studio-200 rounded-xl text-studio-900 outline-none focus:bg-white focus:border-emerald-500"
                />
              </div>

              {/* SQL Schema quick helper */}
              <div className="p-3 bg-studio-50 rounded-xl border border-studio-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-studio-700">كود إنشاء الجدول في SQL Editor:</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(supabaseSqlSchema);
                      setCopiedSchema(true);
                      setTimeout(() => setCopiedSchema(false), 2000);
                    }}
                    className="text-[10px] font-bold text-blue-600 flex items-center gap-1 hover:underline"
                  >
                    {copiedSchema ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSchema ? 'تم النسخ' : 'نسخ الكود'}</span>
                  </button>
                </div>
                <pre className="text-[10px] font-mono text-studio-600 bg-white p-2 rounded border border-studio-200 overflow-x-auto">
                  {supabaseSqlSchema}
                </pre>
              </div>

              <button
                onClick={handleSyncSupabase}
                disabled={syncStatus.loading}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${syncStatus.loading ? 'animate-spin' : ''}`} />
                <span>{syncStatus.loading ? 'جارٍ المزامنة...' : 'حفظ ومزامنة مع Supabase الآن'}</span>
              </button>
            </div>
          )}

          {/* Firebase Tab */}
          {activeTab === 'firebase' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-amber-950">قاعدة بيانات Google Firebase</h4>
                  <p className="text-[11px] text-amber-700">ربط مباشر مع Firestore لتخزين ومزامنة السكريبتات</p>
                </div>
                <a
                  href="https://console.firebase.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs"
                >
                  <span>لوحة Firebase</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-studio-700 mb-1">Project ID</label>
                  <input
                    type="text"
                    placeholder="my-teleprompter-app"
                    value={formData.firebaseConfig.projectId}
                    onChange={(e) => setFormData({
                      ...formData,
                      firebaseConfig: { ...formData.firebaseConfig, projectId: e.target.value }
                    })}
                    className="w-full px-3 py-2 text-xs font-mono bg-studio-50 border border-studio-200 rounded-xl outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-studio-700 mb-1">API Key</label>
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={formData.firebaseConfig.apiKey}
                    onChange={(e) => setFormData({
                      ...formData,
                      firebaseConfig: { ...formData.firebaseConfig, apiKey: e.target.value }
                    })}
                    className="w-full px-3 py-2 text-xs font-mono bg-studio-50 border border-studio-200 rounded-xl outline-none focus:bg-white"
                  />
                </div>
              </div>

              <button
                onClick={handleSyncFirebase}
                disabled={syncStatus.loading}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${syncStatus.loading ? 'animate-spin' : ''}`} />
                <span>{syncStatus.loading ? 'جارٍ المزامنة...' : 'حفظ ومزامنة مع Firebase الآن'}</span>
              </button>
            </div>
          )}

          {/* Backup Tab */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="p-4 bg-studio-50 rounded-2xl border border-studio-200 space-y-2">
                <h4 className="text-xs font-extrabold text-studio-900">النسخ الاحتياطي المحلي والأوفلاين 100%</h4>
                <p className="text-xs text-studio-500 leading-relaxed">
                  يتم حفظ جميع حلقاتك وإعداداتك تلقائياً على جهازك دون الحاجة لأي إنترنت. يمكنك تصدير ملف كامل بضغطة زر لنقله لأي جهاز آخر.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={downloadBackup}
                  className="py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>تصدير نسخة JSON</span>
                </button>

                <label className="py-3 px-4 rounded-xl bg-studio-100 hover:bg-studio-200 text-studio-800 font-bold text-xs flex items-center justify-center gap-2 border border-studio-200 cursor-pointer transition-all">
                  <Upload className="w-4 h-4" />
                  <span>استيراد نسخة سابقة</span>
                  <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>
          )}

          {/* Sync Status Banner */}
          {syncStatus.message && (
            <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
              syncStatus.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-studio-100 text-studio-800'
            }`}>
              {syncStatus.success ? <Check className="w-4 h-4 text-emerald-600" /> : <Info className="w-4 h-4 text-blue-600" />}
              <span>{syncStatus.message}</span>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-studio-100 bg-studio-50/50 flex justify-end">
          <button
            onClick={() => {
              handleSave();
              onClose();
            }}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-studio-800 hover:bg-studio-900 text-white shadow-xs"
          >
            تم وحفظ
          </button>
        </div>

      </div>
    </div>
  );
};
