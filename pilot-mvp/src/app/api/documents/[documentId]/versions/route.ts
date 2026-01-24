import { NextRequest, NextResponse } from 'next/server';

// GET: Fetch all versions of a document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;
    return NextResponse.json({ documentId, versions: [] });
  } catch (error: any) {
    console.error('Error fetching document versions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document versions', details: error.message },
      { status: 500 }
    );
  }
}

// POST: Create a new version of a document
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;
    const body = await request.json();
    return NextResponse.json({ message: 'Version created', documentId, version: body });
  } catch (error: any) {
    console.error('Error creating document version:', error);
    return NextResponse.json(
      { error: 'Failed to create document version', details: error.message },
      { status: 500 }
    );
  }
}
