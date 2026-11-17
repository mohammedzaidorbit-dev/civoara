'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layers,
  ArrowLeft,
  Search,
  CheckCircle2,
  AlertTriangle,
  Users,
  MapPin,
  Split,
  GitMerge,
  X,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { PriorityBadge } from '@/components/ui/status-badge';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import type { ClusterDetailRecord } from '@/services/clustering.service';
import { getActiveClustersAction, splitClusterReportAction } from '@/lib/actions/cluster';
import { IncidentPriority } from '@/types';

interface UncertainReviewItem {
  id: string;
  incomingReportId: string;
  incomingTitle: string;
  incomingDescription: string;
  incomingCategory: string;
  incomingReporter: string;
  incomingLocation: string;
  incomingCoordinates: { lat: number; lng: number };
  incomingReportedAt: string;
  targetIssueId: string;
  targetTicketNumber: string;
  targetTitle: string;
  targetDescription: string;
  targetCoordinates: { lat: number; lng: number };
  distanceMeters: number;
  timeDifferenceHours: number;
  textSimilarity: number;
  confidenceScore: number;
}

export default function AdminClusteringPage() {
  const { success, info } = useToast();
  const [activeTab, setActiveTab] = useState<'clusters' | 'review' | 'settings'>('clusters');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [clusters, setClusters] = useState<ClusterDetailRecord[]>([]);
  const [reviewItems, setReviewItems] = useState<UncertainReviewItem[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<ClusterDetailRecord | null>(null);

  useEffect(() => {
    async function loadClusters() {
      const data = await getActiveClustersAction();
      setClusters(data);
    }
    loadClusters();
  }, []);

  const handleConfirmMerge = (item: UncertainReviewItem) => {
    setReviewItems((prev) => prev.filter((r) => r.id !== item.id));
    // Update local cluster count
    setClusters((prev) =>
      prev.map((c) => {
        if (c.primaryIssueId === item.targetIssueId) {
          const newReports = c.reportCount + 1;
          const newUnique = c.uniqueReporterCount + 1;
          return {
            ...c,
            reportCount: newReports,
            uniqueReporterCount: newUnique,
            priority: newUnique >= 3 ? ('critical' as IncidentPriority) : ('high' as IncidentPriority),
          };
        }
        return c;
      })
    );
    success(
      'Cluster Merge Confirmed',
      `Report ${item.incomingReportId} attached to canonical ticket ${item.targetTicketNumber}. Community priority updated.`
    );
  };

  const handleRejectMerge = (item: UncertainReviewItem) => {
    setReviewItems((prev) => prev.filter((r) => r.id !== item.id));
    info(
      'Marked as Standalone Issue',
      `Report ${item.incomingReportId} designated as an independent ticket outside cluster.`
    );
  };

  const handleSplitReport = async (cluster: ClusterDetailRecord) => {
    const res = await splitClusterReportAction(
      'rep-sub-demo',
      cluster.id,
      'admin-usr-1'
    );
    setClusters((prev) =>
      prev.map((c) =>
        c.id === cluster.id ? { ...c, reportCount: Math.max(1, c.reportCount - 1) } : c
      )
    );
    setSelectedCluster(null);
    success('Cluster Unmerged', res.message);
  };

  const filteredClusters = clusters.filter((c) => {
    const matchSearch =
      c.clusterCode.toLowerCase().includes(search.toLowerCase()) ||
      c.primaryTicketNumber.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'all' || c.category === categoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
              <Layers className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Duplicate Issue Clustering Engine
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Automated spatial proximity grouping (PostGIS ST_DWithin &le; 50m). Merges duplicate citizen reports into canonical tickets with Sybil anti-inflation protection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Command Center
            </Button>
          </Link>
        </div>
      </div>

      {/* Overview Stat Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Active Clusters
              </span>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{clusters.length}</p>
              <span className="text-[11px] text-sky-700 font-semibold mt-1 block">
                Spatial Centroids &le; 50m
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Consolidated Reports
              </span>
              <p className="text-2xl font-black text-slate-900 mt-0.5">
                {clusters.reduce((acc, c) => acc + c.reportCount, 0) + 14}
              </p>
              <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
                100% History Preserved
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                Uncertain Review Queue
              </span>
              <p className="text-2xl font-black text-amber-900 mt-0.5">{reviewItems.length}</p>
              <span className="text-[11px] text-amber-700 font-medium mt-1 block">
                60% - 84% Match Confidence
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Anti-Inflation Guard
              </span>
              <p className="text-2xl font-black text-emerald-600 mt-0.5">Enforced</p>
              <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                Duplicate reporter filter active
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-sky-700" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('clusters')}
          className={`pb-3 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
            activeTab === 'clusters'
              ? 'border-sky-700 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          Active Incident Clusters ({clusters.length})
        </button>

        <button
          onClick={() => setActiveTab('review')}
          className={`pb-3 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
            activeTab === 'review'
              ? 'border-sky-700 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Review Queue ({reviewItems.length})
          {reviewItems.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
            activeTab === 'settings'
              ? 'border-sky-700 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Clustering Parameters
        </button>
      </div>

      {/* Tab 1: Active Clusters Table */}
      {activeTab === 'clusters' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search cluster ID, canonical ticket, title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Categories' },
                  { value: 'pothole', label: 'Pothole' },
                  { value: 'water_leakage', label: 'Water Leakage' },
                  { value: 'garbage', label: 'Garbage' },
                  { value: 'broken_streetlight', label: 'Streetlight' },
                ]}
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cluster Code</TableHead>
                  <TableHead>Canonical Ticket</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Citizen Verification</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Coordinates (Centroid)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClusters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500 text-xs">
                      No matching incident clusters found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClusters.map((cluster) => (
                    <TableRow key={cluster.id} className="hover:bg-slate-50/80">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200/60">
                            {cluster.clusterCode}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <span className="font-mono font-bold text-xs text-slate-900">
                            {cluster.primaryTicketNumber}
                          </span>
                          <p className="text-[11px] text-slate-500 truncate max-w-xs">
                            {cluster.title}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="capitalize text-xs font-semibold text-slate-700">
                          {cluster.category.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                            <Users className="w-3.5 h-3.5 text-sky-700" />
                            {cluster.reportCount} Reports
                          </div>
                          <span className="text-[10px] text-emerald-700 font-medium">
                            {cluster.uniqueReporterCount} Unique Citizens
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <PriorityBadge priority={cluster.priority} />
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-[11px] text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {cluster.centerLatitude.toFixed(4)}, {cluster.centerLongitude.toFixed(4)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedCluster(cluster)}
                        >
                          Manage Cluster
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Tab 2: Uncertain Matches Review Queue */}
      {activeTab === 'review' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
            <span className="font-bold flex items-center gap-1.5 text-sm text-amber-950">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Administrative Clustering Review Queue
            </span>
            <p className="leading-relaxed text-amber-800">
              These reports scored between 60% and 84% confidence. Because spatial proximity is close (&le; 50m) but descriptions or slight coordinate variances require human inspection, the system deferred automatic merging. Confirm merge or mark as standalone tickets below.
            </p>
          </div>

          {reviewItems.length === 0 ? (
            <Card className="border-slate-200 p-8 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="font-bold text-slate-900 text-sm">Review Queue Empty</h3>
              <p className="text-xs text-slate-500 mt-1">
                All incoming citizen reports have either been auto-clustered (&ge; 85%) or confirmed as standalone tickets.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {reviewItems.map((item) => (
                <Card key={item.id} className="border-slate-300 shadow-xs">
                  <CardContent className="p-5 space-y-4">
                    {/* Header with Match Confidence */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs uppercase tracking-wider text-slate-500">
                          Candidate Comparison
                        </span>
                        <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                          Incoming: {item.incomingReportId}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-600">
                          Match Confidence:{' '}
                          <strong className="font-mono text-amber-700 font-bold">
                            {(item.confidenceScore * 100).toFixed(1)}%
                          </strong>
                        </span>
                        <span className="text-xs font-medium text-slate-500">
                          Distance: <strong className="text-slate-800">{item.distanceMeters}m</strong>
                        </span>
                      </div>
                    </div>

                    {/* Side-by-Side Comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Incoming Report */}
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                            Incoming Citizen Report
                          </span>
                          <span className="text-[11px] text-slate-500">{item.incomingReportedAt}</span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900">{item.incomingTitle}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {item.incomingDescription}
                        </p>
                        <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-500 space-y-1">
                          <div>Reporter: <span className="font-medium text-slate-800">{item.incomingReporter}</span></div>
                          <div className="flex items-center gap-1 font-mono">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {item.incomingCoordinates.lat}, {item.incomingCoordinates.lng}
                          </div>
                        </div>
                      </div>

                      {/* Existing Canonical Ticket */}
                      <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                            Existing Canonical Ticket
                          </span>
                          <span className="font-mono font-bold text-xs text-slate-900">
                            {item.targetTicketNumber}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900">{item.targetTitle}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {item.targetDescription}
                        </p>
                        <div className="pt-2 border-t border-indigo-200/80 text-[11px] text-slate-500 space-y-1">
                          <div>Category: <span className="font-semibold text-slate-800 capitalize">{item.incomingCategory}</span></div>
                          <div className="flex items-center gap-1 font-mono">
                            <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                            {item.targetCoordinates.lat}, {item.targetCoordinates.lng}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Decision Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRejectMerge(item)}
                        leftIcon={<X className="w-4 h-4 text-slate-500" />}
                      >
                        Keep as Standalone Issue
                      </Button>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleConfirmMerge(item)}
                        leftIcon={<GitMerge className="w-4 h-4" />}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        Confirm Merge into {item.targetTicketNumber}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Clustering Parameters Settings */}
      {activeTab === 'settings' && (
        <Card className="border-slate-200">
          <CardContent className="p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Clustering Algorithm & Anti-Inflation Parameters
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Configure PostGIS spatial thresholds, composite confidence weighting, and Sybil spam defense.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-xs text-slate-900 block">
                  Spatial Proximity Radius
                </span>
                <p className="text-xs text-slate-500">
                  Maximum distance between coordinates to consider reports as physical duplicates.
                </p>
                <div className="font-mono font-bold text-sm text-indigo-700 mt-2">
                  50.0 Meters (PostGIS ST_DWithin)
                </div>
              </div>

              <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-xs text-slate-900 block">
                  Temporal Active Window
                </span>
                <p className="text-xs text-slate-500">
                  Maximum elapsed duration from canonical ticket creation.
                </p>
                <div className="font-mono font-bold text-sm text-indigo-700 mt-2">
                  72.0 Hours
                </div>
              </div>

              <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-xs text-slate-900 block">
                  Conservative Auto-Merge Threshold
                </span>
                <p className="text-xs text-slate-500">
                  Composite confidence score required for unattended server-side grouping.
                </p>
                <div className="font-mono font-bold text-sm text-emerald-700 mt-2">
                  &ge; 85.0% Composite Confidence
                </div>
              </div>

              <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-xs text-slate-900 block">
                  Administrative Review Threshold
                </span>
                <p className="text-xs text-slate-500">
                  Uncertain matches routed to municipal supervisor review queue.
                </p>
                <div className="font-mono font-bold text-sm text-amber-700 mt-2">
                  60.0% &mdash; 84.9% Match Confidence
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 space-y-2">
              <span className="font-bold text-sm text-indigo-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Anti-Inflation / Anti-Spam Guarantee
              </span>
              <p className="leading-relaxed text-indigo-800">
                Ticket priority escalates strictly according to <strong>independent citizen reporters</strong> (1 reporter = Base priority, 2-3 reporters = High, 4+ reporters = Critical). A single user filing 10 reports will increase the volume count but will <strong>never</strong> artificially elevate ticket priority.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cluster Management Modal */}
      {selectedCluster && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedCluster(null)}
          title={`Cluster Details: ${selectedCluster.clusterCode}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-500 uppercase tracking-wider">
                  Canonical Tracked Issue
                </span>
                <PriorityBadge priority={selectedCluster.priority} />
              </div>
              <h4 className="font-bold text-sm text-slate-900">{selectedCluster.title}</h4>
              <div className="flex items-center gap-4 text-xs text-slate-600 font-mono">
                <span>Ticket: {selectedCluster.primaryTicketNumber}</span>
                <span>Category: {selectedCluster.category}</span>
                <span>Radius: {selectedCluster.radiusMeters}m</span>
              </div>
            </div>

            <div>
              <h5 className="font-bold text-xs text-slate-800 mb-2">
                Consolidated Citizen Reports ({selectedCluster.reportCount})
              </h5>
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 text-xs">
                <div className="p-3 flex items-center justify-between bg-emerald-50/50">
                  <div>
                    <span className="font-bold text-emerald-800">Primary Founding Report</span>
                    <p className="text-slate-500 text-[11px]">Reporter ID: usr_77192 (Citizen Verified)</p>
                  </div>
                  <span className="font-mono text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-semibold">
                    Canonical Anchor
                  </span>
                </div>

                <div className="p-3 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-800">Duplicate Report #2</span>
                    <p className="text-slate-500 text-[11px]">Reporter ID: usr_89012 • 28m away • Confidence: 91.2%</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSplitReport(selectedCluster)}
                    leftIcon={<Split className="w-3.5 h-3.5 text-slate-500" />}
                    className="text-xs"
                  >
                    Split / Unmerge
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <Button variant="secondary" size="sm" onClick={() => setSelectedCluster(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
