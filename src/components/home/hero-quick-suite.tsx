'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  ArrowRight,
  Clock,
  ShieldCheck,
  Droplets,
  Lightbulb,
  Trash2,
  AlertCircle,
} from 'lucide-react';

export function HeroQuickSuite() {
  const router = useRouter();
  const [ticketNumber, setTicketNumber] = useState('');
  const [error, setError] = useState('');

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = ticketNumber.trim();
    if (!clean) {
      setError('Please enter a ticket number');
      return;
    }
    setError('');
    router.push(`/public/track?ticket=${encodeURIComponent(clean)}`);
  };

  const categories = [
    {
      id: 'pothole',
      name: 'Pothole & Roads',
      sla: '48h SLA',
      icon: <AlertCircle className="w-4 h-4 text-amber-400" />,
      href: '/report?category=pothole',
      bgClass: 'hover:border-amber-500/50 hover:bg-slate-800/80',
    },
    {
      id: 'streetlight',
      name: 'Streetlight Outage',
      sla: '72h SLA',
      icon: <Lightbulb className="w-4 h-4 text-sky-400" />,
      href: '/report?category=streetlight',
      bgClass: 'hover:border-sky-500/50 hover:bg-slate-800/80',
    },
    {
      id: 'water_leakage',
      name: 'Water & Hydrant',
      sla: '12h SLA',
      icon: <Droplets className="w-4 h-4 text-blue-400" />,
      href: '/report?category=water_leakage',
      bgClass: 'hover:border-blue-500/50 hover:bg-slate-800/80',
    },
    {
      id: 'garbage',
      name: 'Sanitation & Waste',
      sla: '24h SLA',
      icon: <Trash2 className="w-4 h-4 text-emerald-400" />,
      href: '/report?category=garbage',
      bgClass: 'hover:border-emerald-500/50 hover:bg-slate-800/80',
    },
  ];

  return (
    <div className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl p-5 sm:p-6 text-white space-y-5 shadow-xl">
      {/* Header & Status Indicator */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono font-semibold tracking-wide uppercase text-slate-300">
            Realtime Intake &amp; Lookup
          </span>
        </div>
        <span className="text-[11px] font-mono font-medium text-sky-400 bg-sky-950/80 border border-sky-800/60 px-2 py-0.5 rounded">
          PostGIS Active
        </span>
      </div>

      {/* Instant Ticket Lookup Bar */}
      <div className="space-y-2">
        <label
          htmlFor="hero-ticket-input"
          className="block text-xs font-semibold text-slate-300"
        >
          Track Grievance by Ticket ID
        </label>
        <form onSubmit={handleTrackSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              id="hero-ticket-input"
              type="text"
              value={ticketNumber}
              onChange={(e) => {
                setTicketNumber(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. CIV-2026-8812"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>Lookup</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
        {error && <p className="text-[11px] text-rose-400 font-medium">{error}</p>}
      </div>

      {/* Category Quick Launch Grid */}
      <div className="space-y-2 pt-1 border-t border-slate-800">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300">Quick Incident Dispatch</span>
          <span className="text-[10px] text-slate-400 font-mono">Demo SLA Target</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={cat.href}
              className={`p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 transition-colors flex items-start gap-2.5 cursor-pointer ${cat.bgClass}`}
            >
              <div className="shrink-0 mt-0.5">{cat.icon}</div>
              <div className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-white truncate">
                  {cat.name}
                </span>
                <span className="block text-[10px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  {cat.sla}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Live Engine Assurance Strip */}
      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          ST_DWithin 50m Clustering
        </span>
        <span className="text-slate-500">&bull;</span>
        <span>Escalation Levels 0–3</span>
      </div>
    </div>
  );
}
