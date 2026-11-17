import React from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { UnderDevelopment } from '@/components/ui/under-development';

export default function AdminAuditPage() {
  const auditLogs = [
    { id: 'AUD-99120', action: 'STATUS_TRANSITION', resource: 'CIV-2026-8812', actor: 'Officer Sarah Chen (PW-4091)', ip: '10.94.142.12', time: 'Nov 17, 2026, 09:32:10 AM', details: 'Status updated from ASSIGNED -> IN_PROGRESS' },
    { id: 'AUD-99119', action: 'CLUSTER_ATTACHED', resource: 'CIV-2026-8814', actor: 'SYSTEM_CLUSTER_WORKER', ip: 'internal.srv', time: 'Nov 17, 2026, 09:31:04 AM', details: 'Proximity match (<24m) merged report into parent CIV-2026-8812' },
    { id: 'AUD-99118', action: 'INCIDENT_INTAKE', resource: 'CIV-2026-8812', actor: 'Citizen Alex Morgan', ip: '198.51.100.4', time: 'Nov 17, 2026, 09:30:00 AM', details: 'Grievance submitted via Mobile Web with GPS coordinates' },
    { id: 'AUD-99117', action: 'SLA_POLICY_UPDATE', resource: 'POLICY_CRITICAL_SLA', actor: 'Director J. Vance (ADMIN)', ip: '10.94.100.1', time: 'Nov 16, 2026, 05:00:22 PM', details: 'Critical threshold locked to 4 Hours standard' },
  ];

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          Immutable System Audit Trail
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Cryptographically timestamped record of all ticket actions, supervisor overrides, and system automated routing decisions.
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Audit ID</TableHead>
            <TableHead>Event Action</TableHead>
            <TableHead>Resource ID</TableHead>
            <TableHead>Actor / Initiator</TableHead>
            <TableHead>Timestamp</TableHead>
            <TableHead>Event Summary</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {auditLogs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="font-mono text-xs font-bold text-slate-900">{log.id}</TableCell>
              <TableCell className="font-mono text-xs font-semibold text-indigo-700">{log.action}</TableCell>
              <TableCell className="font-mono text-xs text-slate-600">{log.resource}</TableCell>
              <TableCell className="text-xs text-slate-800">{log.actor}</TableCell>
              <TableCell className="text-xs text-slate-500 font-mono">{log.time}</TableCell>
              <TableCell className="text-xs text-slate-600">{log.details}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <UnderDevelopment
        moduleName="Cryptographic Audit Hash Verification"
        phase="Phase 05 (Security & Transparency)"
        description="Tamper-evident SHA-256 hash chaining of every database mutation to guarantee government records cannot be altered or purged after the fact."
        featuresPlanned={[
          'PostgreSQL Write-Ahead Log hash chaining triggers',
          'Exportable audit certificate for municipal public records requests',
          'Automated suspicious modification detection alerts',
          'Role-based granular audit filtering and forensic search',
        ]}
        backHref="/admin"
        backLabel="Return to Command Center"
      />
    </div>
  );
}
