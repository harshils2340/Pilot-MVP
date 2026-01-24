import mongoose, { Schema, Document } from 'mongoose';

// Odoo CRM-inspired Activity types
export type ActivityType = 'email' | 'call' | 'task' | 'meeting';

export interface IActivity {
  type: ActivityType;
  summary: string;
  description?: string;
  scheduledDate: Date;
  completedDate?: Date;
  assignedTo?: string; // User ID
  result?: string; // Outcome/notes from activity
  status: 'planned' | 'done' | 'canceled';
  createdAt: Date;
  updatedAt: Date;
}

// Odoo CRM-inspired Pipeline Stage
export interface IPipelineStage {
  name: string;
  sequence: number; // Order in pipeline
  probability: number; // Conversion probability (0-100)
  isWon?: boolean;
  isLost?: boolean;
}

// Odoo CRM-inspired Opportunity (converted from lead)
export interface IOpportunity {
  leadId: string; // Reference to original lead
  name: string;
  expectedRevenue?: number;
  probability: number; // 0-100
  stageId?: string; // Pipeline stage
  expectedClosingDate?: Date;
  wonDate?: Date;
  lostReason?: string;
  teamId?: string; // Sales team
  userId?: string; // Assigned user
}

export interface ILead extends Document {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source?: string; // e.g., 'gmail', 'website', 'manual'
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  // Odoo CRM: Pipeline stage
  stageId?: string;
  stageName?: string;
  probability?: number; // Conversion probability (0-100)
  // Odoo CRM: Opportunity fields
  expectedRevenue?: number;
  expectedClosingDate?: Date;
  // Odoo CRM: Team assignment
  teamId?: string;
  userId?: string; // Assigned user
  // Odoo CRM: Activities
  activities?: IActivity[];
  nextActivityDate?: Date;
  // Existing fields
  notes?: string;
  emailCount: number;
  lastEmailDate?: Date;
  firstEmailDate?: Date;
  emails: Array<{
    emailId: string;
    subject: string;
    receivedAt: Date;
    direction: 'inbound' | 'outbound';
  }>;
  tags?: string[];
  // Odoo CRM: Conversion tracking
  convertedToOpportunity?: boolean;
  opportunityId?: string;
  convertedDate?: Date;
  /** True when lead was created from permit-related email (keywords, matched permit, or client) */
  permitRelated?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema = new Schema({
  type: { 
    type: String, 
    enum: ['email', 'call', 'task', 'meeting'],
    required: true 
  },
  summary: { type: String, required: true },
  description: { type: String },
  scheduledDate: { type: Date, required: true },
  completedDate: { type: Date },
  assignedTo: { type: String },
  result: { type: String },
  status: { 
    type: String, 
    enum: ['planned', 'done', 'canceled'],
    default: 'planned' 
  },
}, { timestamps: true });

const LeadSchema: Schema<ILead> = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    company: { type: String },
    source: { type: String, default: 'gmail' },
    status: { 
      type: String, 
      enum: ['new', 'contacted', 'qualified', 'converted', 'lost'],
      default: 'new' 
    },
    // Odoo CRM: Pipeline stage
    stageId: { type: String },
    stageName: { type: String },
    probability: { type: Number, min: 0, max: 100, default: 0 },
    // Odoo CRM: Opportunity fields
    expectedRevenue: { type: Number },
    expectedClosingDate: { type: Date },
    // Odoo CRM: Team assignment
    teamId: { type: String },
    userId: { type: String },
    // Odoo CRM: Activities
    activities: [ActivitySchema],
    nextActivityDate: { type: Date },
    // Existing fields
    notes: { type: String },
    emailCount: { type: Number, default: 0 },
    lastEmailDate: { type: Date },
    firstEmailDate: { type: Date },
    emails: [{
      emailId: { type: String, required: true },
      subject: { type: String, required: true },
      receivedAt: { type: Date, required: true },
      direction: { type: String, enum: ['inbound', 'outbound'], required: true },
    }],
    tags: [{ type: String }],
    // Odoo CRM: Conversion tracking
    convertedToOpportunity: { type: Boolean, default: false },
    opportunityId: { type: String },
    convertedDate: { type: Date },
    permitRelated: { type: Boolean },
  },
  {
    timestamps: true,
  }
);

// Index for faster email lookups
LeadSchema.index({ email: 1 });
LeadSchema.index({ status: 1 });
LeadSchema.index({ createdAt: -1 });

export const Lead = mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);
