'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ArrowLeft, ClipboardCheck, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { StatusBadge, PriorityBadge } from '@/components/ui/status-badge';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { getAdminTriageIncidentsAction, assignIncidentAction } from '@/lib/actions/incident';

interface IncidentItem {
  id: string;
  ticketNumber: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  ward: string;
  reportedAt: string;
  slaRemaining: string;
  clusterCount: number;
}

export default function AdminIncidentsPage() {
  const { success, error: toastError } = useToast();
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<IncidentItem | null>(null);
  const [targetDept, setTargetDept] = useState('20000000-0000-0000-0000-000000000001');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  // Load real incidents from Supabase
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const liveData = await getAdminTriageIncidentsAction();
        if (isMounted) {
          setIncidents(liveData);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load triage incidents:', err);
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleReassign = async () => {
    if (!selected) return;
    setSaving(true);

    try {
      const res = await assignIncidentAction(selected.id, targetDept);
      if (res.success) {
        success('Department Reassigned', `Ticket ${selected.ticketNumber} re-routed.`);
        setIncidents((prev) =>
          prev.map((i) => (i.id === selected.id ? { ...i, status: 'assigned' } : i))
        );
        setSelected(null);
      } else {
        toastError('Reassignment Failed', res.error || 'Could not reassign');
      }
    } catch {
      toastError('Reassignment Failed', 'Database error occurred');
    } finally {
      setSaving(false);
    }
  };

  const filtered = incidents.filter(
    (i) =>
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
      i.ward.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            City-Wide Incident Triage
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Supervisory queue to reassign departments, adjust priorities, and override automated routing.
          </p>
        </div>
        <Link href="/admin">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Command Center
          </Button>
        </Link>
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            placeholder="Filter incidents by ticket ID, ward, or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>
      </div>

      <Card className="border-slate-200 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">
            Querying municipal database for triage queue tickets...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center space-y-4 px-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 mx-auto flex items-center justify-center">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h4 className="font-bold text-slate-900 text-sm">Triage Queue Clear</h4>
              <p className="text-xs text-slate-500">
                All incoming citizen complaints have been routed and assigned to active municipal divisions.
              </p>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket ID</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Ward Jurisdiction</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <TableCell className="font-mono text-xs font-bold text-sky-700">
                    {item.ticketNumber}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-slate-900 max-w-xs truncate">
                    {item.title}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-slate-700 capitalize">
                    {item.category.replace('_', ' ')}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">{item.ward}</TableCell>
                  <TableCell>
                    <PriorityBadge priority={item.priority} size="sm" />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} size="sm" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelected(item);
                      }}
                    >
                      Triage
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Triage / Override Modal */}
      {selected && (
        <Modal
          isOpen={Boolean(selected)}
          onClose={() => setSelected(null)}
          title={`Administrative Triage: ${selected.ticketNumber}`}
          description="Override department assignment or change incident status."
          footer={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelected(null)} disabled={saving}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleReassign} isLoading={saving}>
                Apply Triage Override
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <p className="font-semibold text-slate-900">{selected.title}</p>
              <p className="text-slate-500 mt-1">{selected.ward}</p>
            </div>

            <Select
              label="Reassign Municipal Department"
              value={targetDept}
              onChange={(e) => setTargetDept(e.target.value)}
              options={[
                { value: '20000000-0000-0000-0000-000000000001', label: 'Roads & Highways Maintenance' },
                { value: '20000000-0000-0000-0000-000000000002', label: 'Water & Sewerage Board' },
                { value: '20000000-0000-0000-0000-000000000003', label: 'Waste Management & Sanitation' },
                { value: '20000000-0000-0000-0000-000000000004', label: 'Electrical & Street Lighting' },
                { value: '20000000-0000-0000-0000-000000000005', label: 'Traffic Engineering Division' },
              ]}
            />

            <div className="pt-2">
              <Link href={`/public/track?id=${encodeURIComponent(selected.ticketNumber)}`}>
                <span className="text-sky-700 hover:text-sky-800 text-xs font-semibold inline-flex items-center gap-1">
                  View Public Ledger Record <ExternalLink className="w-3.5 h-3.5" />
                </span>
              </Link>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
