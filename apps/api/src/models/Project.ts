import mongoose, { Schema, type Document } from 'mongoose';
import { 
  ProjectStatus, 
  DiscoveryPhase, 
  VisualThemeCategory, 
  type IDesignSpec 
} from '@project-planner/types';

export interface ProjectDocument extends Document {
  name: string;
  description?: string;
  initialIdea: string;
  targetPlatform?: string;
  status: ProjectStatus;
  discoveryPhase: DiscoveryPhase;
  conversationSummary?: string;
  messageCount: number;
  designSpec?: IDesignSpec;
  version: string;
  ownerId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const referenceImageSchema = new Schema(
  {
    name: { type: String, required: true },
    dataUrl: { type: String },
    analysis: { type: String },
    uploadedAt: { type: String, default: () => new Date().toISOString() },
  },
  { _id: true }
);

const designSpecSchema = new Schema(
  {
    visualCategory: {
      type: String,
      enum: Object.values(VisualThemeCategory),
      default: VisualThemeCategory.AGENT_DECIDE,
    },
    themeMode: {
      type: String,
      enum: ['dark', 'light', 'system'],
      default: 'dark',
    },
    colorPalette: {
      primary: { type: String, default: '#6366f1' },
      secondary: { type: String, default: '#a855f7' },
      accent: { type: String, default: '#10b981' },
      background: { type: String, default: '#020617' },
      surface: { type: String, default: '#0f172a' },
      text: { type: String, default: '#f8fafc' },
    },
    typography: {
      headingFont: { type: String, default: 'Plus Jakarta Sans' },
      bodyFont: { type: String, default: 'Inter' },
    },
    visualDensity: {
      type: String,
      enum: ['compact', 'comfortable', 'spacious'],
      default: 'comfortable',
    },
    referenceImages: { type: [referenceImageSchema], default: [] },
    observedInsights: { type: [String], default: [] },
  },
  { _id: false }
);

const projectSchema = new Schema<ProjectDocument>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    initialIdea: { type: String, required: true },
    targetPlatform: { type: String, trim: true },
    status: {
      type: String,
      enum: Object.values(ProjectStatus),
      default: ProjectStatus.DRAFT,
    },
    discoveryPhase: {
      type: String,
      enum: Object.values(DiscoveryPhase),
      default: DiscoveryPhase.GOALS,
    },
    conversationSummary: { type: String },
    messageCount: { type: Number, default: 0 },
    designSpec: { type: designSpecSchema, default: () => ({}) },
    version: { type: String, default: 'v0.1' },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id.toString();
        if (ret.ownerId) ret.ownerId = ret.ownerId.toString();
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id.toString();
        if (ret.ownerId) ret.ownerId = ret.ownerId.toString();
        delete ret.__v;
        return ret;
      },
    },
  },
);

export const Project = mongoose.model<ProjectDocument>('Project', projectSchema);
