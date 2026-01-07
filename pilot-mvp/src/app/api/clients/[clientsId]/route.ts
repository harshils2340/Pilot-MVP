// app/api/clients/[clientsId]/route.ts
import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb'; // default import
import { ObjectId, Document, WithId } from 'mongodb';

export async function GET(
  req: Request,
  { params }: { params: { clientsId: string } }
) {
  try {
    const clientParam = decodeURIComponent(params.clientsId); // Decode URI components
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
