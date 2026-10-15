import mongoose, { Schema, type Document, type Types } from 'mongoose';
import type {
  IPlanTask,
  TaskType,
  TaskPriority,
  TaskComplexity,
  TaskStatus,
} from '@project-planner/types';

export interface PlanTaskDocument
  extends Document,
    Omit<IPlanTask, 'id' | 'projectId' | 'createdAt' | 'updatedAt'> {
  projectId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const planTaskSchema = new Schema<PlanTaskDocument>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    taskId: {
      type: String,
      required: true,
      trim: true,
    },
    storyId: {
      type: String,
      trim: true,
    },
    featureId: {
      type: String,
      trim: true,
    },
    milestoneId: {
      type: String,
      trim: true,
    },
    phaseId: {
      type: String,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        'BACKEND',
        'FRONTEND',
        'DATABASE',
        'DEVOPS',
        'TESTING',
        'INTEGRATION',
        'SECURITY',
        'FULLSTACK',
      ],
      default: 'FULLSTACK',
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    complexity: {
      type: String,
      enum: ['XS', 'S', 'M', 'L', 'XL'],
      default: 'M',
    },
    status: {
      type: String,
      enum: ['TODO', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'],
      default: 'TODO',
    },
    dependencies: {
      type: [String],
      default: [],
    },
    affectedComponents: {
      type: [String],
      default: [],
    },
    subtasks: {
      type: [String],
      required: true,
      default: [],
    },
    acceptanceCriteria: {
      type: [String],
      required: true,
      default: [],
    },
    testCases: {
      type: [String],
      required: true,
      default: [],
    },
    assignedAgent: {
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

planTaskSchema.index({ projectId: 1, taskId: 1 }, { unique: true });
planTaskSchema.index({ projectId: 1, status: 1 });
planTaskSchema.index({ projectId: 1, type: 1 });

export const PlanTask = mongoose.model<PlanTaskDocument>('PlanTask', planTaskSchema);
