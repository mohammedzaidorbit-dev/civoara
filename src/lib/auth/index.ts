import { UserRole, UserProfile } from '@/types';
import { createClient } from '@/lib/supabase/server';

export function hasRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}

/**
 * Synchronous role guard asserting that a given role is within allowed roles.
 */
export function enforceRoleAccess(role: UserRole, allowedRoles: UserRole[]): void {
  if (!hasRole(role, allowedRoles)) {
    throw new Error(`Forbidden: Role '${role}' is not authorized. Required: ${allowedRoles.join(', ')}`);
  }
}

export function isCitizen(role: UserRole): boolean {
  return role === 'citizen';
}

export function isOfficer(role: UserRole): boolean {
  return role === 'officer';
}

export function isSupervisor(role: UserRole): boolean {
  return role === 'supervisor';
}

export function isCommissioner(role: UserRole): boolean {
  return role === 'commissioner';
}

export function isAdmin(role: UserRole): boolean {
  return role === 'admin';
}

/**
 * Server-side session verification.
 * Fetches the currently authenticated user from Supabase Auth.
 */
export async function getCurrentUser() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

/**
 * Server-side profile and role retrieval.
 * CRITICAL SECURITY PRINCIPLE:
 * Never trust role information supplied by a client or raw browser JWT claims.
 * We fetch the role directly from the server-side public.profiles table.
 */
export async function getCurrentProfile(): Promise<UserProfile | null> {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const supabase = await createClient();
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      // Fallback profile object for authenticated user whose profile record is pending trigger
      return {
        id: user.id,
        email: user.email || '',
        fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        role: 'citizen',
        isActive: true,
        createdAt: user.created_at,
        updatedAt: user.created_at,
      };
    }

    return {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      role: profile.role as UserRole,
      phone: profile.phone,
      departmentId: profile.department_id,
      wardId: profile.ward_id,
      isActive: profile.is_active,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    };
  } catch {
    return null;
  }
}

/**
 * Server-side role guard assertion.
 */
export async function assertAuthorizedRole(allowedRoles: UserRole[]): Promise<UserProfile> {
  const profile = await getCurrentProfile();
  if (!profile) {
    throw new Error('UNAUTHORIZED: Authentication session required.');
  }

  if (!hasRole(profile.role, allowedRoles)) {
    throw new Error(
      `FORBIDDEN: Role '${profile.role}' is not authorized. Required: ${allowedRoles.join(', ')}`
    );
  }

  return profile;
}

/**
 * Authorization matrix for incident lifecycle transitions by actor role.
 * Enforces strict operational boundaries between citizens, field officers, supervisors, and admins.
 */
export function canTransitionStatus(
  role: UserRole,
  currentStatus: string,
  targetStatus: string
): boolean {
  if (role === 'admin') return true;

  if (role === 'citizen') {
    // Citizens cannot manually advance operational statuses
    return false;
  }

  if (role === 'officer') {
    // Officers can only progress assigned -> in_progress, and in_progress -> resolved
    if (currentStatus === 'assigned' && targetStatus === 'in_progress') return true;
    if (currentStatus === 'in_progress' && targetStatus === 'resolved') return true;
    // Officers cannot unilaterally reject complaints
    return false;
  }

  if (role === 'supervisor' || role === 'commissioner') {
    if (targetStatus === 'rejected') return true;
    if (currentStatus === 'assigned' && targetStatus === 'in_progress') return true;
    if (currentStatus === 'in_progress' && targetStatus === 'resolved') return true;
    if (targetStatus === 'escalated') return true;
    return true;
  }

  return false;
}
