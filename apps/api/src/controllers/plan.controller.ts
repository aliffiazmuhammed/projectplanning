import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  updateImplementationPlanSchema,
} from '@project-planner/schemas';
import { PlanService } from '../services/plan.service.js';
import { PlanTask } from '../models/PlanTask.js';
import { Project } from '../models/Project.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../config/logger.js';

/**
 * GET /api/projects/:id/plan
 * Fetch complete implementation plan, roadmap, milestones, user stories, tasks, and metrics
 */
export async function getImplementationPlan(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError(400, 'Invalid project ID');
    }

    const data = await PlanService.getImplementationPlan(projectId);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/projects/:id/plan/generate
 * Trigger AI implementation planning (Roadmap, Milestones, Epics, Stories, and Tasks)
 */
export async function generateImplementationPlan(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError(400, 'Invalid project ID');
    }

    const project = await Project.findById(projectId);
    if (!project) throw new AppError(404, 'Project not found');

    const result = await PlanService.generateImplementationPlan(projectId);
    res.json(result);
  } catch (error) {
    logger.error({ err: error }, 'Failed in generateImplementationPlan controller');
    next(error);
  }
}

/**
 * PATCH /api/projects/:id/plan
 * Update plan details, roadmap, or milestones
 */
export async function updateImplementationPlan(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError(400, 'Invalid project ID');
    }

    const parsed = updateImplementationPlanSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, parsed.error.errors.map((e) => e.message).join(', '));
    }

    const plan = await PlanService.updateImplementationPlan(projectId, parsed.data);
    res.json(plan);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/projects/:id/plan/tasks
 * Fetch all tasks for a project
 */
export async function getTasks(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError(400, 'Invalid project ID');
    }

    const tasks = await PlanTask.find({ projectId }).sort({ taskId: 1 });
    res.json(tasks);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/projects/:id/plan/tasks
 * Create a manual task
 */
export async function createTask(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError(400, 'Invalid project ID');
    }

    const parsed = createTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, parsed.error.errors.map((e) => e.message).join(', '));
    }

    const task = await PlanService.createTask(projectId, parsed.data);
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/projects/:id/plan/tasks/:taskId
 * Update an existing task
 */
export async function updateTask(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const taskId = String(req.params['taskId'] || '');
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      throw new AppError(400, 'Invalid task ID');
    }

    const parsed = updateTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, parsed.error.errors.map((e) => e.message).join(', '));
    }

    const task = await PlanService.updateTask(taskId, parsed.data);
    res.json(task);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/projects/:id/plan/tasks/:taskId/status
 * Update task status (e.g. TODO -> IN_PROGRESS -> COMPLETED)
 */
export async function updateTaskStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const taskId = String(req.params['taskId'] || '');
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      throw new AppError(400, 'Invalid task ID');
    }

    const parsed = updateTaskStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, parsed.error.errors.map((e) => e.message).join(', '));
    }

    const task = await PlanService.updateTaskStatus(taskId, parsed.data.status, parsed.data.notes);
    res.json(task);
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/projects/:id/plan/tasks/:taskId
 * Delete a task
 */
export async function deleteTask(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const taskId = String(req.params['taskId'] || '');
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      throw new AppError(400, 'Invalid task ID');
    }

    const result = await PlanService.deleteTask(taskId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/projects/:id/plan/export-spec
 * Export complete machine-readable project-spec.json for autonomous coding agents
 */
export async function exportProjectSpec(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError(400, 'Invalid project ID');
    }

    const spec = await PlanService.exportMachineReadableSpec(projectId);
    res.json(spec);
  } catch (error) {
    next(error);
  }
}
