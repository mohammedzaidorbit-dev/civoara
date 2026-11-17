'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { Compass } from 'lucide-react';

const DynamicPublicIssueMap = dynamic(
  () => import('./public-issue-map').then((mod) => mod.PublicIssueMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[540px] rounded-2xl border border-slate-200 bg-slate-900 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Compass className="w-8 h-8 text-indigo-400 animate-spin" />
        <span className="text-xs font-semibold tracking-wide">
          Loading OpenStreetMap Leaflet Engine &amp; City Wards...
        </span>
      </div>
    ),
  }
);

export function PublicMapWrapper() {
  return <DynamicPublicIssueMap />;
}
