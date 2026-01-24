import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/app/lib/mongodb';
import { Lead } from '@/app/lib/crm/leadSchema';
import { IActivity } from '@/app/lib/crm/leadSchema';

// Helper to serialize
const serialize = (obj: any) => ({
  ...obj,
  _id: obj._id?.toString(),
});

// GET: Fetch activities for a lead
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    await connectToDB();
    const { leadId } = await params;
    
    const lead = await Lead.findById(leadId).lean();
    
    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      activities: (lead.activities || []).map(serialize) 
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities', details: error.message },
      { status: 500 }
    );
  }
}

// POST: Create a new activity for a lead
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    await connectToDB();
    const { leadId } = await params;
    const body = await request.json();
    
    if (!body.type || !body.summary || !body.scheduledDate) {
      return NextResponse.json(
        { error: 'type, summary, and scheduledDate are required' },
        { status: 400 }
      );
    }
    
    const lead = await Lead.findById(leadId);
    
    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }
    
    const newActivity: IActivity = {
      type: body.type,
      summary: body.summary,
      description: body.description,
      scheduledDate: new Date(body.scheduledDate),
      assignedTo: body.assignedTo,
      status: 'planned',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    if (!lead.activities) {
      lead.activities = [];
    }
    
    lead.activities.push(newActivity);
    
    // Update nextActivityDate if this is the earliest scheduled activity
    const allActivities = lead.activities.filter((a: IActivity) => a.status === 'planned');
    if (allActivities.length > 0) {
      const earliestActivity = allActivities.reduce((earliest: IActivity, current: IActivity) => 
        new Date(current.scheduledDate) < new Date(earliest.scheduledDate) ? current : earliest
      );
      lead.nextActivityDate = new Date(earliestActivity.scheduledDate);
    }
    
    await lead.save();
    
    return NextResponse.json(
      { success: true, activity: serialize(newActivity) },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating activity:', error);
    return NextResponse.json(
      { error: 'Failed to create activity', details: error.message },
      { status: 500 }
    );
  }
}
