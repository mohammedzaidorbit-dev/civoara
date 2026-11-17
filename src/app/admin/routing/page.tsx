'use client';

import React, { useState } from 'react';
import {
  PlusCircle,
  Search,
  AlertTriangle,
  Trash2,
  History,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import {
  DEFAULT_CONFIGURED_RULES,
  ConfigurableRoutingRule,
  routingRuleSchema,
} from '@/services/routing.service';
import { CONFIGURED_MUNICIPAL_WARDS } from '@/services/ward.service';

export interface AssignmentHistoryItem {
  id: string;
  ticketNumber: string;
  category: string;
  wardName: string;
  matchType: 'exact_match' | 'fallback_match' | 'default_admin_queue' | 'rejected_ambiguous';
  ruleName: string;
  departmentName: string;
  officerName: string;
  slaHours: number;
  timestamp: string;
}

export default function AdminRoutingRulesPage() {
  const { success: toastSuccess, info: toastInfo } = useToast();

  const [rules, setRules] = useState<ConfigurableRoutingRule[]>(DEFAULT_CONFIGURED_RULES);
  const [history] = useState<AssignmentHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'rules' | 'history'>('rules');
  const [search, setSearch] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [category, setCategory] = useState('pothole');
  const [wardId, setWardId] = useState<string>('citywide');
  const [departmentId, setDepartmentId] = useState('20000000-0000-0000-0000-000000000001');
  const [officerName, setOfficerName] = useState('');
  const [slaHours, setSlaHours] = useState('24');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Check for Ambiguous Rule Configurations
  // (Two active rules sharing identical category and ward)
  const conflicts: Array<{ category: string; ward: string; ruleNames: string[] }> = [];
  const ruleKeyMap = new Map<string, string[]>();

  rules
    .filter((r) => r.isActive)
    .forEach((r) => {
      const key = `${r.category.toLowerCase()}:${r.wardId || 'citywide'}`;
      if (!ruleKeyMap.has(key)) {
        ruleKeyMap.set(key, [r.name]);
      } else {
        ruleKeyMap.get(key)!.push(r.name);
      }
    });

  ruleKeyMap.forEach((ruleNames, key) => {
    if (ruleNames.length > 1) {
      const [cat, w] = key.split(':');
      conflicts.push({ category: cat, ward: w, ruleNames });
    }
  });

  const handleToggleActive = (ruleId: string) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.id === ruleId) {
          const nextState = !r.isActive;
          toastInfo(
            'Rule Status Updated',
            `Rule "${r.name}" is now ${nextState ? 'ACTIVE' : 'INACTIVE'}.`
          );
          return { ...r, isActive: nextState };
        }
        return r;
      })
    );
  };

  const handleDeleteRule = (ruleId: string) => {
    setRules((prev) => prev.filter((r) => r.id !== ruleId));
    toastSuccess('Rule Deleted', 'Routing rule successfully removed.');
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const targetWardId = wardId === 'citywide' ? null : wardId;
    const targetWardName =
      targetWardId === null
        ? 'Citywide (All Wards)'
        : CONFIGURED_MUNICIPAL_WARDS.find((w) => w.id === targetWardId)?.name || 'Custom Ward';

    const deptMap: Record<string, string> = {
      '20000000-0000-0000-0000-000000000001': 'Roads & Highways Maintenance',
      '20000000-0000-0000-0000-000000000002': 'Water & Sewerage Board',
      '20000000-0000-0000-0000-000000000003': 'Waste Management & Sanitation',
      '20000000-0000-0000-0000-000000000004': 'Electrical & Street Lighting',
      '20000000-0000-0000-0000-000000000005': 'Traffic Engineering Division',
    };

    const targetDeptName = deptMap[departmentId] || 'Municipal Operations';

    // Validate using Zod
    const validation = routingRuleSchema.safeParse({
      name: ruleName.trim(),
      category,
      wardId: targetWardId,
      departmentId,
      slaHours: Number(slaHours),
      isActive,
    });

    if (!validation.success) {
      setFormError(validation.error.errors[0]?.message || 'Invalid rule input');
      return;
    }

    const newRule: ConfigurableRoutingRule = {
      id: `rule-${Date.now()}`,
      name: ruleName.trim(),
      category,
      wardId: targetWardId,
      wardName: targetWardName,
      departmentId,
      departmentName: targetDeptName,
      responsibleOfficerId: officerName.trim() ? `off-${Date.now()}` : null,
      responsibleOfficerName: officerName.trim() || null,
      slaHours: Number(slaHours),
      priorityOverride: Number(slaHours) <= 12 ? 'critical' : Number(slaHours) <= 24 ? 'high' : 'medium',
      isActive,
      effectiveFrom: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    setRules((prev) => [newRule, ...prev]);
    toastSuccess('Rule Configured', `New automated routing directive "${newRule.name}" created.`);
    setModalOpen(false);

    // Reset Form
    setRuleName('');
    setOfficerName('');
    setSlaHours('24');
  };

  const filteredRules = rules.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q) ||
      r.departmentName.toLowerCase().includes(q) ||
      (r.wardName && r.wardName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Automated Routing Engine &amp; Rules
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-800 px-2 py-0.5 rounded-full border border-sky-200">
              SLA Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure municipal dispatch directives. Hierarchy prioritizes Exact Ward rules, followed by Citywide Category fallbacks, and the Central Administrative Queue.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="primary"
            size="md"
            leftIcon={<PlusCircle className="w-4 h-4" />}
            onClick={() => setModalOpen(true)}
          >
            Create Routing Rule
          </Button>
        </div>
      </div>

      {/* Ambiguous Configuration Warning Alert (If Any) */}
      {conflicts.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-950">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Ambiguous Configuration Conflict Detected ({conflicts.length})</span>
          </div>
          <p className="text-amber-800 leading-relaxed">
            Safety protocol: If multiple equally valid active rules exist for the same Category and Ward, the engine will refuse random assignment and route incidents to the Administrative Review Queue.
          </p>
          <ul className="list-disc pl-5 space-y-0.5 font-mono text-[11px]">
            {conflicts.map((c, i) => (
              <li key={i}>
                Category: <strong>{c.category}</strong> | Ward: <strong>{c.ward}</strong> &rarr; Conflicting: {c.ruleNames.join(' vs ')}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tabs: Active Rules vs Assignment History */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`pb-3 text-xs font-bold transition-colors cursor-pointer border-b-2 ${
              activeTab === 'rules'
                ? 'border-sky-700 text-sky-800'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Active Directives ({rules.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`pb-3 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-sky-700 text-sky-800'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Assignment History Log</span>
          </button>
        </div>

        <span className="text-xs text-slate-400 font-mono hidden sm:inline">
          Rule Hierarchy: Exact Ward &gt; Fallback &gt; Admin Queue
        </span>
      </div>

      {/* Search Bar */}
      {activeTab === 'rules' && (
        <div className="flex items-center gap-3">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Search routing rules by name, department, category..."
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* TAB 1: Configured Routing Rules Table */}
      {activeTab === 'rules' && (
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule Directive</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Ward Scope</TableHead>
                  <TableHead>Target Department</TableHead>
                  <TableHead>Assigned Officer</TableHead>
                  <TableHead>SLA Target</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRules.map((rule) => (
                  <TableRow key={rule.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell>
                      <div className="font-bold text-slate-900 text-xs">
                        {rule.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        ID: {rule.id}
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-800 capitalize">
                        {rule.category.replace('_', ' ')}
                      </span>
                    </TableCell>

                    <TableCell>
                      {rule.wardId ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          Priority 1: {rule.wardName}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          Priority 2: Citywide Fallback
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-xs font-semibold text-slate-800">
                      {rule.departmentName}
                    </TableCell>

                    <TableCell className="text-xs text-slate-600">
                      {rule.responsibleOfficerName || (
                        <span className="text-slate-400">Department Pool (Unassigned)</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <span className="text-xs font-mono font-bold text-slate-900">
                        {rule.slaHours}h SLA
                      </span>
                    </TableCell>

                    <TableCell>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(rule.id)}
                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
                          rule.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {rule.isActive ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            <span>Inactive</span>
                          </>
                        )}
                      </button>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Delete Rule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* TAB 2: Immutable Assignment History Audit Trail */}
      {activeTab === 'history' && (
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardHeader className="border-b border-slate-100 pb-3">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-sky-700" />
              <span>Immutable Routing Assignment Event Log</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Audit log generated for every automated dispatch, SLA commitment, and review queue escalation.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {history.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 space-y-1">
                <p className="font-bold text-slate-900 text-sm">Assignment Event Log Clear</p>
                <p>No automated routing assignments have been executed yet.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket Ref</TableHead>
                    <TableHead>Category &amp; Ward</TableHead>
                    <TableHead>Match Type</TableHead>
                    <TableHead>Rule Directive</TableHead>
                    <TableHead>Department &amp; Officer</TableHead>
                    <TableHead>SLA Target</TableHead>
                    <TableHead className="text-right">Logged At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((h) => (
                    <TableRow key={h.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="font-mono text-xs font-bold text-slate-900">
                        {h.ticketNumber}
                      </TableCell>

                      <TableCell>
                        <div className="text-xs font-semibold text-slate-800 capitalize">
                          {h.category.replace('_', ' ')}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {h.wardName}
                        </div>
                      </TableCell>

                      <TableCell>
                        {h.matchType === 'exact_match' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                            Exact Ward Match (P1)
                          </span>
                        )}
                        {h.matchType === 'fallback_match' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                            Citywide Fallback (P2)
                          </span>
                        )}
                        {h.matchType === 'default_admin_queue' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                            Admin Review Queue (P3)
                          </span>
                        )}
                        {h.matchType === 'rejected_ambiguous' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-300">
                            Ambiguous Conflict
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-xs text-slate-700 max-w-xs truncate">
                        {h.ruleName}
                      </TableCell>

                      <TableCell>
                        <div className="text-xs font-semibold text-slate-900">
                          {h.departmentName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {h.officerName}
                        </div>
                      </TableCell>

                      <TableCell className="text-xs font-mono font-bold text-slate-900">
                        {h.slaHours}h
                      </TableCell>

                      <TableCell className="text-right text-xs text-slate-500 font-mono">
                        {h.timestamp}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Routing Rule Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Automated Routing Directive"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateRule} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <Input
            label="Rule Name"
            required
            value={ruleName}
            onChange={(e) => setRuleName(e.target.value)}
            placeholder="e.g. Ward 4 High-Turnaround Streetlight Replacement"
            helperText="Clear identifier explaining category and territorial scope."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <Select
              label="Incident Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={[
                { value: 'pothole', label: 'Pothole (Roads)' },
                { value: 'garbage', label: 'Garbage (Sanitation)' },
                { value: 'broken_streetlight', label: 'Broken streetlight (Electrical)' },
                { value: 'water_leakage', label: 'Water leakage (Water & Sewerage)' },
                { value: 'other', label: 'Other Hazards' },
              ]}
            />

            <Select
              label="Ward Scope"
              value={wardId}
              onChange={(e) => setWardId(e.target.value)}
              options={[
                { value: 'citywide', label: 'Citywide Fallback (All Wards)' },
                { value: '10000000-0000-0000-0000-000000000001', label: 'Ward 1 - Central Downtown' },
                { value: '10000000-0000-0000-0000-000000000002', label: 'Ward 2 - North Oakridge' },
                { value: '10000000-0000-0000-0000-000000000003', label: 'Ward 3 - East Riverfront' },
                { value: '10000000-0000-0000-0000-000000000004', label: 'Ward 4 - West Pine Valley' },
                { value: '10000000-0000-0000-0000-000000000005', label: 'Ward 5 - South Industrial' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <Select
              label="Target Department"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              options={[
                { value: '20000000-0000-0000-0000-000000000001', label: 'Roads & Highways Maintenance' },
                { value: '20000000-0000-0000-0000-000000000002', label: 'Water & Sewerage Board' },
                { value: '20000000-0000-0000-0000-000000000003', label: 'Waste Management & Sanitation' },
                { value: '20000000-0000-0000-0000-000000000004', label: 'Electrical & Street Lighting' },
                { value: '20000000-0000-0000-0000-000000000005', label: 'Traffic Engineering Division' },
              ]}
            />

            <Input
              label="SLA Target (Hours)"
              type="number"
              min="1"
              max="720"
              required
              value={slaHours}
              onChange={(e) => setSlaHours(e.target.value)}
              placeholder="e.g. 24"
            />
          </div>

          <Input
            label="Assigned Officer (Optional)"
            value={officerName}
            onChange={(e) => setOfficerName(e.target.value)}
            placeholder="e.g. Officer Marcus Vance (Badge #PW-301)"
            helperText="Leave empty to route directly to department shift pool."
          />

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer text-xs select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-semibold text-slate-800">
                Rule Active upon Creation
              </span>
            </label>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save Directive
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
