import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/app/lib/mongodb';
import { Lead } from '@/app/lib/crm/leadSchema';
import { PipelineStage, initializeDefaultStages } from '@/app/lib/crm/pipelineSchema';

/**
 * OPTIONS handler for CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

/**
 * POST /api/gmail/lead-intake
 * Create a lead from Gmail add-on (email sender → Leads).
 * Body: { name, email, company?, phone?, notes?, messageId?, subject? }
 */
export async function POST(request: NextRequest) {
  try {
    await connectToDB();
    await initializeDefaultStages();

    const body = await request.json();
    const name = (body.name || '').trim();
    const email = (body.email || '').trim();
    const company = (body.company || '').trim() || undefined;
    const phone = (body.phone || '').trim() || undefined;
    const notes = (body.notes || '').trim() || undefined;
    const messageId = body.messageId;
    const subject = body.subject;

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: 'Name and email are required' },
        { status: 400 }
      );
    }

    const existing = await Lead.findOne({ email: email.toLowerCase() }).lean();
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'Lead with this email already exists',
          lead: { _id: existing._id.toString(), name: existing.name, email: existing.email },
        },
        { status: 409 }
      );
    }

    const newLead = new Lead({
      name,
      email: email.toLowerCase(),
      company,
      phone,
      notes: notes || (subject ? `From email: ${subject}` : undefined),
      source: 'email',
      status: 'new',
      emailCount: 0,
      tags: messageId ? ['gmail', `msg:${messageId}`] : ['gmail'],
      permitRelated: true,
    });
    await newLead.save();
    const leadId = newLead._id.toString();

    const firstStage = await PipelineStage.findOne().sort({ sequence: 1 }).lean();
    if (firstStage) {
      await Lead.findByIdAndUpdate(leadId, {
        $set: {
          stageId: firstStage._id.toString(),
          stageName: firstStage.name,
          probability: firstStage.probability,
        },
      });
    }

    const response = NextResponse.json({
      success: true,
      lead: {
        _id: leadId,
        name: newLead.name,
        email: newLead.email,
        company: newLead.company,
        phone: newLead.phone,
        notes: newLead.notes,
        stageName: firstStage?.name || 'New',
        source: 'email',
      },
    });

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

    return response;
  } catch (error: any) {
    console.error('Gmail lead-intake error:', error);
    const errorResponse = NextResponse.json(
      { success: false, error: error.message || 'Failed to create lead' },
      { status: 500 }
    );
    
    // Add CORS headers to error response
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return errorResponse;
  }
}
