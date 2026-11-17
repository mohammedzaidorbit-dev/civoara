import React from 'react';
import Link from 'next/link';
import { GitMerge, ArrowRight, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { UnderDevelopment } from '@/components/ui/under-development';

export default function AdminDepartmentsPage() {
  const departments = [
    { code: 'ROADS_HIGHWAYS', name: 'Roads & Highways Maintenance', lead: 'Dir. A. Thorne', officers: 24, routingTags: 'potholes, asphalt, curbs' },
    { code: 'WATER_SEWERAGE', name: 'Water & Sewerage Board', lead: 'Eng. R. Patel', officers: 18, routingTags: 'pipe bursts, sewage, contamination' },
    { code: 'WASTE_MGMT', name: 'Waste Management & Sanitation', lead: 'Supv. M. Gomez', officers: 32, routingTags: 'garbage, litter, hazardous waste' },
    { code: 'ELECTRICAL', name: 'Electrical & Street Lighting', lead: 'Eng. T. Lewis', officers: 12, routingTags: 'streetlights, exposed wires' },
    { code: 'TRAFFIC_TRANSIT', name: 'Traffic Engineering Division', lead: 'Capt. D. Miller', officers: 15, routingTags: 'signals, signage, road paint' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Department Routing &amp; Taxonomy
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure automated category assignment, department jurisdiction boundaries, and default officer pools.
          </p>
        </div>
        <Link href="/admin/reorganization">
          <Button variant="primary" size="sm" leftIcon={<GitMerge className="w-4 h-4" />}>
            Restructuring Wizard
          </Button>
        </Link>
      </div>

      {/* Restructuring Callout Banner */}
      <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <h3 className="font-bold text-sm text-slate-900">
              Department Mergers &amp; Ward Transfers
            </h3>
            <p className="text-xs text-slate-600">
              Planning to merge municipal divisions or transfer ward jurisdiction? Our Fair SLA migration engine prevents unearned SLA blame and preserves citizen grievance history.
            </p>
          </div>
        </div>
        <Link href="/admin/reorganization" className="shrink-0">
          <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
            Open Reorganization Wizard
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {departments.map((dept) => (
          <Card key={dept.code}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  {dept.code}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {dept.officers} Field Officers
                </span>
              </div>
              <CardTitle className="text-base text-slate-900 mt-1">{dept.name}</CardTitle>
              <CardDescription>Department Head: {dept.lead}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 text-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Auto-Routing Tags</span>
              <p className="text-slate-700 font-mono mt-0.5">{dept.routingTags}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <UnderDevelopment
        moduleName="Department SLA & Geographic Jurisdiction Matrix"
        phase="Phase 03 & 04 Integration"
        description="Dynamic ward-to-department geofencing polygons, cross-agency escalation chains, and automatic load-balancing among field crews."
        featuresPlanned={[
          'PostGIS MultiPolygon jurisdictional geofencing configuration',
          'Automatic re-dispatch when department capacity exceeds 90%',
          'Inter-departmental handoffs with audit validation',
          'Custom category tagging with AI-assisted intent classification',
        ]}
        backHref="/admin"
        backLabel="Return to Command Center"
      />
    </div>
  );
}
