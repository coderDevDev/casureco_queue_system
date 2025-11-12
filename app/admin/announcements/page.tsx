'use client';

import { useState, useEffect } from 'react';
import { Plus, Megaphone, Edit, Trash2, Search, Calendar, AlertCircle, Info, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/lib/hooks/use-auth';

interface Announcement {
  id: string;
  branch_id?: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
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

interface AnnouncementFormData {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  branch_id: string;
  display_duration: number;
  priority: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export default function AnnouncementsPage() {
  const { profile } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showDialog, setShowDialog] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState<AnnouncementFormData>({
    title: '',
    message: '',
    type: 'info',
    branch_id: '',
    display_duration: 10,
    priority: 0,
    start_date: '',
    end_date: '',
    is_active: true
  });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();

    try {
      const announcementData = {
        title: formData.title,
        message: formData.message,
        type: formData.type,
        branch_id: formData.branch_id || null,
        display_duration: formData.display_duration,
        priority: formData.priority,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        is_active: formData.is_active,
        updated_at: new Date().toISOString()
      };

      if (editingAnnouncement) {
        // Update existing announcement
        const { error } = await supabase
          .from('announcements')
          .update(announcementData)
          .eq('id', editingAnnouncement.id);

        if (error) throw error;
        toast.success('Announcement updated successfully');
      } else {
        // Create new announcement
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
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving announcement:', error);
      toast.error('Failed to save announcement');
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      message: announcement.message,
      type: announcement.type,
      branch_id: announcement.branch_id || '',
      display_duration: announcement.display_duration,
      priority: announcement.priority,
      start_date: announcement.start_date ? announcement.start_date.split('T')[0] : '',
      end_date: announcement.end_date ? announcement.end_date.split('T')[0] : '',
      is_active: announcement.is_active
    });
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

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      type: 'info',
      branch_id: '',
      display_duration: 10,
      priority: 0,
      start_date: '',
      end_date: '',
      is_active: true
    });
  };

  const openCreateDialog = () => {
    setEditingAnnouncement(null);
    resetForm();
    setShowDialog(true);
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = 
      announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.branch?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || announcement.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

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
        return <Info className="h-5 w-5 text-blue-600" />;
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Announcements</h1>
          <p className="mt-2 text-lg text-gray-600">Manage system announcements and notifications</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button 
              className="bg-gradient-to-r from-[#0033A0] to-[#1A237E] hover:from-[#002080] hover:to-[#0d1554]"
              onClick={openCreateDialog}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter announcement title"
                  required
                />
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Enter announcement message"
                  rows={4}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={formData.type} onValueChange={(value: 'info' | 'warning' | 'success' | 'error') => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                    min="0"
                    max="10"
                  />
                  <p className="text-sm text-gray-500 mt-1">0 = Low, 10 = High</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Display Duration (seconds)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.display_duration}
                    onChange={(e) => setFormData({ ...formData, display_duration: parseInt(e.target.value) })}
                    min="1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="branch">Branch (optional)</Label>
                  <Select value={formData.branch_id || 'all-branches'} onValueChange={(value) => setFormData({ ...formData, branch_id: value === 'all-branches' ? '' : value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
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
                <div>
                  <Label htmlFor="startDate">Start Date (optional)</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date (optional)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="active">Active</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-[#0033A0] to-[#1A237E]">
                  {editingAnnouncement ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        {statCards.map((stat) => (
          <Card 
            key={stat.title}
            className="group relative overflow-hidden border-0 bg-white shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          >
            <div className={`absolute inset-0 opacity-5 ${stat.bgColor}`} />
            
            <CardHeader className="relative flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                {stat.title}
              </CardTitle>
              <div className={`rounded-xl p-3 ${stat.bgColor} transition-transform duration-300 group-hover:scale-110`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </CardHeader>
            
            <CardContent className="relative">
              <div className="text-4xl font-bold text-gray-900">{stat.value}</div>
              <p className="mt-2 text-xs text-gray-500">Total count</p>
            </CardContent>
            
            <div className={`absolute bottom-0 left-0 h-1 w-full ${stat.bgColor}`} />
          </Card>
        ))}
      </div>

      {/* Search and Filters */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search announcements by title, message, or branch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by type" />
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
        </CardContent>
      </Card>

      {/* Announcements List */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-[#0033A0] to-[#1A237E] text-white">
          <CardTitle className="text-xl">System Announcements ({filteredAnnouncements.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredAnnouncements.length === 0 ? (
            <div className="p-8 text-center">
              <Megaphone className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-gray-500">
                {searchTerm || typeFilter !== 'all' 
                  ? 'No announcements found matching your filters.' 
                  : 'No announcements available.'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredAnnouncements.map((announcement) => (
                <div key={announcement.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#0033A0] to-[#1A237E] text-white">
                        {getTypeIcon(announcement.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{announcement.title}</h3>
                          {getTypeBadge(announcement.type)}
                          {announcement.priority > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              Priority {announcement.priority}
                            </Badge>
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
                        <p className="text-gray-600 mb-3">{announcement.message}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Duration: {announcement.display_duration}s
                          </div>
                          {announcement.branch && (
                            <div>
                              Branch: {announcement.branch.name}
                            </div>
                          )}
                          {announcement.creator && (
                            <div>
                              By: {announcement.creator.name}
                            </div>
                          )}
                          <div className="text-xs">
                            Created: {new Date(announcement.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        {(announcement.start_date || announcement.end_date) && (
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            {announcement.start_date && (
                              <div>Start: {new Date(announcement.start_date).toLocaleDateString()}</div>
                            )}
                            {announcement.end_date && (
                              <div>End: {new Date(announcement.end_date).toLocaleDateString()}</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge 
                        className={announcement.is_active 
                          ? 'bg-green-100 text-green-700 hover:bg-green-100' 
                          : 'bg-red-100 text-red-700 hover:bg-red-100'
                        }
                      >
                        {announcement.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => toggleAnnouncementStatus(announcement.id, announcement.is_active)}
                      >
                        {announcement.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(announcement)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(announcement.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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