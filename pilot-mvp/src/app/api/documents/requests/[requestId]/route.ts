import { NextRequest, NextResponse } from 'next/server';

// GET: Fetch a specific document request by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;
    return NextResponse.json({ request: { id: requestId } });
  } catch (error: any) {
    console.error('Error fetching document request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document request', details: error.message },
      { status: 500 }
    );
  }
}

// PUT: Update a specific document request
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;
    const body = await request.json();
    return NextResponse.json({ message: 'Request updated', request: { id: requestId, ...body } });
  } catch (error: any) {
    console.error('Error updating document request:', error);
    return NextResponse.json(
      { error: 'Failed to update document request', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Delete a specific document request
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;
    return NextResponse.json({ message: 'Request deleted', requestId });
  } catch (error: any) {
    console.error('Error deleting document request:', error);
    return NextResponse.json(
      { error: 'Failed to delete document request', details: error.message },
      { status: 500 }
    );
  }
}
