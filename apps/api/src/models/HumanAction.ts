import mongoose, { Schema, type Document, type Types } from 'mongoose';
import type {
  IHumanAction,
  HumanActionCategory,
  HumanActionStatus,
  BlockingStatus,
} from '@project-planner/types';

export interface HumanActionDocument
  extends Document,
    Omit<IHumanAction, 'id' | 'projectId' | 'createdAt' | 'updatedAt'> {
  projectId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}


const humanActionSchema = new Schema<HumanActionDocument>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    actionId: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'ACCOUNT_SETUP',
        'CREDENTIALS',
        'LEGAL_COMPLIANCE',
        'BILLING',
        'DNS_DOMAIN',
        'VERIFICATION',
        'APPROVAL',
        'CONFIGURATION',
      ],
      required: true,
    },
    whyRequired: {
      type: String,
      required: true,
    },
    prerequisites: {
      type: [String],
      default: [],
    },
    instructions: {
      type: [String],
      required: true,
      default: [],
    },
    credentialsRequired: {
      type: [String],
      default: [],
    },
    whereToObtain: {
      type: String,
      required: true,
    },
    permissionsNeeded: {
      type: String,
    },
    isSecret: {
      type: Boolean,
      default: false,
    },
    secretHandlingInstructions: {
      type: String,
    },
    aiActionAfterward: {
      type: String,
      required: true,
    },
    blockingStatus: {
      type: String,
      enum: ['BLOCKING', 'NON_BLOCKING'],
      default: 'BLOCKING',
    },
    completionStatus: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'],
      default: 'PENDING',
    },
    integrationId: {
      type: String,
    },
    notes: {
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

humanActionSchema.index({ projectId: 1, actionId: 1 }, { unique: true });

export const HumanAction = mongoose.model<HumanActionDocument>(
  'HumanAction',
  humanActionSchema,
);
