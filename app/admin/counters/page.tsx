'use client';

import { useState, useEffect } from 'react';
import { Plus, Monitor, Edit, Trash2, Search, User, Building2, Activity, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { CounterForm } from '@/components/admin/counter-form';
import type { CounterFormData } from '@/lib/validations/counter';

interface Counter {
  id: string;
  name: string;
  branch_id: string;
  staff_id?: string;
  is_active: boolean;
  is_paused: boolean;
  last_ping?: string;
  settings: Record<string, unknown>;
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

export default function CountersPage() {
  const [counters, setCounters] = useState<Counter[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showDialog, setShowDialog] = useState(false);
  const [editingCounter, setEditingCounter] = useState<Counter | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortField, setSortField] = useState<'name' | 'branch' | 'status' | 'created_at'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
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

  const handleSubmit = async (data: CounterFormData) => {
    const supabase = createClient();
    setIsSubmitting(true);

    try {
      if (editingCounter) {
        // Update existing counter
        const { error } = await supabase
          .from('counters')
          .update({
            ...data,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingCounter.id);

        if (error) throw error;
        toast.success('Counter updated successfully');
      } else {
        // Create new counter
        const { error } = await supabase
          .from('counters')
          .insert([{
            ...data,
            settings: {}
          }]);

        if (error) throw error;
        toast.success('Counter created successfully');
      }

      setShowDialog(false);
      setEditingCounter(null);
      fetchData();
    } catch (error) {
      console.error('Error saving counter:', error);
      toast.error('Failed to save counter');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (counter: Counter) => {
    setEditingCounter(counter);
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
      const { error} = await supabase
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

  const openCreateDialog = () => {
    setEditingCounter(null);
    setShowDialog(true);
  };

  const filteredCounters = counters.filter(counter => {
    const matchesSearch = 
      counter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      counter.branch?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      counter.staff?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter === 'active') matchesStatus = counter.is_active && !counter.staff_id;
    if (statusFilter === 'occupied') matchesStatus = counter.staff_id !== undefined && counter.staff_id !== null;
    if (statusFilter === 'inactive') matchesStatus = !counter.is_active;
    
    return matchesSearch && matchesStatus;
  });

  // Sort counters
  const sortedCounters = [...filteredCounters].sort((a, b) => {
    let aValue: string | number = '';
    let bValue: string | number = '';

    switch (sortField) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'branch':
        aValue = a.branch?.name.toLowerCase() || '';
        bValue = b.branch?.name.toLowerCase() || '';
        break;
      case 'status':
        aValue = a.is_active ? (a.staff_id ? 2 : 1) : 0; // inactive=0, active=1, occupied=2
        bValue = b.is_active ? (b.staff_id ? 2 : 1) : 0;
        break;
      case 'created_at':
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
        break;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedCounters.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCounters = sortedCounters.slice(startIndex, endIndex);

  const handleSort = (field: 'name' | 'branch' | 'status' | 'created_at') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-2">
      {/* Clean Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Counters Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage service counters and staff assignments
            </p>
          </div>
          <Button 
            onClick={openCreateDialog}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Counter
          </Button>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                  <div className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent mb-0.5 group-hover:scale-105 transition-transform duration-300">
                    {stat.value}
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-800">{stat.title}</p>
                <p className="text-[10px] text-gray-500">Current status</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Counters List with Search and Filters */}
      <Card className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg overflow-hidden">
        <CardHeader className="border-b border-gray-200 bg-white/50 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">Service Counters</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Showing {startIndex + 1}-{Math.min(endIndex, sortedCounters.length)} of {sortedCounters.length} counter{sortedCounters.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Select value={itemsPerPage.toString()} onValueChange={(value) => {
              setItemsPerPage(Number(value));
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 per page</SelectItem>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="20">20 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Search Bar and Status Filter */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search counters by name, branch, or assigned staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Available</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {sortedCounters.length === 0 ? (
            <div className="p-8 text-center">
              <Monitor className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-gray-500">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No counters found matching your filters.' 
                  : 'No counters available.'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('name')}
                          className="flex items-center gap-1 hover:bg-transparent p-0 h-auto font-semibold"
                        >
                          Counter Name
                          <ArrowUpDown className="h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('branch')}
                          className="flex items-center gap-1 hover:bg-transparent p-0 h-auto font-semibold"
                        >
                          Branch
                          <ArrowUpDown className="h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>Assigned Staff</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('status')}
                          className="flex items-center gap-1 hover:bg-transparent p-0 h-auto font-semibold"
                        >
                          Status
                          <ArrowUpDown className="h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('created_at')}
                          className="flex items-center gap-1 hover:bg-transparent p-0 h-auto font-semibold"
                        >
                          Created
                          <ArrowUpDown className="h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCounters.map((counter, index) => {
                      const status = getCounterStatus(counter);
                      return (
                        <TableRow key={counter.id} className="hover:bg-blue-50/50">
                          <TableCell className="font-medium text-gray-500">
                            {startIndex + index + 1}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-sm">
                                <Monitor className="h-5 w-5" />
                              </div>
                              <div className="font-semibold text-gray-900">{counter.name}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-gray-600">
                              <Building2 className="h-4 w-4" />
                              {counter.branch?.name || 'Unknown Branch'}
                            </div>
                          </TableCell>
                          <TableCell>
                            {counter.staff ? (
                              <div className="flex items-center gap-1 text-gray-600">
                                <User className="h-4 w-4" />
                                {counter.staff.name}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">No staff</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={status.color}>
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {new Date(counter.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {counter.staff_id && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => releaseStaff(counter.id)}
                                  className="text-orange-600 hover:text-orange-700 h-8"
                                >
                                  Release
                                </Button>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => toggleCounterStatus(counter.id, counter.is_active)}
                                className="h-8"
                              >
                                {counter.is_active ? 'Deactivate' : 'Activate'}
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleEdit(counter)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                                onClick={() => handleDelete(counter.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-4">
                  <div className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="h-8"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="h-8 w-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="h-8"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog with Modern Form */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {editingCounter ? 'Edit Counter' : 'Create New Counter'}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(90vh-120px)] px-1">
            <CounterForm
              defaultValues={editingCounter ? {
                name: editingCounter.name,
                branch_id: editingCounter.branch_id,
                is_active: editingCounter.is_active,
                is_paused: editingCounter.is_paused,
              } : undefined}
              branches={branches}
              onSubmit={handleSubmit}
              onCancel={() => setShowDialog(false)}
              isSubmitting={isSubmitting}
              existingCounters={counters.map(c => ({ 
                id: c.id, 
                name: c.name 
              }))}
              editingCounterId={editingCounter?.id}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
