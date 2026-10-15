import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import {
  updateDesignSpecSchema,
  analyzeImageSchema,
  createScreenSpecSchema,
  updateScreenSpecSchema,
} from '@project-planner/schemas';
import { Project } from '../models/Project.js';
import { ScreenSpec } from '../models/ScreenSpec.js';
import {
  analyzeReferenceImage,
  generateScreenSpecsFromRequirements,
} from '../services/ux.service.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../config/logger.js';
import { VisualThemeCategory } from '@project-planner/types';

export async function getDesignSpec(
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

    res.json(project.designSpec || {});
  } catch (error) {
    next(error);
  }
}

export async function updateDesignSpec(
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

    const data = updateDesignSpecSchema.parse(req.body);

    if (!project.designSpec) {
      project.designSpec = {} as any;
    }

    if (data.visualCategory !== undefined) project.designSpec!.visualCategory = data.visualCategory;
    if (data.themeMode !== undefined) project.designSpec!.themeMode = data.themeMode;
    if (data.visualDensity !== undefined) project.designSpec!.visualDensity = data.visualDensity;

    if (data.colorPalette) {
      project.designSpec!.colorPalette = {
        ...project.designSpec!.colorPalette,
        ...data.colorPalette,
      };
    }

    if (data.typography) {
      project.designSpec!.typography = {
        ...project.designSpec!.typography,
        ...data.typography,
      };
    }

    if (data.observedInsights) {
      project.designSpec!.observedInsights = data.observedInsights;
    }

    await project.save();
    logger.info({ projectId }, 'Design specification updated');
    res.json(project.designSpec);
  } catch (error) {
    next(error);
  }
}

export async function analyzeImage(
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

    const data = analyzeImageSchema.parse(req.body);
    const analysis = await analyzeReferenceImage(data.imageBase64, data.mimeType, project);

    if (!project.designSpec) {
      project.designSpec = {} as any;
    }

    // Update design spec with vision findings
    if (project.designSpec!.visualCategory === VisualThemeCategory.AGENT_DECIDE || !project.designSpec!.visualCategory) {
      project.designSpec!.visualCategory = analysis.suggestedCategory;
    }

    project.designSpec!.colorPalette = {
      ...project.designSpec!.colorPalette,
      ...analysis.colorPalette,
    };

    project.designSpec!.typography = {
      ...project.designSpec!.typography,
      ...analysis.typography,
    };

    project.designSpec!.visualDensity = analysis.visualDensity;

    const existingInsights = project.designSpec!.observedInsights || [];
    const newInsights = [...analysis.observedFromReference, ...analysis.agentRecommendations];
    project.designSpec!.observedInsights = Array.from(new Set([...existingInsights, ...newInsights]));

    // Append reference image record
    const refImages = project.designSpec!.referenceImages || [];
    // Store image preview dataUrl safely
    const previewDataUrl = data.imageBase64.startsWith('data:') 
      ? data.imageBase64 
      : `data:${data.mimeType};base64,${data.imageBase64}`;

    refImages.push({
      name: data.fileName || `Reference ${refImages.length + 1}`,
      dataUrl: previewDataUrl,
      analysis: analysis.summary,
      uploadedAt: new Date().toISOString(),
    } as any);
    project.designSpec!.referenceImages = refImages;

    await project.save();
    logger.info({ projectId }, 'Reference image analyzed and saved to project design spec');

    res.json({
      analysis,
      designSpec: project.designSpec,
    });
  } catch (error) {
    next(error);
  }
}

export async function getScreens(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError(400, 'Invalid project ID');
    }

    const screens = await ScreenSpec.find({ projectId }).sort({ createdAt: 1 });
    res.json(screens);
  } catch (error) {
    next(error);
  }
}

export async function createScreen(
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

    const data = createScreenSpecSchema.parse(req.body);

    const screen = await ScreenSpec.create({
      projectId: project._id,
      ...data,
    });

    logger.info({ projectId, screenId: screen.id, name: screen.name }, 'Screen spec created');
    res.status(201).json(screen);
  } catch (error) {
    next(error);
  }
}

export async function updateScreen(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    const screenId = String(req.params['screenId'] || '');

    if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(screenId)) {
      throw new AppError(400, 'Invalid project or screen ID');
    }

    const data = updateScreenSpecSchema.parse(req.body);

    const screen = await ScreenSpec.findOneAndUpdate(
      { _id: screenId, projectId },
      { $set: data },
      { new: true, runValidators: true },
    );

    if (!screen) {
      throw new AppError(404, 'Screen spec not found');
    }

    logger.info({ projectId, screenId }, 'Screen spec updated');
    res.json(screen);
  } catch (error) {
    next(error);
  }
}

export async function deleteScreen(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    const screenId = String(req.params['screenId'] || '');

    if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(screenId)) {
      throw new AppError(400, 'Invalid project or screen ID');
    }

    const screen = await ScreenSpec.findOneAndDelete({ _id: screenId, projectId });
    if (!screen) {
      throw new AppError(404, 'Screen spec not found');
    }

    logger.info({ projectId, screenId }, 'Screen spec deleted');
    res.json({ success: true, message: 'Screen spec removed successfully' });
  } catch (error) {
    next(error);
  }
}

export async function generateScreens(
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

    await generateScreenSpecsFromRequirements(project);

    const allScreens = await ScreenSpec.find({ projectId }).sort({ createdAt: 1 });
    res.json(allScreens);
  } catch (error) {
    next(error);
  }
}
