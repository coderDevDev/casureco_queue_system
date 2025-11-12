'use client';

import { useState, useEffect } from 'react';
import { Plus, Users, Edit, Trash2, Search, Shield, Building2, Mail, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

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

interface UserFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'admin' | 'staff' | 'supervisor';
  branch_id: string;
  is_active: boolean;
}

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showDialog, setShowDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'staff',
    branch_id: '',
    is_active: true
  });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();

    try {
      if (editingUser) {
        // Update existing user
        const { error } = await supabase
          .from('users')
          .update({
            name: formData.name,
            role: formData.role,
            branch_id: formData.branch_id || null,
            is_active: formData.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingUser.id);

        if (error) throw error;
        toast.success('User updated successfully');
      } else {
        // Create new user with Supabase Auth
        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
          toast.error('Passwords do not match');
          return;
        }

        // Validate password strength
        if (formData.password.length < 8) {
          toast.error('Password must be at least 8 characters');
          return;
        }

        // Create auth user using admin API to avoid auto-signin
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: formData.email,
          password: formData.password,
          user_metadata: {
            name: formData.name,
            role: formData.role,
            branch_id: formData.branch_id || null,
            is_active: formData.is_active
          },
          email_confirm: true // Skip email confirmation for admin-created users
        });

        if (authError) {
          toast.error(authError.message);
          return;
        }

        if (!authData.user) {
          toast.error('Failed to create user');
          return;
        }

        // Manually create the user profile since admin.createUser doesn't trigger the trigger
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            name: formData.name,
            email: formData.email,
            role: formData.role,
            branch_id: formData.branch_id || null,
            is_active: formData.is_active
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // User was created in auth but profile failed - this is recoverable
          toast.warning('User created but profile setup incomplete. User may need to complete setup on first login.');
        }

        toast.success('User created successfully!');
      }

      setShowDialog(false);
      setEditingUser(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error('Failed to save user');
    }
  };

  const handleEdit = (user: AppUser) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      confirmPassword: '',
      role: user.role,
      branch_id: user.branch_id || '',
      is_active: user.is_active
    });
    setShowDialog(true);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    const supabase = createClient();
    try {
      // Note: In production, you should deactivate rather than delete users
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

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'staff',
      branch_id: '',
      is_active: true
    });
  };

  const openCreateDialog = () => {
    setEditingUser(null);
    resetForm();
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
        return <Shield className="h-5 w-5 text-red-600" />;
      case 'supervisor':
        return <Users className="h-5 w-5 text-purple-600" />;
      case 'staff':
        return <User className="h-5 w-5 text-blue-600" />;
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Users</h1>
          <p className="mt-2 text-lg text-gray-600">Manage system users and their roles</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button 
              className="bg-gradient-to-r from-[#0033A0] to-[#1A237E] hover:from-[#002080] hover:to-[#0d1554]"
              onClick={openCreateDialog}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'Edit User' : 'Create New User'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter full name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@casureco2.com"
                  required
                  disabled={!!editingUser} // Disable email editing for existing users
                />
                {editingUser && (
                  <p className="text-sm text-gray-500 mt-1">Email cannot be changed for existing users</p>
                )}
              </div>
              {!editingUser && (
                <>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter password"
                      required
                      minLength={8}
                    />
                    <p className="text-sm text-gray-500 mt-1">Must be at least 8 characters</p>
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Confirm password"
                      required
                      minLength={8}
                    />
                  </div>
                </>
              )}
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={formData.role} onValueChange={(value: 'admin' | 'staff' | 'supervisor') => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="branch">Branch (optional)</Label>
                <Select value={formData.branch_id || 'no-branch'} onValueChange={(value) => setFormData({ ...formData, branch_id: value === 'no-branch' ? '' : value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-branch">No Branch</SelectItem>
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
                  {editingUser ? 'Update' : 'Create'}
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
                placeholder="Search users by name, email, or branch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
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
        </CardContent>
      </Card>

      {/* Users List */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-[#0033A0] to-[#1A237E] text-white">
          <CardTitle className="text-xl">System Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-gray-500">
                {searchTerm || roleFilter !== 'all' 
                  ? 'No users found matching your filters.' 
                  : 'No users available.'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredUsers.map((user) => (
                <div key={user.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#0033A0] to-[#1A237E] text-white">
                        {getRoleIcon(user.role)}
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                          {getRoleBadge(user.role)}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {user.email}
                          </div>
                          {user.branch && (
                            <div className="flex items-center gap-1">
                              <Building2 className="h-4 w-4" />
                              {user.branch.name}
                            </div>
                          )}
                          <div className="text-xs">
                            Joined: {new Date(user.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge 
                        className={user.is_active 
                          ? 'bg-green-100 text-green-700 hover:bg-green-100' 
                          : 'bg-red-100 text-red-700 hover:bg-red-100'
                        }
                      >
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => toggleUserStatus(user.id, user.is_active)}
                      >
                        {user.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(user.id)}
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