import mongoose, { Document, Schema, Model } from "mongoose";

// TypeScript interface for a Permit Email
export interface IPermitEmail extends Document {
  gmailId?: string; // Gmail message ID for deduplication
  permitId?: string; // Reference to permit (optional)
  permitName?: string; // Optional
  clientId?: string;
  clientName?: string;
  subject: string;
  from: {
    email: string;
    name?: string;
  };
  to: {
    email: string;
    name?: string;
  };
  body: string;
  htmlBody?: string;
  attachments?: Array<{
    filename: string;
    contentType: string;
    size: number;
    url?: string;
  }>;
  direction: 'inbound' | 'outbound'; // Email direction
  status: 'unread' | 'read' | 'replied' | 'archived';
  priority: 'high' | 'medium' | 'low';
  receivedAt: Date;
  sentAt?: Date;
  threadId?: string; // For grouping related emails
  inReplyTo?: string; // Reference to parent email
  metadata?: {
    messageId?: string;
    headers?: Record<string, string>;
    labels?: string[];
    snippet?: string;
  };
}

// Mongoose schema
const PermitEmailSchema: Schema<IPermitEmail> = new Schema(
  {
    gmailId: { type: String, required: false, unique: true, sparse: true, index: true },
    permitId: { type: String, required: false, index: true },
    permitName: { type: String, required: false },
    clientId: { type: String, required: false, index: true },
    clientName: { type: String, required: false },
    subject: { type: String, required: true },
    from: {
      email: { type: String, required: true },
      name: { type: String, required: false }
    },
    to: {
      email: { type: String, required: true },
      name: { type: String, required: false }
    },
    body: { type: String, required: true },
    htmlBody: { type: String, required: false },
    attachments: [{
      filename: String,
      contentType: String,
      size: Number,
      url: String
    }],
    direction: { type: String, enum: ['inbound', 'outbound'], required: true, index: true },
    status: { type: String, enum: ['unread', 'read', 'replied', 'archived'], default: 'unread', index: true },
    priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    receivedAt: { type: Date, required: true, default: Date.now, index: true },
    sentAt: { type: Date, required: false },
    threadId: { type: String, required: false, index: true },
    inReplyTo: { type: String, required: false },
    metadata: {
      messageId: String,
      headers: Schema.Types.Mixed,
      labels: [String],
      snippet: String
    }
  },
  { timestamps: true }
);

// Indexes for efficient queries
PermitEmailSchema.index({ permitId: 1, receivedAt: -1 });
PermitEmailSchema.index({ clientId: 1, receivedAt: -1 });
PermitEmailSchema.index({ status: 1, receivedAt: -1 });
PermitEmailSchema.index({ direction: 1, receivedAt: -1 });

// Export model
export const PermitEmail: Model<IPermitEmail> =
  mongoose.models.PermitEmail || mongoose.model<IPermitEmail>("PermitEmail", PermitEmailSchema);
