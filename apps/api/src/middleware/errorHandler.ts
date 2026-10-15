import type { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.js';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  logger.error({ err }, 'Unhandled error');

  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: err.errors,
      statusCode: 400,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.name,
      message: err.message,
      statusCode: err.statusCode,
    });
    return;
  }

  // Handle Mongoose invalid ObjectId / CastError
  if (err.name === 'CastError') {
    res.status(400).json({
      error: 'INVALID_ID',
      message: 'Invalid resource identifier format',
      statusCode: 400,
    });
    return;
  }

  res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
    statusCode: 500,
  });
}
