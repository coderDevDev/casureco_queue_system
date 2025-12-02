'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useBranding } from '@/lib/hooks/use-branding';
import {
  LayoutDashboard,
  Building2,
  Briefcase,
  Monitor,
  Users,
  Megaphone,
  Settings,
  Zap,
  ChevronRight,
  Ticket,
  Clock,
  BarChart3,
  Palette,
} from 'lucide-react';

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  badge?: string | null;
}

const adminNavigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  // { name: 'Branches', href: '/admin/branches', icon: Building2 },
  { name: 'Services', href: '/admin/services', icon: Briefcase },
  { name: 'Counters', href: '/admin/counters', icon: Monitor },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { name: 'Announcements', href: '/admin/announcements', icon: Megaphone },
  { name: 'Branding', href: '/admin/branding', icon: Palette },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

const supervisorNavigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Services', href: '/admin/services', icon: Briefcase },
  { name: 'Counters', href: '/admin/counters', icon: Monitor },
  { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { name: 'Announcements', href: '/admin/announcements', icon: Megaphone },
];

const staffNavigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/staff', icon: LayoutDashboard },
  { name: 'My Queue', href: '/staff/queue', icon: Ticket },
  { name: 'History', href: '/staff/history', icon: Clock },
  { name: 'Statistics', href: '/staff/stats', icon: BarChart3 },
];

interface AdminSidebarProps {
  role?: 'admin' | 'staff' | 'supervisor';
}

export function AdminSidebar({ role = 'admin' }: AdminSidebarProps) {
  const pathname = usePathname();
  const { branding } = useBranding();
  
  // Determine navigation based on role
  const navigation = 
    role === 'admin' ? adminNavigation :
    role === 'supervisor' ? supervisorNavigation :
    staffNavigation;
  const roleLabel = role === 'admin' ? 'Admin Panel' : role === 'supervisor' ? 'Supervisor Panel' : 'Staff Panel';


  console.log({role})
  return (
    <div className="flex h-screen w-72 flex-col bg-gradient-to-b from-[#0033A0] to-[#1A237E] shadow-2xl">
      {/* Logo & Brand */}
      <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
        {branding.logo_url ? (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl backdrop-blur-sm p-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={branding.logo_url}
              alt={branding.company_name}
              className="h-full w-full object-contain"
            />
          </div>
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
            <Zap className="h-7 w-7 text-yellow-400" />
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-white">{branding.company_name}</h1>
          <p className="text-xs text-white/60">Queue Management System</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
        <div className="mb-4">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-white/40">
            Main Menu
          </p>
        </div>
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-white text-[#0033A0] shadow-lg'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              )}
            >
              {/* Active Indicator */}
              {isActive && (
                <div className="absolute left-0 h-8 w-1 rounded-r-full bg-yellow-400" />
              )}
              
              <item.icon className={cn(
                'h-5 w-5 transition-transform duration-200',
                isActive ? 'text-[#0033A0]' : 'text-white/70 group-hover:text-white'
              )} />
              
              <span className="flex-1">{item.name}</span>
              
              {item.badge && (
                <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-semibold text-[#0033A0]">
                  {item.badge}
                </span>
              )}
              
              <ChevronRight className={cn(
                'h-4 w-4 opacity-0 transition-all duration-200',
                isActive ? 'opacity-100' : 'group-hover:opacity-50'
              )} />
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-4">
        <div className="rounded-xl bg-white/5 p-4 backdrop-blur-sm">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <p className="text-xs font-medium text-white">System Online</p>
          </div>
          <p className="text-xs text-white/50">v1.0.0 • 2025</p>
        </div>
      </div>
    </div>
  );
}