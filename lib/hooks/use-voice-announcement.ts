import { useEffect, useRef } from 'react';

interface VoiceAnnouncementOptions {
  text: string;
  enableTTS: boolean;
  ttsVoice: string;
  ttsSpeed: number;
  audioUrl?: string;
  playAudioOnDisplay: boolean;
}

export function useVoiceAnnouncement(options: VoiceAnnouncementOptions | null) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!options) return;

    // Cleanup function
    const cleanup = () => {
      // Stop any ongoing speech
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      
      // Stop and cleanup audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
    };

    // Priority 1: Pre-recorded audio
    if (options.audioUrl && options.playAudioOnDisplay) {
      try {
        const audio = new Audio(options.audioUrl);
        audio.volume = 0.8;
        audio.play().catch((error) => {
          console.error('Error playing audio:', error);
          // Fallback to TTS if audio fails
          if (options.enableTTS) {
            playTTS();
          }
        });
        audioRef.current = audio;
      } catch (error) {
        console.error('Error creating audio:', error);
        // Fallback to TTS
        if (options.enableTTS) {
          playTTS();
        }
      }
    }
    // Priority 2: Text-to-Speech
    else if (options.enableTTS && options.text) {
      playTTS();
    }

    function playTTS() {
      if (!('speechSynthesis' in window)) {
        console.warn('Text-to-Speech not supported in this browser');
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(options!.text);
      utterance.rate = options!.ttsSpeed || 1.0;
      utterance.volume = 0.8;
      utterance.pitch = 1.0;

      // Try to select voice based on preference
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const voicePreference = options!.ttsVoice?.toLowerCase();
        
        let selectedVoice = voices.find(voice => {
          if (voicePreference === 'male') {
            return voice.name.toLowerCase().includes('male') || 
                   voice.name.toLowerCase().includes('david') ||
                   voice.name.toLowerCase().includes('mark');
          } else if (voicePreference === 'female') {
            return voice.name.toLowerCase().includes('female') || 
                   voice.name.toLowerCase().includes('samantha') ||
                   voice.name.toLowerCase().includes('victoria');
          }
          return false;
        });

        // Fallback to first available voice
        if (!selectedVoice) {
          selectedVoice = voices[0];
        }

        utterance.voice = selectedVoice;
      }

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
      };

      synthRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }

    // Cleanup on unmount or when options change
    return cleanup;
  }, [options?.text, options?.enableTTS, options?.audioUrl, options?.ttsVoice, options?.ttsSpeed, options?.playAudioOnDisplay]);

  // Ensure voices are loaded (some browsers need this)
  useEffect(() => {
    if ('speechSynthesis' in window) {
      // Load voices
      window.speechSynthesis.getVoices();
      
      // Some browsers fire this event when voices are loaded
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  return {
    stopAnnouncement: () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  };
}
