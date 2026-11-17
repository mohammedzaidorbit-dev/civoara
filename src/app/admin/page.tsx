import React from 'react';
import Link from 'next/link';
import {
  Clock,
  Layers,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

export default function AdminDashboardPage() {
  const departmentStats = [
    { name: 'Roads & Highways', active: 28, breached: 1, compliance: '96.4%', head: 'Dir. A. Thorne' },
    { name: 'Water & Sewerage', active: 14, breached: 2, compliance: '85.7%', head: 'Eng. R. Patel' },
    { name: 'Waste Management', active: 31, breached: 0, compliance: '100%', head: 'Supv. M. Gomez' },
    { name: 'Electrical & Lighting', active: 9, breached: 0, compliance: '100%', head: 'Eng. T. Lewis' },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              City Administration Command Center
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded-full border border-indigo-300">
              Municipal Oversight
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Director J. Vance. Real-time citywide civic health, department response efficiency, and SLA escalations.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link href="/admin/clusters">
            <Button variant="outline" size="sm" leftIcon={<Layers className="w-4 h-4 text-indigo-600" />}>
              Duplicate Clusters
            </Button>
          </Link>
          <Link href="/admin/sla">
            <Button variant="outline" size="sm" leftIcon={<Clock className="w-4 h-4 text-indigo-600" />}>
              SLA Policies
            </Button>
          </Link>
          <Link href="/admin/incidents">
            <Button variant="primary" size="sm" leftIcon={<FileText className="w-4 h-4" />}>
              Triage Queue
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total City Incidents
              </p>
              <p className="text-2xl font-black text-slate-900 mt-1">82</p>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Across 14 municipal wards
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Layers className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Active Proximity Clusters
              </p>
              <p className="text-2xl font-black text-indigo-600 mt-1">11</p>
              <p className="text-[11px] text-indigo-600 font-medium mt-0.5">
                43 duplicate reports saved
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Citywide SLA Adherence
              </p>
              <p className="text-2xl font-black text-emerald-600 mt-1">96.3%</p>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
                Target: &gt; 95.0%
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Critical Escalations
              </p>
              <p className="text-2xl font-black text-rose-600 mt-1">3</p>
              <p className="text-[11px] text-rose-600 font-medium mt-0.5">
                Requires supervisor signoff
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Department Performance &amp; SLA Compliance</h2>
            <p className="text-xs text-slate-500">Live operational load distribution across municipal divisions.</p>
          </div>
          <Link href="/admin/departments" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1">
            Department Config &rarr;
          </Link>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Department Name</TableHead>
              <TableHead>Director / Lead</TableHead>
              <TableHead>Active Tickets</TableHead>
              <TableHead>SLA Breaches</TableHead>
              <TableHead>Compliance Rate</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departmentStats.map((dept) => (
              <TableRow key={dept.name}>
                <TableCell className="font-semibold text-slate-900 text-xs">
                  {dept.name}
                </TableCell>
                <TableCell className="text-xs text-slate-600">{dept.head}</TableCell>
                <TableCell className="text-xs font-bold text-slate-900">{dept.active}</TableCell>
                <TableCell>
                  {dept.breached > 0 ? (
                    <span className="text-xs font-bold text-rose-600 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200">
                      {dept.breached} breached
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">0</span>
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs font-bold text-emerald-600">
                  {dept.compliance}
                </TableCell>
                <TableCell className="text-right">
                  <Link href="/admin/incidents">
                    <Button variant="ghost" size="sm" className="text-xs">
                      Inspect
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
