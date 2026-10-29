import { Episode, PrompterSettings, CloudConfig } from '../types';
import { createClient } from '@supabase/supabase-js';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const EPISODES_KEY = 'teleprompter_episodes_v1';
const SETTINGS_KEY = 'teleprompter_settings_v1';
const ACTIVE_EPISODE_KEY = 'teleprompter_active_ep_id_v1';
const CLOUD_CONFIG_KEY = 'teleprompter_cloud_config_v1';

export const DEFAULT_SETTINGS: PrompterSettings = {
  chunkMode: 'sentence',
  wordsPerChunk: 8,
  wordsPerMinute: 135,
  fontSize: 42,
  fontFamily: 'Tajawal',
  lineHeight: 1.6,
  isMirrorX: false,
  isMirrorY: false,
  showUpcoming: true,
  showPrevious: true,
  dimmedOpacity: 0.35,
  outroThresholdChunks: 3,
  audioDictationEnabled: false,
  voiceProvider: 'neural-human',
  voiceId: 'ar-EG-SalmaNeural',
  elevenLabsApiKey: '',
  openAiApiKey: '',
  speechVoiceLang: 'ar-EG',
  speechPitch: 1.0,
  speechRate: 1.0,
  voiceFollowEnabled: false,
  controllerCode: 'STUDIO-789'
};

export const SAMPLE_EPISODES: Episode[] = [
  {
    id: 'ep-1',
    title: 'حلقة 1: أسرار الذكاء الاصطناعي وصناعة المحتوى 2026',
    category: 'بودكاست تقني',
    status: 'ready',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['ذكاء اصطناعي', 'تقنية', 'بودكاست'],
    savedChunkIndex: 0,
    targetDurationSeconds: 180,
    notes: 'تأكد من الحفاظ على نبرة واثقة وهادئة في البداية.',
    content: `أهلاً وسهلاً بكم أعزائي المشاهدين في حلقة جديدة ومميزة من برنامجنا. [ابتسامة وترحيب]
اليوم سنتحدث عن ثورة الذكاء الاصطناعي وكيف أعادت تشكيل حياتنا اليومية والمهنية.
هل تساءلتم يوماً كيف يمكن لأداة مثل ChatGPT أو Gemini أن تضاعف إنتاجيتكم في دقائق معدودة؟ [وقفة للتنفس]
السر يكمن في ما يسمى بالـ Prompt Engineering أو هندسة الأوامر الذكية.
عندما تخاطب الذكاء الاصطناعي بسياق واضح وهدف محدد، ستحصل على نتائج تفوق التوقعات!
[نبرة حماسية] دعونا نستعرض معاً ثلاث خطوات عملية ستغير طريقتكم في العمل للأبد.
الخطوة الأولى هي تحديد الدور، مثل أن تقول له: تصرف كخبير تسويق محترف.
أما الخطوة الثانية فهي تزويده بأمثلة سابقة لما ترغب في تحقيقه بالضبط.
وأخيراً، اطلب منه تحسين النتيجة عبر عدة مسودات قبل الوصول للصيغة النهائية.
بهذه الطريقة البسيطة، ستتحول من مجرد مستخدم عادي إلى قائد حقيقي في مجالك. [وقفة قصيرة]
أتمنى أن تكون هذه النصائح مفيدة وملهمة لكم جميعاً.
شكراً لحسن متابعتكم، ولا تنسوا الاشتراك في القناة ومشاركة آرائكم في التعليقات.
ألقاكم في الحلقة القادمة بإذن الله، دمتم في أمان الله ورعايته.`
  },
  {
    id: 'ep-2',
    title: 'حلقة 2: ٣ نصائح ذهبية لإدارة الوقت بدون إجهاد',
    category: 'تطوير ذات',
    status: 'draft',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    tags: ['إنتاجية', 'إدارة وقت', 'نصائح'],
    savedChunkIndex: 0,
    targetDurationSeconds: 120,
    notes: 'مقطع سريع مناسب لريلز وتيك توك.',
    content: `السلام عليكم جميعاً. هل تشعرون أن اليوم ينتهي دائماً قبل أن تنجزوا نصف مهامكم؟
لستم وحدكم! المشكلة ليست في قلة الوقت، بل في طريقة توزيعه. [وقفة]
القاعدة الذهبية الأولى هي مبدأ باريتو الشهير: 80% من نتائجك تأتي من 20% فقط من مجهودك.
ركز كل صباح على أهم مهمتين ستحدثان فارقاً حقيقياً في يومك.
القاعدة الثانية: تجنب الـ Multitasking أو تعدد المهام في نفس اللحظة؛ فالتركيز العميق هو المفتاح.
والقاعدة الثالثة: خذ فترات راحة قصيرة كل 25 دقيقة لتجديد طاقتك الذهنية.
جربوا هذه الخطوات اليوم وشاركوني التغيير في التعليقات! دمتم بخير.`
  },
  {
    id: 'ep-3',
    title: 'حلقة 3: نشرة الأخبار الاقتصادية والأسواق العالمية',
    category: 'أخبار',
    status: 'recorded',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
    tags: ['اقتصاد', 'أسواق', 'ذهب'],
    savedChunkIndex: 0,
    targetDurationSeconds: 240,
    notes: 'نبرة رسمية وهادئة.',
    content: `طابت أوقاتكم، إليكم أبرز تطورات أسواق المال والذهب لهذا الأسبوع.
سجلت أسعار الذهب استقراراً ملحوظاً بالقرب من أعلى مستوياتها التاريخية وسط ترقب لبيانات التضخم الأمريكية.
وفي قطاع الطاقة، تراجعت أسعار النفط بشكل طفيف بعد تقارير زيادة المخزونات العالمية.
من جهة أخرى، واصلت أسهم قطاع التكنولوجيا قيادة المكاسب في البورصات العالمية مدفوعة بنتائج أعمال قوية.
نصل معكم إلى ختام نشرتنا الاقتصادية، نلقاكم على رأس الساعة بتفاصيل أوفى.`
  }
];

export const DEFAULT_CLOUD_CONFIG: CloudConfig = {
  provider: 'local',
  supabaseUrl: '',
  supabaseAnonKey: '',
  firebaseConfig: {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  },
  syncEnabled: false
};

class StorageService {
  getEpisodes(): Episode[] {
    try {
      const data = localStorage.getItem(EPISODES_KEY);
      if (!data) {
        this.saveEpisodes(SAMPLE_EPISODES);
        return SAMPLE_EPISODES;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load episodes from local storage:', e);
      return SAMPLE_EPISODES;
    }
  }

  saveEpisodes(episodes: Episode[]): void {
    try {
      localStorage.setItem(EPISODES_KEY, JSON.stringify(episodes));
    } catch (e) {
      console.error('Failed to save episodes:', e);
    }
  }

  saveSingleEpisode(episode: Episode): void {
    const episodes = this.getEpisodes();
    const index = episodes.findIndex(e => e.id === episode.id);
    if (index >= 0) {
      episodes[index] = { ...episode, updatedAt: new Date().toISOString() };
    } else {
      episodes.unshift({ ...episode, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    this.saveEpisodes(episodes);
  }

  deleteEpisode(id: string): void {
    const episodes = this.getEpisodes().filter(e => e.id !== id);
    this.saveEpisodes(episodes);
  }

  getActiveEpisodeId(): string {
    return localStorage.getItem(ACTIVE_EPISODE_KEY) || 'ep-1';
  }

  setActiveEpisodeId(id: string): void {
    localStorage.setItem(ACTIVE_EPISODE_KEY, id);
  }

  updateSavedChunkIndex(episodeId: string, chunkIndex: number): void {
    const episodes = this.getEpisodes();
    const ep = episodes.find(e => e.id === episodeId);
    if (ep) {
      ep.savedChunkIndex = chunkIndex;
      ep.updatedAt = new Date().toISOString();
      this.saveEpisodes(episodes);
    }
  }

  getSettings(): PrompterSettings {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      if (!data) {
        this.saveSettings(DEFAULT_SETTINGS);
        return DEFAULT_SETTINGS;
      }
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch (e) {
      console.error('Failed to load settings:', e);
      return DEFAULT_SETTINGS;
    }
  }

  saveSettings(settings: PrompterSettings): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }

  getCloudConfig(): CloudConfig {
    try {
      const data = localStorage.getItem(CLOUD_CONFIG_KEY);
      if (!data) return DEFAULT_CLOUD_CONFIG;
      return { ...DEFAULT_CLOUD_CONFIG, ...JSON.parse(data) };
    } catch (e) {
      return DEFAULT_CLOUD_CONFIG;
    }
  }

  saveCloudConfig(config: CloudConfig): void {
    localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify(config));
  }

  // Backup & Restore
  exportBackup(): string {
    const backup = {
      episodes: this.getEpisodes(),
      settings: this.getSettings(),
      cloudConfig: this.getCloudConfig(),
      exportDate: new Date().toISOString()
    };
    return JSON.stringify(backup, null, 2);
  }

  importBackup(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.episodes)) {
        this.saveEpisodes(data.episodes);
      }
      if (data.settings) {
        this.saveSettings({ ...DEFAULT_SETTINGS, ...data.settings });
      }
      return true;
    } catch (e) {
      console.error('Import backup failed:', e);
      return false;
    }
  }

  // Supabase Sync integration
  async syncWithSupabase(config: CloudConfig): Promise<{ success: boolean; message: string }> {
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      return { success: false, message: 'يرجى إدخال رابط المشروع (Supabase URL) والمفتاح (Anon Key)' };
    }

    try {
      const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
      const episodes = this.getEpisodes();

      // Upsert episodes to Supabase
      const { error } = await supabase.from('episodes').upsert(
        episodes.map(e => ({
          id: e.id,
          title: e.id,
          category: e.category,
          status: e.status,
          content: e.content,
          saved_chunk_index: e.savedChunkIndex,
          tags: e.tags,
          updated_at: new Date().toISOString()
        }))
      );

      if (error) {
        throw error;
      }

      this.saveCloudConfig({
        ...config,
        lastSyncTime: new Date().toISOString()
      });

      return { success: true, message: 'تمت المزامنة بنجاح مع Supabase!' };
    } catch (err: any) {
      return { success: false, message: `فشلت المزامنة: ${err.message || 'خطأ في الاتصال'}` };
    }
  }

  // Firebase Sync integration
  async syncWithFirebase(config: CloudConfig): Promise<{ success: boolean; message: string }> {
    if (!config.firebaseConfig?.projectId || !config.firebaseConfig?.apiKey) {
      return { success: false, message: 'يرجى إدخال بيانات مشروع Firebase (Project ID & API Key)' };
    }

    try {
      const app = getApps().length === 0 ? initializeApp(config.firebaseConfig) : getApps()[0];
      const db = getFirestore(app);
      const episodes = this.getEpisodes();

      for (const ep of episodes) {
        await setDoc(doc(db, 'episodes', ep.id), ep, { merge: true });
      }

      this.saveCloudConfig({
        ...config,
        lastSyncTime: new Date().toISOString()
      });

      return { success: true, message: 'تمت المزامنة بنجاح مع Firebase Firestore!' };
    } catch (err: any) {
      return { success: false, message: `فشلت المزامنة: ${err.message || 'خطأ في الاتصال'}` };
    }
  }
}

export const storageService = new StorageService();
