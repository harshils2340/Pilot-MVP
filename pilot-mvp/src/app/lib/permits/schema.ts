import mongoose, { Document, Schema, Model } from "mongoose";

// TypeScript interface for a Permit
export interface IPermit extends Document {
  name: string;
  level: "municipal" | "provincial" | "federal";
  authority: string;
  jurisdiction: {
    country: string;
    province: string;
    city?: string; // optional
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
  // Extended metadata from BizPaL
  contactInfo?: {
    municipality?: string;
    department?: string;
    email?: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      province?: string;
      postalCode?: string;
      fullAddress?: string;
    };
  };
  lastVerified?: string;
  moreInfoUrl?: string;
}

// Mongoose schema
const PermitSchema: Schema<IPermit> = new Schema(
  {
    name: { type: String, required: true },
    level: { type: String, enum: ["municipal", "provincial", "federal"], required: true },
    authority: { type: String, required: true },
    jurisdiction: {
      country: { type: String, required: true },
      province: { type: String, required: true },
      city: { type: String, required: false }
    },
    businessTypes: { type: [String], required: true },
    activities: { type: [String], required: true },
    conditions: {
      homeBased: { type: Boolean, required: false },
      onlineOnly: { type: Boolean, required: false }
    },
    applyUrl: { type: String, required: true },
    sourceUrl: { type: String, required: true },
    lastUpdated: { type: Date, required: true },
    confidenceHints: {
      required: { type: Boolean, required: false },
      conditional: { type: Boolean, required: false }
    },
    // Extended metadata from BizPaL
    contactInfo: {
      municipality: { type: String, required: false },
      department: { type: String, required: false },
      email: { type: String, required: false },
      phone: { type: String, required: false },
      address: {
        street: { type: String, required: false },
        city: { type: String, required: false },
        province: { type: String, required: false },
        postalCode: { type: String, required: false },
        fullAddress: { type: String, required: false }
      }
    },
    lastVerified: { type: String, required: false },
    moreInfoUrl: { type: String, required: false }
  },
  { timestamps: true }
);

// Export model
export const Permit: Model<IPermit> =
  mongoose.models.Permit || mongoose.model<IPermit>("Permit", PermitSchema);
