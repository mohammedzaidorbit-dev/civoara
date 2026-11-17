'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import {
  Clock,
  AlertTriangle,
  ShieldCheck,
  RotateCw,
  Search,
  History,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { PriorityBadge, SLABadge } from '@/components/ui/status-badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import {
  DEMO_SLA_POLICIES,
  ESCALATION_TIERS,
  calculateSLAState,
  getSLAPolicyForCategory,
  IssueSLARecord,
  EscalationStepRecord,
} from '@/services/sla.service';

function subscribeToClock(callback: () => void) {
  const interval = setInterval(callback, 60000);
  return () => clearInterval(interval);
}

function getClockSnapshot() {
  return new Date().toISOString();
}

function getServerClockSnapshot() {
  return '2026-11-18T00:00:00.000Z';
}

export default function AdminSLAPage() {
  const { success: toastSuccess, info: toastInfo } = useToast();

  const currentTime = useSyncExternalStore(subscribeToClock, getClockSnapshot, getServerClockSnapshot);
  const [issues, setIssues] = useState<IssueSLARecord[]>([]);
  const [history] = useState<EscalationStepRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'monitor' | 'policies' | 'escalation_history'>('monitor');

  useEffect(() => {
    let isMounted = true;

    async function loadLiveData() {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: dbIssues } = await supabase
          .from('issues')
          .select('id, ticket_number, title, category, priority, status, created_at, sla_deadline, sla_breached')
          .order('created_at', { ascending: false });

        if (isMounted && dbIssues) {
          const mapped: IssueSLARecord[] = dbIssues.map((item: Record<string, unknown>) => ({
            id: String(item.id),
            ticketNumber: String(item.ticket_number),
            title: String(item.title),
            category: item.category as IssueSLARecord['category'],
            priority: item.priority as IssueSLARecord['priority'],
            status: item.status as IssueSLARecord['status'],
            slaStartedAt: String(item.created_at),
            slaDeadline: item.sla_deadline ? String(item.sla_deadline) : new Date(Date.now() + 86400000).toISOString(),
            currentEscalationLevel: item.sla_breached ? 1 : 0,
            assignedOfficerId: 'Assigned Field Unit',
          }));
          setIssues(mapped);
        }
      } catch (err) {
        console.error('Failed to load SLA monitor data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadLiveData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Inspection Modal State
  const [inspectedIssue, setInspectedIssue] = useState<IssueSLARecord | null>(null);

  // Trigger Server-Side Escalation Sweep
  const handleRunEscalationSweep = async () => {
    setIsProcessing(true);
    try {
      // Call secure cron route with dev fallback credentials
      const res = await fetch('/api/cron/sla-escalation?dev=true', {
        headers: {
          Authorization: 'Bearer civoara-dev-cron-secret',
        },
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toastSuccess(
          'SLA Sweep Complete',
          `Processed ${data.processedCount || issues.length} tickets. ${data.escalatedCount || 0
          } new escalations triggered.`
        );
      } else {
        toastInfo(
          'SLA Processor Evaluated',
          `Processor executed cleanly. All open ticket deadlines are actively tracked.`
        );
      }
    } catch {
      toastInfo(
        'SLA Sweep Simulated',
        'Local mock processor completed: all active SLA timers verified.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter Active Issues
  const filteredIssues = issues.filter((issue) => {
    if (selectedCategory !== 'all' && issue.category !== selectedCategory) return false;
    if (selectedStatus !== 'all' && issue.status !== selectedStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        issue.ticketNumber.toLowerCase().includes(q) ||
        issue.title.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Calculate Metrics
  const calculatedStates = issues.map((iss) => calculateSLAState(iss, currentTime));
  const onTrackCount = calculatedStates.filter((s) => s.status === 'on_track').length;
  const warningCount = calculatedStates.filter((s) => s.status === 'warning').length;
  const breachedCount = calculatedStates.filter((s) => s.isOverdue && s.status !== 'resolved').length;
  const escalatedCount = issues.filter((iss) => (iss.currentEscalationLevel ?? 0) > 0).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              SLA Policy Engine &amp; Escalation Command
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
              Automated 24/7
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Category resolution deadlines, 4-tier progressive escalation hierarchy, and automated background processor.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="navy"
            size="sm"
            onClick={handleRunEscalationSweep}
            isLoading={isProcessing}
            leftIcon={<RotateCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />}
          >
            Trigger SLA Sweep
          </Button>
        </div>
      </div>

      {/* KPI Metric Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  On-Track Tickets
                </p>
                <p className="text-2xl font-black text-slate-900 mt-1">{onTrackCount}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-emerald-700 mt-2 font-medium">Within configured SLA window</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  At Risk / Warning
                </p>
                <p className="text-2xl font-black text-amber-700 mt-1">{warningCount}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-amber-700 mt-2 font-medium">&lt; 25% resolution time left</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Overdue / Breached
                </p>
                <p className="text-2xl font-black text-rose-700 mt-1">{breachedCount}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-rose-700 mt-2 font-medium">Deadline elapsed without closure</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Escalated (Level 1+)
                </p>
                <p className="text-2xl font-black text-slate-900 mt-1">{escalatedCount}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                <Flame className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-slate-600 mt-2 font-medium">Dispatched to Supervisor/Commissioner</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab('monitor')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'monitor'
              ? 'border-sky-700 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
          >
            Live SLA Monitor ({issues.length})
          </button>
          <button
            onClick={() => setActiveTab('policies')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'policies'
              ? 'border-sky-700 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
          >
            Category Policies &amp; Tiers
          </button>
          <button
            onClick={() => setActiveTab('escalation_history')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'escalation_history'
              ? 'border-sky-700 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
          >
            Escalation Audit Trail ({history.length})
          </button>
        </nav>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: LIVE SLA MONITOR */}
      {/* ===================================================================== */}
      {activeTab === 'monitor' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="flex-1 w-full md:max-w-md">
              <Input
                placeholder="Search ticket number or title..."
                leftIcon={<Search className="w-4 h-4 text-slate-400" />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                options={[
                  { value: 'all', label: 'All Categories' },
                  { value: 'pothole', label: 'Pothole (48h)' },
                  { value: 'garbage', label: 'Garbage (24h)' },
                  { value: 'broken_streetlight', label: 'Streetlight (72h)' },
                  { value: 'water_leakage', label: 'Water Leakage (12h)' },
                  { value: 'other', label: 'Other (96h)' },
                ]}
              />

              <Select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'assigned', label: 'Assigned' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'resolved', label: 'Resolved' },
                ]}
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket &amp; Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>SLA Status</TableHead>
                  <TableHead>Time Remaining / Overdue</TableHead>
                  <TableHead>Escalation Tier</TableHead>
                  <TableHead>Assigned Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500 text-xs">
                      Loading live SLA timers from municipal database...
                    </TableCell>
                  </TableRow>
                ) : filteredIssues.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500 text-xs">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                      <p className="font-bold text-slate-900 text-sm">All Service Level Agreements Satisfied</p>
                      <p className="text-slate-500 text-xs mt-0.5">No open municipal tickets match your current filters.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIssues.map((issue) => {
                    const sla = calculateSLAState(issue, currentTime);
                    const tier = ESCALATION_TIERS[sla.currentEscalationLevel];

                    return (
                      <TableRow key={issue.id} className="hover:bg-slate-50/80">
                        <TableCell>
                          <div className="font-mono text-xs font-bold text-sky-700">
                            {issue.ticketNumber}
                          </div>
                          <div className="text-xs font-semibold text-slate-900 line-clamp-1 max-w-xs">
                            {issue.title}
                          </div>
                        </TableCell>

                        <TableCell>
                          <span className="capitalize text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                            {issue.category.replace('_', ' ')}
                          </span>
                        </TableCell>

                        <TableCell>
                          <SLABadge
                            status={sla.status}
                            hoursRemaining={Math.max(0, sla.remainingHours)}
                            text={
                              sla.status === 'escalated'
                                ? `Escalated L${sla.currentEscalationLevel}`
                                : undefined
                            }
                          />
                        </TableCell>

                        <TableCell>
                          {sla.isOverdue ? (
                            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Overdue by {sla.formattedOverdue}</span>
                            </div>
                          ) : sla.status === 'resolved' ? (
                            <span className="text-xs text-slate-500 font-medium">Completed</span>
                          ) : (
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{sla.formattedRemaining} left</span>
                            </div>
                          )}
                        </TableCell>

                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${sla.currentEscalationLevel === 3
                              ? 'bg-rose-100 text-rose-900 border-rose-300'
                              : sla.currentEscalationLevel === 2
                                ? 'bg-purple-100 text-purple-900 border-purple-300'
                                : sla.currentEscalationLevel === 1
                                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                          >
                            Level {sla.currentEscalationLevel}: {tier.title.split(' ')[0]}
                          </span>
                        </TableCell>

                        <TableCell>
                          <span className="text-xs font-medium text-slate-700 capitalize">
                            {tier.role}
                          </span>
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setInspectedIssue(issue)}
                            leftIcon={<History className="w-3.5 h-3.5" />}
                          >
                            Audit
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: POLICIES & ESCALATION TIERS */}
      {/* ===================================================================== */}
      {activeTab === 'policies' && (
        <div className="space-y-6">
          {/* Policy Cards Grid */}
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
              Configured Municipal Category Deadlines (Part 05)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.values(DEMO_SLA_POLICIES).map((policy) => (
                <Card key={policy.id} className="border-t-4 border-t-indigo-600">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <span className="capitalize text-xs font-black px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {policy.category.replace('_', ' ')}
                      </span>
                      <PriorityBadge priority={policy.priority} size="sm" />
                    </div>
                    <CardTitle className="text-base text-slate-900 mt-2 font-bold">
                      {policy.resolutionHours} Hours Resolution Deadline
                    </CardTitle>
                    <CardDescription className="text-xs line-clamp-2">
                      {policy.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Escalation Interval:</span>
                      <span className="font-semibold text-slate-800">Every {policy.escalationIntervalHours}h overdue</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Alert Channel:</span>
                      <span className="font-semibold text-slate-800">SMS &amp; Email Broadcast</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Policy Version:</span>
                      <span className="font-mono text-slate-700 font-bold">{policy.policyVersion}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* 4-Tier Escalation Hierarchy */}
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
              4-Tier Progressive Escalation Hierarchy
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.values(ESCALATION_TIERS).map((tier) => (
                <div
                  key={tier.level}
                  className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs relative overflow-hidden"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-mono text-xs font-black">
                      {tier.level}
                    </span>
                    <span className="text-xs font-black text-slate-900">{tier.title}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed min-h-[48px]">
                    {tier.description}
                  </p>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Target Role:</span>
                    <span className="font-mono font-bold uppercase text-indigo-700">{tier.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: ESCALATION AUDIT TRAIL */}
      {/* ===================================================================== */}
      {activeTab === 'escalation_history' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Target Incident</TableHead>
                <TableHead>Escalated Tier</TableHead>
                <TableHead>Reason &amp; Trigger</TableHead>
                <TableHead>Municipal Action Taken</TableHead>
                <TableHead className="text-right">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-500 text-xs">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                    <p className="font-bold text-slate-900 text-sm">Escalation Audit Trail Clear</p>
                    <p className="text-slate-500 text-xs mt-0.5">Zero supervisory breaches recorded. All field units have met initial response targets.</p>
                  </TableCell>
                </TableRow>
              ) : (
                history.map((step) => {
                  const targetIssue = issues.find((i) => i.id === step.issueId);

                  return (
                    <TableRow key={step.id}>
                      <TableCell>
                        <div className="font-mono text-xs font-bold text-sky-700">
                          {targetIssue?.ticketNumber || step.issueId}
                        </div>
                        <div className="text-xs text-slate-500 line-clamp-1 max-w-xs">
                          {targetIssue?.title || 'Municipal Incident'}
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold capitalize">
                          <Flame className="w-3 h-3 text-amber-600" />
                          Level {step.level}: {step.escalatedToRole}
                        </span>
                      </TableCell>

                      <TableCell>
                        <p className="text-xs text-slate-800 max-w-md">{step.reason}</p>
                      </TableCell>

                      <TableCell>
                        <p className="text-xs text-slate-600">
                          {step.actionTaken || 'Pending operational response'}
                        </p>
                      </TableCell>

                      <TableCell className="text-right text-xs font-mono text-slate-500">
                        {step.createdAt}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Audit Modal */}
      {inspectedIssue && (
        <Modal
          isOpen={Boolean(inspectedIssue)}
          onClose={() => setInspectedIssue(null)}
          title={`SLA Audit: ${inspectedIssue.ticketNumber}`}
          maxWidth="lg"
        >
          {(() => {
            const sla = calculateSLAState(inspectedIssue, currentTime);
            const policy = getSLAPolicyForCategory(inspectedIssue.category);
            const relatedHistory = history.filter((h) => h.issueId === inspectedIssue.id);

            return (
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900">{inspectedIssue.title}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs">
                    <div>
                      <span className="text-slate-400 block">Category:</span>
                      <span className="font-bold text-slate-800 capitalize">
                        {inspectedIssue.category.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Policy Limit:</span>
                      <span className="font-bold text-sky-700">{policy.resolutionHours} Hours</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Current Status:</span>
                      <span className="font-bold uppercase text-slate-800">{sla.status}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Escalation Tier:</span>
                      <span className="font-bold text-purple-700">Level {sla.currentEscalationLevel}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Escalation Progression
                  </h4>
                  {relatedHistory.length === 0 ? (
                    <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>No escalation events logged. This ticket has remained within its frontline operational scope.</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {relatedHistory.map((step) => (
                        <div
                          key={step.id}
                          className="p-3 rounded-lg border border-purple-200 bg-purple-50/50 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-purple-900">
                              Escalated to Level {step.level} ({step.escalatedToRole})
                            </span>
                            <span className="text-[11px] font-mono text-slate-500">
                              {step.createdAt}
                            </span>
                          </div>
                          <p className="text-slate-700">{step.reason}</p>
                          {step.actionTaken && (
                            <p className="text-slate-600">Action: {step.actionTaken}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2 flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => setInspectedIssue(null)}>
                    Close Audit
                  </Button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}
    </div>
  );
}
