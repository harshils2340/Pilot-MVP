import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/app/lib/mongodb';
import { Lead } from '@/app/lib/crm/leadSchema';
import { PermitEmail } from '@/app/lib/emails/schema';

/**
 * GET /api/crm/leads/[leadId]/emails
 * Fetch all emails received on the website involving this lead.
 * Matches PermitEmails where from.email or to.email equals the lead's email (case-insensitive).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    await connectToDB();
    const { leadId } = await params;
    const lead = await Lead.findById(leadId).lean();
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const leadEmail = (lead.email || '').trim().toLowerCase();
    if (!leadEmail) {
      return NextResponse.json({ emails: [] }, { status: 200 });
    }

    const escaped = leadEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`^${escaped}$`, 'i');

    const emails = await PermitEmail.find({
      $or: [
        { 'from.email': re },
        { 'to.email': re },
      ],
    })
      .sort({ receivedAt: -1 })
      .limit(200)
      .lean();

    const serialized = emails.map((e: any) => ({
      _id: e._id.toString(),
      subject: e.subject,
      from: e.from,
      to: e.to,
      body: e.body,
      htmlBody: e.htmlBody,
      direction: e.direction,
      status: e.status,
      receivedAt: e.receivedAt,
      sentAt: e.sentAt,
      permitId: e.permitId ? e.permitId.toString() : undefined,
      permitName: e.permitName,
      clientId: e.clientId ? e.clientId.toString() : undefined,
      clientName: e.clientName,
      attachments: e.attachments || [],
    }));

    // Update lead's emailCount and lastEmailDate to match actual emails
    const actualEmailCount = emails.length;
    const lastEmailDate = emails.length > 0
      ? emails.reduce((latest: Date | null, e: any) => {
          const emailDate = new Date(e.receivedAt);
          return !latest || emailDate > latest ? emailDate : latest;
        }, null as Date | null)
      : null;

    // Only update if values have changed to avoid unnecessary writes
    const needsUpdate =
      lead.emailCount !== actualEmailCount ||
      (lastEmailDate && (!lead.lastEmailDate || new Date(lead.lastEmailDate).getTime() !== lastEmailDate.getTime()));

    if (needsUpdate) {
      await Lead.findByIdAndUpdate(
        leadId,
        {
          $set: {
            emailCount: actualEmailCount,
            ...(lastEmailDate && { lastEmailDate }),
          },
        },
        { new: false } // Don't need to return updated doc
      ).lean();
    }

    return NextResponse.json({ emails: serialized }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching lead emails:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lead emails', details: error.message },
      { status: 500 }
    );
  }
}
