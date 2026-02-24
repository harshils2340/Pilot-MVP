import mongoose, { Schema, Document } from "mongoose";

export type PermitConfidence = "required" | "conditional" | "informational";

export interface IDiscoveredPermit extends Document {
  clientId: string;
  name: string;
  level: string;
  authority: string;
  applyUrl: string;
  sourceUrl: string;
  lastUpdated: Date;
  reasons: string[];
  confidence: PermitConfidence;
  createdAt?: Date;
  updatedAt?: Date;
}

const DiscoveredPermitSchema: Schema<IDiscoveredPermit> = new Schema(
  {
    clientId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    level: { type: String, required: true, trim: true, default: "municipal" },
    authority: { type: String, required: true, trim: true },
    applyUrl: { type: String, required: true, trim: true },
    sourceUrl: { type: String, required: true, trim: true },
    lastUpdated: { type: Date, required: true, default: Date.now },
    reasons: [{ type: String }],
    confidence: {
      type: String,
      enum: ["required", "conditional", "informational"],
      default: "conditional"
    }
  },
  {
    timestamps: true,
    collection: "discoveredPermits"
  }
);

DiscoveredPermitSchema.index({ clientId: 1, lastUpdated: -1 });
DiscoveredPermitSchema.index({ clientId: 1, name: 1 });

const DiscoveredPermit =
  mongoose.models.DiscoveredPermit ||
  mongoose.model<IDiscoveredPermit>("DiscoveredPermit", DiscoveredPermitSchema);

export { DiscoveredPermit };
export default DiscoveredPermit;
