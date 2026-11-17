'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, User, Phone, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';

export default function RegisterPage() {
  const router = useRouter();
  const { error: toastError, success: toastSuccess } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successComplete, setSuccessComplete] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        toastError('Registration Failed', error.message);
        setLoading(false);
        return;
      }

      toastSuccess('Account Registered', 'Welcome to CIVOARA!');
      if (data.session) {
        router.push('/citizen');
      } else {
        setSuccessComplete(true);
      }
    } catch {
      setErrorMessage('Unexpected registration error occurred.');
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
          Citizen Grievance &amp; Verification Registration
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="border-slate-800 shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-slate-900">Create Citizen Account</CardTitle>
            <CardDescription>
              Register to submit complaints, attach GPS photos, and track municipal SLAs.
            </CardDescription>
          </CardHeader>

          {successComplete ? (
            <CardContent className="space-y-4 py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Registration Recorded!</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                We have sent an authentication confirmation link to <strong>{email}</strong>.
                Please check your inbox to activate your account.
              </p>
              <div className="pt-4">
                <Link href="/auth/login">
                  <Button variant="primary" size="md">
                    Return to Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          ) : (
            <form onSubmit={handleRegister}>
              <CardContent className="space-y-4">
                {errorMessage && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <Input
                  label="Full Name"
                  placeholder="e.g. Alex Morgan"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  leftIcon={<User className="w-4 h-4" />}
                  required
                />

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="your.email@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4" />}
                  required
                />

                <Input
                  label="Mobile Phone (for SMS updates)"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  leftIcon={<Phone className="w-4 h-4" />}
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                  required
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
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
                  Create Citizen Account
                </Button>
                <p className="text-center text-xs text-slate-500">
                  Already registered?{' '}
                  <Link href="/auth/login" className="text-indigo-600 font-bold hover:underline">
                    Sign in
                  </Link>
                </p>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
