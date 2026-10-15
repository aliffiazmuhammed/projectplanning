import { logger } from '../config/logger.js';
import { ImplementationPlan, type ImplementationPlanDocument } from '../models/ImplementationPlan.js';
import { PlanTask, type PlanTaskDocument } from '../models/PlanTask.js';
import { Project } from '../models/Project.js';
import { Requirement } from '../models/Requirement.js';
import { ScreenSpec } from '../models/ScreenSpec.js';
import { TechDecision } from '../models/TechDecision.js';
import { ArchitecturePlan } from '../models/ArchitecturePlan.js';
import { DatabaseEntity } from '../models/DatabaseEntity.js';
import { ApiEndpoint } from '../models/ApiEndpoint.js';
import { ThirdPartyIntegration } from '../models/ThirdPartyIntegration.js';
import { HumanAction } from '../models/HumanAction.js';
import type {
  IPlanRoadmapPhase,
  IPlanMilestone,
  IPlanFeature,
  IPlanUserStory,
  IPlanTask,
  CreateTaskRequest,
  UpdateTaskRequest,
  UpdateImplementationPlanRequest,
  TaskStatus,
  TaskType,
  TaskPriority,
  TaskComplexity,
} from '@project-planner/types';
import { AiProvider } from './ai.provider.js';

interface RawPlanDecomposition {
  summary: string;
  roadmap: IPlanRoadmapPhase[];
  milestones: IPlanMilestone[];
  features: IPlanFeature[];
  userStories: IPlanUserStory[];
  totalEstimatedHours?: number;
}

interface RawTaskItem {
  taskId?: string;
  storyId?: string;
  featureId?: string;
  milestoneId?: string;
  phaseId?: string;
  title: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  complexity: TaskComplexity;
  dependencies: string[];
  affectedComponents: string[];
  subtasks: string[];
  acceptanceCriteria: string[];
  testCases: string[];
  assignedAgent?: string;
}

const ROADMAP_DECOMPOSITION_PROMPT = `You are a Principal Technical Program Manager & Lead Software Architect.
Decompose the software project into a comprehensive execution hierarchy:
Roadmap (Phases) -> Milestones -> Features (Epics) -> User Stories.

Structure requirements:
1. Roadmap: 3 to 5 logical phases (e.g., Phase 1: Foundation & Auth, Phase 2: Core Domain & Data Flow, Phase 3: User Interface & Experience, Phase 4: Integrations & Polishing).
2. Milestones: 4 to 8 milestones with explicit deliverables and pass criteria.
3. Features: Derived directly from the project requirements and UX screens. Link each feature to requirementIds (e.g. ["FR-001", "FR-002"]) and screenRoutes.
4. User Stories: Standard agile format: role ("As a <role>"), want ("I want <action/capability>"), benefit ("so that <outcome/value>"), and acceptanceCriteria.

Return a JSON object matching this schema:
{
  "summary": "High-level implementation strategy and sequence overview...",
  "totalEstimatedHours": 160,
  "roadmap": [
    {
      "id": "PHASE-1",
      "name": "Phase 1: Foundation, Infrastructure & Auth",
      "description": "Scaffold monorepo, database models, session management, and auth API.",
      "order": 1,
      "targetDuration": "2 weeks",
      "deliverables": ["Database schemas", "User auth endpoints", "Base UI layout"]
    }
  ],
  "milestones": [
    {
      "id": "M1",
      "phaseId": "PHASE-1",
      "title": "System Topology & Core Data Models",
      "description": "Establish monorepo packages, Mongoose schemas, and database migrations.",
      "order": 1,
      "status": "PLANNED",
      "criteria": ["Database connects cleanly", "User and Entity models instantiated", "Seed scripts run"]
    }
  ],
  "features": [
    {
      "id": "FEAT-001",
      "milestoneId": "M1",
      "title": "User Authentication & RBAC",
      "description": "Registration, login, password hashing, and role checks.",
      "requirementIds": ["FR-001"],
      "screenRoutes": ["/login", "/register"]
    }
  ],
  "userStories": [
    {
      "id": "US-001",
      "featureId": "FEAT-001",
      "role": "New User",
      "want": "register with my email address and a secure password",
      "benefit": "I can create an account to access the planning workspace",
      "acceptanceCriteria": [
        "Email format must be validated",
        "Passwords must be hashed using argon2 or bcrypt",
        "Duplicate emails return HTTP 409 conflict",
        "Successful registration returns HTTP 201 with auth token"
      ]
    }
  ]
}`;

const TASKS_DECOMPOSITION_PROMPT = `You are a Principal Lead Engineer.
Generate an implementation-ready task plan for an AUTONOMOUS CODING AGENT.
Every task must be granular, logically sequenced, and directly executable by a coding agent without ambiguity.

CRITICAL TASK REQUIREMENTS (Specification Sections 24 & 25):
For EVERY task specify:
- taskId: Sequential ID (TASK-001, TASK-002, etc.)
- title: Action-oriented verb phrase (e.g. "Implement user registration API", "Build responsive navigation sidebar")
- description: Detailed context and exact technical objectives
- type: 'BACKEND' | 'FRONTEND' | 'DATABASE' | 'DEVOPS' | 'TESTING' | 'INTEGRATION' | 'SECURITY' | 'FULLSTACK'
- priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
- complexity: 'XS' | 'S' | 'M' | 'L' | 'XL'
- dependencies: Task IDs that must be completed before this task can start (e.g. ["TASK-001"])
- affectedComponents: Array of specific source code file paths to create or modify (e.g. ["apps/api/src/controllers/auth.controller.ts", "apps/web/src/pages/LoginPage.tsx"])
- subtasks: Ordered step-by-step checklist of atomic code actions (e.g. ["1. Create Mongoose model", "2. Add zod request validation schema", "3. Implement controller handler", "4. Register route in Express router"])
- acceptanceCriteria: Verifiable list of checklist conditions that define task completion
- testCases: Concrete test scenarios (e.g. ["Test successful registration with valid inputs", "Test duplicate email rejection with HTTP 409", "Test missing fields rejection with HTTP 400"])
- assignedAgent: Specialty agent role (e.g. "Backend Specialist", "Frontend Specialist", "Database Modeler")

Return a JSON array of task objects:
[
  {
    "taskId": "TASK-001",
    "title": "Implement User Database Schema & Mongoose Model",
    "description": "Define User schema with email, password hash, role, and timestamp fields.",
    "type": "DATABASE",
    "priority": "CRITICAL",
    "complexity": "S",
    "dependencies": [],
    "affectedComponents": ["packages/types/src/project.ts", "apps/api/src/models/User.ts"],
    "subtasks": [
      "Define TypeScript interface IUser in @project-planner/types",
      "Create Mongoose schema with email index and passwordHash field",
      "Add toJSON serialization transform stripping __v and passwordHash"
    ],
    "acceptanceCriteria": [
      "User model compiles without TypeScript errors",
      "Email field has unique index",
      "Password hash is hidden in toJSON output"
    ],
    "testCases": [
      "Verify User document creation in MongoDB test database",
      "Verify duplicate email error on duplicate insert"
    ],
    "assignedAgent": "Database Modeler"
  }
]`;

export class PlanService {
  /**
   * Get the current implementation plan, all tasks, and execution metrics.
   */
  static async getImplementationPlan(projectId: string) {
    const [plan, tasks] = await Promise.all([
      ImplementationPlan.findOne({ projectId }),
      PlanTask.find({ projectId }).sort({ taskId: 1 }),
    ]);

    // Build completed task set for dependency resolution
    const completedTaskIds = new Set(
      tasks.filter((t) => t.status === 'COMPLETED').map((t) => t.taskId),
    );

    // Identify executable tasks (status is TODO, and all dependencies are completed)
    const executableTasks = tasks.filter((t) => {
      if (t.status !== 'TODO') return false;
      if (!t.dependencies || t.dependencies.length === 0) return true;
      return t.dependencies.every((dep) => completedTaskIds.has(dep));
    });

    const stats = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter((t) => t.status === 'COMPLETED').length,
      inProgressTasks: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
      blockedTasks: tasks.filter((t) => t.status === 'BLOCKED').length,
      todoTasks: tasks.filter((t) => t.status === 'TODO').length,
      executableTasksCount: executableTasks.length,
      totalRoadmapPhases: plan?.roadmap?.length || 0,
      totalMilestones: plan?.milestones?.length || 0,
      totalFeatures: plan?.features?.length || 0,
      totalUserStories: plan?.userStories?.length || 0,
      totalEstimatedHours: plan?.totalEstimatedHours || 0,
      byType: {
        BACKEND: tasks.filter((t) => t.type === 'BACKEND').length,
        FRONTEND: tasks.filter((t) => t.type === 'FRONTEND').length,
        DATABASE: tasks.filter((t) => t.type === 'DATABASE').length,
        DEVOPS: tasks.filter((t) => t.type === 'DEVOPS').length,
        TESTING: tasks.filter((t) => t.type === 'TESTING').length,
        INTEGRATION: tasks.filter((t) => t.type === 'INTEGRATION').length,
        SECURITY: tasks.filter((t) => t.type === 'SECURITY').length,
        FULLSTACK: tasks.filter((t) => t.type === 'FULLSTACK').length,
      },
    };

    return {
      plan,
      tasks,
      stats,
      executableTaskIds: executableTasks.map((t) => t.taskId),
    };
  }

  /**
   * Run Gemini generation to decompose requirements, architecture, and tech stack
   * into Roadmap, Milestones, Features, User Stories, and granular Coding Agent Tasks.
   */
  static async generateImplementationPlan(projectId: string) {
    const project = await Project.findById(projectId);
    if (!project) throw new Error('Project not found');

    const [
      requirements,
      screens,
      techStack,
      architecturePlan,
      entities,
      endpoints,
      integrations,
      humanActions,
    ] = await Promise.all([
      Requirement.find({ projectId: project._id }),
      ScreenSpec.find({ projectId: project._id }),
      TechDecision.find({ projectId: project._id }),
      ArchitecturePlan.findOne({ projectId: project._id }),
      DatabaseEntity.find({ projectId: project._id }),
      ApiEndpoint.find({ projectId: project._id }),
      ThirdPartyIntegration.find({ projectId: project._id }),
      HumanAction.find({ projectId: project._id }),
    ]);

    const reqsText = requirements
      .map((r) => `[${r.reqId}] (${r.type} - ${r.priority}): ${r.title ? r.title + ': ' : ''}${r.description}`)
      .join('\n');

    const screensText = screens
      .map((s) => `Screen: ${s.name} (${s.route}) - Layout: ${s.layout} - APIs: ${s.apiDependencies?.join(', ') || 'N/A'}`)
      .join('\n');

    const techText = techStack
      .map((t) => `${t.category}: ${t.technology}`)
      .join('\n');

    const entitiesText = entities
      .map((e) => `Entity: ${e.name} (${e.tableNameOrCollection}) - Fields: ${e.fields.map((f) => f.name).join(', ')}`)
      .join('\n');

    const endpointsText = endpoints
      .map((ep) => `${ep.method} ${ep.route} - ${ep.summary}`)
      .join('\n');

    const integrationsText = integrations
      .map((i) => `Integration: ${i.service} (${i.category}) - ${i.purpose}`)
      .join('\n');

    const humanActionsText = humanActions
      .map((ha) => `[${ha.actionId}] ${ha.title} (${ha.blockingStatus})`)
      .join('\n');

    const context = `Project: "${project.name}"
Initial Idea: "${project.initialIdea}"
Target Platform: "${project.targetPlatform || 'Web'}"

Technology Choices:
${techText || 'Node.js, Express, React, TypeScript, MongoDB'}

Requirements:
${reqsText || 'Standard MVP functionality'}

Frontend Screens:
${screensText || 'Dashboard and management interface'}

Database Entities:
${entitiesText || 'Users and core records'}

API Endpoints:
${endpointsText || 'Standard REST CRUD endpoints'}

Third-Party Integrations:
${integrationsText || 'None'}

Human Action Prerequisites:
${humanActionsText || 'None'}`;

    // Run parallel Important Task AI decomposition for Roadmap/Milestones and Tasks (Gemini primary, Groq fallback)
    const [roadmapResult, tasksResult] = await Promise.all([
      AiProvider.importantJson<any>({ prompt: `${context}\n\n${ROADMAP_DECOMPOSITION_PROMPT}` }),
      AiProvider.importantJson<any>({ prompt: `${context}\n\n${TASKS_DECOMPOSITION_PROMPT}` }),
    ]);

    // Parse Roadmap Decomposition
    let rawPlan: RawPlanDecomposition = {
      summary: '',
      roadmap: [],
      milestones: [],
      features: [],
      userStories: [],
      totalEstimatedHours: 120,
    };
    try {
      const parsed = roadmapResult.data;
      rawPlan = parsed || rawPlan;
    } catch (err) {
      logger.error({ err }, 'Failed to parse roadmap decomposition JSON via AI');
    }

    // Upsert ImplementationPlan
    const plan = await ImplementationPlan.findOneAndUpdate(
      { projectId: project._id },
      {
        $set: {
          summary: rawPlan.summary || `Implementation plan for ${project.name}`,
          roadmap: rawPlan.roadmap || [],
          milestones: rawPlan.milestones || [],
          features: rawPlan.features || [],
          userStories: rawPlan.userStories || [],
          totalEstimatedHours: rawPlan.totalEstimatedHours || 120,
        },
      },
      { upsert: true, new: true, runValidators: true },
    );

    // Parse Tasks
    let rawTasks: RawTaskItem[] = [];
    try {
      const parsed = tasksResult.data;
      rawTasks = Array.isArray(parsed) ? parsed : parsed?.tasks || [];
    } catch (err) {
      logger.error({ err }, 'Failed to parse tasks decomposition JSON via AI');
    }

    // Determine task counter
    const existingTasks = await PlanTask.find({ projectId: project._id });
    let maxCounter = existingTasks.reduce((max, t) => {
      const match = t.taskId?.match(/TASK-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);

    for (const item of rawTasks) {
      if (!item.title) continue;

      let taskId = item.taskId;
      if (!taskId || !taskId.startsWith('TASK-')) {
        maxCounter += 1;
        taskId = `TASK-${String(maxCounter).padStart(3, '0')}`;
      }

      const existing = await PlanTask.findOne({
        projectId: project._id,
        $or: [{ taskId }, { title: item.title }],
      });

      if (existing) {
        existing.title = item.title;
        existing.description = item.description || existing.description;
        existing.type = item.type || existing.type;
        existing.priority = item.priority || existing.priority;
        existing.complexity = item.complexity || existing.complexity;
        existing.dependencies = item.dependencies || existing.dependencies;
        existing.affectedComponents = item.affectedComponents || existing.affectedComponents;
        existing.subtasks = item.subtasks || existing.subtasks;
        existing.acceptanceCriteria = item.acceptanceCriteria || existing.acceptanceCriteria;
        existing.testCases = item.testCases || existing.testCases;
        existing.assignedAgent = item.assignedAgent || existing.assignedAgent;
        await existing.save();
      } else {
        await PlanTask.create({
          projectId: project._id,
          taskId,
          storyId: item.storyId,
          featureId: item.featureId,
          milestoneId: item.milestoneId,
          phaseId: item.phaseId,
          title: item.title,
          description: item.description,
          type: item.type || 'FULLSTACK',
          priority: item.priority || 'MEDIUM',
          complexity: item.complexity || 'M',
          status: 'TODO',
          dependencies: item.dependencies || [],
          affectedComponents: item.affectedComponents || [],
          subtasks: item.subtasks || ['1. Implement task logic', '2. Verify acceptance criteria'],
          acceptanceCriteria: item.acceptanceCriteria || ['Task fulfills stated requirements'],
          testCases: item.testCases || ['Verify functionality via automated tests'],
          assignedAgent: item.assignedAgent || 'Fullstack Coding Agent',
        });
      }
    }

    return this.getImplementationPlan(projectId);
  }

  /**
   * Update top-level implementation plan details.
   */
  static async updateImplementationPlan(
    projectId: string,
    input: UpdateImplementationPlanRequest,
  ) {
    const plan = await ImplementationPlan.findOneAndUpdate(
      { projectId },
      { $set: input },
      { new: true, runValidators: true },
    );
    if (!plan) throw new Error('Implementation plan not found');
    return plan;
  }

  /**
   * Create a manual coding agent task.
   */
  static async createTask(projectId: string, input: CreateTaskRequest) {
    let taskId = input.taskId;
    if (!taskId) {
      const count = await PlanTask.countDocuments({ projectId });
      taskId = `TASK-${String(count + 1).padStart(3, '0')}`;
    }

    const task = await PlanTask.create({
      projectId,
      ...input,
      taskId,
    });
    return task;
  }

  /**
   * Update an existing task.
   */
  static async updateTask(taskId: string, input: UpdateTaskRequest) {
    const task = await PlanTask.findByIdAndUpdate(
      taskId,
      { $set: input },
      { new: true, runValidators: true },
    );
    if (!task) throw new Error('Task not found');
    return task;
  }

  /**
   * Update task status (e.g. TODO -> IN_PROGRESS -> COMPLETED).
   */
  static async updateTaskStatus(taskId: string, status: TaskStatus, notes?: string) {
    const update: Record<string, any> = { status };
    if (notes !== undefined) update.notes = notes;

    const task = await PlanTask.findByIdAndUpdate(taskId, { $set: update }, { new: true });
    if (!task) throw new Error('Task not found');
    return task;
  }

  /**
   * Delete a task.
   */
  static async deleteTask(taskId: string) {
    const result = await PlanTask.findByIdAndDelete(taskId);
    if (!result) throw new Error('Task not found');
    return { success: true };
  }

  /**
   * Export the complete Machine-Readable Project Specification (project-spec.json)
   * conforming strictly to Specification Section 26 & 27.
   */
  static async exportMachineReadableSpec(projectId: string) {
    const project = await Project.findById(projectId);
    if (!project) throw new Error('Project not found');

    const [
      requirements,
      screens,
      techStack,
      architecturePlan,
      entities,
      endpoints,
      integrations,
      humanActions,
      implementationPlan,
      tasks,
    ] = await Promise.all([
      Requirement.find({ projectId: project._id }),
      ScreenSpec.find({ projectId: project._id }),
      TechDecision.find({ projectId: project._id }),
      ArchitecturePlan.findOne({ projectId: project._id }),
      DatabaseEntity.find({ projectId: project._id }),
      ApiEndpoint.find({ projectId: project._id }),
      ThirdPartyIntegration.find({ projectId: project._id }),
      HumanAction.find({ projectId: project._id }),
      ImplementationPlan.findOne({ projectId: project._id }),
      PlanTask.find({ projectId: project._id }).sort({ taskId: 1 }),
    ]);

    const spec = {
      project: {
        id: project._id.toString(),
        name: project.name,
        initialIdea: project.initialIdea,
        description: project.description,
        targetPlatform: project.targetPlatform,
        discoveryPhase: project.discoveryPhase,
        status: project.status,
      },
      goals: [project.initialIdea],
      requirements: requirements.map((r) => ({
        reqId: r.reqId,
        title: r.title,
        description: r.description,
        type: r.type,
        priority: r.priority,
        status: r.status,
        confidence: r.confidence,
        dependencies: r.dependencies,
      })),
      screens: screens.map((s) => ({
        name: s.name,
        route: s.route,
        purpose: s.purpose,
        targetRoles: s.targetRoles,
        layout: s.layout,
        components: s.components,
        responsiveBehavior: s.responsiveBehavior,
        states: s.states,
        apiDependencies: s.apiDependencies,
        authRequired: s.authRequired,
      })),
      technology: techStack.map((t) => ({
        category: t.category,
        technology: t.technology,
        version: t.versionConsidered,
        technicalRationale: t.technicalRationale,
        plainLanguageExplanation: t.plainLanguageExplanation,
        status: t.status,
      })),

      architecture: architecturePlan
        ? {
            systemOverview: architecturePlan.systemOverview,
            frontendArchitecture: architecturePlan.frontendArchitecture,
            backendArchitecture: architecturePlan.backendArchitecture,
            security: architecturePlan.security,
            deployment: architecturePlan.deployment,
          }
        : null,
      database: {
        entities: entities.map((e) => ({
          name: e.name,
          collection: e.tableNameOrCollection,
          description: e.description,
          fields: e.fields,
          relationships: e.relationships,
          indexes: e.indexes,
          ownership: e.ownershipNotes,
          seedRequirements: e.seedRequirements,
        })),
      },
      api: {
        endpoints: endpoints.map((ep) => ({
          method: ep.method,
          route: ep.route,
          summary: ep.summary,
          authentication: ep.authentication,
          requiredRoles: ep.requiredRoles,
          parameters: ep.parameters,
          requestBodySchema: ep.requestBodySchema,
          responses: ep.responses,
          rateLimit: ep.rateLimit,
          dependencies: ep.dependencies,
        })),
      },
      integrations: integrations.map((i) => ({
        service: i.service,
        category: i.category,
        purpose: i.purpose,
        accountRequired: i.accountRequired,
        credentialsRequired: i.credentialsRequired,
        aiResponsibilities: i.aiResponsibilities,
        humanResponsibilities: i.humanResponsibilities,
        securityClassification: i.securityClassification,
        blockingStatus: i.blockingStatus,
        estimatedCost: i.estimatedCost,
      })),
      human_actions: humanActions.map((ha) => ({
        actionId: ha.actionId,
        title: ha.title,
        category: ha.category,
        whyRequired: ha.whyRequired,
        instructions: ha.instructions,
        whereToObtain: ha.whereToObtain,
        credentialsRequired: ha.credentialsRequired,
        isSecret: ha.isSecret,
        aiActionAfterward: ha.aiActionAfterward,
        blockingStatus: ha.blockingStatus,
        completionStatus: ha.completionStatus,
      })),
      roadmap: implementationPlan?.roadmap || [],
      milestones: implementationPlan?.milestones || [],
      features: implementationPlan?.features || [],
      user_stories: implementationPlan?.userStories || [],
      tasks: tasks.map((t) => ({
        taskId: t.taskId,
        title: t.title,
        description: t.description,
        type: t.type,
        priority: t.priority,
        complexity: t.complexity,
        status: t.status,
        dependencies: t.dependencies,
        affectedComponents: t.affectedComponents,
        subtasks: t.subtasks,
        acceptanceCriteria: t.acceptanceCriteria,
        testCases: t.testCases,
        assignedAgent: t.assignedAgent,
      })),
      metadata: {
        generator: 'Project Planning Agent v2.0',
        generatedAt: new Date().toISOString(),
        totalTasks: tasks.length,
        version: '1.0.0',
      },
    };

    return spec;
  }
}
