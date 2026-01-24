import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import connectToDB from '../../../lib/mongodb';
import DocumentModel from '../../../lib/documents/schema';

export async function POST(request: NextRequest) {
  try {
    await connectToDB();
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const clientId = formData.get('clientId') as string;
    const consultantId = formData.get('consultantId') as string | null;
    const workspace = formData.get('workspace') as string || 'general';
    const uploadedBy = JSON.parse(formData.get('uploadedBy') as string);
    const metadata = formData.get('metadata') ? JSON.parse(formData.get('metadata') as string) : {};
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'documents');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}-${sanitizedFileName}`;
    const filePath = join(uploadsDir, fileName);
    
    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);
    
    // Parse metadata if provided
    const parsedMetadata = typeof metadata === 'string' ? JSON.parse(metadata) : (metadata || {});
    
    // Create document record with enhanced schema
    const document = await DocumentModel.create({
      name: file.name,
      fileName: fileName,
      fileUrl: `/uploads/documents/${fileName}`,
      fileType: file.type,
      fileSize: file.size,
      clientId,
      consultantId: consultantId || undefined,
      workspace,
      uploadedBy,
      metadata: {
        ...parsedMetadata,
        source: parsedMetadata.source || (uploadedBy.isClient ? 'client' : 'consultant'),
        receivedVia: parsedMetadata.receivedVia || 'upload',
      },
      status: 'draft',
      tags: parsedMetadata.tags || [],
      sharedWith: [],
      version: 1,
      currentVersion: 1,
      versions: [{
        version: 1,
        fileName: fileName,
        fileUrl: `/uploads/documents/${fileName}`,
        fileSize: file.size,
        uploadedBy: {
          userId: uploadedBy.userId,
          userName: uploadedBy.userName,
          userEmail: uploadedBy.userEmail,
        },
        uploadedAt: new Date(),
        changeNotes: 'Initial upload',
      }],
      permissions: {
        owner: uploadedBy.userId,
        viewers: [],
        editors: [],
        public: false,
      },
      workflow: {
        stage: 'draft',
      },
      notifications: [],
    });
    
    return NextResponse.json({
      id: document._id.toString(),
      ...document.toObject(),
    }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to upload document:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload document' },
      { status: 500 }
    );
  }
}
