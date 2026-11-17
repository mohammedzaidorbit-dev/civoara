'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  PlusCircle,
  MapPin,
  Eye,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { StatusBadge, PriorityBadge } from '@/components/ui/status-badge';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { getCitizenIncidentsAction } from '@/lib/actions/incident';

interface CitizenIncident {
  id: string;
  ticketNumber: string;
  title: string;
  category: string;
  location: string;
  status: string;
  priority: string;
  department: string;
  officer: string;
  reportedAt: string;
  slaDeadline: string;
  description: string;
  latitude: number;
  longitude: number;
}

export default function MyReportsPage() {
  const { success } = useToast();
  const [incidents, setIncidents] = useState<CitizenIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<CitizenIncident | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Load real incidents from Supabase
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const liveData = await getCitizenIncidentsAction();
        if (isMounted) {
          setIncidents(liveData);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load citizen reports:', err);
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = incidents.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            My Civic Grievances
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete history and live dispatch status of all incidents submitted from your account.
          </p>
        </div>
        <Link href="/report">
          <Button variant="accent" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
            Report New Incident
          </Button>
        </Link>
      </div>

      {/* Filters Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Input
                placeholder="Search by Ticket ID, street address, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <div>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'submitted', label: 'Submitted' },
                  { value: 'assigned', label: 'Assigned' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'resolved', label: 'Resolved' },
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Incidents Table or Clean Empty State */}
      <Card className="border-slate-200 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">
            Querying municipal database for citizen grievance records...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center space-y-4 px-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 mx-auto flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h4 className="font-bold text-slate-900 text-sm">No Grievances Recorded</h4>
              <p className="text-xs text-slate-500">
                You have not filed any municipal service complaints matching these filters.
              </p>
            </div>
            <Link href="/report">
              <Button variant="accent" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
                Submit Incident Report
              </Button>
            </Link>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket ID</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Inspection</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <TableCell className="font-mono text-xs font-bold text-sky-700">
                    {item.ticketNumber}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate font-medium text-slate-900">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Reported: {item.reportedAt}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 font-medium capitalize">
                    {item.category.replace('_', ' ')}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {item.location}
                    </span>
                  </TableCell>
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
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                      onClick={() => setSelectedIncident(item)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Detailed Modal Inspection */}
      {selectedIncident && (
        <Modal
          isOpen={Boolean(selectedIncident)}
          onClose={() => setSelectedIncident(null)}
          title={`Ticket Audit: ${selectedIncident.ticketNumber}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-mono font-bold text-sky-700 text-sm">
                {selectedIncident.ticketNumber}
              </span>
              <div className="flex items-center gap-2">
                <PriorityBadge priority={selectedIncident.priority} size="sm" />
                <StatusBadge status={selectedIncident.status} size="sm" />
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-700 block uppercase tracking-wider text-[11px]">
                Incident Title
              </span>
              <p className="text-slate-900 font-medium mt-0.5 text-sm">{selectedIncident.title}</p>
            </div>

            <div>
              <span className="font-bold text-slate-700 block uppercase tracking-wider text-[11px]">
                Field Description
              </span>
              <p className="text-slate-600 mt-0.5 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                {selectedIncident.description || 'No additional narrative provided.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-400 block font-semibold uppercase">
                  Assigned Department
                </span>
                <span className="font-bold text-slate-900 mt-0.5 block">
                  {selectedIncident.department}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-400 block font-semibold uppercase">
                  Service Level Deadline
                </span>
                <span className="font-bold text-amber-700 mt-0.5 block">
                  {selectedIncident.slaDeadline}
                </span>
              </div>
            </div>

            {/* Google Maps Actions */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${selectedIncident.latitude},${selectedIncident.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs"
              >
                View on Google Maps
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
              <a
                href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${selectedIncident.latitude},${selectedIncident.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs"
              >
                Google Street View
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <Link href={`/public/track?id=${encodeURIComponent(selectedIncident.ticketNumber)}`}>
                <Button variant="outline" size="sm" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                  Open Public Tracking Page
                </Button>
              </Link>
              <Button
                variant="navy"
                size="sm"
                onClick={() => {
                  setSelectedIncident(null);
                  success('Incident closed in viewer');
                }}
              >
                Close Audit View
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
