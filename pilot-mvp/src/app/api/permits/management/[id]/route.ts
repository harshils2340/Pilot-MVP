import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/app/lib/mongodb';
import { PermitManagement } from '@/app/lib/permits/managementSchema';
import { updateTimelineForStatusChange, estimatePermitTimeline } from '../../../../lib/timeline/estimation';
import { Permit } from '../../../../lib/permits/schema';
import ClientModel from '@/app/models/client';

/**
 * GET /api/permits/management/[id]
 * Get a specific permit management entry
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();
    const { id } = await params;

    const permit = await PermitManagement.findById(id).lean();

    if (!permit) {
      return NextResponse.json(
        { error: 'Permit not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: permit._id.toString(),
      ...permit,
    });
  } catch (error: any) {
    console.error('Failed to fetch permit:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permit', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/permits/management/[id]
 * Update a permit management entry
 * Automatically updates timeline when status changes
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();
    const { id } = await params;
    const body = await request.json();

    const permit = await PermitManagement.findById(id);

    if (!permit) {
      return NextResponse.json(
        { error: 'Permit not found' },
        { status: 404 }
      );
    }

    const oldStatus = permit.status;
    const newStatus = body.status;

    // Update permit fields
    if (body.name !== undefined) permit.name = body.name;
    if (body.authority !== undefined) permit.authority = body.authority;
    if (body.municipality !== undefined) permit.municipality = body.municipality;
    if (body.complexity !== undefined) permit.complexity = body.complexity;
    if (body.description !== undefined) permit.description = body.description;
    if (body.category !== undefined) permit.category = body.category;
    if (body.status !== undefined) permit.status = body.status;
    if (body.order !== undefined) permit.order = body.order;
    if (body.lastActivity !== undefined) permit.lastActivity = body.lastActivity;
    if (body.lastActivityDate !== undefined) permit.lastActivityDate = body.lastActivityDate;
    if (body.requirements !== undefined) permit.requirements = body.requirements;
    if (body.fees !== undefined) permit.fees = body.fees;
    if (body.purpose !== undefined) permit.purpose = body.purpose;
    if (body.howToApply !== undefined) permit.howToApply = body.howToApply;
    if (body.contactInfo !== undefined) permit.contactInfo = body.contactInfo;
    if (body.additionalNotes !== undefined) permit.additionalNotes = body.additionalNotes;

    // Update timeline if status changed
    if (newStatus && newStatus !== oldStatus) {
      const delayDays = body.delayDays || 0;
      const updatedTimeline = updateTimelineForStatusChange(
        permit,
        newStatus,
        delayDays
      );

      permit.timeline = {
        ...permit.timeline,
        ...updatedTimeline,
      };
    }

    // If timeline doesn't exist and permit is being started, estimate it
    if (!permit.timeline?.initialEstimatedDays && (newStatus === 'in-progress' || newStatus === 'submitted')) {
      try {
        let catalogPermit = null;
        if (permit.permitId) {
          try {
            catalogPermit = await Permit.findById(permit.permitId).lean();
          } catch (err) {
            console.warn('Could not fetch catalog permit:', err);
          }
        }
        let clientInfo: { businessName?: string; jurisdiction?: string } | null = null;
        try {
          if (permit.clientId) {
            const client = await ClientModel.findById(permit.clientId).lean();
            if (client) {
              clientInfo = {
                businessName: client.businessName,
                jurisdiction: client.jurisdiction,
              };
            }
          }
        } catch {
          clientInfo = null;
        }

        const estimate = await estimatePermitTimeline(permit, catalogPermit as any, clientInfo);
        const now = new Date();
        const estimatedStartDate = permit.timeline?.actualStartDate || now;

        permit.timeline = {
          ...permit.timeline,
          initialEstimatedDays: estimate.estimatedDays,
          currentEstimatedDays: estimate.estimatedDays,
          estimatedStartDate,
          initialEstimatedCompletionDate: estimate.estimatedCompletionDate,
          currentEstimatedCompletionDate: estimate.estimatedCompletionDate,
          lastUpdated: now,
        };
      } catch (err) {
        console.error('Failed to estimate timeline:', err);
        // Continue without timeline estimate
      }
    }

    await permit.save();

    return NextResponse.json({
      id: permit._id.toString(),
      ...permit.toObject(),
    });
  } catch (error: any) {
    console.error('Failed to update permit:', error);
    return NextResponse.json(
      { error: 'Failed to update permit', details: error.message },
      { status: 500 }
    );
  }
}

// Backwards-compatible alias for callers still using PATCH.
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return PUT(request, context);
}

/**
 * DELETE /api/permits/management/[id]
 * Delete a permit management entry
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();
    const { id } = await params;

    const permit = await PermitManagement.findByIdAndDelete(id);

    if (!permit) {
      return NextResponse.json(
        { error: 'Permit not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      deletedId: id,
    });
  } catch (error: any) {
    console.error('Failed to delete permit:', error);
    return NextResponse.json(
      { error: 'Failed to delete permit', details: error.message },
      { status: 500 }
    );
  }
}
