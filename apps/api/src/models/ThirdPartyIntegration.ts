import mongoose, { Schema, type Document, type Types } from 'mongoose';
import type {
  IThirdPartyIntegration,
  ICredentialRequirement,
  IntegrationCategory,
  IntegrationStatus,
  SecurityClassification,
  BlockingStatus,
} from '@project-planner/types';

export interface ThirdPartyIntegrationDocument
  extends Document,
    Omit<IThirdPartyIntegration, 'id' | 'projectId' | 'createdAt' | 'updatedAt'> {
  projectId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}


const credentialRequirementSchema = new Schema<ICredentialRequirement>(
  {
    name: { type: String, required: true, trim: true },
    classification: {
      type: String,
      enum: ['PUBLIC', 'SENSITIVE', 'SECRET'],
      default: 'SECRET',
    },
    description: { type: String, required: true },
    whereToFind: { type: String },
    exampleFormat: { type: String },
    isProvided: { type: Boolean, default: false },
  },
  { _id: false },
);

const thirdPartyIntegrationSchema = new Schema<ThirdPartyIntegrationDocument>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    service: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: [
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
      ],
      required: true,
    },
    purpose: {
      type: String,
      required: true,
    },
    accountRequired: {
      type: Boolean,
      default: true,
    },
    accountName: {
      type: String,
    },
    credentialsRequired: {
      type: [credentialRequirementSchema],
      default: [],
    },
    permissionsRequired: {
      type: [String],
      default: [],
    },
    configurationRequired: {
      type: [String],
      default: [],
    },
    humanSetupSteps: {
      type: [String],
      default: [],
    },
    aiResponsibilities: {
      type: [String],
      default: [],
    },
    humanResponsibilities: {
      type: [String],
      default: [],
    },
    securityClassification: {
      type: String,
      enum: ['PUBLIC', 'SENSITIVE', 'SECRET'],
      default: 'SECRET',
    },
    blockingStatus: {
      type: String,
      enum: ['BLOCKING', 'NON_BLOCKING'],
      default: 'BLOCKING',
    },
    estimatedCost: {
      type: String,
    },
    dependencies: {
      type: [String],
      default: [],
    },
    docsUrl: {
      type: String,
    },
    status: {
      type: String,
      enum: ['IDENTIFIED', 'CONFIGURED', 'VERIFIED', 'SKIPPED'],
      default: 'IDENTIFIED',
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

thirdPartyIntegrationSchema.index({ projectId: 1, service: 1 }, { unique: true });

export const ThirdPartyIntegration = mongoose.model<ThirdPartyIntegrationDocument>(
  'ThirdPartyIntegration',
  thirdPartyIntegrationSchema,
);
