/**
 * Zod request schemas for all auth endpoints.
 * @module modules/auth/auth.schema
 */

import { z } from 'zod';

/** POST /auth/register body schema. */
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  displayName: z.string().min(1, 'Display name is required').max(100),
});

/** POST /auth/login body schema. */
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

/** POST /auth/verify-email body schema. */
export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

/** POST /auth/resend-verification body schema. */
export const resendVerificationSchema = z.object({
  email: z.string().email('Invalid email address'),
});

/** POST /auth/forgot-password body schema. */
export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

/** POST /auth/reset-password body schema. */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

/** PATCH /auth/me body schema. */
export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional().nullable(),
});

/** GET /auth/google/callback query schema. */
export const googleCallbackSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().min(1, 'State parameter is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type GoogleCallbackInput = z.infer<typeof googleCallbackSchema>;
