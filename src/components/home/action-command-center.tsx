'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Search,
  ArrowRight,
  MapPin,
  Clock,
  FileCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ActionCommandCenter() {
  const router = useRouter();
  const [ticketInput, setTicketInput] = useState('');
  const [error, setError] = useState('');

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = ticketInput.trim();
    if (!clean) {
      setError('Please provide a valid ticket identifier');
      return;
    }
    setError('');
    router.push(`/public/track?ticket=${encodeURIComponent(clean)}`);
  };

  return (
    <section className="py-16 sm:py-20 bg-[#070D17] text-white border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs font-mono text-sky-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>24/7 Civic Operations Station</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Report an infrastructure defect in your neighborhood
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Submissions take less than two minutes. Attach a photograph, pinpoint the location on the Google Map view, and track resolution through verified dual closure.
          </p>
        </div>

        {/* Dual Command Hub Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Card A: File Report */}
          <div className="bg-[#0B1524] border border-slate-700/90 rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-sky-400 bg-sky-950/80 px-2.5 py-1 rounded border border-sky-800/60">
                  Citizen Intake
                </span>
                <span className="text-xs font-mono text-slate-400">Step 1 of 3</span>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Submit a New Municipal Grievance
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Report road craters, broken luminaires, burst water pipelines, or overflowing waste bins. Your submission is automatically geocoded, assigned to the responsible municipal department, and bound to a strict service level deadline.
              </p>

              {/* Quick Launch Categories */}
              <div className="pt-2">
                <span className="text-[11px] font-mono text-slate-400 block mb-2">
                  Select incident category:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <Link
                    href="/report?category=pothole"
                    className="p-2 rounded bg-slate-900 border border-slate-700/80 text-center hover:border-slate-500 transition-colors"
                  >
                    <span className="block font-semibold text-white">Pothole</span>
                    <span className="text-[10px] text-slate-400 font-mono">48h SLA</span>
                  </Link>
                  <Link
                    href="/report?category=streetlight"
                    className="p-2 rounded bg-slate-900 border border-slate-700/80 text-center hover:border-slate-500 transition-colors"
                  >
                    <span className="block font-semibold text-white">Streetlight</span>
                    <span className="text-[10px] text-slate-400 font-mono">72h SLA</span>
                  </Link>
                  <Link
                    href="/report?category=water_leakage"
                    className="p-2 rounded bg-slate-900 border border-slate-700/80 text-center hover:border-slate-500 transition-colors"
                  >
                    <span className="block font-semibold text-white">Water Leak</span>
                    <span className="text-[10px] text-slate-400 font-mono">12h SLA</span>
                  </Link>
                  <Link
                    href="/report?category=garbage"
                    className="p-2 rounded bg-slate-900 border border-slate-700/80 text-center hover:border-slate-500 transition-colors"
                  >
                    <span className="block font-semibold text-white">Sanitation</span>
                    <span className="text-[10px] text-slate-400 font-mono">24h SLA</span>
                  </Link>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-3">
              <Link href="/report" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-sky-700 hover:bg-sky-600 text-white font-semibold cursor-pointer"
                >
                  Start Incident Report &rarr;
                </Button>
              </Link>
              <Link href="/citizen" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto bg-transparent border-slate-700 text-slate-200 hover:bg-slate-800 cursor-pointer"
                >
                  Open Citizen Portal
                </Button>
              </Link>
            </div>
          </div>

          {/* Card B: Track Ticket */}
          <div className="bg-[#0B1524] border border-slate-700/90 rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-800/60">
                  Public Transparency
                </span>
                <span className="text-xs font-mono text-slate-400">Realtime SLA Clock</span>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Track Existing Incident Resolution
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Monitor field team assignment, supervisory escalations, and verified photographic proof of completed repairs. All tracking information is public and redacted of personal data.
              </p>

              {/* Instant Search Bar */}
              <form onSubmit={handleLookup} className="space-y-2 pt-2">
                <label
                  htmlFor="action-ticket-search"
                  className="block text-xs font-semibold text-slate-300"
                >
                  Enter Your Ticket ID
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      id="action-ticket-search"
                      type="text"
                      value={ticketInput}
                      onChange={(e) => {
                        setTicketInput(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="e.g. CIV-2026-8812"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <span>Track Ticket</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                {error && <p className="text-[11px] text-rose-400 font-medium">{error}</p>}
              </form>
            </div>

            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-3">
              <Link href="/public" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto bg-transparent border-slate-700 text-slate-200 hover:bg-slate-800 cursor-pointer flex items-center justify-center gap-2"
                >
                  <MapPin className="w-4 h-4 text-sky-400" />
                  <span>Public Map Explorer</span>
                </Button>
              </Link>
              <Link href="/public/performance" className="w-full sm:w-auto">
                <Button
                  variant="ghost"
                  size="lg"
                  className="w-full sm:w-auto text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold cursor-pointer"
                >
                  SLA Leaderboard &rarr;
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Three Guarantees Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-slate-800 text-xs">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white block">PostGIS Geofencing</span>
              <span className="text-slate-400 text-[11px] mt-0.5 block leading-normal">
                Municipal ward polygons automatically assign jurisdiction. No unassigned tickets or cross-ward disputes.
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white block">Automated Escalation</span>
              <span className="text-slate-400 text-[11px] mt-0.5 block leading-normal">
                Idempotent server-side cron sweeps detect SLA breaches and elevate to Supervisors and Commissioners.
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3">
            <FileCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white block">Non-Destructive History</span>
              <span className="text-slate-400 text-[11px] mt-0.5 block leading-normal">
                Department reorganizations preserve multi-segment ownership. Elapsed time is never wiped or shifted.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
