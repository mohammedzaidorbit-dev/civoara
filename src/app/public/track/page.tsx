'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  ArrowLeft,
  ExternalLink,
  AlertCircle,
  Map as MapIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { StatusBadge, PriorityBadge } from '@/components/ui/status-badge';
import { getPublicIncidentByTicketAction } from '@/lib/actions/incident';

interface PublicIncidentData {
  ticketNumber: string;
  title: string;
  category: string;
  location: string;
  priority: string;
  status: string;
  slaRemaining: string;
  reportedAt: string;
  latitude?: number;
  longitude?: number;
  timeline: Array<{
    step: string;
    time: string;
    completed: boolean;
    active?: boolean;
    note: string;
  }>;
}

function TrackIncidentContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id') || '';

  const [ticketInput, setTicketInput] = useState(initialId);
  const [searchedId, setSearchedId] = useState(initialId);
  const [record, setRecord] = useState<PublicIncidentData | null>(null);
  const [loading, setLoading] = useState(Boolean(initialId));
  const [hasSearched, setHasSearched] = useState(Boolean(initialId));

  useEffect(() => {
    let isMounted = true;
    async function fetchRecord() {
      if (!searchedId.trim()) {
        setRecord(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const liveData = await getPublicIncidentByTicketAction(searchedId);
        if (isMounted) {
          setRecord(liveData);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to track incident:', err);
        if (isMounted) {
          setRecord(null);
          setLoading(false);
        }
      }
    }

    if (searchedId.trim()) {
      fetchRecord();
    }
    return () => {
      isMounted = false;
    };
  }, [searchedId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticketInput.trim()) {
      setHasSearched(true);
      setSearchedId(ticketInput.trim().toUpperCase());
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/public">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Public Explorer
          </Button>
        </Link>
        <span className="text-xs font-mono text-slate-400">Open Public Verification</span>
      </div>

      {/* Ticket Search Form */}
      <Card className="border-slate-200 bg-white shadow-xs">
        <CardContent className="p-5">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Enter Ticket ID (e.g. CIV-2026-0001)"
                value={ticketInput}
                onChange={(e) => setTicketInput(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-slate-400" />}
                required
              />
            </div>
            <Button type="submit" variant="primary">
              Track Status
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="py-12 text-center text-xs text-slate-500">
          Querying municipal audit log for ticket {searchedId}...
        </div>
      )}

      {/* Not Found State */}
      {!loading && hasSearched && !record && (
        <Card className="border-slate-200 bg-white shadow-xs p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-bold text-slate-900 text-sm">Ticket Not Found</h3>
            <p className="text-xs text-slate-500">
              No public municipal grievance matches reference <strong>{searchedId}</strong>. Please confirm the reference number on your confirmation receipt or view all active issues on the map.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Link href="/public">
              <Button variant="outline" size="sm" leftIcon={<MapIcon className="w-4 h-4" />}>
                View Public Map
              </Button>
            </Link>
            <Link href="/report">
              <Button variant="accent" size="sm">
                Submit New Incident
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Initial Empty Search Prompt */}
      {!hasSearched && !loading && (
        <Card className="border-slate-200 bg-white shadow-xs p-8 text-center space-y-2">
          <h3 className="font-bold text-slate-900 text-sm">Public Grievance Tracker</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Enter your municipal ticket reference number above to inspect verified field progress, assigned department details, and SLA countdowns.
          </p>
        </Card>
      )}

      {/* Tracking Result Card */}
      {!loading && record && (
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-mono text-xs font-bold text-sky-700 block">{record.ticketNumber}</span>
                <CardTitle className="text-lg text-slate-900 mt-1">{record.title}</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <PriorityBadge priority={record.priority} />
                <StatusBadge status={record.status} />
              </div>
            </div>
            <CardDescription className="flex items-center gap-1.5 mt-2 text-slate-500">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{record.location} &bull; {record.category.replace('_', ' ')}</span>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* SLA Status Box */}
            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-700" />
                <span className="font-semibold text-amber-900">SLA Resolution Countdown:</span>
              </div>
              <span className="font-mono font-bold text-amber-800">{record.slaRemaining}</span>
            </div>

            {/* Google Maps Actions */}
            {record.latitude && record.longitude && (
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${record.latitude},${record.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs"
                >
                  View on Google Maps
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
                <a
                  href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${record.latitude},${record.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs"
                >
                  Google Street View
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </div>
            )}

            {/* Operational Timeline */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Live Operational Timeline
              </h4>
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {record.timeline.map((item, idx) => (
                  <div key={idx} className="relative text-xs">
                    <div
                      className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full border-2 bg-white flex items-center justify-center ${
                        item.completed
                          ? 'border-emerald-600 text-emerald-600'
                          : 'border-slate-300 text-slate-300'
                      }`}
                    >
                      {item.completed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-600 text-white" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${item.active ? 'text-sky-700' : 'text-slate-900'}`}>
                          {item.step}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">({item.time})</span>
                      </div>
                      {item.note && <p className="text-slate-500 text-[11px]">{item.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function PublicTrackPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading incident status...</div>}>
      <TrackIncidentContent />
    </Suspense>
  );
}
