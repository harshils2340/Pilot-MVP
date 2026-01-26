import mongoose, { Schema, Document } from 'mongoose';

export interface IDocumentRequest extends Document {
  clientId: string;
  clientName?: string;
  permitId?: string;
  permitName?: string;
  title: string;
  description?: string;
  status: 'pending' | 'fulfilled' | 'expired';
  consultantId?: string;
  consultantName?: string;
  requestedAt: Date;
  expiresAt?: Date;
  fulfilledAt?: Date;
  fulfilledByDocumentId?: string;
}

const DocumentRequestSchema = new Schema<IDocumentRequest>(
  {
    clientId: { type: String, required: true, index: true },
    clientName: { type: String },
    permitId: { type: String, index: true },
    permitName: { type: String },
    title: { type: String, required: true },
    description: { type: String },
    status: {
      type: String,
      enum: ['pending', 'fulfilled', 'expired'],
      default: 'pending',
      index: true,
    },
    consultantId: { type: String, index: true },
    consultantName: { type: String },
    requestedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    fulfilledAt: { type: Date },
    fulfilledByDocumentId: { type: String },
  },
  { timestamps: true }
);

DocumentRequestSchema.index({ clientId: 1, status: 1 });
DocumentRequestSchema.index({ requestedAt: -1 });

export const DocumentRequest =
  mongoose.models?.DocumentRequest ??
  mongoose.model<IDocumentRequest>('DocumentRequest', DocumentRequestSchema);
