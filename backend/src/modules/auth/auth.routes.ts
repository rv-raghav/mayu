/**
 * Auth routes — mounts all authentication endpoints.
 * @module modules/auth/auth.routes
 */

import { Router } from 'express';
import { requireAuth } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { rateLimiter } from '@/middleware/rateLimiter';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from '@/modules/auth/auth.schema';
import {
  registerHandler,
  loginHandler,
  refreshHandler,
  logoutHandler,
  googleRedirectHandler,
  googleCallbackHandler,
  verifyEmailHandler,
  resendVerificationHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  getMeHandler,
  updateMeHandler,
} from '@/modules/auth/auth.controller';

/** Auth router — mounted at /auth */
export const authRoutes = Router();

// Rate limiters
const authRateLimiter = rateLimiter({ max: 5, windowMs: 15 * 60 * 1000, prefix: 'rate:auth' });
const emailRateLimiter = rateLimiter({ max: 3, windowMs: 60 * 60 * 1000, prefix: 'rate:email' });

// Public auth endpoints
authRoutes.post('/register', authRateLimiter, validate(registerSchema), registerHandler);
authRoutes.post('/login', authRateLimiter, validate(loginSchema), loginHandler);
authRoutes.post('/refresh', refreshHandler);
authRoutes.post('/logout', requireAuth, logoutHandler);

// Google OAuth2
authRoutes.get('/google', googleRedirectHandler);
authRoutes.get('/google/callback', googleCallbackHandler);

// Email verification
authRoutes.post('/verify-email', emailRateLimiter, validate(verifyEmailSchema), verifyEmailHandler);
authRoutes.post(
  '/resend-verification',
  emailRateLimiter,
  validate(resendVerificationSchema),
  resendVerificationHandler,
);

// Password reset
authRoutes.post('/forgot-password', emailRateLimiter, validate(forgotPasswordSchema), forgotPasswordHandler);
authRoutes.post('/reset-password', validate(resetPasswordSchema), resetPasswordHandler);

// Profile
authRoutes.get('/me', requireAuth, getMeHandler);
authRoutes.patch('/me', requireAuth, validate(updateProfileSchema), updateMeHandler);
