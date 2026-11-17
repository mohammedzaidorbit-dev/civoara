import { IncidentPriority } from '@/types';

export const SLA_HOURS_BY_PRIORITY: Record<IncidentPriority, number> = {
  critical: 4,
  high: 12,
  medium: 24,
  low: 72,
};

export function calculateSLADeadline(priority: IncidentPriority, fromDate: Date = new Date()): Date {
  const hours = SLA_HOURS_BY_PRIORITY[priority] || SLA_HOURS_BY_PRIORITY.medium;
  const deadline = new Date(fromDate.getTime());
  deadline.setHours(deadline.getHours() + hours);
  return deadline;
}

export function isSLABreached(deadline: Date): boolean {
  return new Date() > deadline;
}
