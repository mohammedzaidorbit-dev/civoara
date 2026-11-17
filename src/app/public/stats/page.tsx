import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

export default function PublicStatsPage() {
  const departments = [
    { name: 'Roads & Highways', avgHours: '6.2h', compliance: '96.4%', totalResolved: '412', rating: '4.8 / 5' },
    { name: 'Electrical & Lighting', avgHours: '4.1h', compliance: '100%', totalResolved: '289', rating: '4.9 / 5' },
    { name: 'Waste Management', avgHours: '3.5h', compliance: '98.8%', totalResolved: '840', rating: '4.7 / 5' },
    { name: 'Water & Sewerage', avgHours: '8.4h', compliance: '85.7%', totalResolved: '194', rating: '4.2 / 5' },
    { name: 'Traffic & Transit', avgHours: '5.0h', compliance: '95.2%', totalResolved: '158', rating: '4.6 / 5' },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              City SLA Transparency Index
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full border border-emerald-300">
              Public Charter
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time municipal performance benchmarks published under the Municipal Open Governance Charter.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/public/performance">
            <Button variant="primary" size="sm">
              Open Full Performance Dashboard
            </Button>
          </Link>
          <Link href="/public">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Public Explorer
            </Button>
          </Link>
        </div>
      </div>

      {/* Aggregate Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Compliance</span>
            <div className="text-3xl font-bold text-emerald-600 font-mono">96.3%</div>
            <p className="text-[11px] text-slate-500">Tickets resolved within published SLA</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Turnaround</span>
            <div className="text-3xl font-bold text-sky-700 font-mono">5.8 Hours</div>
            <p className="text-[11px] text-slate-500">From citizen intake to field repair</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Citizen Confirmation</span>
            <div className="text-3xl font-bold text-slate-900 font-mono">97.8%</div>
            <p className="text-[11px] text-slate-500">Verified without citizen contest</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Audited Issues</span>
            <div className="text-3xl font-bold text-slate-900 font-mono">1,842</div>
            <p className="text-[11px] text-slate-500">Total citywide closed records</p>
          </CardContent>
        </Card>
      </div>

      {/* Department Scorecard */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">Municipal Department Scorecard</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Department</TableHead>
              <TableHead>Avg Turnaround</TableHead>
              <TableHead>SLA Compliance Rate</TableHead>
              <TableHead>30-Day Resolved Total</TableHead>
              <TableHead className="text-right">Citizen Satisfaction</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.map((dept) => (
              <TableRow key={dept.name}>
                <TableCell className="font-semibold text-slate-900 text-xs">{dept.name}</TableCell>
                <TableCell className="font-mono text-xs text-slate-700">{dept.avgHours}</TableCell>
                <TableCell>
                  <span className="font-mono text-xs font-bold text-emerald-600">{dept.compliance}</span>
                </TableCell>
                <TableCell className="text-xs text-slate-600 font-mono">{dept.totalResolved}</TableCell>
                <TableCell className="text-right font-mono text-xs font-bold text-slate-900">
                  {dept.rating}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
