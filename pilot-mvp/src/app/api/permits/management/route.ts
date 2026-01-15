import { NextResponse } from 'next/server';
import connectToDB from '../../../lib/mongodb';
import { PermitManagement } from '../../../lib/permits/managementSchema';

export async function GET() {
  try {
    await connectToDB();
    const permits = await PermitManagement.find({}).lean();
    
    // Convert MongoDB _id to id and format for frontend
    const formattedPermits = permits.map((permit: any) => ({
      id: permit._id.toString(),
      name: permit.name,
      authority: permit.authority,
      complexity: permit.complexity,
      estimatedTime: permit.estimatedTime,
      description: permit.description,
      category: permit.category,
      requirements: permit.requirements || [],
      fees: permit.fees,
      purpose: permit.purpose,
      howToApply: permit.howToApply,
      contactInfo: permit.contactInfo || {},
      additionalNotes: permit.additionalNotes,
    }));

    return NextResponse.json(formattedPermits);
  } catch (error) {
    console.error('Failed to fetch permits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permits' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectToDB();
    const body = await request.json();
    
    const permit = await PermitManagement.create(body);
    
    return NextResponse.json({
      id: permit._id.toString(),
      ...permit.toObject(),
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create permit:', error);
    return NextResponse.json(
      { error: 'Failed to create permit' },
      { status: 500 }
    );
  }
}

