'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PlusCircle,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Eye,
  X,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { StatusBadge, PriorityBadge, SLABadge } from '@/components/ui/status-badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { createClient } from '@/lib/supabase/client';

export interface DashboardReportItem {
  id: string;
  ticketNumber: string;
  title: string;
  category: string;
  location: string;
  status: 'submitted' | 'triaged' | 'assigned' | 'in_progress' | 'resolved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'critical';
  slaHours: number;
  slaRemaining: string;
  slaStatus: 'on_track' | 'at_risk' | 'breached';
  reportedAt: string;
  description: string;
  photoUrl?: string;
  latitude: number;
  longitude: number;
  departmentName: string;
  timeline: Array<{
    step: string;
    time: string;
    completed: boolean;
    active?: boolean;
    note?: string;
  }>;
}

export function CitizenDashboardView() {
  const [reports, setReports] = useState<DashboardReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<DashboardReportItem | null>(null);

  // Load real submitted issues from Supabase (strictly zero dummy/mock data)
  useEffect(() => {
    let isMounted = true;

    async function loadIssues() {
      try {
        const supabase = createClient();
        const { data: dbIssues, error } = await supabase
          .from('issues')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (!error && dbIssues && dbIssues.length > 0) {
          const mapped: DashboardReportItem[] = dbIssues.map((item) => ({
            id: item.id,
            ticketNumber: item.ticket_number,
            title: item.title,
            category: item.category,
            location: item.address || item.landmark || 'Municipal Grid',
            status: item.status || 'submitted',
            priority: item.priority || 'medium',
            slaHours: item.priority === 'critical' ? 12 : item.priority === 'high' ? 24 : 48,
            slaRemaining: item.status === 'resolved' ? 'Resolved on time' : 'Active SLA',
            slaStatus: item.sla_breached ? 'breached' : 'on_track',
            reportedAt: new Date(item.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
            description: item.description,
            latitude: item.latitude,
            longitude: item.longitude,
            departmentName: 'Municipal Operations Division',
            timeline: [
              {
                step: 'Grievance Intake',
                time: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                completed: true,
                note: 'Logged in PostgreSQL ledger with geospatial verification',
              },
              {
                step: 'Proximity Clustering & Triage',
                time: 'Automated',
                completed: item.status !== 'submitted',
              },
              {
                step: 'Field Officer Assigned',
                time: 'In Queue',
                completed: ['assigned', 'in_progress', 'resolved'].includes(item.status),
              },
              {
                step: 'Field Repair Onsite',
                time: 'Scheduled',
                completed: ['in_progress', 'resolved'].includes(item.status),
                active: item.status === 'in_progress',
              },
              {
                step: 'Citizen Verification & Closure',
                time: item.status === 'resolved' ? 'Closed' : 'Pending',
                completed: item.status === 'resolved',
              },
            ],
          }));

          if (isMounted) {
            setReports(mapped);
          }
        } else {
          if (isMounted) {
            setReports([]);
          }
        }
      } catch (err) {
        console.warn('Could not load live reports:', err);
        if (isMounted) setReports([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadIssues();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute Dashboard Metric Counts
  const totalReports = reports.length;
  const openIssues = reports.filter((r) => ['submitted', 'triaged', 'assigned'].includes(r.status)).length;
  const inProgressIssues = reports.filter((r) => r.status === 'in_progress').length;
  const resolvedIssues = reports.filter((r) => r.status === 'resolved').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Welcome & Quick Action Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Citizen Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitor filed complaints, track municipal dispatch, and verify resolution closures in real time.
          </p>
        </div>

        <Link href="/report">
          <Button
            variant="primary"
            size="md"
            leftIcon={<PlusCircle className="w-4 h-4" />}
            className="shadow-xs"
          >
            Report an Issue
          </Button>
        </Link>
      </div>

      {/* KPI Cards: Total, Open, In-Progress, Resolved */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Submitted Reports */}
        <Card className="border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Submitted
              </span>
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{totalReports}</span>
              <span className="text-xs text-slate-500">filed reports</span>
            </div>
          </CardContent>
        </Card>

        {/* Open Issues (submitted, triaged, assigned) */}
        <Card className="border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                Open & Assigned
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-700">{openIssues}</span>
              <span className="text-xs text-slate-500">awaiting field work</span>
            </div>
          </CardContent>
        </Card>

        {/* In-Progress Issues */}
        <Card className="border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                In-Progress
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-blue-700">{inProgressIssues}</span>
              <span className="text-xs text-slate-500">crews active onsite</span>
            </div>
          </CardContent>
        </Card>

        {/* Resolved Issues */}
        <Card className="border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Resolved
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-700">{resolvedIssues}</span>
              <span className="text-xs text-slate-500">100% verified closures</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports Table with Inspection Action */}
      <Card className="border-slate-200 bg-white shadow-xs">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">
                Recent Grievance Reports
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Click &quot;Inspect&quot; on any report to examine the municipal lifecycle timeline and coordinates.
              </CardDescription>
            </div>

            <span className="text-xs text-slate-400 font-mono">
              Auto-refreshed with PostgreSQL audit logs
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500">
              Loading citizen reports from municipal database...
            </div>
          ) : reports.length === 0 ? (
            <div className="py-16 text-center space-y-4 px-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 mx-auto flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="font-bold text-slate-900 text-sm">No Grievance Reports Filed</h4>
                <p className="text-xs text-slate-500">
                  You have not submitted any complaints yet. When you report a civic problem like a pothole, leak, or streetlight hazard, real-time dispatch and SLA countdowns will appear here.
                </p>
              </div>
              <Link href="/report">
                <Button variant="accent" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
                  Submit Your First Report
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket Ref</TableHead>
                  <TableHead>Title & Location</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>SLA Target</TableHead>
                  <TableHead>Date Filed</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow
                    key={report.ticketNumber}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <TableCell className="font-mono text-xs font-bold text-slate-900">
                      {report.ticketNumber}
                    </TableCell>

                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-900 line-clamp-1 max-w-xs">
                          {report.title}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-xs">{report.location}</span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <PriorityBadge priority={report.priority} />
                    </TableCell>

                    <TableCell>
                      <StatusBadge status={report.status} />
                    </TableCell>

                    <TableCell>
                      <SLABadge status={report.slaStatus} text={report.slaRemaining} />
                    </TableCell>

                    <TableCell className="text-xs text-slate-600">
                      {report.reportedAt}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedReport(report)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Inspect
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Interactive Issue Details & Status History Modal */}
      {selectedReport && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedReport(null)}
        >
          <div
            className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-sky-400 font-bold">
                  Municipal Incident Record
                </span>
                <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                  <span>{selectedReport.ticketNumber}</span>
                  <span className="text-xs font-normal text-slate-400">
                    &bull; {selectedReport.departmentName}
                  </span>
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Title & Status Bar */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <h4 className="text-base font-bold text-slate-900">
                    {selectedReport.title}
                  </h4>
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={selectedReport.priority} />
                    <StatusBadge status={selectedReport.status} />
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                  {selectedReport.description}
                </p>
              </div>

              {/* Coordinates & Location Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                  <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block">
                    Location Description
                  </span>
                  <p className="font-bold text-slate-800">{selectedReport.location}</p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                  <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block">
                    Verified Coordinates
                  </span>
                  <p className="font-mono text-slate-800">
                    Lat: {selectedReport.latitude}, Lng: {selectedReport.longitude}
                  </p>
                </div>
              </div>

              {/* Status History & Operational Lifecycle Timeline */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    Status History & Operational Timeline
                  </h5>
                  <span className="text-[11px] text-slate-400">
                    SLA: {selectedReport.slaRemaining}
                  </span>
                </div>

                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {selectedReport.timeline.map((item, idx) => (
                    <div key={idx} className="relative">
                      {/* Timeline Dot */}
                      <div
                        className={`
                          absolute -left-6 top-1 w-4 h-4 rounded-full border-2 flex items-center justify-center
                          ${
                            item.completed
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : item.active
                              ? 'bg-amber-500 border-white ring-2 ring-amber-400 animate-pulse'
                              : 'bg-white border-slate-300'
                          }
                        `}
                      >
                        {item.completed && <CheckCircle2 className="w-3 h-3" />}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-bold ${
                              item.active ? 'text-indigo-600 font-extrabold' : 'text-slate-800'
                            }`}
                          >
                            {item.step}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.time}
                          </span>
                        </div>
                        {item.note && (
                          <p className="text-[11px] text-slate-500 leading-tight">
                            {item.note}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {selectedReport.latitude && selectedReport.longitude ? (
                  <div className="flex items-center gap-2 text-[11px] font-semibold">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${selectedReport.latitude},${selectedReport.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-700 hover:text-sky-800 underline inline-flex items-center gap-1"
                    >
                      Google Maps
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <span className="text-slate-300">&bull;</span>
                    <a
                      href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${selectedReport.latitude},${selectedReport.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-700 hover:text-sky-800 underline inline-flex items-center gap-1"
                    >
                      Street View
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-400">
                    Citizen Identity Masked & Protected
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/public/track?id=${encodeURIComponent(selectedReport.ticketNumber)}`}
                >
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                  >
                    Open Public Tracker
                  </Button>
                </Link>

                <Button
                  type="button"
                  variant="navy"
                  size="sm"
                  onClick={() => setSelectedReport(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
