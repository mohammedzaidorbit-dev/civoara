import { z } from 'zod';

export const incidentCategoryEnum = z.enum([
  'pothole',
  'garbage',
  'broken_streetlight',
  'water_leakage',
  'other',
  'sanitation',
  'water_supply',
  'street_lighting',
  'traffic_signal',
  'drainage',
]);

export const incidentPriorityEnum = z.enum(['low', 'medium', 'high', 'critical']);

export const incidentStatusEnum = z.enum([
  'submitted',
  'triaged',
  'assigned',
  'in_progress',
  'resolved',
  'rejected',
]);

export const reportIssueSchema = z.object({
  title: z
    .string()
    .min(5, 'Issue title must be at least 5 characters long')
    .max(120, 'Title cannot exceed 120 characters'),
  category: incidentCategoryEnum,
  description: z
    .string()
    .min(15, 'Please describe the incident in more detail (at least 15 characters)')
    .max(2000, 'Description cannot exceed 2000 characters'),
  latitude: z
    .coerce
    .number()
    .min(-90, 'Invalid latitude (min -90)')
    .max(90, 'Invalid latitude (max 90)'),
  longitude: z
    .coerce
    .number()
    .min(-180, 'Invalid longitude (min -180)')
    .max(180, 'Invalid longitude (max 180)'),
  locationDescription: z
    .string()
    .min(3, 'Location description / street landmark is required')
    .max(250, 'Location description too long'),
  isAnonymous: z.boolean().default(false),
  photoUrl: z.string().optional(),
});

export type ReportIssueInput = z.infer<typeof reportIssueSchema>;

// Alias for backward compatibility
export const incidentSubmissionSchema = reportIssueSchema;
export type IncidentSubmissionInput = ReportIssueInput;

// ==============================================================================
// AUTHENTICATION SCHEMAS
// ==============================================================================

export const registerSchema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
    fullName: z
      .string()
      .min(2, 'Full name must be at least 2 characters long')
      .max(100, 'Full name cannot exceed 100 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ==============================================================================
// OPERATIONAL INCIDENT STATUS SCHEMAS
// ==============================================================================

export const incidentStatusUpdateSchema = z.object({
  status: incidentStatusEnum,
  notes: z.string().max(1000).optional(),
  resolutionProofUrl: z.string().url().optional(),
});

export type IncidentStatusUpdateInput = z.infer<typeof incidentStatusUpdateSchema>;

