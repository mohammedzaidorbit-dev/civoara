import React from 'react';
import { UnderDevelopment } from '@/components/ui/under-development';
import { IncidentMapView } from '@/components/maps';

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          City-Wide Civic Analytics &amp; Heatmaps
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Spatial density analysis, infrastructure wear patterns, and cross-ward service equity reporting.
        </p>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <IncidentMapView />
      </div>

      <UnderDevelopment
        moduleName="Predictive Civic Infrastructure Analytics"
        phase="Phase 04 (Executive Dashboards)"
        description="Machine learning model detecting repeat infrastructure failures (chronic water line bursts, re-opening potholes) and generating preventative maintenance recommendations."
        featuresPlanned={[
          'PostGIS kernel density spatial heatmaps',
          'Chronic failure hotspot clustering across multi-year data',
          'Ward-by-ward budget allocation and response equity scoring',
          'Automated PDF/CSV executive export reports for City Council',
        ]}
        backHref="/admin"
        backLabel="Return to Command Center"
      />
    </div>
  );
}
