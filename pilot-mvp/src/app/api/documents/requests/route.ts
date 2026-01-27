import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/app/lib/mongodb';
import { DocumentRequest } from '@/app/lib/documents/requestSchema';

export async function GET(request: NextRequest) {
  try {
    await connectToDB();
    const url = new URL(request.url);
    const clientId = url.searchParams.get('clientId');
    const status = url.searchParams.get('status') || 'pending';

    const query: Record<string, unknown> = {};
    if (clientId) query.clientId = clientId;
    if (status) query.status = status;
    
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    let queryBuilder = DocumentRequest.find(query).sort({ requestedAt: -1 });
    if (limit && limit > 0) {
      queryBuilder = queryBuilder.limit(limit);
    }
    
    const requests = await queryBuilder.lean();

    return NextResponse.json(
      requests.map((r: any) => ({
        id: r._id.toString(),
        _id: r._id.toString(),
        ...r,
      }))
    );
  } catch (error: any) {
    console.error('Failed to fetch document requests:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch document requests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDB();
    const body = await request.json();
    const { clientId, clientName, permitId, permitName, title, description, consultantId, consultantName, expiresAt } = body;

    if (!clientId || !title) {
      return NextResponse.json(
        { error: 'clientId and title are required' },
        { status: 400 }
      );
    }

    const doc = await DocumentRequest.create({
      clientId,
      clientName: clientName || undefined,
      permitId: permitId || undefined,
      permitName: permitName || undefined,
      title,
      description: description || undefined,
      consultantId: consultantId || undefined,
      consultantName: consultantName || undefined,
      status: 'pending',
      requestedAt: new Date(),
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    return NextResponse.json(
      { id: doc._id.toString(), ...doc.toObject() },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Failed to create document request:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create document request' },
      { status: 500 }
    );
  }
}
