'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

export interface AuthActionResult {
  success: boolean;
  error?: string;
  redirectTo?: string;
}

export async function signInAction(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const redirectTo = (formData.get('redirectTo') as string) || '/citizen';

  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // Lookup role from profiles to determine default workspace redirect
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single();

  let destination = redirectTo;
  if (destination === '/citizen' && profile?.role) {
    if (profile.role === 'officer') destination = '/officer';
    if (profile.role === 'supervisor') destination = '/officer';
    if (profile.role === 'commissioner' || profile.role === 'admin') destination = '/admin';
  }

  redirect(destination);
}

export async function signUpAction(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;
  const phone = formData.get('phone') as string;

  if (!email || !password || !fullName) {
    return { success: false, error: 'Full name, email, and password are required.' };
  }

  const origin = (await headers()).get('origin') || 'http://localhost:3000';
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone,
      },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (data.session) {
    redirect('/citizen');
  }

  return {
    success: true,
    error: undefined,
  };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/auth/login');
}

export async function resetPasswordAction(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = formData.get('email') as string;
  if (!email) {
    return { success: false, error: 'Email is required.' };
  }

  const origin = (await headers()).get('origin') || 'http://localhost:3000';
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/auth/reset-password`,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
  };
}

export async function updatePasswordAction(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!password || password.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters long.' };
  }

  if (password !== confirmPassword) {
    return { success: false, error: 'Passwords do not match.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  redirect('/citizen');
}
