'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { error: toastError, success: toastSuccess } = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        toastError('Password Update Failed', error.message);
        setLoading(false);
        return;
      }

      toastSuccess('Password Updated', 'Your credentials have been securely refreshed.');
      router.push('/citizen');
    } catch {
      setErrorMessage('Unexpected update error.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4">
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
          Establish New Credentials
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="border-slate-800 shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-slate-900">Set New Password</CardTitle>
            <CardDescription>
              Choose a strong password containing at least 8 characters.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleUpdate}>
            <CardContent className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <Input
                label="New Password"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />

              <Input
                label="Confirm New Password"
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />
            </CardContent>

            <CardFooter>
              <Button
                type="submit"
                variant="primary"
                className="w-full justify-center"
                isLoading={loading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Update Password &amp; Continue
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
