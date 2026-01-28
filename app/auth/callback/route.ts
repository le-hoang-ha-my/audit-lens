import { getSupabaseServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const origin = requestUrl.origin;

    if (code) {
      const supabase = await getSupabaseServerClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('Error exchanging code for session:', error);
        // Redirect to login with error message
        const loginUrl = new URL('/login', origin);
        loginUrl.searchParams.set('error', 'auth_failed');
        return NextResponse.redirect(loginUrl);
      }
    }

    return NextResponse.redirect(`${origin}/dashboard`);
  } catch (error) {
    console.error('Unexpected error in auth callback:', error);
    const requestUrl = new URL(request.url);
    const origin = requestUrl.origin;
    const loginUrl = new URL('/login', origin);
    loginUrl.searchParams.set('error', 'unexpected_error');
    return NextResponse.redirect(loginUrl);
  }
}