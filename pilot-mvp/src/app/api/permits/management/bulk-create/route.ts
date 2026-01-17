import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/app/lib/mongodb';
import { PermitManagement } from '@/app/lib/permits/managementSchema';

export async function POST(request: NextRequest) {
  try {
    await connectToDB();
    const body = await request.json();
    
    if (!body.permits || !Array.isArray(body.permits)) {
      return NextResponse.json(
        { error: 'Permits array is required' },
        { status: 400 }
      );
    }
    
    // Create permit management entries
    const createdPermits = await PermitManagement.insertMany(body.permits);
    
    return NextResponse.json({
      success: true,
      created: createdPermits.length,
      permits: createdPermits.map(p => ({
        id: p._id.toString(),
        ...p.toObject(),
      })),
    }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to bulk create permit management entries:', error);
    return NextResponse.json(
      { error: 'Failed to create permits', details: error.message },
      { status: 500 }
    );
  }
}
