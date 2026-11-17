'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '';
  const { error: toastError, success: toastSuccess } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        toastError('Authentication Failed', error.message);
        setLoading(false);
        return;
      }

      toastSuccess('Authenticated', `Welcome back, ${data.user.email}`);

      // Query user role from profiles to route appropriately
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      let target = redirectTo;
      if (!target) {
        if (profile?.role === 'officer' || profile?.role === 'supervisor') {
          target = '/officer';
        } else if (profile?.role === 'admin' || profile?.role === 'commissioner') {
          target = '/admin';
        } else {
          target = '/citizen';
        }
      }

      router.push(target);
      router.refresh();
    } catch {
      setErrorMessage('Unexpected authentication error occurred.');
      setLoading(false);
    }
  };

  // Quick fill helper for development testing
  const setTestAccount = (testEmail: string) => {
    setEmail(testEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg font-bold">
            <Shield className="w-5 h-5 text-indigo-100" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-white">
            CIVOARA
          </span>
        </Link>
        <p className="text-xs text-slate-400">
          Civic Incident Management &bull; Municipal Identity Access Management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="border-slate-800 shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-slate-900">Sign in to your account</CardTitle>
            <CardDescription>
              Enter your verified municipal credentials or citizen email.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <Input
                label="Email Address"
                type="email"
                placeholder="name@civoara.gov or citizen@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Password
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                  required
                />
              </div>

              {/* Dev Test Accounts Helper */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Development Seed Accounts (Password: Password123!)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setTestAccount('admin@civoara.gov')}
                    className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold truncate border border-slate-200"
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => setTestAccount('commissioner@civoara.gov')}
                    className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold truncate border border-slate-200"
                  >
                    Commissioner
                  </button>
                  <button
                    type="button"
                    onClick={() => setTestAccount('supervisor@civoara.gov')}
                    className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold truncate border border-slate-200"
                  >
                    Supervisor
                  </button>
                  <button
                    type="button"
                    onClick={() => setTestAccount('officer@civoara.gov')}
                    className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold truncate border border-slate-200"
                  >
                    Officer
                  </button>
                  <button
                    type="button"
                    onClick={() => setTestAccount('citizen@civoara.gov')}
                    className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold truncate border border-slate-200 col-span-2 sm:col-span-1"
                  >
                    Citizen
                  </button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <Button
                type="submit"
                variant="primary"
                className="w-full justify-center"
                isLoading={loading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In
              </Button>
              <p className="text-center text-xs text-slate-500">
                New resident?{' '}
                <Link href="/auth/register" className="text-indigo-600 font-bold hover:underline">
                  Register a Citizen Account
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
