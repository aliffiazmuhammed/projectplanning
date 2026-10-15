import mongoose, { Schema, type Document, type Types } from 'mongoose';
import { DiscoveryPhase } from '@project-planner/types';
import type { MessageRole } from '@project-planner/types';

export interface MessageDocument extends Document {
  projectId: Types.ObjectId;
  role: MessageRole;
  content: string;
  phase: DiscoveryPhase;
  createdAt: Date;
}

const messageSchema = new Schema<MessageDocument>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    phase: {
      type: String,
      enum: Object.values(DiscoveryPhase),
      default: DiscoveryPhase.GOALS,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
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

export const Message = mongoose.model<MessageDocument>('Message', messageSchema);
