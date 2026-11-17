'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReportIssueForm } from '@/components/citizen/report-issue-form';

export default function CitizenReportIncidentPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link href="/citizen/dashboard">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Citizen Dashboard
          </Button>
        </Link>
        <span className="text-xs font-mono text-slate-400">
          Form Intake Standard &bull; PostGIS Geocoding
        </span>
      </div>

      <ReportIssueForm />
    </div>
  );
}
