import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh auth session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Protected route checking
  const isAuthRoute = path.startsWith('/auth/');
  const isCitizenRoute = path.startsWith('/citizen');
  const isOfficerRoute = path.startsWith('/officer');
  const isAdminRoute = path.startsWith('/admin');

  // Allow dev previews or redirect to login when unauthenticated in production
  if (!user && (isCitizenRoute || isOfficerRoute || isAdminRoute)) {
    // In strict production mode, redirect to /auth/login
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/login';
      url.searchParams.set('redirectTo', path);
      return NextResponse.redirect(url);
    }
  }

  // Redirect authenticated user away from login/register
  if (user && isAuthRoute && !path.includes('/callback')) {
    const url = request.nextUrl.clone();
    url.pathname = '/citizen';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
