import { createClient } from '@/lib/supabase/client';

export interface SystemSettings {
  // General Settings
  max_queue_size: number;
  default_service_duration: number;
  auto_call_next: boolean;
  priority_multiplier: number;
  
  // Display Settings
  display_refresh_interval: number;
  show_wait_times: boolean;
  show_customer_names: boolean;
  language: string;
  
  // Security Settings
  password_min_length: number;
  password_require_uppercase: boolean;
  password_require_numbers: boolean;
  password_require_special: boolean;
  session_timeout: number;
  max_login_attempts: number;
  lockout_duration: number;
  
  // Business Hours
  monday_open: string;
  monday_close: string;
  tuesday_open: string;
  tuesday_close: string;
  wednesday_open: string;
  wednesday_close: string;
  thursday_open: string;
  thursday_close: string;
  friday_open: string;
  friday_close: string;
  saturday_open: string;
  saturday_close: string;
  sunday_open: string;
  sunday_close: string;
  is_monday_open: boolean;
  is_tuesday_open: boolean;
  is_wednesday_open: boolean;
  is_thursday_open: boolean;
  is_friday_open: boolean;
  is_saturday_open: boolean;
  is_sunday_open: boolean;
  
  // Notifications
  enable_sms: boolean;
  enable_email: boolean;
  sms_provider: string;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_from: string;
  notification_advance_time: number;
  
  // Backup & Data
  backup_frequency: string;
  auto_backup_enabled: boolean;
  data_retention_days: number;
  log_retention_days: number;
  auto_cleanup_enabled: boolean;
  
  // Maintenance
  maintenance_mode: boolean;
  maintenance_message: string;
  
  // Branding
  organization_name: string;
  support_email: string;
  support_phone: string;
  welcome_message: string;
}

export const DEFAULT_SETTINGS: SystemSettings = {
  max_queue_size: 100,
  default_service_duration: 300,
  auto_call_next: true,
  priority_multiplier: 2,
  display_refresh_interval: 5,
  show_wait_times: true,
  show_customer_names: false,
  language: 'en',
  password_min_length: 8,
  password_require_uppercase: true,
  password_require_numbers: true,
  password_require_special: true,
  session_timeout: 30,
  max_login_attempts: 5,
  lockout_duration: 15,
  monday_open: '08:00',
  monday_close: '17:00',
  tuesday_open: '08:00',
  tuesday_close: '17:00',
  wednesday_open: '08:00',
  wednesday_close: '17:00',
  thursday_open: '08:00',
  thursday_close: '17:00',
  friday_open: '08:00',
  friday_close: '17:00',
  saturday_open: '08:00',
  saturday_close: '12:00',
  sunday_open: '08:00',
  sunday_close: '12:00',
  is_monday_open: true,
  is_tuesday_open: true,
  is_wednesday_open: true,
  is_thursday_open: true,
  is_friday_open: true,
  is_saturday_open: false,
  is_sunday_open: false,
  enable_sms: false,
  enable_email: true,
  sms_provider: 'twilio',
  smtp_host: '',
  smtp_port: 587,
  smtp_user: '',
  smtp_from: '',
  notification_advance_time: 5,
  backup_frequency: 'daily',
  auto_backup_enabled: true,
  data_retention_days: 90,
  log_retention_days: 30,
  auto_cleanup_enabled: true,
  maintenance_mode: false,
  maintenance_message: 'System is currently under maintenance. Please check back later.',
  organization_name: 'CASURECO II',
  support_email: 'support@casureco2.com',
  support_phone: '+63 54 123 4567',
  welcome_message: 'Welcome to CASURECO II Queue Management System',
};

export async function getSettings(): Promise<SystemSettings> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .single();

    if (error) {
      console.error('Error fetching settings:', error);
      return DEFAULT_SETTINGS;
    }

    return { ...DEFAULT_SETTINGS, ...data };
  } catch (error) {
    console.error('Error fetching settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Partial<SystemSettings>): Promise<boolean> {
  const supabase = createClient();
  
  try {
    const { error } = await supabase
      .from('system_settings')
      .upsert({
        id: 1, // Single row for system settings
        ...settings,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error saving settings:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
}

export async function createBackup(): Promise<{ success: boolean; url?: string; error?: string }> {
  const supabase = createClient();
  
  try {
    // Get all data from all critical tables
    const [
      tickets, 
      users, 
      services, 
      counters, 
      branches, 
      settings
    ] = await Promise.all([
      supabase.from('tickets').select('*'),
      supabase.from('users').select('*'),
      supabase.from('services').select('*'),
      supabase.from('counters').select('*'),
      supabase.from('branches').select('*'),
      supabase.from('system_settings').select('*'),
    ]);

    // Try to get optional tables (may not exist in all setups)
    let holidays = { data: [] };
    let announcements = { data: [] };
    
    try {
      holidays = await supabase.from('holidays').select('*');
    } catch (e) {
      console.log('Holidays table not found, skipping...');
    }
    
    try {
      announcements = await supabase.from('announcements').select('*');
    } catch (e) {
      console.log('Announcements table not found, skipping...');
    }

    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      metadata: {
        total_tickets: tickets.data?.length || 0,
        total_users: users.data?.length || 0,
        total_services: services.data?.length || 0,
        total_counters: counters.data?.length || 0,
        total_branches: branches.data?.length || 0,
      },
      data: {
        tickets: tickets.data || [],
        users: users.data || [],
        services: services.data || [],
        counters: counters.data || [],
        branches: branches.data || [],
        system_settings: settings.data || [],
        holidays: holidays.data || [],
        announcements: announcements.data || [],
      },
    };

    // Create downloadable JSON
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Save backup record
    await supabase.from('backups').insert({
      created_at: new Date().toISOString(),
      size_bytes: blob.size,
      status: 'completed',
    });

    return { success: true, url };
  } catch (error) {
    console.error('Error creating backup:', error);
    return { success: false, error: 'Failed to create backup' };
  }
}

export async function getBackupHistory(limit: number = 10) {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('backups')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching backup history:', error);
    return [];
  }
}

export async function getSystemStats() {
  const supabase = createClient();
  
  try {
    const [
      { count: totalUsers },
      { count: totalTickets },
      { count: todayTickets },
      { count: totalServices },
      { count: totalCounters },
      { count: totalBranches },
    ] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('tickets').select('id', { count: 'exact', head: true }),
      supabase.from('tickets').select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
      supabase.from('services').select('id', { count: 'exact', head: true }),
      supabase.from('counters').select('id', { count: 'exact', head: true }),
      supabase.from('branches').select('id', { count: 'exact', head: true }),
    ]);

    // Estimate database size based on record counts
    // Average estimates: ticket ~1KB, user ~2KB, service ~0.5KB, counter ~0.5KB
    const estimatedSize = 
      (totalTickets || 0) * 1024 +      // 1KB per ticket
      (totalUsers || 0) * 2048 +        // 2KB per user
      (totalServices || 0) * 512 +      // 0.5KB per service
      (totalCounters || 0) * 512 +      // 0.5KB per counter
      (totalBranches || 0) * 1024;      // 1KB per branch

    return {
      totalUsers: totalUsers || 0,
      totalTickets: totalTickets || 0,
      todayTickets: todayTickets || 0,
      databaseSize: estimatedSize,
    };
  } catch (error) {
    console.error('Error fetching system stats:', error);
    return {
      totalUsers: 0,
      totalTickets: 0,
      todayTickets: 0,
      databaseSize: 0,
    };
  }
}

export async function getActiveSessions() {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, last_sign_in_at')
      .not('last_sign_in_at', 'is', null)
      .gte('last_sign_in_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('last_sign_in_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching active sessions:', error);
    return [];
  }
}

export async function getErrorLogs(limit: number = 50) {
  // This would fetch from an error_logs table if you have one
  // For now, return empty array
  return [];
}

export async function restoreFromBackup(backupFile: File): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  
  try {
    // Read the backup file
    const fileContent = await backupFile.text();
    const backup = JSON.parse(fileContent);
    
    // Validate backup structure
    if (!backup.data || !backup.timestamp) {
      return { success: false, error: 'Invalid backup file format' };
    }

    // Confirm with user before proceeding
    if (!confirm(`This will restore data from backup created on ${new Date(backup.timestamp).toLocaleString()}. This action cannot be undone. Continue?`)) {
      return { success: false, error: 'Restore cancelled by user' };
    }

    // Restore data to each table
    const restorePromises = [];

    if (backup.data.services?.length > 0) {
      restorePromises.push(
        supabase.from('services').upsert(backup.data.services, { onConflict: 'id' })
      );
    }

    if (backup.data.counters?.length > 0) {
      restorePromises.push(
        supabase.from('counters').upsert(backup.data.counters, { onConflict: 'id' })
      );
    }

    if (backup.data.branches?.length > 0) {
      restorePromises.push(
        supabase.from('branches').upsert(backup.data.branches, { onConflict: 'id' })
      );
    }

    if (backup.data.system_settings?.length > 0) {
      restorePromises.push(
        supabase.from('system_settings').upsert(backup.data.system_settings, { onConflict: 'id' })
      );
    }

    // Note: Be careful with users and tickets - you may want to skip these or handle differently
    // Restoring users could cause authentication issues
    // Restoring old tickets might not be desired in all cases

    await Promise.all(restorePromises);

    return { success: true };
  } catch (error) {
    console.error('Error restoring backup:', error);
    return { success: false, error: 'Failed to restore backup' };
  }
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
