import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import {
  approveProjectSchema,
  finalizeProjectSchema,
} from '@project-planner/schemas';
import { ReadinessService } from '../services/readiness.service.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../config/logger.js';

/**
 * GET /api/projects/:id/readiness
 * Fetch latest readiness assessment report
 */
export async function getReadiness(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError(400, 'Invalid project ID');
    }

    const report = await ReadinessService.getReadiness(projectId);
    res.json(report);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/projects/:id/readiness/audit
 * Run a full audit across all 11 planning dimensions and update project status
 */
export async function runReadinessAudit(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError(400, 'Invalid project ID');
    }

    const report = await ReadinessService.runReadinessAudit(projectId);
    res.json(report);
  } catch (error) {
    logger.error({ err: error }, 'Failed in runReadinessAudit controller');
    next(error);
  }
}

/**
 * POST /api/projects/:id/readiness/approve
 * Human founder sign-off on the project specifications
 */
export async function approveProject(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError(400, 'Invalid project ID');
    }

    const parsed = approveProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, parsed.error.errors.map((e) => e.message).join(', '));
    }

    const report = await ReadinessService.approveProject(projectId, parsed.data);
    res.json(report);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/projects/:id/readiness/finalize
 * Finalize the project specification
 */
export async function finalizeProject(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError(400, 'Invalid project ID');
    }

    const parsed = finalizeProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, parsed.error.errors.map((e) => e.message).join(', '));
    }

    const report = await ReadinessService.finalizeProject(projectId, parsed.data);
    res.json(report);
  } catch (error) {
    next(error);
  }
}
