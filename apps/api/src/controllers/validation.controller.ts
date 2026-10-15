import type { Request, Response, NextFunction } from 'express';
import { resolveValidationIssueSchema } from '@project-planner/schemas';
import { ValidationIssue } from '../models/ValidationIssue.js';
import { Project } from '../models/Project.js';
import { Message } from '../models/Message.js';
import { runValidationAudit } from '../services/validation.service.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../config/logger.js';
import { ValidationIssueStatus } from '@project-planner/types';

export async function getValidationIssues(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    const { status, type } = req.query;

    const query: Record<string, any> = { projectId };
    if (status) query['status'] = status;
    if (type) query['type'] = type;

    // Sort by severity (BLOCKING first) then createdAt
    const issues = await ValidationIssue.find(query).sort({
      status: 1,
      createdAt: -1,
    });

    res.json(issues);
  } catch (error) {
    next(error);
  }
}

export async function triggerValidation(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    const project = await Project.findById(projectId);
    if (!project) throw new AppError(404, 'Project not found');

    const messages = await Message.find({ projectId: project._id }).sort({ createdAt: 1 });
    await runValidationAudit(project, messages);

    const issues = await ValidationIssue.find({ projectId }).sort({ createdAt: -1 });
    res.json(issues);
  } catch (error) {
    next(error);
  }
}

export async function resolveValidationIssue(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    const issueId = String(req.params['issueId'] || '');
    const data = resolveValidationIssueSchema.parse(req.body);

    const issue = await ValidationIssue.findOne({ _id: issueId, projectId });
    if (!issue) {
      throw new AppError(404, 'Validation issue not found');
    }

    issue.status = data.status || ValidationIssueStatus.RESOLVED;
    if (data.chosenOption) {
      issue.resolutionNotes = data.resolutionNotes 
        ? `${data.resolutionNotes} (Chosen: ${data.chosenOption})` 
        : `Resolution selected: ${data.chosenOption}`;
    } else if (data.resolutionNotes) {
      issue.resolutionNotes = data.resolutionNotes;
    }

    await issue.save();
    logger.info({ projectId, issueId: issue.id, status: issue.status }, 'Validation issue resolved');
    res.json(issue);
  } catch (error) {
    next(error);
  }
}

export async function dismissValidationIssue(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    const issueId = String(req.params['issueId'] || '');

    const issue = await ValidationIssue.findOneAndUpdate(
      { _id: issueId, projectId },
      { $set: { status: ValidationIssueStatus.DISMISSED } },
      { new: true }
    );

    if (!issue) {
      throw new AppError(404, 'Validation issue not found');
    }

    logger.info({ projectId, issueId: issue.id }, 'Validation issue dismissed');
    res.json(issue);
  } catch (error) {
    next(error);
  }
}
