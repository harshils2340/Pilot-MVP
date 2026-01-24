import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/app/lib/mongodb';
import { Lead } from '@/app/lib/crm/leadSchema';

// PATCH: Update an activity (mark as done, cancel, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string; activityId: string }> }
) {
  try {
    await connectToDB();
    const { leadId, activityId } = await params;
    const body = await request.json();
    
    const lead = await Lead.findById(leadId);
    
    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }
    
    if (!lead.activities || lead.activities.length === 0) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      );
    }
    
    const activityIndex = lead.activities.findIndex(
      (a: any) => a._id?.toString() === activityId
    );
    
    if (activityIndex === -1) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      );
    }
    
    // Update activity fields
    if (body.status) lead.activities[activityIndex].status = body.status;
    if (body.result !== undefined) lead.activities[activityIndex].result = body.result;
    if (body.completedDate) {
      lead.activities[activityIndex].completedDate = new Date(body.completedDate);
    }
    if (body.summary) lead.activities[activityIndex].summary = body.summary;
    if (body.description !== undefined) lead.activities[activityIndex].description = body.description;
    if (body.scheduledDate) {
      lead.activities[activityIndex].scheduledDate = new Date(body.scheduledDate);
    }
    
    // Update nextActivityDate
    const plannedActivities = lead.activities.filter((a: any) => a.status === 'planned');
    if (plannedActivities.length > 0) {
      const earliestActivity = plannedActivities.reduce((earliest: any, current: any) => 
        new Date(current.scheduledDate) < new Date(earliest.scheduledDate) ? current : earliest
      );
      lead.nextActivityDate = new Date(earliestActivity.scheduledDate);
    } else {
      lead.nextActivityDate = undefined;
    }
    
    await lead.save();
    
    return NextResponse.json(
      { success: true, activity: lead.activities[activityIndex] },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating activity:', error);
    return NextResponse.json(
      { error: 'Failed to update activity', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Delete an activity
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string; activityId: string }> }
) {
  try {
    await connectToDB();
    const { leadId, activityId } = await params;
    
    const lead = await Lead.findById(leadId);
    
    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }
    
    if (!lead.activities) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      );
    }
    
    lead.activities = lead.activities.filter(
      (a: any) => a._id?.toString() !== activityId
    );
    
    // Update nextActivityDate
    const plannedActivities = lead.activities.filter((a: any) => a.status === 'planned');
    if (plannedActivities.length > 0) {
      const earliestActivity = plannedActivities.reduce((earliest: any, current: any) => 
        new Date(current.scheduledDate) < new Date(earliest.scheduledDate) ? current : earliest
      );
      lead.nextActivityDate = new Date(earliestActivity.scheduledDate);
    } else {
      lead.nextActivityDate = undefined;
    }
    
    await lead.save();
    
    return NextResponse.json(
      { success: true, message: 'Activity deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting activity:', error);
    return NextResponse.json(
      { error: 'Failed to delete activity', details: error.message },
      { status: 500 }
    );
  }
}
