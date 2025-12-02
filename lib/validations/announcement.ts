import { z } from 'zod';

export const announcementSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters'),
  
  message: z.string()
    .min(10, 'Message must be at least 10 characters')
    .max(500, 'Message must be less than 500 characters'),
  
  type: z.enum(['info', 'warning', 'success', 'error'], {
    required_error: 'Please select an announcement type',
  }),
  
  content_type: z.enum(['text', 'video', 'image', 'slideshow'], {
    required_error: 'Please select a content type',
  }),
  
  media_url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  
  media_urls: z.string().optional(),
  
  thumbnail_url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  
  audio_url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  
  enable_tts: z.boolean().default(false),
  
  tts_voice: z.enum(['default', 'male', 'female']).default('default'),
  
  tts_speed: z.number()
    .min(0.5, 'Speed must be at least 0.5')
    .max(2.0, 'Speed must be at most 2.0')
    .default(1.0),
  
  play_audio_on_display: z.boolean().default(false),
  
  loop_media: z.boolean().default(true),
  
  transition_duration: z.number()
    .min(1, 'Transition must be at least 1 second')
    .max(30, 'Transition must be at most 30 seconds')
    .default(5),
  
  branch_id: z.string().optional(),
  
  display_duration: z.number()
    .min(1, 'Duration must be at least 1 second')
    .max(300, 'Duration must be at most 300 seconds'),
  
  priority: z.number()
    .min(0, 'Priority must be at least 0')
    .max(10, 'Priority must be at most 10')
    .default(0),
  
  start_date: z.string().optional(),
  
  end_date: z.string().optional(),
  
  is_active: z.boolean().default(true),
}).refine((data) => {
  // If content_type is video or image, media_url is required
  if ((data.content_type === 'video' || data.content_type === 'image') && !data.media_url) {
    return false;
  }
  return true;
}, {
  message: 'Media URL is required for video and image content types',
  path: ['media_url'],
}).refine((data) => {
  // If content_type is slideshow, media_urls is required
  if (data.content_type === 'slideshow' && !data.media_urls) {
    return false;
  }
  return true;
}, {
  message: 'Image URLs are required for slideshow content type',
  path: ['media_urls'],
}).refine((data) => {
  // If end_date is provided, it must be after start_date
  if (data.start_date && data.end_date) {
    return new Date(data.end_date) > new Date(data.start_date);
  }
  return true;
}, {
  message: 'End date must be after start date',
  path: ['end_date'],
});

export type AnnouncementFormData = z.infer<typeof announcementSchema>;
