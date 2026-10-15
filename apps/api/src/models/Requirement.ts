import mongoose, { Schema, type Document, type Types } from 'mongoose';
import { 
  RequirementType, 
  RequirementStatus, 
  type RequirementPriority, 
  type RequirementSource 
} from '@project-planner/types';

export interface RequirementDocument extends Document {
  projectId: Types.ObjectId;
  reqId: string;
  title?: string;
  description: string;
  type: RequirementType;
  priority: RequirementPriority;
  status: RequirementStatus;
  source: RequirementSource;
  confidence: number;
  dependencies: string[];
  createdAt: Date;
  updatedAt: Date;
}

const requirementSchema = new Schema<RequirementDocument>(
  {
    projectId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Project', 
      required: true, 
      index: true 
    },
    reqId: { 
      type: String, 
      required: true, 
      trim: true 
    },
    title: { 
      type: String, 
      trim: true 
    },
    description: { 
      type: String, 
      required: true, 
      trim: true 
    },
    type: { 
      type: String, 
      enum: Object.values(RequirementType), 
      required: true, 
      index: true 
    },
    priority: { 
      type: String, 
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], 
      default: 'MEDIUM' 
    },
    status: { 
      type: String, 
      enum: Object.values(RequirementStatus), 
      default: RequirementStatus.CONFIRMED,
      index: true 
    },
    source: { 
      type: String, 
      enum: ['USER', 'AGENT'], 
      default: 'USER' 
    },
    confidence: { 
      type: Number, 
      min: 0, 
      max: 1, 
      default: 1 
    },
    dependencies: { 
      type: [String], 
      default: [] 
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

// Compound index to ensure reqId is unique per project
requirementSchema.index({ projectId: 1, reqId: 1 }, { unique: true });

export const Requirement = mongoose.model<RequirementDocument>('Requirement', requirementSchema);
