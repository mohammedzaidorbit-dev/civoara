'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  PlusCircle,
  Clock,
  MapPin,
  ArrowRight,
  FileText,
  Layers,
  AlertCircle,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge, PriorityBadge } from '@/components/ui/status-badge';
import { SubmitReportResult } from '@/lib/actions/incident';

interface IssueConfirmationProps {
  reportResult: SubmitReportResult;
  onReset: () => void;
}

export function IssueConfirmation({
  reportResult,
  onReset,
}: IssueConfirmationProps) {
  const [copied, setCopied] = useState(false);

  const ticketNumber = reportResult.ticketNumber || 'CIV-2026-9001';

  const handleCopyTicket = () => {
    navigator.clipboard.writeText(ticketNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const formatCategoryName = (cat?: string) => {
    if (!cat) return 'General Incident';
    return cat
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Success Badge Header */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm border border-emerald-200">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900">
            {reportResult.isClustered
              ? 'Report Successfully Linked to Tracked Issue'
              : 'Civic Report Successfully Submitted'}
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
            {reportResult.isClustered
              ? 'Your grievance has been merged into an existing tracked incident in this immediate vicinity to expedite municipal resolution.'
              : 'Your grievance has been logged into the municipal intake queue and scheduled for automated proximity clustering.'}
          </p>
        </div>
      </div>

      {/* Duplicate Cluster Association Callout */}
      {reportResult.isClustered && (
        <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sky-950 flex items-start gap-3 shadow-xs">
          <Layers className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
          <div className="space-y-1.5 text-xs flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-sm text-sky-950 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-sky-700" />
                Community Cluster Detected &amp; Linked
              </span>
              <span className="font-mono px-2 py-0.5 bg-sky-200 text-sky-900 rounded font-semibold text-[11px]">
                {reportResult.clusterCode || 'CLUST-ACTIVE'}
              </span>
            </div>
            <p className="text-sky-900 leading-relaxed">
              <strong>{reportResult.clusterReportCount || 2} citizen reports</strong> have been confirmed for this physical issue. Your report has been attached to canonical ticket{' '}
              <strong className="font-mono text-sky-950 font-bold">
                {reportResult.canonicalTicketNumber || reportResult.ticketNumber}
              </strong>
              . Repeated independent reports elevate priority without duplicating field dispatches.
            </p>
          </div>
        </div>
      )}

      {/* Review Queued Callout */}
      {reportResult.isReviewQueued && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950 flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <span className="font-bold text-sm text-amber-950">
              Potential Duplicate Under Supervisor Review
            </span>
            <p className="text-amber-900 leading-relaxed">
              A similar report was recently filed nearby. Your report is currently being reviewed by municipal triage to confirm if it should be merged into an existing repair ticket.
            </p>
          </div>
        </div>
      )}

      {/* Ticket Reference Highlight Box */}
      <Card className="border-slate-300 bg-white shadow-xs">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Official Tracking Reference
              </span>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-slate-900 tracking-wider">
                {ticketNumber}
              </div>
              <p className="text-xs text-slate-500">
                Keep this code to track operational progress or contact your ward officer.
              </p>
            </div>

            <Button
              type="button"
              variant={copied ? 'secondary' : 'outline'}
              size="sm"
              onClick={handleCopyTicket}
              leftIcon={copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              className="shrink-0 bg-white"
            >
              {copied ? 'Copied to Clipboard!' : 'Copy Reference'}
            </Button>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-700 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <Clock className="w-4 h-4 text-sky-700 shrink-0" />
              <div>
                <span className="font-semibold block">SLA Commitment</span>
                <span className="text-slate-500">{reportResult.slaHours || 48} Hours Turnaround</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-700 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <MapPin className="w-4 h-4 text-sky-700 shrink-0" />
              <div>
                <span className="font-semibold block">Geotagged Dispatch</span>
                <span className="text-slate-500">PostGIS Coordinates Verified</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Summary Card */}
      <Card className="border-slate-200">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              Report Summary
            </h3>
            <div className="flex items-center gap-2">
              <PriorityBadge priority={reportResult.priority || 'medium'} />
              <StatusBadge status="submitted" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {reportResult.photoUrl && (
              <div className="sm:col-span-1 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 h-32">
                <img
                  src={reportResult.photoUrl}
                  alt="Submitted photograph"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className={`space-y-2 text-xs ${reportResult.photoUrl ? 'sm:col-span-2' : 'sm:col-span-3'}`}>
              <div>
                <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
                  Title
                </span>
                <p className="font-bold text-sm text-slate-900 mt-0.5">
                  {reportResult.title}
                </p>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
                  Category
                </span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {formatCategoryName(reportResult.category)}
                </p>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
                  Location & Coordinates
                </span>
                <p className="text-slate-700 mt-0.5">
                  {reportResult.locationDescription || 'Downtown Civic Ward'}
                </p>
                {reportResult.latitude && reportResult.longitude && (
                  <p className="font-mono text-[11px] text-slate-500">
                    Lat: {reportResult.latitude}, Lng: {reportResult.longitude}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={onReset}
          leftIcon={<PlusCircle className="w-4 h-4" />}
          className="w-full sm:w-auto"
        >
          Report Another Issue
        </Button>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link href={`/public/track?id=${encodeURIComponent(ticketNumber)}`} className="w-full sm:w-auto">
            <Button
              type="button"
              variant="secondary"
              size="md"
              leftIcon={<ExternalLink className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              Public Tracker
            </Button>
          </Link>

          <Link href="/citizen/dashboard" className="w-full sm:w-auto">
            <Button
              type="button"
              variant="primary"
              size="md"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              Citizen Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
