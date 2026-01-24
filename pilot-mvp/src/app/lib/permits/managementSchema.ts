import mongoose, { Schema, Document } from 'mongoose';

export interface IPermitManagement extends Document {
  clientId?: string; // Link to client
  permitId?: string; // Link to master permit collection
  name: string;
  authority: string;
  municipality?: string;
  complexity: 'low' | 'medium' | 'high';
  estimatedTime?: string;
  description?: string;
  category?: string;
  status: 'not-started' | 'in-progress' | 'submitted' | 'action-required' | 'approved';
  order?: number;
  blockedBy?: string;
  blocks?: string[];
  lastActivity?: string;
  lastActivityDate?: Date;
  requirements?: string[];
  fees?: string;
  purpose?: string;
  howToApply?: string;
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
    officeHours?: string;
  };
  additionalNotes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const PermitManagementSchema: Schema<IPermitManagement> = new Schema(
  {
    clientId: { type: String, index: true },
    permitId: { type: String, index: true },
    name: { type: String, required: true },
    authority: { type: String, required: true },
    municipality: { type: String },
    complexity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    estimatedTime: { type: String },
    description: { type: String },
    category: { type: String },
    status: {
      type: String,
      enum: ['not-started', 'in-progress', 'submitted', 'action-required', 'approved'],
      default: 'not-started',
    },
    order: { type: Number, default: 0 },
    blockedBy: { type: String },
    blocks: [{ type: String }],
    lastActivity: { type: String },
    lastActivityDate: { type: Date },
    requirements: [{ type: String }],
    fees: { type: String },
    purpose: { type: String },
    howToApply: { type: String },
    contactInfo: {
      phone: { type: String },
      email: { type: String },
      website: { type: String },
      address: { type: String },
      officeHours: { type: String },
    },
    additionalNotes: { type: String },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
PermitManagementSchema.index({ clientId: 1, status: 1 });
PermitManagementSchema.index({ status: 1, order: 1 });

const PermitManagement = mongoose.models.PermitManagement || mongoose.model<IPermitManagement>('PermitManagement', PermitManagementSchema);

export { PermitManagement };
export default PermitManagement;
