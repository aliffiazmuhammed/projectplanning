import type { Request, Response, NextFunction } from 'express';
import { createProjectSchema, sendMessageSchema, updateProjectSchema } from '@project-planner/schemas';
import { ProjectStatus, DiscoveryPhase } from '@project-planner/types';
import { Project } from '../models/Project.js';
import { Message } from '../models/Message.js';
import { chat, getNextPhase } from '../services/gemini.service.js';
import { extractRequirementsFromConversation } from '../services/requirement.service.js';
import { runValidationAudit } from '../services/validation.service.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../config/logger.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export async function createProject(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = createProjectSchema.parse(req.body);
    const authUser = (req as AuthenticatedRequest).user;

    const project = await Project.create({
      name: data.name,
      initialIdea: data.initialIdea,
      description: data.description,
      targetPlatform: data.targetPlatform,
      status: ProjectStatus.DISCOVERY,
      discoveryPhase: DiscoveryPhase.GOALS,
      messageCount: 0,
      ownerId: authUser ? authUser.userId : undefined,
    });

    logger.info({ projectId: project.id, ownerId: authUser?.userId }, 'Project created');
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
}

export async function getProjects(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authUser = (req as AuthenticatedRequest).user;
    const query = authUser
      ? { $or: [{ ownerId: authUser.userId }, { ownerId: { $exists: false } }] }
      : {};
    const projects = await Project.find(query).sort({ updatedAt: -1 });
    res.json(projects);
  } catch (error) {
    next(error);
  }
}

export async function getProject(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authUser = (req as AuthenticatedRequest).user;
    const project = await Project.findById(req.params['id']);
    if (!project) throw new AppError(404, 'Project not found');

    if (project.ownerId && authUser && project.ownerId.toString() !== authUser.userId && authUser.role !== 'admin') {
      throw new AppError(403, 'You do not have permission to access this project');
    }

    res.json(project);
  } catch (error) {
    next(error);
  }
}

export async function updateProject(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authUser = (req as AuthenticatedRequest).user;
    const existing = await Project.findById(req.params['id']);
    if (!existing) throw new AppError(404, 'Project not found');

    if (existing.ownerId && authUser && existing.ownerId.toString() !== authUser.userId && authUser.role !== 'admin') {
      throw new AppError(403, 'You do not have permission to modify this project');
    }

    const data = updateProjectSchema.parse(req.body);
    const project = await Project.findByIdAndUpdate(
      req.params['id'],
      { $set: data },
      { new: true, runValidators: true },
    );
    logger.info({ projectId: project?.id, updates: data }, 'Project updated');
    res.json(project);
  } catch (error) {
    next(error);
  }
}

export async function sendMessage(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { content } = sendMessageSchema.parse(req.body);
    const projectId = req.params['id'];

    const authUser = (req as AuthenticatedRequest).user;
    const project = await Project.findById(projectId);
    if (!project) throw new AppError(404, 'Project not found');

    if (project.ownerId && authUser && project.ownerId.toString() !== authUser.userId && authUser.role !== 'admin') {
      throw new AppError(403, 'You do not have permission to access this project');
    }

    // Load full conversation history (for context management in service)
    const history = await Message.find({ projectId: project._id }).sort({ createdAt: 1 });

    // Call Gemini with context-managed history
    const { reply, phaseComplete, updatedSummary } = await chat(project, history, content);

    // Persist user message (tagged with current phase)
    const userMessage = await Message.create({
      projectId: project._id,
      role: 'user',
      content,
      phase: project.discoveryPhase,
    });

    // Persist assistant message
    const assistantMessage = await Message.create({
      projectId: project._id,
      role: 'assistant',
      content: reply,
      phase: project.discoveryPhase,
    });

    // Update project: increment counter, update summary, maybe advance phase
    const newMessageCount = project.messageCount + 2;
    const newPhase = phaseComplete ? getNextPhase(project.discoveryPhase) : project.discoveryPhase;
    const newStatus =
      newPhase === DiscoveryPhase.COMPLETE
        ? ProjectStatus.NEEDS_CLARIFICATION
        : project.status;

    await Project.findByIdAndUpdate(projectId, {
      $set: {
        messageCount: newMessageCount,
        ...(updatedSummary ? { conversationSummary: updatedSummary } : {}),
        ...(phaseComplete ? { discoveryPhase: newPhase, status: newStatus } : {}),
      },
    });

    // Run automated structured requirements extraction & validation audit concurrently
    let extractedCount = 0;
    let validationIssuesCount = 0;
    const updatedMessages = [...history, userMessage, assistantMessage];

    const [extractResult, valResult] = await Promise.allSettled([
      extractRequirementsFromConversation(project, updatedMessages),
      runValidationAudit(project, updatedMessages),
    ]);

    if (extractResult.status === 'fulfilled') {
      extractedCount = extractResult.value.length;
    } else {
      logger.warn({ err: extractResult.reason, projectId }, 'Automated requirements extraction skipped on this turn');
    }

    if (valResult.status === 'fulfilled') {
      validationIssuesCount = valResult.value.length;
    } else {
      logger.warn({ err: valResult.reason, projectId }, 'Automated validation audit skipped on this turn');
    }

    logger.info(
      { projectId, messageCount: newMessageCount, phase: newPhase, phaseComplete, extractedCount, validationIssuesCount },
      'Message exchange completed',
    );

    res.status(201).json({
      userMessage,
      assistantMessage,
      meta: {
        phase: newPhase,
        phaseAdvanced: phaseComplete,
        messageCount: newMessageCount,
        extractedCount,
        validationIssuesCount,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMessages(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authUser = (req as AuthenticatedRequest).user;
    const projectId = req.params['id'];
    const project = await Project.findById(projectId);
    if (!project) throw new AppError(404, 'Project not found');

    if (project.ownerId && authUser && project.ownerId.toString() !== authUser.userId && authUser.role !== 'admin') {
      throw new AppError(403, 'You do not have permission to access this project');
    }

    const messages = await Message.find({ projectId: project._id }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    next(error);
  }
}
