import mongoose, { Schema, type Document, type Types } from 'mongoose';
import {
  ProjectStatus,
  type IProjectReadinessReport,
  type ICategoryReadiness,
  type IProjectApproval,
  type ReadinessCategory,
  type ReadinessItemStatus,
} from '@project-planner/types';

export interface ProjectReadinessDocument
  extends Document,
    Omit<IProjectReadinessReport, 'id' | 'projectId' | 'evaluatedAt' | 'createdAt' | 'updatedAt'> {
  projectId: Types.ObjectId;
  evaluatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const categoryReadinessSchema = new Schema<ICategoryReadiness>(
  {
    category: {
      type: String,
      enum: [
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
      ],
      required: true,
    },
    title: { type: String, required: true },
    status: {
      type: String,
      enum: ['PASS', 'WARN', 'FAIL', 'ACTION_REQUIRED'],
      required: true,
    },
    score: { type: Number, required: true, min: 0, max: 100 },
    summary: { type: String, required: true },
    findings: { type: [String], default: [] },
    blockers: { type: [String], default: [] },
    recommendations: { type: [String], default: [] },
  },
  { _id: false },
);

const projectApprovalSchema = new Schema<IProjectApproval>(
  {
    isApproved: { type: Boolean, default: false },
    approvedAt: { type: String },
    approvedBy: { type: String },
    approvalNotes: { type: String },
  },
  { _id: false },
);

const projectReadinessSchema = new Schema<ProjectReadinessDocument>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      unique: true,
      index: true,
    },
    overallStatus: {
      type: String,
      enum: Object.values(ProjectStatus),
      required: true,
      default: ProjectStatus.DISCOVERY,
    },
    overallScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0,
    },
    isReady: {
      type: Boolean,
      required: true,
      default: false,
    },
    summary: {
      type: String,
      required: true,
      default: '',
    },
    blockingItems: {
      type: [String],
      default: [],
    },
    categories: {
      type: Map,
      of: categoryReadinessSchema,
      default: {},
    },
    approval: {
      type: projectApprovalSchema,
      default: () => ({ isApproved: false }),
    },
    evaluatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        // Convert Map to plain object for client consumption
        if (ret.categories instanceof Map) {
          ret.categories = Object.fromEntries(ret.categories);
        }
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        if (ret.categories instanceof Map) {
          ret.categories = Object.fromEntries(ret.categories);
        }
        return ret;
      },
    },
  },
);

export const ProjectReadiness = mongoose.model<ProjectReadinessDocument>(
  'ProjectReadiness',
  projectReadinessSchema,
);
