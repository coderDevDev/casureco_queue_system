'use client';

import { useState, useEffect } from 'react';
import { Plus, Building2, MapPin, Phone, Mail, Edit, Trash2, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Branch {
  id: string;
  name: string;
  mode: 'hybrid' | 'online' | 'offline';
  is_active: boolean;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface BranchFormData {
  name: string;
  mode: 'hybrid' | 'online' | 'offline';
  is_active: boolean;
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState<BranchFormData>({
    name: '',
    mode: 'hybrid',
    is_active: true
  });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0
  });

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    const supabase = createClient();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setBranches(data || []);
      
      // Calculate stats
      const total = data?.length || 0;
      const active = data?.filter(b => b.is_active).length || 0;
      const inactive = total - active;
      
      setStats({ total, active, inactive });
    } catch (error) {
      console.error('Error fetching branches:', error);
      toast.error('Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();

    try {
      if (editingBranch) {
        // Update existing branch
        const { error } = await supabase
          .from('branches')
          .update({
            name: formData.name,
            mode: formData.mode,
            is_active: formData.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingBranch.id);

        if (error) throw error;
        toast.success('Branch updated successfully');
      } else {
        // Create new branch
        const { error } = await supabase
          .from('branches')
          .insert({
            name: formData.name,
            mode: formData.mode,
            is_active: formData.is_active,
            settings: {}
          });

        if (error) throw error;
        toast.success('Branch created successfully');
      }

      setShowDialog(false);
      setEditingBranch(null);
      resetForm();
      fetchBranches();
    } catch (error) {
      console.error('Error saving branch:', error);
      toast.error('Failed to save branch');
    }
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      mode: branch.mode,
      is_active: branch.is_active
    });
    setShowDialog(true);
  };

  const handleDelete = async (branchId: string) => {
    if (!confirm('Are you sure you want to delete this branch?')) return;

    const supabase = createClient();
    try {
      const { error } = await supabase
        .from('branches')
        .delete()
        .eq('id', branchId);

      if (error) throw error;
      toast.success('Branch deleted successfully');
      fetchBranches();
    } catch (error) {
      console.error('Error deleting branch:', error);
      toast.error('Failed to delete branch');
    }
  };

  const toggleBranchStatus = async (branchId: string, currentStatus: boolean) => {
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('branches')
        .update({ is_active: !currentStatus })
        .eq('id', branchId);

      if (error) throw error;

      toast.success(`Branch ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchBranches();
    } catch (error) {
      console.error('Error updating branch:', error);
      toast.error('Failed to update branch status');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      mode: 'hybrid',
      is_active: true
    });
  };

  const openCreateDialog = () => {
    setEditingBranch(null);
    resetForm();
    setShowDialog(true);
  };

  const filteredBranches = branches.filter(branch =>
    branch.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statCards = [
    {
      title: 'Total Branches',
      value: stats.total,
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Active Branches',
      value: stats.active,
      icon: Building2,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Inactive Branches',
      value: stats.inactive,
      icon: Building2,
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
          <h1 className="text-4xl font-bold text-gray-900">Branches</h1>
          <p className="mt-2 text-lg text-gray-600">Manage CASURECO II branch locations</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button 
              className="bg-gradient-to-r from-[#0033A0] to-[#1A237E] hover:from-[#002080] hover:to-[#0d1554]"
              onClick={openCreateDialog}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Branch
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingBranch ? 'Edit Branch' : 'Create New Branch'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Branch Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter branch name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="mode">Branch Mode</Label>
                <select
                  id="mode"
                  value={formData.mode}
                  onChange={(e) => setFormData({ ...formData, mode: e.target.value as 'hybrid' | 'online' | 'offline' })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="hybrid">Hybrid</option>
                  <option value="online">Online Only</option>
                  <option value="offline">Offline Only</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">Select the operational mode for this branch</p>
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
                  {editingBranch ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
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
                placeholder="Search branches by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Branches List */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-[#0033A0] to-[#1A237E] text-white">
          <CardTitle className="text-xl">Branch Locations ({filteredBranches.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredBranches.length === 0 ? (
            <div className="p-8 text-center">
              <Building2 className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-gray-500">
                {searchTerm ? 'No branches found matching your search.' : 'No branches available. Create your first branch to get started.'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredBranches.map((branch) => (
                <div key={branch.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#0033A0] to-[#1A237E] text-white">
                        <Building2 className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{branch.name}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <span className="capitalize font-medium text-blue-600">{branch.mode}</span>
                            <span>mode</span>
                          </div>
                          <div className="text-xs">
                            Created: {new Date(branch.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge 
                        className={branch.is_active 
                          ? 'bg-green-100 text-green-700 hover:bg-green-100' 
                          : 'bg-red-100 text-red-700 hover:bg-red-100'
                        }
                      >
                        {branch.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => toggleBranchStatus(branch.id, branch.is_active)}
                      >
                        {branch.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(branch)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(branch.id)}
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