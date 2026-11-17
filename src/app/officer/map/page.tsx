import React from 'react';
import { UnderDevelopment } from '@/components/ui/under-development';
import { IncidentMapView } from '@/components/maps';

export default function OfficerMapPage() {
  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          Field Dispatch &amp; Route Map
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Geospatial visualization of assigned incident pins, cluster perimeters, and optimal service vehicle navigation.
        </p>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <IncidentMapView />
      </div>

      <UnderDevelopment
        moduleName="Geospatial Field Route Optimization"
        phase="Phase 03 (Incident Management & Clustering)"
        description="Interactive Mapbox/MapLibre vector tiles with live GPS tracking for municipal vehicles and turn-by-turn routing between high-priority SLA clusters."
        featuresPlanned={[
          'Live PostGIS vector tile incident rendering',
          'Haversine cluster radius visual overlays (50m bounds)',
          'Multi-stop TSP vehicle route optimization',
          'Offline caching for field officer mobile devices',
        ]}
        backHref="/officer"
        backLabel="Return to Command Center"
      />
    </div>
  );
}
