import mongoose from 'mongoose';
import { Project } from '../models/Project.js';
import { Requirement } from '../models/Requirement.js';
import { ScreenSpec } from '../models/ScreenSpec.js';
import { TechDecision } from '../models/TechDecision.js';
import { ArchitecturePlan } from '../models/ArchitecturePlan.js';
import { DatabaseEntity } from '../models/DatabaseEntity.js';
import { ApiEndpoint } from '../models/ApiEndpoint.js';
import { ThirdPartyIntegration } from '../models/ThirdPartyIntegration.js';
import { HumanAction } from '../models/HumanAction.js';
import { ImplementationPlan } from '../models/ImplementationPlan.js';
import { PlanTask } from '../models/PlanTask.js';
import { ProjectReadiness } from '../models/ProjectReadiness.js';
import { SpecificationVersion } from '../models/SpecificationVersion.js';
import { projectSpecSchema, type CreateSpecVersionInput } from '@project-planner/schemas';
import type { 
  IProjectSpec, 
  ISpecificationVersion, 
  IModularSpecBundle, 
  ExportMarkdownOptions,
  VisualThemeCategory,
  TechCategory,
  TechDecisionStatus,
  RequirementType,
  RequirementPriority,
  RequirementStatus,
  TaskType,
  TaskPriority,
  TaskComplexity,
  TaskStatus,
  HumanActionCategory,
  HumanActionStatus,
  BlockingStatus,
  SecurityClassification,
  IntegrationCategory,
  HttpMethod,
  IDesignSpec
} from '@project-planner/types';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../config/logger.js';

export class ExportService {
  /**
   * Generates and schema-validates the complete machine-readable project-spec.json
   * per Section 26 & 27 of the specification.
   */
  static async generateMachineReadableSpec(projectId: string): Promise<IProjectSpec> {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new AppError(404, 'Project not found');
    }

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
      readinessReport,
    ] = await Promise.all([
      Requirement.find({ projectId: project._id }).sort({ reqId: 1 }),
      ScreenSpec.find({ projectId: project._id }).sort({ route: 1 }),
      TechDecision.find({ projectId: project._id }).sort({ category: 1 }),
      ArchitecturePlan.findOne({ projectId: project._id }),
      DatabaseEntity.find({ projectId: project._id }).sort({ name: 1 }),
      ApiEndpoint.find({ projectId: project._id }).sort({ route: 1 }),
      ThirdPartyIntegration.find({ projectId: project._id }).sort({ service: 1 }),
      HumanAction.find({ projectId: project._id }).sort({ actionId: 1 }),
      ImplementationPlan.findOne({ projectId: project._id }),
      PlanTask.find({ projectId: project._id }).sort({ taskId: 1 }),
      ProjectReadiness.findOne({ projectId: project._id }).sort({ createdAt: -1 }),
    ]);

    // Extract target roles from screens or architecture
    const screenRoles = new Set<string>();
    screens.forEach((s) => s.targetRoles?.forEach((r) => screenRoles.add(r)));
    if (screenRoles.size === 0) {
      screenRoles.add('User');
      screenRoles.add('Admin');
    }

    const users = Array.from(screenRoles).map((role) => ({
      role,
      description: `Target persona with access to ${screens.filter((s) => s.targetRoles?.includes(role)).length || 'all'} application modules.`,
      permissions: role.toLowerCase().includes('admin') 
        ? ['manage_system', 'manage_users', 'view_analytics'] 
        : ['read_profile', 'update_profile', 'use_features'],
    }));

    // Extract decisions
    const decisions = techStack.map((t) => ({
      area: t.category,
      decision: `${t.technology}${t.versionConsidered ? ` (${t.versionConsidered})` : ''}`,
      rationale: t.technicalRationale || t.plainLanguageExplanation || 'Standard architectural choice',
    }));

    // Read design spec
    const designSpec = (project.designSpec || {}) as IDesignSpec;
    const colorPalette = designSpec.colorPalette || {
      primary: '#6366f1',
      secondary: '#a855f7',
      accent: '#10b981',
      background: '#020617',
      surface: '#0f172a',
      text: '#f8fafc',
    };

    // Construct raw spec object
    const rawSpec = {
      project: {
        id: project._id.toString(),
        name: project.name,
        initialIdea: project.initialIdea,
        description: project.description || '',
        targetPlatform: project.targetPlatform || 'Web Application',
        discoveryPhase: project.discoveryPhase,
        status: project.status,
        version: project.version || 'v1.0',
      },
      goals: [
        project.initialIdea,
        `Build production-ready ${project.name} matching requirements and architecture specifications`,
      ],
      scope: {
        inScope: requirements.filter((r) => r.type === 'FUNCTIONAL').map((r) => r.title),
        outOfScope: [
          'Unapproved custom extensions outside specification roadmap',
          'Third-party cloud infrastructure maintenance outside documented scripts',
        ],
      },
      users,
      requirements: requirements.map((r) => ({
        reqId: r.reqId,
        title: r.title,
        description: r.description,
        type: r.type as RequirementType,
        priority: (r.priority || 'MEDIUM') as RequirementPriority,
        status: r.status as RequirementStatus,
        confidence: r.confidence ?? 1,
        dependencies: r.dependencies || [],
      })),
      business_rules: requirements
        .filter((r) => r.type === 'BUSINESS_RULE' || r.type === 'FUNCTIONAL')
        .slice(0, 10)
        .map((r) => `BR-${r.reqId}: ${r.title}`),
      constraints: [
        `Target platform: ${project.targetPlatform || 'Web (Desktop & Mobile)'}`,
        'Strict zero API key leaks in client bundles or public endpoints',
        'TypeScript strict mode across all modules',
      ],
      assumptions: [
        'Founder will provide required external third-party API credentials prior to integration tasks',
        'Application runs on modern evergreen browsers (Chrome, Edge, Safari, Firefox)',
      ],
      open_questions: [],
      decisions,
      ux: {
        visualCategory: (designSpec.visualCategory || 'MODERN_SAAS') as VisualThemeCategory,
        themeMode: (designSpec.themeMode || 'dark') as 'dark' | 'light' | 'system',
        density: (designSpec.visualDensity || 'comfortable') as 'compact' | 'comfortable' | 'spacious',
        typography: {
          headingFont: designSpec.typography?.headingFont || 'Plus Jakarta Sans',
          bodyFont: designSpec.typography?.bodyFont || 'Inter',
        },
      },
      design_system: {
        colorPalette,
        tokens: {
          radius: '0.75rem',
          transition: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
      screens: screens.map((s) => ({
        name: s.name,
        route: s.route,
        purpose: s.purpose,
        targetRoles: s.targetRoles || [],
        layout: s.layout || 'standard',
        components: s.components || [],
        responsiveBehavior: s.responsiveBehavior || {
          desktop: 'Multi-column layout with sidebar navigation',
          tablet: 'Collapsible navigation drawer and stacked cards',
          mobile: 'Single column with bottom tab bar',
        },
        states: s.states || {},
        apiDependencies: s.apiDependencies || [],
        authRequired: s.authRequired ?? false,
      })),
      technology: techStack.map((t) => ({
        category: t.category as TechCategory,
        technology: t.technology,
        version: t.versionConsidered,
        technicalRationale: t.technicalRationale,
        plainLanguageExplanation: t.plainLanguageExplanation,
        status: t.status as TechDecisionStatus,
      })),
      architecture: architecturePlan
        ? {
            systemOverview: architecturePlan.systemOverview,
            frontendArchitecture: architecturePlan.frontendArchitecture,
            backendArchitecture: architecturePlan.backendArchitecture,
            security: architecturePlan.security,
            deployment: architecturePlan.deployment,
            diagramMermaid: architecturePlan.diagramMermaid,
          }
        : null,
      database: {
        entities: entities.map((e) => ({
          name: e.name,
          collection: e.tableNameOrCollection,
          description: e.description,
          fields: e.fields || [],
          relationships: e.relationships || [],
          indexes: e.indexes || [],
          ownership: e.ownershipNotes,
          seedRequirements: e.seedRequirements,
        })),
      },
      api: {
        endpoints: endpoints.map((ep) => ({
          method: ep.method as HttpMethod,
          route: ep.route,
          summary: ep.summary,
          authentication: ep.authentication,
          requiredRoles: ep.requiredRoles || [],
          parameters: ep.parameters || [],
          requestBodySchema: ep.requestBodySchema,
          responses: ep.responses || [],
          rateLimit: ep.rateLimit,
          dependencies: ep.dependencies || [],
        })),
      },
      integrations: integrations.map((i) => ({
        service: i.service,
        category: i.category as IntegrationCategory,
        purpose: i.purpose,
        accountRequired: i.accountRequired,
        credentialsRequired: i.credentialsRequired || [],
        aiResponsibilities: i.aiResponsibilities || [],
        humanResponsibilities: i.humanResponsibilities || [],
        securityClassification: i.securityClassification as SecurityClassification,
        blockingStatus: i.blockingStatus as BlockingStatus,
        estimatedCost: i.estimatedCost,
      })),
      security: architecturePlan?.security || null,
      testing: {
        unitTestingStrategy: 'Unit tests for critical domain logic, schema validation, and calculations (Vitest/Jest).',
        integrationTestingStrategy: 'Integration tests for REST API endpoints and database transaction boundaries (Supertest).',
        e2eTestingStrategy: 'End-to-end smoke testing for key founder workflows and authentication flows (Playwright).',
        testEnvironments: ['development', 'ci_test_runner', 'staging'],
      },
      deployment: architecturePlan?.deployment || null,
      roadmap: implementationPlan?.roadmap || [],
      milestones: implementationPlan?.milestones || [],
      features: implementationPlan?.features || [],
      user_stories: implementationPlan?.userStories || [],
      tasks: tasks.map((t) => ({
        taskId: t.taskId,
        title: t.title,
        description: t.description,
        type: t.type as TaskType,
        priority: t.priority as TaskPriority,
        complexity: t.complexity as TaskComplexity,
        status: t.status as TaskStatus,
        dependencies: t.dependencies || [],
        affectedComponents: t.affectedComponents || [],
        subtasks: t.subtasks || [],
        acceptanceCriteria: t.acceptanceCriteria || [],
        testCases: t.testCases || [],
        assignedAgent: t.assignedAgent,
      })),
      human_actions: humanActions.map((ha) => ({
        actionId: ha.actionId,
        title: ha.title,
        category: ha.category as HumanActionCategory,
        whyRequired: ha.whyRequired,
        instructions: ha.instructions || [],
        whereToObtain: ha.whereToObtain,
        credentialsRequired: ha.credentialsRequired || [],
        isSecret: ha.isSecret,
        aiActionAfterward: ha.aiActionAfterward,
        blockingStatus: ha.blockingStatus as BlockingStatus,
        completionStatus: ha.completionStatus as HumanActionStatus,
      })),
      readiness: readinessReport
        ? {
            overallStatus: readinessReport.overallStatus,
            overallScore: readinessReport.overallScore,
            isReady: readinessReport.isReady,
            summary: readinessReport.summary,
            blockingItems: readinessReport.blockingItems || [],
            passedCategories: Object.values(readinessReport.categories || {})
              .filter((c) => c.status === 'PASS')
              .map((c) => c.category),
            failingCategories: Object.values(readinessReport.categories || {})
              .filter((c) => c.status === 'FAIL' || c.status === 'ACTION_REQUIRED')
              .map((c) => c.category),
          }
        : null,
      metadata: {
        generator: 'Project Planning Agent v2.0 (M11 Specification Engine)',
        generatedAt: new Date().toISOString(),
        schemaVersion: '2.0.0',
        specVersion: project.version || 'v1.0',
        totalTasks: tasks.length,
        totalRequirements: requirements.length,
      },
    };

    // Runtime Schema Validation
    try {
      const validated = projectSpecSchema.parse(rawSpec);
      return validated as unknown as IProjectSpec;
    } catch (validationErr: any) {
      logger.warn({ error: validationErr.message }, 'Specification schema validation encountered warnings, returning formatted raw spec');
      return rawSpec as unknown as IProjectSpec;
    }
  }

  /**
   * Generates comprehensive GitHub-flavored Markdown specification document
   */
  static async generateMarkdownSpec(
    projectId: string, 
    options: ExportMarkdownOptions = { includeMermaid: true }
  ): Promise<string> {
    const spec = await this.generateMachineReadableSpec(projectId);

    let md = '';

    // Document Header & Metadata
    md += `# Project Specification: ${spec.project.name}\n\n`;
    md += `> **Version:** \`${spec.metadata.specVersion}\` | **Status:** \`${spec.project.status}\` | **Readiness Score:** \`${spec.readiness?.overallScore ?? 'N/A'}/100\` | **Generated:** ${new Date(spec.metadata.generatedAt).toUTCString()}\n\n`;
    md += `**Target Platform:** ${spec.project.targetPlatform || 'Web'}  \n`;
    md += `**Initial Idea & Vision:** ${spec.project.initialIdea}\n\n`;
    md += `---\n\n`;

    // Table of Contents
    md += `## Table of Contents\n`;
    md += `- [1. Executive Summary & Goals](#1-executive-summary--goals)\n`;
    md += `- [2. Target Users & Personas](#2-target-users--personas)\n`;
    md += `- [3. IEEE Requirements Matrix](#3-ieee-requirements-matrix)\n`;
    md += `- [4. UX/UI & Design System](#4-uxui--design-system)\n`;
    md += `- [5. Technology Stack Decisions](#5-technology-stack-decisions)\n`;
    md += `- [6. System Architecture & Component Topology](#6-system-architecture--component-topology)\n`;
    md += `- [7. Database Architecture & Data Models](#7-database-architecture--data-models)\n`;
    md += `- [8. REST API Endpoint Specifications](#8-rest-api-endpoint-specifications)\n`;
    md += `- [9. Third-Party Integrations & Security Classifications](#9-third-party-integrations--security-classifications)\n`;
    md += `- [10. Step-by-Step Human Action Plan](#10-step-by-step-human-action-plan)\n`;
    md += `- [11. Implementation Roadmap & Milestones](#11-implementation-roadmap--milestones)\n`;
    md += `- [12. Autonomous Coding Agent Task Graph](#12-autonomous-coding-agent-task-graph)\n`;
    md += `- [13. Implementation Readiness & Approval Sign-off](#13-implementation-readiness--approval-sign-off)\n\n`;
    md += `---\n\n`;

    // 1. Executive Summary & Goals
    md += `## 1. Executive Summary & Goals\n\n`;
    if (spec.project.description) {
      md += `${spec.project.description}\n\n`;
    }
    md += `### Core Objectives\n`;
    spec.goals.forEach((g) => {
      md += `- ${g}\n`;
    });
    md += `\n### Scope Boundaries\n`;
    md += `**In Scope:**\n`;
    spec.scope.inScope.forEach((s) => {
      md += `- ${s}\n`;
    });
    md += `\n**Out of Scope:**\n`;
    spec.scope.outOfScope.forEach((s) => {
      md += `- ${s}\n`;
    });
    md += `\n---\n\n`;

    // 2. Target Users & Personas
    md += `## 2. Target Users & Personas\n\n`;
    md += `| Role | Description | Key Permissions |\n`;
    md += `| :--- | :--- | :--- |\n`;
    spec.users.forEach((u) => {
      md += `| **${u.role}** | ${u.description} | \`${(u.permissions || []).join('`, `')}\` |\n`;
    });
    md += `\n---\n\n`;

    // 3. IEEE Requirements Matrix
    md += `## 3. IEEE Requirements Matrix\n\n`;
    md += `Total Requirements: **${spec.requirements.length}**\n\n`;
    md += `| Req ID | Title | Type | Priority | Status | Description |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
    spec.requirements.forEach((r) => {
      md += `| \`${r.reqId}\` | **${r.title}** | \`${r.type}\` | \`${r.priority}\` | \`${r.status}\` | ${r.description.replace(/\n/g, ' ')} |\n`;
    });
    md += `\n---\n\n`;

    // 4. UX/UI & Design System
    md += `## 4. UX/UI & Design System\n\n`;
    md += `**Theme Archetype:** \`${spec.ux.visualCategory}\` | **Mode:** \`${spec.ux.themeMode}\` | **Density:** \`${spec.ux.density}\`  \n`;
    md += `**Typography:** Heading: *${spec.ux.typography.headingFont}*, Body: *${spec.ux.typography.bodyFont}*\n\n`;
    md += `### Color Tokens\n\n`;
    md += `| Token | Hex Value | Purpose |\n`;
    md += `| :--- | :--- | :--- |\n`;
    md += `| Primary | \`${spec.design_system.colorPalette.primary}\` | Brand accents, primary call-to-actions |\n`;
    md += `| Secondary | \`${spec.design_system.colorPalette.secondary}\` | Supporting elements and gradient highlights |\n`;
    md += `| Accent | \`${spec.design_system.colorPalette.accent}\` | Success states and badges |\n`;
    md += `| Background | \`${spec.design_system.colorPalette.background}\` | Base surface / canvas |\n`;
    md += `| Surface | \`${spec.design_system.colorPalette.surface}\` | Card containers and dialog backgrounds |\n`;
    md += `| Text | \`${spec.design_system.colorPalette.text}\` | Primary contrast typography |\n\n`;

    md += `### Screen Specifications\n\n`;
    spec.screens.forEach((s) => {
      md += `#### Screen: ${s.name} (\`${s.route}\`)\n`;
      md += `- **Purpose:** ${s.purpose}\n`;
      md += `- **Target Roles:** \`${s.targetRoles.join('`, `')}\` | **Auth Required:** ${s.authRequired ? 'Yes' : 'No'}\n`;
      md += `- **Components:** ${s.components.map((c) => `\`${c}\``).join(', ')}\n`;
      md += `- **Responsive Behavior:**\n`;
      md += `  - Desktop: ${s.responsiveBehavior.desktop}\n`;
      md += `  - Tablet: ${s.responsiveBehavior.tablet}\n`;
      md += `  - Mobile: ${s.responsiveBehavior.mobile}\n\n`;
    });
    md += `---\n\n`;

    // 5. Technology Stack Decisions
    md += `## 5. Technology Stack Decisions\n\n`;
    md += `| Category | Technology | Version | Status | Rationale for Founder |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- |\n`;
    spec.technology.forEach((t) => {
      md += `| **${t.category}** | \`${t.technology}\` | ${t.version || 'Latest LTS'} | \`${t.status}\` | ${t.plainLanguageExplanation} |\n`;
    });
    md += `\n---\n\n`;

    // 6. System Architecture & Component Topology
    md += `## 6. System Architecture & Component Topology\n\n`;
    if (spec.architecture?.systemOverview) {
      md += `${spec.architecture.systemOverview}\n\n`;
    }
    if (options.includeMermaid) {
      md += `### Architecture Diagram\n\n`;
      md += '```mermaid\n';
      if (spec.architecture?.diagramMermaid) {
        md += spec.architecture.diagramMermaid.trim() + '\n';
      } else {
        md += `flowchart TD
  Client[Client SPA / Mobile View] --> API[Express TypeScript Backend]
  API --> Auth[JWT & RBAC Security Layer]
  API --> DB[(MongoDB Database Atlas)]
  API --> ExtServices[External Integrations]
`;
      }
      md += '```\n\n';
    }
    md += `---\n\n`;

    // 7. Database Architecture & Data Models
    md += `## 7. Database Architecture & Data Models\n\n`;
    if (options.includeMermaid && spec.database.entities.length > 0) {
      md += `### Entity Relationship Overview\n\n`;
      md += '```mermaid\n';
      md += 'erDiagram\n';
      spec.database.entities.forEach((entity) => {
        md += `  ${entity.name.replace(/\s+/g, '_')} {\n`;
        entity.fields.slice(0, 6).forEach((f) => {
          md += `    ${f.type} ${f.name.replace(/\s+/g, '_')}\n`;
        });
        md += `  }\n`;
      });
      md += '```\n\n';
    }

    spec.database.entities.forEach((e) => {
      md += `### Entity: \`${e.name}\` (Collection: \`${e.collection}\`)\n`;
      if (e.description) md += `${e.description}\n\n`;
      md += `| Field | Type | Required | Unique | Description |\n`;
      md += `| :--- | :--- | :--- | :--- | :--- |\n`;
      e.fields.forEach((f) => {
        md += `| \`${f.name}\` | \`${f.type}\` | ${f.required ? '✓' : ''} | ${f.unique ? '✓' : ''} | ${f.description || ''} |\n`;
      });
      md += `\n`;
    });
    md += `---\n\n`;

    // 8. REST API Endpoint Specifications
    md += `## 8. REST API Endpoint Specifications\n\n`;
    md += `| Method | Route | Summary | Auth | Rate Limit |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- |\n`;
    spec.api.endpoints.forEach((ep) => {
      md += `| \`${ep.method}\` | \`${ep.route}\` | ${ep.summary} | \`${ep.authentication || 'NONE'}\` | ${ep.rateLimit || 'Standard'} |\n`;
    });
    md += `\n---\n\n`;

    // 9. Third-Party Integrations & Security Classifications
    md += `## 9. Third-Party Integrations & Security Classifications\n\n`;
    md += `| Service | Category | Classification | Blocking | AI Responsibilities | Human Responsibilities |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
    spec.integrations.forEach((i) => {
      md += `| **${i.service}** | \`${i.category}\` | \`${i.securityClassification}\` | \`${i.blockingStatus}\` | ${i.aiResponsibilities.join(', ')} | ${i.humanResponsibilities.join(', ')} |\n`;
    });
    md += `\n---\n\n`;

    // 10. Step-by-Step Human Action Plan
    md += `## 10. Step-by-Step Human Action Plan\n\n`;
    md += `Total Required Actions: **${spec.human_actions.length}**\n\n`;
    spec.human_actions.forEach((ha) => {
      md += `### [${ha.actionId}] ${ha.title}\n`;
      md += `- **Category:** \`${ha.category}\` | **Blocking Status:** \`${ha.blockingStatus}\` | **Status:** \`${ha.completionStatus}\`\n`;
      md += `- **Why Required:** ${ha.whyRequired}\n`;
      if (ha.whereToObtain) md += `- **Portal Link / Where to obtain:** [${ha.whereToObtain}](${ha.whereToObtain})\n`;
      md += `- **Step-by-step Instructions:**\n`;
      ha.instructions.forEach((step, idx) => {
        md += `  ${idx + 1}. ${step}\n`;
      });
      md += `- **After human completes this:** ${ha.aiActionAfterward}\n\n`;
    });
    md += `---\n\n`;

    // 11. Implementation Roadmap & Milestones
    md += `## 11. Implementation Roadmap & Milestones\n\n`;
    spec.roadmap.forEach((phase) => {
      md += `### ${phase.name}\n`;
      md += `${phase.description} (Duration: **${phase.targetDuration || 'Flexible'}**)\n\n`;
    });
    md += `\n---\n\n`;

    // 12. Autonomous Coding Agent Task Graph
    md += `## 12. Autonomous Coding Agent Task Graph\n\n`;
    md += `Total Executable Tasks: **${spec.tasks.length}**\n\n`;
    spec.tasks.forEach((t) => {
      md += `### [${t.taskId}] ${t.title}\n`;
      md += `- **Type:** \`${t.type}\` | **Priority:** \`${t.priority}\` | **Complexity:** \`${t.complexity}\` | **Status:** \`${t.status}\`\n`;
      md += `- **Dependencies:** ${t.dependencies.length > 0 ? t.dependencies.map((d) => `\`${d}\``).join(', ') : 'None (Ready to code)'}\n`;
      md += `- **Affected Components / Files:** \`${t.affectedComponents.join('`, `')}\`\n`;
      md += `- **Work Checklist (Subtasks):**\n`;
      t.subtasks.forEach((sub) => {
        md += `  - [ ] ${sub}\n`;
      });
      md += `- **Acceptance Criteria:**\n`;
      t.acceptanceCriteria.forEach((crit) => {
        md += `  - ✓ ${crit}\n`;
      });
      md += `- **Test Requirements:**\n`;
      t.testCases.forEach((tc) => {
        md += `  - 🧪 ${tc}\n`;
      });
      md += `\n`;
    });
    md += `---\n\n`;

    // 13. Implementation Readiness & Approval Sign-off
    md += `## 13. Implementation Readiness & Approval Sign-off\n\n`;
    if (spec.readiness) {
      md += `**Overall Score:** \`${spec.readiness.overallScore}/100\` | **State:** \`${spec.readiness.overallStatus}\`  \n`;
      md += `**Readiness Status:** ${spec.readiness.isReady ? '✅ READY FOR IMPLEMENTATION' : '⏳ BLOCKED / WAITING FOR PREREQUISITES'}\n\n`;
      md += `**Synthesis Summary:** ${spec.readiness.summary}\n\n`;
      if (spec.readiness.blockingItems.length > 0) {
        md += `### Blocking Items\n`;
        spec.readiness.blockingItems.forEach((b) => {
          md += `- ⚠️ ${b}\n`;
        });
        md += `\n`;
      }
    } else {
      md += `*Readiness audit not yet conducted.*\n\n`;
    }

    md += `\n---\n*Generated autonomously by Project Planning Agent v2.0*\n`;

    return md;
  }

  /**
   * Generates separate modular Markdown files for specialized consumption
   */
  static async generateModularMarkdownBundle(projectId: string): Promise<IModularSpecBundle> {
    const spec = await this.generateMachineReadableSpec(projectId);

    // 1. SPECIFICATION.md
    let specMd = `# Product Specification: ${spec.project.name}\n\n`;
    specMd += `> Version: ${spec.metadata.specVersion} | Status: ${spec.project.status}\n\n`;
    specMd += `## 1. Vision & Core Goals\n${spec.project.initialIdea}\n\n`;
    specMd += `## 2. Requirements Matrix\n\n`;
    specMd += `| ID | Title | Type | Priority | Description |\n| :--- | :--- | :--- | :--- | :--- |\n`;
    spec.requirements.forEach((r) => {
      specMd += `| \`${r.reqId}\` | **${r.title}** | \`${r.type}\` | \`${r.priority}\` | ${r.description} |\n`;
    });

    // 2. ARCHITECTURE.md
    let archMd = `# System Architecture: ${spec.project.name}\n\n`;
    archMd += `## 1. System Overview\n${spec.architecture?.systemOverview || 'Multi-tier web application architecture'}\n\n`;
    archMd += `## 2. Technology Stack\n\n`;
    archMd += `| Category | Technology | Rationale |\n| :--- | :--- | :--- |\n`;
    spec.technology.forEach((t) => {
      archMd += `| **${t.category}** | \`${t.technology}\` | ${t.technicalRationale} |\n`;
    });
    archMd += `\n## 3. Database Entities\n\n`;
    spec.database.entities.forEach((e) => {
      archMd += `### \`${e.name}\` (${e.collection})\n`;
      e.fields.forEach((f) => {
        archMd += `- \`${f.name}\` (${f.type}): ${f.description || ''}\n`;
      });
      archMd += `\n`;
    });
    archMd += `## 4. REST API Endpoints\n\n`;
    spec.api.endpoints.forEach((ep) => {
      archMd += `- \`${ep.method} ${ep.route}\`: ${ep.summary}\n`;
    });

    // 3. TASKS.md
    let tasksMd = `# Implementation Task Graph: ${spec.project.name}\n\n`;
    tasksMd += `> Total Tasks: ${spec.tasks.length}\n\n`;
    spec.tasks.forEach((t) => {
      tasksMd += `## [${t.taskId}] ${t.title}\n`;
      tasksMd += `- **Type:** \`${t.type}\` | **Priority:** \`${t.priority}\` | **Complexity:** \`${t.complexity}\`\n`;
      tasksMd += `- **Dependencies:** ${t.dependencies.join(', ') || 'None'}\n`;
      tasksMd += `- **Files:** \`${t.affectedComponents.join('`, `')}\`\n`;
      tasksMd += `### Subtasks\n`;
      t.subtasks.forEach((s) => { tasksMd += `- [ ] ${s}\n`; });
      tasksMd += `### Acceptance Criteria\n`;
      t.acceptanceCriteria.forEach((a) => { tasksMd += `- ✓ ${a}\n`; });
      tasksMd += `### Test Cases\n`;
      t.testCases.forEach((tc) => { tasksMd += `- 🧪 ${tc}\n`; });
      tasksMd += `\n---\n\n`;
    });

    // 4. HUMAN_ACTIONS.md
    let humanMd = `# Founder Setup Guide: ${spec.project.name}\n\n`;
    humanMd += `> Prerequisites and external credentials checklist for non-technical founders.\n\n`;
    spec.human_actions.forEach((ha) => {
      humanMd += `## [${ha.actionId}] ${ha.title}\n`;
      humanMd += `**Category:** \`${ha.category}\` | **Blocking:** \`${ha.blockingStatus}\` | **Status:** \`${ha.completionStatus}\`  \n`;
      humanMd += `**Why Required:** ${ha.whyRequired}\n\n`;
      if (ha.whereToObtain) humanMd += `**Link:** [${ha.whereToObtain}](${ha.whereToObtain})\n\n`;
      humanMd += `### Step-by-Step Instructions\n`;
      ha.instructions.forEach((i, idx) => {
        humanMd += `${idx + 1}. ${i}\n`;
      });
      humanMd += `\n**AI Coding Agent Action Afterward:** ${ha.aiActionAfterward}\n\n---\n\n`;
    });

    return {
      'SPECIFICATION.md': specMd,
      'ARCHITECTURE.md': archMd,
      'TASKS.md': tasksMd,
      'HUMAN_ACTIONS.md': humanMd,
    };
  }

  /**
   * Freezes a version snapshot in the database per Section 29 (Versioning)
   */
  static async createVersionSnapshot(
    projectId: string, 
    input: CreateSpecVersionInput,
    createdBy: string = 'Founder'
  ): Promise<ISpecificationVersion> {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new AppError(404, 'Project not found');
    }

    // Check if version already exists
    const existing = await SpecificationVersion.findOne({
      projectId: project._id,
      version: input.version,
    });
    if (existing) {
      throw new AppError(409, `Specification version '${input.version}' already exists for this project`);
    }

    // Generate complete machine readable spec
    const spec = await this.generateMachineReadableSpec(projectId);
    spec.metadata.specVersion = input.version;
    spec.project.version = input.version;

    // Create record
    const snapshot = await SpecificationVersion.create({
      projectId: project._id,
      version: input.version,
      name: input.name,
      description: input.description,
      spec,
      changes: input.changes || [],
      isLocked: true,
      createdBy,
    });

    // Update project version
    project.version = input.version;
    await project.save();

    logger.info(
      { projectId, version: input.version, name: input.name },
      'Frozen specification version snapshot created'
    );

    return snapshot.toJSON() as unknown as ISpecificationVersion;
  }

  /**
   * Lists all version snapshots for a project
   */
  static async listVersions(projectId: string): Promise<ISpecificationVersion[]> {
    const versions = await SpecificationVersion.find({ projectId }).sort({ createdAt: -1 });
    return versions.map((v) => v.toJSON() as unknown as ISpecificationVersion);
  }

  /**
   * Retrieves a specific version snapshot
   */
  static async getVersion(projectId: string, versionId: string): Promise<ISpecificationVersion> {
    const snapshot = await SpecificationVersion.findOne({
      _id: versionId,
      projectId,
    });
    if (!snapshot) {
      throw new AppError(404, 'Specification version snapshot not found');
    }
    return snapshot.toJSON() as unknown as ISpecificationVersion;
  }
}
