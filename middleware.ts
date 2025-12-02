import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check maintenance mode (only if system_settings table exists)
  try {
    const { data: settings, error: settingsError } = await supabase
      .from('system_settings')
      .select('maintenance_mode')
      .single();

    // If table doesn't exist or error, allow normal access
    if (settingsError) {
      console.log('System settings not found, allowing normal access');
      return response;
    }

    const isMaintenanceMode = settings?.maintenance_mode || false;
    const isMaintenancePage = request.nextUrl.pathname === '/maintenance';
    const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');

    // If maintenance mode is ON
    if (isMaintenanceMode) {
      // Allow admin users to access admin routes
      if (isAdminRoute && user) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile?.role === 'admin') {
          // Admin can access during maintenance
          return response;
        }
      }

      // Redirect non-admin users to maintenance page
      if (!isMaintenancePage) {
        return NextResponse.redirect(new URL('/maintenance', request.url));
      }
    } else {
      // If maintenance mode is OFF and user is on maintenance page, redirect to home
      if (isMaintenancePage) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
  } catch (error) {
    console.error('Middleware error:', error);
    // If error checking maintenance mode, allow normal access
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)',
  ],
};
