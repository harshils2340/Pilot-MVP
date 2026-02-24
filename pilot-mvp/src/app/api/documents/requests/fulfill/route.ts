import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/app/lib/mongodb';
import { DocumentRequest } from '@/app/lib/documents/requestSchema';
import mongoose from 'mongoose';

/** POST: Mark a specific document request as fulfilled by a given document. */
export async function POST(request: NextRequest) {
  try {
    await connectToDB();
    const body = await request.json();
    const { clientId, documentId, requestId } = body;

    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId is required' },
        { status: 400 }
      );
    }

    // If requestId is provided, update that specific request
    if (requestId) {
      // Convert requestId to ObjectId if it's a valid ObjectId string
      let requestObjectId: any = requestId;
      if (mongoose.Types.ObjectId.isValid(requestId)) {
        requestObjectId = new mongoose.Types.ObjectId(requestId);
      }
      
      const result = await DocumentRequest.updateOne(
        { _id: requestObjectId, status: 'pending' },
        {
          $set: {
            status: 'fulfilled',
            fulfilledAt: new Date(),
            fulfilledByDocumentId: documentId,
          },
        }
      );

      if (result.matchedCount === 0) {
        console.warn(`No pending request found with ID: ${requestId}`);
        return NextResponse.json(
          { error: 'Request not found or already fulfilled', matched: 0, modified: 0 },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        matched: result.matchedCount,
        modified: result.modifiedCount,
      });
    }

    // Otherwise, update all pending requests for the client (backward compatibility)
    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId is required when requestId is not provided' },
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
