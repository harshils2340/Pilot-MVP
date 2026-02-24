import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/app/lib/mongodb';
import { PermitManagement } from '@/app/lib/permits/managementSchema';

const STATUS_VALUES = ['not-started', 'in-progress', 'submitted', 'action-required', 'approved'] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();
    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Permit ID is required' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (body.status && STATUS_VALUES.includes(body.status)) {
      updates.status = body.status;
      updates.lastActivity = new Date().toISOString();
      updates.lastActivityDate = new Date();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
    }

    const updated = await PermitManagement.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json({ error: 'Permit not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: updated._id.toString(),
      ...updated,
      _id: updated._id.toString(),
    });
  } catch (error) {
    console.error('PATCH /api/permits/management/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update permit' },
      { status: 500 }
    );
  }
}
