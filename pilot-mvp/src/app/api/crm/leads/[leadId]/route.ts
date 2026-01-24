import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/app/lib/mongodb';
import { Lead } from '@/app/lib/crm/leadSchema';
import { PipelineStage } from '@/app/lib/crm/pipelineSchema';

// Helper to serialize lead
const serializeLead = (lead: any) => ({
  ...lead,
  _id: lead._id.toString(),
  emails: lead.emails?.map((e: any) => ({
    ...e,
    emailId: e.emailId?.toString(),
  })) || [],
});

// GET: Fetch a single lead by ID
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
    
    return NextResponse.json({ lead: serializeLead(lead) }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching lead:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lead', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH: Update a lead
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    await connectToDB();
    const { leadId } = await params;
    const body = await request.json();
    
    const updateData: any = {};
    if (body.name) updateData.name = body.name.trim();
    if (body.email) updateData.email = body.email.toLowerCase().trim();
    if (body.phone !== undefined) updateData.phone = body.phone?.trim();
    if (body.company !== undefined) updateData.company = body.company?.trim();
    if (body.status) updateData.status = body.status;
    if (body.notes !== undefined) updateData.notes = body.notes?.trim();
    if (body.tags) updateData.tags = body.tags;
    // Odoo CRM: Pipeline stage updates
    if (body.stageId != null || body.stageName != null) {
      let stage: { _id: any; name: string; probability: number; isWon?: boolean; isLost?: boolean } | null = null;
      if (body.stageId) {
        try {
          stage = await PipelineStage.findById(body.stageId).lean();
        } catch {
          stage = null;
        }
      }
      if (!stage && body.stageName) {
        const name = String(body.stageName).trim();
        stage = await PipelineStage.findOne({ name }).lean();
      }
      if (!stage) {
        return NextResponse.json(
          { error: 'Stage not found', stageId: body.stageId, stageName: body.stageName },
          { status: 400 }
        );
      }
      const stageIdStr = stage._id.toString();
      updateData.stageId = stageIdStr;
      updateData.stageName = stage.name;
      updateData.probability = body.probability !== undefined ? body.probability : stage.probability;
      if (stage.isWon) {
        updateData.status = 'converted';
        updateData.convertedToOpportunity = true;
        updateData.convertedDate = new Date();
      } else if (stage.isLost) {
        updateData.status = 'lost';
      }
    }
    if (body.probability !== undefined) updateData.probability = body.probability;
    if (body.expectedRevenue !== undefined) updateData.expectedRevenue = body.expectedRevenue;
    if (body.expectedClosingDate) updateData.expectedClosingDate = new Date(body.expectedClosingDate);
    if (body.userId !== undefined) updateData.userId = body.userId;
    if (body.teamId !== undefined) updateData.teamId = body.teamId;
    
    const lead = await Lead.findByIdAndUpdate(
      leadId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();
    
    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: true, lead: serializeLead(lead) },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating lead:', error);
    return NextResponse.json(
      { error: 'Failed to update lead', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Delete a lead
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    await connectToDB();
    const { leadId } = await params;
    
    const lead = await Lead.findByIdAndDelete(leadId).lean();
    
    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: true, message: 'Lead deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting lead:', error);
    return NextResponse.json(
      { error: 'Failed to delete lead', details: error.message },
      { status: 500 }
    );
  }
}
