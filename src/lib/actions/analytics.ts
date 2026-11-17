'use server';

import {
  AnalyticsService,
  PublicPerformanceDataset,
} from '@/services/analytics.service';
import {
  AnalyticsPeriod,
  PublicSanitizedIncident,
} from '@/types';

/**
 * Server Action: Retrieve public performance dataset
 */
export async function getPublicPerformanceDataAction(
  period: AnalyticsPeriod = '30d',
  wardId?: string,
  category?: string
): Promise<PublicPerformanceDataset> {
  try {
    return await AnalyticsService.getPublicPerformanceData(period, wardId, category);
  } catch (error) {
    console.error('getPublicPerformanceDataAction error:', error);
    return AnalyticsService.generateSimulatedDataset(period, wardId, category);
  }
}

/**
 * Server Action: Retrieve sanitized public incident timeline
 */
export async function getPublicIncidentDetailsAction(
  ticketNumber: string
): Promise<PublicSanitizedIncident | null> {
  try {
    return await AnalyticsService.getPublicIncidentDetails(ticketNumber);
  } catch (error) {
    console.error('getPublicIncidentDetailsAction error:', error);
    return AnalyticsService.getSimulatedPublicIncident(ticketNumber);
  }
}
