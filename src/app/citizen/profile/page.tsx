'use client';

import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Bell } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';

export default function CitizenProfilePage() {
  const { success } = useToast();
  const [fullName, setFullName] = useState('Alex Morgan');
  const [email] = useState('alex.citizen@civoara.local');
  const [phone, setPhone] = useState('+1 (555) 234-5678');
  const [address, setAddress] = useState('742 Evergreen Terrace, Ward 12');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    success('Profile Updated', 'Your contact and notification preferences have been saved.');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="pb-6 border-b border-slate-200">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          Citizen Profile &amp; Preferences
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your verified citizen credentials, emergency contact info, and alert channels.
        </p>
      </div>

      <form onSubmit={handleSave}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
                AM
              </div>
              <div>
                <CardTitle>Verified Citizen Account</CardTitle>
                <CardDescription>Identity verified under Municipal Civic Act 2026</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Legal Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                required
              />
              <Input
                label="Official Email Address"
                value={email}
                disabled
                helperText="Verified municipal login address"
                leftIcon={<Mail className="w-4 h-4" />}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Phone (SMS Incident Alerts)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                leftIcon={<Phone className="w-4 h-4" />}
                required
              />
              <Input
                label="Primary Neighborhood / Ward"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                leftIcon={<MapPin className="w-4 h-4" />}
                required
              />
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-600" />
                Notification Subscriptions
              </h4>
              <div className="space-y-2 text-xs text-slate-700">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-indigo-600 focus:ring-indigo-500" />
                  <span>SMS alerts when an assigned officer is dispatched to my report</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-indigo-600 focus:ring-indigo-500" />
                  <span>Email notifications when resolution photos are uploaded for review</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-indigo-600 focus:ring-indigo-500" />
                  <span>Quarterly Municipal Ward SLA Transparency Digest</span>
                </label>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Data encrypted and protected under municipal privacy regulations.
            </span>
            <Button type="submit" variant="primary" size="md">
              Save Preferences
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
