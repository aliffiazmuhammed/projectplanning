// === Enums ===

export enum ProjectStatus {
  DRAFT = 'DRAFT',
  DISCOVERY = 'DISCOVERY',
  NEEDS_CLARIFICATION = 'NEEDS_CLARIFICATION',
  WAITING_FOR_APPROVAL = 'WAITING_FOR_APPROVAL',
  WAITING_FOR_HUMAN_ACTION = 'WAITING_FOR_HUMAN_ACTION',
  READY_FOR_IMPLEMENTATION = 'READY_FOR_IMPLEMENTATION',
  FINALIZED = 'FINALIZED',
}

export enum DiscoveryPhase {
  GOALS = 'GOALS',           // What are we building and why?
  USERS = 'USERS',           // Who is it for?
  FEATURES = 'FEATURES',     // What must it do?
  CONSTRAINTS = 'CONSTRAINTS', // Budget, timeline, technical limits
  INTEGRATIONS = 'INTEGRATIONS', // External services and dependencies
  UX = 'UX',                 // Design and user experience
  COMPLETE = 'COMPLETE',     // All phases explored
}

export enum ValidationIssueType {
  AMBIGUITY = 'AMBIGUITY',
  CONTRADICTION = 'CONTRADICTION',
  MISSING_INFO = 'MISSING_INFO',
  ASSUMPTION = 'ASSUMPTION',
  RECOMMENDATION = 'RECOMMENDATION',
}

export enum ValidationSeverity {
  BLOCKING = 'BLOCKING',
  WARNING = 'WARNING',
  INFO = 'INFO',
}

export enum ValidationIssueStatus {
  OPEN = 'OPEN',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
}

export enum VisualThemeCategory {
  MINIMAL_CLEAN = 'MINIMAL_CLEAN',
  MODERN_SAAS = 'MODERN_SAAS',
  ENTERPRISE = 'ENTERPRISE',
  PREMIUM_LUXURY = 'PREMIUM_LUXURY',
  PLAYFUL = 'PLAYFUL',
  DEVELOPER_DARK = 'DEVELOPER_DARK',
  ECOMMERCE = 'ECOMMERCE',
  DATA_DASHBOARD = 'DATA_DASHBOARD',
  AGENT_DECIDE = 'AGENT_DECIDE',
}

export enum TechCategory {
  FRONTEND_FRAMEWORK = 'FRONTEND_FRAMEWORK',
  BACKEND_FRAMEWORK = 'BACKEND_FRAMEWORK',
  DATABASE = 'DATABASE',
  STYLING = 'STYLING',
  COMPONENT_LIBRARY = 'COMPONENT_LIBRARY',
  ICONS = 'ICONS',
  STATE_MANAGEMENT = 'STATE_MANAGEMENT',
  DATA_FETCHING = 'DATA_FETCHING',
  FORMS_VALIDATION = 'FORMS_VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  CHARTS_ANALYTICS = 'CHARTS_ANALYTICS',
  DEPLOYMENT_HOSTING = 'DEPLOYMENT_HOSTING',
}

export enum TechDecisionStatus {
  RECOMMENDED = 'RECOMMENDED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CUSTOMIZED = 'CUSTOMIZED',
}

export enum RequirementStatus {
  CONFIRMED = 'CONFIRMED',
  RECOMMENDATION = 'RECOMMENDATION',
  ASSUMPTION = 'ASSUMPTION',
  OPEN_QUESTION = 'OPEN_QUESTION',
  CONTRADICTION = 'CONTRADICTION',
  CONSTRAINT = 'CONSTRAINT',
  DEPRECATED = 'DEPRECATED',
}

export enum RequirementType {
  FUNCTIONAL = 'FUNCTIONAL',
  NON_FUNCTIONAL = 'NON_FUNCTIONAL',
  BUSINESS_RULE = 'BUSINESS_RULE',
  SECURITY = 'SECURITY',
  PERFORMANCE = 'PERFORMANCE',
  ACCESSIBILITY = 'ACCESSIBILITY',
  UX = 'UX',
  TECHNICAL = 'TECHNICAL',
  DEPLOYMENT = 'DEPLOYMENT',
  INTEGRATION = 'INTEGRATION',
  CONSTRAINT = 'CONSTRAINT',
}

export type MessageRole = 'user' | 'assistant';

// === Interfaces ===

export interface IProject {
  id: string;
  name: string;
  description?: string;
  initialIdea: string;
  targetPlatform?: string;
  status: ProjectStatus;
  discoveryPhase: DiscoveryPhase;
  conversationSummary?: string;
  messageCount: number;
  designSpec?: IDesignSpec;
  version: string;
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IMessage {
  id: string;
  projectId: string;
  role: MessageRole;
  content: string;
  phase: DiscoveryPhase;
  createdAt: string;
}

export type RequirementPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RequirementSource = 'USER' | 'AGENT';

export interface IRequirement {
  id: string;
  projectId: string;
  reqId: string;
  title?: string;
  description: string;
  type: RequirementType;
  priority: RequirementPriority;
  status: RequirementStatus;
  source: RequirementSource;
  confidence: number;
  dependencies: string[];
  createdAt: string;
  updatedAt: string;
}

// === API Request/Response types ===

export interface CreateProjectRequest {
  name: string;
  initialIdea: string;
  description?: string;
  targetPlatform?: string;
}

export interface SendMessageRequest {
  content: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  discoveryPhase?: DiscoveryPhase;
}

export interface CreateRequirementRequest {
  reqId?: string;
  title?: string;
  description: string;
  type: RequirementType;
  priority?: RequirementPriority;
  status?: RequirementStatus;
  source?: RequirementSource;
  confidence?: number;
  dependencies?: string[];
}

export interface UpdateRequirementRequest {
  title?: string;
  description?: string;
  type?: RequirementType;
  priority?: RequirementPriority;
  status?: RequirementStatus;
  confidence?: number;
  dependencies?: string[];
}

export interface IValidationIssue {
  id: string;
  projectId: string;
  type: ValidationIssueType;
  title: string;
  description: string;
  severity: ValidationSeverity;
  status: ValidationIssueStatus;
  affectedRequirements: string[];
  suggestedResolutions: string[];
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResolveValidationIssueRequest {
  resolutionNotes?: string;
  chosenOption?: string;
  status?: ValidationIssueStatus;
}

// === UX/UI Specifications (M5) ===

export interface IColorPalette {
  primary: string;
  secondary?: string;
  accent?: string;
  background: string;
  surface: string;
  text: string;
}

export interface IReferenceImage {
  id: string;
  name: string;
  dataUrl?: string;
  analysis?: string;
  uploadedAt: string;
}

export interface IDesignSpec {
  visualCategory: VisualThemeCategory;
  themeMode: 'dark' | 'light' | 'system';
  colorPalette: IColorPalette;
  typography: {
    headingFont?: string;
    bodyFont?: string;
  };
  visualDensity: 'compact' | 'comfortable' | 'spacious';
  referenceImages: IReferenceImage[];
  observedInsights?: string[];
}

export interface IScreenSpec {
  id: string;
  projectId: string;
  name: string;
  route: string;
  purpose: string;
  targetRoles: string[];
  layout: string;
  components: string[];
  responsiveBehavior?: {
    desktop?: string;
    tablet?: string;
    mobile?: string;
  };
  states?: {
    loading?: string;
    empty?: string;
    error?: string;
    success?: string;
  };
  apiDependencies: string[];
  authRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateDesignSpecRequest {
  visualCategory?: VisualThemeCategory;
  themeMode?: 'dark' | 'light' | 'system';
  colorPalette?: Partial<IColorPalette>;
  typography?: {
    headingFont?: string;
    bodyFont?: string;
  };
  visualDensity?: 'compact' | 'comfortable' | 'spacious';
  referenceImages?: IReferenceImage[];
  observedInsights?: string[];
}

export interface AnalyzeImageRequest {
  imageBase64: string;
  mimeType: string;
  fileName?: string;
}

export interface CreateScreenSpecRequest {
  name: string;
  route: string;
  purpose: string;
  targetRoles?: string[];
  layout: string;
  components?: string[];
  responsiveBehavior?: {
    desktop?: string;
    tablet?: string;
    mobile?: string;
  };
  states?: {
    loading?: string;
    empty?: string;
    error?: string;
    success?: string;
  };
  apiDependencies?: string[];
  authRequired?: boolean;
}

export interface UpdateScreenSpecRequest {
  name?: string;
  route?: string;
  purpose?: string;
  targetRoles?: string[];
  layout?: string;
  components?: string[];
  responsiveBehavior?: {
    desktop?: string;
    tablet?: string;
    mobile?: string;
  };
  states?: {
    loading?: string;
    empty?: string;
    error?: string;
    success?: string;
  };
  apiDependencies?: string[];
  authRequired?: boolean;
}

export interface ApiErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}

// === Technology Selection (M6) ===

export interface ITechAlternative {
  name: string;
  pros: string[];
  cons: string[];
  reasonNotChosen: string;
}

export interface ITechEvaluationCriteria {
  maturity: number; // 1-10
  communityAdoption: number; // 1-10
  documentationQuality: number; // 1-10
  typeScriptSupport: number; // 1-10
  performance: number; // 1-10
  maintenance: number; // 1-10
}

export interface ITechRecommendation {
  id: string;
  projectId: string;
  category: TechCategory;
  technology: string;
  versionConsidered: string;
  plainLanguageExplanation: string;
  technicalRationale: string;
  evaluationCriteria: ITechEvaluationCriteria;
  compatibilityNotes: string;
  risksAndTradeoffs: string[];
  alternatives: ITechAlternative[];
  confidence: number;
  status: TechDecisionStatus;
  userNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTechRecommendationRequest {
  category: TechCategory;
  technology: string;
  versionConsidered: string;
  plainLanguageExplanation: string;
  technicalRationale: string;
  evaluationCriteria: ITechEvaluationCriteria;
  compatibilityNotes: string;
  risksAndTradeoffs: string[];
  alternatives?: ITechAlternative[];
  confidence?: number;
  status?: TechDecisionStatus;
  userNotes?: string;
}

export interface UpdateTechRecommendationRequest {
  technology?: string;
  versionConsidered?: string;
  plainLanguageExplanation?: string;
  technicalRationale?: string;
  evaluationCriteria?: Partial<ITechEvaluationCriteria>;
  compatibilityNotes?: string;
  risksAndTradeoffs?: string[];
  alternatives?: ITechAlternative[];
  confidence?: number;
  status?: TechDecisionStatus;
  userNotes?: string;
}

export interface UpdateTechStatusRequest {
  status: TechDecisionStatus;
  userNotes?: string;
}

export interface TechCompatibilityReport {
  score: number; // 0-100
  status: 'OPTIMAL' | 'COMPATIBLE_WITH_WARNINGS' | 'CONFLICTS_DETECTED';
  overallAssessment: string;
  checkedPairs: {
    itemA: string;
    itemB: string;
    compatible: boolean;
    note: string;
  }[];
  recommendations: string[];
}

// === Architecture & System Design (M7) ===

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';

export interface IEntityField {
  name: string;
  type: string;
  required: boolean;
  unique?: boolean;
  defaultValue?: string;
  description?: string;
}

export interface IEntityRelationship {
  relatedEntity: string;
  type: 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_MANY';
  foreignKey?: string;
  description?: string;
}

export interface IEntityIndex {
  fields: string[];
  unique?: boolean;
  name?: string;
}

export interface IDatabaseEntity {
  id: string;
  projectId: string;
  name: string;
  tableNameOrCollection: string;
  description: string;
  fields: IEntityField[];
  relationships: IEntityRelationship[];
  indexes: IEntityIndex[];
  ownershipNotes?: string;
  seedRequirements?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IApiParameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'body';
  required: boolean;
  type: string;
  description?: string;
}

export interface IApiResponseContract {
  statusCode: number;
  description: string;
  schemaOrExample?: string;
}

export interface IApiEndpoint {
  id: string;
  projectId: string;
  method: HttpMethod;
  route: string;
  summary: string;
  description?: string;
  authentication: 'NONE' | 'JWT' | 'SESSION' | 'API_KEY';
  requiredRoles: string[];
  parameters: IApiParameter[];
  requestBodySchema?: string;
  responses: IApiResponseContract[];
  rateLimit?: string;
  dependencies?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface IRbacRole {
  role: string;
  description: string;
  permissions: string[];
}

export interface ISecurityArchitecture {
  authenticationStrategy: string;
  sessionManagement: string;
  passwordPolicy?: string;
  rbacRoles: IRbacRole[];
  dataProtection: {
    transitEncryption: string;
    restEncryption: string;
    sensitiveFields: string[];
  };
  securityHeaders: string[];
  rateLimitingStrategy: string;
}

export interface IEnvironmentVariableSpec {
  key: string;
  description: string;
  classification: 'PUBLIC' | 'SENSITIVE' | 'SECRET';
  exampleValue?: string;
  required: boolean;
}

export interface IDeploymentArchitecture {
  platform: string;
  ciCdPipeline: string;
  scalingStrategy: string;
  cachingStrategy: string;
  backupStrategy: string;
  environmentVariables: IEnvironmentVariableSpec[];
}

export interface IArchitecturePlan {
  id: string;
  projectId: string;
  systemOverview: string;
  frontendArchitecture: string;
  backendArchitecture: string;
  security: ISecurityArchitecture;
  deployment: IDeploymentArchitecture;
  diagramMermaid?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEntityRequest {
  name: string;
  tableNameOrCollection: string;
  description: string;
  fields: IEntityField[];
  relationships?: IEntityRelationship[];
  indexes?: IEntityIndex[];
  ownershipNotes?: string;
  seedRequirements?: string;
}

export interface UpdateEntityRequest extends Partial<CreateEntityRequest> {}

export interface CreateApiEndpointRequest {
  method: HttpMethod;
  route: string;
  summary: string;
  description?: string;
  authentication?: 'NONE' | 'JWT' | 'SESSION' | 'API_KEY';
  requiredRoles?: string[];
  parameters?: IApiParameter[];
  requestBodySchema?: string;
  responses: IApiResponseContract[];
  rateLimit?: string;
  dependencies?: string[];
}

export interface UpdateApiEndpointRequest extends Partial<CreateApiEndpointRequest> {}

export interface UpdateArchitecturePlanRequest {
  systemOverview?: string;
  frontendArchitecture?: string;
  backendArchitecture?: string;
  security?: Partial<ISecurityArchitecture>;
  deployment?: Partial<IDeploymentArchitecture>;
  diagramMermaid?: string;
}

// === Third-Party Integrations & Human Actions (M8) ===

export type IntegrationCategory =
  | 'AUTH'
  | 'PAYMENT'
  | 'EMAIL'
  | 'SMS'
  | 'STORAGE'
  | 'MAPS'
  | 'ANALYTICS'
  | 'MONITORING'
  | 'AI_LLM'
  | 'DATABASE_CLOUD'
  | 'COMMUNICATION'
  | 'OTHER';

export type IntegrationStatus = 'IDENTIFIED' | 'CONFIGURED' | 'VERIFIED' | 'SKIPPED';

export type SecurityClassification = 'PUBLIC' | 'SENSITIVE' | 'SECRET';

export type BlockingStatus = 'BLOCKING' | 'NON_BLOCKING';

export type HumanActionStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';

export type HumanActionCategory =
  | 'ACCOUNT_SETUP'
  | 'CREDENTIALS'
  | 'LEGAL_COMPLIANCE'
  | 'BILLING'
  | 'DNS_DOMAIN'
  | 'VERIFICATION'
  | 'APPROVAL'
  | 'CONFIGURATION';

export interface ICredentialRequirement {
  name: string;
  classification: SecurityClassification;
  description: string;
  whereToFind?: string;
  exampleFormat?: string;
  isProvided?: boolean;
}

export interface IThirdPartyIntegration {
  id: string;
  projectId: string;
  service: string;
  category: IntegrationCategory;
  purpose: string;
  accountRequired: boolean;
  accountName?: string;
  credentialsRequired: ICredentialRequirement[];
  permissionsRequired: string[];
  configurationRequired: string[];
  humanSetupSteps: string[];
  aiResponsibilities: string[];
  humanResponsibilities: string[];
  securityClassification: SecurityClassification;
  blockingStatus: BlockingStatus;
  estimatedCost?: string;
  dependencies: string[];
  docsUrl?: string;
  status: IntegrationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface IHumanAction {
  id: string;
  actionId: string;
  projectId: string;
  title: string;
  category: HumanActionCategory;
  whyRequired: string;
  prerequisites: string[];
  instructions: string[];
  credentialsRequired: string[];
  whereToObtain: string;
  permissionsNeeded?: string;
  isSecret: boolean;
  secretHandlingInstructions?: string;
  aiActionAfterward: string;
  blockingStatus: BlockingStatus;
  completionStatus: HumanActionStatus;
  integrationId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIntegrationRequest {
  service: string;
  category: IntegrationCategory;
  purpose: string;
  accountRequired?: boolean;
  accountName?: string;
  credentialsRequired?: ICredentialRequirement[];
  permissionsRequired?: string[];
  configurationRequired?: string[];
  humanSetupSteps?: string[];
  aiResponsibilities?: string[];
  humanResponsibilities?: string[];
  securityClassification?: SecurityClassification;
  blockingStatus?: BlockingStatus;
  estimatedCost?: string;
  dependencies?: string[];
  docsUrl?: string;
  status?: IntegrationStatus;
}

export interface UpdateIntegrationRequest extends Partial<CreateIntegrationRequest> {}

export interface CreateHumanActionRequest {
  actionId?: string;
  title: string;
  category: HumanActionCategory;
  whyRequired: string;
  prerequisites?: string[];
  instructions: string[];
  credentialsRequired?: string[];
  whereToObtain: string;
  permissionsNeeded?: string;
  isSecret?: boolean;
  secretHandlingInstructions?: string;
  aiActionAfterward: string;
  blockingStatus?: BlockingStatus;
  completionStatus?: HumanActionStatus;
  integrationId?: string;
  notes?: string;
}

export interface UpdateHumanActionRequest extends Partial<CreateHumanActionRequest> {}

export interface UpdateHumanActionStatusRequest {
  status: HumanActionStatus;
  notes?: string;
}

// === Implementation Planning (M9) ===

export type TaskType =
  | 'BACKEND'
  | 'FRONTEND'
  | 'DATABASE'
  | 'DEVOPS'
  | 'TESTING'
  | 'INTEGRATION'
  | 'SECURITY'
  | 'FULLSTACK';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';

export type TaskComplexity = 'XS' | 'S' | 'M' | 'L' | 'XL';

export type MilestoneStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';

export interface IPlanRoadmapPhase {
  id: string;
  name: string;
  description: string;
  order: number;
  targetDuration?: string;
  deliverables: string[];
}

export interface IPlanMilestone {
  id: string;
  phaseId: string;
  title: string;
  description: string;
  order: number;
  status: MilestoneStatus;
  criteria: string[];
}

export interface IPlanFeature {
  id: string;
  milestoneId?: string;
  title: string;
  description: string;
  requirementIds: string[];
  screenRoutes: string[];
}

export interface IPlanUserStory {
  id: string;
  featureId: string;
  role: string;
  want: string;
  benefit: string;
  acceptanceCriteria: string[];
}

export interface IPlanTask {
  id: string;
  taskId: string;
  projectId: string;
  storyId?: string;
  featureId?: string;
  milestoneId?: string;
  phaseId?: string;
  title: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  complexity: TaskComplexity;
  status: TaskStatus;
  dependencies: string[];
  affectedComponents: string[];
  subtasks: string[];
  acceptanceCriteria: string[];
  testCases: string[];
  assignedAgent?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IImplementationPlan {
  id: string;
  projectId: string;
  summary: string;
  roadmap: IPlanRoadmapPhase[];
  milestones: IPlanMilestone[];
  features: IPlanFeature[];
  userStories: IPlanUserStory[];
  totalEstimatedHours?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  taskId?: string;
  storyId?: string;
  featureId?: string;
  milestoneId?: string;
  phaseId?: string;
  title: string;
  description: string;
  type?: TaskType;
  priority?: TaskPriority;
  complexity?: TaskComplexity;
  status?: TaskStatus;
  dependencies?: string[];
  affectedComponents?: string[];
  subtasks: string[];
  acceptanceCriteria: string[];
  testCases: string[];
  assignedAgent?: string;
  notes?: string;
}

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {}

export interface UpdateTaskStatusRequest {
  status: TaskStatus;
  notes?: string;
}

export interface UpdateImplementationPlanRequest {
  summary?: string;
  roadmap?: IPlanRoadmapPhase[];
  milestones?: IPlanMilestone[];
  features?: IPlanFeature[];
  userStories?: IPlanUserStory[];
  totalEstimatedHours?: number;
}

// === Readiness Engine (M10) ===

export type ReadinessCategory =
  | 'REQUIREMENTS'
  | 'UX_UI'
  | 'ARCHITECTURE'
  | 'DATABASE'
  | 'API'
  | 'TECHNOLOGY'
  | 'INTEGRATIONS'
  | 'SECURITY'
  | 'TESTING'
  | 'DEPLOYMENT'
  | 'HUMAN_ACTIONS';

export type ReadinessItemStatus = 'PASS' | 'WARN' | 'FAIL' | 'ACTION_REQUIRED';

export interface ICategoryReadiness {
  category: ReadinessCategory;
  title: string;
  status: ReadinessItemStatus;
  score: number;
  summary: string;
  findings: string[];
  blockers: string[];
  recommendations: string[];
}

export interface IProjectApproval {
  isApproved: boolean;
  approvedAt?: string;
  approvedBy?: string;
  approvalNotes?: string;
}

export interface IProjectReadinessReport {
  id: string;
  projectId: string;
  overallStatus: ProjectStatus;
  overallScore: number;
  isReady: boolean;
  summary: string;
  blockingItems: string[];
  categories: Record<ReadinessCategory, ICategoryReadiness>;
  approval: IProjectApproval;
  evaluatedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApproveProjectRequest {
  approvedBy?: string;
  notes?: string;
}

export interface FinalizeProjectRequest {
  notes?: string;
}

// === Specification Export & Versioning (M11) ===

export interface IProjectSpecScope {
  inScope: string[];
  outOfScope: string[];
}

export interface IProjectSpecUser {
  role: string;
  description: string;
  permissions?: string[];
}

export interface IProjectSpecDecision {
  area: string;
  decision: string;
  rationale: string;
}

export interface IProjectSpecTesting {
  unitTestingStrategy: string;
  integrationTestingStrategy: string;
  e2eTestingStrategy: string;
  testEnvironments: string[];
}

export interface IProjectSpecMetadata {
  generator: string;
  generatedAt: string;
  schemaVersion: string;
  specVersion: string;
  totalTasks: number;
  totalRequirements: number;
}

export interface IProjectSpec {
  project: {
    id: string;
    name: string;
    initialIdea: string;
    description?: string;
    targetPlatform?: string;
    discoveryPhase: DiscoveryPhase;
    status: ProjectStatus;
    version: string;
  };
  goals: string[];
  scope: IProjectSpecScope;
  users: IProjectSpecUser[];
  requirements: Array<{
    reqId: string;
    title: string;
    description: string;
    type: RequirementType;
    priority: RequirementPriority;
    status: RequirementStatus;
    confidence: number;
    dependencies?: string[];
  }>;
  business_rules: string[];
  constraints: string[];
  assumptions: string[];
  open_questions: string[];
  decisions: IProjectSpecDecision[];
  ux: {
    visualCategory: VisualThemeCategory;
    themeMode: 'dark' | 'light' | 'system';
    density: 'compact' | 'comfortable' | 'spacious';
    typography: {
      headingFont: string;
      bodyFont: string;
    };
  };
  design_system: {
    colorPalette: IColorPalette;
    tokens?: Record<string, string>;
  };
  screens: Array<{
    name: string;
    route: string;
    purpose: string;
    targetRoles: string[];
    layout: string;
    components: string[];
    responsiveBehavior: {
      desktop: string;
      tablet: string;
      mobile: string;
    };
    states: {
      loading?: string;
      empty?: string;
      error?: string;
      success?: string;
    };
    apiDependencies: string[];
    authRequired: boolean;
  }>;
  technology: Array<{
    category: TechCategory;
    technology: string;
    version?: string;
    technicalRationale: string;
    plainLanguageExplanation: string;
    status: TechDecisionStatus;
  }>;
  architecture: {
    systemOverview?: string;
    frontendArchitecture?: string;
    backendArchitecture?: string;
    security?: ISecurityArchitecture;
    deployment?: IDeploymentArchitecture;
    diagramMermaid?: string;
  } | null;
  database: {
    entities: Array<{
      name: string;
      collection: string;
      description?: string;
      fields: IEntityField[];
      relationships?: IEntityRelationship[];
      indexes?: IEntityIndex[];
      ownership?: string;
      seedRequirements?: string;
    }>;
  };
  api: {
    endpoints: Array<{
      method: HttpMethod;
      route: string;
      summary: string;
      authentication?: 'NONE' | 'JWT' | 'SESSION' | 'API_KEY';
      requiredRoles?: string[];
      parameters?: IApiParameter[];
      requestBodySchema?: string;
      responses: IApiResponseContract[];
      rateLimit?: string;
      dependencies?: string[];
    }>;
  };
  integrations: Array<{
    service: string;
    category: IntegrationCategory;
    purpose: string;
    accountRequired: boolean;
    credentialsRequired: string[];
    aiResponsibilities: string[];
    humanResponsibilities: string[];
    securityClassification: SecurityClassification;
    blockingStatus: BlockingStatus;
    estimatedCost?: string;
  }>;
  security: ISecurityArchitecture | null;
  testing: IProjectSpecTesting;
  deployment: IDeploymentArchitecture | null;
  roadmap: IPlanRoadmapPhase[];
  milestones: IPlanMilestone[];
  features: IPlanFeature[];
  user_stories: IPlanUserStory[];
  tasks: Array<{
    taskId: string;
    title: string;
    description: string;
    type: TaskType;
    priority: TaskPriority;
    complexity: TaskComplexity;
    status: TaskStatus;
    dependencies: string[];
    affectedComponents: string[];
    subtasks: string[];
    acceptanceCriteria: string[];
    testCases: string[];
    assignedAgent?: string;
  }>;
  human_actions: Array<{
    actionId: string;
    title: string;
    category: HumanActionCategory;
    whyRequired: string;
    instructions: string[];
    whereToObtain?: string;
    credentialsRequired: string[];
    isSecret: boolean;
    aiActionAfterward: string;
    blockingStatus: BlockingStatus;
    completionStatus: HumanActionStatus;
  }>;
  readiness: {
    overallStatus: ProjectStatus;
    overallScore: number;
    isReady: boolean;
    summary: string;
    blockingItems: string[];
    passedCategories: string[];
    failingCategories: string[];
  } | null;
  metadata: IProjectSpecMetadata;
}

export interface ISpecChangeRecord {
  changedItem: string;
  oldValue?: string;
  newValue?: string;
  reason: string;
  timestamp: string;
  affectsDownstream: boolean;
  downstreamArtifacts?: string[];
}

export interface ISpecificationVersion {
  id: string;
  projectId: string;
  version: string;
  name: string;
  description?: string;
  spec: IProjectSpec;
  changes: ISpecChangeRecord[];
  isLocked: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateSpecVersionRequest {
  version: string;
  name: string;
  description?: string;
  changes?: ISpecChangeRecord[];
}

export interface ExportMarkdownOptions {
  includeMermaid?: boolean;
  sections?: string[];
}

export interface IModularSpecBundle {
  'SPECIFICATION.md': string;
  'ARCHITECTURE.md': string;
  'TASKS.md': string;
  'HUMAN_ACTIONS.md': string;
}

export interface ExportPdfOptions {
  includeMermaid?: boolean;
  colorTheme?: 'dark' | 'light' | 'print';
}

// === Software Engineering Agent Integration (M13) ===

export type HandoffStatus = 'INITIALIZED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';

export type AgentTaskExecutionStatus = 'TODO' | 'READY_TO_RUN' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';

export interface IAgentFeedbackReport {
  id?: string;
  taskId?: string;
  type: 'CLARIFICATION_NEEDED' | 'DEPENDENCY_BLOCKED' | 'CODE_ERROR' | 'TEST_FAILURE' | 'SPEC_DRIFT';
  message: string;
  suggestedRemedy?: string;
  resolved: boolean;
  timestamp: string;
}

export interface IAgentActivityLog {
  id?: string;
  action: 'HANDOFF_INITIALIZED' | 'TASK_STARTED' | 'TASK_COMPLETED' | 'TASK_FAILED' | 'FEEDBACK_SUBMITTED';
  taskId?: string;
  agentName: string;
  details: string;
  timestamp: string;
}

export interface ITaskQueueItem {
  task: IPlanTask;
  executionStatus: AgentTaskExecutionStatus;
  unmetDependencies: string[];
  orderIndex: number;
}

export interface IEngineeringAgentHandoff {
  id: string;
  projectId: string;
  handoffId: string;
  specVersion: string;
  specChecksum: string;
  status: HandoffStatus;
  agentName: string;
  taskProgress: {
    total: number;
    completed: number;
    inProgress: number;
    blocked: number;
    percentComplete: number;
  };
  feedbackReports: IAgentFeedbackReport[];
  activityLog: IAgentActivityLog[];
  createdAt: string;
  updatedAt: string;
}

export interface IEngineeringHandoffPackage {
  handoff: IEngineeringAgentHandoff;
  spec: IProjectSpec;
  taskQueue: ITaskQueueItem[];
  agentInstructions: string;
  cliExecutionSnippet: string;
}

export interface InitializeHandoffRequest {
  agentName?: string;
}

export interface ClaimTaskRequest {
  agentName?: string;
}

export interface CompleteTaskRequest {
  agentName?: string;
  notes?: string;
  filesModified?: string[];
  testsPassed?: boolean;
}

export interface FailTaskRequest {
  agentName?: string;
  reason: string;
  errorDetails?: string;
}

export interface SubmitFeedbackRequest {
  taskId?: string;
  type: 'CLARIFICATION_NEEDED' | 'DEPENDENCY_BLOCKED' | 'CODE_ERROR' | 'TEST_FAILURE' | 'SPEC_DRIFT';
  message: string;
  suggestedRemedy?: string;
}

// === User & Authentication Types ===

export interface IUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface IAuthResponse {
  user: IUser;
  token?: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  name: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface UpdateUserProfileRequest {
  name?: string;
  avatarUrl?: string;
}






