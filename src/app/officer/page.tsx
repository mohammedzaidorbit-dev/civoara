'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  MapPin,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Camera,
  ClipboardList,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge, PriorityBadge } from '@/components/ui/status-badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { getOfficerAssignedIncidentsAction } from '@/lib/actions/incident';

interface AssignedTicketItem {
  id: string;
  ticketNumber: string;
  title: string;
  priority: string;
  status: string;
  location: string;
  slaCountdown: string;
  reportedAt: string;
  clusterCount: number;
}

export default function OfficerDashboardPage() {
  const [assignedTickets, setAssignedTickets] = useState<AssignedTicketItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const liveItems = await getOfficerAssignedIncidentsAction();
        if (isMounted) {
          setAssignedTickets(liveItems);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load officer dashboard data:', err);
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const breachedOrUrgent = assignedTickets.filter(
    (t) => t.priority === 'critical' || t.slaCountdown.includes('Breached')
  );

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Officer Field Command
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
              Roads &amp; Highways Unit
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Officer Sarah Chen (Badge #PW-4091). Review assigned work queue, update repair evidence, and manage SLA timers.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link href="/officer/map">
            <Button variant="outline" size="sm" leftIcon={<MapPin className="w-4 h-4 text-amber-600" />}>
              Field Route Map
            </Button>
          </Link>
          <Link href="/officer/queue">
            <Button variant="navy" size="sm" leftIcon={<CheckSquare className="w-4 h-4" />}>
              Open Ticket Queue
            </Button>
          </Link>
        </div>
      </div>

      {/* SLA Risk Alert Notice (Only shown if urgent/breached tickets exist) */}
      {breachedOrUrgent.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 animate-pulse" />
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-900">
                Urgent SLA Breach Warning
              </span>
              <p className="text-xs text-rose-800 leading-relaxed">
                Ticket <strong>{breachedOrUrgent[0].ticketNumber}</strong> ({breachedOrUrgent[0].location}) requires immediate supervisory attention ({breachedOrUrgent[0].slaCountdown}).
              </p>
            </div>
          </div>
          <Link href="/officer/queue">
            <Button size="sm" variant="danger" className="shrink-0 text-xs">
              Resolve Now
            </Button>
          </Link>
        </div>
      )}

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Assigned to Me
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{assignedTickets.length}</p>
              <p className="text-[11px] text-amber-700 font-medium mt-0.5">
                Active field tickets
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <CheckSquare className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Resolved Closures
              </p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">
                {assignedTickets.filter((t) => t.status === 'resolved').length}
              </p>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Photo verified
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Avg Response Time
              </p>
              <p className="text-2xl font-bold text-sky-700 mt-1">
                {assignedTickets.length > 0 ? '4.8h' : '0.0h'}
              </p>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Target: &lt; 12.0h
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Field SLA Health
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {assignedTickets.length > 0 ? '98.5%' : '100%'}
              </p>
              <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                On-time compliance
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assigned Work Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Priority Field Work Queue</h2>
            <p className="text-xs text-slate-500">Tickets awaiting field action or evidence upload.</p>
          </div>
          <Link href="/officer/queue" className="text-xs font-semibold text-sky-700 hover:text-sky-900 inline-flex items-center gap-1">
            Full Work Queue ({assignedTickets.length}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <Card className="border-slate-200 bg-white shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500">
              Loading active field assignments...
            </div>
          ) : assignedTickets.length === 0 ? (
            <div className="py-16 text-center space-y-4 px-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 mx-auto flex items-center justify-center">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="font-bold text-slate-900 text-sm">Operational Queue Clear</h4>
                <p className="text-xs text-slate-500">
                  There are currently no tickets assigned to your field unit. All municipal issues in your sector have been remediated.
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket ID &amp; Location</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Cluster Intelligence</TableHead>
                  <TableHead>SLA Countdown</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignedTickets.map((ticket) => (
                  <TableRow key={ticket.id} className="hover:bg-slate-50/80 transition-colors">
                    <TableCell>
                      <span className="font-mono text-xs font-bold text-sky-700 block">{ticket.ticketNumber}</span>
                      <span className="text-xs text-slate-600 inline-flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" /> {ticket.location}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs font-medium text-slate-900 text-xs line-clamp-1">
                      {ticket.title}
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={ticket.priority} size="sm" />
                    </TableCell>
                    <TableCell className="text-xs font-medium text-slate-600">
                      {ticket.clusterCount} report{ticket.clusterCount > 1 ? 's' : ''} merged
                    </TableCell>
                    <TableCell className="text-xs font-mono font-bold text-amber-700">
                      {ticket.slaCountdown}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={ticket.status} size="sm" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href="/officer/queue">
                        <Button variant="primary" size="sm" leftIcon={<Camera className="w-3.5 h-3.5" />}>
                          Update
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
