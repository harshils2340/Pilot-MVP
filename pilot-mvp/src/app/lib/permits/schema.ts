import mongoose, { Document, Schema } from "mongoose";

// TypeScript interface for a Permit
export interface IPermit extends Document {
  name: string;
  level: "municipal" | "provincial" | "federal";
  authority: string;
  jurisdiction: {
    country: string;
    province: string;
    city: string;
  };
  businessTypes: string[];
  activities: string[];
  conditions?: {
    homeBased?: boolean;
    onlineOnly?: boolean;
  };
  applyUrl: string;
  sourceUrl: string;
  lastUpdated: Date;
  confidenceHints?: {
    required?: boolean;
    conditional?: boolean;
  };
}

const PermitSchema: Schema<IPermit> = new Schema({
  name: { type: String, required: true },
  level: { type: String, enum: ["municipal", "provincial", "federal"], required: true },
  authority: { type: String, required: true },
  jurisdiction: {
    country: { type: String, required: true },
    province: { type: String, required: true },
    city: { type: String }
  },
  businessTypes: { type: [String], required: true },
  activities: { type: [String], required: true },
  conditions: {
    homeBased: Boolean,
    onlineOnly: Boolean
  },
  applyUrl: { type: String, required: true },
  sourceUrl: { type: String, required: true },
  lastUpdated: { type: Date, required: true },
  confidenceHints: {
    required: Boolean,
    conditional: Boolean
  }
});

export const Permit = mongoose.models.Permit || mongoose.model<IPermit>("Permit", PermitSchema);
