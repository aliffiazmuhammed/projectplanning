import { logger } from '../config/logger.js';
import { DatabaseEntity, type DatabaseEntityDocument } from '../models/DatabaseEntity.js';
import { ApiEndpoint, type ApiEndpointDocument } from '../models/ApiEndpoint.js';
import { ArchitecturePlan, type ArchitecturePlanDocument } from '../models/ArchitecturePlan.js';
import { Requirement } from '../models/Requirement.js';
import { ScreenSpec } from '../models/ScreenSpec.js';
import { TechDecision } from '../models/TechDecision.js';
import type { ProjectDocument } from '../models/Project.js';
import type {
  HttpMethod,
  IEntityField,
  IEntityRelationship,
  IEntityIndex,
  IApiParameter,
  IApiResponseContract,
  ISecurityArchitecture,
  IDeploymentArchitecture,
} from '@project-planner/types';
import { AiProvider } from './ai.provider.js';

interface RawDatabaseEntity {
  name: string;
  tableNameOrCollection: string;
  description: string;
  fields: IEntityField[];
  relationships: IEntityRelationship[];
  indexes: IEntityIndex[];
  ownershipNotes?: string;
  seedRequirements?: string;
}

interface RawApiEndpoint {
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
  dependencies: string[];
}

interface RawArchitecturePlan {
  systemOverview: string;
  frontendArchitecture: string;
  backendArchitecture: string;
  security: ISecurityArchitecture;
  deployment: IDeploymentArchitecture;
  diagramMermaid?: string;
}

const DATABASE_DESIGN_PROMPT = `You are a Principal Database Architect and Data Modeler.
Design a complete, production-ready database schema (entities/collections, fields, data types, relationships, indexes, constraints, and ownership) for the software project.

Follow these strict guidelines:
- Include primary keys, foreign keys, timestamps (createdAt, updatedAt).
- For each entity specify fields (name, type, required, unique, defaultValue, description).
- Specify relationships (ONE_TO_ONE, ONE_TO_MANY, MANY_TO_MANY) with relatedEntity and foreignKey.
- Specify indexes (fields, unique, name).
- Include seedRequirements and ownershipNotes.

Output Format:
Return a JSON array of database entity objects:
[
  {
    "name": "User",
    "tableNameOrCollection": "users",
    "description": "Registered account holders and team members.",
    "fields": [
      { "name": "id", "type": "String", "required": true, "unique": true, "description": "Unique identifier" },
      { "name": "email", "type": "String", "required": true, "unique": true, "description": "User email address" },
      { "name": "passwordHash", "type": "String", "required": true, "description": "Argon2id hashed password" },
      { "name": "role", "type": "String", "required": true, "defaultValue": "MEMBER", "description": "RBAC user role" }
    ],
    "relationships": [
      { "relatedEntity": "Project", "type": "ONE_TO_MANY", "foreignKey": "ownerId", "description": "User owns multiple projects" }
    ],
    "indexes": [
      { "fields": ["email"], "unique": true, "name": "idx_users_email" }
    ],
    "ownershipNotes": "Only user or system admin can view/modify user credentials",
    "seedRequirements": "Initial system superadmin account"
  }
]`;

const API_SPEC_PROMPT = `You are a Principal API Architect and Integration Specialist.
Design a complete, RESTful API endpoint specification for this software application.

Ensure endpoints directly serve the frontend screens and functional requirements:
- Use clean semantic REST paths (/api/resource, /api/resource/:id).
- Specify HTTP methods (GET, POST, PUT, PATCH, DELETE).
- Define authentication (NONE, JWT, SESSION, API_KEY) and requiredRoles.
- Define request parameters (path, query, body) with types and descriptions.
- Define response contracts (status codes 200, 201, 400, 401, 404, 500) with description and schema / examples.
- Include rate-limiting considerations and business logic dependencies.

Output Format:
Return a JSON array of API endpoint objects:
[
  {
    "method": "POST",
    "route": "/api/auth/register",
    "summary": "Register a new user account",
    "description": "Creates a new user profile, hashes password, and returns auth session tokens.",
    "authentication": "NONE",
    "requiredRoles": [],
    "parameters": [
      { "name": "body", "in": "body", "required": true, "type": "{ email, password, name }" }
    ],
    "requestBodySchema": "{\\n  \\"email\\": \\"string\\",\\n  \\"password\\": \\"string\\",\\n  \\"name\\": \\"string\\"\\n}",
    "responses": [
      { "statusCode": 201, "description": "User created successfully", "schemaOrExample": "{\\"token\\": \\"...\\", \\"user\\": { ... }}" },
      { "statusCode": 400, "description": "Validation error or weak password" },
      { "statusCode": 409, "description": "Email already registered" }
    ],
    "rateLimit": "5 attempts per minute per IP",
    "dependencies": ["User collection", "Auth service"]
  }
]`;

const SYSTEM_ARCHITECTURE_PROMPT = `You are a Chief Enterprise Architect and Cloud Infrastructure Lead.
Produce a comprehensive System Architecture, Security Architecture, and Deployment Topology plan for this project.

Ensure you cover:
1. systemOverview: Clear explanation of how frontend, backend, database, and third-party services connect.
2. frontendArchitecture: Component structure, routing, state management, client-side caching.
3. backendArchitecture: Modular service layout, middleware pipeline, validation, controllers.
4. security:
   - authenticationStrategy (e.g. JWT with HTTP-only cookies, OAuth 2.0)
   - sessionManagement
   - passwordPolicy
   - rbacRoles (role, description, permissions array)
   - dataProtection (transitEncryption: TLS 1.3, restEncryption: AES-256, sensitiveFields)
   - securityHeaders (Helmet CSP, HSTS, X-Frame-Options)
   - rateLimitingStrategy
5. deployment:
   - platform (e.g. Docker containerization on AWS/Render/Railway)
   - ciCdPipeline (e.g. GitHub Actions with test and deploy stages)
   - scalingStrategy
   - cachingStrategy
   - backupStrategy
   - environmentVariables: list of variables with key, description, classification (PUBLIC, SENSITIVE, SECRET), exampleValue, required.
6. diagramMermaid: Valid Mermaid flowchart ('flowchart TD') depicting client, CDN, backend API server, database, cache, and external APIs.

Output Format:
Return a JSON object:
{
  "systemOverview": "...",
  "frontendArchitecture": "...",
  "backendArchitecture": "...",
  "security": {
    "authenticationStrategy": "...",
    "sessionManagement": "...",
    "passwordPolicy": "...",
    "rbacRoles": [
      { "role": "ADMIN", "description": "...", "permissions": ["*"] }
    ],
    "dataProtection": {
      "transitEncryption": "TLS 1.3",
      "restEncryption": "AES-256",
      "sensitiveFields": ["password", "apiKey"]
    },
    "securityHeaders": ["Content-Security-Policy", "Strict-Transport-Security"],
    "rateLimitingStrategy": "..."
  },
  "deployment": {
    "platform": "...",
    "ciCdPipeline": "...",
    "scalingStrategy": "...",
    "cachingStrategy": "...",
    "backupStrategy": "...",
    "environmentVariables": [
      { "key": "PORT", "description": "Server listening port", "classification": "PUBLIC", "exampleValue": "3001", "required": true },
      { "key": "DATABASE_URL", "description": "Connection string", "classification": "SECRET", "exampleValue": "mongodb://...", "required": true }
    ]
  },
  "diagramMermaid": "flowchart TD\\n  Client[User Browser] --> CDN[Cloud CDN]\\n  CDN --> API[API Server]\\n  API --> DB[(Database)]"
}`;

export async function generateCompleteArchitecture(project: ProjectDocument): Promise<{
  plan: ArchitecturePlanDocument;
  entities: DatabaseEntityDocument[];
  endpoints: ApiEndpointDocument[];
}> {
  try {
    const [requirements, screens, techStack] = await Promise.all([
      Requirement.find({ projectId: project._id }),
      ScreenSpec.find({ projectId: project._id }),
      TechDecision.find({ projectId: project._id }),
    ]);

    const reqsText = requirements
      .map((r) => `[${r.reqId}] (${r.type}) ${r.title ? `${r.title}: ` : ''}${r.description}`)
      .join('\n');

    const screensText = screens
      .map((s) => `Screen: ${s.name} (${s.route}) - Layout: ${s.layout} - APIs: ${s.apiDependencies?.join(', ') || 'N/A'}`)
      .join('\n');

    const techText = techStack
      .map((t) => `${t.category}: ${t.technology} (${t.versionConsidered})`)
      .join('\n');

    const context = `Project: "${project.name}"
Initial Idea: "${project.initialIdea}"
Target Platform: "${project.targetPlatform || 'Web'}"

Technology Choices:
${techText || 'TypeScript monorepo with React frontend, Node.js/Express API, MongoDB database.'}

Requirements:
${reqsText || 'Standard MVP functionality.'}

Frontend Screens:
${screensText || 'Multi-view dashboard and management interface.'}`;

    // Run parallel Important Task AI generation for Database, APIs, and System Architecture (Gemini primary, Groq fallback)
    const [dbResult, apiResult, sysResult] = await Promise.all([
      AiProvider.importantJson<any>({ prompt: `${context}\n\n${DATABASE_DESIGN_PROMPT}` }),
      AiProvider.importantJson<any>({ prompt: `${context}\n\n${API_SPEC_PROMPT}` }),
      AiProvider.importantJson<any>({ prompt: `${context}\n\n${SYSTEM_ARCHITECTURE_PROMPT}` }),
    ]);

    // Parse and upsert Database Entities
    let rawEntities: RawDatabaseEntity[] = [];
    try {
      const parsed = dbResult.data;
      rawEntities = Array.isArray(parsed) ? parsed : parsed?.entities || [];
    } catch (err) {
      logger.error({ err }, 'Failed to parse database entities JSON');
    }

    const savedEntities: DatabaseEntityDocument[] = [];
    for (const item of rawEntities) {
      if (!item.name) continue;
      const existing = await DatabaseEntity.findOne({ projectId: project._id, name: item.name });
      if (existing) {
        existing.tableNameOrCollection = item.tableNameOrCollection || existing.tableNameOrCollection;
        existing.description = item.description || existing.description;
        existing.fields = item.fields || existing.fields;
        existing.relationships = item.relationships || existing.relationships;
        existing.indexes = item.indexes || existing.indexes;
        existing.ownershipNotes = item.ownershipNotes || existing.ownershipNotes;
        existing.seedRequirements = item.seedRequirements || existing.seedRequirements;
        await existing.save();
        savedEntities.push(existing);
      } else {
        const created = await DatabaseEntity.create({
          projectId: project._id,
          name: item.name,
          tableNameOrCollection: item.tableNameOrCollection || item.name.toLowerCase() + 's',
          description: item.description,
          fields: item.fields || [],
          relationships: item.relationships || [],
          indexes: item.indexes || [],
          ownershipNotes: item.ownershipNotes,
          seedRequirements: item.seedRequirements,
        });
        savedEntities.push(created);
      }
    }

    // Parse and upsert API Endpoints
    let rawEndpoints: RawApiEndpoint[] = [];
    try {
      const parsed = apiResult.data;
      rawEndpoints = Array.isArray(parsed) ? parsed : parsed?.endpoints || [];
    } catch (err) {
      logger.error({ err }, 'Failed to parse API endpoints JSON');
    }

    const savedEndpoints: ApiEndpointDocument[] = [];
    for (const item of rawEndpoints) {
      if (!item.method || !item.route) continue;
      const existing = await ApiEndpoint.findOne({
        projectId: project._id,
        method: item.method,
        route: item.route,
      });
      if (existing) {
        existing.summary = item.summary || existing.summary;
        existing.description = item.description || existing.description;
        existing.authentication = item.authentication || existing.authentication;
        existing.requiredRoles = item.requiredRoles || existing.requiredRoles;
        existing.parameters = item.parameters || existing.parameters;
        existing.requestBodySchema = item.requestBodySchema || existing.requestBodySchema;
        existing.responses = item.responses || existing.responses;
        existing.rateLimit = item.rateLimit || existing.rateLimit;
        existing.dependencies = item.dependencies || existing.dependencies;
        await existing.save();
        savedEndpoints.push(existing);
      } else {
        const created = await ApiEndpoint.create({
          projectId: project._id,
          method: item.method,
          route: item.route,
          summary: item.summary,
          description: item.description,
          authentication: item.authentication || 'JWT',
          requiredRoles: item.requiredRoles || [],
          parameters: item.parameters || [],
          requestBodySchema: item.requestBodySchema,
          responses: item.responses || [],
          rateLimit: item.rateLimit,
          dependencies: item.dependencies || [],
        });
        savedEndpoints.push(created);
      }
    }

    // Parse and upsert System Architecture Plan
    let rawSys: RawArchitecturePlan = {
      systemOverview: 'Full-stack application architecture.',
      frontendArchitecture: 'Component-driven SPA structure.',
      backendArchitecture: 'RESTful API architecture.',
      security: {} as any,
      deployment: {} as any,
    };

    try {
      rawSys = sysResult.data || rawSys;
    } catch (err) {
      logger.error({ err }, 'Failed to parse system architecture plan JSON');
    }

    let plan = await ArchitecturePlan.findOne({ projectId: project._id });
    if (plan) {
      plan.systemOverview = rawSys.systemOverview || plan.systemOverview;
      plan.frontendArchitecture = rawSys.frontendArchitecture || plan.frontendArchitecture;
      plan.backendArchitecture = rawSys.backendArchitecture || plan.backendArchitecture;
      if (rawSys.security) plan.security = rawSys.security;
      if (rawSys.deployment) plan.deployment = rawSys.deployment;
      if (rawSys.diagramMermaid) plan.diagramMermaid = rawSys.diagramMermaid;
      await plan.save();
    } else {
      plan = await ArchitecturePlan.create({
        projectId: project._id,
        systemOverview: rawSys.systemOverview || 'Full-stack modular architecture',
        frontendArchitecture: rawSys.frontendArchitecture || 'React TypeScript interface',
        backendArchitecture: rawSys.backendArchitecture || 'Express / Node.js REST API',
        security: rawSys.security || {},
        deployment: rawSys.deployment || {},
        diagramMermaid: rawSys.diagramMermaid,
      });
    }

    logger.info(
      {
        projectId: project.id,
        entitiesCount: savedEntities.length,
        endpointsCount: savedEndpoints.length,
      },
      'Complete architecture generated and persisted',
    );

    return { plan, entities: savedEntities, endpoints: savedEndpoints };
  } catch (error) {
    logger.error({ error, projectId: project.id }, 'Error generating complete architecture');
    throw error;
  }
}
