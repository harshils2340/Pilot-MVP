import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '../../../lib/mongodb';
import DocumentModel from '../../../lib/documents/schema';

interface RouteParams {
  params: Promise<{ documentId: string }>;
}

// GET: Fetch a single document by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectToDB();
    const { documentId } = await params;
    
    const document = await DocumentModel.findById(documentId).lean();
    
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      id: document._id.toString(),
      ...document,
      _id: document._id.toString(),
    });
  } catch (error: any) {
    console.error('Failed to fetch document:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch document' },
      { status: 500 }
    );
  }
}

// PUT: Update a document
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await connectToDB();
    const { documentId } = await params;
    const body = await request.json();
    
    const document = await DocumentModel.findByIdAndUpdate(
      documentId,
      { $set: body },
      { new: true, runValidators: true }
    );
    
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      id: document._id.toString(),
      ...document.toObject(),
    });
  } catch (error: any) {
    console.error('Failed to update document:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update document' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a document
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await connectToDB();
    const { documentId } = await params;
    
    const document = await DocumentModel.findByIdAndDelete(documentId);
    
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
    
    console.log(`🗑️ Document deleted: ${document.name}`);
    
    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error: any) {
    console.error('Failed to delete document:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete document' },
      { status: 500 }
    );
  }
}

