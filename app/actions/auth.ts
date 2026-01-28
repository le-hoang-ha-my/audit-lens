'use server';

import { getSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { ServerActionResponse } from '@/lib/types';

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password: string): boolean {
  return password.length >= 6;
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<ServerActionResponse> {
  try {
    // Input validation
    if (!email || !password) {
      return { success: false, error: 'Email and password are required' };
    }

    if (!validateEmail(email)) {
      return { success: false, error: 'Invalid email format' };
    }

    if (!validatePassword(password)) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }

    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: 'Authentication failed' };
    }

    revalidatePath('/dashboard');
    redirect('/dashboard');
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

export async function signUpWithEmail(
  email: string,
  password: string
): Promise<ServerActionResponse<{ message: string }>> {
  try {
    // Input validation
    if (!email || !password) {
      return { success: false, error: 'Email and password are required' };
    }

    if (!validateEmail(email)) {
      return { success: false, error: 'Invalid email format' };
    }

    if (!validatePassword(password)) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }

    const supabase = await getSupabaseServerClient();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      return { success: false, error: 'Server configuration error' };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${appUrl}/auth/callback`,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: { message: 'Check your email to confirm your account!' },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

export async function signOut(): Promise<ServerActionResponse> {
  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/');
    redirect('/login');
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

// Form-compatible wrapper that returns void
export async function signOutFormAction(): Promise<void> {
  await signOut();
  // redirect() throws, so this never returns
}