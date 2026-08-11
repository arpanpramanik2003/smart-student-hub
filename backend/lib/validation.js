import { z } from 'zod';

export function validateBody(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const formattedErrors = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
    return {
      success: false,
      errorResponse: {
        message: 'Validation error',
        error: {
          message: 'Validation error',
          details: formattedErrors,
          code: 'VALIDATION_ERROR',
          issues: result.error.issues,
        },
        details: formattedErrors,
      },
    };
  }
  return { success: true, data: result.data };
}

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address format').max(255, 'Email is too long'),
  password: z.string().min(1, 'Password is required').max(128, 'Password is too long'),
});

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().trim().email('Invalid email address format').max(255, 'Email is too long'),
  password: z.string().min(8, 'Password must be at least 8 characters long').max(128, 'Password is too long'),
  role: z.enum(['student', 'faculty', 'admin']).default('student'),
  department: z.string().trim().max(100).optional().nullable(),
  programCategory: z.string().trim().min(1, 'Program category is required').max(100),
  program: z.string().trim().max(100).optional().nullable(),
  specialization: z.string().trim().max(100).optional().nullable(),
  year: z.number().int().min(1).max(6).optional().nullable(),
  admissionYear: z.number().int().min(2000).max(2100).optional().nullable(),
  studentId: z.string().trim().max(50).optional().nullable(),
});

export const adminCreateUserSchema = registerSchema.extend({
  role: z.enum(['student', 'faculty', 'admin']),
});

export const activitySchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title is too long'),
  type: z.enum([
    'conference',
    'workshop',
    'certification',
    'competition',
    'internship',
    'leadership',
    'community_service',
    'club_activity',
    'online_course',
  ], { errorMap: () => ({ message: 'Invalid activity type' }) }),
  description: z.string().trim().max(2000).optional().nullable(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date format' }),
  duration: z.string().trim().max(100).optional().nullable(),
  organizer: z.string().trim().max(100).optional().nullable(),
  credits: z.preprocess(
    (val) => (val === undefined || val === null || val === '' ? 0 : Number(val)),
    z.number().min(0, 'Credits cannot be negative').max(99, 'Credits value out of range')
  ),
});
