import { NextResponse } from 'next/server';
import connectToDB from '../../lib/mongodb';
import DocumentModel from '../../lib/documents/schema';

// GET: Fetch documents for a client or consultant
export async function GET(request: Request) {
  try {
    await connectToDB();
    
    const url = new URL(request.url);
    const clientId = url.searchParams.get('clientId');
    const consultantId = url.searchParams.get('consultantId');
    const workspace = url.searchParams.get('workspace');
    const status = url.searchParams.get('status');
    
    const query: any = {};
    
    if (clientId) {
      query.clientId = clientId;
    }
    if (consultantId) {
      query.consultantId = consultantId;
    }
    if (workspace) {
      query.workspace = workspace;
    }
    if (status) {
      query.status = status;
    }
    
    // Build sort query
    let sortQuery: any = { createdAt: -1 };
    const sortBy = url.searchParams.get('sortBy');
    if (sortBy === 'dueDate') {
      sortQuery = { 'metadata.dueDate': 1 };
    } else if (sortBy === 'priority') {
      sortQuery = { 'metadata.priority': -1, createdAt: -1 };
    } else if (sortBy === 'name') {
      sortQuery = { name: 1 };
    }
    
    // Support limit parameter for performance
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    
    let queryBuilder = DocumentModel.find(query).sort(sortQuery);
    if (limit && limit > 0) {
      queryBuilder = queryBuilder.limit(limit);
    }
    
    const documents = await queryBuilder.lean();
    
    return NextResponse.json(documents.map(doc => ({
      id: doc._id.toString(),
      ...doc,
      _id: doc._id.toString(),
    })));
  } catch (error: any) {
    console.error('Failed to fetch documents:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

// POST: Create a new document (after file upload)
export async function POST(request: Request) {
  try {
    await connectToDB();
    const body = await request.json();
    
    const document = await DocumentModel.create(body);
    
    return NextResponse.json({
      id: document._id.toString(),
      ...document.toObject(),
    }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create document:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create document' },
      { status: 500 }
    );
  }
}

