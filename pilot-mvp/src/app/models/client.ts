import mongoose, { Schema, Document } from "mongoose";

export interface IClient extends Document {
  businessName: string;
  jurisdiction: string;
  activePermits?: number;
  status?: string;
  lastActivity?: Date | string;
  completionRate?: number;
  // Client contact info for document requests and form filling
  contactInfo?: {
    email?: string;
    name?: string;
    phone?: string;
    savedAt?: Date;
  };
  // Address information for form filling
  address?: {
    streetNumber?: string;
    streetName?: string;
    suite?: string;
    unit?: string;
    city?: string;
    province?: string;
    state?: string;
    postalCode?: string;
    zipCode?: string;
    fullAddress?: string;
  };
  // Owner/representative information for form filling
  ownerInfo?: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    position?: string;
    email?: string;
    phone?: string;
  };
  // Business details for form filling
  businessType?: string;
  businessLicenceNumber?: string;
  licenceExpiry?: string;
  licenseExpiry?: string;
  operatingName?: string;
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
  address: {
    streetNumber: String,
    streetName: String,
    suite: String,
    unit: String,
    city: String,
    province: String,
    state: String,
    postalCode: String,
    zipCode: String,
    fullAddress: String,
  },
  ownerInfo: {
    firstName: String,
    lastName: String,
    fullName: String,
    position: String,
    email: String,
    phone: String,
  },
  businessType: String,
  businessLicenceNumber: String,
  licenceExpiry: String,
  licenseExpiry: String,
  operatingName: String,
  consultantId: String,
  consultantEmail: String,
});

export default mongoose.models.Client || mongoose.model<IClient>("Client", ClientSchema);
