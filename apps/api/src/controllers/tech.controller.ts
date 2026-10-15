import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import {
  createTechRecommendationSchema,
  updateTechRecommendationSchema,
  updateTechStatusSchema,
} from '@project-planner/schemas';
import { TechDecisionStatus } from '@project-planner/types';
import { Project } from '../models/Project.js';
import { TechDecision } from '../models/TechDecision.js';
import {
  generateTechStackRecommendations,
  checkTechCompatibility,
} from '../services/tech.service.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../config/logger.js';

export async function getTechStack(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError(400, 'Invalid project ID');
    }

    const decisions = await TechDecision.find({ projectId }).sort({ createdAt: 1 });
    res.json(decisions);
  } catch (error) {
    next(error);
  }
}

export async function generateTechStack(
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

    const decisions = await generateTechStackRecommendations(project);
    res.json(decisions);
  } catch (error) {
    next(error);
  }
}

export async function createTechDecision(
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

    const data = createTechRecommendationSchema.parse(req.body);

    const decision = await TechDecision.findOneAndUpdate(
      { projectId: project._id, category: data.category },
      { $set: data },
      { new: true, upsert: true, runValidators: true },
    );

    logger.info({ projectId, category: decision.category }, 'Tech decision created/updated');
    res.status(201).json(decision);
  } catch (error) {
    next(error);
  }
}

export async function updateTechDecision(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    const recId = String(req.params['recId'] || '');

    if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(recId)) {
      throw new AppError(400, 'Invalid project or decision ID');
    }

    const data = updateTechRecommendationSchema.parse(req.body);

    const decision = await TechDecision.findOneAndUpdate(
      { _id: recId, projectId },
      { $set: data },
      { new: true, runValidators: true },
    );

    if (!decision) {
      throw new AppError(404, 'Tech decision not found');
    }

    logger.info({ projectId, recId }, 'Tech decision updated');
    res.json(decision);
  } catch (error) {
    next(error);
  }
}

export async function updateTechStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    const recId = String(req.params['recId'] || '');

    if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(recId)) {
      throw new AppError(400, 'Invalid project or decision ID');
    }

    const data = updateTechStatusSchema.parse(req.body);

    const updateFields: Record<string, any> = { status: data.status };
    if (data.userNotes !== undefined) {
      updateFields['userNotes'] = data.userNotes;
    }

    const decision = await TechDecision.findOneAndUpdate(
      { _id: recId, projectId },
      { $set: updateFields },
      { new: true, runValidators: true },
    );

    if (!decision) {
      throw new AppError(404, 'Tech decision not found');
    }

    logger.info({ projectId, recId, status: data.status }, 'Tech decision status updated');
    res.json(decision);
  } catch (error) {
    next(error);
  }
}

export async function approveAllRecommendations(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError(400, 'Invalid project ID');
    }

    await TechDecision.updateMany(
      { projectId, status: TechDecisionStatus.RECOMMENDED },
      { $set: { status: TechDecisionStatus.APPROVED } },
    );

    const allDecisions = await TechDecision.find({ projectId }).sort({ createdAt: 1 });
    logger.info({ projectId }, 'All pending tech recommendations approved');
    res.json(allDecisions);
  } catch (error) {
    next(error);
  }
}

export async function deleteTechDecision(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    const recId = String(req.params['recId'] || '');

    if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(recId)) {
      throw new AppError(400, 'Invalid project or decision ID');
    }

    const decision = await TechDecision.findOneAndDelete({ _id: recId, projectId });
    if (!decision) {
      throw new AppError(404, 'Tech decision not found');
    }

    logger.info({ projectId, recId }, 'Tech decision deleted');
    res.json({ success: true, message: 'Technology decision removed' });
  } catch (error) {
    next(error);
  }
}

export async function getCompatibilityReport(
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

    const report = await checkTechCompatibility(project);
    res.json(report);
  } catch (error) {
    next(error);
  }
}
