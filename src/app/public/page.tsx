'use client';

import React from 'react';
import Link from 'next/link';
import { Search, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PublicMapWrapper } from '@/components/maps';

export default function PublicExplorerPage() {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Public Incident Explorer &amp; Map
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-300">
              Open Data
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time public transparency map powered by OpenStreetMap and Leaflet. Track neighborhood issues, filter by ward, and inspect resolution progress without logging in.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/public/performance">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Search className="w-4 h-4 text-emerald-600" />}
            >
              Performance &amp; SLA
            </Button>
          </Link>
          <Link href="/public/track">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Search className="w-4 h-4 text-sky-600" />}
            >
              Track by Ticket ID
            </Button>
          </Link>
          <Link href="/report">
            <Button
              variant="navy"
              size="sm"
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Report an Issue
            </Button>
          </Link>
        </div>
      </div>

      {/* Complete Leaflet Public Map & List Subsystem */}
      <PublicMapWrapper />
    </div>
  );
}
