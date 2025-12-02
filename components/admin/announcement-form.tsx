'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { announcementSchema, type AnnouncementFormData } from '@/lib/validations/announcement';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Video, Image as ImageIcon, FileText, Volume2, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CloudinaryUpload } from '@/components/ui/cloudinary-upload';

interface Branch {
  id: string;
  name: string;
}

interface AnnouncementFormProps {
  defaultValues?: Partial<AnnouncementFormData>;
  branches: Branch[];
  onSubmit: (data: AnnouncementFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function AnnouncementForm({ 
  defaultValues, 
  branches, 
  onSubmit, 
  onCancel,
  isSubmitting = false 
}: AnnouncementFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      type: 'info',
      content_type: 'text',
      enable_tts: false,
      tts_voice: 'default',
      tts_speed: 1.0,
      play_audio_on_display: false,
      loop_media: true,
      transition_duration: 5,
      display_duration: 10,
      priority: 0,
      is_active: true,
      ...defaultValues,
    },
  });

  const contentType = watch('content_type');
  const enableTts = watch('enable_tts');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information Section */}
      <div className="space-y-4 p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
          <div className="p-2 rounded-xl bg-blue-600 shadow-md">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Basic Information</h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-medium">
            Title <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            {...register('title')}
            placeholder="Enter announcement title"
            className={cn(errors.title && 'border-red-500 focus-visible:ring-red-500')}
          />
          {errors.title && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.title.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="message" className="text-sm font-medium">
            Message <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="message"
            {...register('message')}
            placeholder="Enter announcement message"
            rows={3}
            className={cn(errors.message && 'border-red-500 focus-visible:ring-red-500')}
          />
          {errors.message && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.message.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="type" className="text-sm font-medium">
              Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={watch('type')}
              onValueChange={(value) => setValue('type', value as 'info' | 'warning' | 'success' | 'error')}
            >
              <SelectTrigger className={cn(errors.type && 'border-red-500')}>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <span>Info</span>
                  </div>
                </SelectItem>
                <SelectItem value="warning">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-yellow-500" />
                    <span>Warning</span>
                  </div>
                </SelectItem>
                <SelectItem value="success">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span>Success</span>
                  </div>
                </SelectItem>
                <SelectItem value="error">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    <span>Error</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.type.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority" className="text-sm font-medium">
              Priority (0-10)
            </Label>
            <Input
              id="priority"
              type="number"
              {...register('priority', { valueAsNumber: true })}
              min="0"
              max="10"
              className={cn(errors.priority && 'border-red-500')}
            />
            {errors.priority && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.priority.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content Type Section */}
      <div className="space-y-4 p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
          <div className="p-2 rounded-xl bg-purple-600 shadow-md">
            <Video className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Content Settings</h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor="content_type" className="text-sm font-medium">
            Content Type <span className="text-red-500">*</span>
          </Label>
          <Select
            value={contentType}
            onValueChange={(value) => setValue('content_type', value as 'text' | 'video' | 'image' | 'slideshow')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Text Only</span>
                </div>
              </SelectItem>
              <SelectItem value="video">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  <span>Video</span>
                </div>
              </SelectItem>
              <SelectItem value="image">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  <span>Image</span>
                </div>
              </SelectItem>
              <SelectItem value="slideshow">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  <span>Slideshow</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Conditional Media Fields */}
        {(contentType === 'video' || contentType === 'image') && (
          <div className="space-y-2">
            <Label htmlFor="media_url" className="text-sm font-medium">
              {contentType === 'video' ? 'Video' : 'Image'} <span className="text-red-500">*</span>
            </Label>
            <CloudinaryUpload
              type={contentType}
              value={watch('media_url')}
              onChange={(url) => setValue('media_url', url as string)}
            />
            {errors.media_url && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.media_url.message}
              </p>
            )}
          </div>
        )}

        {contentType === 'slideshow' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="media_urls" className="text-sm font-medium">
                Slideshow Images <span className="text-red-500">*</span>
              </Label>
              <CloudinaryUpload
                type="slideshow"
                value={watch('media_urls')?.split(',').map(u => u.trim()).filter(Boolean) || []}
                onChange={(urls) => {
                  const urlString = Array.isArray(urls) ? urls.join(', ') : urls;
                  setValue('media_urls', urlString);
                }}
              />
              {errors.media_urls && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.media_urls.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="transition_duration" className="text-sm font-medium">
                Transition Duration (seconds)
              </Label>
              <Input
                id="transition_duration"
                type="number"
                {...register('transition_duration', { valueAsNumber: true })}
                min="1"
                max="30"
                className={cn(errors.transition_duration && 'border-red-500')}
              />
              {errors.transition_duration && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.transition_duration.message}
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Audio Settings Section */}
      <div className="space-y-4 p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
          <div className="p-2 rounded-xl bg-green-600 shadow-md">
            <Volume2 className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Audio Settings</h3>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="enable_tts" className="text-sm font-medium">
              Enable Text-to-Speech
            </Label>
            <p className="text-sm text-gray-500">
              Automatically read announcement aloud
            </p>
          </div>
          <Switch
            id="enable_tts"
            checked={enableTts}
            onCheckedChange={(checked) => setValue('enable_tts', checked)}
          />
        </div>

        {enableTts && (
          <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-blue-200">
            <div className="space-y-2">
              <Label htmlFor="tts_voice" className="text-sm font-medium">
                Voice
              </Label>
              <Select
                value={watch('tts_voice')}
                onValueChange={(value) => setValue('tts_voice', value as 'default' | 'male' | 'female')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tts_speed" className="text-sm font-medium">
                Speed (0.5-2.0)
              </Label>
              <Input
                id="tts_speed"
                type="number"
                step="0.1"
                {...register('tts_speed', { valueAsNumber: true })}
                min="0.5"
                max="2.0"
                className={cn(errors.tts_speed && 'border-red-500')}
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="audio_url" className="text-sm font-medium">
            Pre-recorded Audio URL (optional)
          </Label>
          <Input
            id="audio_url"
            {...register('audio_url')}
            placeholder="https://example.com/audio.mp3"
            className={cn(errors.audio_url && 'border-red-500')}
          />
          {errors.audio_url && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.audio_url.message}
            </p>
          )}
        </div>
      </div>

      {/* Display Settings Section */}
      <div className="space-y-4 p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
          <div className="p-2 rounded-xl bg-orange-600 shadow-md">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Display Settings</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="display_duration" className="text-sm font-medium">
              Display Duration (seconds) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="display_duration"
              type="number"
              {...register('display_duration', { valueAsNumber: true })}
              min="1"
              max="300"
              className={cn(errors.display_duration && 'border-red-500')}
            />
            {errors.display_duration && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.display_duration.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="branch_id" className="text-sm font-medium">
              Branch
            </Label>
            <Select
              value={watch('branch_id') || 'all-branches'}
              onValueChange={(value) => setValue('branch_id', value === 'all-branches' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-branches">All Branches</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start_date" className="text-sm font-medium">
              Start Date (optional)
            </Label>
            <Input
              id="start_date"
              type="date"
              {...register('start_date')}
              className={cn(errors.start_date && 'border-red-500')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end_date" className="text-sm font-medium">
              End Date (optional)
            </Label>
            <Input
              id="end_date"
              type="date"
              {...register('end_date')}
              className={cn(errors.end_date && 'border-red-500')}
            />
            {errors.end_date && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.end_date.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="is_active" className="text-sm font-medium">
              Active Status
            </Label>
            <p className="text-sm text-gray-500">
              Make this announcement visible immediately
            </p>
          </div>
          <Switch
            id="is_active"
            checked={watch('is_active')}
            onCheckedChange={(checked) => setValue('is_active', checked)}
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>Save Announcement</>
          )}
        </Button>
      </div>
    </form>
  );
}
