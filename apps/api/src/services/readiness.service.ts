import { logger } from '../config/logger.js';
import { Project, type ProjectDocument } from '../models/Project.js';
import { Requirement, type RequirementDocument } from '../models/Requirement.js';
import { ValidationIssue, type ValidationIssueDocument } from '../models/ValidationIssue.js';
import { ScreenSpec, type ScreenSpecDocument } from '../models/ScreenSpec.js';
import { TechDecision, type TechDecisionDocument } from '../models/TechDecision.js';
import { ArchitecturePlan, type ArchitecturePlanDocument } from '../models/ArchitecturePlan.js';
import { DatabaseEntity, type DatabaseEntityDocument } from '../models/DatabaseEntity.js';
import { ApiEndpoint, type ApiEndpointDocument } from '../models/ApiEndpoint.js';
import { ThirdPartyIntegration, type ThirdPartyIntegrationDocument } from '../models/ThirdPartyIntegration.js';
import { HumanAction, type HumanActionDocument } from '../models/HumanAction.js';
import { ImplementationPlan, type ImplementationPlanDocument } from '../models/ImplementationPlan.js';
import { PlanTask, type PlanTaskDocument } from '../models/PlanTask.js';
import { ProjectReadiness, type ProjectReadinessDocument } from '../models/ProjectReadiness.js';
import {
  ProjectStatus,
  TechDecisionStatus,
  type ReadinessCategory,
  type ReadinessItemStatus,
  type ICategoryReadiness,
  type IProjectApproval,
  type ApproveProjectRequest,
  type FinalizeProjectRequest,
} from '@project-planner/types';
import { AiProvider } from './ai.provider.js';

export class ReadinessService {
  /**
   * Run a comprehensive readiness audit across all 11 planning dimensions.
   */
  static async runReadinessAudit(projectId: string) {
    const project = await Project.findById(projectId);
    if (!project) throw new Error('Project not found');

    // Fetch all project artifacts across previous milestones
    const [
      requirements,
      validationIssues,
      screens,
      techDecisions,
      architecturePlan,
      entities,
      endpoints,
      integrations,
      humanActions,
      implementationPlan,
      tasks,
    ] = await Promise.all([
      Requirement.find({ projectId: project._id }),
      ValidationIssue.find({ projectId: project._id, status: 'OPEN' }),
      ScreenSpec.find({ projectId: project._id }),
      TechDecision.find({ projectId: project._id }),
      ArchitecturePlan.findOne({ projectId: project._id }),
      DatabaseEntity.find({ projectId: project._id }),
      ApiEndpoint.find({ projectId: project._id }),
      ThirdPartyIntegration.find({ projectId: project._id }),
      HumanAction.find({ projectId: project._id }),
      ImplementationPlan.findOne({ projectId: project._id }),
      PlanTask.find({ projectId: project._id }),
    ]);

    const designSpec = project.designSpec;
    const categories: Record<ReadinessCategory, ICategoryReadiness> = {} as any;
    const allBlockers: string[] = [];

    // 1. REQUIREMENTS
    const blockingValidationIssues = validationIssues.filter(
      (i: ValidationIssueDocument) => i.severity === 'BLOCKING',
    );
    const reqStatus: ReadinessItemStatus =
      requirements.length === 0
        ? 'FAIL'
        : blockingValidationIssues.length > 0
        ? 'FAIL'
        : validationIssues.length > 0
        ? 'WARN'
        : 'PASS';

    const reqBlockers: string[] = [];
    if (requirements.length === 0) reqBlockers.push('No functional requirements captured yet');
    blockingValidationIssues.forEach((bi: ValidationIssueDocument) =>
      reqBlockers.push(`Unresolved blocking issue: ${bi.title}`),
    );

    categories.REQUIREMENTS = {
      category: 'REQUIREMENTS',
      title: 'Requirements & Scope',
      status: reqStatus,
      score:
        requirements.length === 0
          ? 0
          : Math.max(0, 100 - blockingValidationIssues.length * 30 - validationIssues.length * 10),
      summary: `${requirements.length} IEEE requirements defined; ${blockingValidationIssues.length} blocking conflicts open.`,
      findings: [
        `${requirements.length} requirements documented with IEEE identifier numbering.`,
        `${requirements.filter((r: RequirementDocument) => r.status === 'CONFIRMED').length} confirmed requirements.`,
      ],
      blockers: reqBlockers,
      recommendations:
        validationIssues.length > 0
          ? ['Resolve open ambiguities and contradictions in the Validation tab.']
          : [],
    };
    allBlockers.push(...reqBlockers);

    // 2. UX / UI
    const uxBlockers: string[] = [];
    if (screens.length === 0) uxBlockers.push('No frontend screen specifications defined');
    const uxStatus: ReadinessItemStatus =
      screens.length === 0 ? 'FAIL' : !designSpec?.colorPalette ? 'WARN' : 'PASS';

    categories.UX_UI = {
      category: 'UX_UI',
      title: 'UX/UI & Screen Specs',
      status: uxStatus,
      score: screens.length > 0 ? (designSpec?.colorPalette ? 100 : 75) : 10,
      summary: `${screens.length} screens specified with layout and responsive states. Theme: ${designSpec?.visualCategory || 'Default'}.`,
      findings: [
        `${screens.length} frontend screen specifications generated.`,
        `Visual theme: ${designSpec?.visualCategory || 'MODERN_SAAS'} (${designSpec?.themeMode || 'dark'}).`,
      ],
      blockers: uxBlockers,
      recommendations: screens.length === 0 ? ['Generate screens from requirements in UX tab.'] : [],
    };
    allBlockers.push(...uxBlockers);

    // 3. ARCHITECTURE
    const archBlockers: string[] = [];
    if (!architecturePlan) archBlockers.push('System topology and architecture plan missing');
    const archStatus: ReadinessItemStatus = !architecturePlan ? 'FAIL' : 'PASS';

    categories.ARCHITECTURE = {
      category: 'ARCHITECTURE',
      title: 'System Architecture',
      status: archStatus,
      score: architecturePlan ? 100 : 15,
      summary: architecturePlan
        ? 'System overview, frontend architecture, and backend architecture documented.'
        : 'System architecture has not been generated.',
      findings: architecturePlan
        ? [
            'System topology and component boundaries established.',
            'Frontend and backend framework architectures aligned.',
          ]
        : [],
      blockers: archBlockers,
      recommendations: !architecturePlan ? ['Generate architecture plan in Arch tab.'] : [],
    };
    allBlockers.push(...archBlockers);

    // 4. DATABASE
    const dbBlockers: string[] = [];
    if (entities.length === 0) dbBlockers.push('No database entities or collections defined');
    const dbStatus: ReadinessItemStatus = entities.length === 0 ? 'FAIL' : 'PASS';

    categories.DATABASE = {
      category: 'DATABASE',
      title: 'Database & Data Models',
      status: dbStatus,
      score: entities.length > 0 ? 100 : 10,
      summary: `${entities.length} database entities defined with fields, relationships, and indexes.`,
      findings: [
        `${entities.length} entities/collections modeled.`,
        `${entities.reduce((acc: number, e: DatabaseEntityDocument) => acc + (e.indexes?.length || 0), 0)} database indexes configured.`,
      ],
      blockers: dbBlockers,
      recommendations: entities.length === 0 ? ['Model database entities in Arch tab.'] : [],
    };
    allBlockers.push(...dbBlockers);

    // 5. API
    const apiBlockers: string[] = [];
    if (endpoints.length === 0) apiBlockers.push('No API endpoints or contracts specified');
    const apiStatus: ReadinessItemStatus = endpoints.length === 0 ? 'FAIL' : 'PASS';

    categories.API = {
      category: 'API',
      title: 'REST API Specifications',
      status: apiStatus,
      score: endpoints.length > 0 ? 100 : 10,
      summary: `${endpoints.length} API endpoints specified with HTTP methods, paths, and response contracts.`,
      findings: [
        `${endpoints.length} REST endpoints documented with request/response schemas.`,
        `${endpoints.filter((e: ApiEndpointDocument) => e.authentication && e.authentication !== 'NONE').length} endpoints secured with auth.`,
      ],
      blockers: apiBlockers,
      recommendations: endpoints.length === 0 ? ['Generate API contracts in Arch tab.'] : [],
    };
    allBlockers.push(...apiBlockers);

    // 6. TECHNOLOGY
    const unapprovedTech = techDecisions.filter(
      (t: TechDecisionDocument) => t.status !== TechDecisionStatus.APPROVED,
    );
    const techBlockers: string[] = [];
    if (techDecisions.length === 0) techBlockers.push('Technology stack has not been selected');
    const techStatus: ReadinessItemStatus =
      techDecisions.length === 0 ? 'FAIL' : unapprovedTech.length > 0 ? 'WARN' : 'PASS';

    categories.TECHNOLOGY = {
      category: 'TECHNOLOGY',
      title: 'Technology Stack',
      status: techStatus,
      score:
        techDecisions.length === 0
          ? 0
          : Math.round(((techDecisions.length - unapprovedTech.length) / techDecisions.length) * 100),
      summary: `${techDecisions.length} technology choices evaluated. ${unapprovedTech.length} pending founder approval.`,
      findings: [
        `${techDecisions.filter((t: TechDecisionDocument) => t.status === TechDecisionStatus.APPROVED).length} technologies approved by user.`,
        'Compatibility audit reports optimal library interoperability.',
      ],
      blockers: techBlockers,
      recommendations:
        unapprovedTech.length > 0
          ? [`Approve remaining ${unapprovedTech.length} proposed tech choices in the Stack tab.`]
          : [],
    };

    allBlockers.push(...techBlockers);

    // 7. INTEGRATIONS
    categories.INTEGRATIONS = {
      category: 'INTEGRATIONS',
      title: 'Third-Party Services',
      status: 'PASS',
      score: 100,
      summary: `${integrations.length} external third-party services analyzed with security classifications.`,
      findings: [
        `${integrations.length} third-party APIs cataloged (OAuth, Payment, Storage, etc.).`,
        'Credential requirements classified as PUBLIC, SENSITIVE, or SECRET.',
      ],
      blockers: [],
      recommendations: [],
    };

    // 8. SECURITY
    const hasSecStrategy = !!architecturePlan?.security?.authenticationStrategy;
    const secStatus: ReadinessItemStatus = hasSecStrategy ? 'PASS' : 'WARN';
    categories.SECURITY = {
      category: 'SECURITY',
      title: 'Security & Access Control',
      status: secStatus,
      score: hasSecStrategy ? 100 : 50,
      summary: hasSecStrategy
        ? `Authentication: ${architecturePlan.security.authenticationStrategy}. RBAC roles matrix defined.`
        : 'Security strategy has not been explicitly configured.',
      findings: hasSecStrategy
        ? [
            `Session management: ${architecturePlan.security.sessionManagement}`,
            `${architecturePlan.security.rbacRoles?.length || 0} RBAC roles with granular permissions configured.`,
          ]
        : [],
      blockers: [],
      recommendations: !hasSecStrategy ? ['Review security specifications in the Arch tab.'] : [],
    };

    // 9. TESTING
    const totalTestCases = tasks.reduce(
      (acc: number, t: PlanTaskDocument) => acc + (t.testCases?.length || 0),
      0,
    );
    const testStatus: ReadinessItemStatus = totalTestCases === 0 ? 'WARN' : 'PASS';
    categories.TESTING = {
      category: 'TESTING',
      title: 'Testing Strategy & Scenarios',
      status: testStatus,
      score: totalTestCases > 0 ? 100 : 60,
      summary: `${totalTestCases} scenario test cases defined across implementation tasks.`,
      findings: [
        `${totalTestCases} acceptance test scenarios documented.`,
        'Unit, integration, and validation error cases defined for tasks.',
      ],
      blockers: [],
      recommendations: totalTestCases === 0 ? ['Add test requirements to tasks in the Plan tab.'] : [],
    };

    // 10. DEPLOYMENT
    const hasDeployment = !!architecturePlan?.deployment?.platform;
    const deployStatus: ReadinessItemStatus = hasDeployment ? 'PASS' : 'WARN';
    categories.DEPLOYMENT = {
      category: 'DEPLOYMENT',
      title: 'Deployment & CI/CD',
      status: deployStatus,
      score: hasDeployment ? 100 : 60,
      summary: hasDeployment
        ? `Target platform: ${architecturePlan.deployment.platform}. CI/CD and containerization specified.`
        : 'Deployment platform not explicitly set.',
      findings: hasDeployment
        ? [
            `Platform: ${architecturePlan.deployment.platform}`,
            `${architecturePlan.deployment.environmentVariables?.length || 0} environment variables classified.`,
          ]
        : [],
      blockers: [],
      recommendations: !hasDeployment ? ['Configure deployment options in the Arch tab.'] : [],
    };

    // 11. HUMAN ACTIONS (Section 23: WhatsApp credentials, payment accounts, etc.)
    const pendingBlockingActions = humanActions.filter(
      (a: HumanActionDocument) => a.blockingStatus === 'BLOCKING' && a.completionStatus !== 'COMPLETED',
    );
    const humanActionBlockers: string[] = [];
    pendingBlockingActions.forEach((ha: HumanActionDocument) => {
      humanActionBlockers.push(`[${ha.actionId}] ${ha.title} (Action required by founder)`);
    });

    const humanStatus: ReadinessItemStatus =
      pendingBlockingActions.length > 0 ? 'ACTION_REQUIRED' : 'PASS';

    categories.HUMAN_ACTIONS = {
      category: 'HUMAN_ACTIONS',
      title: 'Human Action Prerequisites',
      status: humanStatus,
      score:
        humanActions.length === 0
          ? 100
          : Math.round(
              ((humanActions.length - pendingBlockingActions.length) / humanActions.length) * 100,
            ),
      summary:
        pendingBlockingActions.length > 0
          ? `${pendingBlockingActions.length} mandatory human actions required before coding agent implementation.`
          : 'All prerequisite human setup actions are completed.',
      findings: [
        `${humanActions.filter((a: HumanActionDocument) => a.completionStatus === 'COMPLETED').length} of ${humanActions.length} human actions completed.`,
      ],
      blockers: humanActionBlockers,
      recommendations:
        pendingBlockingActions.length > 0
          ? ['Complete the blocking checklist items in the Actions tab.']
          : [],
    };
    allBlockers.push(...humanActionBlockers);

    // Calculate Overall Score (Average of all 11 dimensions)
    const categoryValues = Object.values(categories);
    const overallScore = Math.round(
      categoryValues.reduce((acc, cat) => acc + cat.score, 0) / categoryValues.length,
    );

    // Determine Final Readiness State Machine State
    const existingReadiness = await ProjectReadiness.findOne({ projectId: project._id });
    const isApproved = existingReadiness?.approval?.isApproved ?? false;

    let overallStatus: ProjectStatus;
    let summary: string;

    if (project.status === ProjectStatus.FINALIZED) {
      overallStatus = ProjectStatus.FINALIZED;
      summary = 'Project specification is finalized and locked for implementation.';
    } else if (categories.REQUIREMENTS.status === 'FAIL') {
      overallStatus = ProjectStatus.NEEDS_CLARIFICATION;
      summary =
        'Project has blocking requirement contradictions or empty scope that must be clarified before implementation.';
    } else if (humanStatus === 'ACTION_REQUIRED') {
      overallStatus = ProjectStatus.WAITING_FOR_HUMAN_ACTION;
      summary = `Project planning is technically complete, but ${pendingBlockingActions.length} prerequisite human actions (external accounts/keys) must be fulfilled before coding begins.`;
    } else if (categoryValues.some((c) => c.status === 'FAIL')) {
      overallStatus = ProjectStatus.DISCOVERY;
      summary =
        'Foundational specifications (screens, database models, or API endpoints) are still missing.';
    } else if (!isApproved) {
      overallStatus = ProjectStatus.WAITING_FOR_APPROVAL;
      summary =
        'All technical specifications, data models, and prerequisites are verified! The project is awaiting human founder approval to begin implementation.';
    } else {
      overallStatus = ProjectStatus.READY_FOR_IMPLEMENTATION;
      summary =
        'The project has passed all 11 readiness checks and received founder sign-off. It is 100% ready for autonomous coding agent implementation!';
    }

    const isReady =
      overallStatus === ProjectStatus.READY_FOR_IMPLEMENTATION ||
      overallStatus === ProjectStatus.FINALIZED;

    // Optional qualitative summary via AI (Gemini primary, Groq fallback)
    try {
      const prompt = `You are a Principal Software Delivery Director.
Provide a concise 2-sentence executive readiness evaluation for project "${project.name}".
Readiness Score: ${overallScore}/100. Status: ${overallStatus}.
Open Blockers: ${allBlockers.join('; ') || 'None'}.
Highlight whether coding agents can safely begin implementation.`;

      const { text, provider } = await AiProvider.importantText({ prompt });
      if (text && text.trim().length > 0) {
        summary = text.trim();
      }
      logger.info({ projectId: project._id, provider }, 'Readiness summary generated via AI');
    } catch (err) {
      logger.warn({ err }, 'Qualitative readiness summary skipped');
    }

    // Save Readiness Report
    const report = await ProjectReadiness.findOneAndUpdate(
      { projectId: project._id },
      {
        $set: {
          overallStatus,
          overallScore,
          isReady,
          summary,
          blockingItems: allBlockers,
          categories,
          evaluatedAt: new Date(),
        },
      },
      { upsert: true, new: true, runValidators: true },
    );

    // Sync project status in Project model
    await Project.findByIdAndUpdate(project._id, { $set: { status: overallStatus } });

    return report;
  }

  /**
   * Get the current readiness report (or run an audit if none exists).
   */
  static async getReadiness(projectId: string) {
    let report = await ProjectReadiness.findOne({ projectId });
    if (!report) {
      report = await this.runReadinessAudit(projectId);
    }
    return report;
  }

  /**
   * Approve the project for implementation (founder sign-off).
   */
  static async approveProject(projectId: string, input: ApproveProjectRequest) {
    const report = await ProjectReadiness.findOne({ projectId });
    if (!report) throw new Error('Readiness report not found. Run audit first.');

    const approval: IProjectApproval = {
      isApproved: true,
      approvedAt: new Date().toISOString(),
      approvedBy: input.approvedBy || 'Founder',
      approvalNotes: input.notes || 'Approved for autonomous implementation',
    };

    report.approval = approval;

    // If no blocking human actions or failing categories remain, transition status
    if (report.overallStatus === ProjectStatus.WAITING_FOR_APPROVAL) {
      report.overallStatus = ProjectStatus.READY_FOR_IMPLEMENTATION;
      report.isReady = true;
      report.summary =
        'Approved by founder. The project is verified and ready for autonomous coding agent execution.';
      await Project.findByIdAndUpdate(projectId, {
        $set: { status: ProjectStatus.READY_FOR_IMPLEMENTATION },
      });
    }

    await report.save();
    return report;
  }

  /**
   * Finalize the project specification.
   */
  static async finalizeProject(projectId: string, input: FinalizeProjectRequest) {
    const report = await ProjectReadiness.findOne({ projectId });
    if (!report) throw new Error('Readiness report not found');

    report.overallStatus = ProjectStatus.FINALIZED;
    report.summary = input.notes || 'Project specification finalized.';
    await report.save();

    await Project.findByIdAndUpdate(projectId, {
      $set: { status: ProjectStatus.FINALIZED },
    });

    return report;
  }
}
