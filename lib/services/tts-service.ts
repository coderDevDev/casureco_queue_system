/**
 * Text-to-Speech Service
 * Handles audio announcements for ticket calls
 */

interface TTSOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

class TTSService {
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private isEnabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    if (this.synth) {
      this.voices = this.synth.getVoices();
      console.log('🔊 TTS: Loaded voices:', this.voices.length);
    }
  }

  isSupported(): boolean {
    return this.synth !== null;
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  private selectVoice(lang: string = 'en-US'): SpeechSynthesisVoice | null {
    if (this.voices.length === 0) {
      this.loadVoices();
    }

    let voice = this.voices.find(v => v.lang === lang);
    if (!voice) {
      voice = this.voices.find(v => v.lang.startsWith('en'));
    }
    if (!voice && this.voices.length > 0) {
      voice = this.voices[0];
    }

    return voice || null;
  }

  speak(text: string, options: TTSOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported() || !this.isEnabled || !this.synth) {
        resolve();
        return;
      }

      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      const voice = this.selectVoice(options.lang);
      if (voice) {
        utterance.voice = voice;
      }

      utterance.lang = options.lang || 'en-US';
      utterance.rate = options.rate || 0.9;
      utterance.pitch = options.pitch || 1.0;
      utterance.volume = options.volume || 1.0;

      utterance.onend = () => {
        console.log('🔊 TTS: Finished:', text);
        resolve();
      };

      utterance.onerror = (event) => {
        console.error('🔊 TTS: Error:', event.error);
        reject(new Error(`Speech error: ${event.error}`));
      };

      console.log('🔊 TTS: Speaking:', text);
      this.synth.speak(utterance);
    });
  }

  async announceTicket(
    ticketNumber: string,
    counterName: string,
    options: TTSOptions = {}
  ): Promise<void> {
    const message = `Ticket ${ticketNumber}, please proceed to ${counterName}`;
    return this.speak(message, options);
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }
}

export const ttsService = new TTSService();