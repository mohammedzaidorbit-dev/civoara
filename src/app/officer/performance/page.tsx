import React from 'react';
import { UnderDevelopment } from '@/components/ui/under-development';
import { Card, CardContent } from '@/components/ui/card';

export default function OfficerPerformancePage() {
  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          Officer SLA Performance &amp; Metrics
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Personal response times, SLA adherence records, and municipal service benchmarks.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase">30-Day SLA Adherence</span>
            <div className="text-2xl font-bold text-emerald-600 font-mono">96.8%</div>
            <p className="text-[11px] text-slate-500">Above department standard (90%)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase">Average Turnaround</span>
            <div className="text-2xl font-bold text-sky-700 font-mono">5.4 Hours</div>
            <p className="text-[11px] text-slate-500">Fastest response in Ward 12</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase">Citizen Confirmation</span>
            <div className="text-2xl font-bold text-slate-900 font-mono">98.2%</div>
            <p className="text-[11px] text-slate-500">Verified without dispute</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase">Shifts Completed</span>
            <div className="text-2xl font-bold text-slate-900 font-mono">42</div>
            <p className="text-[11px] text-slate-500">Current quarter operational log</p>
          </CardContent>
        </Card>
      </div>

      <UnderDevelopment
        moduleName="Officer Analytics &amp; Gamified Benchmarks"
        phase="Phase 04 (Officer &amp; Admin Dashboards)"
        description="Historical SLA performance charting, ward-level resolution velocity, supervisor feedback logs, and commendation records."
        featuresPlanned={[
          'SLA compliance percentile rankings across departments',
          'Shift-by-shift field dispatch efficiency metrics',
          'Automated overtime and emergency response tracking',
          'Supervisor audit reviews and commendations log',
        ]}
        backHref="/officer"
        backLabel="Return to Command Center"
      />
    </div>
  );
}
