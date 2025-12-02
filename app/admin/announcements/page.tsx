'use client';

import { useState, useEffect } from 'react';
import { Plus, Megaphone, Edit, Trash2, Search, Calendar, AlertCircle, Info, CheckCircle, XCircle, List, Table2, Filter, X ,


  FileTextIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/lib/hooks/use-auth';
import { AnnouncementForm } from '@/components/admin/announcement-form';
import type { AnnouncementFormData } from '@/lib/validations/announcement';

interface Announcement {
  id: string;
  branch_id?: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  content_type: 'text' | 'video' | 'image' | 'slideshow';
  media_url?: string;
  media_urls?: string[];
  thumbnail_url?: string;
  audio_url?: string;
  enable_tts: boolean;
  tts_voice: string;
  tts_speed: number;
  play_audio_on_display: boolean;
  loop_media: boolean;
  transition_duration: number;
  is_active: boolean;
  display_duration: number;
  priority: number;
  start_date?: string;
  end_date?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  branch?: {
    name: string;
  };
  creator?: {
    name: string;
  };
}

interface Branch {
  id: string;
  name: string;
}

export default function AnnouncementsPage() {
  const { profile } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'table'>('table');
  const [showFilters, setShowFilters] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    scheduled: 0,
    expired: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const supabase = createClient();
    setLoading(true);

    try {
      // Fetch announcements with related data
      const { data: announcementsData, error: announcementsError } = await supabase
        .from('announcements')
        .select(`
          *,
          branch:branches(name),
          creator:users!announcements_created_by_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (announcementsError) throw announcementsError;

      // Fetch branches for the form
      const { data: branchesData, error: branchesError } = await supabase
        .from('branches')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (branchesError) throw branchesError;

      setAnnouncements(announcementsData || []);
      setBranches(branchesData || []);

      // Calculate stats
      const now = new Date();
      const total = announcementsData?.length || 0;
      const active = announcementsData?.filter(a => a.is_active).length || 0;
      const scheduled = announcementsData?.filter(a => 
        a.start_date && new Date(a.start_date) > now
      ).length || 0;
      const expired = announcementsData?.filter(a => 
        a.end_date && new Date(a.end_date) < now
      ).length || 0;
      
      setStats({ total, active, scheduled, expired });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (data: AnnouncementFormData) => {
    const supabase = createClient();
    setIsSubmitting(true);

    try {
      const announcementData = {
        title: data.title,
        message: data.message,
        type: data.type,
        content_type: data.content_type,
        media_url: data.media_url || null,
        media_urls: data.media_urls ? data.media_urls.split(',').map(url => url.trim()) : null,
        thumbnail_url: data.thumbnail_url || null,
        audio_url: data.audio_url || null,
        enable_tts: data.enable_tts,
        tts_voice: data.tts_voice,
        tts_speed: data.tts_speed,
        play_audio_on_display: data.play_audio_on_display,
        loop_media: data.loop_media,
        transition_duration: data.transition_duration,
        branch_id: data.branch_id || null,
        display_duration: data.display_duration,
        priority: data.priority,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        is_active: data.is_active,
        updated_at: new Date().toISOString()
      };

      if (editingAnnouncement) {
        const { error } = await supabase
          .from('announcements')
          .update(announcementData)
          .eq('id', editingAnnouncement.id);

        if (error) throw error;
        toast.success('Announcement updated successfully');
      } else {
        const { error } = await supabase
          .from('announcements')
          .insert({
            ...announcementData,
            created_by: profile?.id
          });

        if (error) throw error;
        toast.success('Announcement created successfully');
      }

      setShowDialog(false);
      setEditingAnnouncement(null);
      fetchData();
    } catch (error) {
      console.error('Error saving announcement:', error);
      toast.error('Failed to save announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setShowDialog(true);
  };

  const handleDelete = async (announcementId: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    const supabase = createClient();
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', announcementId);

      if (error) throw error;
      toast.success('Announcement deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Failed to delete announcement');
    }
  };

  const toggleAnnouncementStatus = async (announcementId: string, currentStatus: boolean) => {
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', announcementId);

      if (error) throw error;
      toast.success(`Announcement ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchData();
    } catch (error) {
      console.error('Error updating announcement:', error);
      toast.error('Failed to update announcement status');
    }
  };

  const getDefaultValues = (): Partial<AnnouncementFormData> => {
    if (editingAnnouncement) {
      return {
        title: editingAnnouncement.title,
        message: editingAnnouncement.message,
        type: editingAnnouncement.type,
        content_type: editingAnnouncement.content_type || 'text',
        media_url: editingAnnouncement.media_url || '',
        media_urls: editingAnnouncement.media_urls ? editingAnnouncement.media_urls.join(', ') : '',
        thumbnail_url: editingAnnouncement.thumbnail_url || '',
        audio_url: editingAnnouncement.audio_url || '',
        enable_tts: editingAnnouncement.enable_tts || false,
        tts_voice: (editingAnnouncement.tts_voice as 'default' | 'male' | 'female') || 'default',
        tts_speed: editingAnnouncement.tts_speed || 1.0,
        play_audio_on_display: editingAnnouncement.play_audio_on_display || false,
        loop_media: editingAnnouncement.loop_media !== undefined ? editingAnnouncement.loop_media : true,
        transition_duration: editingAnnouncement.transition_duration || 5,
        branch_id: editingAnnouncement.branch_id || '',
        display_duration: editingAnnouncement.display_duration,
        priority: editingAnnouncement.priority,
        start_date: editingAnnouncement.start_date ? editingAnnouncement.start_date.split('T')[0] : '',
        end_date: editingAnnouncement.end_date ? editingAnnouncement.end_date.split('T')[0] : '',
        is_active: editingAnnouncement.is_active
      };
    }
    return {};
  };

  const openCreateDialog = () => {
    setEditingAnnouncement(null);
    setShowDialog(true);
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = 
      announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.branch?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || announcement.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && announcement.is_active) ||
      (statusFilter === 'inactive' && !announcement.is_active) ||
      (statusFilter === 'scheduled' && isScheduled(announcement)) ||
      (statusFilter === 'expired' && isExpired(announcement));
    const matchesBranch = branchFilter === 'all' || announcement.branch_id === branchFilter;
    
    return matchesSearch && matchesType && matchesStatus && matchesBranch;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setStatusFilter('all');
    setBranchFilter('all');
  };

  const hasActiveFilters = searchTerm || typeFilter !== 'all' || statusFilter !== 'all' || branchFilter !== 'all';

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'info':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Info</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Warning</Badge>;
      case 'success':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Success</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Error</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <FileTextIcon className="h-5 w-5 text-blue-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Megaphone className="h-5 w-5 text-gray-600" />;
    }
  };

  const isScheduled = (announcement: Announcement) => {
    if (!announcement.start_date) return false;
    return new Date(announcement.start_date) > new Date();
  };

  const isExpired = (announcement: Announcement) => {
    if (!announcement.end_date) return false;
    return new Date(announcement.end_date) < new Date();
  };

  const statCards = [
    {
      title: 'Total Announcements',
      value: stats.total,
      icon: Megaphone,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Active',
      value: stats.active,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Scheduled',
      value: stats.scheduled,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Expired',
      value: stats.expired,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0033A0]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Clean Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Announcements
            </h1>
            <p className="text-gray-600 mt-2">
              Manage and broadcast system-wide notifications
            </p>
          </div>
          <Button
            onClick={openCreateDialog}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Announcement
          </Button>
        </div>
      </div>

      {/* Dialog with Modern Form */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
            <AnnouncementForm
              key={editingAnnouncement?.id || 'new'}
              defaultValues={getDefaultValues()}
              branches={branches}
              onSubmit={handleFormSubmit}
              onCancel={() => setShowDialog(false)}
              isSubmitting={isSubmitting}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced Stats Cards with Animations */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
  {statCards.map((stat, index) => (
    <Card
      key={stat.title}
      className="group relative overflow-hidden border-0 bg-white shadow-md hover:shadow-xl transition-all duration-400 hover:-translate-y-1 rounded-xl animate-fade-in-up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.bgColor} ${stat.color.replace('text-', 'from-')} to-transparent`} />
      <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

      <CardContent className="relative p-4">
        <div className="flex items-start justify-between mb-2">
          <div className={`rounded-xl p-2.5 ${stat.bgColor} transition-all duration-400 group-hover:scale-105 shadow`}>
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </div>

          <div className="text-right leading-tight">
            <div className="text-3xl font-bold bg-gradient-to-br 
            from-gray-900 to-gray-600 bg-clip-text text-transparent 
            mb-0.5 group-hover:scale-105 transition-transform duration-300">
              {stat.value}
            </div>
          
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-gray-800">{stat.title}</p>
          <p className="text-[10px] text-gray-500">Total in system</p>
        </div>
      </CardContent>
    </Card>
  ))}
</div>


      {/* Announcements Card with Search and Table */}
      <Card className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Announcements</CardTitle>
              <CardDescription>
                View and manage all system announcements
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search announcements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Filter Toggle Button */}
              <Button
                variant={showFilters ? "default" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? "bg-[#0033A0] hover:bg-[#002080]" : ""}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {hasActiveFilters && !showFilters && (
                  <Badge className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 min-w-[20px]">
                    {[typeFilter !== 'all', statusFilter !== 'all', branchFilter !== 'all', searchTerm].filter(Boolean).length}
                  </Badge>
                )}
              </Button>

              {/* View Mode Toggle */}
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                {/* <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`rounded-none border-r ${
                    viewMode === 'list' 
                      ? 'bg-[#0033A0] text-white hover:bg-[#002080] hover:text-white' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <List className="h-4 w-4" />
                </Button> */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className={`rounded-none ${
                    viewMode === 'table' 
                      ? 'bg-blue-700 text-white hover:bg-[#002080] hover:text-white' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <Table2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="pt-4 border-t border-gray-200 space-y-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Advanced Filters</h3>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear all
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Type Filter */}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-2 block">Type</label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="h-10 border-gray-200 rounded-lg">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-2 block">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-10 border-gray-200 rounded-lg">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Branch Filter */}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-2 block">Branch</label>
                  <Select value={branchFilter} onValueChange={setBranchFilter}>
                    <SelectTrigger className="h-10 border-gray-200 rounded-lg">
                      <SelectValue placeholder="All branches" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Branches</SelectItem>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Active Filter Tags */}
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {searchTerm && (
                    <Badge variant="secondary" className="text-xs">
                      Search: &ldquo;{searchTerm}&rdquo;
                      <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => setSearchTerm('')} />
                    </Badge>
                  )}
                  {typeFilter !== 'all' && (
                    <Badge variant="secondary" className="text-xs">
                      Type: {typeFilter}
                      <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => setTypeFilter('all')} />
                    </Badge>
                  )}
                  {statusFilter !== 'all' && (
                    <Badge variant="secondary" className="text-xs">
                      Status: {statusFilter}
                      <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => setStatusFilter('all')} />
                    </Badge>
                  )}
                  {branchFilter !== 'all' && (
                    <Badge variant="secondary" className="text-xs">
                      Branch: {branches.find(b => b.id === branchFilter)?.name}
                      <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => setBranchFilter('all')} />
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Table/List Content */}
          {filteredAnnouncements.length === 0 ? (
            <div className="p-20 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
                <Megaphone className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm || typeFilter !== 'all' 
                  ? 'No announcements found' 
                  : 'No announcements yet'}
              </h3>
              <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                {searchTerm || typeFilter !== 'all'
                  ? 'Try adjusting your search or filters to find what you\'re looking for.'
                  : 'Get started by creating your first announcement to broadcast important information.'}
              </p>
              {!searchTerm && typeFilter === 'all' && (
                <Button 
                  onClick={openCreateDialog}
                  className="bg-gradient-to-r from-[#0033A0] to-[#1A237E] hover:from-[#002080] hover:to-[#0d1554]"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Announcement
                </Button>
              )}
            </div>
          ) : viewMode === 'table' ? (
            /* Table View - Clean shadcn/ui Design */
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Announcement</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Type</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Branch</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Duration</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAnnouncements.map((announcement) => (
                    <tr 
                      key={announcement.id} 
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      {/* Announcement Column */}
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-md ${
                              announcement.type === 'info' ? 'bg-blue-100' :
                              announcement.type === 'warning' ? 'bg-yellow-100' :
                              announcement.type === 'success' ? 'bg-green-100' :
                              announcement.type === 'error' ? 'bg-red-100' :
                              'bg-gray-100'
                            }`}>
                              {getTypeIcon(announcement.type)}
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-gray-900 truncate group-hover:text-[#0033A0] transition-colors">
                              {announcement.title}
                            </div>
                            <div className="text-sm text-gray-600 line-clamp-1 mt-0.5">
                              {announcement.message}
                            </div>
                            {announcement.priority > 0 && (
                              <Badge variant="destructive" className="text-xs mt-1">
                                Priority {announcement.priority}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Type Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTypeBadge(announcement.type)}
                      </td>

                      {/* Branch Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {announcement.branch?.name || <span className="text-gray-400">All branches</span>}
                        </div>
                      </td>

                      {/* Duration Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Calendar className="h-3.5 w-3.5 text-gray-400" />
                          {announcement.display_duration}s
                        </div>
                      </td>

                      {/* Status Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <Badge 
                            className={`${
                              announcement.is_active 
                                ? 'bg-green-50 text-green-700 border-green-200' 
                                : 'bg-gray-50 text-gray-600 border-gray-200'
                            } border font-semibold w-fit`}
                          >
                            {announcement.is_active ? '● Active' : '○ Inactive'}
                          </Badge>
                          {isScheduled(announcement) && (
                            <Badge className="bg-purple-100 text-purple-700 text-xs w-fit">Scheduled</Badge>
                          )}
                          {isExpired(announcement) && (
                            <Badge className="bg-gray-100 text-gray-700 text-xs w-fit">Expired</Badge>
                          )}
                        </div>
                      </td>

                      {/* Actions Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 rounded-lg hover:bg-blue-100 hover:text-[#0033A0]"
                            onClick={() => toggleAnnouncementStatus(announcement.id, announcement.is_active)}
                            title={announcement.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {announcement.is_active ? (
                              <XCircle className="h-4 w-4" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 rounded-lg hover:bg-blue-100 hover:text-[#0033A0]"
                            onClick={() => handleEdit(announcement)}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(announcement.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* List View - Modern Card Design */
            <div className="p-4 space-y-4">
              {filteredAnnouncements.map((announcement, index) => (
                <div 
                  key={announcement.id} 
                  className="group relative overflow-hidden rounded-2xl bg-white border border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 animate-fade-in-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Gradient accent line */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
                    announcement.type === 'info' ? 'from-blue-500 to-blue-600' :
                    announcement.type === 'warning' ? 'from-yellow-500 to-orange-500' :
                    announcement.type === 'success' ? 'from-green-500 to-emerald-500' :
                    'from-red-500 to-pink-500'
                  }`} />
                  
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-purple-50/0 group-hover:from-blue-50/50 group-hover:to-purple-50/30 transition-all duration-500 pointer-events-none" />
                  
                  <div className="relative p-6">
                    <div className="flex items-start justify-between gap-4">
                      {/* Left Section - Main Content */}
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        {/* Icon with enhanced styling */}
                        <div className="flex-shrink-0 mt-0.5">
                          <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300 flex items-center justify-center text-white ${
                            announcement.type === 'info' ? 'from-blue-500 to-blue-600' :
                            announcement.type === 'warning' ? 'from-yellow-500 to-orange-500' :
                            announcement.type === 'success' ? 'from-green-500 to-emerald-500' :
                            'from-red-500 to-pink-500'
                          }`}>
                            {getTypeIcon(announcement.type)}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {/* Title and Badges */}
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-base font-bold text-gray-900 truncate group-hover:text-[#0033A0] transition-colors">
                              {announcement.title}
                            </h3>
                            {getTypeBadge(announcement.type)}
                            {announcement.priority > 0 && (
                              <Badge variant="destructive" className="text-xs font-semibold shadow-sm">
                                Priority {announcement.priority}
                              </Badge>
                            )}
                          </div>

                          {/* Message */}
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                            {announcement.message}
                          </p>

                          {/* Meta Info */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500">
                            <div className="flex items-center gap-1.5 font-medium">
                              <Calendar className="h-3.5 w-3.5 text-gray-400" />
                              <span>{announcement.display_duration}s duration</span>
                            </div>
                            {announcement.branch && (
                              <span className="flex items-center gap-1">
                                <span className="text-gray-400">•</span>
                                {announcement.branch.name}
                              </span>
                            )}
                            {announcement.start_date && (
                              <span className="flex items-center gap-1">
                                <span className="text-gray-400">•</span>
                                From {new Date(announcement.start_date).toLocaleDateString()}
                              </span>
                            )}
                            {announcement.end_date && (
                              <span className="flex items-center gap-1">
                                <span className="text-gray-400">•</span>
                                Until {new Date(announcement.end_date).toLocaleDateString()}
                              </span>
                            )}
                            {isScheduled(announcement) && (
                              <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 text-xs">
                                Scheduled
                              </Badge>
                            )}
                            {isExpired(announcement) && (
                              <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 text-xs">
                                Expired
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Section - Status & Actions */}
                      <div className="flex items-start gap-3 flex-shrink-0">
                        {/* Status Badge */}
                        <Badge 
                          className={`${
                            announcement.is_active 
                              ? 'bg-green-50 text-green-700 border-green-200 shadow-sm' 
                              : 'bg-gray-50 text-gray-600 border-gray-200'
                          } border font-semibold px-3 py-1`}
                        >
                          {announcement.is_active ? '● Active' : '○ Inactive'}
                        </Badge>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-9 w-9 p-0 rounded-lg hover:bg-blue-100 hover:text-[#0033A0] transition-colors"
                            onClick={() => toggleAnnouncementStatus(announcement.id, announcement.is_active)}
                            title={announcement.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {announcement.is_active ? (
                              <XCircle className="h-4 w-4" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-9 w-9 p-0 rounded-lg hover:bg-blue-100 hover:text-[#0033A0] transition-colors"
                            onClick={() => handleEdit(announcement)}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-9 w-9 p-0 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
                            onClick={() => handleDelete(announcement.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}