import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/app/lib/mongodb';
import { DocumentRequest } from '@/app/lib/documents/requestSchema';

/** POST: Mark pending document request(s) for a client as fulfilled by a given document. */
export async function POST(request: NextRequest) {
  try {
    await connectToDB();
    const body = await request.json();
    const { clientId, documentId } = body;

    if (!clientId || !documentId) {
      return NextResponse.json(
        { error: 'clientId and documentId are required' },
        { status: 400 }
      );
    }

    const result = await DocumentRequest.updateMany(
      { clientId, status: 'pending' },
      {
        $set: {
          status: 'fulfilled',
          fulfilledAt: new Date(),
          fulfilledByDocumentId: documentId,
        },
      }
    );

    return NextResponse.json({
      success: true,
      matched: result.matchedCount,
      modified: result.modifiedCount,
    });
  } catch (error: any) {
    console.error('Failed to fulfill document request:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fulfill document request' },
      { status: 500 }
    );
  }
}
