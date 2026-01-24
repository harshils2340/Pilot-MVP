import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/app/lib/mongodb';
import { Lead } from '@/app/lib/crm/leadSchema';
import { PipelineStage, initializeDefaultStages } from '@/app/lib/crm/pipelineSchema';
import { backfillLeadsFromPermitEmails } from '@/app/lib/crm/ensureLeadForPermitEmail';

// Helper to serialize lead
const serializeLead = (lead: any) => ({
  ...lead,
  _id: lead._id.toString(),
  emails: lead.emails?.map((e: any) => ({
    ...e,
    emailId: e.emailId?.toString(),
  })) || [],
});

// GET: Fetch all leads
export async function GET(request: NextRequest) {
  try {
    await connectToDB();
    
    // Ensure default pipeline stages exist
    await initializeDefaultStages();
    
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const stageId = searchParams.get('stageId');
    
    // Build query – only return permit-related leads
    const query: any = { permitRelated: true };
    if (status && status !== 'all') {
      query.status = status;
    }
    if (stageId) {
      query.stageId = stageId;
    }
    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { company: { $regex: search, $options: 'i' } },
        ],
      });
    }
    
    // Ensure leads exist for all permit-related emails in Permit Inbox (idempotent backfill)
    try {
      await backfillLeadsFromPermitEmails();
    } catch (e) {
      console.warn('Leads backfill failed:', (e as Error).message);
    }

    const leads = await Lead.find(query)
      .sort({ lastEmailDate: -1, createdAt: -1 })
      .lean();
    
    // If leads don't have stageId, assign to first stage (New)
    const firstStage = await PipelineStage.findOne().sort({ sequence: 1 }).lean();
    if (firstStage) {
      for (const lead of leads) {
        if (!lead.stageId) {
          await Lead.findByIdAndUpdate(lead._id, {
            stageId: firstStage._id.toString(),
            stageName: firstStage.name,
            probability: firstStage.probability,
          });
          lead.stageId = firstStage._id.toString();
          lead.stageName = firstStage.name;
          lead.probability = firstStage.probability;
        }
      }
    }
    
    const serializedLeads = leads.map(serializeLead);
    
    return NextResponse.json({ leads: serializedLeads }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads', details: error.message },
      { status: 500 }
    );
  }
}

// POST: Create a new lead
export async function POST(request: NextRequest) {
  try {
    await connectToDB();
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: 'name and email are required' },
        { status: 400 }
      );
    }
    
    // Check if lead with this email already exists
    const existingLead = await Lead.findOne({ email: body.email.toLowerCase().trim() }).lean();
    
    if (existingLead) {
      return NextResponse.json(
        { error: 'Lead with this email already exists', lead: serializeLead(existingLead) },
        { status: 409 }
      );
    }
    
    // Create new lead (manual leads are treated as permit-related)
    const newLead = new Lead({
      name: body.name.trim(),
      email: body.email.toLowerCase().trim(),
      phone: body.phone?.trim(),
      company: body.company?.trim(),
      source: body.source || 'manual',
      status: body.status || 'new',
      notes: body.notes?.trim(),
      emailCount: 0,
      tags: body.tags || [],
      permitRelated: body.permitRelated !== false,
    });
    
    await newLead.save();
    
    return NextResponse.json(
      { success: true, lead: serializeLead(newLead.toObject()) },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating lead:', error);
    return NextResponse.json(
      { error: 'Failed to create lead', details: error.message },
      { status: 500 }
    );
  }
}
