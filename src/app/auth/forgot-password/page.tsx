'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Shield, Mail, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';

export default function ForgotPasswordPage() {
  const { error: toastError, success: toastSuccess } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?next=/auth/reset-password`,
      });

      if (error) {
        setErrorMessage(error.message);
        toastError('Reset Request Failed', error.message);
        setLoading(false);
        return;
      }

      setSubmitted(true);
      toastSuccess('Instructions Sent', 'Check your email inbox for password recovery.');
    } catch {
      setErrorMessage('Unexpected recovery error.');
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
          Account Credential Recovery
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="border-slate-800 shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-slate-900">Reset your password</CardTitle>
            <CardDescription>
              Enter the email address associated with your account to receive a secure recovery link.
            </CardDescription>
          </CardHeader>

          {submitted ? (
            <CardContent className="space-y-4 py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Check Your Email</h3>
              <p className="text-xs text-slate-500">
                A password reset link has been dispatched to <strong>{email}</strong>.
              </p>
              <div className="pt-4">
                <Link href="/auth/login">
                  <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            </CardContent>
          ) : (
            <form onSubmit={handleReset}>
              <CardContent className="space-y-4">
                {errorMessage && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <Input
                  label="Registered Email"
                  type="email"
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4" />}
                  required
                />
              </CardContent>

              <CardFooter className="flex flex-col gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full justify-center"
                  isLoading={loading}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Send Recovery Link
                </Button>
                <Link
                  href="/auth/login"
                  className="text-center text-xs text-slate-500 hover:text-slate-800 font-medium"
                >
                  Cancel and return to Sign In
                </Link>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
