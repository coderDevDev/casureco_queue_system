'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, Save, RefreshCw, Bell, Clock, Users, Shield, Database, 
  Download, Calendar, Lock, Monitor, AlertCircle, CheckCircle, XCircle,
  HardDrive, Activity, FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  SystemSettings, 
  DEFAULT_SETTINGS, 
  getSettings, 
  saveSettings,
  createBackup,
  getBackupHistory,
  getSystemStats,
  getActiveSessions,
  formatBytes
} from '@/lib/services/settings-service';
import { format } from 'date-fns';

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTickets: 0,
    todayTickets: 0,
    databaseSize: 0,
  });
  const [backupHistory, setBackupHistory] = useState<any[]>([]);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [settingsData, statsData, backups, sessions] = await Promise.all([
        getSettings(),
        getSystemStats(),
        getBackupHistory(5),
        getActiveSessions(),
      ]);

      setSettings(settingsData);
      setStats(statsData);
      setBackupHistory(backups);
      setActiveSessions(sessions);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const success = await saveSettings(settings);
      if (success) {
        toast.success('Settings saved successfully');
      } else {
        toast.error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  async function handleBackup() {
    setBackingUp(true);
    try {
      const result = await createBackup();
      if (result.success && result.url) {
        // Download the backup
        const link = document.createElement('a');
        link.href = result.url;
        link.download = `backup_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.json`;
        link.click();
        URL.revokeObjectURL(result.url);
        
        toast.success('Backup created successfully');
        // Refresh backup history
        const backups = await getBackupHistory(5);
        setBackupHistory(backups);
      } else {
        toast.error(result.error || 'Failed to create backup');
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Failed to create backup');
    } finally {
      setBackingUp(false);
    }
  }

  function handleReset() {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      setSettings(DEFAULT_SETTINGS);
      toast.info('Settings reset to default values');
    }
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      gradient: 'from-blue-100 from-blue-600',
    },
    {
      title: 'Total Tickets',
      value: stats.totalTickets.toLocaleString(),
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      gradient: 'from-green-100 from-green-600',
    },
    {
      title: 'Today\'s Tickets',
      value: stats.todayTickets.toLocaleString(),
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      gradient: 'from-purple-100 from-purple-600',
    },
    {
      title: 'Database Size',
      value: formatBytes(stats.databaseSize),
      icon: HardDrive,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      gradient: 'from-orange-100 from-orange-600',
    },
  ];

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0033A0]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-2">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              System Settings
            </h1>
            <p className="text-gray-600 mt-2">
              Configure system preferences and manage your queue system
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleReset}
              className="gap-2 border-gray-300 hover:border-[#0033A0] hover:text-[#0033A0]"
            >
              <RefreshCw className="h-4 w-4" />
              Reset
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saving}
              className="gap-2 
              bg-blue-700 hover:bg-blue-600
               shadow-lg text-white"
            >
              {saving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat, index) => (
          <Card 
            key={stat.title}
            className="group relative overflow-hidden border-0 bg-white shadow-md hover:shadow-xl transition-all duration-400 hover:-translate-y-1 rounded-xl"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient} to-transparent`} />
            <CardContent className="relative p-4">
              <div className="flex items-start justify-between mb-2">
                <div className={`rounded-xl p-2.5 ${stat.bgColor} transition-all duration-400 group-hover:scale-105 shadow`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className="text-right leading-tight">
                  <div className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent mb-0.5">
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

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-white/80 backdrop-blur-sm shadow-lg p-1 rounded-2xl border border-blue-100">
          <TabsTrigger value="general" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0052D4] data-[state=active]:via-[#4364F7] data-[state=active]:to-[#6FB1FC] data-[state=active]:text-white data-[state=active]:shadow-md rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300 hover:bg-blue-50">
            General
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0052D4] data-[state=active]:via-[#4364F7] data-[state=active]:to-[#6FB1FC] data-[state=active]:text-white data-[state=active]:shadow-md rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300 hover:bg-blue-50">
            Security
          </TabsTrigger>
          <TabsTrigger value="business" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0052D4] data-[state=active]:via-[#4364F7] data-[state=active]:to-[#6FB1FC] data-[state=active]:text-white data-[state=active]:shadow-md rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300 hover:bg-blue-50">
            Business Hours
          </TabsTrigger>
          {/* <TabsTrigger value="notifications" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0052D4] data-[state=active]:via-[#4364F7] data-[state=active]:to-[#6FB1FC] data-[state=active]:text-white data-[state=active]:shadow-md rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300 hover:bg-blue-50">
            Notifications
          </TabsTrigger> */}
          <TabsTrigger value="backup" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0052D4] data-[state=active]:via-[#4364F7] data-[state=active]:to-[#6FB1FC] data-[state=active]:text-white data-[state=active]:shadow-md rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300 hover:bg-blue-50">
            Backup & Data
          </TabsTrigger>
          <TabsTrigger value="system" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0052D4] data-[state=active]:via-[#4364F7] data-[state=active]:to-[#6FB1FC] data-[state=active]:text-white data-[state=active]:shadow-md rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300 hover:bg-blue-50">
            System Health
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Queue Settings Card */}
            <Card className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg overflow-hidden">
              <CardHeader className="border-b border-gray-200 bg-white/50 backdrop-blur-sm">
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Queue Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
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
                  <p className="text-xs text-gray-500">Maximum number of tickets in queue</p>
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
                  <p className="text-xs text-gray-500">Default estimated service time</p>
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
                  <p className="text-xs text-gray-500">Priority ticket weight multiplier</p>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div className="space-y-0.5">
                    <Label>Auto Call Next Ticket</Label>
                    <p className="text-xs text-gray-500">Automatically call next ticket</p>
                  </div>
                  <Switch
                    checked={settings.auto_call_next}
                    onCheckedChange={(checked) => setSettings({ ...settings, auto_call_next: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Display Settings Card */}
            <Card className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg overflow-hidden">
              <CardHeader className="border-b border-gray-200 bg-white/50 backdrop-blur-sm">
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-purple-600" />
                  Display Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
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
                  <p className="text-xs text-gray-500">How often to refresh the display</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select 
                    value={settings.language} 
                    onValueChange={(value) => setSettings({ ...settings, language: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fil">Filipino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div className="space-y-0.5">
                    <Label>Show Wait Times</Label>
                    <p className="text-xs text-gray-500">Display estimated wait times</p>
                  </div>
                  <Switch
                    checked={settings.show_wait_times}
                    onCheckedChange={(checked) => setSettings({ ...settings, show_wait_times: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Customer Names</Label>
                    <p className="text-xs text-gray-500">Display names on public screens</p>
                  </div>
                  <Switch
                    checked={settings.show_customer_names}
                    onCheckedChange={(checked) => setSettings({ ...settings, show_customer_names: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Branding Settings Card */}
            <Card className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg overflow-hidden md:col-span-2">
              <CardHeader className="border-b border-gray-200 bg-white/50 backdrop-blur-sm">
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-green-600" />
                  Organization Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="org_name">Organization Name</Label>
                    <Input
                      id="org_name"
                      value={settings.organization_name}
                      onChange={(e) => setSettings({ ...settings, organization_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="support_email">Support Email</Label>
                    <Input
                      id="support_email"
                      type="email"
                      value={settings.support_email}
                      onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="support_phone">Support Phone</Label>
                    <Input
                      id="support_phone"
                      value={settings.support_phone}
                      onChange={(e) => setSettings({ ...settings, support_phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="welcome_message">Welcome Message</Label>
                    <Textarea
                      id="welcome_message"
                      value={settings.welcome_message}
                      onChange={(e) => setSettings({ ...settings, welcome_message: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Password Policy Card */}
            <Card className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg overflow-hidden">
              <CardHeader className="border-b border-gray-200 bg-white/50 backdrop-blur-sm">
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Lock className="h-5 w-5 text-red-600" />
                  Password Policy
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password_min">Minimum Length</Label>
                  <Input
                    id="password_min"
                    type="number"
                    value={settings.password_min_length}
                    onChange={(e) => setSettings({ ...settings, password_min_length: parseInt(e.target.value) })}
                    min="6"
                    max="32"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Require Uppercase</Label>
                  <Switch
                    checked={settings.password_require_uppercase}
                    onCheckedChange={(checked) => setSettings({ ...settings, password_require_uppercase: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Require Numbers</Label>
                  <Switch
                    checked={settings.password_require_numbers}
                    onCheckedChange={(checked) => setSettings({ ...settings, password_require_numbers: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Require Special Characters</Label>
                  <Switch
                    checked={settings.password_require_special}
                    onCheckedChange={(checked) => setSettings({ ...settings, password_require_special: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Session & Access Card */}
            <Card className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg overflow-hidden">
              <CardHeader className="border-b border-gray-200 bg-white/50 backdrop-blur-sm">
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Session & Access Control
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_attempts">Max Login Attempts</Label>
                  <Input
                    id="max_attempts"
                    type="number"
                    value={settings.max_login_attempts}
                    onChange={(e) => setSettings({ ...settings, max_login_attempts: parseInt(e.target.value) })}
                    min="3"
                    max="10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lockout_duration">Lockout Duration (minutes)</Label>
                  <Input
                    id="lockout_duration"
                    type="number"
                    value={settings.lockout_duration}
                    onChange={(e) => setSettings({ ...settings, lockout_duration: parseInt(e.target.value) })}
                    min="5"
                    max="60"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Active Sessions Card */}
            <Card className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg overflow-hidden md:col-span-2">
              <CardHeader className="border-b border-gray-200 bg-white/50 backdrop-blur-sm">
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  Active Sessions ({activeSessions.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {activeSessions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No active sessions in the last 24 hours
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeSessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{session.name}</p>
                          <p className="text-sm text-gray-500">{session.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            {session.last_sign_in_at ? format(new Date(session.last_sign_in_at), 'MMM dd, HH:mm') : 'Never'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Business Hours - Will continue in next part */}
        <TabsContent value="business" className="space-y-6">
          <Card className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg overflow-hidden">
            <CardHeader className="border-b border-gray-200 bg-white/50 backdrop-blur-sm">
              <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Operating Hours
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                  const dayKey = day as 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
                  const isOpenKey = `is_${dayKey}_open` as keyof SystemSettings;
                  const openKey = `${dayKey}_open` as keyof SystemSettings;
                  const closeKey = `${dayKey}_close` as keyof SystemSettings;
                  
                  return (
                    <div key={day} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-32">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={settings[isOpenKey] as boolean}
                            onCheckedChange={(checked) => setSettings({ ...settings, [isOpenKey]: checked })}
                          />
                          <Label className="capitalize font-medium">{day}</Label>
                        </div>
                      </div>
                      {settings[isOpenKey] ? (
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm text-gray-600">Open:</Label>
                            <Input
                              type="time"
                              value={settings[openKey] as string}
                              onChange={(e) => setSettings({ ...settings, [openKey]: e.target.value })}
                              className="w-32"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-sm text-gray-600">Close:</Label>
                            <Input
                              type="time"
                              value={settings[closeKey] as string}
                              onChange={(e) => setSettings({ ...settings, [closeKey]: e.target.value })}
                              className="w-32"
                            />
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">Closed</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Maintenance Mode Card */}
          <Card className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg overflow-hidden">
            <CardHeader className="border-b border-gray-200 bg-white/50 backdrop-blur-sm">
              <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                Maintenance Mode
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div>
                  <Label className="font-medium">Enable Maintenance Mode</Label>
                  <p className="text-sm text-gray-600">System will be unavailable to users</p>
                </div>
                <Switch
                  checked={settings.maintenance_mode}
                  onCheckedChange={(checked) => setSettings({ ...settings, maintenance_mode: checked })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maintenance_message">Maintenance Message</Label>
                <Textarea
                  id="maintenance_message"
                  value={settings.maintenance_message}
                  onChange={(e) => setSettings({ ...settings, maintenance_message: e.target.value })}
                  rows={3}
                  placeholder="Message to display during maintenance"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Notification Channels Card */}
            <Card className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg overflow-hidden">
              <CardHeader className="border-b border-gray-200 bg-white/50 backdrop-blur-sm">
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Bell className="h-5 w-5 text-blue-600" />
                  Notification Channels
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>SMS Notifications</Label>
                    <p className="text-xs text-gray-500">Send SMS to customers</p>
                  </div>
                  <Switch
                    checked={settings.enable_sms}
                    onCheckedChange={(checked) => setSettings({ ...settings, enable_sms: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-xs text-gray-500">Send emails to customers</p>
                  </div>
                  <Switch
                    checked={settings.enable_email}
                    onCheckedChange={(checked) => setSettings({ ...settings, enable_email: checked })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notification_time">Advance Notification (minutes)</Label>
                  <Input
                    id="notification_time"
                    type="number"
                    value={settings.notification_advance_time}
                    onChange={(e) => setSettings({ ...settings, notification_advance_time: parseInt(e.target.value) })}
                    min="1"
                    max="30"
                  />
                  <p className="text-xs text-gray-500">Notify customers before their turn</p>
                </div>
              </CardContent>
            </Card>

            {/* Email Configuration Card */}
            <Card className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg overflow-hidden">
              <CardHeader className="border-b border-gray-200 bg-white/50 backdrop-blur-sm">
                <CardTitle className="text-lg font-bold text-gray-900">Email Configuration</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp_host">SMTP Host</Label>
                  <Input
                    id="smtp_host"
                    value={settings.smtp_host}
                    onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_port">SMTP Port</Label>
                  <Input
                    id="smtp_port"
                    type="number"
                    value={settings.smtp_port}
                    onChange={(e) => setSettings({ ...settings, smtp_port: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_user">SMTP Username</Label>
                  <Input
                    id="smtp_user"
                    value={settings.smtp_user}
                    onChange={(e) => setSettings({ ...settings, smtp_user: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_from">From Email</Label>
                  <Input
                    id="smtp_from"
                    type="email"
                    value={settings.smtp_from}
                    onChange={(e) => setSettings({ ...settings, smtp_from: e.target.value })}
                    placeholder="noreply@example.com"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Backup & Data Settings */}
        <TabsContent value="backup" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Backup Settings Card */}
            <Card className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg overflow-hidden">
              <CardHeader className="border-b border-gray-200 bg-white/50 backdrop-blur-sm">
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-600" />
                  Backup Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto Backup</Label>
                    <p className="text-xs text-gray-500">Enable automatic backups</p>
                  </div>
                  <Switch
                    checked={settings.auto_backup_enabled}
                    onCheckedChange={(checked) => setSettings({ ...settings, auto_backup_enabled: checked })}
                  />
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
                    </SelectContent>
                  </Select>
                </div>
                <div className="pt-4">
                  <Button 
                    onClick={handleBackup}
                    disabled={backingUp}
                    className="w-full gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                  >
                    {backingUp ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    {backingUp ? 'Creating Backup...' : 'Create Backup Now'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Data Retention Card */}
            <Card className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg overflow-hidden">
              <CardHeader className="border-b border-gray-200 bg-white/50 backdrop-blur-sm">
                <CardTitle className="text-lg font-bold text-gray-900">Data Retention</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="data_retention">Ticket Retention (days)</Label>
                  <Input
                    id="data_retention"
                    type="number"
                    value={settings.data_retention_days}
                    onChange={(e) => setSettings({ ...settings, data_retention_days: parseInt(e.target.value) })}
                    min="30"
                    max="365"
                  />
                  <p className="text-xs text-gray-500">Keep completed tickets for this many days</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="log_retention">Log Retention (days)</Label>
                  <Input
                    id="log_retention"
                    type="number"
                    value={settings.log_retention_days}
                    onChange={(e) => setSettings({ ...settings, log_retention_days: parseInt(e.target.value) })}
                    min="7"
                    max="90"
                  />
                  <p className="text-xs text-gray-500">Keep system logs for this many days</p>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <Label>Auto Cleanup</Label>
                    <p className="text-xs text-gray-500">Automatically delete old data</p>
                  </div>
                  <Switch
                    checked={settings.auto_cleanup_enabled}
                    onCheckedChange={(checked) => setSettings({ ...settings, auto_cleanup_enabled: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Backup History Card */}
            <Card className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg overflow-hidden md:col-span-2">
              <CardHeader className="border-b border-gray-200 bg-white/50 backdrop-blur-sm">
                <CardTitle className="text-lg font-bold text-gray-900">Recent Backups</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {backupHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No backups found
                  </div>
                ) : (
                  <div className="space-y-2">
                    {backupHistory.map((backup, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {format(new Date(backup.created_at), 'MMM dd, yyyy HH:mm')}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatBytes(backup.size_bytes)}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                          {backup.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Health */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* System Status Card */}
            <Card className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg overflow-hidden">
              <CardHeader className="border-b border-gray-200 bg-white/50 backdrop-blur-sm">
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Database</span>
                  </div>
                  <span className="text-sm text-green-600">Online</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium">API Services</span>
                  </div>
                  <span className="text-sm text-green-600">Running</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Queue System</span>
                  </div>
                  <span className="text-sm text-green-600">Active</span>
                </div>
              </CardContent>
            </Card>

            {/* System Info Card */}
            <Card className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg overflow-hidden">
              <CardHeader className="border-b border-gray-200 bg-white/50 backdrop-blur-sm">
                <CardTitle className="text-lg font-bold text-gray-900">System Information</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Version</span>
                  <span className="font-medium">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Uptime</span>
                  <span className="font-medium">99.9%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated</span>
                  <span className="font-medium">{format(new Date(), 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Environment</span>
                  <span className="font-medium">Production</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
