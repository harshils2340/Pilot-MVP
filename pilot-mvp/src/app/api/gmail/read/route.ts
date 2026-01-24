import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/app/lib/mongodb';
import mongoose from 'mongoose';
import { PermitEmail } from '@/app/lib/emails/schema';

// Schema for storing OAuth tokens
const GmailTokenSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  accessToken: { type: String, required: true },
  refreshToken: { type: String, required: true },
  tokenType: { type: String, default: 'Bearer' },
  expiryDate: { type: Date },
  scope: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const GmailToken = mongoose.models.GmailToken || mongoose.model('GmailToken', GmailTokenSchema);

// Helper to get authenticated Gmail client
async function getGmailClient(userId?: string) {
  await connectToDB();
  
  // Use provided userId or default
  const targetUserId = userId || 'default-user';
  const tokenDoc = await GmailToken.findOne({ userId: targetUserId });
  
  if (!tokenDoc) {
    throw new Error('Gmail not connected. Please authenticate first.');
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'https://pilot-mvp.vercel.app/api/auth/google/callback';

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );

  oauth2Client.setCredentials({
    access_token: tokenDoc.accessToken,
    refresh_token: tokenDoc.refreshToken,
    expiry_date: tokenDoc.expiryDate?.getTime(),
  });

  // Refresh token if expired
  if (tokenDoc.expiryDate && tokenDoc.expiryDate <= new Date()) {
    const { credentials } = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(credentials);
    
    // Update stored tokens
    await GmailToken.findOneAndUpdate(
      { userId },
      {
        accessToken: credentials.access_token,
        refreshToken: credentials.refresh_token || tokenDoc.refreshToken,
        expiryDate: credentials.expiry_date ? new Date(credentials.expiry_date) : undefined,
        updatedAt: new Date(),
      }
    );
  }

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

// Parse email headers
function parseEmailHeaders(headers: any[]) {
  const parsed: any = {};
  headers.forEach((header: any) => {
    parsed[header.name.toLowerCase()] = header.value;
  });
  return parsed;
}

// Decode email body
function decodeEmailBody(body: any): string {
  if (!body) return '';
  
  if (body.data) {
    // Base64 decode
    return Buffer.from(body.data, 'base64').toString('utf-8');
  }
  
  if (body.attachmentId) {
    // This is an attachment reference, would need separate API call
    return '[Attachment - needs separate fetch]';
  }
  
  return '';
}

// GET: Read emails from Gmail
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const maxResults = parseInt(searchParams.get('maxResults') || '10');
    const query = searchParams.get('query') || 'is:unread'; // Default to unread emails
    const userId = searchParams.get('userId') || undefined; // Optional: filter by user
    const fromSender = searchParams.get('from'); // Optional: filter by sender email

    // Build Gmail query
    let gmailQuery = query;
    if (fromSender) {
      gmailQuery = `${query} from:${fromSender}`;
    }

    const gmail = await getGmailClient(userId);

    // List messages
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: gmailQuery,
      maxResults,
    });

    const messages = response.data.messages || [];
    const emailDetails = [];

    // Fetch full details for each message
    for (const message of messages) {
      if (!message.id) continue;

      const messageData = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'full',
      });

      const msg = messageData.data;
      const headers = parseEmailHeaders(msg.payload?.headers || []);
      const body = msg.payload?.body?.data 
        ? decodeEmailBody(msg.payload.body)
        : msg.payload?.parts?.map((part: any) => decodeEmailBody(part.body)).join('\n\n') || '';

      const email = {
        gmailId: msg.id,
        threadId: msg.threadId,
        snippet: msg.snippet,
        subject: headers.subject || '(No Subject)',
        from: headers.from || 'Unknown',
        to: headers.to || '',
        date: headers.date ? new Date(headers.date) : new Date(),
        body: body.substring(0, 10000), // Limit body size
        labels: msg.labelIds || [],
        isUnread: msg.labelIds?.includes('UNREAD') || false,
      };

      emailDetails.push(email);
    }

    return NextResponse.json({
      success: true,
      emails: emailDetails,
      count: emailDetails.length,
    });
  } catch (error: any) {
    console.error('Error reading Gmail:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to read emails',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// POST: Sync emails and ingest into Pilot database
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const maxResults = body.maxResults || 50;
    const query = body.query || 'is:unread';
    const userId = body.userId || undefined; // Optional: filter by user
    const fromSender = body.from; // Optional: filter by sender email
    const allowedSenders: string[] = body.allowedSenders || []; // Array of allowed sender emails

    await connectToDB();
    const gmail = await getGmailClient(userId);
    
    // Build Gmail query
    let gmailQuery = query;
    if (fromSender) {
      gmailQuery = `${query} from:${fromSender}`;
    } else if (allowedSenders.length > 0) {
      // Build query for multiple senders: from:(sender1 OR sender2 OR sender3)
      const senderQuery = allowedSenders.map((s: string) => `from:${s}`).join(' OR ');
      gmailQuery = `${query} (${senderQuery})`;
    }

    // List messages
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: gmailQuery,
      maxResults,
    });

    const messages = response.data.messages || [];
    const ingestedEmails = [];

    // Process each email
    for (const message of messages) {
      if (!message.id) continue;

      try {
        // Check if email already exists
        const existing = await PermitEmail.findOne({ gmailId: message.id });
        if (existing) {
          console.log(`⏭️ Email ${message.id} already ingested, skipping`);
          continue;
        }

        // Fetch full message
        const messageData = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full',
        });

        const msg = messageData.data;
        const headers = parseEmailHeaders(msg.payload?.headers || []);
        const emailBody = msg.payload?.body?.data 
          ? decodeEmailBody(msg.payload.body)
          : msg.payload?.parts?.map((part: any) => decodeEmailBody(part.body)).join('\n\n') || '';

        // Extract permit/client info from email (basic parsing)
        const subject = headers.subject || '(No Subject)';
        const fromEmail = headers.from?.match(/<(.+)>/)?.[1] || headers.from || '';
        const fromName = headers.from?.replace(/<.+>/, '').trim() || '';

        // Filter by allowed senders if specified
        if (allowedSenders.length > 0 && !allowedSenders.some((sender: string) => fromEmail.includes(sender))) {
          console.log(`⏭️ Email from ${fromEmail} not in allowed senders list, skipping`);
          continue;
        }

        // Try to extract permit name from subject or body
        const permitNameMatch = subject.match(/(permit|license|application|renewal)/i);
        const permitName = permitNameMatch ? subject : 'Email from Authority';

        // Create email record
        const emailRecord = new PermitEmail({
          gmailId: message.id,
          threadId: msg.threadId,
          permitId: null, // Will be matched later
          permitName,
          clientId: null, // Will be matched later
          clientName: fromName || fromEmail,
          subject,
          from: {
            email: fromEmail,
            name: fromName,
          },
          to: {
            email: headers.to || '',
            name: '',
          },
          body: emailBody.substring(0, 50000), // Limit size
          htmlBody: emailBody,
          direction: 'inbound',
          status: 'unread',
          priority: 'medium',
          receivedAt: headers.date ? new Date(headers.date) : new Date(),
          metadata: {
            messageId: headers['message-id'] || message.id,
            headers: headers,
            labels: msg.labelIds || [],
            snippet: msg.snippet,
          },
        });

        await emailRecord.save();
        ingestedEmails.push(emailRecord.toObject());

        // Mark as read in Gmail (optional)
        if (body.markAsRead !== false) {
          await gmail.users.messages.modify({
            userId: 'me',
            id: message.id,
            requestBody: {
              removeLabelIds: ['UNREAD'],
            },
          });
        }
      } catch (emailError: any) {
        console.error(`Error processing email ${message.id}:`, emailError);
        // Continue with next email
      }
    }

    return NextResponse.json({
      success: true,
      ingested: ingestedEmails.length,
      emails: ingestedEmails,
    });
  } catch (error: any) {
    console.error('Error syncing Gmail:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to sync emails',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
