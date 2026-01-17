import mongoose, { Document, Schema, Model } from "mongoose";

// PermitData interface from the new UI
export interface IPermitManagement extends Document {
  clientId?: string; // Link to client
  permitId?: string; // Link to the master Permit document
  name: string;
  authority: string;
  municipality?: string;
  complexity: 'low' | 'medium' | 'high';
  estimatedTime: string;
  description: string;
  category: string;
  status?: 'not-started' | 'submitted' | 'action-required' | 'approved';
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
}

// Mongoose schema for permit management
const PermitManagementSchema: Schema<IPermitManagement> = new Schema(
  {
    clientId: { type: String, required: false, index: true }, // Index for faster queries
    permitId: { type: String, required: false }, // Link to Permit collection
    name: { type: String, required: true },
    authority: { type: String, required: true },
    municipality: { type: String, required: false },
    complexity: { type: String, enum: ['low', 'medium', 'high'], required: true },
    estimatedTime: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['not-started', 'submitted', 'action-required', 'approved'], 
      default: 'not-started' 
    },
    order: { type: Number, default: 0 },
    blockedBy: { type: String, required: false },
    blocks: { type: [String], default: [] },
    lastActivity: { type: String, required: false },
    lastActivityDate: { type: Date, default: Date.now },
    requirements: { type: [String], required: false },
    fees: { type: String, required: false },
    purpose: { type: String, required: false },
    howToApply: { type: String, required: false },
    contactInfo: {
      phone: { type: String, required: false },
      email: { type: String, required: false },
      website: { type: String, required: false },
      address: { type: String, required: false },
      officeHours: { type: String, required: false },
    },
    additionalNotes: { type: String, required: false },
  },
  { timestamps: true }
);

// Export model
export const PermitManagement: Model<IPermitManagement> =
  mongoose.models.PermitManagement || mongoose.model<IPermitManagement>("PermitManagement", PermitManagementSchema);

