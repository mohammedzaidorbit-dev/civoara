import { NextRequest, NextResponse } from 'next/server';
import { processSLAEscalations } from '@/services/sla.service';

/**
 * ============================================================================
 * SECURE CRON ENDPOINT: /api/cron/sla-escalation
 * ============================================================================
 *
 * Invoked on a recurring schedule (e.g., every 5 minutes by Vercel Cron,
 * Supabase pg_cron, or an external scheduled worker).
 *
 * Security Requirements:
 * - Requires Authorization: Bearer <CRON_SECRET> OR header x-cron-key: <CRON_SECRET>
 * - Rejects unauthorized requests with 401 Unauthorized
 * - Idempotent and retry-safe: duplicate invocations cause 0 duplicate events
 */

function isAuthorized(request: NextRequest): boolean {
  const configuredSecret = process.env.CRON_SECRET;

  // Development fallback secret for testing environments
  const effectiveSecret =
    configuredSecret || (process.env.NODE_ENV !== 'production' ? 'civoara-dev-cron-secret' : null);

  if (!effectiveSecret) {
    console.warn('[Cron Auth] CRON_SECRET is not configured in production environment.');
    return false;
  }

  // Check Authorization header: Bearer <secret>
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token === effectiveSecret) return true;
  }

  // Check alternative header: x-cron-key
  const cronKey = request.headers.get('x-cron-key');
  if (cronKey && cronKey.trim() === effectiveSecret) {
    return true;
  }

  // Dev query param allowed strictly in non-production
  if (process.env.NODE_ENV !== 'production') {
    const urlKey = request.nextUrl.searchParams.get('key');
    if (urlKey === effectiveSecret) return true;
  }

  return false;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        error: 'Unauthorized',
        message: 'Invalid or missing cron authentication credentials.',
      },
      { status: 401 }
    );
  }

  try {
    const dryRun = request.nextUrl.searchParams.get('dryRun') === 'true';
    const result = await processSLAEscalations({ dryRun });

    return NextResponse.json({
      success: true,
      dryRun,
      ...result,
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Internal SLA escalation processing error';
    console.error('[SLA Cron Route Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: errMessage,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
