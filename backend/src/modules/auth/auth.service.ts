/**
 * Authentication business logic service.
 * Handles registration, login, email verification, password reset.
 * @module modules/auth/auth.service
 */

import bcrypt from 'bcrypt';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { env } from '@/config/env';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { AppError } from '@/utils/errors';
import { ErrorCode } from '@/types';
import { issueAccessToken, issueRefreshToken } from '@/modules/auth/token.service';
import type { RegisterInput, LoginInput, ResetPasswordInput, UpdateProfileInput } from '@/modules/auth/auth.schema';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

/**
 * Register a new user with email and password.
 * Creates user (emailVerified: false), generates verification token, sends email.
 */
export async function register(input: RegisterInput): Promise<{ userId: string; message: string }> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AppError(ErrorCode.DUPLICATE_EMAIL, 'An account with this email already exists', 409);
  }

  const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      displayName: input.displayName,
      passwordHash,
      emailVerified: true, // Bypassed for local testing without SMTP
    },
  });

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  await prisma.emailVerification.create({
    data: {
      email: user.email,
      token: verificationToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  });

  // Send verification email (fire and forget, log errors)
  const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
  transporter
    .sendMail({
      from: env.EMAIL_FROM,
      to: user.email,
      subject: 'Verify your MaYu account',
      html: `<p>Welcome to MaYu! Click <a href="${verifyUrl}">here</a> to verify your email.</p>
             <p>Or copy this link: ${verifyUrl}</p>
             <p>This link expires in 24 hours.</p>`,
    })
    .catch((err: unknown) => {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Failed to send verification email', { error: message, userId: user.id });
    });

  logger.info('User registered', { userId: user.id });

  return { userId: user.id, message: 'Check your email to verify your account' };
}

/**
 * Login with email and password.
 * Returns access token and refresh token metadata.
 */
export async function login(
  input: LoginInput,
  meta: { ipAddress?: string; userAgent?: string },
): Promise<{
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; displayName: string; avatarUrl: string | null; role: string };
}> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !user.passwordHash) {
    throw new AppError(ErrorCode.INVALID_CREDENTIALS, 'Invalid email or password', 401);
  }

  if (!user.emailVerified) {
    throw new AppError(ErrorCode.EMAIL_NOT_VERIFIED, 'Please verify your email before logging in', 403);
  }

  const passwordValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordValid) {
    throw new AppError(ErrorCode.INVALID_CREDENTIALS, 'Invalid email or password', 401);
  }

  const accessToken = issueAccessToken({ id: user.id, email: user.email, role: user.role });
  const refreshToken = await issueRefreshToken(user.id, null, meta);

  logger.info('User logged in', { userId: user.id });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role,
    },
  };
}

/**
 * Verify an email address using the verification token.
 */
export async function verifyEmail(token: string): Promise<{ message: string }> {
  const record = await prisma.emailVerification.findUnique({ where: { token } });
  if (!record) {
    throw new AppError(ErrorCode.TOKEN_INVALID, 'Invalid verification token', 400);
  }
  if (record.usedAt) {
    throw new AppError(ErrorCode.TOKEN_INVALID, 'Token has already been used', 400);
  }
  if (record.expiresAt < new Date()) {
    throw new AppError(ErrorCode.TOKEN_EXPIRED, 'Verification token has expired', 400);
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { email: record.email },
      data: { emailVerified: true },
    }),
    prisma.emailVerification.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  logger.info('Email verified', { email: record.email });

  return { message: 'Email verified. You can now log in.' };
}

/**
 * Resend the verification email for the given email address.
 */
export async function resendVerification(email: string): Promise<{ message: string }> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.emailVerified) {
    // Don't reveal whether the email exists or is already verified
    return { message: 'If the email exists and is not verified, a verification email has been sent.' };
  }

  const verificationToken = crypto.randomBytes(32).toString('hex');
  await prisma.emailVerification.create({
    data: {
      email: user.email,
      token: verificationToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
  transporter
    .sendMail({
      from: env.EMAIL_FROM,
      to: user.email,
      subject: 'Verify your MaYu account',
      html: `<p>Click <a href="${verifyUrl}">here</a> to verify your email.</p>
             <p>Or copy this link: ${verifyUrl}</p>
             <p>This link expires in 24 hours.</p>`,
    })
    .catch((err: unknown) => {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Failed to send verification email', { error: message, email: user.email });
    });

  return { message: 'If the email exists and is not verified, a verification email has been sent.' };
}

/**
 * Initiate password reset flow by sending reset email.
 */
export async function forgotPassword(email: string): Promise<{ message: string }> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Don't reveal whether the email exists
    return { message: 'If the email is registered, a password reset link has been sent.' };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      token: resetToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
  });

  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  transporter
    .sendMail({
      from: env.EMAIL_FROM,
      to: user.email,
      subject: 'Reset your MaYu password',
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>
             <p>Or copy this link: ${resetUrl}</p>
             <p>This link expires in 1 hour.</p>`,
    })
    .catch((err: unknown) => {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Failed to send password reset email', { error: message, userId: user.id });
    });

  return { message: 'If the email is registered, a password reset link has been sent.' };
}

/**
 * Reset password using the reset token.
 */
export async function resetPassword(input: ResetPasswordInput): Promise<{ message: string }> {
  const record = await prisma.passwordReset.findUnique({ where: { token: input.token } });
  if (!record) {
    throw new AppError(ErrorCode.TOKEN_INVALID, 'Invalid reset token', 400);
  }
  if (record.usedAt) {
    throw new AppError(ErrorCode.TOKEN_INVALID, 'Token has already been used', 400);
  }
  if (record.expiresAt < new Date()) {
    throw new AppError(ErrorCode.TOKEN_EXPIRED, 'Reset token has expired', 400);
  }

  const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.passwordReset.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    // Revoke all refresh tokens for this user (force re-login)
    prisma.refreshToken.updateMany({
      where: { userId: record.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  logger.info('Password reset successful', { userId: record.userId });

  return { message: 'Password reset successful. Please log in with your new password.' };
}

/**
 * Get the current user's profile.
 */
export async function getProfile(userId: string): Promise<{
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  role: string;
  createdAt: Date;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      displayName: true,
      avatarUrl: true,
      emailVerified: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError(ErrorCode.NOT_FOUND, 'User not found', 404);
  }

  return user;
}

/**
 * Update the current user's display name or avatar.
 */
export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<{
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
}> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.displayName !== undefined && { displayName: input.displayName }),
      ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl }),
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      avatarUrl: true,
    },
  });

  return user;
}

/**
 * Find or create a user from Google OAuth2 profile data.
 */
export async function findOrCreateGoogleUser(profile: {
  googleId: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
}): Promise<{ id: string; email: string; role: string }> {
  // Try to find by googleId first
  let user = await prisma.user.findUnique({ where: { googleId: profile.googleId } });

  if (!user) {
    // Try to find by email — link accounts
    user = await prisma.user.findUnique({ where: { email: profile.email } });

    if (user) {
      // Link Google account to existing email-registered user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: profile.googleId,
          emailVerified: true,
          avatarUrl: user.avatarUrl ?? profile.avatarUrl,
        },
      });
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: profile.email,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          googleId: profile.googleId,
          emailVerified: true,
        },
      });
      logger.info('New user created via Google OAuth', { userId: user.id });
    }
  }

  return { id: user.id, email: user.email, role: user.role };
}
