// app/api/clients/route.ts
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '../../lib/mongodb'; // adjust relative path
import { ObjectId } from 'mongodb';
import { seedClients } from '../../lib/seedClients';

const DB_NAME = 'pilotClients'; // Make sure this matches your MongoDB DB name
const COLLECTION_NAME = 'clients';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const clients = await db.collection(COLLECTION_NAME).find({}).toArray();
    return NextResponse.json(clients);
  } catch (err) {
    console.error('GET /clients error:', err);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.businessName) {
      return NextResponse.json({ error: 'businessName is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const result = await db.collection(COLLECTION_NAME).insertOne(body);

    return NextResponse.json({ _id: result.insertedId, ...body });
  } catch (err) {
    console.error('POST /clients error:', err);
    return NextResponse.json({ error: 'Failed to add client' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body._id) {
      return NextResponse.json({ error: '_id is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    await db.collection(COLLECTION_NAME).updateOne(
      { _id: new ObjectId(body._id) },
      { $set: body }
    );

    return NextResponse.json(body);
  } catch (err) {
    console.error('PUT /clients error:', err);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { _id } = await req.json();
    if (!_id) {
      return NextResponse.json({ error: '_id is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    await db.collection(COLLECTION_NAME).deleteOne({ _id: new ObjectId(_id) });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /clients error:', err);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}