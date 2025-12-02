'use client';

import { useState, useEffect } from 'react';
import { Plus, Palette, Image as ImageIcon, FileText, Save, RotateCcw, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { CloudinaryUpload } from '@/components/ui/cloudinary-upload';
import { cn } from '@/lib/utils';

interface BrandingSettings {
  id?: string;
  logo_url?: string;
  company_name: string;
  primary_color: string;
  secondary_color: string;
  ticket_header_text: string;
  ticket_footer_text: string;
  show_qr_code: boolean;
  show_logo_on_ticket: boolean;
  ticket_border_color: string;
  created_at?: string;
  updated_at?: string;
}

export default function BrandingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [settings, setSettings] = useState<BrandingSettings>({
    company_name: process.env.NEXT_PUBLIC_APP_NAME || 'NAGA Queue System',
    primary_color: '#2563EB',
    secondary_color: '#1E40AF',
    ticket_header_text: 'Please keep your ticket',
    ticket_footer_text: 'Thank you for your patience',
    show_qr_code: true,
    show_logo_on_ticket: true,
    ticket_border_color: '#2563EB',
  });

  const statCards = [
    {
      title: 'Logo Status',
      value: settings.logo_url ? 'Uploaded' : 'Default',
      icon: ImageIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Brand Colors',
      value: '2 Set',
      icon: Palette,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Ticket Design',
      value: 'Customized',
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
  ];

  useEffect(() => {
    fetchBrandingSettings();
  }, []);

  const fetchBrandingSettings = async () => {
    const supabase = createClient();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('branding_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching branding settings:', error);
      toast.error('Failed to load branding settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const supabase = createClient();
    setSaving(true);

    try {
      const dataToSave = {
        ...settings,
        updated_at: new Date().toISOString(),
      };

      if (settings.id) {
        // Update existing
        const { error } = await supabase
          .from('branding_settings')
          .update(dataToSave)
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('branding_settings')
          .insert([dataToSave])
          .select()
          .single();

        if (error) throw error;
        setSettings(data);
      }

      toast.success('Branding settings saved successfully');
    } catch (error) {
      console.error('Error saving branding settings:', error);
      toast.error('Failed to save branding settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings({
      company_name: process.env.NEXT_PUBLIC_APP_NAME || 'NAGA Queue System',
      primary_color: '#2563EB',
      secondary_color: '#1E40AF',
      ticket_header_text: 'Please keep your ticket',
      ticket_footer_text: 'Thank you for your patience',
      show_qr_code: true,
      show_logo_on_ticket: true,
      ticket_border_color: '#2563EB',
    });
    toast.info('Settings reset to default');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading branding settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-8">
      {/* Clean Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Branding & Customization
            </h1>
            <p className="text-gray-600 mt-2">
              Customize your logo, colors, and ticket design
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowPreview(!showPreview)}
              variant="outline"
              className="border-2"
            >
              <Eye className="h-4 w-4 mr-2" />
              {showPreview ? 'Hide' : 'Show'} Preview
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              className="border-2"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Default
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Settings */}
        <div className="space-y-6">
          {/* Logo Upload Section */}
          <Card className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                <div className="p-2 rounded-xl bg-blue-600 shadow-md">
                  <ImageIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle>Company Logo</CardTitle>
                  <CardDescription>
                    Upload your company logo (recommended: 200x200px)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <CloudinaryUpload
                type="image"
                value={settings.logo_url}
                onChange={(url) => setSettings({ ...settings, logo_url: url as string })}
              />
              
              {settings.logo_url && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">Current Logo Preview:</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={settings.logo_url}
                    alt="Company Logo"
                    className="h-24 w-auto mx-auto object-contain"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Company Info Section */}
          <Card className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                <div className="p-2 rounded-xl bg-purple-600 shadow-md">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle>Company Information</CardTitle>
                  <CardDescription>
                    Basic company details
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  value={settings.company_name}
                  onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                  placeholder="Enter company name"
                />
              </div>
            </CardContent>
          </Card>

          {/* Color Scheme Section */}
          <Card className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                <div className="p-2 rounded-xl bg-green-600 shadow-md">
                  <Palette className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle>Color Scheme</CardTitle>
                  <CardDescription>
                    Customize your brand colors
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary_color">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary_color"
                      type="color"
                      value={settings.primary_color}
                      onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                      className="w-20 h-10 cursor-pointer"
                    />
                    <Input
                      value={settings.primary_color}
                      onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                      placeholder="#2563EB"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary_color">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondary_color"
                      type="color"
                      value={settings.secondary_color}
                      onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                      className="w-20 h-10 cursor-pointer"
                    />
                    <Input
                      value={settings.secondary_color}
                      onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                      placeholder="#1E40AF"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ticket_border_color">Ticket Border Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="ticket_border_color"
                    type="color"
                    value={settings.ticket_border_color}
                    onChange={(e) => setSettings({ ...settings, ticket_border_color: e.target.value })}
                    className="w-20 h-10 cursor-pointer"
                  />
                  <Input
                    value={settings.ticket_border_color}
                    onChange={(e) => setSettings({ ...settings, ticket_border_color: e.target.value })}
                    placeholder="#2563EB"
                    className="flex-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ticket Customization Section */}
          <Card className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                <div className="p-2 rounded-xl bg-orange-600 shadow-md">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle>Ticket Design</CardTitle>
                  <CardDescription>
                    Customize ticket appearance
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ticket_header_text">Header Text</Label>
                <Input
                  id="ticket_header_text"
                  value={settings.ticket_header_text}
                  onChange={(e) => setSettings({ ...settings, ticket_header_text: e.target.value })}
                  placeholder="Please keep your ticket"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ticket_footer_text">Footer Text</Label>
                <Textarea
                  id="ticket_footer_text"
                  value={settings.ticket_footer_text}
                  onChange={(e) => setSettings({ ...settings, ticket_footer_text: e.target.value })}
                  placeholder="Thank you for your patience"
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <Label htmlFor="show_logo_on_ticket" className="cursor-pointer">
                    Show Logo on Ticket
                  </Label>
                  <p className="text-xs text-gray-500">Display company logo on printed tickets</p>
                </div>
                <Switch
                  id="show_logo_on_ticket"
                  checked={settings.show_logo_on_ticket}
                  onCheckedChange={(checked) => setSettings({ ...settings, show_logo_on_ticket: checked })}
                />
              </div>

              {/* <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <Label htmlFor="show_qr_code" className="cursor-pointer">
                    Show QR Code
                  </Label>
                  <p className="text-xs text-gray-500">Display QR code for ticket verification</p>
                </div>
                <Switch
                  id="show_qr_code"
                  checked={settings.show_qr_code}
                  onCheckedChange={(checked) => setSettings({ ...settings, show_qr_code: checked })}
                />
              </div> */}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Live Preview */}
        {showPreview && (
          <div className="lg:sticky lg:top-8 h-fit">
            <Card className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg">
              <CardHeader>
                <CardTitle>Live Preview</CardTitle>
                <CardDescription>See how your ticket will look</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Ticket Preview */}
                <div 
                  className="border-4 rounded-lg p-6 bg-white shadow-xl"
                  style={{ borderColor: settings.ticket_border_color }}
                >
                  {/* Header */}
                  <div className="border-b-2 border-dashed pb-4 text-center">
                    {settings.show_logo_on_ticket && settings.logo_url && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={settings.logo_url}
                        alt="Logo"
                        className="h-16 w-auto mx-auto mb-3 object-contain"
                      />
                    )}
                    <h3 className="text-lg font-semibold text-gray-700">
                      {settings.company_name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date().toLocaleDateString()}
                    </p>
                  </div>

                  {/* Ticket Number */}
                  <div className="my-6 text-center">
                    <p className="text-sm font-medium text-gray-600">Your Ticket Number</p>
                    <p 
                      className="mt-2 text-5xl font-bold"
                      style={{ color: settings.primary_color }}
                    >
                      A001
                    </p>
                  </div>

                  {/* Info */}
                  <div className="space-y-2 border-t-2 border-dashed pt-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Service:</span>
                      <span className="font-semibold">General Inquiry</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Queue Position:</span>
                      <span className="font-semibold">5</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time Issued:</span>
                      <span className="font-semibold">
                        {new Date().toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  {/* QR Code */}
                  {settings.show_qr_code && (
                    <div className="mt-4 border-t-2 border-dashed pt-4 text-center">
                      <div className="mx-auto h-24 w-24 rounded-lg bg-gray-100 flex items-center justify-center">
                        <span className="text-xs text-gray-400">QR Code</span>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        Scan to check status
                      </p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="mt-4 text-center">
                    <p className="text-xs text-gray-600">{settings.ticket_header_text}</p>
                    <p className="text-xs text-gray-500 mt-1">{settings.ticket_footer_text}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
