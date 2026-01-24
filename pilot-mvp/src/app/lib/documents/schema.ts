import mongoose, { Schema, Document } from 'mongoose';

export interface IDocument extends Document {
  name: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  clientId: string;
  consultantId?: string;
  workspace: string; // e.g., 'permits', 'contracts', 'bills'
  tags: string[];
  status: 'draft' | 'shared' | 'signed' | 'archived' | 'expired' | 'pending-review';
  // Versioning
  version: number;
  versions: Array<{
    version: number;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    uploadedBy: {
      userId: string;
      userName: string;
      userEmail: string;
    };
    uploadedAt: Date;
    changeNotes?: string;
  }>;
  currentVersion: number;
  // Permissions
  permissions: {
    owner: string; // userId
    viewers: string[]; // userIds
    editors: string[]; // userIds
    public: boolean; // Public to all consultants in organization
  };
  sharedWith: Array<{
    email: string;
    userId?: string;
    role: 'viewer' | 'editor' | 'signer' | 'admin';
    expiresAt?: Date;
    grantedBy: string; // userId
    grantedAt: Date;
  }>;
  // Request tracking
  requestedBy?: {
    consultantId: string;
    consultantName: string;
    requestMessage?: string;
    requestedAt: Date;
    requestId?: string; // Link to document request
  };
  uploadedBy: {
    userId: string;
    userName: string;
    userEmail: string;
    isClient: boolean;
  };
  // Enhanced metadata
  metadata: {
    permitId?: string;
    permitName?: string;
    description?: string;
    dueDate?: Date;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    category?: string; // e.g., 'license', 'certificate', 'application', 'response'
    relatedDocuments?: string[]; // Document IDs
    relatedPermits?: string[]; // Permit IDs
    relatedClients?: string[]; // Client IDs (for multi-client documents)
    source?: 'client' | 'consultant' | 'government' | 'third-party';
    receivedVia?: 'email' | 'upload' | 'scan' | 'api' | 'request';
    emailThreadId?: string; // Link to email if received via email
    originalSender?: string; // Email address
  };
  // Signatures
  signatures?: Array<{
    signerEmail: string;
    signerName: string;
    signedAt: Date;
    signatureData?: string; // Base64 signature image
    version: number; // Which version was signed
  }>;
  // Workflow
  workflow: {
    stage: 'draft' | 'review' | 'approval' | 'signed' | 'submitted' | 'archived';
    assignedTo?: string; // userId
    reviewedBy?: Array<{
      userId: string;
      userName: string;
      reviewedAt: Date;
      status: 'approved' | 'rejected' | 'needs-revision';
      comments?: string;
    }>;
    submittedTo?: string; // Authority/agency name
    submittedAt?: Date;
    submissionReference?: string; // Reference number from authority
  };
  // Notifications
  notifications: Array<{
    type: 'due-date' | 'review-request' | 'signature-request' | 'expiration' | 'new-version';
    sentTo: string[]; // userIds or emails
    sentAt: Date;
    message?: string;
  }>;
  // Organization
  folder?: string; // Virtual folder path
  parentDocumentId?: string; // For document hierarchies
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt?: Date;
  accessedBy?: Array<{
    userId: string;
    accessedAt: Date;
  }>;
}

const DocumentSchema: Schema<IDocument> = new Schema(
  {
    name: { type: String, required: true, index: true },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    clientId: { type: String, required: true, index: true },
    consultantId: { type: String, index: true },
    workspace: { type: String, default: 'general', index: true },
    tags: [{ type: String, index: true }],
    status: {
      type: String,
      enum: ['draft', 'shared', 'signed', 'archived', 'expired', 'pending-review'],
      default: 'draft',
      index: true,
    },
    // Versioning
    version: { type: Number, default: 1 },
    versions: [
      {
        version: Number,
        fileName: String,
        fileUrl: String,
        fileSize: Number,
        uploadedBy: {
          userId: String,
          userName: String,
          userEmail: String,
        },
        uploadedAt: Date,
        changeNotes: String,
      },
    ],
    currentVersion: { type: Number, default: 1 },
    // Permissions
    permissions: {
      owner: { type: String, required: true },
      viewers: [String],
      editors: [String],
      public: { type: Boolean, default: false },
    },
    sharedWith: [
      {
        email: String,
        userId: String,
        role: { type: String, enum: ['viewer', 'editor', 'signer', 'admin'] },
        expiresAt: Date,
        grantedBy: String,
        grantedAt: Date,
      },
    ],
    requestedBy: {
      consultantId: String,
      consultantName: String,
      requestMessage: String,
      requestedAt: Date,
      requestId: String,
    },
    uploadedBy: {
      userId: String,
      userName: String,
      userEmail: String,
      isClient: Boolean,
    },
    metadata: {
      permitId: { type: String, index: true },
      permitName: String,
      description: String,
      dueDate: { type: Date, index: true },
      priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], index: true },
      category: String,
      relatedDocuments: [String],
      relatedPermits: [String],
      relatedClients: [String],
      source: { type: String, enum: ['client', 'consultant', 'government', 'third-party'] },
      receivedVia: { type: String, enum: ['email', 'upload', 'scan', 'api', 'request'] },
      emailThreadId: String,
      originalSender: String,
    },
    signatures: [
      {
        signerEmail: String,
        signerName: String,
        signedAt: Date,
        signatureData: String,
        version: Number,
      },
    ],
    // Workflow
    workflow: {
      stage: {
        type: String,
        enum: ['draft', 'review', 'approval', 'signed', 'submitted', 'archived'],
        default: 'draft',
      },
      assignedTo: String,
      reviewedBy: [
        {
          userId: String,
          userName: String,
          reviewedAt: Date,
          status: { type: String, enum: ['approved', 'rejected', 'needs-revision'] },
          comments: String,
        },
      ],
      submittedTo: String,
      submittedAt: Date,
      submissionReference: String,
    },
    // Notifications
    notifications: [
      {
        type: { type: String, enum: ['due-date', 'review-request', 'signature-request', 'expiration', 'new-version'] },
        sentTo: [String],
        sentAt: Date,
        message: String,
      },
    ],
    // Organization
    folder: { type: String, index: true },
    parentDocumentId: { type: String, index: true },
    lastAccessedAt: Date,
    accessedBy: [
      {
        userId: String,
        accessedAt: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for better search performance
DocumentSchema.index({ clientId: 1, workspace: 1, status: 1 });
DocumentSchema.index({ consultantId: 1, 'metadata.dueDate': 1 });
DocumentSchema.index({ tags: 1, workspace: 1 });
DocumentSchema.index({ 'metadata.priority': 1, 'workflow.stage': 1 });

export default mongoose.models.Document || mongoose.model<IDocument>('Document', DocumentSchema);
