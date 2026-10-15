import mongoose, { Schema, type Document, type Types } from 'mongoose';
import type {
  IEngineeringAgentHandoff,
  HandoffStatus,
  IAgentFeedbackReport,
  IAgentActivityLog,
} from '@project-planner/types';

export interface EngineeringAgentHandoffDocument
  extends Document,
    Omit<IEngineeringAgentHandoff, 'id' | 'projectId' | 'createdAt' | 'updatedAt'> {
  projectId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const feedbackReportSchema = new Schema(
  {
    taskId: { type: String },
    type: {
      type: String,
      enum: [
        'CLARIFICATION_NEEDED',
        'DEPENDENCY_BLOCKED',
        'CODE_ERROR',
        'TEST_FAILURE',
        'SPEC_DRIFT',
      ],
      required: true,
    },
    message: { type: String, required: true },
    suggestedRemedy: { type: String },
    resolved: { type: Boolean, default: false },
    timestamp: { type: String, default: () => new Date().toISOString() },
  },
  {
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

const activityLogSchema = new Schema(
  {
    action: {
      type: String,
      enum: [
        'HANDOFF_INITIALIZED',
        'TASK_STARTED',
        'TASK_COMPLETED',
        'TASK_FAILED',
        'FEEDBACK_SUBMITTED',
      ],
      required: true,
    },
    taskId: { type: String },
    agentName: { type: String, required: true },
    details: { type: String, required: true },
    timestamp: { type: String, default: () => new Date().toISOString() },
  },
  {
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

const engineeringAgentHandoffSchema = new Schema<EngineeringAgentHandoffDocument>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    handoffId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    specVersion: {
      type: String,
      required: true,
      default: 'v1.0',
    },
    specChecksum: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['INITIALIZED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'],
      default: 'INITIALIZED',
    },
    agentName: {
      type: String,
      default: 'Autonomous Software Engineering Agent',
    },
    taskProgress: {
      total: { type: Number, default: 0 },
      completed: { type: Number, default: 0 },
      inProgress: { type: Number, default: 0 },
      blocked: { type: Number, default: 0 },
      percentComplete: { type: Number, default: 0 },
    },
    feedbackReports: {
      type: [feedbackReportSchema],
      default: [],
    },
    activityLog: {
      type: [activityLogSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id.toString();
        ret.projectId = ret.projectId?.toString();
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id.toString();
        ret.projectId = ret.projectId?.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

engineeringAgentHandoffSchema.index({ projectId: 1, handoffId: 1 });
engineeringAgentHandoffSchema.index({ projectId: 1, createdAt: -1 });

export const EngineeringAgentHandoff = mongoose.model<EngineeringAgentHandoffDocument>(
  'EngineeringAgentHandoff',
  engineeringAgentHandoffSchema
);
