import mongoose, { Schema, type Document, type Types } from 'mongoose';
import type { 
  ISpecificationVersion, 
  IProjectSpec, 
  ISpecChangeRecord 
} from '@project-planner/types';

export interface SpecificationVersionDocument 
  extends Document, 
    Omit<ISpecificationVersion, 'id' | 'projectId'> {
  projectId: Types.ObjectId;
}

const specChangeRecordSchema = new Schema(
  {
    changedItem: { type: String, required: true },
    oldValue: { type: String },
    newValue: { type: String },
    reason: { type: String, required: true },
    timestamp: { type: String, default: () => new Date().toISOString() },
    affectsDownstream: { type: Boolean, default: false },
    downstreamArtifacts: { type: [String], default: [] },
  },
  { _id: false }
);

const specificationVersionSchema = new Schema<SpecificationVersionDocument>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    version: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    spec: {
      type: Schema.Types.Mixed,
      required: true,
    },
    changes: {
      type: [specChangeRecordSchema],
      default: [],
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: String,
      default: 'Founder',
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

// Unique compound index so a project cannot have duplicate versions (e.g., duplicate 'v1.0')
specificationVersionSchema.index({ projectId: 1, version: 1 }, { unique: true });
specificationVersionSchema.index({ projectId: 1, createdAt: -1 });

export const SpecificationVersion = mongoose.model<SpecificationVersionDocument>(
  'SpecificationVersion',
  specificationVersionSchema
);
