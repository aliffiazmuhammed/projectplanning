import { z } from 'zod';
import { 
  ProjectStatus, 
  DiscoveryPhase, 
  RequirementStatus, 
  RequirementType,
  ValidationIssueType,
  ValidationSeverity,
  ValidationIssueStatus,
  VisualThemeCategory,
  TechCategory,
  TechDecisionStatus
} from '@project-planner/types';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(200),
  initialIdea: z.string().min(1, 'Initial idea is required').max(5000),
  description: z.string().max(2000).optional(),
  targetPlatform: z.string().max(200).optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required').max(10000),
});

export const updateProjectSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    status: z.nativeEnum(ProjectStatus).optional(),
    discoveryPhase: z.nativeEnum(DiscoveryPhase).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const createRequirementSchema = z.object({
  reqId: z.string().max(50).optional(),
  title: z.string().max(200).optional(),
  description: z.string().min(1, 'Requirement description is required').max(5000),
  type: z.nativeEnum(RequirementType),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  status: z.nativeEnum(RequirementStatus).default(RequirementStatus.CONFIRMED),
  source: z.enum(['USER', 'AGENT']).default('USER'),
  confidence: z.number().min(0).max(1).default(1),
  dependencies: z.array(z.string()).default([]),
});

export const updateRequirementSchema = z
  .object({
    title: z.string().max(200).optional(),
    description: z.string().min(1).max(5000).optional(),
    type: z.nativeEnum(RequirementType).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    status: z.nativeEnum(RequirementStatus).optional(),
    confidence: z.number().min(0).max(1).optional(),
    dependencies: z.array(z.string()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const createValidationIssueSchema = z.object({
  type: z.nativeEnum(ValidationIssueType),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required').max(5000),
  severity: z.nativeEnum(ValidationSeverity).default(ValidationSeverity.WARNING),
  status: z.nativeEnum(ValidationIssueStatus).default(ValidationIssueStatus.OPEN),
  affectedRequirements: z.array(z.string()).default([]),
  suggestedResolutions: z.array(z.string()).default([]),
  resolutionNotes: z.string().max(2000).optional(),
});

export const resolveValidationIssueSchema = z.object({
  chosenOption: z.string().max(1000).optional(),
  resolutionNotes: z.string().max(2000).optional(),
  status: z.nativeEnum(ValidationIssueStatus).default(ValidationIssueStatus.RESOLVED),
});

// === UX/UI Schemas (M5) ===

export const colorPaletteSchema = z.object({
  primary: z.string().default('#6366f1'),
  secondary: z.string().default('#a855f7'),
  accent: z.string().default('#10b981'),
  background: z.string().default('#020617'),
  surface: z.string().default('#0f172a'),
  text: z.string().default('#f8fafc'),
});

export const updateDesignSpecSchema = z.object({
  visualCategory: z.nativeEnum(VisualThemeCategory).optional(),
  themeMode: z.enum(['dark', 'light', 'system']).optional(),
  colorPalette: colorPaletteSchema.partial().optional(),
  typography: z
    .object({
      headingFont: z.string().optional(),
      bodyFont: z.string().optional(),
    })
    .optional(),
  visualDensity: z.enum(['compact', 'comfortable', 'spacious']).optional(),
  observedInsights: z.array(z.string()).optional(),
});

export const analyzeImageSchema = z.object({
  imageBase64: z.string().min(1, 'Image base64 data is required'),
  mimeType: z.string().min(1, 'Mime type is required'),
  fileName: z.string().optional(),
});

export const createScreenSpecSchema = z.object({
  name: z.string().min(1, 'Screen name is required').max(100),
  route: z.string().min(1, 'Route is required').max(100),
  purpose: z.string().min(1, 'Purpose is required').max(1000),
  targetRoles: z.array(z.string()).default([]),
  layout: z.string().min(1, 'Layout description is required').max(500),
  components: z.array(z.string()).default([]),
  responsiveBehavior: z
    .object({
      desktop: z.string().optional(),
      tablet: z.string().optional(),
      mobile: z.string().optional(),
    })
    .optional(),
  states: z
    .object({
      loading: z.string().optional(),
      empty: z.string().optional(),
      error: z.string().optional(),
      success: z.string().optional(),
    })
    .optional(),
  apiDependencies: z.array(z.string()).default([]),
  authRequired: z.boolean().default(true),
});

export const updateScreenSpecSchema = createScreenSpecSchema.partial();

// === Technology Selection Schemas (M6) ===

export const techEvaluationCriteriaSchema = z.object({
  maturity: z.number().min(1).max(10).default(8),
  communityAdoption: z.number().min(1).max(10).default(8),
  documentationQuality: z.number().min(1).max(10).default(8),
  typeScriptSupport: z.number().min(1).max(10).default(9),
  performance: z.number().min(1).max(10).default(8),
  maintenance: z.number().min(1).max(10).default(8),
});

export const techAlternativeSchema = z.object({
  name: z.string().min(1),
  pros: z.array(z.string()).default([]),
  cons: z.array(z.string()).default([]),
  reasonNotChosen: z.string().default(''),
});

export const createTechRecommendationSchema = z.object({
  category: z.nativeEnum(TechCategory),
  technology: z.string().min(1, 'Technology name is required').max(100),
  versionConsidered: z.string().max(50).default('latest'),
  plainLanguageExplanation: z.string().min(1, 'Plain language explanation is required').max(2000),
  technicalRationale: z.string().min(1, 'Technical rationale is required').max(3000),
  evaluationCriteria: techEvaluationCriteriaSchema,
  compatibilityNotes: z.string().max(1000).default(''),
  risksAndTradeoffs: z.array(z.string()).default([]),
  alternatives: z.array(techAlternativeSchema).default([]),
  confidence: z.number().min(0).max(1).default(0.9),
  status: z.nativeEnum(TechDecisionStatus).default(TechDecisionStatus.RECOMMENDED),
  userNotes: z.string().max(2000).optional(),
});

export const updateTechRecommendationSchema = createTechRecommendationSchema.partial();

export const updateTechStatusSchema = z.object({
  status: z.nativeEnum(TechDecisionStatus),
  userNotes: z.string().max(2000).optional(),
});

// === Architecture & System Design Schemas (M7) ===

export const entityFieldSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.string().min(1).max(100),
  required: z.boolean().default(true),
  unique: z.boolean().optional(),
  defaultValue: z.string().optional(),
  description: z.string().optional(),
});

export const entityRelationshipSchema = z.object({
  relatedEntity: z.string().min(1),
  type: z.enum(['ONE_TO_ONE', 'ONE_TO_MANY', 'MANY_TO_MANY']),
  foreignKey: z.string().optional(),
  description: z.string().optional(),
});

export const entityIndexSchema = z.object({
  fields: z.array(z.string()).min(1),
  unique: z.boolean().optional(),
  name: z.string().optional(),
});

export const createEntitySchema = z.object({
  name: z.string().min(1).max(100),
  tableNameOrCollection: z.string().min(1).max(100),
  description: z.string().min(1).max(2000),
  fields: z.array(entityFieldSchema).min(1),
  relationships: z.array(entityRelationshipSchema).default([]),
  indexes: z.array(entityIndexSchema).default([]),
  ownershipNotes: z.string().max(1000).optional(),
  seedRequirements: z.string().max(2000).optional(),
});

export const updateEntitySchema = createEntitySchema.partial();

export const apiParameterSchema = z.object({
  name: z.string().min(1),
  in: z.enum(['path', 'query', 'header', 'body']),
  required: z.boolean().default(true),
  type: z.string().default('string'),
  description: z.string().optional(),
});

export const apiResponseContractSchema = z.object({
  statusCode: z.number().int().min(100).max(599),
  description: z.string().min(1),
  schemaOrExample: z.string().optional(),
});

export const createApiEndpointSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']),
  route: z.string().min(1).max(200),
  summary: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  authentication: z.enum(['NONE', 'JWT', 'SESSION', 'API_KEY']).default('JWT'),
  requiredRoles: z.array(z.string()).default([]),
  parameters: z.array(apiParameterSchema).default([]),
  requestBodySchema: z.string().optional(),
  responses: z.array(apiResponseContractSchema).min(1),
  rateLimit: z.string().optional(),
  dependencies: z.array(z.string()).default([]),
});

export const updateApiEndpointSchema = createApiEndpointSchema.partial();

export const rbacRoleSchema = z.object({
  role: z.string().min(1),
  description: z.string().min(1),
  permissions: z.array(z.string()).default([]),
});

export const securityArchitectureSchema = z.object({
  authenticationStrategy: z.string().min(1),
  sessionManagement: z.string().min(1),
  passwordPolicy: z.string().optional(),
  rbacRoles: z.array(rbacRoleSchema).default([]),
  dataProtection: z.object({
    transitEncryption: z.string().default('TLS 1.3'),
    restEncryption: z.string().default('AES-256'),
    sensitiveFields: z.array(z.string()).default([]),
  }),
  securityHeaders: z.array(z.string()).default([]),
  rateLimitingStrategy: z.string().default('100 requests per minute'),
});

export const environmentVariableSpecSchema = z.object({
  key: z.string().min(1),
  description: z.string().min(1),
  classification: z.enum(['PUBLIC', 'SENSITIVE', 'SECRET']),
  exampleValue: z.string().optional(),
  required: z.boolean().default(true),
});

export const deploymentArchitectureSchema = z.object({
  platform: z.string().min(1),
  ciCdPipeline: z.string().min(1),
  scalingStrategy: z.string().default('Horizontal pod autoscaling / stateless instances'),
  cachingStrategy: z.string().default('Redis / in-memory cache'),
  backupStrategy: z.string().default('Automated daily snapshots'),
  environmentVariables: z.array(environmentVariableSpecSchema).default([]),
});

export const updateArchitecturePlanSchema = z.object({
  systemOverview: z.string().optional(),
  frontendArchitecture: z.string().optional(),
  backendArchitecture: z.string().optional(),
  security: securityArchitectureSchema.partial().optional(),
  deployment: deploymentArchitectureSchema.partial().optional(),
  diagramMermaid: z.string().optional(),
});

// === Third-Party Integrations & Human Actions (M8) ===

export const credentialRequirementSchema = z.object({
  name: z.string().min(1).max(100),
  classification: z.enum(['PUBLIC', 'SENSITIVE', 'SECRET']).default('SECRET'),
  description: z.string().min(1).max(500),
  whereToFind: z.string().max(500).optional(),
  exampleFormat: z.string().max(200).optional(),
  isProvided: z.boolean().default(false),
});

export const createIntegrationSchema = z.object({
  service: z.string().min(1).max(100),
  category: z.enum([
    'AUTH',
    'PAYMENT',
    'EMAIL',
    'SMS',
    'STORAGE',
    'MAPS',
    'ANALYTICS',
    'MONITORING',
    'AI_LLM',
    'DATABASE_CLOUD',
    'COMMUNICATION',
    'OTHER',
  ]),
  purpose: z.string().min(1).max(1000),
  accountRequired: z.boolean().default(true),
  accountName: z.string().max(200).optional(),
  credentialsRequired: z.array(credentialRequirementSchema).default([]),
  permissionsRequired: z.array(z.string()).default([]),
  configurationRequired: z.array(z.string()).default([]),
  humanSetupSteps: z.array(z.string()).default([]),
  aiResponsibilities: z.array(z.string()).default([]),
  humanResponsibilities: z.array(z.string()).default([]),
  securityClassification: z.enum(['PUBLIC', 'SENSITIVE', 'SECRET']).default('SECRET'),
  blockingStatus: z.enum(['BLOCKING', 'NON_BLOCKING']).default('BLOCKING'),
  estimatedCost: z.string().max(500).optional(),
  dependencies: z.array(z.string()).default([]),
  docsUrl: z.string().max(1000).optional(),
  status: z.enum(['IDENTIFIED', 'CONFIGURED', 'VERIFIED', 'SKIPPED']).default('IDENTIFIED'),
});

export const updateIntegrationSchema = createIntegrationSchema.partial();

export const createHumanActionSchema = z.object({
  actionId: z.string().max(50).optional(),
  title: z.string().min(1).max(200),
  category: z.enum([
    'ACCOUNT_SETUP',
    'CREDENTIALS',
    'LEGAL_COMPLIANCE',
    'BILLING',
    'DNS_DOMAIN',
    'VERIFICATION',
    'APPROVAL',
    'CONFIGURATION',
  ]),
  whyRequired: z.string().min(1).max(1000),
  prerequisites: z.array(z.string()).default([]),
  instructions: z.array(z.string().min(1)).min(1, 'At least one instruction step is required'),
  credentialsRequired: z.array(z.string()).default([]),
  whereToObtain: z.string().min(1).max(500),
  permissionsNeeded: z.string().max(500).optional(),
  isSecret: z.boolean().default(false),
  secretHandlingInstructions: z.string().max(1000).optional(),
  aiActionAfterward: z.string().min(1).max(1000),
  blockingStatus: z.enum(['BLOCKING', 'NON_BLOCKING']).default('BLOCKING'),
  completionStatus: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED']).default('PENDING'),
  integrationId: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

export const updateHumanActionSchema = createHumanActionSchema.partial();

export const updateHumanActionStatusSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED']),
  notes: z.string().max(2000).optional(),
});

// === Implementation Planning (M9) ===

export const roadmapPhaseSchema = z.object({
  id: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  order: z.number().int().min(1),
  targetDuration: z.string().max(100).optional(),
  deliverables: z.array(z.string()).default([]),
});

export const planMilestoneSchema = z.object({
  id: z.string().min(1).max(50),
  phaseId: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  order: z.number().int().min(1),
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED']).default('PLANNED'),
  criteria: z.array(z.string()).default([]),
});

export const planFeatureSchema = z.object({
  id: z.string().min(1).max(50),
  milestoneId: z.string().max(50).optional(),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  requirementIds: z.array(z.string()).default([]),
  screenRoutes: z.array(z.string()).default([]),
});

export const planUserStorySchema = z.object({
  id: z.string().min(1).max(50),
  featureId: z.string().min(1).max(50),
  role: z.string().min(1).max(100),
  want: z.string().min(1).max(500),
  benefit: z.string().min(1).max(500),
  acceptanceCriteria: z.array(z.string()).default([]),
});

export const createTaskSchema = z.object({
  taskId: z.string().max(50).optional(),
  storyId: z.string().max(50).optional(),
  featureId: z.string().max(50).optional(),
  milestoneId: z.string().max(50).optional(),
  phaseId: z.string().max(50).optional(),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  type: z.enum([
    'BACKEND',
    'FRONTEND',
    'DATABASE',
    'DEVOPS',
    'TESTING',
    'INTEGRATION',
    'SECURITY',
    'FULLSTACK',
  ]).default('FULLSTACK'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  complexity: z.enum(['XS', 'S', 'M', 'L', 'XL']).default('M'),
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED']).default('TODO'),
  dependencies: z.array(z.string()).default([]),
  affectedComponents: z.array(z.string()).default([]),
  subtasks: z.array(z.string()).min(1, 'At least one subtask is required'),
  acceptanceCriteria: z.array(z.string()).min(1, 'At least one acceptance criterion is required'),
  testCases: z.array(z.string()).min(1, 'At least one test case is required'),
  assignedAgent: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
});

export const updateTaskSchema = createTaskSchema.partial();

export const updateTaskStatusSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED']),
  notes: z.string().max(2000).optional(),
});

export const updateImplementationPlanSchema = z.object({
  summary: z.string().max(5000).optional(),
  roadmap: z.array(roadmapPhaseSchema).optional(),
  milestones: z.array(planMilestoneSchema).optional(),
  features: z.array(planFeatureSchema).optional(),
  userStories: z.array(planUserStorySchema).optional(),
  totalEstimatedHours: z.number().min(0).optional(),
});

// === Readiness Engine (M10) ===

export const categoryReadinessSchema = z.object({
  category: z.enum([
    'REQUIREMENTS',
    'UX_UI',
    'ARCHITECTURE',
    'DATABASE',
    'API',
    'TECHNOLOGY',
    'INTEGRATIONS',
    'SECURITY',
    'TESTING',
    'DEPLOYMENT',
    'HUMAN_ACTIONS',
  ]),
  title: z.string().min(1).max(200),
  status: z.enum(['PASS', 'WARN', 'FAIL', 'ACTION_REQUIRED']),
  score: z.number().min(0).max(100),
  summary: z.string().min(1).max(2000),
  findings: z.array(z.string()).default([]),
  blockers: z.array(z.string()).default([]),
  recommendations: z.array(z.string()).default([]),
});

export const projectApprovalSchema = z.object({
  isApproved: z.boolean().default(false),
  approvedAt: z.string().optional(),
  approvedBy: z.string().max(200).optional(),
  approvalNotes: z.string().max(2000).optional(),
});

export const approveProjectSchema = z.object({
  approvedBy: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
});

export const finalizeProjectSchema = z.object({
  notes: z.string().max(2000).optional(),
});

// === Specification Export & Versioning Schemas (M11) ===

export const specChangeRecordSchema = z.object({
  changedItem: z.string().min(1).max(200),
  oldValue: z.string().optional(),
  newValue: z.string().optional(),
  reason: z.string().min(1).max(1000),
  timestamp: z.string().default(() => new Date().toISOString()),
  affectsDownstream: z.boolean().default(false),
  downstreamArtifacts: z.array(z.string()).default([]),
});

export const createSpecVersionSchema = z.object({
  version: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  changes: z.array(specChangeRecordSchema).default([]),
});

export const projectSpecScopeSchema = z.object({
  inScope: z.array(z.string()).default([]),
  outOfScope: z.array(z.string()).default([]),
});

export const projectSpecUserSchema = z.object({
  role: z.string(),
  description: z.string(),
  permissions: z.array(z.string()).optional(),
});

export const projectSpecDecisionSchema = z.object({
  area: z.string(),
  decision: z.string(),
  rationale: z.string(),
});

export const projectSpecTestingSchema = z.object({
  unitTestingStrategy: z.string().default(''),
  integrationTestingStrategy: z.string().default(''),
  e2eTestingStrategy: z.string().default(''),
  testEnvironments: z.array(z.string()).default([]),
});

export const projectSpecMetadataSchema = z.object({
  generator: z.string().default('Project Planning Agent v2.0'),
  generatedAt: z.string().default(() => new Date().toISOString()),
  schemaVersion: z.string().default('2.0.0'),
  specVersion: z.string().default('v1.0'),
  totalTasks: z.number().default(0),
  totalRequirements: z.number().default(0),
});

export const projectSpecSchema = z.object({
  project: z.object({
    id: z.string(),
    name: z.string(),
    initialIdea: z.string(),
    description: z.string().optional(),
    targetPlatform: z.string().optional(),
    discoveryPhase: z.nativeEnum(DiscoveryPhase),
    status: z.nativeEnum(ProjectStatus),
    version: z.string().default('v1.0'),
  }),
  goals: z.array(z.string()).default([]),
  scope: projectSpecScopeSchema.default({ inScope: [], outOfScope: [] }),
  users: z.array(projectSpecUserSchema).default([]),
  requirements: z.array(
    z.object({
      reqId: z.string(),
      title: z.string(),
      description: z.string(),
      type: z.nativeEnum(RequirementType),
      priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
      status: z.nativeEnum(RequirementStatus),
      confidence: z.number(),
      dependencies: z.array(z.string()).optional(),
    })
  ).default([]),
  business_rules: z.array(z.string()).default([]),
  constraints: z.array(z.string()).default([]),
  assumptions: z.array(z.string()).default([]),
  open_questions: z.array(z.string()).default([]),
  decisions: z.array(projectSpecDecisionSchema).default([]),
  ux: z.object({
    visualCategory: z.nativeEnum(VisualThemeCategory).default(VisualThemeCategory.AGENT_DECIDE),
    themeMode: z.enum(['dark', 'light', 'system']).default('dark'),
    density: z.enum(['compact', 'comfortable', 'spacious']).default('comfortable'),
    typography: z.object({
      headingFont: z.string().default('Plus Jakarta Sans'),
      bodyFont: z.string().default('Inter'),
    }),
  }),
  design_system: z.object({
    colorPalette: colorPaletteSchema.default({}),
    tokens: z.record(z.string()).optional(),
  }),
  screens: z.array(
    z.object({
      name: z.string(),
      route: z.string(),
      purpose: z.string(),
      targetRoles: z.array(z.string()).default([]),
      layout: z.string().default(''),
      components: z.array(z.string()).default([]),
      responsiveBehavior: z.object({
        desktop: z.string().default(''),
        tablet: z.string().default(''),
        mobile: z.string().default(''),
      }),
      states: z.object({
        loading: z.string().optional(),
        empty: z.string().optional(),
        error: z.string().optional(),
        success: z.string().optional(),
      }).default({}),
      apiDependencies: z.array(z.string()).default([]),
      authRequired: z.boolean().default(false),
    })
  ).default([]),
  technology: z.array(
    z.object({
      category: z.nativeEnum(TechCategory),
      technology: z.string(),
      version: z.string().optional(),
      technicalRationale: z.string(),
      plainLanguageExplanation: z.string(),
      status: z.nativeEnum(TechDecisionStatus),
    })
  ).default([]),
  architecture: z.object({
    systemOverview: z.string().optional(),
    frontendArchitecture: z.string().optional(),
    backendArchitecture: z.string().optional(),
    security: securityArchitectureSchema.optional(),
    deployment: deploymentArchitectureSchema.optional(),
    diagramMermaid: z.string().optional(),
  }).nullable().default(null),
  database: z.object({
    entities: z.array(
      z.object({
        name: z.string(),
        collection: z.string(),
        description: z.string().optional(),
        fields: z.array(entityFieldSchema),
        relationships: z.array(entityRelationshipSchema).optional(),
        indexes: z.array(entityIndexSchema).optional(),
        ownership: z.string().optional(),
        seedRequirements: z.string().optional(),
      })
    ).default([]),
  }),
  api: z.object({
    endpoints: z.array(
      z.object({
        method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']),
        route: z.string(),
        summary: z.string(),
        authentication: z.enum(['NONE', 'JWT', 'SESSION', 'API_KEY']).optional(),
        requiredRoles: z.array(z.string()).optional(),
        parameters: z.array(apiParameterSchema).optional(),
        requestBodySchema: z.string().optional(),
        responses: z.array(apiResponseContractSchema).default([]),
        rateLimit: z.string().optional(),
        dependencies: z.array(z.string()).optional(),
      })
    ).default([]),
  }),
  integrations: z.array(
    z.object({
      service: z.string(),
      category: z.string(),
      purpose: z.string(),
      accountRequired: z.boolean(),
      credentialsRequired: z.array(z.string()),
      aiResponsibilities: z.array(z.string()),
      humanResponsibilities: z.array(z.string()),
      securityClassification: z.string(),
      blockingStatus: z.string(),
      estimatedCost: z.string().optional(),
    })
  ).default([]),
  security: securityArchitectureSchema.nullable().default(null),
  testing: projectSpecTestingSchema.default({
    unitTestingStrategy: '',
    integrationTestingStrategy: '',
    e2eTestingStrategy: '',
    testEnvironments: [],
  }),
  deployment: deploymentArchitectureSchema.nullable().default(null),
  roadmap: z.array(roadmapPhaseSchema).default([]),
  milestones: z.array(planMilestoneSchema).default([]),
  features: z.array(planFeatureSchema).default([]),
  user_stories: z.array(planUserStorySchema).default([]),
  tasks: z.array(
    z.object({
      taskId: z.string(),
      title: z.string(),
      description: z.string(),
      type: z.enum(['BACKEND', 'FRONTEND', 'DATABASE', 'DEVOPS', 'TESTING', 'INTEGRATION', 'SECURITY', 'FULLSTACK']),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
      complexity: z.enum(['XS', 'S', 'M', 'L', 'XL']),
      status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED']),
      dependencies: z.array(z.string()).default([]),
      affectedComponents: z.array(z.string()).default([]),
      subtasks: z.array(z.string()).default([]),
      acceptanceCriteria: z.array(z.string()).default([]),
      testCases: z.array(z.string()).default([]),
      assignedAgent: z.string().optional(),
    })
  ).default([]),
  human_actions: z.array(
    z.object({
      actionId: z.string(),
      title: z.string(),
      category: z.string(),
      whyRequired: z.string(),
      instructions: z.array(z.string()),
      whereToObtain: z.string().optional(),
      credentialsRequired: z.array(z.string()),
      isSecret: z.boolean(),
      aiActionAfterward: z.string(),
      blockingStatus: z.string(),
      completionStatus: z.string(),
    })
  ).default([]),
  readiness: z.object({
    overallStatus: z.nativeEnum(ProjectStatus),
    overallScore: z.number(),
    isReady: z.boolean(),
    summary: z.string(),
    blockingItems: z.array(z.string()),
    passedCategories: z.array(z.string()),
    failingCategories: z.array(z.string()),
  }).nullable().default(null),
  metadata: projectSpecMetadataSchema.default({
    generator: 'Project Planning Agent v2.0',
    generatedAt: new Date().toISOString(),
    schemaVersion: '2.0.0',
    specVersion: 'v1.0',
    totalTasks: 0,
    totalRequirements: 0,
  }),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateRequirementInput = z.infer<typeof createRequirementSchema>;
export type UpdateRequirementInput = z.infer<typeof updateRequirementSchema>;
export type CreateValidationIssueInput = z.infer<typeof createValidationIssueSchema>;
export type ResolveValidationIssueInput = z.infer<typeof resolveValidationIssueSchema>;
export type UpdateDesignSpecInput = z.infer<typeof updateDesignSpecSchema>;
export type AnalyzeImageInput = z.infer<typeof analyzeImageSchema>;
export type CreateScreenSpecInput = z.infer<typeof createScreenSpecSchema>;
export type UpdateScreenSpecInput = z.infer<typeof updateScreenSpecSchema>;
export type CreateTechRecommendationInput = z.infer<typeof createTechRecommendationSchema>;
export type UpdateTechRecommendationInput = z.infer<typeof updateTechRecommendationSchema>;
export type UpdateTechStatusInput = z.infer<typeof updateTechStatusSchema>;
export type CreateEntityInput = z.infer<typeof createEntitySchema>;
export type UpdateEntityInput = z.infer<typeof updateEntitySchema>;
export type CreateApiEndpointInput = z.infer<typeof createApiEndpointSchema>;
export type UpdateApiEndpointInput = z.infer<typeof updateApiEndpointSchema>;
export type UpdateArchitecturePlanInput = z.infer<typeof updateArchitecturePlanSchema>;
export type CredentialRequirementInput = z.infer<typeof credentialRequirementSchema>;
export type CreateIntegrationInput = z.infer<typeof createIntegrationSchema>;
export type UpdateIntegrationInput = z.infer<typeof updateIntegrationSchema>;
export type CreateHumanActionInput = z.infer<typeof createHumanActionSchema>;
export type UpdateHumanActionInput = z.infer<typeof updateHumanActionSchema>;
export type UpdateHumanActionStatusInput = z.infer<typeof updateHumanActionStatusSchema>;
export type RoadmapPhaseInput = z.infer<typeof roadmapPhaseSchema>;
export type PlanMilestoneInput = z.infer<typeof planMilestoneSchema>;
export type PlanFeatureInput = z.infer<typeof planFeatureSchema>;
export type PlanUserStoryInput = z.infer<typeof planUserStorySchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
export type UpdateImplementationPlanInput = z.infer<typeof updateImplementationPlanSchema>;
export type CategoryReadinessInput = z.infer<typeof categoryReadinessSchema>;
export type ProjectApprovalInput = z.infer<typeof projectApprovalSchema>;
export type ApproveProjectInput = z.infer<typeof approveProjectSchema>;
export type FinalizeProjectInput = z.infer<typeof finalizeProjectSchema>;
export type SpecChangeRecordInput = z.infer<typeof specChangeRecordSchema>;
export type CreateSpecVersionInput = z.infer<typeof createSpecVersionSchema>;
export type ProjectSpecInput = z.infer<typeof projectSpecSchema>;

// === Software Engineering Agent Integration Schemas (M13) ===

export const initializeHandoffSchema = z.object({
  agentName: z.string().max(100).optional(),
});

export const claimTaskSchema = z.object({
  agentName: z.string().max(100).optional(),
});

export const completeTaskSchema = z.object({
  agentName: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
  filesModified: z.array(z.string()).default([]),
  testsPassed: z.boolean().default(true),
});

export const failTaskSchema = z.object({
  agentName: z.string().max(100).optional(),
  reason: z.string().min(1, 'Failure reason is required').max(1000),
  errorDetails: z.string().max(5000).optional(),
});

export const submitFeedbackSchema = z.object({
  taskId: z.string().optional(),
  type: z.enum([
    'CLARIFICATION_NEEDED',
    'DEPENDENCY_BLOCKED',
    'CODE_ERROR',
    'TEST_FAILURE',
    'SPEC_DRIFT',
  ]),
  message: z.string().min(1, 'Feedback message is required').max(2000),
  suggestedRemedy: z.string().max(2000).optional(),
});

export type InitializeHandoffInput = z.infer<typeof initializeHandoffSchema>;
export type ClaimTaskInput = z.infer<typeof claimTaskSchema>;
export type CompleteTaskInput = z.infer<typeof completeTaskSchema>;
export type FailTaskInput = z.infer<typeof failTaskSchema>;
export type SubmitFeedbackInput = z.infer<typeof submitFeedbackSchema>;

// === User Authentication Schemas ===

export const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
});

export const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export const updateUserProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim().optional(),
  avatarUrl: z.string().url('Invalid avatar URL').optional(),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;








