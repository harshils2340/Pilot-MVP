import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/app/lib/mongodb';
import { Lead } from '@/app/lib/crm/leadSchema';
import { PipelineStage, initializeDefaultStages } from '@/app/lib/crm/pipelineSchema';

const serializeLead = (lead: any) => ({
  ...lead,
  _id: lead._id.toString(),
  stageId: lead.stageId ? lead.stageId.toString() : lead.stageId,
  emails: lead.emails?.map((e: any) => ({ ...e, emailId: e.emailId?.toString?.() ?? e.emailId })) ?? [],
});

export async function GET(request: NextRequest) {
  try {
    await connectToDB();
    await initializeDefaultStages();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const stageId = searchParams.get('stageId');

    // Query for leads - include all leads with permitRelated not explicitly false
    const query: any = { permitRelated: { $ne: false } };
    if (status && status !== 'all') query.status = status;
    if (stageId) query.stageId = stageId;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ];
    }

    const leads = await Lead.find(query).sort({ lastEmailDate: -1, createdAt: -1 }).lean();

    const firstStage = await PipelineStage.findOne().sort({ sequence: 1 }).lean();
    if (firstStage) {
      for (const lead of leads) {
        if (!lead.stageId) {
          await Lead.findByIdAndUpdate(lead._id, {
            $set: {
              stageId: firstStage._id.toString(),
              stageName: firstStage.name,
              probability: firstStage.probability,
            },
          });
          (lead as any).stageId = firstStage._id.toString();
          (lead as any).stageName = firstStage.name;
          (lead as any).probability = firstStage.probability;
        }
      }
    }

    return NextResponse.json({ leads: leads.map(serializeLead) }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching leads:', error);
    return NextResponse.json({ error: 'Failed to fetch leads', details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDB();
    const body = await request.json();

    if (!body.name || !body.email) {
      return NextResponse.json({ error: 'name and email are required' }, { status: 400 });
    }

    const existing = await Lead.findOne({ email: body.email.toLowerCase().trim() }).lean();
    if (existing) {
      return NextResponse.json({ error: 'Lead with this email already exists', lead: serializeLead(existing) }, { status: 409 });
    }

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
    return NextResponse.json({ success: true, lead: serializeLead(newLead.toObject()) }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating lead:', error);
    return NextResponse.json({ error: 'Failed to create lead', details: error.message }, { status: 500 });
  }
}
