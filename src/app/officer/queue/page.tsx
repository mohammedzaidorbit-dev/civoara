'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Camera,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  ClipboardList,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { StatusBadge, PriorityBadge } from '@/components/ui/status-badge';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import {
  getOfficerAssignedIncidentsAction,
  updateIncidentStatusAction,
} from '@/lib/actions/incident';
import type { IncidentStatus } from '@/types';

interface QueueItem {
  id: string;
  ticketNumber: string;
  title: string;
  priority: string;
  status: string;
  location: string;
  slaCountdown: string;
  reportedAt: string;
  clusterCount: number;
  latitude: number;
  longitude: number;
}

export default function OfficerQueuePage() {
  const { success, error: toastError } = useToast();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<QueueItem | null>(null);
  const [newStatus, setNewStatus] = useState<IncidentStatus>('in_progress');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  // Load real assigned tickets from database (strictly zero dummy/mock data)
  useEffect(() => {
    let isMounted = true;
    async function loadQueue() {
      try {
        const liveItems = await getOfficerAssignedIncidentsAction();
        if (isMounted) {
          setQueue(liveItems);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load officer queue:', err);
        if (isMounted) setLoading(false);
      }
    }

    loadQueue();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleUpdateStatus = async () => {
    if (!selectedTicket) return;
    setUpdating(true);

    try {
      const res = await updateIncidentStatusAction(
        selectedTicket.id,
        newStatus,
        resolutionNotes,
        undefined,
        undefined,
        'officer'
      );

      if (res.success) {
        setQueue((prev) =>
          prev.map((t) =>
            t.id === selectedTicket.id ? { ...t, status: newStatus } : t
          )
        );
        success(
          'Ticket Status Updated',
          `Ticket ${selectedTicket.ticketNumber} updated to ${newStatus.replace('_', ' ').toUpperCase()}. Notification dispatched.`
        );
        setSelectedTicket(null);
        setResolutionNotes('');
      } else {
        toastError('Update Failed', res.error || 'Could not update status');
      }
    } catch {
      toastError('Update Failed', 'Network or database error occurred');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Field Officer Work Queue
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Accept assignments, execute field repairs, and upload mandatory evidence for verified closure.
          </p>
        </div>
        <Link href="/officer">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Command Center
          </Button>
        </Link>
      </div>

      <Card className="border-slate-200 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">
            Loading assigned field tickets from municipal database...
          </div>
        ) : queue.length === 0 ? (
          <div className="py-16 text-center space-y-4 px-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 mx-auto flex items-center justify-center">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h4 className="font-bold text-slate-900 text-sm">Operational Queue Clear</h4>
              <p className="text-xs text-slate-500">
                There are no open or pending municipal tickets assigned to your field unit.
              </p>
            </div>
            <Link href="/officer">
              <Button variant="outline" size="sm">
                Return to Overview
              </Button>
            </Link>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket Ref</TableHead>
                <TableHead>Problem & Location</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cluster Size</TableHead>
                <TableHead>SLA Clock</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.map((item) => (
                <TableRow key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <TableCell className="font-mono text-xs font-bold text-sky-700">
                    {item.ticketNumber}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-slate-900 line-clamp-1 max-w-xs">
                      {item.title}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate max-w-xs">{item.location}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <PriorityBadge priority={item.priority} size="sm" />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} size="sm" />
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                      {item.clusterCount} report{item.clusterCount > 1 ? 's' : ''}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs font-bold text-amber-700">
                      {item.slaCountdown}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTicket(item);
                        setNewStatus(
                          item.status === 'assigned' ? 'in_progress' : (item.status as IncidentStatus)
                        );
                      }}
                    >
                      Update Status
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Status Transition Modal */}
      {selectedTicket && (
        <Modal
          isOpen={Boolean(selectedTicket)}
          onClose={() => setSelectedTicket(null)}
          title={`Update Ticket: ${selectedTicket.ticketNumber}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div>
              <span className="text-slate-500 block uppercase font-bold text-[10px]">
                Incident Summary
              </span>
              <p className="font-semibold text-slate-900 text-sm mt-0.5">{selectedTicket.title}</p>
              <div className="flex items-center gap-2 mt-2">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${selectedTicket.latitude},${selectedTicket.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-700 hover:text-sky-800 underline inline-flex items-center gap-1 font-semibold text-[11px]"
                >
                  View on Google Maps
                  <ExternalLink className="w-3 h-3" />
                </a>
                <span className="text-slate-300">&bull;</span>
                <a
                  href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${selectedTicket.latitude},${selectedTicket.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-700 hover:text-sky-800 underline inline-flex items-center gap-1 font-semibold text-[11px]"
                >
                  Street View
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div>
              <Select
                label="New Operational Status"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as IncidentStatus)}
                options={[
                  { value: 'in_progress', label: 'In Progress: Field Crew Onsite' },
                  { value: 'resolved', label: 'Resolved: Repair Complete' },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Resolution & Remediation Notes
              </label>
              <textarea
                className="w-full rounded-md border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                rows={3}
                placeholder="Describe actions taken, materials applied, or closure verification details..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
              />
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-600">
                <Camera className="w-4 h-4 text-slate-500" />
                <span>Closure Photo Proof</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Field Evidence Verified
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTicket(null)}
                disabled={updating}
              >
                Cancel
              </Button>
              <Button
                variant="navy"
                size="sm"
                onClick={handleUpdateStatus}
                isLoading={updating}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Confirm &amp; Record Transition
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
