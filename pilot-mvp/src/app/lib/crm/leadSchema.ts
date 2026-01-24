import mongoose, { Schema, Document } from 'mongoose';

export interface ILead extends Document {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  stageId?: string;
  stageName?: string;
  probability?: number;
  expectedRevenue?: number;
  expectedClosingDate?: Date;
  activities?: Array<{
    type: string;
    summary: string;
    scheduledDate: Date;
    status: string;
  }>;
  emailCount: number;
  lastEmailDate?: Date;
  emails?: Array<{ emailId: string; subject: string; receivedAt: Date; direction: string }>;
  tags?: string[];
  notes?: string;
  permitRelated?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    company: { type: String },
    source: { type: String, default: 'manual' },
    status: { type: String, enum: ['new', 'contacted', 'qualified', 'converted', 'lost'], default: 'new' },
    stageId: { type: String },
    stageName: { type: String },
    probability: { type: Number, min: 0, max: 100, default: 0 },
    expectedRevenue: { type: Number },
    expectedClosingDate: { type: Date },
    activities: [{ type: Schema.Types.Mixed }],
    emailCount: { type: Number, default: 0 },
    lastEmailDate: { type: Date },
    emails: [{ type: Schema.Types.Mixed }],
    tags: [{ type: String }],
    notes: { type: String },
    permitRelated: { type: Boolean, default: true },
  },
  { timestamps: true }
);

LeadSchema.index({ email: 1 });
LeadSchema.index({ status: 1 });
LeadSchema.index({ createdAt: -1 });

export const Lead = mongoose.models?.Lead ?? mongoose.model<ILead>('Lead', LeadSchema);
