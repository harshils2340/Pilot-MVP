import mongoose, { Schema, Document } from "mongoose";

export interface IClient extends Document {
  businessName: string;
  jurisdiction: string;
  activePermits?: number;
  status?: string;
  lastActivity?: Date | string;
  completionRate?: number;
}

const ClientSchema: Schema<IClient> = new Schema({
  businessName: { type: String, required: true },
  jurisdiction: { type: String, required: true },
  activePermits: { type: Number, default: 0 },
  status: { type: String, default: "new" },
  lastActivity: { type: Date, default: new Date() },
  completionRate: { type: Number, default: 0 },
});

export default mongoose.models.Client || mongoose.model<IClient>("Client", ClientSchema);
