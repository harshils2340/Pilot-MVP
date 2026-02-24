import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '../../../lib/mongodb';
import DocumentModel from '../../../lib/documents/schema';
import { DocumentRequest } from '../../../lib/documents/requestSchema';

export async function POST(request: NextRequest) {
  try {
    await connectToDB();
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const clientId = formData.get('clientId') as string;
    const permitId = formData.get('permitId') as string | null;
    const permitName = formData.get('permitName') as string | null;
    const consultantId = formData.get('consultantId') as string | null;
    const folder = formData.get('folder') as string || 'General';
    const workspace = formData.get('workspace') as string || folder.split('/')[0]?.toLowerCase() || 'general';
    
    let uploadedBy: any;
    try {
      uploadedBy = JSON.parse(formData.get('uploadedBy') as string || '{}');
    } catch {
      uploadedBy = {
        userId: clientId,
        userName: 'User',
        userEmail: '',
        isClient: true,
      };
    }
    
    let metadata: any = {};
    try {
      const metadataStr = formData.get('metadata') as string;
      if (metadataStr) {
        metadata = JSON.parse(metadataStr);
      }
    } catch {
      metadata = {};
    }
    
    // Get requestId from metadata if provided
    const requestId = metadata.requestId;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }
    
    // Read file as base64 for storage in MongoDB (works on serverless)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64Data}`;
    
    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}-${sanitizedFileName}`;
    
    // Get file extension for type
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'file';
    
    // If requestId is provided, fetch request details to link document
    let requestDetails: any = null;
    if (requestId) {
      try {
        requestDetails = await DocumentRequest.findById(requestId).lean();
      } catch (err) {
        console.warn('Could not fetch request details:', err);
      }
    }
    
    // Create document record with enhanced schema
    const document = await DocumentModel.create({
      name: file.name,
      fileName: fileName,
      fileUrl: dataUrl, // Store as data URL for serverless compatibility
      fileType: fileExtension,
      fileSize: file.size,
      clientId,
      consultantId: consultantId || (requestDetails?.consultantId),
      workspace,
      folder: folder,
      uploadedBy: {
        userId: uploadedBy.userId || clientId,
        userName: uploadedBy.userName || 'User',
        userEmail: uploadedBy.userEmail || '',
        isClient: uploadedBy.isClient ?? true,
      },
      metadata: {
        ...metadata,
        permitId: permitId || metadata.permitId,
        permitName: permitName || metadata.permitName,
        source: metadata.source || (uploadedBy.isClient ? 'client' : 'consultant'),
        receivedVia: metadata.receivedVia || (requestId ? 'request' : 'upload'),
        requestId: requestId || undefined,
      },
      requestedBy: requestDetails ? {
        consultantId: requestDetails.consultantId,
        consultantName: requestDetails.consultantName,
        requestMessage: requestDetails.description,
        requestedAt: requestDetails.requestedAt,
        requestId: requestId,
      } : undefined,
      status: 'draft',
      tags: metadata.tags || [],
      sharedWith: [],
      version: 1,
      currentVersion: 1,
      versions: [{
        version: 1,
        fileName: fileName,
        fileUrl: dataUrl,
        fileSize: file.size,
        uploadedBy: {
          userId: uploadedBy.userId || clientId,
          userName: uploadedBy.userName || 'User',
          userEmail: uploadedBy.userEmail || '',
        },
        uploadedAt: new Date(),
        changeNotes: 'Initial upload',
      }],
      permissions: {
        owner: uploadedBy.userId || clientId,
        viewers: [],
        editors: [],
        public: false,
      },
      workflow: {
        stage: 'draft',
      },
      notifications: [],
    });
    
    console.log(`✅ Document uploaded: ${file.name} for client ${clientId}`);
    
    return NextResponse.json({
      id: document._id.toString(),
      _id: document._id.toString(),
      name: document.name,
      fileName: document.fileName,
      fileUrl: document.fileUrl,
      fileType: document.fileType,
      fileSize: document.fileSize,
      clientId: document.clientId,
      workspace: document.workspace,
      folder: document.folder,
      tags: document.tags,
      status: document.status,
      uploadedBy: document.uploadedBy,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to upload document:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload document' },
      { status: 500 }
    );
  }
}
