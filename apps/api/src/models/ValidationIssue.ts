import mongoose, { Schema, type Document, type Types } from 'mongoose';
import { 
  ValidationIssueType, 
  ValidationSeverity, 
  ValidationIssueStatus 
} from '@project-planner/types';

export interface ValidationIssueDocument extends Document {
  projectId: Types.ObjectId;
  type: ValidationIssueType;
  title: string;
  description: string;
  severity: ValidationSeverity;
  status: ValidationIssueStatus;
  affectedRequirements: string[];
  suggestedResolutions: string[];
  resolutionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const validationIssueSchema = new Schema<ValidationIssueDocument>(
  {
    projectId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Project', 
      required: true, 
      index: true 
    },
    type: { 
      type: String, 
      enum: Object.values(ValidationIssueType), 
      required: true, 
      index: true 
    },
    title: { 
      type: String, 
      required: true, 
      trim: true 
    },
    description: { 
      type: String, 
      required: true, 
      trim: true 
    },
    severity: { 
      type: String, 
      enum: Object.values(ValidationSeverity), 
      default: ValidationSeverity.WARNING,
      index: true 
    },
    status: { 
      type: String, 
      enum: Object.values(ValidationIssueStatus), 
      default: ValidationIssueStatus.OPEN,
      index: true 
    },
    affectedRequirements: { 
      type: [String], 
      default: [] 
    },
    suggestedResolutions: { 
      type: [String], 
      default: [] 
    },
    resolutionNotes: { 
      type: String, 
      trim: true 
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

validationIssueSchema.index({ projectId: 1, status: 1, type: 1 });

export const ValidationIssue = mongoose.model<ValidationIssueDocument>(
  'ValidationIssue', 
  validationIssueSchema
);
