import mongoose, { Document, Schema, Model } from "mongoose";

// PermitData interface from the new UI
export interface IPermitManagement extends Document {
  name: string;
  authority: string;
  complexity: 'low' | 'medium' | 'high';
  estimatedTime: string;
  description: string;
  category: string;
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
    name: { type: String, required: true },
    authority: { type: String, required: true },
    complexity: { type: String, enum: ['low', 'medium', 'high'], required: true },
    estimatedTime: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
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

