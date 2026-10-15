import type { Response, NextFunction } from 'express';
import { signUpSchema, signInSchema } from '@project-planner/schemas';
import { AuthService } from '../services/auth.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { AppError } from '../middleware/errorHandler.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/**
 * POST /api/auth/signup
 * Register a new user account, set HTTP-only cookie, return user object (token not exposed in body)
 */
export async function signUp(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = signUpSchema.parse(req.body);
    const result = await AuthService.register(parsed);
    res.cookie('token', result.token!, COOKIE_OPTIONS);
    // Token is transmitted exclusively via HTTP-only cookie and not exposed in API response
    res.status(201).json({ user: result.user });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/login
 * Authenticate credentials, set HTTP-only cookie, return user object (token not exposed in body)
 */
export async function signIn(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = signInSchema.parse(req.body);
    const result = await AuthService.login(parsed);
    res.cookie('token', result.token!, COOKIE_OPTIONS);
    // Token is transmitted exclusively via HTTP-only cookie and not exposed in API response
    res.json({ user: result.user });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/me
 * Retrieve profile of currently authenticated user
 */
export async function getMe(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, 'Not authenticated');
    }
    const user = await AuthService.getUserById(req.user.userId);
    res.json({ user });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/logout
 * Client-side session termination and cookie destruction
 */
export async function logout(
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
}
