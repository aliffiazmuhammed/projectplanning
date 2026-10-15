import crypto from 'crypto';
import mongoose from 'mongoose';
import { Project } from '../models/Project.js';
import { PlanTask } from '../models/PlanTask.js';
import { EngineeringAgentHandoff } from '../models/EngineeringAgentHandoff.js';
import { ExportService } from './export.service.js';
import type {
  IEngineeringHandoffPackage,
  IEngineeringAgentHandoff,
  ITaskQueueItem,
  IPlanTask,
  IAgentFeedbackReport,
  AgentTaskExecutionStatus,
  InitializeHandoffRequest,
  ClaimTaskRequest,
  CompleteTaskRequest,
  FailTaskRequest,
  SubmitFeedbackRequest,
} from '@project-planner/types';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../config/logger.js';

export class AgentService {
  /**
   * Initializes or updates an autonomous Software Engineering Agent handoff package.
   */
  static async initializeHandoff(
    projectId: string,
    input?: InitializeHandoffRequest
  ): Promise<IEngineeringHandoffPackage> {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new AppError(404, 'Project not found');
    }

    // 1. Generate complete machine readable spec
    const spec = await ExportService.generateMachineReadableSpec(projectId);

    // 2. Compute SHA-256 Checksum for verification
    const specJson = JSON.stringify(spec);
    const specChecksum = crypto.createHash('sha256').update(specJson).digest('hex');

    // 3. Compute topological dependency queue
    const taskQueue = await this.getTaskQueue(projectId);

    // 4. Calculate progress stats
    const total = taskQueue.length;
    const completed = taskQueue.filter((q) => q.executionStatus === 'COMPLETED').length;
    const inProgress = taskQueue.filter((q) => q.executionStatus === 'IN_PROGRESS').length;
    const blocked = taskQueue.filter((q) => q.executionStatus === 'BLOCKED').length;
    const percentComplete = total > 0 ? Math.round((completed / total) * 100) : 0;

    const agentName = input?.agentName || 'Autonomous Software Engineering Agent';
    const handoffId = `handoff-${project._id.toString().slice(-6)}-${Date.now().toString(36)}`;

    // 5. Build specialized agent instructions
    const agentInstructions = this.generateAgentInstructions(spec, taskQueue);

    // 6. Build CLI execution snippet
    const cliExecutionSnippet = this.generateCliSnippet(project._id.toString());

    // 7. Upsert Handoff Document
    let handoff = await EngineeringAgentHandoff.findOne({ projectId: project._id });
    if (!handoff) {
      handoff = await EngineeringAgentHandoff.create({
        projectId: project._id,
        handoffId,
        specVersion: spec.metadata.specVersion || 'v1.0',
        specChecksum,
        status: percentComplete === 100 ? 'COMPLETED' : blocked > 0 ? 'BLOCKED' : inProgress > 0 ? 'IN_PROGRESS' : 'INITIALIZED',
        agentName,
        taskProgress: {
          total,
          completed,
          inProgress,
          blocked,
          percentComplete,
        },
        activityLog: [
          {
            action: 'HANDOFF_INITIALIZED',
            agentName,
            details: `Handoff initialized with ${total} tasks (${spec.requirements.length} IEEE requirements).`,
            timestamp: new Date().toISOString(),
          },
        ],
      });
    } else {
      handoff.specVersion = spec.metadata.specVersion || 'v1.0';
      handoff.specChecksum = specChecksum;
      handoff.agentName = agentName;
      handoff.taskProgress = {
        total,
        completed,
        inProgress,
        blocked,
        percentComplete,
      };
      handoff.status = percentComplete === 100 ? 'COMPLETED' : blocked > 0 ? 'BLOCKED' : inProgress > 0 ? 'IN_PROGRESS' : 'INITIALIZED';
      handoff.activityLog.push({
        action: 'HANDOFF_INITIALIZED',
        agentName,
        details: `Handoff re-synchronized with latest specification (${total} tasks).`,
        timestamp: new Date().toISOString(),
      });
      await handoff.save();
    }

    logger.info(
      { projectId, handoffId: handoff.handoffId, totalTasks: total },
      'Engineering agent handoff package generated'
    );

    return {
      handoff: handoff.toJSON() as unknown as IEngineeringAgentHandoff,
      spec,
      taskQueue,
      agentInstructions,
      cliExecutionSnippet,
    };
  }

  /**
   * Retrieves active handoff package or initializes if non-existent.
   */
  static async getHandoffPackage(projectId: string): Promise<IEngineeringHandoffPackage> {
    const handoff = await EngineeringAgentHandoff.findOne({ projectId });
    if (!handoff) {
      return this.initializeHandoff(projectId);
    }

    const spec = await ExportService.generateMachineReadableSpec(projectId);
    const taskQueue = await this.getTaskQueue(projectId);
    const agentInstructions = this.generateAgentInstructions(spec, taskQueue);
    const cliExecutionSnippet = this.generateCliSnippet(projectId);

    // Refresh progress counters
    const total = taskQueue.length;
    const completed = taskQueue.filter((q) => q.executionStatus === 'COMPLETED').length;
    const inProgress = taskQueue.filter((q) => q.executionStatus === 'IN_PROGRESS').length;
    const blocked = taskQueue.filter((q) => q.executionStatus === 'BLOCKED').length;
    const percentComplete = total > 0 ? Math.round((completed / total) * 100) : 0;

    handoff.taskProgress = {
      total,
      completed,
      inProgress,
      blocked,
      percentComplete,
    };
    await handoff.save();

    return {
      handoff: handoff.toJSON() as unknown as IEngineeringAgentHandoff,
      spec,
      taskQueue,
      agentInstructions,
      cliExecutionSnippet,
    };
  }

  /**
   * Computes dependency-ordered topological queue for coding agents.
   */
  static async getTaskQueue(projectId: string): Promise<ITaskQueueItem[]> {
    const tasks = await PlanTask.find({ projectId }).sort({ taskId: 1 });

    const completedIds = new Set(
      tasks.filter((t) => t.status === 'COMPLETED').map((t) => t.taskId)
    );

    // Map into queue items with dynamic execution status
    const queueItems: ITaskQueueItem[] = tasks.map((task, idx) => {
      const unmetDependencies = (task.dependencies || []).filter(
        (depId) => !completedIds.has(depId)
      );

      let executionStatus: AgentTaskExecutionStatus = 'TODO';
      if (task.status === 'COMPLETED') {
        executionStatus = 'COMPLETED';
      } else if (task.status === 'IN_PROGRESS') {
        executionStatus = 'IN_PROGRESS';
      } else if (task.status === 'BLOCKED') {
        executionStatus = 'BLOCKED';
      } else if (unmetDependencies.length === 0) {
        executionStatus = 'READY_TO_RUN';
      } else {
        executionStatus = 'TODO';
      }

      return {
        task: task.toJSON() as unknown as IPlanTask,
        executionStatus,
        unmetDependencies,
        orderIndex: idx,
      };
    });

    // Topological Priority Sorting:
    // 1. IN_PROGRESS
    // 2. READY_TO_RUN (fewer dependencies first)
    // 3. BLOCKED
    // 4. TODO
    // 5. COMPLETED
    const statusWeight: Record<AgentTaskExecutionStatus, number> = {
      IN_PROGRESS: 0,
      READY_TO_RUN: 1,
      BLOCKED: 2,
      TODO: 3,
      COMPLETED: 4,
    };

    queueItems.sort((a, b) => {
      const weightDiff = statusWeight[a.executionStatus] - statusWeight[b.executionStatus];
      if (weightDiff !== 0) return weightDiff;
      return a.unmetDependencies.length - b.unmetDependencies.length;
    });

    return queueItems.map((item, index) => ({
      ...item,
      orderIndex: index,
    }));
  }

  /**
   * Returns the next executable task whose dependencies are fully satisfied.
   */
  static async getNextExecutableTask(projectId: string): Promise<ITaskQueueItem | null> {
    const queue = await this.getTaskQueue(projectId);
    // Find currently in progress, or next ready to run
    const inProgress = queue.find((q) => q.executionStatus === 'IN_PROGRESS');
    if (inProgress) return inProgress;

    const nextReady = queue.find((q) => q.executionStatus === 'READY_TO_RUN');
    return nextReady || null;
  }

  /**
   * Software engineering agent claims and begins work on a task.
   */
  static async claimTask(
    projectId: string,
    taskId: string,
    input?: ClaimTaskRequest
  ): Promise<IPlanTask> {
    const task = await PlanTask.findOne({ projectId, taskId });
    if (!task) {
      throw new AppError(404, `Task ${taskId} not found`);
    }

    const agentName = input?.agentName || 'Autonomous Software Engineering Agent';
    task.status = 'IN_PROGRESS';
    task.assignedAgent = agentName;
    await task.save();

    // Log in handoff
    const handoff = await EngineeringAgentHandoff.findOne({ projectId });
    if (handoff) {
      handoff.status = 'IN_PROGRESS';
      handoff.activityLog.push({
        action: 'TASK_STARTED',
        taskId,
        agentName,
        details: `Agent claimed task [${taskId}] "${task.title}". Execution in progress.`,
        timestamp: new Date().toISOString(),
      });
      await handoff.save();
    }

    logger.info({ projectId, taskId, agentName }, 'Engineering agent claimed task');
    return task.toJSON() as unknown as IPlanTask;
  }

  /**
   * Software engineering agent marks task complete with implementation artifacts.
   */
  static async completeTask(
    projectId: string,
    taskId: string,
    input?: CompleteTaskRequest
  ): Promise<IPlanTask> {
    const task = await PlanTask.findOne({ projectId, taskId });
    if (!task) {
      throw new AppError(404, `Task ${taskId} not found`);
    }

    const agentName = input?.agentName || task.assignedAgent || 'Autonomous Software Engineering Agent';
    task.status = 'COMPLETED';
    if (input?.notes) {
      task.notes = input.notes;
    }
    await task.save();

    // Log in handoff and update progress
    const handoff = await EngineeringAgentHandoff.findOne({ projectId });
    if (handoff) {
      const filesMsg = input?.filesModified?.length 
        ? ` Modified files: ${input.filesModified.join(', ')}.` 
        : '';
      const notesMsg = input?.notes ? ` Notes: ${input.notes}` : '';

      handoff.activityLog.push({
        action: 'TASK_COMPLETED',
        taskId,
        agentName,
        details: `Task [${taskId}] completed.${filesMsg}${notesMsg}`,
        timestamp: new Date().toISOString(),
      });

      // Refresh task progress
      const queue = await this.getTaskQueue(projectId);
      const total = queue.length;
      const completed = queue.filter((q) => q.executionStatus === 'COMPLETED').length;
      const inProgress = queue.filter((q) => q.executionStatus === 'IN_PROGRESS').length;
      const blocked = queue.filter((q) => q.executionStatus === 'BLOCKED').length;

      handoff.taskProgress = {
        total,
        completed,
        inProgress,
        blocked,
        percentComplete: total > 0 ? Math.round((completed / total) * 100) : 0,
      };

      if (completed === total && total > 0) {
        handoff.status = 'COMPLETED';
      }

      await handoff.save();
    }

    logger.info({ projectId, taskId, agentName }, 'Engineering agent completed task');
    return task.toJSON() as unknown as IPlanTask;
  }

  /**
   * Software engineering agent reports a task blocker or failure.
   */
  static async failTask(
    projectId: string,
    taskId: string,
    input: FailTaskRequest
  ): Promise<IPlanTask> {
    const task = await PlanTask.findOne({ projectId, taskId });
    if (!task) {
      throw new AppError(404, `Task ${taskId} not found`);
    }

    const agentName = input.agentName || task.assignedAgent || 'Autonomous Software Engineering Agent';
    task.status = 'BLOCKED';
    task.notes = `BLOCKED: ${input.reason}${input.errorDetails ? ` | ${input.errorDetails}` : ''}`;
    await task.save();

    // Log in handoff and record feedback
    const handoff = await EngineeringAgentHandoff.findOne({ projectId });
    if (handoff) {
      handoff.status = 'BLOCKED';
      handoff.activityLog.push({
        action: 'TASK_FAILED',
        taskId,
        agentName,
        details: `Task [${taskId}] blocked: ${input.reason}`,
        timestamp: new Date().toISOString(),
      });

      handoff.feedbackReports.push({
        taskId,
        type: 'CODE_ERROR',
        message: input.reason,
        suggestedRemedy: input.errorDetails,
        resolved: false,
        timestamp: new Date().toISOString(),
      });

      await handoff.save();
    }

    logger.warn({ projectId, taskId, reason: input.reason }, 'Engineering agent failed task');
    return task.toJSON() as unknown as IPlanTask;
  }

  /**
   * Submits structured feedback or clarification requests from the coding agent.
   */
  static async submitFeedback(
    projectId: string,
    input: SubmitFeedbackRequest
  ): Promise<IAgentFeedbackReport> {
    const handoff = await EngineeringAgentHandoff.findOne({ projectId });
    if (!handoff) {
      throw new AppError(404, 'Handoff record not found');
    }

    const report = {
      taskId: input.taskId,
      type: input.type,
      message: input.message,
      suggestedRemedy: input.suggestedRemedy,
      resolved: false,
      timestamp: new Date().toISOString(),
    };

    handoff.feedbackReports.push(report);
    handoff.activityLog.push({
      action: 'FEEDBACK_SUBMITTED',
      taskId: input.taskId,
      agentName: handoff.agentName,
      details: `[${input.type}] ${input.message}`,
      timestamp: new Date().toISOString(),
    });
    await handoff.save();

    const created = handoff.feedbackReports[handoff.feedbackReports.length - 1];
    return ((created as any)?.toJSON ? (created as any).toJSON() : created) as unknown as IAgentFeedbackReport;
  }

  /**
   * Generates targeted system prompt instructions for autonomous engineering agents.
   */
  private static generateAgentInstructions(spec: any, taskQueue: ITaskQueueItem[]): string {
    const readyTasks = taskQueue.filter((q) => q.executionStatus === 'READY_TO_RUN');

    return `# Autonomous Software Engineering Agent Instructions

You are the Autonomous Software Engineering Agent implementing **${spec.project.name}**.
Your single source of truth is \`project-spec.json\`. Do NOT reinvent or rediscover product requirements.

## 1. Execution Directives
- **Strict Compliance:** Implement features strictly as documented in functional requirements and acceptance criteria.
- **Dependency Discipline:** Execute tasks in topological queue order. Do not start a task before prerequisites are verified.
- **Zero Mock Policy:** Where database models or APIs are defined, build complete operational implementations with schema validation.
- **Zero Secret Exposure:** Never write secret API keys or credentials directly into code or commit history. Use environment variables defined in \`.env.example\`.
- **Test-Driven Acceptance:** Each task has defined test cases. Implement unit/integration tests and verify they pass before marking tasks completed.

## 2. Target Architecture
- **Target Platform:** ${spec.project.targetPlatform || 'Web Application'}
- **Tech Stack:**
${spec.technology.map((t: any) => `  - **${t.category}:** ${t.technology} (${t.version || 'Latest LTS'})`).join('\n')}

## 3. Current Queue Status
- **Total Tasks:** ${taskQueue.length}
- **Immediately Ready to Code:** ${readyTasks.length} tasks (${readyTasks.map((t) => t.task.taskId).join(', ') || 'None'})

## 4. API Endpoints to Synchronize Execution
- Get Next Task: \`GET /api/projects/${spec.project.id}/agent/next-task\`
- Claim Task: \`POST /api/projects/${spec.project.id}/agent/tasks/:taskId/claim\`
- Mark Task Complete: \`POST /api/projects/${spec.project.id}/agent/tasks/:taskId/complete\`
- Report Blocker / Failure: \`POST /api/projects/${spec.project.id}/agent/tasks/:taskId/fail\`
`;
  }

  /**
   * Generates curl snippet for automated agent integration.
   */
  private static generateCliSnippet(projectId: string): string {
    return `# Fetch next executable task
curl -X GET "http://localhost:3001/api/projects/${projectId}/agent/next-task"

# Claim task TASK-001
curl -X POST "http://localhost:3001/api/projects/${projectId}/agent/tasks/TASK-001/claim" \\
  -H "Content-Type: application/json" \\
  -d '{"agentName": "Autonomous Coding Agent"}'

# Mark task TASK-001 complete
curl -X POST "http://localhost:3001/api/projects/${projectId}/agent/tasks/TASK-001/complete" \\
  -H "Content-Type: application/json" \\
  -d '{"agentName": "Autonomous Coding Agent", "notes": "Implementation verified against test cases", "testsPassed": true}'
`;
  }
}
