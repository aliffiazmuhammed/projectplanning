import mongoose, { Schema, type Document, type Types } from 'mongoose';
import {
  TechCategory,
  TechDecisionStatus,
  type ITechAlternative,
  type ITechEvaluationCriteria,
} from '@project-planner/types';

export interface TechDecisionDocument extends Document {
  projectId: Types.ObjectId;
  category: TechCategory;
  technology: string;
  versionConsidered: string;
  plainLanguageExplanation: string;
  technicalRationale: string;
  evaluationCriteria: ITechEvaluationCriteria;
  compatibilityNotes: string;
  risksAndTradeoffs: string[];
  alternatives: ITechAlternative[];
  confidence: number;
  status: TechDecisionStatus;
  userNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const techAlternativeSchema = new Schema<ITechAlternative>(
  {
    name: { type: String, required: true },
    pros: { type: [String], default: [] },
    cons: { type: [String], default: [] },
    reasonNotChosen: { type: String, default: '' },
  },
  { _id: false },
);

const techEvaluationSchema = new Schema<ITechEvaluationCriteria>(
  {
    maturity: { type: Number, default: 8 },
    communityAdoption: { type: Number, default: 8 },
    documentationQuality: { type: Number, default: 8 },
    typeScriptSupport: { type: Number, default: 9 },
    performance: { type: Number, default: 8 },
    maintenance: { type: Number, default: 8 },
  },
  { _id: false },
);

const techDecisionSchema = new Schema<TechDecisionDocument>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: Object.values(TechCategory),
      required: true,
    },
    technology: {
      type: String,
      required: true,
      trim: true,
    },
    versionConsidered: {
      type: String,
      default: 'latest',
      trim: true,
    },
    plainLanguageExplanation: {
      type: String,
      required: true,
    },
    technicalRationale: {
      type: String,
      required: true,
    },
    evaluationCriteria: {
      type: techEvaluationSchema,
      default: () => ({}),
    },
    compatibilityNotes: {
      type: String,
      default: '',
    },
    risksAndTradeoffs: {
      type: [String],
      default: [],
    },
    alternatives: {
      type: [techAlternativeSchema],
      default: [],
    },
    confidence: {
      type: Number,
      default: 0.9,
    },
    status: {
      type: String,
      enum: Object.values(TechDecisionStatus),
      default: TechDecisionStatus.RECOMMENDED,
      index: true,
    },
    userNotes: {
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

techDecisionSchema.index({ projectId: 1, category: 1 }, { unique: true });

export const TechDecision = mongoose.model<TechDecisionDocument>('TechDecision', techDecisionSchema);
