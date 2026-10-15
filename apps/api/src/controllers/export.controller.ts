import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ExportService } from '../services/export.service.js';
import { PdfService } from '../services/pdf.service.js';
import { Project } from '../models/Project.js';
import { createSpecVersionSchema } from '@project-planner/schemas';
import { AppError } from '../middleware/errorHandler.js';

/**
 * GET /api/projects/:id/export/pdf
 * Export professional multi-page PDF specification report
 */
export async function exportPdf(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError(400, 'Invalid project ID');
    }

    const project = await Project.findById(projectId);
    if (!project) {
      throw new AppError(404, 'Project not found');
    }

    const spec = await ExportService.generateMachineReadableSpec(projectId);
    const pdfBuffer = await PdfService.generatePdf(spec);

    const isInline = req.query['inline'] === 'true';
    const safeName = project.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const filename = `${safeName}-specification-${project.version || 'v1.0'}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader(
      'Content-Disposition',
      `${isInline ? 'inline' : 'attachment'}; filename="${filename}"`
    );

    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/projects/:id/export/json
 * Export complete machine-readable project-spec.json
 */
export async function exportJson(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError(400, 'Invalid project ID');
    }

    const project = await Project.findById(projectId);
    if (!project) {
      throw new AppError(404, 'Project not found');
    }

    const spec = await ExportService.generateMachineReadableSpec(projectId);

    const isDownload = req.query['download'] === 'true';
    if (isDownload) {
      const safeName = project.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      const filename = `${safeName}-spec-${project.version || 'v1.0'}.json`;
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/json');
    }

    res.json(spec);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/projects/:id/export/markdown
 * Export formatted specification in GitHub-flavored Markdown
 */
export async function exportMarkdown(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError(400, 'Invalid project ID');
    }

    const project = await Project.findById(projectId);
    if (!project) {
      throw new AppError(404, 'Project not found');
    }

    const includeMermaid = req.query['includeMermaid'] !== 'false';
    const markdown = await ExportService.generateMarkdownSpec(projectId, { includeMermaid });

    const isDownload = req.query['download'] === 'true';
    if (isDownload) {
      const safeName = project.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      const filename = `${safeName}-spec-${project.version || 'v1.0'}.md`;
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.send(markdown);
      return;
    }

    // Default JSON response for frontend consumption
    res.json({ markdown });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/projects/:id/export/bundle
 * Export modular markdown bundle (SPECIFICATION.md, ARCHITECTURE.md, TASKS.md, HUMAN_ACTIONS.md)
 */
export async function exportBundle(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError(400, 'Invalid project ID');
    }

    const bundle = await ExportService.generateModularMarkdownBundle(projectId);
    res.json({ files: bundle });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/projects/:id/versions
 * List all frozen specification versions
 */
export async function listVersions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError(400, 'Invalid project ID');
    }

    const versions = await ExportService.listVersions(projectId);
    res.json(versions);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/projects/:id/versions
 * Freeze and record a new specification version snapshot
 */
export async function createVersion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError(400, 'Invalid project ID');
    }

    const validatedInput = createSpecVersionSchema.parse(req.body);
    const createdBy = (req.body && req.body.createdBy) || 'Founder';

    const snapshot = await ExportService.createVersionSnapshot(
      projectId,
      validatedInput,
      createdBy
    );

    res.status(201).json(snapshot);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/projects/:id/versions/:versionId
 * Retrieve a specific version snapshot
 */
export async function getVersion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    const versionId = String(req.params['versionId'] || '');
    if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(versionId)) {
      throw new AppError(400, 'Invalid project ID or version ID');
    }

    const version = await ExportService.getVersion(projectId, versionId);
    res.json(version);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/projects/:id/versions/:versionId/export/json
 * Export frozen JSON spec for a specific historical version
 */
export async function exportVersionJson(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const projectId = String(req.params['id'] || '');
    const versionId = String(req.params['versionId'] || '');
    if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(versionId)) {
      throw new AppError(400, 'Invalid project ID or version ID');
    }

    const version = await ExportService.getVersion(projectId, versionId);
    const isDownload = req.query['download'] === 'true';
    if (isDownload) {
      const safeName = version.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      const filename = `${safeName}-${version.version}.json`;
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/json');
    }

    res.json(version.spec);
  } catch (error) {
    next(error);
  }
}
