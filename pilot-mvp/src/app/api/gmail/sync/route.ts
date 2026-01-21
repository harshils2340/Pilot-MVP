import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/app/lib/mongodb';
import { PermitEmail } from '@/app/lib/emails/schema';
import mongoose from 'mongoose';
import { google } from 'googleapis';
import ClientModel from '@/app/models/client';
import { PermitManagement } from '@/app/lib/permits/managementSchema';
import { CityFeedback } from '@/app/lib/cityFeedback/schema';

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
// Helper function to extract client information from email
function extractClientInfo(
  fromName: string,
  fromEmail: string,
  subject: string,
  emailBody: string
): { businessName: string; jurisdiction: string } {
  // Extract business name from sender name or email prefix
  let businessName = fromName.trim();
  
  // If sender name is empty or looks like a personal name, use email prefix
  if (!businessName || businessName.split(' ').length <= 2) {
    const emailPrefix = fromEmail.split('@')[0];
    // Remove common prefixes and clean up
    businessName = emailPrefix
      .replace(/[._-]/g, ' ')
      .replace(/\b(contact|info|hello|support|admin|team)\b/gi, '')
      .trim();
    
    // Capitalize first letter of each word
    businessName = businessName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .trim();
  }
  
  // If still empty or too short, use email domain as fallback
  if (!businessName || businessName.length < 2) {
    const domain = fromEmail.split('@')[1]?.split('.')[0] || 'Unknown';
    businessName = domain.charAt(0).toUpperCase() + domain.slice(1).toLowerCase();
  }
  
  // Extract jurisdiction from email body
  // Look for patterns like: "San Francisco, CA", "Toronto, ON", "New York", etc.
  let jurisdiction = 'Unknown';
  
  const combinedText = `${subject} ${emailBody}`;
  
  // Pattern 1: City, State (US format): "San Francisco, CA", "New York, NY"
  const cityStatePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})\b/;
  const cityStateMatch = combinedText.match(cityStatePattern);
  if (cityStateMatch) {
    jurisdiction = cityStateMatch[0].trim();
  } else {
    // Pattern 2: City, Province (Canadian format): "Toronto, ON", "Vancouver, BC"
    const cityProvincePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2,3})\b/;
    const cityProvinceMatch = combinedText.match(cityProvincePattern);
    if (cityProvinceMatch) {
      jurisdiction = cityProvinceMatch[0].trim();
    } else {
      // Pattern 3: Look for common city names with "in", "from", "at" keywords
      // e.g., "in Toronto", "from San Francisco", "at New York"
      const locationKeywords = /\b(in|from|at|located in|based in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i;
      const locationMatch = combinedText.match(locationKeywords);
      if (locationMatch && locationMatch[2]) {
        jurisdiction = locationMatch[2].trim() + ', Unknown';
      }
    }
  }
  
  // Fallback: Try to extract from email domain
  if (jurisdiction === 'Unknown') {
    const domain = fromEmail.split('@')[1]?.toLowerCase() || '';
    
    // If domain is a .gov domain, try to extract city name
    // For example: info@sanfrancisco.gov -> San Francisco, CA
    if (domain.includes('.gov')) {
      const domainParts = domain.split('.');
      if (domainParts.length >= 2) {
        const possibleCity = domainParts[domainParts.length - 3] || '';
        if (possibleCity && possibleCity.length > 2) {
          jurisdiction = possibleCity
            .split('-')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ') + ', Unknown';
        }
      }
    } else if (!domain.match(/^(gmail|yahoo|outlook|hotmail|icloud|protonmail|zoho)\.com$/i)) {
      // If domain is a custom domain (not common email providers), use domain name as jurisdiction hint
      // Extract the main domain part
      const domainName = domain.split('.')[0];
      if (domainName && domainName.length > 2) {
        jurisdiction = domainName
          .replace(/[._-]/g, ' ')
          .split(' ')
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ') + ', Unknown';
      }
    }
  }
  
  return { businessName, jurisdiction };
}

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

        // AUTO-CREATE CLIENT: If email has permit keywords and is from a potential client (not city/authority, not promotional)
        // but no matching client exists, automatically create a new client
        if (!matchedClientId && hasRequiredKeyword && !isCityEmail && !isPromotionalEmail) {
          try {
            // Extract client information from email
            const clientInfo = extractClientInfo(fromName, fromEmail, subject, emailBody);
            
            console.log(`📋 Attempting to auto-create client from email:`, {
              businessName: clientInfo.businessName,
              jurisdiction: clientInfo.jurisdiction,
              fromEmail
            });
            
            // Check if client with this name and jurisdiction already exists (avoid duplicates)
            const existingClient = await ClientModel.findOne({
              businessName: { $regex: new RegExp(clientInfo.businessName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
              jurisdiction: { $regex: new RegExp(clientInfo.jurisdiction.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
            }).lean();
            
            if (existingClient) {
              // Use existing client instead of creating duplicate
              matchedClientId = existingClient._id.toString();
              clientName = clientInfo.businessName;
              console.log(`✅ Found existing client instead of creating: ${clientInfo.businessName} (${matchedClientId})`);
            } else {
              // Create new client
              const newClient = await ClientModel.create({
                businessName: clientInfo.businessName,
                jurisdiction: clientInfo.jurisdiction,
                activePermits: 0,
                status: 'new',
                completionRate: 0,
                lastActivity: new Date(),
              });
              
              matchedClientId = newClient._id.toString();
              clientName = clientInfo.businessName;
              
              console.log(`✅ Auto-created new client from email: ${clientInfo.businessName} in ${clientInfo.jurisdiction} (${matchedClientId})`);
              
              // Refresh registered clients list to include the new client
              registeredClients.push(newClient.toObject());
            }
          } catch (createError: any) {
            console.error(`❌ Failed to auto-create client from email ${fromEmail}:`, createError.message);
            // Continue processing email even if client creation fails
            // The email will still be saved without client association
          }
        }

        // If email is from a matched client, try to match it to a specific permit
        let matchedPermitId: string | undefined = undefined;
        let matchedPermitName: string | undefined = undefined;
        let matchedPermitManagementId: string | undefined = undefined; // Store PermitManagement _id for reference
        
        if (matchedClientId) {
          // Fetch all permits associated with this client
          const clientPermits = await PermitManagement.find({ clientId: matchedClientId }).lean();
          console.log(`🔍 Checking ${clientPermits.length} permits for client ${matchedClientId}`);
          
          // Try to match email subject/body to permit names
          const subjectLower = subject.toLowerCase();
          const bodyLower = emailBody.toLowerCase();
          const combinedText = `${subjectLower} ${bodyLower}`;
          
          // Improved matching: score each permit and pick the best match
          let bestMatch: { permit: any; score: number; permitId: string; managementId: string } | null = null;
          
          for (const permit of clientPermits) {
            const permitNameLower = (permit.name || '').toLowerCase();
            let matchScore = 0;
            
            // Score 1: Exact permit name match in subject (highest priority)
            if (subjectLower.includes(permitNameLower) && permitNameLower.length > 5) {
              matchScore += 100;
            }
            
            // Score 2: Permit name in body
            if (bodyLower.includes(permitNameLower) && permitNameLower.length > 5) {
              matchScore += 50;
            }
            
            // Score 3: Significant words from permit name (3+ characters)
            const permitNameWords = permitNameLower.split(/\s+/).filter(w => w.length >= 3);
            const matchingWords = permitNameWords.filter(word => 
              combinedText.includes(word)
            );
            if (matchingWords.length > 0) {
              // Score based on percentage of words matched
              matchScore += (matchingWords.length / permitNameWords.length) * 30;
            }
            
            // Score 4: Authority name match (e.g., "Health Department", "Fire Department")
            if (permit.authority) {
              const authorityLower = permit.authority.toLowerCase();
              if (combinedText.includes(authorityLower)) {
                matchScore += 20;
              }
            }
            
            // Score 5: Category match (e.g., "Health", "Fire", "Building")
            if (permit.category) {
              const categoryLower = permit.category.toLowerCase();
              if (combinedText.includes(categoryLower)) {
                matchScore += 10;
              }
            }
            
            // Use PermitManagement _id as the permitId for City Feedback (this links to the client's specific permit instance)
            // But also store the master permitId if available
            const permitManagementId = permit._id.toString();
            const masterPermitId = permit.permitId || permitManagementId;
            
            if (matchScore > 0 && (!bestMatch || matchScore > bestMatch.score)) {
              bestMatch = {
                permit,
                score: matchScore,
                permitId: masterPermitId, // Use master permitId for linking
                managementId: permitManagementId // Store management ID for reference
              };
            }
          }
          
          // If we found a good match (score > 30), use it
          if (bestMatch && bestMatch.score >= 30) {
            matchedPermitId = bestMatch.permitId;
            matchedPermitManagementId = bestMatch.managementId;
            matchedPermitName = bestMatch.permit.name;
            console.log(`✅ Matched email to permit: "${subject}" -> "${bestMatch.permit.name}" (score: ${bestMatch.score.toFixed(1)}, permitId: ${matchedPermitId})`);
          } else if (bestMatch) {
            console.log(`⚠️ Weak permit match found but score too low (${bestMatch.score.toFixed(1)}): "${subject}" -> "${bestMatch.permit.name}"`);
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

          // CREATE CITY FEEDBACK ITEM: If email is from a client, create a City Feedback item
          // Only create if not already synced (check by emailId)
          if (matchedClientId && !isCityEmail) {
            try {
              // Check if City Feedback already exists for this email (prevent duplicates)
              const existingFeedback = await CityFeedback.findOne({ 
                emailId: emailRecord._id.toString() 
              }).lean();
              
              if (existingFeedback) {
                console.log(`⏭️ City Feedback already exists for email ${emailRecord._id}, skipping creation`);
              } else {
                const emailDate = headers.date ? new Date(headers.date) : new Date();
                const formattedTime = emailDate.toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit',
                  hour12: true 
                });

                // Extract attachments from email metadata if available
                const emailAttachments = emailRecord.attachments?.map((att: any) => ({
                  name: att.filename || 'attachment',
                  size: att.size ? `${(att.size / 1024).toFixed(1)} KB` : 'Unknown',
                  type: att.contentType || 'application/octet-stream'
                })) || [];

                // Determine feedback type based on email content
                let feedbackType: 'revision_required' | 'comment' | 'question' | 'client_message' = 'client_message';
                const subjectLower = subject.toLowerCase();
                const bodyLower = emailBody.toLowerCase();
                
                if (subjectLower.includes('revision') || subjectLower.includes('revise') || bodyLower.includes('revision required')) {
                  feedbackType = 'revision_required';
                } else if (subjectLower.includes('question') || bodyLower.includes('?') || bodyLower.includes('question')) {
                  feedbackType = 'question';
                } else if (subjectLower.includes('comment') || bodyLower.includes('comment')) {
                  feedbackType = 'comment';
                }

                // Extract required documents from email body (look for patterns like "please provide", "need", etc.)
                const requiredDocs: string[] = [];
                const requiredPatterns = [
                  /please provide[:\s]+([^\.]+)/gi,
                  /need[:\s]+([^\.]+)/gi,
                  /required[:\s]+([^\.]+)/gi,
                  /must include[:\s]+([^\.]+)/gi,
                ];
                
                for (const pattern of requiredPatterns) {
                  const matches = emailBody.matchAll(pattern);
                  for (const match of matches) {
                    if (match[1]) {
                      const doc = match[1].trim();
                      if (doc.length > 5 && doc.length < 200) {
                        requiredDocs.push(doc);
                      }
                    }
                  }
                }

                // Use matchedPermitManagementId if available (this is the PermitManagement _id that links to the client's permit)
                // Otherwise use matchedPermitId (master permit ID)
                // This ensures the City Feedback is linked to the correct permit instance for this client
                const feedbackPermitId = matchedPermitManagementId || matchedPermitId || undefined;

                // Create City Feedback item
                const cityFeedbackItem = new CityFeedback({
                  clientId: matchedClientId,
                  permitId: feedbackPermitId, // Use the permit ID that matches the client's permit instance
                  emailId: emailRecord._id.toString(),
                  type: feedbackType,
                  author: fromName || fromEmail.split('@')[0],
                  department: isCityEmail ? 'City Department' : undefined,
                  subject: subject,
                  comment: emailBody.substring(0, 10000), // Limit comment length
                  attachments: emailAttachments,
                  status: 'not_started',
                  requiredDocuments: requiredDocs.length > 0 ? requiredDocs : undefined,
                  date: emailDate,
                  time: formattedTime
                });

                await cityFeedbackItem.save();
                
                console.log(`✅ City Feedback item created for client ${matchedClientId}${feedbackPermitId ? ` and permit ${feedbackPermitId}` : ''}: "${subject}" (${cityFeedbackItem._id})`);
              }
            } catch (feedbackError: any) {
              // Non-critical error - log but continue
              console.warn(`⚠️ Failed to create City Feedback item for email ${emailRecord._id}:`, feedbackError.message);
            }
          }

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

