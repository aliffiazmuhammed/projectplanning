import mongoose, { Schema, type Document, type Types } from 'mongoose';
import type { HttpMethod, IApiParameter, IApiResponseContract } from '@project-planner/types';

export interface ApiEndpointDocument extends Document {
  projectId: Types.ObjectId;
  method: HttpMethod;
  route: string;
  summary: string;
  description?: string;
  authentication: 'NONE' | 'JWT' | 'SESSION' | 'API_KEY';
  requiredRoles: string[];
  parameters: IApiParameter[];
  requestBodySchema?: string;
  responses: IApiResponseContract[];
  rateLimit?: string;
  dependencies: string[];
  createdAt: Date;
  updatedAt: Date;
}

const apiParameterSchema = new Schema<IApiParameter>(
  {
    name: { type: String, required: true, trim: true },
    in: {
      type: String,
      enum: ['path', 'query', 'header', 'body'],
      required: true,
    },
    required: { type: Boolean, default: true },
    type: { type: String, default: 'string' },
    description: { type: String },
  },
  { _id: false },
);

const apiResponseContractSchema = new Schema<IApiResponseContract>(
  {
    statusCode: { type: Number, required: true },
    description: { type: String, required: true },
    schemaOrExample: { type: String },
  },
  { _id: false },
);

const apiEndpointSchema = new Schema<ApiEndpointDocument>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
      required: true,
    },
    route: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    authentication: {
      type: String,
      enum: ['NONE', 'JWT', 'SESSION', 'API_KEY'],
      default: 'JWT',
    },
    requiredRoles: {
      type: [String],
      default: [],
    },
    parameters: {
      type: [apiParameterSchema],
      default: [],
    },
    requestBodySchema: {
      type: String,
    },
    responses: {
      type: [apiResponseContractSchema],
      default: [],
    },
    rateLimit: {
      type: String,
    },
    dependencies: {
      type: [String],
      default: [],
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

apiEndpointSchema.index({ projectId: 1, method: 1, route: 1 }, { unique: true });

export const ApiEndpoint = mongoose.model<ApiEndpointDocument>('ApiEndpoint', apiEndpointSchema);
