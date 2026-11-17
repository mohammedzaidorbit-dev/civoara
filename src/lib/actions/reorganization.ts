'use server';

import {
  ReorganizationService,
  RestructuringRequest,
  RestructuringPreview,
  RestructuringExecutionResult,
  ReorgTestIssue,
} from '@/services/reorganization.service';
import { OrganizationVersion, OwnershipSegment } from '@/types';

export async function previewRestructuringAction(
  request: RestructuringRequest
): Promise<RestructuringPreview> {
  return await ReorganizationService.previewRestructuring(request);
}

export async function executeRestructuringAction(
  request: RestructuringRequest,
  approvedByUserId?: string
): Promise<RestructuringExecutionResult> {
  return await ReorganizationService.executeRestructuring(request, approvedByUserId);
}

export async function getOrganizationVersionsAction(): Promise<OrganizationVersion[]> {
  return await ReorganizationService.getOrganizationVersions();
}

export async function getIssueOwnershipHistoryAction(
  issueId: string
): Promise<OwnershipSegment[]> {
  return await ReorganizationService.getIssueOwnershipSegments(issueId);
}

export async function getReorganizationIssuesAction(): Promise<ReorgTestIssue[]> {
  return await ReorganizationService.getActiveIssues();
}
