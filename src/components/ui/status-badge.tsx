import React from 'react';
import { IncidentStatus, IncidentPriority } from '@/types';
import { Clock, AlertTriangle, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';

export interface StatusBadgeProps {
  status: IncidentStatus | string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const configs: Record<
    string,
    { label: string; bg: string; text: string; border: string; dot: string; icon?: React.ReactNode }
  > = {
    submitted: {
      label: 'Submitted',
      bg: 'bg-slate-100',
      text: 'text-slate-800',
      border: 'border-slate-200',
      dot: 'bg-slate-500',
    },
    triaged: {
      label: 'Triaged',
      bg: 'bg-sky-50',
      text: 'text-sky-700',
      border: 'border-sky-200',
      dot: 'bg-sky-500',
    },
    assigned: {
      label: 'Assigned',
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-200',
      dot: 'bg-indigo-500',
      icon: <Clock className="w-3 h-3 text-indigo-600" />,
    },
    in_progress: {
      label: 'In Progress',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      dot: 'bg-amber-500 animate-pulse',
      icon: <Clock className="w-3 h-3 text-amber-600" />,
    },
    resolved: {
      label: 'Resolved',
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
      icon: <CheckCircle2 className="w-3 h-3 text-emerald-600" />,
    },
    rejected: {
      label: 'Rejected',
      bg: 'bg-rose-50',
      text: 'text-rose-800',
      border: 'border-rose-200',
      dot: 'bg-rose-500',
      icon: <XCircle className="w-3 h-3 text-rose-600" />,
    },
  };

  const normalized = status.toLowerCase();
  const config = configs[normalized] || {
    label: status,
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  };

  const sizeClasses =
    size === 'sm'
      ? 'text-[11px] px-2 py-0.5 gap-1.5'
      : 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      {config.icon ? (
        config.icon
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      )}
      {config.label}
    </span>
  );
}

export interface PriorityBadgeProps {
  priority: IncidentPriority | string;
  size?: 'sm' | 'md';
}

export function PriorityBadge({ priority, size = 'md' }: PriorityBadgeProps) {
  const configs: Record<
    string,
    { label: string; bg: string; text: string; border: string; icon?: React.ReactNode }
  > = {
    low: {
      label: 'Low',
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
    },
    medium: {
      label: 'Medium',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
    },
    high: {
      label: 'High',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      icon: <AlertTriangle className="w-3 h-3 text-amber-600" />,
    },
    critical: {
      label: 'Critical',
      bg: 'bg-rose-50',
      text: 'text-rose-800',
      border: 'border-rose-200',
      icon: <AlertTriangle className="w-3 h-3 text-rose-600 animate-pulse" />,
    },
  };

  const normalized = priority.toLowerCase();
  const config = configs[normalized] || {
    label: priority,
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
  };

  const sizeClasses =
    size === 'sm'
      ? 'text-[11px] px-2 py-0.5 gap-1.5'
      : 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

export function SLABadge({
  status,
  hoursRemaining,
  text,
}: {
  status: 'on_track' | 'warning' | 'at_risk' | 'breached' | 'escalated' | 'resolved' | 'paused';
  hoursRemaining?: number;
  text?: string;
}) {
  if (status === 'paused') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
        <Clock className="w-3.5 h-3.5 text-slate-500" />
        {text || 'SLA Paused'}
      </span>
    );
  }
  if (status === 'escalated') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-900 border border-purple-300">
        <AlertTriangle className="w-3.5 h-3.5 text-purple-600" />
        {text || 'Escalated'}
      </span>
    );
  }

  if (status === 'breached') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
        {text || 'SLA Breached'}
      </span>
    );
  }

  if (status === 'at_risk' || status === 'warning') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
        <Clock className="w-3.5 h-3.5 text-amber-600" />
        {text || `Warning (${hoursRemaining ?? 0}h left)`}
      </span>
    );
  }

  if (status === 'resolved') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
        <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
        {text || 'Resolved'}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
      {text || `On Track (${hoursRemaining ?? 0}h left)`}
    </span>
  );
}
