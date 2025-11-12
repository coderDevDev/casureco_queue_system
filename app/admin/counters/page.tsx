'use client';

import { useState, useEffect } from 'react';
import { Plus, Monitor, Edit, Trash2, Search, User, Building2, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Counter {
  id: string;
  name: string;
  branch_id: string;
  staff_id?: string;
  is_active: boolean;
  is_paused: boolean;
  last_ping?: string;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
  staff?: {
    name: string;
    email: string;
  };
  branch?: {
    name: string;
  };
}

interface Branch {
  id: string;
  name: string;
}

interface CounterFormData {
  name: string;
  branch_id: string;
  is_active: boolean;
  is_paused: boolean;
}

export default function CountersPage() {
  const [counters, setCounters] = useState<Counter[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingCounter, setEditingCounter] = useState<Counter | null>(null);
  const [formData, setFormData] = useState<CounterFormData>({
    name: '',
    branch_id: '',
    is_active: true,
    is_paused: false
  });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    occupied: 0,
    available: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const supabase = createClient();
    setLoading(true);

    try {
      // Fetch counters with related data
      const { data: countersData, error: countersError } = await supabase
        .from('counters')
        .select(`
          *,
          staff:users(name, email),
          branch:branches(name)
        `)
        .order('created_at', { ascending: false });

      if (countersError) throw countersError;

      // Fetch branches for the form
      const { data: branchesData, error: branchesError } = await supabase
        .from('branches')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (branchesError) throw branchesError;

      setCounters(countersData || []);
      setBranches(branchesData || []);

      // Calculate stats
      const total = countersData?.length || 0;
      const active = countersData?.filter(c => c.is_active).length || 0;
      const occupied = countersData?.filter(c => c.staff_id).length || 0;
      const available = active - occupied;

      setStats({ total, active, occupied, available });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load counters');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();

    try {
      if (editingCounter) {
        // Update existing counter
        const { error } = await supabase
          .from('counters')
          .update({
            name: formData.name,
            branch_id: formData.branch_id,
            is_active: formData.is_active,
            is_paused: formData.is_paused,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingCounter.id);

        if (error) throw error;
        toast.success('Counter updated successfully');
      } else {
        // Create new counter
        const { error } = await supabase
          .from('counters')
          .insert({
            name: formData.name,
            branch_id: formData.branch_id,
            is_active: formData.is_active,
            is_paused: formData.is_paused,
            settings: {}
          });

        if (error) throw error;
        toast.success('Counter created successfully');
      }

      setShowDialog(false);
      setEditingCounter(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving counter:', error);
      toast.error('Failed to save counter');
    }
  };

  const handleEdit = (counter: Counter) => {
    setEditingCounter(counter);
    setFormData({
      name: counter.name,
      branch_id: counter.branch_id,
      is_active: counter.is_active,
      is_paused: counter.is_paused
    });
    setShowDialog(true);
  };

  const handleDelete = async (counterId: string) => {
    if (!confirm('Are you sure you want to delete this counter?')) return;

    const supabase = createClient();
    try {
      const { error } = await supabase
        .from('counters')
        .delete()
        .eq('id', counterId);

      if (error) throw error;
      toast.success('Counter deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting counter:', error);
      toast.error('Failed to delete counter');
    }
  };

  const toggleCounterStatus = async (counterId: string, currentStatus: boolean) => {
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from('counters')
        .update({ is_active: !currentStatus })
        .eq('id', counterId);

      if (error) throw error;
      toast.success(`Counter ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchData();
    } catch (error) {
      console.error('Error updating counter:', error);
      toast.error('Failed to update counter status');
    }
  };

  const releaseStaff = async (counterId: string) => {
    if (!confirm('Are you sure you want to release the staff from this counter?')) return;

    const supabase = createClient();
    try {
      const { error } = await supabase
        .from('counters')
        .update({ 
          staff_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', counterId);

      if (error) throw error;
      toast.success('Staff released from counter successfully');
      fetchData();
    } catch (error) {
      console.error('Error releasing staff:', error);
      toast.error('Failed to release staff');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      branch_id: '',
      is_active: true,
      is_paused: false
    });
  };

  const openCreateDialog = () => {
    setEditingCounter(null);
    resetForm();
    setShowDialog(true);
  };

  const filteredCounters = counters.filter(counter =>
    counter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    counter.branch?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    counter.staff?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCounterStatus = (counter: Counter) => {
    if (!counter.is_active) return { label: 'Inactive', color: 'bg-gray-100 text-gray-700' };
    if (counter.staff_id) return { label: 'Occupied', color: 'bg-red-100 text-red-700' };
    return { label: 'Available', color: 'bg-green-100 text-green-700' };
  };

  const statCards = [
    {
      title: 'Total Counters',
      value: stats.total,
      icon: Monitor,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Active Counters',
      value: stats.active,
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Occupied',
      value: stats.occupied,
      icon: User,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Available',
      value: stats.available,
      icon: Monitor,
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
          <h1 className="text-4xl font-bold text-gray-900">Counters</h1>
          <p className="mt-2 text-lg text-gray-600">Manage service counters and staff assignments</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button 
              className="bg-gradient-to-r from-[#0033A0] to-[#1A237E] hover:from-[#002080] hover:to-[#0d1554]"
              onClick={openCreateDialog}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Counter
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCounter ? 'Edit Counter' : 'Create New Counter'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Counter Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter counter name (e.g., Counter 1)"
                  required
                />
              </div>
              <div>
                <Label htmlFor="branch">Branch</Label>
                <Select value={formData.branch_id} onValueChange={(value) => setFormData({ ...formData, branch_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  {editingCounter ? 'Update' : 'Create'}
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
              placeholder="Search counters by name, branch, or assigned staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Counters List */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-[#0033A0] to-[#1A237E] text-white">
          <CardTitle className="text-xl">Service Counters ({filteredCounters.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredCounters.length === 0 ? (
            <div className="p-8 text-center">
              <Monitor className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-gray-500">
                {searchTerm ? 'No counters found matching your search.' : 'No counters available.'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredCounters.map((counter) => {
                const status = getCounterStatus(counter);
                return (
                  <div key={counter.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#0033A0] to-[#1A237E] text-white">
                          <Monitor className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{counter.name}</h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Building2 className="h-4 w-4" />
                              {counter.branch?.name || 'Unknown Branch'}
                            </div>
                            {counter.staff && (
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                {counter.staff.full_name}
                              </div>
                            )}
                            {counter.last_ping && (
                              <div className="text-xs">
                                Last ping: {new Date(counter.last_ping).toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={`hover:${status.color} ${status.color}`}>
                          {status.label}
                        </Badge>
                        {counter.staff_id && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => releaseStaff(counter.id)}
                            className="text-orange-600 hover:text-orange-700"
                          >
                            Release Staff
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => toggleCounterStatus(counter.id, counter.is_active)}
                        >
                          {counter.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEdit(counter)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(counter.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}