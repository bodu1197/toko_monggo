import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';

  console.log('[OAuth Callback] Received request:', {
    url: requestUrl.toString(),
    hasCode: !!code,
    next
  });

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
          set(name, value, options) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name, options) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    try {
      console.log('[OAuth Callback] Exchanging code for session...');
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('[OAuth Callback] Exchange failed:', error);
        return NextResponse.redirect(new URL('/login?error=auth_failed', requestUrl.origin));
      }

      console.log('[OAuth Callback] Exchange successful, user:', data?.user?.email);
    } catch (error) {
      console.error('[OAuth Callback] Error exchanging code for session:', error);
      // Redirect to login with error
      return NextResponse.redirect(new URL('/login?error=auth_failed', requestUrl.origin));
    }
  } else {
    console.warn('[OAuth Callback] No code parameter found in URL');
  }

  // Redirect to the intended destination or home
  console.log('[OAuth Callback] Redirecting to:', next);
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
