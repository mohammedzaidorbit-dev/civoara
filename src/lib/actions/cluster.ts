'use server';

import { ClusteringService, ClusterDetailRecord } from '@/services/clustering.service';

export async function getActiveClustersAction(): Promise<ClusterDetailRecord[]> {
  try {
    return await ClusteringService.getActiveClusters();
  } catch (error) {
    console.error('getActiveClustersAction error:', error);
    return [];
  }
}

export async function splitClusterReportAction(
  reportId: string,
  clusterId: string,
  adminActorId?: string
): Promise<{ success: boolean; newTicketNumber: string; message: string }> {
  try {
    const result = await ClusteringService.splitClusterReport(reportId, clusterId, adminActorId);
    return {
      success: result.success,
      newTicketNumber: result.newTicketNumber,
      message: result.message,
    };
  } catch (error) {
    console.error('splitClusterReportAction error:', error);
    return {
      success: false,
      newTicketNumber: '',
      message: 'Failed to unmerge report.',
    };
  }
}
