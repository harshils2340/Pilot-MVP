// app/api/clients/[clientsId]/route.ts
import { NextResponse } from 'next/server';
import { clientPromise } from '../../../lib/mongodb'; // named export
import { ObjectId, Document, WithId } from 'mongodb';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ clientsId: string }> }
) {
  try {
    const { clientsId } = await params;
    const clientParam = decodeURIComponent(clientsId); // Decode URI components
    console.log('Fetching client with ID or name:', clientParam);

    const mongoClient = await clientPromise;
    const db = mongoClient.db('pilotClients'); // your DB name

    let clientData: WithId<Document> | null = null;

    // First, attempt to query by ObjectId if it's valid
    if (ObjectId.isValid(clientParam)) {
      const objectId = new ObjectId(clientParam);
      clientData = await db.collection('clients').findOne({ _id: objectId });
      console.log('Queried by ObjectId:', clientData);
    }

    // If not found by _id, query by businessName
    if (!clientData) {
      clientData = await db.collection('clients').findOne({ businessName: clientParam });
      console.log('Queried by businessName:', clientData);
    }

    // If not found by businessName, query by seed 'id' field (mock/demo clients)
    if (!clientData) {
      clientData = await db.collection('clients').findOne({ id: clientParam });
      console.log('Queried by seed id:', clientData);
    }

    // If still not found, return 404
    if (!clientData) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Convert _id to string for JSON serialization
    const clientForJson = {
      ...clientData,
      _id: clientData._id.toString(),
    };

    return NextResponse.json(clientForJson);
  } catch (error) {
    console.error('Failed to fetch client:', error);
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ clientsId: string }> }
) {
  try {
    const { clientsId } = await params;
    const clientParam = decodeURIComponent(clientsId);
    const body = await req.json();

    const mongoClient = await clientPromise;
    const db = mongoClient.db('pilotClients');

    let query: any = {};
    if (ObjectId.isValid(clientParam)) {
      query._id = new ObjectId(clientParam);
    } else {
      query.businessName = clientParam;
    }

    const updateData: any = {};
    if (body.contactInfo) {
      updateData.contactInfo = body.contactInfo;
    }
    if (body.consultantId) {
      updateData.consultantId = body.consultantId;
    }
    if (body.consultantEmail) {
      updateData.consultantEmail = body.consultantEmail;
    }

    const result = await db.collection('clients').updateOne(
      query,
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Fetch updated client
    const updatedClient = await db.collection('clients').findOne(query);
    if (!updatedClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...updatedClient,
      _id: updatedClient._id.toString(),
    });
  } catch (error) {
    console.error('Failed to update client:', error);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}
