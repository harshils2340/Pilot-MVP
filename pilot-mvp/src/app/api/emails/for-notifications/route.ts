import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/app/lib/mongodb';
import { PermitEmail } from '@/app/lib/emails/schema';
import { Lead } from '@/app/lib/crm/leadSchema';
import ClientModel from '@/app/models/client';

const REQUIRED_KEYWORDS = ['permits', 'licensing', 'licencing'];
const RECENT_DAYS = 30;
const MAX_EMAILS = 200;

/**
 * GET /api/emails/for-notifications
 * Returns emails that should appear in Notifications:
 * - From any registered client (has clientId in clients collection)
 * - From any lead (from.email matches a lead's email)
 * - Has clientName (client-associated)
 * - Contains permit-related keywords in subject/body
 */
export async function GET(_request: NextRequest) {
  try {
    await connectToDB();

    const since = new Date();
    since.setDate(since.getDate() - RECENT_DAYS);

    const [emails, leads, clients] = await Promise.all([
      PermitEmail.find({
        direction: 'inbound',
        receivedAt: { $gte: since },
      })
        .sort({ receivedAt: -1 })
        .limit(MAX_EMAILS * 2)
        .lean(),
      Lead.find().select('email name').lean(),
      ClientModel.find().select('_id').lean(),
    ]);

    const leadEmails = new Set<string>();
    const leadByEmail: Record<string, { leadId: string; leadName: string }> = {};
    (leads || []).forEach((l: any) => {
      const e = (l.email || '').trim().toLowerCase();
      if (e) {
        leadEmails.add(e);
        if (!leadByEmail[e]) {
          leadByEmail[e] = {
            leadId: l._id.toString(),
            leadName: (l.name || '').trim() || 'Lead',
          };
        }
      }
    });

    const clientIds = new Set<string>();
    (clients || []).forEach((c: any) => {
      const id = c._id?.toString();
      if (id) clientIds.add(id);
    });

    const filtered = (emails || []).filter((email: any) => {
      const fromEmail = (email.from?.email || '').trim().toLowerCase();
      const clientId = email.clientId?.toString();
      const hasClientId = !!clientId && clientIds.has(clientId);
      const hasClientName = !!(email.clientName && String(email.clientName).trim());
      const isFromLead = !!fromEmail && leadEmails.has(fromEmail);

      const subject = (email.subject || '').toLowerCase();
      const body = (email.body || '').toLowerCase();
      const hasKeyword = REQUIRED_KEYWORDS.some((k) =>
        subject.includes(k) || body.includes(k)
      );

      return hasClientId || hasClientName || isFromLead || hasKeyword;
    }).slice(0, MAX_EMAILS);

    const serialized = filtered.map((e: any) => {
      const fromEmail = (e.from?.email || '').trim().toLowerCase();
      const leadInfo = fromEmail ? leadByEmail[fromEmail] : null;
      return {
        _id: e._id.toString(),
        subject: e.subject,
        from: e.from,
        to: e.to,
        direction: e.direction,
        status: e.status,
        receivedAt: e.receivedAt,
        clientId: e.clientId?.toString(),
        clientName: e.clientName,
        permitId: e.permitId?.toString(),
        permitName: e.permitName,
        priority: e.priority || 'medium',
        ...(leadInfo && { leadId: leadInfo.leadId, leadName: leadInfo.leadName }),
      };
    });

    return NextResponse.json({ emails: serialized });
  } catch (error: any) {
    console.error('Error fetching emails for notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch emails for notifications', details: error.message },
      { status: 500 }
    );
  }
}
