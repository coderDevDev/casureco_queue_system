'use client';

import { useState, useEffect } from 'react';
import { FileText, Play } from 'lucide-react';
import { useVoiceAnnouncement } from '@/lib/hooks/use-voice-announcement';

interface Announcement {
  id: string;
  title: string;
  message: string;
  content_type: 'text' | 'video' | 'image' | 'slideshow';
  media_url?: string;
  media_urls?: string[];
  audio_url?: string;
  enable_tts: boolean;
  tts_voice: string;
  tts_speed: number;
  play_audio_on_display: boolean;
  loop_media: boolean;
  transition_duration: number;
}

interface DynamicContentDisplayProps {
  announcement: Announcement | null;
}

export function DynamicContentDisplay({ announcement }: DynamicContentDisplayProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Voice announcement hook
  const voiceOptions = announcement ? {
    text: `${announcement.title}. ${announcement.message}`,
    enableTTS: announcement.enable_tts,
    ttsVoice: announcement.tts_voice,
    ttsSpeed: announcement.tts_speed,
    audioUrl: announcement.audio_url,
    playAudioOnDisplay: announcement.play_audio_on_display
  } : null;

  useVoiceAnnouncement(voiceOptions);

  // Slideshow auto-advance
  useEffect(() => {
    if (announcement?.content_type === 'slideshow' && announcement.media_urls && announcement.media_urls.length > 0) {
      const interval = setInterval(() => {
        setCurrentSlideIndex((prev) => 
          (prev + 1) % announcement.media_urls!.length
        );
      }, (announcement.transition_duration || 5) * 1000);

      return () => clearInterval(interval);
    }
  }, [announcement]);

  // Reset slide index when announcement changes
  useEffect(() => {
    if (announcement?.id) {
      setCurrentSlideIndex(0);
    }
  }, [announcement?.id]);

  if (!announcement) {
    return (
      <div className="relative h-full w-full overflow-hidden  bg-gradient-to-br from-gray-900 to-gray-800 shadow-2xl flex items-center justify-center">
        <div className="text-center text-white">
          <FileText className="h-24 w-24 mx-auto mb-4 opacity-30" />
          <p className="text-xl font-semibold opacity-50">No Content Available</p>
        </div>
      </div>
    );
  }

  // TEXT CONTENT
  if (announcement.content_type === 'text') {
    return (
      <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 shadow-2xl">
        {/* Decorative background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-yellow-400 blur-3xl" />
          <div className="absolute left-0 bottom-0 h-64 w-64 rounded-full bg-blue-400 blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative h-full flex flex-col items-center justify-center p-12 text-center">
          <div className="mb-6 bg-white/10 p-4 backdrop-blur-sm">
            <FileText className="h-16 w-16 text-yellow-400" />
          </div>
          <h2 className="text-5xl font-black text-white mb-6 drop-shadow-lg">
            {announcement.title}
          </h2>
          <p className="text-2xl font-medium text-white/90 max-w-4xl leading-relaxed">
            {announcement.message}
          </p>
        </div>
      </div>
    );
  }

  // VIDEO CONTENT
  if (announcement.content_type === 'video' && announcement.media_url) {
    // Check if it's a YouTube URL
    const isYouTube = announcement.media_url.includes('youtube.com') || announcement.media_url.includes('youtu.be');
    
    if (isYouTube) {
      // Extract YouTube video ID
      let videoId = '';
      if (announcement.media_url.includes('embed/')) {
        videoId = announcement.media_url.split('embed/')[1].split('?')[0];
      } else if (announcement.media_url.includes('watch?v=')) {
        videoId = announcement.media_url.split('watch?v=')[1].split('&')[0];
      } else if (announcement.media_url.includes('youtu.be/')) {
        videoId = announcement.media_url.split('youtu.be/')[1].split('?')[0];
      }

      return (
        <div className="relative h-full w-full overflow-hidden bg-black shadow-2xl">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=${announcement.loop_media ? 1 : 0}&playlist=${videoId}`}
            title={announcement.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    // Regular video file
    return (
      <div className="relative h-full w-full overflow-hidden bg-black shadow-2xl">
        <video
          className="h-full w-full object-cover"
          src={announcement.media_url}
          autoPlay
          loop={announcement.loop_media}
          muted
          playsInline
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        >
          Your browser does not support the video tag.
        </video>
        
        {/* Play/Pause indicator */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="rounded-full bg-white/90 p-6 shadow-2xl">
              <Play className="h-12 w-12 text-gray-900" />
            </div>
          </div>
        )}
      </div>
    );
  }

  // IMAGE CONTENT
  if (announcement.content_type === 'image' && announcement.media_url) {
    return (
      <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 shadow-2xl">
        <img
          src={announcement.media_url}
          alt={announcement.title}
          className="h-full w-full object-cover"
        />
        
        {/* Optional overlay with title */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8">
          <h3 className="text-3xl font-bold text-white drop-shadow-lg">
            {announcement.title}
          </h3>
          {announcement.message && (
            <p className="mt-2 text-lg text-white/90">
              {announcement.message}
            </p>
          )}
        </div>
      </div>
    );
  }

  // SLIDESHOW CONTENT
  if (announcement.content_type === 'slideshow' && announcement.media_urls && announcement.media_urls.length > 0) {
    const currentImage = announcement.media_urls[currentSlideIndex];

    return (
      <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 shadow-2xl">
        {/* Current Image */}
        <img
          key={currentSlideIndex}
          src={currentImage}
          alt={`${announcement.title} - Slide ${currentSlideIndex + 1}`}
          className="h-full w-full object-cover transition-opacity duration-1000"
        />
        
        {/* Overlay with info */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8">
          <h3 className="text-3xl font-bold text-white drop-shadow-lg">
            {announcement.title}
          </h3>
          {announcement.message && (
            <p className="mt-2 text-lg text-white/90">
              {announcement.message}
            </p>
          )}
          
          {/* Slide indicators */}
          <div className="mt-4 flex items-center gap-2">
            {announcement.media_urls.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentSlideIndex
                    ? 'w-8 bg-yellow-400'
                    : 'w-2 bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 shadow-2xl flex items-center justify-center">
      <div className="text-center text-white">
        <FileText className="h-24 w-24 mx-auto mb-4 opacity-30" />
        <p className="text-xl font-semibold opacity-50">Invalid Content Configuration</p>
      </div>
    </div>
  );
}
