'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, Bell, Clock, Users, Shield, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface SystemSettings {
  // Queue Settings
  max_queue_size: number;
  default_service_duration: number;
  auto_call_next: boolean;
  priority_multiplier: number;
  
  // Notification Settings
  enable_sms: boolean;
  enable_email: boolean;
  notification_advance_time: number;
  
  // Display Settings
  display_refresh_interval: number;
  show_wait_times: boolean;
  show_customer_names: boolean;
  
  // System Settings
  session_timeout: number;
  backup_frequency: string;
  log_retention_days: number;
  
  // Branding
  organization_name: string;
  support_email: string;
  support_phone: string;
  welcome_message: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    max_queue_size: 100,
    default_service_duration: 300,
    auto_call_next: true,
    priority_multiplier: 2,
    enable_sms: false,
    enable_email: true,
    notification_advance_time: 5,
    display_refresh_interval: 5,
    show_wait_times: true,
    show_customer_names: false,
    session_timeout: 30,
    backup_frequency: 'daily',
    log_retention_days: 30,
    organization_name: 'CASURECO II',
    support_email: 'support@casureco2.com',
    support_phone: '+63 54 123 4567',
    welcome_message: 'Welcome to CASURECO II Queue Management System'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({
    total_users: 0,
    active_sessions: 0,
    system_uptime: '99.9%',
    last_backup: new Date().toISOString()
  });

  useEffect(() => {
    fetchSettings();
    fetchSystemStats();
  }, []);

  const fetchSettings = async () => {
    // In a real app, this would fetch from a settings table
    // For now, we'll use localStorage or default values
    setLoading(false);
  };

  const fetchSystemStats = async () => {
    const supabase = createClient();
    
    try {
      // Get user count
      const { count: userCount } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true });
      
      // Get active sessions (users logged in today)
      const { count: activeCount } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .gte('last_sign_in_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      
      setStats({
        total_users: userCount || 0,
        active_sessions: activeCount || 0,
        system_uptime: '99.9%',
        last_backup: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching system stats:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      // In a real app, this would save to a settings table
      // For now, we'll simulate the save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      setSettings({
        max_queue_size: 100,
        default_service_duration: 300,
        auto_call_next: true,
        priority_multiplier: 2,
        enable_sms: false,
        enable_email: true,
        notification_advance_time: 5,
        display_refresh_interval: 5,
        show_wait_times: true,
        show_customer_names: false,
        session_timeout: 30,
        backup_frequency: 'daily',
        log_retention_days: 30,
        organization_name: 'CASURECO II',
        support_email: 'support@casureco2.com',
        support_phone: '+63 54 123 4567',
        welcome_message: 'Welcome to CASURECO II Queue Management System'
      });
      toast.info('Settings reset to default values');
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.total_users,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Active Sessions',
      value: stats.active_sessions,
      icon: Shield,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'System Uptime',
      value: stats.system_uptime,
      icon: Database,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Last Backup',
      value: new Date(stats.last_backup).toLocaleDateString(),
      icon: RefreshCw,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
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
          <h1 className="text-4xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-lg text-gray-600">Configure system preferences and options</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset to Defaults
          </Button>
          <Button 
            className="bg-gradient-to-r from-[#0033A0] to-[#1A237E] hover:from-[#002080] hover:to-[#0d1554]"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* System Stats */}
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
              <p className="mt-2 text-xs text-gray-500">Current status</p>
            </CardContent>
            
            <div className={`absolute bottom-0 left-0 h-1 w-full ${stat.bgColor}`} />
          </Card>
        ))}
      </div>

      {/* Settings Tabs */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-[#0033A0] to-[#1A237E] text-white">
          <CardTitle className="text-xl flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="queue" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="queue">Queue</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="display">Display</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
              <TabsTrigger value="branding">Branding</TabsTrigger>
            </TabsList>

            {/* Queue Settings */}
            <TabsContent value="queue" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="max_queue">Maximum Queue Size</Label>
                  <Input
                    id="max_queue"
                    type="number"
                    value={settings.max_queue_size}
                    onChange={(e) => setSettings({ ...settings, max_queue_size: parseInt(e.target.value) })}
                    min="1"
                    max="1000"
                  />
                  <p className="text-sm text-gray-500">Maximum number of tickets in queue</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service_duration">Default Service Duration (minutes)</Label>
                  <Input
                    id="service_duration"
                    type="number"
                    value={Math.floor(settings.default_service_duration / 60)}
                    onChange={(e) => setSettings({ ...settings, default_service_duration: parseInt(e.target.value) * 60 })}
                    min="1"
                    max="60"
                  />
                  <p className="text-sm text-gray-500">Default estimated service time</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority_multiplier">Priority Multiplier</Label>
                  <Input
                    id="priority_multiplier"
                    type="number"
                    step="0.1"
                    value={settings.priority_multiplier}
                    onChange={(e) => setSettings({ ...settings, priority_multiplier: parseFloat(e.target.value) })}
                    min="1"
                    max="10"
                  />
                  <p className="text-sm text-gray-500">Priority ticket weight multiplier</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto Call Next Ticket</Label>
                    <p className="text-sm text-gray-500">Automatically call next ticket after completion</p>
                  </div>
                  <Switch
                    checked={settings.auto_call_next}
                    onCheckedChange={(checked) => setSettings({ ...settings, auto_call_next: checked })}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Notification Settings */}
            <TabsContent value="notifications" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-gray-500">Send SMS notifications to customers</p>
                  </div>
                  <Switch
                    checked={settings.enable_sms}
                    onCheckedChange={(checked) => setSettings({ ...settings, enable_sms: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-500">Send email notifications to customers</p>
                  </div>
                  <Switch
                    checked={settings.enable_email}
                    onCheckedChange={(checked) => setSettings({ ...settings, enable_email: checked })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notification_time">Notification Advance Time (minutes)</Label>
                  <Input
                    id="notification_time"
                    type="number"
                    value={settings.notification_advance_time}
                    onChange={(e) => setSettings({ ...settings, notification_advance_time: parseInt(e.target.value) })}
                    min="1"
                    max="30"
                  />
                  <p className="text-sm text-gray-500">How early to notify customers before their turn</p>
                </div>
              </div>
            </TabsContent>

            {/* Display Settings */}
            <TabsContent value="display" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="refresh_interval">Display Refresh Interval (seconds)</Label>
                  <Input
                    id="refresh_interval"
                    type="number"
                    value={settings.display_refresh_interval}
                    onChange={(e) => setSettings({ ...settings, display_refresh_interval: parseInt(e.target.value) })}
                    min="1"
                    max="60"
                  />
                  <p className="text-sm text-gray-500">How often to refresh the display screen</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Wait Times</Label>
                    <p className="text-sm text-gray-500">Display estimated wait times on screens</p>
                  </div>
                  <Switch
                    checked={settings.show_wait_times}
                    onCheckedChange={(checked) => setSettings({ ...settings, show_wait_times: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Customer Names</Label>
                    <p className="text-sm text-gray-500">Display customer names on public screens</p>
                  </div>
                  <Switch
                    checked={settings.show_customer_names}
                    onCheckedChange={(checked) => setSettings({ ...settings, show_customer_names: checked })}
                  />
                </div>
              </div>
            </TabsContent>

            {/* System Settings */}
            <TabsContent value="system" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="session_timeout">Session Timeout (minutes)</Label>
                  <Input
                    id="session_timeout"
                    type="number"
                    value={settings.session_timeout}
                    onChange={(e) => setSettings({ ...settings, session_timeout: parseInt(e.target.value) })}
                    min="5"
                    max="480"
                  />
                  <p className="text-sm text-gray-500">User session timeout duration</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backup_frequency">Backup Frequency</Label>
                  <Select 
                    value={settings.backup_frequency} 
                    onValueChange={(value) => setSettings({ ...settings, backup_frequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500">How often to backup system data</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="log_retention">Log Retention (days)</Label>
                  <Input
                    id="log_retention"
                    type="number"
                    value={settings.log_retention_days}
                    onChange={(e) => setSettings({ ...settings, log_retention_days: parseInt(e.target.value) })}
                    min="1"
                    max="365"
                  />
                  <p className="text-sm text-gray-500">How long to keep system logs</p>
                </div>
              </div>
            </TabsContent>

            {/* Branding Settings */}
            <TabsContent value="branding" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="org_name">Organization Name</Label>
                  <Input
                    id="org_name"
                    value={settings.organization_name}
                    onChange={(e) => setSettings({ ...settings, organization_name: e.target.value })}
                    placeholder="Enter organization name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support_email">Support Email</Label>
                  <Input
                    id="support_email"
                    type="email"
                    value={settings.support_email}
                    onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                    placeholder="support@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support_phone">Support Phone</Label>
                  <Input
                    id="support_phone"
                    value={settings.support_phone}
                    onChange={(e) => setSettings({ ...settings, support_phone: e.target.value })}
                    placeholder="+63 XX XXX XXXX"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="welcome_message">Welcome Message</Label>
                  <Textarea
                    id="welcome_message"
                    value={settings.welcome_message}
                    onChange={(e) => setSettings({ ...settings, welcome_message: e.target.value })}
                    placeholder="Enter welcome message for customers"
                    rows={3}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}