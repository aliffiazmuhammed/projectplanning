import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface ScreenSpecDocument extends Document {
  projectId: Types.ObjectId;
  name: string;
  route: string;
  purpose: string;
  targetRoles: string[];
  layout: string;
  components: string[];
  responsiveBehavior?: {
    desktop?: string;
    tablet?: string;
    mobile?: string;
  };
  states?: {
    loading?: string;
    empty?: string;
    error?: string;
    success?: string;
  };
  apiDependencies: string[];
  authRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const screenSpecSchema = new Schema<ScreenSpecDocument>(
  {
    projectId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Project', 
      required: true, 
      index: true 
    },
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },
    route: { 
      type: String, 
      required: true, 
      trim: true 
    },
    purpose: { 
      type: String, 
      required: true, 
      trim: true 
    },
    targetRoles: { 
      type: [String], 
      default: [] 
    },
    layout: { 
      type: String, 
      required: true, 
      trim: true 
    },
    components: { 
      type: [String], 
      default: [] 
    },
    responsiveBehavior: {
      desktop: { type: String },
      tablet: { type: String },
      mobile: { type: String },
    },
    states: {
      loading: { type: String },
      empty: { type: String },
      error: { type: String },
      success: { type: String },
    },
    apiDependencies: { 
      type: [String], 
      default: [] 
    },
    authRequired: { 
      type: Boolean, 
      default: true 
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

screenSpecSchema.index({ projectId: 1, route: 1 });

export const ScreenSpec = mongoose.model<ScreenSpecDocument>(
  'ScreenSpec', 
  screenSpecSchema
);
