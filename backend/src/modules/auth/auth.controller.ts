/**
 * Auth controller — thin handlers that delegate to services.
 * @module modules/auth/auth.controller
 */

import { RequestHandler } from 'express';
import { env } from '@/config/env';
import { AppError } from '@/utils/errors';
import { ErrorCode } from '@/types';
import * as authService from '@/modules/auth/auth.service';
import * as googleService from '@/modules/auth/google.service';
import {
  rotateRefreshToken,
  revokeRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
  getRefreshCookie,
  issueAccessToken,
  issueRefreshToken,
} from '@/modules/auth/token.service';
import type {
  RegisterInput,
  LoginInput,
  VerifyEmailInput,
  ResendVerificationInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  UpdateProfileInput,
} from '@/modules/auth/auth.schema';

/** POST /auth/register */
export const registerHandler: RequestHandler = async (req, res, next) => {
  try {
    const result = await authService.register(req.body as RegisterInput);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

/** POST /auth/login */
export const loginHandler: RequestHandler = async (req, res, next) => {
  try {
    const result = await authService.login(req.body as LoginInput, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    setRefreshCookie(res, result.refreshToken, env.JWT_REFRESH_TOKEN_EXPIRY_DAYS);

    res.status(200).json({
      success: true,
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    });
  } catch (err) {
    next(err);
  }
};

/** POST /auth/refresh */
export const refreshHandler: RequestHandler = async (req, res, next) => {
  try {
    const rawToken = getRefreshCookie(req);
    if (!rawToken) {
      throw new AppError(ErrorCode.AUTH_REQUIRED, 'No refresh token provided', 401);
    }

    const result = await rotateRefreshToken(rawToken, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    if (!result) {
      clearRefreshCookie(res);
      throw new AppError(ErrorCode.TOKEN_INVALID, 'Invalid or expired refresh token', 401);
    }

    if (result.familyRevoked) {
      clearRefreshCookie(res);
      throw new AppError(
        ErrorCode.SESSION_COMPROMISED,
        'Session compromised. Please log in again.',
        401,
      );
    }

    setRefreshCookie(res, result.newRawRefreshToken, env.JWT_REFRESH_TOKEN_EXPIRY_DAYS);

    res.status(200).json({
      success: true,
      data: { accessToken: result.accessToken },
    });
  } catch (err) {
    next(err);
  }
};

/** POST /auth/logout */
export const logoutHandler: RequestHandler = async (req, res, next) => {
  try {
    const rawToken = getRefreshCookie(req);
    if (rawToken) {
      await revokeRefreshToken(rawToken);
    }
    clearRefreshCookie(res);
    res.status(200).json({ success: true, data: { message: 'Logged out successfully' } });
  } catch (err) {
    next(err);
  }
};

/** GET /auth/google */
export const googleRedirectHandler: RequestHandler = async (_req, res, next) => {
  try {
    const url = await googleService.getGoogleAuthUrl();
    res.redirect(url);
  } catch (err) {
    next(err);
  }
};

/** GET /auth/google/callback */
export const googleCallbackHandler: RequestHandler = async (req, res, next) => {
  try {
    const { code, state } = req.query as { code?: string; state?: string };

    if (!code || !state) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Missing code or state parameter', 400);
    }

    const googleProfile = await googleService.handleGoogleCallback(code, state);
    const user = await authService.findOrCreateGoogleUser(googleProfile);

    const accessToken = issueAccessToken(user);
    const refreshToken = await issueRefreshToken(user.id, null, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    setRefreshCookie(res, refreshToken, env.JWT_REFRESH_TOKEN_EXPIRY_DAYS);

    // Redirect to frontend with access token in URL fragment (short-lived)
    res.redirect(`${env.FRONTEND_URL}/auth/callback#access_token=${accessToken}`);
  } catch (err) {
    if (err instanceof Error && err.message === 'INVALID_STATE') {
      return next(new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid OAuth state', 400));
    }
    next(err);
  }
};

/** POST /auth/verify-email */
export const verifyEmailHandler: RequestHandler = async (req, res, next) => {
  try {
    const { token } = req.body as VerifyEmailInput;
    const result = await authService.verifyEmail(token);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

/** POST /auth/resend-verification */
export const resendVerificationHandler: RequestHandler = async (req, res, next) => {
  try {
    const { email } = req.body as ResendVerificationInput;
    const result = await authService.resendVerification(email);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

/** POST /auth/forgot-password */
export const forgotPasswordHandler: RequestHandler = async (req, res, next) => {
  try {
    const { email } = req.body as ForgotPasswordInput;
    const result = await authService.forgotPassword(email);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

/** POST /auth/reset-password */
export const resetPasswordHandler: RequestHandler = async (req, res, next) => {
  try {
    const result = await authService.resetPassword(req.body as ResetPasswordInput);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

/** GET /auth/me */
export const getMeHandler: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AppError(ErrorCode.AUTH_REQUIRED, 'Authentication required', 401);
    }
    const profile = await authService.getProfile(req.user.sub);
    res.status(200).json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

/** PATCH /auth/me */
export const updateMeHandler: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AppError(ErrorCode.AUTH_REQUIRED, 'Authentication required', 401);
    }
    const updated = await authService.updateProfile(req.user.sub, req.body as UpdateProfileInput);
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};
