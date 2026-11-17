'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  GitMerge,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Building2,
  MapPin,
  Clock,
  CheckCircle2,
  Sliders,
  History,
  Check,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { useToast } from '@/components/ui/toast';
import {
  previewRestructuringAction,
  executeRestructuringAction,
  getOrganizationVersionsAction,
  getIssueOwnershipHistoryAction,
} from '@/lib/actions/reorganization';
import {
  RestructuringRequest,
  RestructuringPreview,
  RestructuringExecutionResult,
  DEMO_DEPARTMENTS_STORE,
  DEMO_WARDS_STORE,
} from '@/services/reorganization.service';
import {
  OrganizationVersion,
  OwnershipSegment,
  RestructuringChangeType,
  SLAMigrationPolicy,
} from '@/types';

export default function AdminReorganizationPage() {
  const { success, error: toastError, info } = useToast();

  const [activeTab, setActiveTab] = useState<'wizard' | 'versions' | 'audit'>('wizard');
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [changeType, setChangeType] = useState<RestructuringChangeType>('department_merger');
  const [title, setTitle] = useState('Merger: Roads & Highways into Infrastructure');
  const [summary, setSummary] = useState(
    'Consolidating municipal road maintenance and civil works into a unified Public Works & Infrastructure division.'
  );
  const [sourceDept, setSourceDept] = useState('dept-roads');
  const [targetDept, setTargetDept] = useState('dept-infrastructure');
  const [sourceWard, setSourceWard] = useState('ward-01-downtown');
  const [targetWard, setTargetWard] = useState('ward-01-downtown');
  const [migrationPolicy, setMigrationPolicy] = useState<SLAMigrationPolicy>('fair_pro_rata');
  const [gracePeriodHours, setGracePeriodHours] = useState(12);

  // Preview & Execution State
  const [preview, setPreview] = useState<RestructuringPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<RestructuringExecutionResult | null>(null);

  // History State
  const [versions, setVersions] = useState<OrganizationVersion[]>([]);
  const [selectedIssueAudit, setSelectedIssueAudit] = useState<string>('iss-reorg-001');
  const [ownershipSegments, setOwnershipSegments] = useState<OwnershipSegment[]>([]);

  useEffect(() => {
    async function loadData() {
      const v = await getOrganizationVersionsAction();
      setVersions(v);
      const segs = await getIssueOwnershipHistoryAction(selectedIssueAudit);
      setOwnershipSegments(segs);
    }
    loadData();
  }, [selectedIssueAudit]);

  const handleGeneratePreview = async () => {
    setIsLoadingPreview(true);
    try {
      const req: RestructuringRequest = {
        changeType,
        title,
        summary,
        sourceDepartmentId: sourceDept,
        targetDepartmentId: targetDept,
        sourceWardId: sourceWard,
        targetWardId: targetWard,
        migrationPolicy,
        gracePeriodHours,
      };

      const res = await previewRestructuringAction(req);
      setPreview(res);
      setWizardStep(3);
      info('Restructuring Impact Generated', `Analyzed ${res.totalAffectedIssues} open issues for ${res.targetVersionNumber}.`);
    } catch (err) {
      toastError('Preview Failed', 'Could not evaluate restructuring impact.');
      console.error(err);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleExecuteRestructuring = async () => {
    if (!preview) return;
    setIsExecuting(true);
    try {
      const res = await executeRestructuringAction(preview.request, 'admin-director-01');
      if (res.success) {
        setExecutionResult(res);
        setWizardStep(4);
        success('Organization Reorganized', res.message);
        // Refresh versions list
        const updatedVersions = await getOrganizationVersionsAction();
        setVersions(updatedVersions);
      } else {
        toastError('Restructuring Failed', res.message);
      }
    } catch (err) {
      toastError('Execution Error', 'Transactional error occurred during restructuring.');
      console.error(err);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleResetWizard = () => {
    setWizardStep(1);
    setPreview(null);
    setExecutionResult(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-slate-100 text-slate-800">
              <GitMerge className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Administrative Restructuring &amp; Fair SLA Migration
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Execute department mergers, ward transfers, and routing changes. Employs multi-segment ownership accounting to guarantee zero historical delay erasure and protect new divisions from inherited SLA blame.
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

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('wizard')}
          className={`pb-3 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${activeTab === 'wizard'
              ? 'border-sky-700 text-sky-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
        >
          <GitMerge className="w-4 h-4" />
          Restructuring Wizard
        </button>

        <button
          onClick={() => setActiveTab('versions')}
          className={`pb-3 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${activeTab === 'versions'
              ? 'border-sky-700 text-sky-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
        >
          <History className="w-4 h-4" />
          Organization Versions ({versions.length})
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${activeTab === 'audit'
              ? 'border-sky-700 text-sky-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
        >
          <Clock className="w-4 h-4" />
          Ownership Segments Audit
        </button>
      </div>

      {/* TAB 1: RESTRUCTURING WIZARD */}
      {activeTab === 'wizard' && (
        <div className="space-y-6">
          {/* Wizard Progress Stepper */}
          <div className="grid grid-cols-4 gap-2 border-b border-slate-200 pb-4">
            {[
              { num: 1, label: 'Change Scope' },
              { num: 2, label: 'Fair SLA Policy' },
              { num: 3, label: 'Impact Preview' },
              { num: 4, label: 'Execution & Audit' },
            ].map((st) => (
              <div
                key={st.num}
                className={`flex items-center gap-2 p-2 rounded-lg text-xs font-semibold ${wizardStep === st.num
                    ? 'bg-sky-50 text-sky-900 border border-sky-200'
                    : wizardStep > st.num
                      ? 'text-emerald-700 bg-emerald-50/50'
                      : 'text-slate-400'
                  }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${wizardStep === st.num
                      ? 'bg-sky-700 text-white'
                      : wizardStep > st.num
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                >
                  {wizardStep > st.num ? <Check className="w-3 h-3 text-white" /> : st.num}
                </span>
                <span className="truncate">{st.label}</span>
              </div>
            ))}
          </div>

          {/* STEP 1: CHANGE SCOPE */}
          {wizardStep === 1 && (
            <Card className="border-slate-200">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Step 1: Select Administrative Restructuring Action
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Choose the type of reorganization to perform across municipal entities.
                  </p>
                </div>

                {/* Change Type Radio Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'department_merger',
                      title: 'Merge Departments',
                      desc: 'Consolidate two municipal divisions into a single unified department.',
                      icon: <Building2 className="w-5 h-5" />,
                    },
                    {
                      id: 'ward_transfer',
                      title: 'Transfer Ward Responsibility',
                      desc: 'Reassign operational jurisdiction of an entire ward to another department.',
                      icon: <MapPin className="w-5 h-5" />,
                    },
                    {
                      id: 'officer_reassignment',
                      title: 'Reassign Officers',
                      desc: 'Rebalance active field ticket loads across responder staff.',
                      icon: <Sliders className="w-5 h-5" />,
                    },
                  ].map((ct) => (
                    <div
                      key={ct.id}
                      onClick={() => setChangeType(ct.id as RestructuringChangeType)}
                      className={`p-4 rounded-lg border cursor-pointer ${changeType === ct.id
                          ? 'border-sky-700 bg-sky-50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-400 bg-white'
                        }`}
                    >
                      <div className="flex items-center gap-2 mb-2 text-sky-700">
                        {ct.icon}
                        <h4 className="font-bold text-xs text-slate-900">{ct.title}</h4>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{ct.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Entity Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Source Department (Departing)
                    </label>
                    <Select
                      value={sourceDept}
                      onChange={(e) => setSourceDept(e.target.value)}
                      options={DEMO_DEPARTMENTS_STORE.map((d) => ({
                        value: d.id,
                        label: d.name,
                      }))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Target Department (Assuming Responsibility)
                    </label>
                    <Select
                      value={targetDept}
                      onChange={(e) => setTargetDept(e.target.value)}
                      options={DEMO_DEPARTMENTS_STORE.map((d) => ({
                        value: d.id,
                        label: d.name,
                      }))}
                    />
                  </div>
                </div>

                {changeType === 'ward_transfer' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        Ward Jurisdiction Transferred
                      </label>
                      <Select
                        value={sourceWard}
                        onChange={(e) => {
                          setSourceWard(e.target.value);
                          setTargetWard(e.target.value);
                        }}
                        options={DEMO_WARDS_STORE.map((w) => ({
                          value: w.id,
                          label: `${w.name} (${w.code})`,
                        }))}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-3 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Restructuring Title</label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Administrative Justification & Change Summary
                    </label>
                    <Input value={summary} onChange={(e) => setSummary(e.target.value)} />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setWizardStep(2)}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Configure SLA Migration Policy
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 2: FAIR SLA POLICY */}
          {wizardStep === 2 && (
            <Card className="border-slate-200">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Step 2: Fair SLA Migration & Accountability Model
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Select how open and overdue tickets are partitioned between the outgoing and incoming divisions.
                  </p>
                </div>

                {/* Policies Radio Grid */}
                <div className="grid grid-cols-1 gap-3">
                  {[
                    {
                      id: 'fair_pro_rata',
                      title: 'Fair Pro-Rata (Remaining Budget Allocation) (Recommended)',
                      desc: 'Deducts elapsed time under outgoing department. Incoming division receives remaining budget. Overdue tickets receive a fair emergency buffer (e.g. 12h) without wiping the citizen complaint age or historical breach flags.',
                      badge: 'Zero Blame Shift',
                    },
                    {
                      id: 'fresh_segment_budget',
                      title: 'Fresh Segment Budget (Standard Target with Segment Partition)',
                      desc: 'Awards incoming department full standard SLA budget for remediation onsite, while complaint creation timestamp and historical elapsed times remain permanently preserved.',
                      badge: 'Full Remediation Window',
                    },
                    {
                      id: 'grandfathered_deadline',
                      title: 'Grandfathered Hard Deadline',
                      desc: 'Retains original hard deadline without changes. Partitions ownership segments cleanly at transfer moment.',
                      badge: 'Fixed Calendar Target',
                    },
                  ].map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setMigrationPolicy(p.id as SLAMigrationPolicy)}
                      className={`p-4 rounded-lg border cursor-pointer flex items-start gap-4 ${migrationPolicy === p.id
                          ? 'border-sky-700 bg-sky-50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-400 bg-white'
                        }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${migrationPolicy === p.id
                            ? 'border-sky-700 bg-sky-700 text-white'
                            : 'border-slate-300'
                          }`}
                      >
                        {migrationPolicy === p.id && <span className="w-2 h-2 rounded-full bg-white"></span>}
                      </div>

                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900">{p.title}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {p.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{p.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800">
                        Emergency Grace Period for Overdue Transfers
                      </span>
                      <p className="text-[11px] text-slate-500">
                        When migrating an issue that the outgoing department already breached, grant incoming field teams this minimum operational buffer to inspect and repair without erasing the citizen grievance age.
                      </p>
                    </div>
                    <div className="w-32">
                      <Select
                        value={String(gracePeriodHours)}
                        onChange={(e) => setGracePeriodHours(Number(e.target.value))}
                        options={[
                          { value: '6', label: '6 Hours' },
                          { value: '12', label: '12 Hours (Default)' },
                          { value: '24', label: '24 Hours' },
                          { value: '48', label: '48 Hours' },
                        ]}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <Button variant="outline" size="md" onClick={() => setWizardStep(1)}>
                    Back to Scope
                  </Button>

                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleGeneratePreview}
                    isLoading={isLoadingPreview}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Generate Live Impact Preview
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 3: IMPACT PREVIEW */}
          {wizardStep === 3 && preview && (
            <div className="space-y-6">
              {/* Preview Summary Banner */}
              <div className="p-5 rounded-lg bg-[#0B1524] text-white space-y-4 shadow-xs border border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Restructuring Plan Preview
                    </span>
                    <h3 className="text-lg font-bold text-white mt-0.5">
                      Target Version: {preview.targetVersionNumber}
                    </h3>
                  </div>

                  <span className="font-mono text-xs px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200">
                    Policy: {preview.request.migrationPolicy.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block">Affected Divisions</span>
                    <span className="font-bold text-sm text-white">
                      {preview.affectedDepartments.map((d) => d.name).join(' → ')}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block">Open Issues to Migrate</span>
                    <span className="font-bold text-sm text-white">{preview.totalAffectedIssues} Issues</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block">Overdue Tickets</span>
                    <span className="font-bold text-sm text-rose-300">
                      {preview.overdueIssuesCount} Overdue (Grace Buffer Applied)
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block">On-Track Tickets</span>
                    <span className="font-bold text-sm text-emerald-300">
                      {preview.onTrackIssuesCount} On-Track
                    </span>
                  </div>
                </div>
              </div>

              {/* SLA Consequences Breakdown Table */}
              <Card className="border-slate-200">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-sky-700" />
                      Individual Ticket SLA Consequence Preview
                    </h4>
                    <span className="text-xs text-slate-500 font-medium">
                      Multi-Segment Partitioning
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ticket Reference</TableHead>
                          <TableHead>Outgoing Department Audit</TableHead>
                          <TableHead>Incoming Department Budget</TableHead>
                          <TableHead>SLA Status</TableHead>
                          <TableHead>Fairness Note</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {preview.issueConsequences.map((c) => (
                          <TableRow key={c.issueId} className="hover:bg-slate-50/80">
                            <TableCell>
                              <div className="space-y-0.5">
                                <span className="font-mono font-bold text-xs text-slate-900">
                                  {c.ticketNumber}
                                </span>
                                <p className="text-[11px] text-slate-500 truncate max-w-xs">{c.title}</p>
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="space-y-0.5 text-xs">
                                <span className="font-semibold text-slate-800">{c.oldDepartmentName}</span>
                                <p className="text-[11px] font-mono text-slate-500">
                                  Locked Elapsed: <strong className="text-slate-700">{c.oldElapsedHours}h</strong>
                                </p>
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="space-y-0.5 text-xs">
                                <span className="font-semibold text-slate-900">{c.newDepartmentName}</span>
                                <p className="text-[11px] font-mono text-emerald-700">
                                  Starts at: 0.0h (Budget: {c.newSegmentBudgetHours}h)
                                </p>
                              </div>
                            </TableCell>

                            <TableCell>
                              {c.isOverdue ? (
                                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                                  BREACHED (Historic)
                                </span>
                              ) : (
                                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  ON TRACK
                                </span>
                              )}
                            </TableCell>

                            <TableCell>
                              <span className="text-[11px] text-slate-600 leading-snug block max-w-sm">
                                {c.fairnessNote}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Fairness Guarantees Box */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Constitutional Fairness & Legal Audit Guarantees
                    </span>
                    <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                      {preview.fairnessGuarantees.map((g, idx) => (
                        <li key={idx}>{g}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Confirmation Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <Button variant="outline" size="md" onClick={() => setWizardStep(2)}>
                      Modify Parameters
                    </Button>

                    <Button
                      variant="primary"
                      size="md"
                      onClick={handleExecuteRestructuring}
                      isLoading={isExecuting}
                      leftIcon={<Check className="w-4 h-4" />}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    >
                      Confirm & Execute Transactional Migration
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* STEP 4: EXECUTION & AUDIT RESULT */}
          {wizardStep === 4 && executionResult && (
            <Card className="border-slate-300 bg-white shadow-xs">
              <CardContent className="p-8 text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs border border-emerald-200">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-2xl font-bold text-slate-900">
                    Administrative Restructuring Successfully Executed
                  </h3>
                  <p className="text-xs text-slate-500 max-w-xl mx-auto">
                    {executionResult.message}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-left max-w-3xl mx-auto pt-2">
                  <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      New Org Version
                    </span>
                    <span className="text-base font-bold text-slate-900 font-mono">
                      {executionResult.versionNumber}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Issues Migrated
                    </span>
                    <span className="text-base font-black text-slate-900">
                      {executionResult.migratedIssuesCount} Tickets
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Segments Closed / Opened
                    </span>
                    <span className="text-base font-black text-slate-900">
                      {executionResult.segmentsClosedCount} / {executionResult.segmentsOpenedCount}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Citizens & Officers Notified
                    </span>
                    <span className="text-base font-black text-emerald-700">
                      {executionResult.notificationsDispatchedCount} Alerts
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 pt-4">
                  <Button variant="outline" size="sm" onClick={handleResetWizard} leftIcon={<RotateCcw className="w-4 h-4" />}>
                    Start Another Restructuring
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setActiveTab('audit')}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    View Ownership Audit Segments
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* TAB 2: ORGANIZATION VERSIONS */}
      {activeTab === 'versions' && (
        <Card className="border-slate-200">
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Municipal Organization Version Ledger
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Immutable historical versions of city departments, ward jurisdictions, and routing configurations.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Version</TableHead>
                    <TableHead>Effective Date</TableHead>
                    <TableHead>Change Type</TableHead>
                    <TableHead>Migration Policy</TableHead>
                    <TableHead>Change Summary</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {versions.map((ver) => (
                    <TableRow key={ver.id} className="hover:bg-slate-50/80">
                      <TableCell>
                        <span className="font-mono font-bold text-xs text-sky-900 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                          {ver.versionNumber}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 font-mono">
                        {new Date(ver.effectiveDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <span className="capitalize text-xs font-semibold text-slate-800">
                          {ver.changeType.replace(/_/g, ' ')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-mono text-slate-600">
                          {ver.migrationPolicy || 'fair_pro_rata'}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 max-w-md">
                        {ver.changeSummary}
                      </TableCell>
                      <TableCell>
                        {ver.isCurrent ? (
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                            CURRENT ACTIVE
                          </span>
                        ) : (
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            HISTORICAL
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: OWNERSHIP SEGMENTS AUDIT */}
      {activeTab === 'audit' && (
        <Card className="border-slate-200">
          <CardContent className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Incident Multi-Segment Ownership Audit
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Examine the chronological ownership chain for any incident to audit departmental SLA compliance independently.
                </p>
              </div>

              <div className="w-64">
                <Select
                  value={selectedIssueAudit}
                  onChange={(e) => setSelectedIssueAudit(e.target.value)}
                  options={[
                    { value: 'iss-reorg-001', label: 'CIV-2026-8801 (Pothole Overpass)' },
                    { value: 'iss-reorg-002', label: 'CIV-2026-8802 (Pavement Subsidence)' },
                    { value: 'iss-reorg-003', label: 'CIV-2026-8803 (Water Leakage Wall)' },
                  ]}
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Segment</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Assigned Officer</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                    <TableHead>Elapsed Hours</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Outcome</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ownershipSegments.map((seg, idx) => (
                    <TableRow key={seg.id} className="hover:bg-slate-50/80">
                      <TableCell>
                        <span className="font-mono text-xs font-bold text-slate-700">
                          #{idx + 1}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-bold text-slate-900">
                          {seg.departmentName || seg.departmentId}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {seg.officerName || 'Unassigned Queue'}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-slate-500">
                        {new Date(seg.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-slate-500">
                        {seg.endTime
                          ? new Date(seg.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'Active (Current)'}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono font-bold text-xs text-slate-900">
                          {seg.segmentElapsedHours.toFixed(1)}h
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-slate-600">
                          {seg.segmentSlaBudgetHours}h
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded capitalize ${seg.segmentOutcome === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : seg.segmentOutcome === 'breached_before_transfer'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                        >
                          {seg.segmentOutcome.replace(/_/g, ' ')}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
