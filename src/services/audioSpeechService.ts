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

    // 1. Try local/server neural TTS proxy first
    try {
      const query = new URLSearchParams({
        text: clean,
        voice: voice,
        rate: rateStr
      });

      const audioUrl = `/api/tts?${query.toString()}`;
      const audio = new Audio(audioUrl);
      this.currentAudio = audio;

      const playedOk = await new Promise<boolean>((resolve) => {
        let isResolved = false;

        audio.onended = () => {
          if (!isResolved) {
            isResolved = true;
            this.currentAudio = null;
            resolve(true);
          }
        };

        audio.onerror = () => {
          if (!isResolved) {
            isResolved = true;
            this.currentAudio = null;
            resolve(false);
          }
        };

        // Timeout in case server doesn't respond
        setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            resolve(false);
          }
        }, 5000);

        audio.play().catch(() => {
          if (!isResolved) {
            isResolved = true;
            resolve(false);
          }
        });
      });

      if (playedOk) return;
    } catch (err) {
      console.warn('Local TTS failed, falling back to online/browser speech:', err);
    }

    // 2. Direct Web Natural Arabic TTS (Works anywhere without local server)
    try {
      const targetLang = /[\u0600-\u06FF]/.test(clean) ? 'ar' : 'en';
      const webUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${targetLang}&client=tw-ob&q=${encodeURIComponent(clean)}`;
      const webAudio = new Audio(webUrl);
      this.currentAudio = webAudio;

      const playedWeb = await new Promise<boolean>((resolve) => {
        webAudio.onended = () => {
          this.currentAudio = null;
          resolve(true);
        };
        webAudio.onerror = () => {
          this.currentAudio = null;
          resolve(false);
        };
        webAudio.play().catch(() => resolve(false));
      });

      if (playedWeb) return;
    } catch (e) {
      // ignore
    }

    // 3. Fallback to Browser SpeechSynthesis
    await this.speakBrowserSpeech(clean, settings);
  }

  private speakBrowserSpeech(text: string, settings?: Partial<PrompterSettings>): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth) {
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      const isArabic = /[\u0600-\u06FF]/.test(text);
      utterance.lang = isArabic ? 'ar-SA' : 'en-US';
      utterance.rate = settings?.speechRate || 1.0;

      const voices = this.synth.getVoices();
      if (voices.length > 0) {
        const naturalVoice = voices.find(v => 
          (v.lang.startsWith('ar') || v.lang.startsWith(utterance.lang.split('-')[0])) && 
          (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Enhanced'))
        ) || voices.find(v => v.lang.startsWith(utterance.lang.split('-')[0]));

        if (naturalVoice) utterance.voice = naturalVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      this.synth.speak(utterance);
    });
  }

  prefetchAudio(text: string, settings?: Partial<PrompterSettings>) {
    const clean = text.replace(/\[.*?\]/g, '').trim();
    if (!clean) return;

    const voice = settings?.voiceId || 'ar-EG-SalmaNeural';
    const ratePct = settings?.speechRate ? Math.round((settings.speechRate - 1.0) * 50) : 0;
    const rateStr = ratePct >= 0 ? `+${ratePct}%` : `${ratePct}%`;

    const audio = new Audio();
    audio.src = `/api/tts?text=${encodeURIComponent(clean)}&voice=${voice}&rate=${rateStr}`;
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

  startVoiceTracking(
    getCurrentTargetWords: () => string[],
    onAdvance: () => void
  ): boolean {
    if (typeof window === 'undefined') return false;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return false;

    try {
      if (this.recognition) this.recognition.stop();

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
          try { this.recognition.start(); } catch (e) {}
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
      try { this.recognition.stop(); } catch (e) {}
      this.recognition = null;
    }
  }
}

export const audioSpeech = new AudioSpeechService();
