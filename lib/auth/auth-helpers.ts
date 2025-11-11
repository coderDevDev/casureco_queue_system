import { createClient } from '@/lib/supabase/client';
import { UserRole } from '@/types/database';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  branch_id: string;
  is_active: boolean;
  avatar_url?: string;
}

/**
 * Get current user session
 */
export async function getCurrentUser() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Get current user profile with role
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = createClient();
  const user = await getCurrentUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !data) {
    return null;
  }

  return data as UserProfile;
}

/**
 * Check if user has specific role
 */
export async function hasRole(role: UserRole | UserRole[]): Promise<boolean> {
  const profile = await getUserProfile();
  if (!profile) return false;

  if (Array.isArray(role)) {
    return role.includes(profile.role);
  }

  return profile.role === role;
}

/**
 * Check if user is admin
 */
export async function isAdmin(): Promise<boolean> {
  return hasRole('admin');
}

/**
 * Check if user is admin or supervisor
 */
export async function isAdminOrSupervisor(): Promise<boolean> {
  return hasRole(['admin', 'supervisor']);
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
  const supabase = createClient();
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
}

/**
 * Sign out
 */
export async function signOut() {
  const supabase = createClient();
  return await supabase.auth.signOut();
}

/**
 * Sign up new user
 */
export async function signUp(
  email: string,
  password: string,
  userData: {
    name: string;
    role: UserRole;
    branch_id: string;
  }
) {
  const supabase = createClient();
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData,
    },
  });
}

/**
 * Update user profile
 */
export async function updateProfile(updates: Partial<UserProfile>) {
  const supabase = createClient();
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  return { data, error };
}

/**
 * Reset password
 */
export async function resetPassword(email: string) {
  const supabase = createClient();
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
}

/**
 * Update password
 */
export async function updatePassword(newPassword: string) {
  const supabase = createClient();
  return await supabase.auth.updateUser({
    password: newPassword,
  });
}