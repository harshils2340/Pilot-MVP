import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/app/lib/mongodb';
import { PermitEmail } from '@/app/lib/emails/schema';
import { Permit } from '@/app/lib/permits/schema';

// Backend configuration for test mode
const EMAIL_TEST_MODE = process.env.EMAIL_TEST_MODE === 'true' || false;

// GET: Fetch emails for permit inbox
export async function GET(request: NextRequest) {
  try {
    await connectToDB();

    const searchParams = request.nextUrl.searchParams;
    const permitId = searchParams.get('permitId');
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status'); // 'unread', 'read', 'all'
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    // Build query
    const query: any = {};
    if (permitId) query.permitId = permitId;
    if (clientId) query.clientId = clientId;
    if (status && status !== 'all') query.status = status;
    
    // When test=false, only show client emails (inbound with clientName)
    // When test=true, show all emails
    if (!EMAIL_TEST_MODE) {
      query.direction = 'inbound';
      query.clientName = { $exists: true, $ne: null, $nin: ['', null] };
    }

    // Fetch emails sorted by most recent first
    const emails = await PermitEmail.find(query)
      .sort({ receivedAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    // Fetch permit details for emails that have permitId
    const permitIds = [...new Set(emails.map((e: any) => e.permitId).filter(Boolean))];
    const permits = await Permit.find({ _id: { $in: permitIds } }).lean();
    const permitMap = new Map(permits.map((p: any) => [p._id.toString(), p]));

    // Enrich emails with permit details
    const enrichedEmails = emails.map((email: any) => {
      const permit = email.permitId ? permitMap.get(email.permitId) : null;
      return {
        ...email,
        permitDetails: permit ? {
          authority: permit.authority,
          municipality: permit.jurisdiction?.city || permit.contactInfo?.municipality || 'Unknown',
          jurisdiction: permit.jurisdiction
        } : null
      };
    });

    // Get unread count
    const unreadCount = await PermitEmail.countDocuments({ ...query, status: 'unread' });

    return NextResponse.json({
      emails: enrichedEmails,
      unreadCount,
      total: emails.length,
      test: EMAIL_TEST_MODE
    });
  } catch (error: any) {
    console.error('Error fetching emails:', error);
    return NextResponse.json(
      { error: 'Failed to fetch emails', details: error.message },
      { status: 500 }
    );
  }
}

// POST: Create a new email (for sending or receiving)
export async function POST(request: NextRequest) {
  try {
    await connectToDB();

    const body = await request.json();
    const {
      permitId,
      permitName,
      clientId,
      clientName,
      subject,
      from,
      to,
      body: emailBody,
      htmlBody,
      attachments,
      direction,
      priority,
      threadId,
      inReplyTo,
      metadata
    } = body;

    // Validate required fields
    if (!permitId || !permitName || !subject || !from || !to || !emailBody || !direction) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create email document
    const email = new PermitEmail({
      permitId,
      permitName,
      clientId,
      clientName,
      subject,
      from,
      to,
      body: emailBody,
      htmlBody,
      attachments: attachments || [],
      direction,
      status: direction === 'inbound' ? 'unread' : 'read',
      priority: priority || 'medium',
      receivedAt: direction === 'inbound' ? new Date() : undefined,
      sentAt: direction === 'outbound' ? new Date() : undefined,
      threadId,
      inReplyTo,
      metadata
    });

    await email.save();

    return NextResponse.json({
      success: true,
      email: email.toObject(),
      test: EMAIL_TEST_MODE
    });
  } catch (error: any) {
    console.error('Error creating email:', error);
    return NextResponse.json(
      { error: 'Failed to create email', details: error.message },
      { status: 500 }
    );
  }
}
