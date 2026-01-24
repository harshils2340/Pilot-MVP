import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/app/lib/mongodb';
import { PermitEmail } from '@/app/lib/emails/schema';
import { Permit } from '@/app/lib/permits/schema';
import ClientModel from '@/app/models/client';

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
    let emails = await PermitEmail.find(query)
      .sort({ receivedAt: -1 })
      .limit(limit * 2) // Fetch more to filter, then limit
      .skip(skip)
      .lean();

    // Get all registered clients from the database
    const registeredClients = await ClientModel.find().lean();
    const registeredClientIds = new Set(registeredClients.map((c: any) => c._id.toString()));
    
    // Filter to only show emails that are either:
    // 1. From a registered client (has clientId that exists in clients collection), OR
    // 2. Contains permit-related keywords (permits, licensing, licencing)
    const requiredKeywords = ['permits', 'licensing', 'licencing'];
    
    const permitRelatedEmails = emails.filter((email: any) => {
      // Check if email is from a registered client (clientId exists and is in registered clients)
      const isFromRegisteredClient = email.clientId && registeredClientIds.has(email.clientId.toString());
      
      // Check if email contains permit-related keywords
      const subject = (email.subject || '').toLowerCase();
      const body = (email.body || '').toLowerCase();
      const hasRequiredKeyword = requiredKeywords.some(keyword => 
        subject.includes(keyword.toLowerCase()) || body.includes(keyword.toLowerCase())
      );

      // Show email if it's from a registered client OR contains permit keywords
      return isFromRegisteredClient || hasRequiredKeyword;
    }).slice(0, limit); // Apply limit after filtering

    // Fetch permit details for emails that have permitId
    const permitIds = [...new Set(permitRelatedEmails.map((e: any) => e.permitId).filter(Boolean))];
    const permits = await Permit.find({ _id: { $in: permitIds } }).lean();
    const permitMap = new Map(permits.map((p: any) => [p._id.toString(), p]));

    // Enrich emails with permit details
    const enrichedEmails = permitRelatedEmails.map((email: any) => {
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

    // Get unread count for emails from registered clients OR with permit keywords
    const allUnreadEmails = await PermitEmail.find({ ...query, status: 'unread' }).lean();
    const permitRelatedUnread = allUnreadEmails.filter((email: any) => {
      // Check if email is from a registered client
      const isFromRegisteredClient = email.clientId && registeredClientIds.has(email.clientId.toString());
      
      // Check if email contains permit-related keywords
      const subject = (email.subject || '').toLowerCase();
      const body = (email.body || '').toLowerCase();
      const hasRequiredKeyword = requiredKeywords.some(keyword => 
        subject.includes(keyword.toLowerCase()) || body.includes(keyword.toLowerCase())
      );

      return isFromRegisteredClient || hasRequiredKeyword;
    });
    const unreadCount = permitRelatedUnread.length;

    return NextResponse.json({
      emails: enrichedEmails,
      unreadCount,
      total: permitRelatedEmails.length,
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
