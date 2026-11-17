import React from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { UnderDevelopment } from '@/components/ui/under-development';

export default function AdminOfficersPage() {
  const officers = [
    { badge: 'PW-4091', name: 'Sarah Chen', dept: 'Roads & Highways', role: 'Field Officer', phone: '+1 (555) 019-2831', status: 'On Shift' },
    { badge: 'WS-2044', name: 'Marcus Reynolds', dept: 'Water & Sewerage', role: 'Field Specialist', phone: '+1 (555) 018-4492', status: 'On Shift' },
    { badge: 'EL-1102', name: 'David Kim', dept: 'Electrical & Lighting', role: 'Senior Technician', phone: '+1 (555) 017-8823', status: 'On Call' },
    { badge: 'WM-3088', name: 'Elena Rostova', dept: 'Waste Management', role: 'Field Supervisor', phone: '+1 (555) 014-9912', status: 'On Shift' },
  ];

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          Municipal Officer Roster
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Active field personnel credentials, department associations, and dispatch availability.
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Badge #</TableHead>
            <TableHead>Officer Name</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Contact Phone</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {officers.map((officer) => (
            <TableRow key={officer.badge}>
              <TableCell className="font-mono text-xs font-bold text-slate-900">{officer.badge}</TableCell>
              <TableCell className="font-medium text-slate-900 text-xs">{officer.name}</TableCell>
              <TableCell className="text-xs text-slate-600">{officer.dept}</TableCell>
              <TableCell className="text-xs text-slate-600">{officer.role}</TableCell>
              <TableCell className="text-xs text-slate-500 font-mono">{officer.phone}</TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {officer.status}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <UnderDevelopment
        moduleName="Officer RBAC & Shift Management"
        phase="Phase 02 (Authentication & RBAC)"
        description="Supabase Auth synchronization, GPS-tracked active shifts, biometric login provisioning, and automated work-order dispatch."
        featuresPlanned={[
          'Supabase Auth Role Assignment (`citizen`, `officer`, `admin`)',
          'GPS-verified check-in and shift scheduling',
          'Skill-based dispatching algorithm (e.g. electrical certified only)',
          'Field equipment and truck inventory assignment',
        ]}
        backHref="/admin"
        backLabel="Return to Command Center"
      />
    </div>
  );
}
