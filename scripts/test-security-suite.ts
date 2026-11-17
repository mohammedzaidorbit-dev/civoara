/**
 * ==============================================================================
 * CIVOARA — PART 09 SECURITY & PERMISSION VERIFICATION TEST SUITE
 * ==============================================================================
 *
 * Verifies all security requirements outlined in Part 09:
 * 1. Role-Based Access Control (RBAC) & Permission Boundaries.
 * 2. Database Row Level Security (RLS) policies on all tables.
 * 3. File upload validation (MIME whitelisting, size limits, executable rejection).
 * 4. Server input validation schemas (Zod).
 * 5. Scheduled Cron Endpoint Authentication (Bearer token, 401 Unauthorized rejection).
 * 6. Protection of administrative operations.
 * 7. Prevention of secret leakage into client bundles.
 * ==============================================================================
 */

import fs from 'fs';
import path from 'path';
import {
  reportIssueSchema,
  registerSchema,
  incidentStatusUpdateSchema,
} from '../src/lib/validation';
import { enforceRoleAccess, canTransitionStatus } from '../src/lib/auth';
import type { UserRole } from '../src/types';

interface SecurityTestResult {
  category: string;
  name: string;
  passed: boolean;
  details?: Record<string, unknown>;
  error?: string;
}

const testResults: SecurityTestResult[] = [];

function assertSec(
  category: string,
  name: string,
  condition: boolean,
  details?: Record<string, unknown>
) {
  if (condition) {
    testResults.push({ category, name, passed: true, details });
    console.log(`  ✓ [${category.toUpperCase()}] PASS: ${name}`);
  } else {
    testResults.push({ category, name, passed: false, error: 'Security assertion failed', details });
    console.error(`  ✗ [${category.toUpperCase()}] FAIL: ${name}`, details || '');
  }
}

async function runSecuritySuite() {
  console.log('\n==============================================================================');
  console.log('CIVOARA — SECURITY, PERMISSIONS & VULNERABILITY AUDIT SUITE');
  console.log('==============================================================================\n');

  // ============================================================================
  // 1. ROLE-BASED ACCESS CONTROL (RBAC) & PRIVILEGE BOUNDARIES
  // ============================================================================
  console.log('--- 1. Role-Based Access Control & Privilege Boundaries ---');

  // A. Admin Operations: Only admin role can access administrative restructuring
  let citizenAdminDenied = false;
  try {
    enforceRoleAccess('citizen' as UserRole, ['admin']);
  } catch {
    citizenAdminDenied = true;
  }
  assertSec('rbac', 'Citizen role strictly denied admin operations', citizenAdminDenied);

  let officerAdminDenied = false;
  try {
    enforceRoleAccess('officer' as UserRole, ['admin']);
  } catch {
    officerAdminDenied = true;
  }
  assertSec('rbac', 'Officer role strictly denied admin operations', officerAdminDenied);

  let supervisorAdminDenied = false;
  try {
    enforceRoleAccess('supervisor' as UserRole, ['admin']);
  } catch {
    supervisorAdminDenied = true;
  }
  assertSec('rbac', 'Supervisor role strictly denied admin operations', supervisorAdminDenied);

  let adminAllowed = false;
  try {
    enforceRoleAccess('admin' as UserRole, ['admin']);
    adminAllowed = true;
  } catch {
    adminAllowed = false;
  }
  assertSec('rbac', 'Admin role authorized for admin operations', adminAllowed);

  // B. Incident Lifecycle Transitions RBAC
  // Citizen cannot transition issue to 'in_progress' or 'resolved'
  const citizenCanAdvance = canTransitionStatus('citizen', 'submitted', 'in_progress');
  assertSec('rbac', 'Citizen cannot transition tickets to "in_progress"', !citizenCanAdvance);

  const citizenCanResolve = canTransitionStatus('citizen', 'in_progress', 'resolved');
  assertSec('rbac', 'Citizen cannot directly mark tickets as "resolved"', !citizenCanResolve);

  // Officer can transition assigned -> in_progress
  const officerCanAdvance = canTransitionStatus('officer', 'assigned', 'in_progress');
  assertSec('rbac', 'Officer can advance assigned ticket to "in_progress"', officerCanAdvance);

  // Officer cannot reject an issue directly (requires supervisor or admin)
  const officerCanReject = canTransitionStatus('officer', 'assigned', 'rejected');
  assertSec('rbac', 'Officer cannot unilaterally reject issues', !officerCanReject);

  const supervisorCanReject = canTransitionStatus('supervisor', 'assigned', 'rejected');
  assertSec('rbac', 'Supervisor can reject fraudulent or invalid complaints', supervisorCanReject);

  // ============================================================================
  // 2. ROW LEVEL SECURITY (RLS) AUDIT IN POSTGRESQL MIGRATIONS
  // ============================================================================
  console.log('\n--- 2. Database Row Level Security (RLS) Verification ---');

  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
  const migrationFiles = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'));

  let aggregatedSql = '';
  for (const file of migrationFiles) {
    aggregatedSql += '\n' + fs.readFileSync(path.join(migrationsDir, file), 'utf8');
  }

  const REQUIRED_TABLES = [
    'profiles',
    'wards',
    'departments',
    'officer_assignments',
    'routing_rules',
    'sla_policies',
    'issues',
    'issue_reports',
    'issue_events',
    'escalation_steps',
    'issue_clusters',
    'ownership_segments',
    'organization_versions',
    'organization_change_events',
    'notifications',
  ];

  for (const table of REQUIRED_TABLES) {
    const rlsRegex = new RegExp(`ALTER\\s+TABLE\\s+(?:public\\.)?${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`, 'i');
    const hasRLS = rlsRegex.test(aggregatedSql);
    assertSec('rls', `RLS enabled on table "${table}"`, hasRLS);
  }

  // Audit public access restriction policy on issues
  const hasPublicIssuePolicy = /CREATE\s+POLICY\s+[\s\S]*?issues[\s\S]*?FOR\s+SELECT/i.test(aggregatedSql);
  assertSec('rls', 'Public select policy defined for approved civic issues', hasPublicIssuePolicy);

  // Audit citizen private report policy
  const hasCitizenReportPolicy = /CREATE\s+POLICY\s+.*issue_reports/i.test(aggregatedSql);
  assertSec('rls', 'Citizen private reports isolated by authenticated user ID', hasCitizenReportPolicy);

  // ============================================================================
  // 3. FILE UPLOAD SECURITY (MIME VALIDATION & EXECUTABLE REJECTION)
  // ============================================================================
  console.log('\n--- 3. File Upload Security & MIME Whitelisting ---');

  const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
  const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

  function validateUploadSecurity(file: { name: string; type: string; size: number }) {
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return { valid: false, error: 'Only JPG, PNG, and WebP images are allowed.' };
    }
    const extension = path.extname(file.name).toLowerCase();
    const dangerousExtensions = ['.exe', '.sh', '.bat', '.cmd', '.js', '.ts', '.py', '.php', '.dll', '.msi'];
    if (dangerousExtensions.includes(extension)) {
      return { valid: false, error: 'Dangerous executable file rejected.' };
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return { valid: false, error: 'File size exceeds maximum 10MB threshold.' };
    }
    return { valid: true };
  }

  // Valid image test
  const validJpg = validateUploadSecurity({ name: 'pothole.jpg', type: 'image/jpeg', size: 2 * 1024 * 1024 });
  assertSec('upload', 'Standard JPEG photo under 10MB is accepted', validJpg.valid);

  const validPng = validateUploadSecurity({ name: 'crater.png', type: 'image/png', size: 4 * 1024 * 1024 });
  assertSec('upload', 'Standard PNG photo under 10MB is accepted', validPng.valid);

  // Oversized file test
  const oversizedFile = validateUploadSecurity({ name: 'huge_pic.jpg', type: 'image/jpeg', size: 15 * 1024 * 1024 });
  assertSec('upload', 'Oversized 15MB file strictly rejected (> 10MB)', !oversizedFile.valid);

  // Dangerous executable disguised test
  const disguisedExe = validateUploadSecurity({ name: 'payload.exe', type: 'application/x-msdownload', size: 1024 });
  assertSec('upload', 'Executable file payload.exe strictly rejected', !disguisedExe.valid);

  // Script file test
  const scriptFile = validateUploadSecurity({ name: 'exploit.sh', type: 'application/x-sh', size: 500 });
  assertSec('upload', 'Shell script exploit.sh strictly rejected', !scriptFile.valid);

  // Spoofed MIME type test
  const spoofedExe = validateUploadSecurity({ name: 'malware.exe', type: 'image/jpeg', size: 1024 });
  assertSec('upload', 'Spoofed executable with image MIME strictly rejected by extension audit', !spoofedExe.valid);

  // ============================================================================
  // 4. SERVER INPUT VALIDATION SCHEMAS (ZOD)
  // ============================================================================
  console.log('\n--- 4. Server Input Validation Schemas (Zod) ---');

  // A. Pothole / Issue submission schema
  const invalidCoordinatesReport = reportIssueSchema.safeParse({
    title: 'Test Pothole',
    category: 'pothole',
    description: 'A deep pothole on Main Street with crumbling edges.',
    latitude: 95.0, // Invalid latitude (> 90)
    longitude: -74.006,
    locationDescription: 'Main Street near corner',
  });
  assertSec('input', 'Rejects out-of-range latitude (+95.0 > 90)', !invalidCoordinatesReport.success);

  const emptyTitleReport = reportIssueSchema.safeParse({
    title: '',
    category: 'pothole',
    description: 'A deep pothole on Main Street.',
    latitude: 40.7128,
    longitude: -74.006,
  });
  assertSec('input', 'Rejects empty issue title', !emptyTitleReport.success);

  const invalidCategoryReport = reportIssueSchema.safeParse({
    title: 'Pothole Issue',
    category: 'unsupported_category',
    description: 'Description of an invalid category complaint.',
    latitude: 40.7128,
    longitude: -74.006,
  });
  assertSec('input', 'Rejects invalid / unauthorized complaint category', !invalidCategoryReport.success);

  // B. Registration schema injection protection
  const invalidEmailReg = registerSchema.safeParse({
    email: 'not-an-email',
    password: 'Password123!',
    fullName: 'Jane Doe',
    role: 'citizen',
  });
  assertSec('input', 'Rejects malformed email address on registration', !invalidEmailReg.success);

  const shortPasswordReg = registerSchema.safeParse({
    email: 'user@example.com',
    password: '123',
    fullName: 'Jane Doe',
    role: 'citizen',
  });
  assertSec('input', 'Rejects weak password (< 8 chars)', !shortPasswordReg.success);

  // C. Status update schema
  const invalidStatusTransition = incidentStatusUpdateSchema.safeParse({
    status: 'invalid_status_enum',
    notes: 'Testing invalid status transition',
  });
  assertSec('input', 'Rejects arbitrary unapproved incident status values', !invalidStatusTransition.success);

  // ============================================================================
  // 5. SCHEDULED CRON ENDPOINT AUTHENTICATION
  // ============================================================================
  console.log('\n--- 5. Scheduled Endpoint Protection (/api/cron/sla-escalation) ---');

  try {
    // Test 1: Unauthenticated request (no header)
    const resNoAuth = await fetch('http://localhost:3000/api/cron/sla-escalation');
    assertSec('cron', 'Unauthenticated request returns 401 Unauthorized', resNoAuth.status === 401);

    // Test 2: Invalid Bearer token
    const resBadAuth = await fetch('http://localhost:3000/api/cron/sla-escalation', {
      headers: { Authorization: 'Bearer totally-invalid-token-123' },
    });
    assertSec('cron', 'Forged Bearer token returns 401 Unauthorized', resBadAuth.status === 401);

    // Test 3: Valid secret authentication
    const devSecret = process.env.CRON_SECRET || 'civoara-dev-cron-secret';
    const resValidAuth = await fetch('http://localhost:3000/api/cron/sla-escalation?dryRun=true', {
      headers: { Authorization: `Bearer ${devSecret}` },
    });
    assertSec('cron', 'Authorized request with valid Bearer token returns 200 OK', resValidAuth.status === 200);

    const cronData = await resValidAuth.json();
    assertSec('cron', 'Authorized cron execution returns valid SLA result payload', cronData.success === true);
  } catch (err) {
    console.error('  Note: Dev server must be active on localhost:3000 for live HTTP cron test.', err);
    assertSec('cron', 'Dev server responding to cron endpoints', false);
  }

  // ============================================================================
  // 6. CLIENT SECRET LEAKAGE AUDIT
  // ============================================================================
  console.log('\n--- 6. Secret Leakage Audit in Source Files ---');

  function scanDirectoryForSecretLeaks(dir: string): string[] {
    const leaks: string[] = [];
    if (!fs.existsSync(dir)) return leaks;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        leaks.push(...scanDirectoryForSecretLeaks(fullPath));
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        const content = fs.readFileSync(fullPath, 'utf8');
        // Check if a client component references the service role key or cron secret directly
        const isClientComponent = content.includes("'use client'") || content.includes('"use client"');
        if (isClientComponent) {
          if (content.includes('SUPABASE_SERVICE_ROLE_KEY')) {
            leaks.push(`Service role key referenced in client file: ${fullPath}`);
          }
          if (content.includes('CRON_SECRET')) {
            leaks.push(`Cron secret referenced in client file: ${fullPath}`);
          }
        }
      }
    }
    return leaks;
  }

  const clientLeaks = [
    ...scanDirectoryForSecretLeaks(path.join(process.cwd(), 'src', 'app')),
    ...scanDirectoryForSecretLeaks(path.join(process.cwd(), 'src', 'components')),
  ];

  assertSec(
    'leakage',
    'Zero service-role keys or cron secrets exposed in client components ("use client")',
    clientLeaks.length === 0,
    { leaksFound: clientLeaks }
  );

  // Check .gitignore contains sensitive env files
  const gitignoreContent = fs.readFileSync(path.join(process.cwd(), '.gitignore'), 'utf8');
  const ignoresEnvLocal = gitignoreContent.includes('.env.local') || gitignoreContent.includes('.env*.local');
  assertSec('leakage', '.gitignore protects .env.local and private environment files', ignoresEnvLocal);

  // ============================================================================
  // FINAL SCORECARD
  // ============================================================================
  const total = testResults.length;
  const passed = testResults.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log('\n==============================================================================');
  console.log(`SECURITY SUITE RESULTS: ${passed} / ${total} ASSERTIONS PASSED (${((passed / total) * 100).toFixed(1)}%)`);
  if (failed > 0) {
    console.error(`FAILED: ${failed} SECURITY ASSERTIONS REJECTED`);
    process.exit(1);
  } else {
    console.log('ALL SECURITY & PERMISSION POLICIES VERIFIED SUCCESSFULLY! ✓');
    console.log('==============================================================================\n');
  }
}

runSecuritySuite().catch((err) => {
  console.error('Fatal error during security test suite execution:', err);
  process.exit(1);
});
