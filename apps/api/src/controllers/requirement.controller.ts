import type { Request, Response, NextFunction } from 'express';
import { createRequirementSchema, updateRequirementSchema } from '@project-planner/schemas';
import { Requirement } from '../models/Requirement.js';
import { Project } from '../models/Project.js';
import { Message } from '../models/Message.js';
import { extractRequirementsFromConversation } from '../services/requirement.service.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../config/logger.js';
import mongoose from 'mongoose';

export async function getRequirements(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const projectId = req.params['id'];
    const { type, status } = req.query;

    const query: Record<string, any> = { projectId };
    if (type) query['type'] = type;
    if (status) query['status'] = status;

    const requirements = await Requirement.find(query).sort({ reqId: 1, createdAt: 1 });
    res.json(requirements);
  } catch (error) {
    next(error);
  }
}

export async function createRequirement(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const projectId = req.params['id'];
    const project = await Project.findById(projectId);
    if (!project) throw new AppError(404, 'Project not found');

    const data = createRequirementSchema.parse(req.body);

    let reqId = data.reqId;
    if (!reqId) {
      // Auto-generate reqId if not provided
      const count = await Requirement.countDocuments({ projectId, type: data.type });
      const prefix = data.type.substring(0, 3).toUpperCase();
      reqId = `${prefix}-${String(count + 1).padStart(3, '0')}`;
    }

    const requirement = await Requirement.create({
      projectId: project._id,
      reqId,
      title: data.title,
      description: data.description,
      type: data.type,
      priority: data.priority,
      status: data.status,
      source: data.source,
      confidence: data.confidence,
      dependencies: data.dependencies,
    });

    logger.info({ projectId, reqId: requirement.reqId }, 'Requirement manually created');
    res.status(201).json(requirement);
  } catch (error) {
    next(error);
  }
}

export async function updateRequirement(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    const reqIdParam = String(req.params['reqId'] || '');
    const data = updateRequirementSchema.parse(req.body);

    const isObjectId = mongoose.Types.ObjectId.isValid(reqIdParam);
    const query = isObjectId 
      ? { _id: reqIdParam, projectId } 
      : { reqId: reqIdParam, projectId };

    const requirement = await Requirement.findOneAndUpdate(
      query,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!requirement) {
      throw new AppError(404, 'Requirement not found');
    }

    logger.info({ projectId, reqId: requirement.reqId }, 'Requirement updated');
    res.json(requirement);
  } catch (error) {
    next(error);
  }
}

export async function deleteRequirement(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    const reqIdParam = String(req.params['reqId'] || '');

    const isObjectId = mongoose.Types.ObjectId.isValid(reqIdParam);
    const query = isObjectId 
      ? { _id: reqIdParam, projectId } 
      : { reqId: reqIdParam, projectId };

    const requirement = await Requirement.findOneAndDelete(query);
    if (!requirement) {
      throw new AppError(404, 'Requirement not found');
    }

    logger.info({ projectId, reqId: requirement.reqId }, 'Requirement deleted');
    res.json({ success: true, message: 'Requirement removed successfully' });
  } catch (error) {
    next(error);
  }
}

export async function triggerExtraction(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const projectId = req.params['id'];
    const project = await Project.findById(projectId);
    if (!project) throw new AppError(404, 'Project not found');

    const messages = await Message.find({ projectId: project._id }).sort({ createdAt: 1 });
    await extractRequirementsFromConversation(project, messages);

    const allRequirements = await Requirement.find({ projectId }).sort({ reqId: 1 });
    res.json(allRequirements);
  } catch (error) {
    next(error);
  }
}
