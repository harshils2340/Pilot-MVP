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
    const limit = parseInt(searchParams.get('limit') || '25'); // Default to 25 email cap
    const skip = parseInt(searchParams.get('skip') || '0');

    // Build query
    const query: any = {};
    if (permitId) query.permitId = permitId;
    if (clientId) query.clientId = clientId;
    if (status && status !== 'all') query.status = status;

    // Fetch ALL emails from database - no filtering by Gmail account
    // Show all emails regardless of which Gmail account they came from
    // Priority: Permit-related and client emails first, then others
    // Sort by most recent first to ensure latest emails are shown
    // Fetch more emails to allow re-sorting (permit/client emails prioritized)
    const rawEmails = await PermitEmail.find(query)
      .sort({ receivedAt: -1 }) // Sort by most recent first (newest emails first)
      .limit(limit * 3) // Fetch 3x limit to ensure we get permit/client emails even if they're older
      .skip(skip)
      .lean();

    // Deduplicate by gmailId (keep first = most recent); emails without gmailId are kept
    const seenGmailIds = new Set<string>();
    const allEmails = rawEmails.filter((e: any) => {
      const gid = e.gmailId;
      if (!gid) return true;
      if (seenGmailIds.has(gid)) return false;
      seenGmailIds.add(gid);
      return true;
    });
    
    // Separate permit-related and client emails from others
    // These emails should ALWAYS show up regardless of which Gmail account they came from
    // Permit-related emails are those that:
    // 1. Have "Permit" in subject or body
    // 2. Have a permitName containing "Permit"
    // 3. Are associated with a permit (have permitId)
    // 4. Are from clients (have clientId) - these sync from clients
    const permitRelatedEmails = allEmails.filter((email: any) => {
      const subject = (email.subject || '').toLowerCase();
      const body = (email.body || '').toLowerCase();
      const permitName = (email.permitName || '').toLowerCase().trim();
      
      // Check if email is permit-related or from a client
      const hasPermitInSubject = subject.includes('permit');
      const hasPermitInBody = body.includes('permit');
      const hasPermitInName = permitName.includes('permit');
      const hasPermitId = !!email.permitId;
      const hasClientId = !!email.clientId; // Emails from clients should ALWAYS be shown
      
      // Also check for licensing keywords
      const hasLicensingKeywords = subject.includes('licens') || body.includes('licens');
      
      return hasPermitInSubject || hasPermitInBody || hasPermitInName || hasPermitId || hasClientId || hasLicensingKeywords;
    });
    
    const otherEmails = allEmails.filter((email: any) => {
      const subject = (email.subject || '').toLowerCase();
      const body = (email.body || '').toLowerCase();
      const permitName = (email.permitName || '').toLowerCase().trim();
      
      // Check if email is NOT permit-related
      const hasPermitInSubject = subject.includes('permit');
      const hasPermitInBody = body.includes('permit');
      const hasPermitInName = permitName.includes('permit');
      const hasPermitId = !!email.permitId;
      const hasClientId = !!email.clientId;
      
      return !(hasPermitInSubject || hasPermitInBody || hasPermitInName || hasPermitId || hasClientId);
    });
    
    // Sort each group by most recent, then combine (permit-related first, others below)
    permitRelatedEmails.sort((a: any, b: any) => 
      new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
    );
    otherEmails.sort((a: any, b: any) => 
      new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
    );
    
    // Always prioritize permit-related and client emails
    // Apply limit: take as many permit-related emails as possible, then fill remaining slots with other emails
    const permitEmailsCount = Math.min(permitRelatedEmails.length, limit);
    const otherEmailsCount = Math.max(0, limit - permitEmailsCount);
    const emails = [
      ...permitRelatedEmails.slice(0, permitEmailsCount),
      ...otherEmails.slice(0, otherEmailsCount)
    ];

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

    // Get unread count for ALL emails (no filtering)
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
