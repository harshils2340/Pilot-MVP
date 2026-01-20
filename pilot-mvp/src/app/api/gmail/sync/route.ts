import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/app/lib/mongodb';
import { PermitEmail } from '@/app/lib/emails/schema';
import mongoose from 'mongoose';
import { google } from 'googleapis';
import ClientModel from '@/app/models/client';
import { PermitManagement } from '@/app/lib/permits/managementSchema';

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
    const maxResults = body.maxResults || 25; // Search only latest 25 emails per Gmail account for faster results

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
    const MAX_TOTAL_EMAILS_TO_SEARCH = 25; // Cap: Only search through 25 emails total across all accounts
    let totalEmailsSearched = 0; // Track total emails searched (not just saved)
    
    // Process each Gmail token
    for (const tokenDoc of allTokens) {
      // Stop if we've already searched through 25 emails total
      if (totalEmailsSearched >= MAX_TOTAL_EMAILS_TO_SEARCH) {
        console.log(`✅ Reached 25 email search cap. Stopping search across all accounts.`);
        break;
      }
      
      const currentUserId = tokenDoc.userId;
      console.log(`\n🔄 Processing Gmail account: ${currentUserId}`);
      
      try {
        const gmail = await getGmailClient(currentUserId);

    // Build query - sync only unread emails from Primary inbox (exclude Updates and Promotions)
    // Query excludes category:promotions and category:updates to only get Primary inbox emails
    // We want emails from everyone who sends to this Gmail account, but only from Primary inbox
    let gmailQuery = 'is:unread -category:promotions -category:updates';
    
    // Note: We're not filtering by sender here - we want ALL incoming emails from Primary inbox
    // Only filter by allowedSenders if explicitly provided (for testing)
    if (allowedSenders.length > 0) {
      const senderQuery = allowedSenders.map((s: string) => `from:${s}`).join(' OR ');
      gmailQuery = `is:unread -category:promotions -category:updates (${senderQuery})`;
    }
    
    // Calculate how many emails we can still search for this account
    const remainingQuota = MAX_TOTAL_EMAILS_TO_SEARCH - totalEmailsSearched;
    const emailsToFetch = Math.min(maxResults, remainingQuota);
    
    console.log(`📧 Gmail sync query: ${gmailQuery}`);
    console.log(`📧 Syncing only Primary inbox emails (excluding Updates and Promotions)`);
    console.log(`📧 Searching ${emailsToFetch} emails from this account (${totalEmailsSearched}/${MAX_TOTAL_EMAILS_TO_SEARCH} already searched)`);

    // List messages - limit to remaining quota
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: gmailQuery,
      maxResults: emailsToFetch, // Use calculated limit, not original maxResults
    });

    const messages = response.data.messages || [];
    const ingestedEmails = [];

    // Process each email - stop once we've searched through 25 emails total
    for (const message of messages) {
      // Stop if we've already searched through 25 emails total across all accounts
      if (totalEmailsSearched >= MAX_TOTAL_EMAILS_TO_SEARCH) {
        console.log(`✅ Reached 25 email search cap. Stopping search.`);
        break;
      }

      if (!message.id) continue;
      
      // Increment search counter - we're searching this email
      totalEmailsSearched++;

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
        
        // Double-check: Skip if email is in Promotions or Updates category (safety check)
        // Even though the query excludes these, we verify with labels to be sure
        const labelIds = msg.labelIds || [];
        if (labelIds.includes('CATEGORY_PROMOTIONS') || labelIds.includes('CATEGORY_UPDATES')) {
          console.log(`⏭️ Skipping email (not in Primary inbox): ${message.id}`);
          continue;
        }
        
        const emailBody = msg.payload?.body?.data 
          ? decodeEmailBody(msg.payload.body)
          : msg.payload?.parts?.map((part: any) => decodeEmailBody(part.body)).join('\n\n') || '';

        const subject = headers.subject || '(No Subject)';
        const fromEmail = headers.from?.match(/<(.+)>/)?.[1] || headers.from || '';
        const fromName = headers.from?.replace(/<.+>/, '').trim() || '';

        // Exclude promotional/marketing email domains
        const excludedDomains = [
          'expedia.com',
          'expedia.ca',
          'booking.com',
          'airbnb.com',
          'amazon.com',
          'ebay.com',
          'paypal.com',
          'facebook.com',
          'instagram.com',
          'twitter.com',
          'linkedin.com',
          'pinterest.com',
          'groupon.com',
          'coupons.com',
          'retailmenot.com',
          'shopify.com',
          'etsy.com',
          'netflix.com',
          'spotify.com',
          'applemusic.com',
          'uber.com',
          'lyft.com',
          'doordash.com',
          'ubereats.com',
        ];
        
        const fromEmailLower = fromEmail.toLowerCase();
        const isPromotionalEmail = excludedDomains.some(domain => fromEmailLower.includes(`@${domain}`) || fromEmailLower.endsWith(domain));
        
        if (isPromotionalEmail) {
          console.log(`⏭️ Skipping promotional email: ${fromEmail} - Subject: "${subject}"`);
          continue;
        }

        // Verify sender is in allowed list (if allowedSenders is specified)
        if (allowedSenders.length > 0 && !allowedSenders.some((sender: string) => fromEmail.includes(sender))) {
          continue;
        }

        // Determine if email is from a client (not from city/authority)
        // Note: fromEmailLower is already defined above, but re-assign it here for clarity
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
        // 2. Contains permit-related keywords (permit, permits, licensing, licencing)
        const requiredKeywords = ['permit', 'permits', 'licensing', 'licencing'];
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

        // If email is from a matched client, try to match it to a specific permit
        let matchedPermitId: string | undefined = undefined;
        let matchedPermitName: string | undefined = undefined;
        
        if (matchedClientId) {
          // Fetch all permits associated with this client
          const clientPermits = await PermitManagement.find({ clientId: matchedClientId }).lean();
          console.log(`🔍 Checking ${clientPermits.length} permits for client ${matchedClientId}`);
          
          // Try to match email subject/body to permit names
          const subjectLower = subject.toLowerCase();
          const bodyLower = emailBody.toLowerCase();
          const combinedText = `${subjectLower} ${bodyLower}`;
          
          for (const permit of clientPermits) {
            const permitNameLower = (permit.name || '').toLowerCase();
            
            // Check if permit name appears in subject or body
            // Use word boundaries to avoid false matches (e.g., "license" matching "licensing")
            const permitNameWords = permitNameLower.split(/\s+/).filter(w => w.length > 3); // Only significant words
            const hasMatch = permitNameWords.length > 0 && permitNameWords.some(word => 
              combinedText.includes(word)
            );
            
            // Also check if permit name is a direct substring match (for exact matches)
            const hasDirectMatch = permitNameLower.length > 5 && combinedText.includes(permitNameLower);
            
            if (hasMatch || hasDirectMatch) {
              matchedPermitId = permit.permitId || permit._id.toString();
              matchedPermitName = permit.name;
              console.log(`✅ Matched email to permit: "${subject}" -> "${permit.name}" (${matchedPermitId})`);
              break; // Use first match found
            }
          }
        }

        // Extract permit name from subject if no permit was matched
        let permitName = matchedPermitName || 'Email from Authority';
        if (!matchedPermitName) {
          const permitNameMatch = subject.match(/(permit|license|application|renewal)/i);
          permitName = permitNameMatch ? subject : 'Email from Authority';
        }

        // Try to save email record, handle duplicate key errors gracefully
        try {
          const emailRecord = new PermitEmail({
            gmailId: message.id,
            threadId: msg.threadId,
            permitId: matchedPermitId || null,
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
          
          const matchInfo = matchedClientId 
            ? (matchedPermitId ? `matched to client + permit` : `matched to client`)
            : (hasRequiredKeyword ? `has permit keywords` : `unknown`);
          
          console.log(`✅ Email saved immediately: ${subject} from ${fromEmail} (${matchInfo}${matchedPermitId ? ` - Permit: ${matchedPermitName}` : ''})`);

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
        console.log(`✅ Synced ${ingestedEmails.length} emails from ${currentUserId} (searched ${totalEmailsSearched} emails total)`);
        
        // Stop scanning if we've searched through 25 emails total across all accounts
        if (totalEmailsSearched >= MAX_TOTAL_EMAILS_TO_SEARCH) {
          console.log(`✅ Reached 25 email search cap across all accounts. Stopping scan.`);
          break; // Exit the loop, don't process more accounts
        }
        
      } catch (accountError: any) {
        console.error(`❌ Error syncing Gmail account ${currentUserId}:`, accountError.message);
        // Continue with next account even if one fails
      }
    }

    console.log(`✅ Fetching done - Synced ${allIngestedEmails.length} emails total from ${syncedAccounts.length} account(s)`);
    
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

