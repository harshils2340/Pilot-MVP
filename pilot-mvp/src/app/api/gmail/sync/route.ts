import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/app/lib/mongodb';
import { PermitEmail } from '@/app/lib/emails/schema';
import mongoose from 'mongoose';
import { google } from 'googleapis';
import ClientModel from '@/app/models/client';

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
async function getGmailClient(userId: string) {
  await connectToDB();
  
  const tokenDoc = await GmailToken.findOne({ userId });
  
  if (!tokenDoc) {
    throw new Error(`Gmail not connected for user: ${userId}`);
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
    return Buffer.from(body.data, 'base64').toString('utf-8');
  }
  
  if (body.attachmentId) {
    return '[Attachment - needs separate fetch]';
  }
  
  return '';
}

// POST: Auto-sync emails from specific senders (for cron/webhook)
// If userId is provided, sync only that user. Otherwise, sync from ALL Gmail tokens in database
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const requestedUserId = body.userId; // Optional: if provided, sync only this user
    const allowedSenders: string[] = body.allowedSenders || []; // Array of sender emails to monitor (empty = all senders)
    const maxResults = body.maxResults || 50; // Search only latest 50 emails per Gmail account

    await connectToDB();
    
    // Get all registered clients from the database (needed for filtering)
    const registeredClients = await ClientModel.find().lean();
    const registeredClientIds = new Set(registeredClients.map((c: any) => c._id.toString()));
    console.log(`📋 Found ${registeredClientIds.size} registered clients`);
    
    // Get all Gmail tokens from database
    const allTokens = requestedUserId 
      ? await GmailToken.find({ userId: requestedUserId }).lean()
      : await GmailToken.find().lean();
    
    if (allTokens.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No Gmail tokens found',
        ingested: 0,
        emails: [],
        syncedAccounts: [],
      });
    }
    
    console.log(`📧 Syncing emails from ${allTokens.length} Gmail account(s): ${allTokens.map((t: any) => t.userId).join(', ')}`);
    
    const allIngestedEmails: any[] = [];
    const syncedAccounts: string[] = [];
    
    // Process each Gmail token
    for (const tokenDoc of allTokens) {
      const currentUserId = tokenDoc.userId;
      console.log(`\n🔄 Processing Gmail account: ${currentUserId}`);
      
      try {
        const gmail = await getGmailClient(currentUserId);

    // Build query - sync ALL incoming unread emails from everyone (not just from the account owner)
    // Query "is:unread" gets all unread emails in inbox regardless of sender
    // We want emails from everyone who sends to this Gmail account
    let gmailQuery = 'is:unread';
    
    // Note: We're not filtering by sender here - we want ALL incoming emails
    // Only filter by allowedSenders if explicitly provided (for testing)
    if (allowedSenders.length > 0) {
      const senderQuery = allowedSenders.map((s: string) => `from:${s}`).join(' OR ');
      gmailQuery = `is:unread (${senderQuery})`;
    }
    
    console.log(`📧 Gmail sync query: ${gmailQuery}`);
    console.log(`📧 Syncing ALL incoming unread emails from everyone (will filter for: registered clients OR permit keywords)`);

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
          continue; // Skip if already exists
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

        const subject = headers.subject || '(No Subject)';
        const fromEmail = headers.from?.match(/<(.+)>/)?.[1] || headers.from || '';
        const fromName = headers.from?.replace(/<.+>/, '').trim() || '';

        // Verify sender is in allowed list (if allowedSenders is specified)
        if (allowedSenders.length > 0 && !allowedSenders.some((sender: string) => fromEmail.includes(sender))) {
          continue;
        }

        // Determine if email is from a client (not from city/authority)
        const fromEmailLower = fromEmail.toLowerCase();
        const isCityEmail = fromEmailLower.includes('@gov') ||
                            fromEmailLower.includes('@city') ||
                            fromEmailLower.includes('@department') ||
                            fromEmailLower.includes('department') ||
                            fromEmailLower.includes('@mailgun.org') ||
                            fromEmailLower.includes('noreply') ||
                            fromEmailLower.includes('no-reply');
        
        // Extract client name if not from city/authority
        let clientName: string | undefined = undefined;
        let matchedClientId: string | undefined = undefined;
        
        if (!isCityEmail) {
          clientName = fromName || fromEmail.split('@')[0];
          
          // Try to match email to a registered client by business name
          // Check if clientName or fromEmail matches a client's businessName
          const matchingClient = registeredClients.find((client: any) => {
            const businessNameLower = (client.businessName || '').toLowerCase();
            const clientNameLower = (clientName || '').toLowerCase();
            const fromEmailPrefix = fromEmail.split('@')[0].toLowerCase();
            
            // Match if business name contains client name or vice versa, or if email prefix matches
            return businessNameLower.includes(clientNameLower) || 
                   clientNameLower.includes(businessNameLower) ||
                   businessNameLower.includes(fromEmailPrefix) ||
                   fromEmailPrefix.includes(businessNameLower);
          });
          
          if (matchingClient) {
            matchedClientId = matchingClient._id.toString();
            console.log(`✅ Matched email to client: ${fromEmail} -> ${matchingClient.businessName} (${matchedClientId})`);
          }
        }

        // Filter: Save emails that are either:
        // 1. From a registered client (matchedClientId exists), OR
        // 2. Contains permit-related keywords (permits, licensing, licencing)
        const requiredKeywords = ['permits', 'licensing', 'licencing'];
        const subjectLower = subject.toLowerCase();
        const bodyLower = emailBody.toLowerCase();
        
        const hasRequiredKeyword = requiredKeywords.some(keyword => 
          subjectLower.includes(keyword.toLowerCase()) || bodyLower.includes(keyword.toLowerCase())
        );

        // Only save emails from registered clients OR with permit keywords
        if (!matchedClientId && !hasRequiredKeyword) {
          console.log(`⏭️ Skipping email (not from registered client and no permit keywords): ${fromEmail} - Subject: "${subject}"`);
          continue;
        }

        // Extract permit name from subject
        const permitNameMatch = subject.match(/(permit|license|application|renewal)/i);
        const permitName = permitNameMatch ? subject : 'Email from Authority';

        // Try to save email record, handle duplicate key errors gracefully
        try {
          const emailRecord = new PermitEmail({
            gmailId: message.id,
            threadId: msg.threadId,
            permitId: null,
            permitName,
            clientId: matchedClientId || null,
            clientName: clientName || undefined,
            subject,
            from: {
              email: fromEmail,
              name: fromName,
            },
            to: {
              email: headers.to || '',
              name: '',
            },
            body: emailBody.substring(0, 50000),
            htmlBody: emailBody,
            direction: 'inbound',
            status: 'unread',
            priority: 'high',
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
          
          console.log(`✅ Email saved immediately: ${subject} from ${fromEmail} (${matchedClientId ? 'matched to client' : hasRequiredKeyword ? 'has permit keywords' : 'unknown'})`);

          // Mark as read in Gmail after successful save
          // This prevents re-syncing the same email
          try {
            await gmail.users.messages.modify({
              userId: 'me',
              id: message.id,
              requestBody: {
                removeLabelIds: ['UNREAD'],
              },
            });
          } catch (markReadError: any) {
            // Non-critical error - continue even if marking as read fails
            console.warn(`⚠️ Failed to mark email as read: ${message.id}`, markReadError.message);
          }
        } catch (saveError: any) {
          // Handle duplicate key errors gracefully
          if (saveError.code === 11000 || saveError.message?.includes('duplicate key')) {
            console.log(`⚠️ Email already exists (duplicate key): ${message.id}`);
            continue; // Skip this email as it already exists
          }
          // Re-throw other errors
          throw saveError;
        }
        } catch (emailError: any) {
          console.error(`Error processing email ${message.id} for ${currentUserId}:`, emailError);
        }
      }

        // Add emails from this account to the overall list
        allIngestedEmails.push(...ingestedEmails);
        syncedAccounts.push(currentUserId);
        console.log(`✅ Synced ${ingestedEmails.length} emails from ${currentUserId}`);
        
      } catch (accountError: any) {
        console.error(`❌ Error syncing Gmail account ${currentUserId}:`, accountError.message);
        // Continue with next account even if one fails
      }
    }

    return NextResponse.json({
      success: true,
      ingested: allIngestedEmails.length,
      emails: allIngestedEmails,
      syncedAccounts,
      totalAccounts: allTokens.length,
      query: 'is:unread (all accounts)',
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

