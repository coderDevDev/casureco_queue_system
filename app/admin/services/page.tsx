'use client';

import { useState, useEffect } from 'react';
import { Plus, Briefcase, Edit, Trash2, Search, Clock, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Service {
  id: string;
  name: string;
  prefix: string;
  description?: string;
  avg_service_time: number;
  branch_id: string;
  is_active: boolean;
  color: string;
  icon?: string;
  created_at: string;
  updated_at: string;
}

interface ServiceFormData {
  name: string;
  prefix: string;
  description: string;
  avg_service_time: number;
  color: string;
  icon: string;
  is_active: boolean;
  branch_id: string;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    prefix: '',
    description: '',
    avg_service_time: 300, // 5 minutes default
    color: '#3b82f6',
    icon: '',
    is_active: true,
    branch_id: ''
  });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    avg_duration: 0
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const supabase = createClient();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setServices(data || []);

      // Calculate stats
      const total = data?.length || 0;
      const active = data?.filter(s => s.is_active).length || 0;
      const inactive = total - active;
      const avgDuration = data?.length > 0 
        ? data.reduce((sum, s) => sum + s.avg_service_time, 0) / data.length
        : 0;
      
      setStats({ total, active, inactive, avg_duration: avgDuration });
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();

    try {
      if (editingService) {
        // Update existing service
        const { error } = await supabase
          .from('services')
          .update({
            name: formData.name,
            prefix: formData.prefix,
            description: formData.description,
            avg_service_time: formData.avg_service_time,
            color: formData.color,
            icon: formData.icon,
            is_active: formData.is_active,
            branch_id: formData.branch_id,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingService.id);

        if (error) throw error;
        toast.success('Service updated successfully');
      } else {
        // Create new service
        const { error } = await supabase
          .from('services')
          .insert({
            name: formData.name,
            prefix: formData.prefix,
            description: formData.description,
            avg_service_time: formData.avg_service_time,
            color: formData.color,
            icon: formData.icon,
            is_active: formData.is_active,
            branch_id: formData.branch_id || '00000000-0000-0000-0000-000000000001'
          });

        if (error) throw error;
        toast.success('Service created successfully');
      }

      setShowDialog(false);
      setEditingService(null);
      resetForm();
      fetchServices();
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error('Failed to save service');
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      prefix: service.prefix,
      description: service.description || '',
      avg_service_time: service.avg_service_time,
      color: service.color,
      icon: service.icon || '',
      is_active: service.is_active,
      branch_id: service.branch_id
    });
    setShowDialog(true);
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    const supabase = createClient();
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;
      toast.success('Service deleted successfully');
      fetchServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Failed to delete service');
    }
  };

  const toggleServiceStatus = async (serviceId: string, currentStatus: boolean) => {
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: !currentStatus })
        .eq('id', serviceId);

      if (error) throw error;
      toast.success(`Service ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchServices();
    } catch (error) {
      console.error('Error updating service:', error);
      toast.error('Failed to update service status');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      prefix: '',
      description: '',
      avg_service_time: 300,
      color: '#3b82f6',
      icon: '',
      is_active: true,
      branch_id: ''
    });
  };

  const openCreateDialog = () => {
    setEditingService(null);
    resetForm();
    setShowDialog(true);
  };

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  };

  const statCards = [
    {
      title: 'Total Services',
      value: stats.total,
      icon: Briefcase,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Active Services',
      value: stats.active,
      icon: Briefcase,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Inactive Services',
      value: stats.inactive,
      icon: Briefcase,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Avg Duration',
      value: formatDuration(stats.avg_duration),
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
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
          <h1 className="text-4xl font-bold text-gray-900">Services</h1>
          <p className="mt-2 text-lg text-gray-600">Manage available services and their configurations</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button 
              className="bg-gradient-to-r from-[#0033A0] to-[#1A237E] hover:from-[#002080] hover:to-[#0d1554]"
              onClick={openCreateDialog}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingService ? 'Edit Service' : 'Create New Service'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Service Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter service name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter service description"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="prefix">Service Prefix</Label>
                <Input
                  id="prefix"
                  value={formData.prefix}
                  onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                  placeholder="e.g., BP for Bill Payment"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">Used for ticket numbering (e.g., BP001)</p>
              </div>
              <div>
                <Label htmlFor="duration">Average Service Time (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={Math.floor(formData.avg_service_time / 60)}
                  onChange={(e) => setFormData({ ...formData, avg_service_time: parseInt(e.target.value) * 60 })}
                  min="1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="color">Service Color</Label>
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="h-10 w-full"
                />
                <p className="text-sm text-gray-500 mt-1">Color for service identification</p>
              </div>
              <div>
                <Label htmlFor="icon">Icon (optional)</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="e.g., credit-card, user, settings"
                />
                <p className="text-sm text-gray-500 mt-1">Lucide icon name for display</p>
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
                  {editingService ? 'Update' : 'Create'}
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

      {/* Search */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search services by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Services List */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-[#0033A0] to-[#1A237E] text-white">
          <CardTitle className="text-xl">Available Services ({filteredServices.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredServices.length === 0 ? (
            <div className="p-8 text-center">
              <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-gray-500">
                {searchTerm ? 'No services found matching your search.' : 'No services available.'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredServices.map((service) => (
                <div key={service.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#0033A0] to-[#1A237E] text-white">
                        <Briefcase className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                          {service.priority_level > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              Priority {service.priority_level}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: service.color }}
                            />
                            <span className="font-medium">{service.prefix}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatDuration(service.avg_service_time)}
                          </div>
                          {service.description && (
                            <span>{service.description}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge 
                        className={service.is_active 
                          ? 'bg-green-100 text-green-700 hover:bg-green-100' 
                          : 'bg-red-100 text-red-700 hover:bg-red-100'
                        }
                      >
                        {service.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => toggleServiceStatus(service.id, service.is_active)}
                      >
                        {service.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(service)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(service.id)}
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