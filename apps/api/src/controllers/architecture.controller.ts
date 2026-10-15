import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import {
  createEntitySchema,
  updateEntitySchema,
  createApiEndpointSchema,
  updateApiEndpointSchema,
  updateArchitecturePlanSchema,
} from '@project-planner/schemas';
import { Project } from '../models/Project.js';
import { DatabaseEntity } from '../models/DatabaseEntity.js';
import { ApiEndpoint } from '../models/ApiEndpoint.js';
import { ArchitecturePlan } from '../models/ArchitecturePlan.js';
import { generateCompleteArchitecture } from '../services/architecture.service.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../config/logger.js';

export async function getArchitecture(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError(400, 'Invalid project ID');
    }

    const [plan, entities, endpoints] = await Promise.all([
      ArchitecturePlan.findOne({ projectId }),
      DatabaseEntity.find({ projectId }).sort({ name: 1 }),
      ApiEndpoint.find({ projectId }).sort({ route: 1, method: 1 }),
    ]);

    res.json({
      plan: plan || null,
      entities: entities || [],
      endpoints: endpoints || [],
    });
  } catch (error) {
    next(error);
  }
}

export async function generateArchitecture(
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

    const result = await generateCompleteArchitecture(project);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateArchitecturePlan(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError(400, 'Invalid project ID');
    }

    const data = updateArchitecturePlanSchema.parse(req.body);

    const plan = await ArchitecturePlan.findOneAndUpdate(
      { projectId },
      { $set: data },
      { new: true, upsert: true, runValidators: true },
    );

    logger.info({ projectId }, 'Architecture plan updated');
    res.json(plan);
  } catch (error) {
    next(error);
  }
}

// Database Entities
export async function getEntities(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError(400, 'Invalid project ID');
    }

    const entities = await DatabaseEntity.find({ projectId }).sort({ name: 1 });
    res.json(entities);
  } catch (error) {
    next(error);
  }
}

export async function createEntity(
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

    const data = createEntitySchema.parse(req.body);

    const entity = await DatabaseEntity.create({
      projectId: project._id,
      ...data,
    });

    logger.info({ projectId, entityId: entity.id, name: entity.name }, 'Database entity created');
    res.status(201).json(entity);
  } catch (error) {
    next(error);
  }
}

export async function updateEntity(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    const entityId = String(req.params['entityId'] || '');

    if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(entityId)) {
      throw new AppError(400, 'Invalid project or entity ID');
    }

    const data = updateEntitySchema.parse(req.body);

    const entity = await DatabaseEntity.findOneAndUpdate(
      { _id: entityId, projectId },
      { $set: data },
      { new: true, runValidators: true },
    );

    if (!entity) throw new AppError(404, 'Database entity not found');

    logger.info({ projectId, entityId }, 'Database entity updated');
    res.json(entity);
  } catch (error) {
    next(error);
  }
}

export async function deleteEntity(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    const entityId = String(req.params['entityId'] || '');

    if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(entityId)) {
      throw new AppError(400, 'Invalid project or entity ID');
    }

    const entity = await DatabaseEntity.findOneAndDelete({ _id: entityId, projectId });
    if (!entity) throw new AppError(404, 'Database entity not found');

    logger.info({ projectId, entityId }, 'Database entity deleted');
    res.json({ success: true, message: 'Database entity removed' });
  } catch (error) {
    next(error);
  }
}

// API Endpoints
export async function getEndpoints(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError(400, 'Invalid project ID');
    }

    const endpoints = await ApiEndpoint.find({ projectId }).sort({ route: 1, method: 1 });
    res.json(endpoints);
  } catch (error) {
    next(error);
  }
}

export async function createEndpoint(
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

    const data = createApiEndpointSchema.parse(req.body);

    const endpoint = await ApiEndpoint.create({
      projectId: project._id,
      ...data,
    });

    logger.info({ projectId, endpointId: endpoint.id, route: endpoint.route }, 'API endpoint created');
    res.status(201).json(endpoint);
  } catch (error) {
    next(error);
  }
}

export async function updateEndpoint(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    const endpointId = String(req.params['endpointId'] || '');

    if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(endpointId)) {
      throw new AppError(400, 'Invalid project or endpoint ID');
    }

    const data = updateApiEndpointSchema.parse(req.body);

    const endpoint = await ApiEndpoint.findOneAndUpdate(
      { _id: endpointId, projectId },
      { $set: data },
      { new: true, runValidators: true },
    );

    if (!endpoint) throw new AppError(404, 'API endpoint not found');

    logger.info({ projectId, endpointId }, 'API endpoint updated');
    res.json(endpoint);
  } catch (error) {
    next(error);
  }
}

export async function deleteEndpoint(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    const endpointId = String(req.params['endpointId'] || '');

    if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(endpointId)) {
      throw new AppError(400, 'Invalid project or endpoint ID');
    }

    const endpoint = await ApiEndpoint.findOneAndDelete({ _id: endpointId, projectId });
    if (!endpoint) throw new AppError(404, 'API endpoint not found');

    logger.info({ projectId, endpointId }, 'API endpoint deleted');
    res.json({ success: true, message: 'API endpoint removed' });
  } catch (error) {
    next(error);
  }
}
