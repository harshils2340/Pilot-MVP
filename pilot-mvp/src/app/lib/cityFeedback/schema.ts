import mongoose, { Document, Schema, Model } from "mongoose";

// TypeScript interface for City Feedback
export interface ICityFeedback extends Document {
  clientId: string; // Reference to client (required)
  permitId?: string; // Reference to permit (optional)
  emailId?: string; // Reference to the email that created this feedback (optional)
  type: 'revision_required' | 'comment' | 'question' | 'client_message';
  author: string; // Name of the person who sent the email/feedback
  department?: string; // Department or organization
  subject: string; // Email subject or feedback subject
  comment: string; // Email body or feedback message
  attachments?: Array<{
    name: string;
    size: string;
    type: string;
  }>;
  status: 'not_started' | 'in_progress' | 'addressed';
  requiredDocuments?: string[]; // List of required documents mentioned
  uploadedDocuments?: Array<{
    name: string;
    size: string;
    uploadedBy: string;
    uploadedAt: string;
  }>;
  consultantResponse?: string; // Response from consultant
  date: Date; // Date when feedback was received
  time: string; // Time when feedback was received (formatted)
}

// Mongoose schema
const CityFeedbackSchema: Schema<ICityFeedback> = new Schema(
  {
    clientId: { type: String, required: true, index: true },
    permitId: { type: String, required: false, index: true },
    emailId: { type: String, required: false, index: true },
    type: { 
      type: String, 
      enum: ['revision_required', 'comment', 'question', 'client_message'], 
      required: true,
      default: 'client_message'
    },
    author: { type: String, required: true },
    department: { type: String, required: false },
    subject: { type: String, required: true },
    comment: { type: String, required: true },
    attachments: [{
      name: String,
      size: String,
      type: String
    }],
    status: { 
      type: String, 
      enum: ['not_started', 'in_progress', 'addressed'], 
      default: 'not_started',
      index: true
    },
    requiredDocuments: [String],
    uploadedDocuments: [{
      name: String,
      size: String,
      uploadedBy: String,
      uploadedAt: String
    }],
    consultantResponse: { type: String, required: false },
    date: { type: Date, required: true, default: Date.now, index: true },
    time: { type: String, required: false }
  },
  { timestamps: true }
);

// Indexes for efficient queries
CityFeedbackSchema.index({ clientId: 1, date: -1 });
CityFeedbackSchema.index({ permitId: 1, date: -1 });
CityFeedbackSchema.index({ status: 1, date: -1 });
CityFeedbackSchema.index({ clientId: 1, permitId: 1, date: -1 });

// Export model
export const CityFeedback: Model<ICityFeedback> =
  mongoose.models.CityFeedback || mongoose.model<ICityFeedback>("CityFeedback", CityFeedbackSchema);
