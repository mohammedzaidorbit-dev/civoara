import React from 'react';
import { Metadata } from 'next';
import { PublicNavbar, Footer } from '@/components/layout';
import { ReportIssueForm } from '@/components/citizen/report-issue-form';

export const metadata: Metadata = {
  title: 'Report a Civic Issue: CIVOARA Municipal Intake',
  description:
    'Submit municipal incident reports, road damage, potholes, sanitation, streetlight, and water issues directly to city operations.',
};

export default function ReportPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <PublicNavbar />

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header Description */}
          <div className="space-y-2 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Report a Civic Issue
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl mx-auto">
              Submit public infrastructure issues directly to municipal operations. Every submission is recorded in the immutable audit log and automatically routed to the responsible ward team under binding service-level deadlines.
            </p>
          </div>

          {/* Operational Standards Strip: 2x2 Grid (Avoids 3-box row) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs max-w-3xl mx-auto">
            <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs">
              <span className="font-semibold text-slate-900 block">SLA Commitment</span>
              <span className="text-slate-500">12h to 96h resolution target</span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs">
              <span className="font-semibold text-slate-900 block">Ward Dispatch</span>
              <span className="text-slate-500">Geospatial PostGIS boundary</span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs">
              <span className="font-semibold text-slate-900 block">Cluster Detection</span>
              <span className="text-slate-500">Duplicate merging &amp; prioritization</span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs">
              <span className="font-semibold text-slate-900 block">Audit Log</span>
              <span className="text-slate-500">Immutable lifecycle tracking</span>
            </div>
          </div>

          {/* Master Form */}
          <ReportIssueForm />
        </div>
      </main>

      <Footer />
    </div>
  );
}
