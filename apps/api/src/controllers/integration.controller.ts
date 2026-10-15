import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import {
  createIntegrationSchema,
  updateIntegrationSchema,
  createHumanActionSchema,
  updateHumanActionSchema,
  updateHumanActionStatusSchema,
} from '@project-planner/schemas';
import { IntegrationService } from '../services/integration.service.js';
import { ThirdPartyIntegration } from '../models/ThirdPartyIntegration.js';
import { HumanAction } from '../models/HumanAction.js';
import { Project } from '../models/Project.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../config/logger.js';

/**
 * GET /api/projects/:id/integrations
 * Fetch all integrations, human actions, and KPI stats
 */
export async function getIntegrationsAndActions(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError(400, 'Invalid project ID');
    }

    const data = await IntegrationService.getIntegrationsAndActions(projectId);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/projects/:id/integrations/discover
 * Trigger AI discovery of external integrations and human action plan
 */
export async function discoverIntegrationsAndActions(
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

    const result = await IntegrationService.discoverIntegrationsAndActions(projectId);
    res.json(result);
  } catch (error) {
    logger.error({ err: error }, 'Failed in discoverIntegrationsAndActions controller');
    next(error);
  }
}

/**
 * POST /api/projects/:id/integrations
 * Create a manual custom third-party integration
 */
export async function createIntegration(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError(400, 'Invalid project ID');
    }

    const parsed = createIntegrationSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, parsed.error.errors.map((e) => e.message).join(', '));
    }

    const integration = await IntegrationService.createIntegration(projectId, parsed.data);
    res.status(201).json(integration);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/projects/:id/integrations/:integrationId
 * Update an existing integration
 */
export async function updateIntegration(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const integrationId = String(req.params['integrationId'] || '');
    if (!mongoose.Types.ObjectId.isValid(integrationId)) {
      throw new AppError(400, 'Invalid integration ID');
    }

    const parsed = updateIntegrationSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, parsed.error.errors.map((e) => e.message).join(', '));
    }

    const updated = await IntegrationService.updateIntegration(integrationId, parsed.data);
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/projects/:id/integrations/:integrationId
 * Delete an integration
 */
export async function deleteIntegration(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const integrationId = String(req.params['integrationId'] || '');
    if (!mongoose.Types.ObjectId.isValid(integrationId)) {
      throw new AppError(400, 'Invalid integration ID');
    }

    const result = await IntegrationService.deleteIntegration(integrationId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/projects/:id/actions
 * Fetch all human actions for a project
 */
export async function getHumanActions(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError(400, 'Invalid project ID');
    }

    const actions = await HumanAction.find({ projectId }).sort({ actionId: 1 });
    res.json(actions);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/projects/:id/actions
 * Create a manual human action checklist item
 */
export async function createHumanAction(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError(400, 'Invalid project ID');
    }

    const parsed = createHumanActionSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, parsed.error.errors.map((e) => e.message).join(', '));
    }

    const action = await IntegrationService.createHumanAction(projectId, parsed.data);
    res.status(201).json(action);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/projects/:id/actions/:actionId
 * Update details of a human action
 */
export async function updateHumanAction(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actionId = String(req.params['actionId'] || '');
    if (!mongoose.Types.ObjectId.isValid(actionId)) {
      throw new AppError(400, 'Invalid action ID');
    }

    const parsed = updateHumanActionSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, parsed.error.errors.map((e) => e.message).join(', '));
    }

    const updated = await IntegrationService.updateHumanAction(actionId, parsed.data);
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/projects/:id/actions/:actionId/status
 * Toggle or update human action status (e.g. COMPLETED vs PENDING)
 */
export async function updateHumanActionStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actionId = String(req.params['actionId'] || '');
    if (!mongoose.Types.ObjectId.isValid(actionId)) {
      throw new AppError(400, 'Invalid action ID');
    }

    const parsed = updateHumanActionStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, parsed.error.errors.map((e) => e.message).join(', '));
    }

    const updated = await IntegrationService.updateHumanActionStatus(
      actionId,
      parsed.data.status,
      parsed.data.notes,
    );
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/projects/:id/actions/:actionId
 * Delete a human action
 */
export async function deleteHumanAction(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actionId = String(req.params['actionId'] || '');
    if (!mongoose.Types.ObjectId.isValid(actionId)) {
      throw new AppError(400, 'Invalid action ID');
    }

    const result = await IntegrationService.deleteHumanAction(actionId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
