import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/app/lib/mongodb';
import { Lead } from '@/app/lib/crm/leadSchema';
import ClientModel from '@/app/models/client';

/**
 * GET /api/gmail/lookup
 * Lookup client or lead by email address (for Gmail add-on)
 * Query param: email
 */
export async function GET(request: NextRequest) {
  try {
    await connectToDB();
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email')?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    // Look up both client and lead
    const [client, lead] = await Promise.all([
      ClientModel.findOne({
        $or: [
          { 'contactInfo.email': { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
        ],
      }).lean(),
      Lead.findOne({ email: email }).lean(),
    ]);

    const result: {
      type?: 'client' | 'lead' | 'both';
      client?: any;
      lead?: any;
      found: boolean;
    } = { found: false };

    if (client) {
      result.type = 'client';
      result.client = {
        _id: client._id.toString(),
        businessName: client.businessName,
        jurisdiction: client.jurisdiction,
        status: client.status,
        activePermits: client.activePermits || 0,
        contactInfo: client.contactInfo,
        lastActivity: client.lastActivity,
        completionRate: client.completionRate || 0,
      };
    }

    if (lead) {
      result.type = result.type ? 'both' : 'lead';
      result.lead = {
        _id: lead._id.toString(),
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        source: lead.source,
        status: lead.status,
        stageName: lead.stageName,
        probability: lead.probability,
        emailCount: lead.emailCount || 0,
        lastEmailDate: lead.lastEmailDate,
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt,
      };
    }

    if (!client && !lead) {
      return NextResponse.json({ found: false }, { status: 200 });
    }

    result.found = true;
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error looking up client/lead:', error);
    return NextResponse.json(
      { error: 'Failed to lookup client/lead', details: error.message },
      { status: 500 }
    );
  }
}
