'use client';

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Award,
  Building2,
  MapPin,
  Search,
  Filter,
  RefreshCw,
  Info,
  Layers,
  ArrowUpRight,
  PlusCircle,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { StatusBadge, PriorityBadge } from '@/components/ui/status-badge';
import { PublicMapWrapper } from '@/components/maps';
import {
  getPublicPerformanceDataAction,
  getPublicIncidentDetailsAction,
} from '@/lib/actions/analytics';
import type {
  AnalyticsPeriod,
  PublicPerformanceSummary,
  DepartmentPerformanceRank,
  WardPerformanceRecord,
  CategoryStatistic,
  ResolutionTrendPoint,
  PublicSanitizedIncident,
} from '@/types';
import {
  INITIAL_PUBLIC_SUMMARY,
  INITIAL_DEPARTMENTS,
  INITIAL_WARDS,
  INITIAL_CATEGORIES,
  INITIAL_TRENDS,
} from '@/lib/data/initial-performance';
import { CONFIGURED_MUNICIPAL_WARDS } from '@/services/ward.service';

export default function PublicPerformanceDashboardPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');
  const [selectedWard, setSelectedWard] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'wards' | 'categories' | 'trends' | 'map' | 'timeline'>('leaderboard');
  
  // Data state with instant SSR baseline
  const [isPending, startTransition] = useTransition();
  const [summary, setSummary] = useState<PublicPerformanceSummary>(INITIAL_PUBLIC_SUMMARY);
  const [departments, setDepartments] = useState<DepartmentPerformanceRank[]>(INITIAL_DEPARTMENTS);
  const [wards, setWards] = useState<WardPerformanceRecord[]>(INITIAL_WARDS);
  const [categories, setCategories] = useState<CategoryStatistic[]>(INITIAL_CATEGORIES);
  const [trends, setTrends] = useState<ResolutionTrendPoint[]>(INITIAL_TRENDS);
  
  // Methodology modal / disclosure
  const [showMethodology, setShowMethodology] = useState(false);

  // Timeline lookup state
  const [searchTicketId, setSearchTicketId] = useState('CIV-2026-8812');
  const [activeTicket, setActiveTicket] = useState<PublicSanitizedIncident | null>(null);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);

  // Fetch performance dataset
  const loadData = () => {
    startTransition(async () => {
      try {
        const dataset = await getPublicPerformanceDataAction(period, selectedWard, selectedCategory);
        setSummary(dataset.summary);
        setDepartments(dataset.departments);
        setWards(dataset.wards);
        setCategories(dataset.categories);
        setTrends(dataset.trends);
      } catch (err) {
        console.error('Failed to load public performance data:', err);
      }
    });
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, selectedWard, selectedCategory]);

  const handleLookupTicket = useCallback(async (ticketNumber: string) => {
    if (!ticketNumber.trim()) return;
    setTimelineLoading(true);
    setTimelineError(null);
    try {
      const data = await getPublicIncidentDetailsAction(ticketNumber.trim());
      if (data) {
        setActiveTicket(data);
      } else {
        setTimelineError(`No public record found for ticket '${ticketNumber.trim()}'.`);
      }
    } catch {
      setTimelineError('Failed to fetch public audit timeline. Please retry.');
    } finally {
      setTimelineLoading(false);
    }
  }, []);

  // Load initial timeline ticket asynchronously
  useEffect(() => {
    let active = true;
    getPublicIncidentDetailsAction('CIV-2026-8812')
      .then((data) => {
        if (active && data) {
          setActiveTicket(data);
        }
      })
      .catch((err) => {
        console.warn('Initial timeline load notice:', err);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* ========================================================================= */}
      {/* 1. HERO HEADER & PUBLIC BANNER: Solid Navy, No Gradients, No Badges */}
      {/* ========================================================================= */}
      <div className="rounded-lg bg-[#0B1524] text-white p-6 sm:p-8 border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Public Performance and SLA Transparency
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Municipal service delivery metrics, departmental turnarounds, and geospatial resolution equity. Every record is verified on the public audit log.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/report">
              <Button
                variant="accent"
                size="sm"
                className="bg-sky-700 hover:bg-sky-800 text-white font-semibold"
                leftIcon={<PlusCircle className="w-4 h-4" />}
              >
                Report Issue
              </Button>
            </Link>
            <Link href="/public/track">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white"
                leftIcon={<Search className="w-4 h-4" />}
              >
                Track by ID
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMethodology(true)}
              className="text-slate-300 hover:text-white hover:bg-slate-800"
              leftIcon={<HelpCircle className="w-4 h-4" />}
            >
              Ranking Logic
            </Button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. FILTER BAR */}
      {/* ========================================================================= */}
      <Card className="bg-white border-slate-200 shadow-xs">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Dashboard Filters
              </span>
              {isPending && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 ml-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Updating...
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Period Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Measurement Window
                </label>
                <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                  {(['30d', '90d', '1y', 'all'] as AnalyticsPeriod[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPeriod(p)}
                      className={`flex-1 text-xs py-1.5 px-2.5 rounded-md font-semibold transition-all ${
                        period === p
                          ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/60'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {p === '30d' ? '30 Days' : p === '90d' ? '90 Days' : p === '1y' ? '1 Year' : 'All Time'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ward Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Jurisdiction Ward
                </label>
                <Select
                  value={selectedWard}
                  onChange={(e) => setSelectedWard(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Municipal Wards (Citywide)' },
                    ...CONFIGURED_MUNICIPAL_WARDS.map((w) => ({
                      value: w.id,
                      label: `${w.code}: ${w.name}`,
                    })),
                  ]}
                />
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Incident Category
                </label>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Service Categories' },
                    { value: 'pothole', label: 'Roads & Highways (Potholes)' },
                    { value: 'water_leakage', label: 'Water & Sewerage Mains' },
                    { value: 'garbage', label: 'Waste Management & Sanitation' },
                    { value: 'broken_streetlight', label: 'Electrical & Street Lighting' },
                    { value: 'traffic_signal', label: 'Traffic & Transit Signals' },
                    { value: 'other', label: 'Other Public Hazards' },
                  ]}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* 3. EXECUTIVE KPI CARDS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Reported */}
        <Card className="hover:border-slate-300 transition-colors">
          <CardContent className="p-4 sm:p-5 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Reported
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {summary ? summary.totalReported.toLocaleString() : '-'}
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verified Intake</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Resolved */}
        <Card className="hover:border-slate-300 transition-colors">
          <CardContent className="p-4 sm:p-5 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Resolved
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">
              {summary ? summary.totalResolved.toLocaleString() : '-'}
            </div>
            <div className="text-[11px] text-emerald-700 font-medium">
              {summary && summary.totalReported > 0
                ? `${((summary.totalResolved / summary.totalReported) * 100).toFixed(1)}% closure rate`
                : '100%'}
            </div>
          </CardContent>
        </Card>

        {/* Open Workload */}
        <Card className="hover:border-slate-300 transition-colors">
          <CardContent className="p-4 sm:p-5 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Open Tickets
            </span>
            <div className="text-2xl sm:text-3xl font-black text-sky-700 font-mono">
              {summary ? summary.openIssues.toLocaleString() : '-'}
            </div>
            <div className="text-[11px] text-slate-500">
              Active in field crews
            </div>
          </CardContent>
        </Card>

        {/* Overdue Issues */}
        <Card className="hover:border-slate-300 transition-colors">
          <CardContent className="p-4 sm:p-5 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Overdue Tickets
            </span>
            <div className={`text-2xl sm:text-3xl font-black font-mono ${
              (summary?.overdueIssues || 0) > 0 ? 'text-rose-600' : 'text-slate-900'
            }`}>
              {summary ? summary.overdueIssues.toLocaleString() : '-'}
            </div>
            <div className="text-[11px] text-slate-500">
              SLA deadline breached
            </div>
          </CardContent>
        </Card>

        {/* Avg Resolution Turnaround */}
        <Card className="hover:border-slate-300 transition-colors">
          <CardContent className="p-4 sm:p-5 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Avg Turnaround
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {summary ? `${summary.avgResolutionHours}h` : '-'}
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-600" />
              <span>Intake to closure</span>
            </div>
          </CardContent>
        </Card>

        {/* SLA Compliance Rate */}
        <Card className="bg-emerald-50/50 border-emerald-200/80 hover:border-emerald-300 transition-colors">
          <CardContent className="p-4 sm:p-5 space-y-1">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
              SLA Compliance
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">
              {summary ? `${summary.slaComplianceRate}%` : '-'}
            </div>
            <div className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Target: &ge; 90.0%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* 4. TAB NAVIGATION */}
      {/* ========================================================================= */}
      <div className="border-b border-slate-200 flex items-center gap-1 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('leaderboard')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'leaderboard'
              ? 'border-sky-700 text-sky-900 bg-sky-50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Department Leaderboard</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('wards')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'wards'
              ? 'border-sky-700 text-sky-900 bg-sky-50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Ward Comparison</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'categories'
              ? 'border-sky-700 text-sky-900 bg-sky-50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Category Statistics</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('trends')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'trends'
              ? 'border-sky-700 text-sky-900 bg-sky-50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Resolution Trends &amp; Velocity</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('map')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'map'
              ? 'border-sky-700 text-sky-900 bg-sky-50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Public Map</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'timeline'
              ? 'border-sky-700 text-sky-900 bg-sky-50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Public Lifecycle Timeline</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 5. TAB 1: DEPARTMENT LEADERBOARD (EXPLAINABLE RANKINGS) */}
      {/* ========================================================================= */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-6">
          {/* Methodology Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-100 border border-slate-200">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  Explainable Leaderboard Logic &amp; Sample Size Disclosures
                </h4>
                <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                  Rankings are computed with open methodology: <strong>60% SLA Compliance Rate</strong> + <strong>40% Speed Index</strong> against published municipal targets. 
                  Departments with fewer than 5 eligible issues are disclosed with provisional notice to avoid tiny-sample ranking distortion.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMethodology(true)}
              className="text-xs font-semibold shrink-0"
            >
              Formula Specification
            </Button>
          </div>

          {/* Department Rankings Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Municipal Department</TableHead>
                  <TableHead className="text-center">Sample Size</TableHead>
                  <TableHead className="text-center">Avg Turnaround</TableHead>
                  <TableHead className="text-center">SLA Compliance</TableHead>
                  <TableHead className="text-center">Composite Score</TableHead>
                  <TableHead className="text-right">Public Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((dept) => (
                  <TableRow key={dept.departmentId} className="hover:bg-slate-50/70">
                    {/* Rank */}
                    <TableCell>
                      <div className="flex items-center justify-center w-8 h-8 rounded-full font-mono text-xs font-black bg-slate-100 text-slate-800 border border-slate-200">
                        #{dept.rank}
                      </div>
                    </TableCell>

                    {/* Department Name & Code */}
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{dept.departmentName}</span>
                          {dept.isLowSample && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                              Low Sample (&lt; 5)
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">
                          Jurisdiction Code: {dept.departmentCode} &bull; Target SLA: {dept.targetSlaHours}h
                        </span>
                        {dept.sampleDisclosureNote && (
                          <p className="text-[10px] text-amber-700">
                            {dept.sampleDisclosureNote}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    {/* Sample Size (Resolved / Total) */}
                    <TableCell className="text-center">
                      <div className="font-mono text-xs font-semibold text-slate-800">
                        {dept.resolvedCount} / {dept.eligibleIssues}
                      </div>
                      <span className="text-[10px] text-slate-500">tickets</span>
                    </TableCell>

                    {/* Avg Turnaround vs Target */}
                    <TableCell className="text-center">
                      <div className="font-mono text-xs font-bold text-slate-900">
                        {dept.avgResolutionHours}h
                      </div>
                      <span className="text-[10px] text-slate-500">
                        vs {dept.targetSlaHours}h target
                      </span>
                    </TableCell>

                    {/* SLA Compliance Rate */}
                    <TableCell className="text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <span className={`font-mono text-xs font-bold ${
                          dept.slaComplianceRate >= 95
                            ? 'text-emerald-600'
                            : dept.slaComplianceRate >= 88
                            ? 'text-amber-600'
                            : 'text-rose-600'
                        }`}>
                          {dept.slaComplianceRate}%
                        </span>
                      </div>
                      <div className="w-20 mx-auto bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            dept.slaComplianceRate >= 95 ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(100, dept.slaComplianceRate)}%` }}
                        />
                      </div>
                    </TableCell>

                    {/* Composite Score */}
                    <TableCell className="text-center">
                      <div className="font-mono text-sm font-black text-slate-900">
                        {dept.compositeScore}
                      </div>
                      <span className="text-[10px] text-slate-400">/ 100</span>
                    </TableCell>

                    {/* Public Status Badge */}
                    <TableCell className="text-right">
                      {dept.statusRating === 'exceeding' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Exceeding Target
                        </span>
                      )}
                      {dept.statusRating === 'meeting' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                          <ShieldCheck className="w-3 h-3 text-sky-600" />
                          Meeting Target
                        </span>
                      )}
                      {dept.statusRating === 'needs_attention' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          Attention Needed
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TAB 2: WARD PERFORMANCE COMPARISON */}
      {/* ========================================================================= */}
      {activeTab === 'wards' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-slate-100 border border-slate-200">
            <h4 className="text-xs font-bold text-slate-900">
              Geographic Resolution Equity Across Municipal Wards
            </h4>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Monitors service allocation parity and per-capita grievance intensity across residential, commercial, and industrial districts.
            </p>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ward Jurisdiction</TableHead>
                  <TableHead className="text-center">Population</TableHead>
                  <TableHead className="text-center">Reported Issues</TableHead>
                  <TableHead className="text-center">Resolution Rate</TableHead>
                  <TableHead className="text-center">Overdue</TableHead>
                  <TableHead className="text-center">Turnaround</TableHead>
                  <TableHead className="text-right">Density / 10k Residents</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wards.map((ward) => (
                  <TableRow key={ward.wardId} className="hover:bg-slate-50/70">
                    <TableCell>
                      <div className="space-y-0.5">
                        <span className="font-bold text-xs text-slate-900 block">
                          {ward.wardName}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500">
                          {ward.wardCode}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-center font-mono text-xs text-slate-700">
                      {ward.population.toLocaleString()}
                    </TableCell>

                    <TableCell className="text-center font-mono text-xs font-semibold text-slate-900">
                      {ward.totalIssues.toLocaleString()}
                    </TableCell>

                    <TableCell className="text-center">
                      <span className="font-mono text-xs font-bold text-emerald-600">
                        {ward.resolutionRate}%
                      </span>
                      <div className="w-16 mx-auto bg-slate-100 rounded-full h-1 mt-1 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${Math.min(100, ward.resolutionRate)}%` }}
                        />
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <span className={`font-mono text-xs font-semibold ${
                        ward.overdueIssues > 0 ? 'text-rose-600' : 'text-slate-400'
                      }`}>
                        {ward.overdueIssues}
                      </span>
                    </TableCell>

                    <TableCell className="text-center font-mono text-xs text-slate-800">
                      {ward.avgResolutionHours}h
                    </TableCell>

                    <TableCell className="text-right">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {ward.densityPer10k}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1">/ 10k</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. TAB 3: CATEGORY STATISTICS & BREAKDOWN */}
      {/* ========================================================================= */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-slate-100 border border-slate-200">
            <h4 className="text-xs font-bold text-slate-900">
              Civic Category Service Standards &amp; Workload Distribution
            </h4>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Service categories operate under fixed turnaround targets. Average resolution hours and on-time compliance rates reflect audited field remediation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <Card key={cat.category} className="hover:border-slate-300 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold text-slate-900">
                      {cat.label}
                    </CardTitle>
                    <span className="font-mono text-xs font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                      {cat.percentage}% of total
                    </span>
                  </div>
                  <CardDescription className="text-xs text-slate-500">
                    Municipal SLA Target: <strong className="text-slate-700">{cat.slaTargetHours} Hours</strong>
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Count & Avg Turnaround */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Volume</span>
                      <div className="text-lg font-black font-mono text-slate-900">
                        {cat.count.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Actual Turnaround</span>
                      <div className="text-lg font-black font-mono text-emerald-600">
                        {cat.avgResolutionHours}h
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-600">On-Time SLA Rate</span>
                      <span className="font-mono font-bold text-slate-900">{cat.slaComplianceRate}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, cat.slaComplianceRate)}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. TAB 4: RESOLUTION TRENDS & VELOCITY */}
      {/* ========================================================================= */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-slate-100 border border-slate-200">
            <h4 className="text-xs font-bold text-slate-900">
              Intake Velocity vs. Remediation Throughput
            </h4>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Tracks whether municipal field crews are keeping pace with citizen intake volume over the selected window.
            </p>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900">
                    Period Velocity &amp; Throughput Breakdown
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Reported grievances vs. verified closed issues per interval
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-sky-700" />
                    <span className="text-slate-700">Reported</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-emerald-500" />
                    <span className="text-slate-700">Resolved</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-rose-500" />
                    <span className="text-slate-700">Overdue</span>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-4">
              {/* Responsive Visual Bar Chart */}
              <div className="space-y-4">
                {trends.map((pt) => {
                  const maxVal = Math.max(...trends.map((t) => Math.max(t.reportedCount, t.resolvedCount)));
                  const repWidth = Math.max(8, (pt.reportedCount / maxVal) * 100);
                  const resWidth = Math.max(8, (pt.resolvedCount / maxVal) * 100);

                  return (
                    <div key={pt.periodLabel} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">{pt.periodLabel}</span>
                        <div className="flex items-center gap-3 font-mono text-[11px]">
                          <span className="text-sky-700 font-bold">{pt.reportedCount} reported</span>
                          <span className="text-slate-300">&bull;</span>
                          <span className="text-emerald-600 font-bold">{pt.resolvedCount} resolved</span>
                          <span className="text-slate-300">&bull;</span>
                          <span className="text-slate-600 font-semibold">{pt.slaComplianceRate}% SLA</span>
                        </div>
                      </div>

                      {/* Dual Bar Comparison */}
                      <div className="space-y-1">
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-sky-700 rounded-full"
                            style={{ width: `${repWidth}%` }}
                          />
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${resWidth}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. TAB 5: PUBLIC MAP INTEGRATION */}
      {/* ========================================================================= */}
      {activeTab === 'map' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-slate-900">
                Live Public Transparency Map
              </h4>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Geospatial distribution of civic incidents across municipal wards. Powered by OpenStreetMap and Leaflet.
              </p>
            </div>
            <Link href="/public">
              <Button variant="outline" size="sm" rightIcon={<ArrowUpRight className="w-4 h-4" />}>
                Open Fullscreen Map
              </Button>
            </Link>
          </div>

          <PublicMapWrapper />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. TAB 6: PUBLIC LIFECYCLE TIMELINE INSPECTOR (PRIVACY-PRESERVING) */}
      {/* ========================================================================= */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          {/* Privacy Shield Notice */}
          <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-sky-950">
                Constitutional Privacy Guarantee (Open Data Standard)
              </h4>
              <p className="text-[11px] text-sky-800 leading-relaxed mt-0.5">
                In strict adherence to municipal data privacy rules, public timelines permanently redact citizen phone numbers, email addresses, exact home door numbers, and sensitive officer personal data. Only official operational stages and department identifiers are published.
              </p>
            </div>
          </div>

          {/* Ticket Search Form */}
          <Card>
            <CardContent className="p-5">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLookupTicket(searchTicketId);
                }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <div className="flex-1">
                  <Input
                    placeholder="Enter Ticket ID (e.g. CIV-2026-8812, CIV-2026-8790)"
                    value={searchTicketId}
                    onChange={(e) => setSearchTicketId(e.target.value)}
                    leftIcon={<Search className="w-4 h-4" />}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={timelineLoading}
                >
                  {timelineLoading ? 'Searching...' : 'Inspect Timeline'}
                </Button>
              </form>

              {timelineError && (
                <div className="mt-3 text-xs font-semibold text-rose-600 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{timelineError}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Ticket Timeline Display */}
          {activeTicket && (
            <Card className="border-slate-300 shadow-md">
              <CardHeader className="border-b border-slate-100 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-slate-900">
                        {activeTicket.ticketNumber}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Audited Record
                      </span>
                    </div>
                    <CardTitle className="text-base text-slate-900 mt-1">
                      {activeTicket.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1 text-slate-500 text-xs">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{activeTicket.generalLocation}</span>
                      <span>&bull;</span>
                      <span>{activeTicket.wardName}</span>
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={activeTicket.priority} />
                    <StatusBadge status={activeTicket.status} />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* 5-Step Visual Timeline */}
                <div className="space-y-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Public Audit Lifecycle Chain
                  </h4>

                  <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {activeTicket.timeline.map((evt, idx) => (
                      <div key={idx} className="relative group">
                        {/* Status Node Icon */}
                        <div
                          className={`absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            evt.isCompleted
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : evt.isActive
                              ? 'bg-sky-700 text-white ring-2 ring-sky-200'
                              : 'bg-slate-200 text-slate-500 border border-slate-300'
                          }`}
                        >
                          {evt.isCompleted ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            idx + 1
                          )}
                        </div>

                        {/* Step Details */}
                        <div className="space-y-1">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <span className="font-bold text-xs text-slate-900">
                              {evt.title}
                            </span>
                            <span className="font-mono text-[11px] text-slate-500">
                              {evt.timestamp}
                            </span>
                          </div>

                          <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                            <Building2 className="w-3 h-3" />
                            <span>Actor: {evt.actorRolePublic}</span>
                          </div>

                          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                            {evt.notes}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 11. METHODOLOGY & EXPLAINABILITY MODAL */}
      {/* ========================================================================= */}
      {showMethodology && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75">
          <div className="relative w-full max-w-lg bg-white rounded-xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-sky-700" />
                <h3 className="text-base font-bold text-slate-900">
                  Explainable Ranking Methodology
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMethodology(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                The CIVOARA Department Leaderboard is calculated using transparent mathematical weighting designed to reward prompt resolution while penalizing SLA breaches:
              </p>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-900 space-y-1">
                <div className="font-bold">Composite Score (0 - 100) =</div>
                <div className="pl-3">&bull; (SLA Compliance Rate % × 0.60)</div>
                <div className="pl-3">&bull; + (Speed Index × 0.40)</div>
              </div>

              <h5 className="font-bold text-slate-800 pt-1">
                Small-Sample Disclosure Policy
              </h5>
              <p>
                To avoid unfairly penalizing or inflating rankings for departments with tiny sample sizes (such as during low seasonal incident flow), the system requires a minimum threshold of <strong>5 completed issues</strong>. Any division with fewer than 5 tickets is clearly marked with a <span className="text-amber-800 font-bold bg-amber-50 px-1 py-0.5 rounded border border-amber-200">Low Sample (&lt; 5)</span> disclosure.
              </p>

              <h5 className="font-bold text-slate-800 pt-1">
                Privacy Protection Standards
              </h5>
              <p>
                In compliance with civic data charters, citizen identities, domestic door numbers, personal mobile numbers, and officer home details are strictly redacted from all public views.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowMethodology(false)}
              >
                Understood
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
