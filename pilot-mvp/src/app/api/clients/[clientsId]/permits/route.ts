import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/app/lib/mongodb';
import { PermitManagement } from '@/app/lib/permits/managementSchema';

// GET: Fetch all permits for a specific client
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientsId: string }> }
) {
  try {
    const { clientsId } = await params;
    await connectToDB();

    // Find all permits for this client
    const permits = await PermitManagement.find({ clientId: clientsId }).lean();

    // Convert _id to string for JSON serialization
    const permitsWithStringId = permits.map((permit: any) => ({
      ...permit,
      _id: permit._id.toString(),
      clientId: permit.clientId?.toString(),
      permitId: permit.permitId?.toString(),
    }));

    return NextResponse.json({ permits: permitsWithStringId }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching client permits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client permits', details: error.message },
      { status: 500 }
    );
  }
}

// POST: Create a new permit for a specific client
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientsId: string }> }
) {
  try {
    const { clientsId } = await params;
    const body = await request.json();
    await connectToDB();

    // Create new permit management entry
    const newPermit = new PermitManagement({
      ...body,
      clientId: clientsId,
    });

    await newPermit.save();

    return NextResponse.json(
      { 
        message: 'Permit created successfully',
        permit: {
          ...newPermit.toObject(),
          _id: newPermit._id.toString(),
        }
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating client permit:', error);
    return NextResponse.json(
      { error: 'Failed to create client permit', details: error.message },
      { status: 500 }
    );
  }
}
