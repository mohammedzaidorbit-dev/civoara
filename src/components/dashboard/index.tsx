import React from 'react';

export function DashboardMetrics() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Incidents</span>
        <div className="text-2xl font-bold mt-1 text-slate-900 font-mono">0</div>
      </div>
      <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">SLA Compliance</span>
        <div className="text-2xl font-bold mt-1 text-emerald-600 font-mono">100%</div>
      </div>
      <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Avg Resolution</span>
        <div className="text-2xl font-bold mt-1 text-slate-900 font-mono">N/A</div>
      </div>
      <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Resolved</span>
        <div className="text-2xl font-bold mt-1 text-slate-900 font-mono">0</div>
      </div>
    </div>
  );
}
