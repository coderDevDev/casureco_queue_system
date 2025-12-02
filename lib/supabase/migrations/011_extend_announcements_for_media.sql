-- =====================================================
-- EXTEND ANNOUNCEMENTS TABLE FOR MEDIA SUPPORT
-- Migration: 011_extend_announcements_for_media.sql
-- Purpose: Add support for video, image, and audio content in announcements
-- =====================================================

-- Add new columns for media content
ALTER TABLE announcements
ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'video', 'image', 'slideshow')),
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_urls TEXT[], -- For slideshow/multiple images
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS audio_url TEXT,
ADD COLUMN IF NOT EXISTS enable_tts BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tts_voice TEXT DEFAULT 'default',
ADD COLUMN IF NOT EXISTS tts_speed DECIMAL(3,2) DEFAULT 1.0 CHECK (tts_speed >= 0.5 AND tts_speed <= 2.0),
ADD COLUMN IF NOT EXISTS play_audio_on_display BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS loop_media BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS transition_duration INTEGER DEFAULT 5; -- seconds for slideshow transitions

-- Add index for content type queries
CREATE INDEX IF NOT EXISTS idx_announcements_content_type ON announcements(content_type, is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_branch_active ON announcements(branch_id, is_active, priority DESC);

-- Add comments for documentation
COMMENT ON COLUMN announcements.content_type IS 'Type of content: text, video, image, or slideshow';
COMMENT ON COLUMN announcements.media_url IS 'URL for single video or image';
COMMENT ON COLUMN announcements.media_urls IS 'Array of URLs for slideshow';
COMMENT ON COLUMN announcements.thumbnail_url IS 'Thumbnail/preview image URL';
COMMENT ON COLUMN announcements.audio_url IS 'URL for pre-recorded audio announcement';
COMMENT ON COLUMN announcements.enable_tts IS 'Enable text-to-speech for this announcement';
COMMENT ON COLUMN announcements.tts_voice IS 'Voice selection for TTS (default, male, female, etc.)';
COMMENT ON COLUMN announcements.tts_speed IS 'Speech speed multiplier (0.5 to 2.0)';
COMMENT ON COLUMN announcements.play_audio_on_display IS 'Auto-play audio when displayed';
COMMENT ON COLUMN announcements.loop_media IS 'Loop video/slideshow content';
COMMENT ON COLUMN announcements.transition_duration IS 'Duration in seconds for slideshow transitions';

-- Update existing announcements to have default content_type
UPDATE announcements 
SET content_type = 'text' 
WHERE content_type IS NULL;
