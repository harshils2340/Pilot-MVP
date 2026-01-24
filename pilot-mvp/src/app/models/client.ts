import mongoose, { Schema, Document } from "mongoose";

export interface IClient extends Document {
  businessName: string;
  jurisdiction: string;
  activePermits?: number;
  status?: string;
  lastActivity?: Date | string;
  completionRate?: number;
  // Client contact info for document requests
  contactInfo?: {
    email?: string;
    name?: string;
    phone?: string;
    savedAt?: Date;
  };
  // Consultant who owns this client
  consultantId?: string;
  consultantEmail?: string;
}

const ClientSchema: Schema<IClient> = new Schema({
  businessName: { type: String, required: true },
  jurisdiction: { type: String, required: true },
  activePermits: { type: Number, default: 0 },
  status: { type: String, default: "new" },
  lastActivity: { type: Date, default: new Date() },
  completionRate: { type: Number, default: 0 },
  contactInfo: {
    email: String,
    name: String,
    phone: String,
    savedAt: Date,
  },
  consultantId: String,
  consultantEmail: String,
});

export default mongoose.models.Client || mongoose.model<IClient>("Client", ClientSchema);
