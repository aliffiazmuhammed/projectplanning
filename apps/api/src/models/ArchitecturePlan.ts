import mongoose, { Schema, type Document, type Types } from 'mongoose';
import type {
  ISecurityArchitecture,
  IDeploymentArchitecture,
} from '@project-planner/types';

export interface ArchitecturePlanDocument extends Document {
  projectId: Types.ObjectId;
  systemOverview: string;
  frontendArchitecture: string;
  backendArchitecture: string;
  security: ISecurityArchitecture;
  deployment: IDeploymentArchitecture;
  diagramMermaid?: string;
  createdAt: Date;
  updatedAt: Date;
}

const rbacRoleSchema = new Schema(
  {
    role: { type: String, required: true },
    description: { type: String, required: true },
    permissions: { type: [String], default: [] },
  },
  { _id: false },
);

const securitySchema = new Schema<ISecurityArchitecture>(
  {
    authenticationStrategy: {
      type: String,
      default: 'JWT with HTTP-only refresh cookies and short-lived access tokens',
    },
    sessionManagement: {
      type: String,
      default: 'Stateless JWT with Redis token revocation blocklist',
    },
    passwordPolicy: {
      type: String,
      default: 'Minimum 8 characters with at least one number and special character; Argon2id hashing',
    },
    rbacRoles: {
      type: [rbacRoleSchema],
      default: [
        {
          role: 'ADMIN',
          description: 'Full administrative access to all project resources and billing',
          permissions: ['*'],
        },
        {
          role: 'MEMBER',
          description: 'Standard collaborator access to read, create, and update resources',
          permissions: ['read:*', 'create:*', 'update:*'],
        },
        {
          role: 'GUEST',
          description: 'Read-only access to published artifacts',
          permissions: ['read:public'],
        },
      ],
    },
    dataProtection: {
      transitEncryption: { type: String, default: 'TLS 1.3 enforced' },
      restEncryption: { type: String, default: 'AES-256 server-side encryption' },
      sensitiveFields: { type: [String], default: ['password', 'apiKey', 'tokens', 'secret'] },
    },
    securityHeaders: {
      type: [String],
      default: [
        'Content-Security-Policy',
        'X-Content-Type-Options: nosniff',
        'X-Frame-Options: DENY',
        'Strict-Transport-Security',
        'Referrer-Policy: strict-origin-when-cross-origin',
      ],
    },
    rateLimitingStrategy: {
      type: String,
      default: '100 requests per 15 minutes per IP address; stricter on auth routes',
    },
  },
  { _id: false },
);

const envVarSchema = new Schema(
  {
    key: { type: String, required: true },
    description: { type: String, required: true },
    classification: {
      type: String,
      enum: ['PUBLIC', 'SENSITIVE', 'SECRET'],
      required: true,
    },
    exampleValue: { type: String },
    required: { type: Boolean, default: true },
  },
  { _id: false },
);

const deploymentSchema = new Schema<IDeploymentArchitecture>(
  {
    platform: {
      type: String,
      default: 'Docker containerized deployment on cloud platform (e.g. Render, Railway, AWS ECS)',
    },
    ciCdPipeline: {
      type: String,
      default: 'GitHub Actions workflow with linting, automated testing, and preview deployments',
    },
    scalingStrategy: {
      type: String,
      default: 'Horizontal auto-scaling with stateless application containers',
    },
    cachingStrategy: {
      type: String,
      default: 'HTTP cache headers, CDN edge caching for static assets, Redis for query caching',
    },
    backupStrategy: {
      type: String,
      default: 'Automated daily database snapshots with point-in-time recovery',
    },
    environmentVariables: {
      type: [envVarSchema],
      default: [],
    },
  },
  { _id: false },
);

const architecturePlanSchema = new Schema<ArchitecturePlanDocument>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      unique: true,
      index: true,
    },
    systemOverview: {
      type: String,
      required: true,
    },
    frontendArchitecture: {
      type: String,
      required: true,
    },
    backendArchitecture: {
      type: String,
      required: true,
    },
    security: {
      type: securitySchema,
      default: () => ({}),
    },
    deployment: {
      type: deploymentSchema,
      default: () => ({}),
    },
    diagramMermaid: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  },
);

export const ArchitecturePlan = mongoose.model<ArchitecturePlanDocument>(
  'ArchitecturePlan',
  architecturePlanSchema,
);
