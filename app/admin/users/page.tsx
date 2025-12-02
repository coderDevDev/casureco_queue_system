'use client';

import { useState, useEffect } from 'react';
import { Plus, Users, Edit, Trash2, Search, Shield, Building2, Mail, User, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { UserForm } from '@/components/admin/user-form';
import type { CreateUserFormData, UpdateUserFormData } from '@/lib/validations/user';

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff' | 'supervisor';
  branch_id?: string;
  is_active: boolean;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  branch?: {
    name: string;
  };
}

interface Branch {
  id: string;
  name: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showDialog, setShowDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortField, setSortField] = useState<'name' | 'email' | 'role' | 'created_at'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    admins: 0,
    staff: 0,
    supervisors: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const supabase = createClient();
    setLoading(true);

    try {
      // Fetch users with branch info
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select(`
          *,
          branch:branches(name)
        `)
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Fetch branches for the form
      const { data: branchesData, error: branchesError } = await supabase
        .from('branches')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (branchesError) throw branchesError;

      setUsers(usersData || []);
      setBranches(branchesData || []);
      
      // Calculate stats
      const total = usersData?.length || 0;
      const active = usersData?.filter(u => u.is_active).length || 0;
      const admins = usersData?.filter(u => u.role === 'admin').length || 0;
      const staff = usersData?.filter(u => u.role === 'staff').length || 0;
      const supervisors = usersData?.filter(u => u.role === 'supervisor').length || 0;
      
      setStats({ total, active, admins, staff, supervisors });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: CreateUserFormData | UpdateUserFormData) => {
    const supabase = createClient();
    setIsSubmitting(true);

    try {
      if (editingUser) {
        // Update existing user
        const updateData = data as UpdateUserFormData;
        const { error } = await supabase
          .from('users')
          .update({
            name: updateData.name,
            role: updateData.role,
            branch_id: updateData.branch_id || null,
            is_active: updateData.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingUser.id);

        if (error) throw error;
        toast.success('User updated successfully');
      } else {
        // Create new user via API route (uses service role key)
        const createData = data as CreateUserFormData;

        const response = await fetch('/api/admin/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: createData.email,
            password: createData.password,
            name: createData.name,
            role: createData.role,
            branch_id: createData.branch_id || null,
            is_active: createData.is_active
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          const errorMsg = result.details 
            ? `${result.error}: ${result.details}` 
            : result.error || 'Failed to create user';
          console.error('User creation error:', result);
          toast.error(errorMsg);
          return;
        }

        toast.success('User created successfully!');
      }

      setShowDialog(false);
      setEditingUser(null);
      fetchData();
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error('Failed to save user');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (user: AppUser) => {
    setEditingUser(user);
    setShowDialog(true);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;

    const supabase = createClient();
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', userId);

      if (error) throw error;
      toast.success('User deactivated successfully');
      fetchData();
    } catch (error) {
      console.error('Error deactivating user:', error);
      toast.error('Failed to deactivate user');
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchData();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user status');
    }
  };

  const openCreateDialog = () => {
    setEditingUser(null);
    setShowDialog(true);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.branch?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Sort users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aValue: string | number = '';
    let bValue: string | number = '';

    switch (sortField) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'email':
        aValue = a.email.toLowerCase();
        bValue = b.email.toLowerCase();
        break;
      case 'role':
        aValue = a.role;
        bValue = b.role;
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
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = sortedUsers.slice(startIndex, endIndex);

  const handleSort = (field: 'name' | 'email' | 'role' | 'created_at') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter]);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Admin</Badge>;
      case 'supervisor':
        return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Supervisor</Badge>;
      case 'staff':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Staff</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-5 w-5 text-white-600" />;
      case 'supervisor':
        return <Users className="h-5 w-5 text-white-600" />;
      case 'staff':
        return <User className="h-5 w-5 text-white-600" />;
      default:
        return <User className="h-5 w-5 text-gray-600" />;
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.total,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Active Users',
      value: stats.active,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Administrators',
      value: stats.admins,
      icon: Shield,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Staff Members',
      value: stats.staff,
      icon: User,
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
              Users Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage system users and their roles
            </p>
          </div>
          <Button 
            onClick={openCreateDialog}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add User
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

      {/* Users List with Search and Filters */}
      <Card className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg overflow-hidden">
        <CardHeader className="border-b border-gray-200 bg-white/50 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">System Users</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Showing {startIndex + 1}-{Math.min(endIndex, sortedUsers.length)} of {sortedUsers.length} user{sortedUsers.length !== 1 ? 's' : ''}
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
          
          {/* Search Bar and Role Filter */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search users by name, email, or branch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {sortedUsers.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-gray-500">
                {searchTerm || roleFilter !== 'all' 
                  ? 'No users found matching your filters.' 
                  : 'No users available.'}
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
                          Name
                          <ArrowUpDown className="h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('email')}
                          className="flex items-center gap-1 hover:bg-transparent p-0 h-auto font-semibold"
                        >
                          Email
                          <ArrowUpDown className="h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('role')}
                          className="flex items-center gap-1 hover:bg-transparent p-0 h-auto font-semibold"
                        >
                          Role
                          <ArrowUpDown className="h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('created_at')}
                          className="flex items-center gap-1 hover:bg-transparent p-0 h-auto font-semibold"
                        >
                          Joined
                          <ArrowUpDown className="h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((user, index) => (
                      <TableRow key={user.id} className="hover:bg-blue-50/50">
                        <TableCell className="font-medium text-gray-500">
                          {startIndex + index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-sm">
                              {getRoleIcon(user.role)}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{user.name}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-gray-600">
                            <Mail className="h-4 w-4" />
                            {user.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getRoleBadge(user.role)}
                        </TableCell>
                        <TableCell>
                          {user.branch ? (
                            <div className="flex items-center gap-1 text-gray-600">
                              <Building2 className="h-4 w-4" />
                              {user.branch.name}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">No branch</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={user.is_active 
                              ? 'bg-green-100 text-green-700 hover:bg-green-100' 
                              : 'bg-red-100 text-red-700 hover:bg-red-100'
                            }
                          >
                            {user.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => toggleUserStatus(user.id, user.is_active)}
                              className="h-8"
                            >
                              {user.is_active ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleEdit(user)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                              onClick={() => handleDelete(user.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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
              {editingUser ? 'Edit User' : 'Create New User'}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(90vh-120px)] px-1">
            <UserForm
              defaultValues={editingUser ? {
                name: editingUser.name,
                email: editingUser.email,
                role: editingUser.role,
                branch_id: editingUser.branch_id || '',
                is_active: editingUser.is_active,
              } : undefined}
              branches={branches}
              onSubmit={handleSubmit}
              onCancel={() => setShowDialog(false)}
              isSubmitting={isSubmitting}
              isEditing={!!editingUser}
              existingUsers={users.map(u => ({ 
                id: u.id, 
                email: u.email 
              }))}
              editingUserId={editingUser?.id}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
