import type { Request, Response, NextFunction } from 'express';
import { AuthService, type TokenPayload } from '../services/auth.service.js';
import { AppError } from './errorHandler.js';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

function extractToken(req: Request): string | null {
  // 1. Check HTTP-only cookie first
  if (req.cookies && typeof req.cookies['token'] === 'string' && req.cookies['token'].length > 0) {
    return req.cookies['token'];
  }
  // 2. Check Authorization Bearer header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[1]) {
      return parts[1];
    }
  }
  return null;
}

/**
 * Enforces mandatory JWT authentication from cookies or Bearer headers
 */
export function requireAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  try {
    const token = extractToken(req);
    if (!token) {
      throw new AppError(401, 'Authentication token required. Please sign in.');
    }

    const payload = AuthService.verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Attaches user payload if valid token is provided in cookie or header, without blocking
 */
export function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  try {
    const token = extractToken(req);
    if (token) {
      try {
        const payload = AuthService.verifyToken(token);
        req.user = payload;
      } catch {
        // Ignore invalid token in optional mode
      }
    }
    next();
  } catch (error) {
    next(error);
  }
}
