import { Router } from 'express';
import {
  createProject,
  getProjects,
  getProject,
  updateProject,
  sendMessage,
  getMessages,
} from '../controllers/project.controller.js';
import {
  getRequirements,
  createRequirement,
  updateRequirement,
  deleteRequirement,
  triggerExtraction,
} from '../controllers/requirement.controller.js';
import {
  getValidationIssues,
  triggerValidation,
  resolveValidationIssue,
  dismissValidationIssue,
} from '../controllers/validation.controller.js';
import {
  getDesignSpec,
  updateDesignSpec,
  analyzeImage,
  getScreens,
  createScreen,
  updateScreen,
  deleteScreen,
  generateScreens,
} from '../controllers/ux.controller.js';
import {
  getTechStack,
  generateTechStack,
  createTechDecision,
  updateTechDecision,
  updateTechStatus,
  approveAllRecommendations,
  deleteTechDecision,
  getCompatibilityReport,
} from '../controllers/tech.controller.js';
import {
  getArchitecture,
  generateArchitecture,
  updateArchitecturePlan,
  getEntities,
  createEntity,
  updateEntity,
  deleteEntity,
  getEndpoints,
  createEndpoint,
  updateEndpoint,
  deleteEndpoint,
} from '../controllers/architecture.controller.js';
import {
  getIntegrationsAndActions,
  discoverIntegrationsAndActions,
  createIntegration,
  updateIntegration,
  deleteIntegration,
  getHumanActions,
  createHumanAction,
  updateHumanAction,
  updateHumanActionStatus,
  deleteHumanAction,
} from '../controllers/integration.controller.js';
import {
  getImplementationPlan,
  generateImplementationPlan,
  updateImplementationPlan,
  getTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  exportProjectSpec,
} from '../controllers/plan.controller.js';
import {
  getReadiness,
  runReadinessAudit,
  approveProject,
  finalizeProject,
} from '../controllers/readiness.controller.js';
import {
  exportPdf,
  exportJson,
  exportMarkdown,
  exportBundle,
  listVersions,
  createVersion,
  getVersion,
  exportVersionJson,
} from '../controllers/export.controller.js';
import {
  initializeHandoff,
  getHandoffPackage,
  getTaskQueue,
  getNextTask,
  claimTask,
  completeTask,
  failTask,
  submitFeedback,
} from '../controllers/agent.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Enforce mandatory JWT authentication across all project and agent routes
router.use(requireAuth);

// Project routes
router.post('/', createProject);
router.get('/', getProjects);
router.get('/:id', getProject);
router.patch('/:id', updateProject);

// Conversation routes
router.post('/:id/messages', sendMessage);
router.get('/:id/messages', getMessages);

// M3 Requirements Engine routes
router.get('/:id/requirements', getRequirements);
router.post('/:id/requirements', createRequirement);
router.patch('/:id/requirements/:reqId', updateRequirement);
router.delete('/:id/requirements/:reqId', deleteRequirement);
router.post('/:id/requirements/extract', triggerExtraction);

// M4 Validation Engine routes
router.get('/:id/validation', getValidationIssues);
router.post('/:id/validation/run', triggerValidation);
router.patch('/:id/validation/:issueId/resolve', resolveValidationIssue);
router.patch('/:id/validation/:issueId/dismiss', dismissValidationIssue);

// M5 UX/UI Discovery routes
router.get('/:id/design', getDesignSpec);
router.patch('/:id/design', updateDesignSpec);
router.post('/:id/design/analyze-image', analyzeImage);
router.get('/:id/screens', getScreens);
router.post('/:id/screens', createScreen);
router.post('/:id/screens/generate', generateScreens);
router.patch('/:id/screens/:screenId', updateScreen);
router.delete('/:id/screens/:screenId', deleteScreen);

// M6 Technology Selection routes
router.get('/:id/tech-stack', getTechStack);
router.post('/:id/tech-stack/generate', generateTechStack);
router.post('/:id/tech-stack/approve-all', approveAllRecommendations);
router.get('/:id/tech-stack/compatibility', getCompatibilityReport);
router.post('/:id/tech-stack', createTechDecision);
router.patch('/:id/tech-stack/:recId', updateTechDecision);
router.patch('/:id/tech-stack/:recId/status', updateTechStatus);
router.delete('/:id/tech-stack/:recId', deleteTechDecision);

// M7 Architecture routes
router.get('/:id/architecture', getArchitecture);
router.post('/:id/architecture/generate', generateArchitecture);
router.patch('/:id/architecture', updateArchitecturePlan);

router.get('/:id/architecture/entities', getEntities);
router.post('/:id/architecture/entities', createEntity);
router.patch('/:id/architecture/entities/:entityId', updateEntity);
router.delete('/:id/architecture/entities/:entityId', deleteEntity);

router.get('/:id/architecture/endpoints', getEndpoints);
router.post('/:id/architecture/endpoints', createEndpoint);
router.patch('/:id/architecture/endpoints/:endpointId', updateEndpoint);
router.delete('/:id/architecture/endpoints/:endpointId', deleteEndpoint);

// M8 Third-Party Integrations & Human Actions routes
router.get('/:id/integrations', getIntegrationsAndActions);
router.post('/:id/integrations/discover', discoverIntegrationsAndActions);
router.post('/:id/integrations', createIntegration);
router.patch('/:id/integrations/:integrationId', updateIntegration);
router.delete('/:id/integrations/:integrationId', deleteIntegration);

router.get('/:id/actions', getHumanActions);
router.post('/:id/actions', createHumanAction);
router.patch('/:id/actions/:actionId', updateHumanAction);
router.patch('/:id/actions/:actionId/status', updateHumanActionStatus);
router.delete('/:id/actions/:actionId', deleteHumanAction);

// M9 Implementation Planning routes
router.get('/:id/plan', getImplementationPlan);
router.post('/:id/plan/generate', generateImplementationPlan);
router.patch('/:id/plan', updateImplementationPlan);
router.get('/:id/plan/export-spec', exportProjectSpec);

router.get('/:id/plan/tasks', getTasks);
router.post('/:id/plan/tasks', createTask);
router.patch('/:id/plan/tasks/:taskId', updateTask);
router.patch('/:id/plan/tasks/:taskId/status', updateTaskStatus);
router.delete('/:id/plan/tasks/:taskId', deleteTask);

// M10 Readiness Engine routes
router.get('/:id/readiness', getReadiness);
router.post('/:id/readiness/audit', runReadinessAudit);
router.post('/:id/readiness/approve', approveProject);
router.post('/:id/readiness/finalize', finalizeProject);

// M11 Specification Export & Versioning routes
router.get('/:id/export/pdf', exportPdf);
router.get('/:id/export/json', exportJson);
router.get('/:id/export/markdown', exportMarkdown);
router.get('/:id/export/bundle', exportBundle);
router.get('/:id/versions', listVersions);
router.post('/:id/versions', createVersion);
router.get('/:id/versions/:versionId', getVersion);
router.get('/:id/versions/:versionId/export/json', exportVersionJson);

// M13 Engineering Agent Integration routes
router.post('/:id/agent/handoff', initializeHandoff);
router.get('/:id/agent/handoff', getHandoffPackage);
router.get('/:id/agent/queue', getTaskQueue);
router.get('/:id/agent/next-task', getNextTask);
router.post('/:id/agent/tasks/:taskId/claim', claimTask);
router.post('/:id/agent/tasks/:taskId/complete', completeTask);
router.post('/:id/agent/tasks/:taskId/fail', failTask);
router.post('/:id/agent/feedback', submitFeedback);

export { router as projectRoutes };





