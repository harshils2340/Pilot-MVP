import { NextResponse } from 'next/server';
import connectToDB from '../../../../lib/mongodb';
import { PermitManagement } from '../../../../lib/permits/managementSchema';
import { ObjectId } from 'mongodb';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();
    const { id } = await params;
    const body = await request.json();
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid permit ID' },
        { status: 400 }
      );
    }
    
    const permit = await PermitManagement.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    ).lean();
    
    if (!permit) {
      return NextResponse.json(
        { error: 'Permit not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
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
    });
  } catch (error) {
    console.error('Failed to update permit:', error);
    return NextResponse.json(
      { error: 'Failed to update permit' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();
    const { id } = await params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid permit ID' },
        { status: 400 }
      );
    }
    
    const permit = await PermitManagement.findByIdAndDelete(id);
    
    if (!permit) {
      return NextResponse.json(
        { error: 'Permit not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete permit:', error);
    return NextResponse.json(
      { error: 'Failed to delete permit' },
      { status: 500 }
    );
  }
}

