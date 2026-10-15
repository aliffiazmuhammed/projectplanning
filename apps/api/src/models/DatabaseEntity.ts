import mongoose, { Schema, type Document, type Types } from 'mongoose';
import type { IEntityField, IEntityRelationship, IEntityIndex } from '@project-planner/types';

export interface DatabaseEntityDocument extends Document {
  projectId: Types.ObjectId;
  name: string;
  tableNameOrCollection: string;
  description: string;
  fields: IEntityField[];
  relationships: IEntityRelationship[];
  indexes: IEntityIndex[];
  ownershipNotes?: string;
  seedRequirements?: string;
  createdAt: Date;
  updatedAt: Date;
}

const entityFieldSchema = new Schema<IEntityField>(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    required: { type: Boolean, default: true },
    unique: { type: Boolean, default: false },
    defaultValue: { type: String },
    description: { type: String },
  },
  { _id: false },
);

const entityRelationshipSchema = new Schema<IEntityRelationship>(
  {
    relatedEntity: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['ONE_TO_ONE', 'ONE_TO_MANY', 'MANY_TO_MANY'],
      required: true,
    },
    foreignKey: { type: String, trim: true },
    description: { type: String },
  },
  { _id: false },
);

const entityIndexSchema = new Schema<IEntityIndex>(
  {
    fields: { type: [String], required: true },
    unique: { type: Boolean, default: false },
    name: { type: String },
  },
  { _id: false },
);

const databaseEntitySchema = new Schema<DatabaseEntityDocument>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    tableNameOrCollection: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    fields: {
      type: [entityFieldSchema],
      default: [],
    },
    relationships: {
      type: [entityRelationshipSchema],
      default: [],
    },
    indexes: {
      type: [entityIndexSchema],
      default: [],
    },
    ownershipNotes: {
      type: String,
    },
    seedRequirements: {
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

databaseEntitySchema.index({ projectId: 1, name: 1 }, { unique: true });

export const DatabaseEntity = mongoose.model<DatabaseEntityDocument>(
  'DatabaseEntity',
  databaseEntitySchema,
);
