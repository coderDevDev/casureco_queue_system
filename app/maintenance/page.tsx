'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Clock, Mail, Phone } from 'lucide-react';
import { getSettings } from '@/lib/services/settings-service';

export default function MaintenancePage() {
  const [settings, setSettings] = useState({
    maintenance_message: 'System is currently under maintenance. Please check back later.',
    organization_name: 'CASURECO II',
    support_email: 'support@casureco2.com',
    support_phone: '+63 54 123 4567',
  });

  useEffect(() => {
    async function loadSettings() {
      const data = await getSettings();
      setSettings({
        maintenance_message: data.maintenance_message,
        organization_name: data.organization_name,
        support_email: data.support_email,
        support_phone: data.support_phone,
      });
    }
    loadSettings();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-1000"></div>
        </div>

        {/* Main Card */}
        <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 md:p-12">
          {/* Icon */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-orange-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-orange-400 to-orange-600 rounded-full p-6 shadow-2xl">
                <AlertTriangle className="h-16 w-16 text-white" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-center text-white mb-4">
            Under Maintenance
          </h1>

          {/* Subtitle */}
          <p className="text-center text-blue-200 text-lg mb-8">
            {settings.organization_name}
          </p>

          {/* Message */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/10">
            <p className="text-white/90 text-center text-lg leading-relaxed">
              {settings.maintenance_message}
            </p>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
              <Clock className="h-5 w-5 text-blue-300 animate-pulse" />
              <span className="text-white/90 text-sm font-medium">
                We'll be back soon
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-transparent text-white/60">Need immediate assistance?</span>
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Email */}
            <a
              href={`mailto:${settings.support_email}`}
              className="group flex items-center gap-3 bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all duration-300"
            >
              <div className="bg-blue-500/20 rounded-lg p-3 group-hover:bg-blue-500/30 transition-colors">
                <Mail className="h-5 w-5 text-blue-300" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-white/60 mb-1">Email Support</p>
                <p className="text-white font-medium text-sm">{settings.support_email}</p>
              </div>
            </a>

            {/* Phone */}
            <a
              href={`tel:${settings.support_phone}`}
              className="group flex items-center gap-3 bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all duration-300"
            >
              <div className="bg-green-500/20 rounded-lg p-3 group-hover:bg-green-500/30 transition-colors">
                <Phone className="h-5 w-5 text-green-300" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-white/60 mb-1">Phone Support</p>
                <p className="text-white font-medium text-sm">{settings.support_phone}</p>
              </div>
            </a>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-white/40 text-sm">
              Thank you for your patience and understanding
            </p>
          </div>
        </div>

        {/* Animated Dots */}
        <div className="flex justify-center gap-2 mt-8">
          <div className="w-3 h-3 bg-white/40 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-white/40 rounded-full animate-bounce delay-100"></div>
          <div className="w-3 h-3 bg-white/40 rounded-full animate-bounce delay-200"></div>
        </div>
      </div>
    </div>
  );
}
