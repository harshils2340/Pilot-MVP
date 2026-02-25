import { NextResponse } from 'next/server';
import connectToDB from '../../../../../../lib/mongodb';
import { PermitManagement } from '../../../../../../lib/permits/managementSchema';
import { Permit } from '../../../../../../lib/permits/schema';
import { estimatePermitTimeline, updateTimelineForStatusChange } from '../../../../../../lib/timeline/estimation';

/**
 * GET /api/clients/[clientsId]/permits/[permitId]/timeline
 * Get timeline data for a specific permit
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ clientsId: string; permitId: string }> }
) {
  try {
    await connectToDB();
    const { clientsId, permitId } = await params;
    const clientId = decodeURIComponent(clientsId);
    const permitManagementId = decodeURIComponent(permitId);

    const permit = await PermitManagement.findOne({
      _id: permitManagementId,
      clientId,
    }).lean();

    if (!permit) {
      return NextResponse.json(
        { error: 'Permit not found' },
        { status: 404 }
      );
    }

    const timeline = permit.timeline || {};

    return NextResponse.json({
      permitId: permit._id.toString(),
      permitName: permit.name,
      status: permit.status,
      timeline: {
        initialEstimatedDays: timeline.initialEstimatedDays,
        currentEstimatedDays: timeline.currentEstimatedDays,
        estimatedStartDate: timeline.estimatedStartDate,
        initialEstimatedCompletionDate: timeline.initialEstimatedCompletionDate,
        currentEstimatedCompletionDate: timeline.currentEstimatedCompletionDate,
        actualStartDate: timeline.actualStartDate,
        actualCompletionDate: timeline.actualCompletionDate,
        processingDelays: timeline.processingDelays || 0,
        lastUpdated: timeline.lastUpdated,
        statusHistory: timeline.statusHistory || [],
      },
    });
  } catch (error: any) {
    console.error('Failed to fetch permit timeline:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permit timeline', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/clients/[clientsId]/permits/[permitId]/timeline
 * Estimate or update timeline for a permit
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ clientsId: string; permitId: string }> }
) {
  try {
    await connectToDB();
    const { clientsId, permitId } = await params;
    const clientId = decodeURIComponent(clientsId);
    const permitManagementId = decodeURIComponent(permitId);
    const body = await request.json();

    const permit = await PermitManagement.findOne({
      _id: permitManagementId,
      clientId,
    });

    if (!permit) {
      return NextResponse.json(
        { error: 'Permit not found' },
        { status: 404 }
      );
    }

    // If forceEstimate is true, re-estimate using LLM
    if (body.forceEstimate) {
      // Fetch catalog permit if permitId is available
      let catalogPermit = null;
      if (permit.permitId) {
        try {
          catalogPermit = await Permit.findById(permit.permitId).lean();
        } catch (err) {
          console.warn('Could not fetch catalog permit:', err);
        }
      }

      const estimate = await estimatePermitTimeline(permit, catalogPermit);

      // Update timeline with new estimate
      const now = new Date();
      const estimatedStartDate = permit.timeline?.actualStartDate || permit.timeline?.estimatedStartDate || now;

      permit.timeline = {
        ...permit.timeline,
        initialEstimatedDays: estimate.estimatedDays,
        currentEstimatedDays: estimate.estimatedDays,
        estimatedStartDate,
        initialEstimatedCompletionDate: estimate.estimatedCompletionDate,
        currentEstimatedCompletionDate: estimate.estimatedCompletionDate,
        lastUpdated: now,
      };

      await permit.save();

      return NextResponse.json({
        success: true,
        timeline: permit.timeline,
        estimate,
      });
    }

    // Otherwise, update timeline based on status change or delay
    if (body.status || body.delayDays !== undefined) {
      const newStatus = body.status || permit.status;
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

      // Update status if provided
      if (body.status) {
        permit.status = body.status as any;
      }

      await permit.save();

      return NextResponse.json({
        success: true,
        timeline: permit.timeline,
      });
    }

    return NextResponse.json(
      { error: 'Invalid request. Provide forceEstimate, status, or delayDays' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Failed to update permit timeline:', error);
    return NextResponse.json(
      { error: 'Failed to update permit timeline', details: error.message },
      { status: 500 }
    );
  }
}
