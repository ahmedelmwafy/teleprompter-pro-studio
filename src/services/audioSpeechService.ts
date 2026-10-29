import { PrompterSettings } from '../types';

class AudioSpeechService {
  private currentAudio: HTMLAudioElement | null = null;
  private synth: SpeechSynthesis | null = null;
  private recognition: any = null;
  private isListening: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  /**
   * Main Speak function supporting 100% Free Human Neural Voices
   */
  async speakText(
    text: string,
    settings?: Partial<PrompterSettings>
  ): Promise<void> {
    this.stop();

    const clean = text.replace(/\[.*?\]/g, '').trim();
    if (!clean) return;

    const voice = settings?.voiceId || 'ar-EG-SalmaNeural';
    const ratePct = settings?.speechRate ? Math.round((settings.speechRate - 1.0) * 50) : 0;
    const rateStr = ratePct >= 0 ? `+${ratePct}%` : `${ratePct}%`;

    try {
      const query = new URLSearchParams({
        text: clean,
        voice: voice,
        rate: rateStr
      });

      const audioUrl = `/api/tts?${query.toString()}`;
      const audio = new Audio(audioUrl);
      this.currentAudio = audio;

      await new Promise<void>((resolve) => {
        audio.onended = () => {
          this.currentAudio = null;
          resolve();
        };
        audio.onerror = (e) => {
          console.warn('Audio playback error, falling back:', e);
          this.currentAudio = null;
          resolve();
        };

        audio.play().catch(err => {
          console.warn('Audio play was interrupted or prevented:', err);
          resolve();
        });
      });

      return;
    } catch (err) {
      console.warn('Neural TTS failed:', err);
    }
  }

  /**
   * Pre-fetch next chunk audio for 0ms latency in earpiece
   */
  prefetchAudio(text: string, settings?: Partial<PrompterSettings>) {
    const clean = text.replace(/\[.*?\]/g, '').trim();
    if (!clean) return;

    const voice = settings?.voiceId || 'ar-EG-SalmaNeural';
    const ratePct = settings?.speechRate ? Math.round((settings.speechRate - 1.0) * 50) : 0;
    const rateStr = ratePct >= 0 ? `+${ratePct}%` : `${ratePct}%`;

    const query = new URLSearchParams({
      text: clean,
      voice: voice,
      rate: rateStr
    });

    const audio = new Audio();
    audio.src = `/api/tts?${query.toString()}`;
    audio.preload = 'auto';
  }

  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }

    if (this.synth) {
      this.synth.cancel();
    }
  }

  /**
   * Start speech recognition to follow presenter voice
   */
  startVoiceTracking(
    getCurrentTargetWords: () => string[],
    onAdvance: () => void
  ): boolean {
    if (typeof window === 'undefined') return false;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return false;
    }

    try {
      if (this.recognition) {
        this.recognition.stop();
      }

      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'ar-EG';

      this.recognition.onresult = (event: any) => {
        const lastResult = event.results[event.results.length - 1];
        const spokenText = lastResult[0].transcript.trim().toLowerCase();
        
        const targetWords = getCurrentTargetWords().map(w => w.toLowerCase());
        if (targetWords.length === 0) return;

        const lastFewTargetWords = targetWords.slice(-3);
        const matchesCount = lastFewTargetWords.filter(w => spokenText.includes(w)).length;

        if (matchesCount >= Math.min(2, lastFewTargetWords.length) || spokenText.length > targetWords.join(' ').length * 0.8) {
          onAdvance();
        }
      };

      this.recognition.onerror = () => {};

      this.recognition.onend = () => {
        if (this.isListening) {
          try {
            this.recognition.start();
          } catch (e) {
            // ignore
          }
        }
      };

      this.isListening = true;
      this.recognition.start();
      return true;
    } catch (e) {
      return false;
    }
  }

  stopVoiceTracking() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
      this.recognition = null;
    }
  }
}

export const audioSpeech = new AudioSpeechService();
