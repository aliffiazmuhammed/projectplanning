import mongoose, { Schema, type Document, type Types } from 'mongoose';
import type {
  IImplementationPlan,
  IPlanRoadmapPhase,
  IPlanMilestone,
  IPlanFeature,
  IPlanUserStory,
} from '@project-planner/types';

export interface ImplementationPlanDocument
  extends Document,
    Omit<IImplementationPlan, 'id' | 'projectId' | 'createdAt' | 'updatedAt'> {
  projectId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const roadmapPhaseSchema = new Schema<IPlanRoadmapPhase>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    order: { type: Number, required: true },
    targetDuration: { type: String },
    deliverables: { type: [String], default: [] },
  },
  { _id: false },
);

const planMilestoneSchema = new Schema<IPlanMilestone>(
  {
    id: { type: String, required: true },
    phaseId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    order: { type: Number, required: true },
    status: {
      type: String,
      enum: ['PLANNED', 'IN_PROGRESS', 'COMPLETED'],
      default: 'PLANNED',
    },
    criteria: { type: [String], default: [] },
  },
  { _id: false },
);

const planFeatureSchema = new Schema<IPlanFeature>(
  {
    id: { type: String, required: true },
    milestoneId: { type: String },
    title: { type: String, required: true },
    description: { type: String, required: true },
    requirementIds: { type: [String], default: [] },
    screenRoutes: { type: [String], default: [] },
  },
  { _id: false },
);

const planUserStorySchema = new Schema<IPlanUserStory>(
  {
    id: { type: String, required: true },
    featureId: { type: String, required: true },
    role: { type: String, required: true },
    want: { type: String, required: true },
    benefit: { type: String, required: true },
    acceptanceCriteria: { type: [String], default: [] },
  },
  { _id: false },
);

const implementationPlanSchema = new Schema<ImplementationPlanDocument>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      unique: true,
      index: true,
    },
    summary: {
      type: String,
      required: true,
      default: '',
    },
    roadmap: {
      type: [roadmapPhaseSchema],
      default: [],
    },
    milestones: {
      type: [planMilestoneSchema],
      default: [],
    },
    features: {
      type: [planFeatureSchema],
      default: [],
    },
    userStories: {
      type: [planUserStorySchema],
      default: [],
    },
    totalEstimatedHours: {
      type: Number,
      default: 0,
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

export const ImplementationPlan = mongoose.model<ImplementationPlanDocument>(
  'ImplementationPlan',
  implementationPlanSchema,
);
