import { NextRequest, NextResponse } from 'next/server';

// GET: Fetch all document requests
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({ requests: [] });
  } catch (error: any) {
    console.error('Error fetching document requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document requests', details: error.message },
      { status: 500 }
    );
  }
}

// POST: Create a new document request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({ message: 'Document request created', request: body });
  } catch (error: any) {
    console.error('Error creating document request:', error);
    return NextResponse.json(
      { error: 'Failed to create document request', details: error.message },
      { status: 500 }
    );
  }
}
