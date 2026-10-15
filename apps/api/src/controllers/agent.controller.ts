import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import {
  initializeHandoffSchema,
  claimTaskSchema,
  completeTaskSchema,
  failTaskSchema,
  submitFeedbackSchema,
} from '@project-planner/schemas';
import { AgentService } from '../services/agent.service.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * POST /api/projects/:id/agent/handoff
 * Initializes or re-synchronizes the autonomous coding agent handoff package
 */
export async function initializeHandoff(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError(400, 'Invalid project ID');
    }

    const parsed = initializeHandoffSchema.parse(req.body);
    const result = await AgentService.initializeHandoff(projectId, parsed);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/projects/:id/agent/handoff
 * Retrieves the complete handoff package with spec, task queue, and agent instructions
 */
export async function getHandoffPackage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError(400, 'Invalid project ID');
    }

    const result = await AgentService.getHandoffPackage(projectId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/projects/:id/agent/queue
 * Retrieves the topological dependency-ordered task queue
 */
export async function getTaskQueue(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError(400, 'Invalid project ID');
    }

    const queue = await AgentService.getTaskQueue(projectId);
    res.json(queue);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/projects/:id/agent/next-task
 * Returns the next unblocked, ready-to-run task in the queue
 */
export async function getNextTask(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError(400, 'Invalid project ID');
    }

    const task = await AgentService.getNextExecutableTask(projectId);
    res.json(task);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/projects/:id/agent/tasks/:taskId/claim
 * Coding agent claims a task and starts implementation
 */
export async function claimTask(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    const taskId = String(req.params['taskId'] || '');
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError(400, 'Invalid project ID');
    }
    if (!taskId) {
      throw new AppError(400, 'Task ID is required');
    }

    const parsed = claimTaskSchema.parse(req.body);
    const updated = await AgentService.claimTask(projectId, taskId, parsed);
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/projects/:id/agent/tasks/:taskId/complete
 * Coding agent marks task completed with notes and artifacts
 */
export async function completeTask(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    const taskId = String(req.params['taskId'] || '');
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError(400, 'Invalid project ID');
    }
    if (!taskId) {
      throw new AppError(400, 'Task ID is required');
    }

    const parsed = completeTaskSchema.parse(req.body);
    const updated = await AgentService.completeTask(projectId, taskId, parsed);
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/projects/:id/agent/tasks/:taskId/fail
 * Coding agent marks task as blocked or failed
 */
export async function failTask(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    const taskId = String(req.params['taskId'] || '');
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError(400, 'Invalid project ID');
    }
    if (!taskId) {
      throw new AppError(400, 'Task ID is required');
    }

    const parsed = failTaskSchema.parse(req.body);
    const updated = await AgentService.failTask(projectId, taskId, parsed);
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/projects/:id/agent/feedback
 * Coding agent submits structured feedback or clarification requests
 */
export async function submitFeedback(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError(400, 'Invalid project ID');
    }

    const parsed = submitFeedbackSchema.parse(req.body);
    const report = await AgentService.submitFeedback(projectId, parsed);
    res.status(201).json(report);
  } catch (error) {
    next(error);
  }
}
