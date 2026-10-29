export type EpisodeStatus = 'draft' | 'ready' | 'recorded' | 'archived';

export type ChunkMode = 'sentence' | 'half-sentence' | 'custom-words';

export interface ScriptChunk {
  id: string;
  index: number;
  text: string;
  wordCount: number;
  estimatedSeconds: number;
  isOutro: boolean;
  cueType?: 'normal' | 'pause' | 'emphasis' | 'bilingual';
}

export interface Episode {
  id: string;
  title: string;
  category: string;
  status: EpisodeStatus;
  content: string;
  savedChunkIndex: number;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  notes?: string;
  targetDurationSeconds?: number;
  recordedDurationSeconds?: number;
}

export type VoiceProvider = 'neural-human' | 'elevenlabs' | 'openai' | 'browser';

export interface PrompterSettings {
  chunkMode: ChunkMode;
  wordsPerChunk: number;
  wordsPerMinute: number;
  fontSize: number; // in pixels
  fontFamily: 'Tajawal' | 'Cairo' | 'system-ui';
  lineHeight: number;
  isMirrorX: boolean;
  isMirrorY: boolean;
  showUpcoming: boolean;
  showPrevious: boolean;
  dimmedOpacity: number;
  outroThresholdChunks: number;
  audioDictationEnabled: boolean; // Text to Speech "يمليني في الودن"
  voiceProvider: VoiceProvider;
  voiceId: string;
  elevenLabsApiKey?: string;
  openAiApiKey?: string;
  speechVoiceLang: 'ar-SA' | 'ar-EG' | 'en-US';
  speechPitch: number;
  speechRate: number;
  voiceFollowEnabled: boolean; // Speech Recognition to follow presenter
  controllerCode: string;
}

export type ControllerActionType = 
  | 'NEXT' 
  | 'PREV' 
  | 'FIRST' 
  | 'LAST' 
  | 'JUMP' 
  | 'TOGGLE_PLAY' 
  | 'SPEED_UP' 
  | 'SPEED_DOWN' 
  | 'FONT_LARGER' 
  | 'FONT_SMALLER' 
  | 'TOGGLE_AUDIO_DICTATION';

export interface ControllerMessage {
  type: ControllerActionType;
  payload?: any;
  senderId: string;
  timestamp: number;
}

export interface CloudConfig {
  provider: 'local' | 'supabase' | 'firebase';
  supabaseUrl: string;
  supabaseAnonKey: string;
  firebaseConfig: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  syncEnabled: boolean;
  lastSyncTime?: string;
  userEmail?: string;
}
