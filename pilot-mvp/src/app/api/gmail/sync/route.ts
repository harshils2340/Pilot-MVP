import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/app/lib/mongodb';
import { PermitEmail } from '@/app/lib/emails/schema';
import mongoose from 'mongoose';
import { google } from 'googleapis';
import ClientModel from '@/app/models/client';
import { PermitManagement } from '@/app/lib/permits/managementSchema';
import { CityFeedback } from '@/app/lib/cityFeedback/schema';
import { Permit } from '@/app/lib/permits/schema';
import { ensureLeadForPermitEmail } from '@/app/lib/crm/ensureLeadForPermitEmail';

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

// Extract attachment metadata from Gmail message parts
function extractAttachments(payload: any, messageId: string): Array<{
  filename: string;
  contentType: string;
  size: number;
  attachmentId?: string;
  gmailMessageId: string;
}> {
  const attachments: Array<{
    filename: string;
    contentType: string;
    size: number;
    attachmentId?: string;
    gmailMessageId: string;
  }> = [];
  
  if (!payload) return attachments;
  
  const processPart = (part: any) => {
    // Check if this part is an attachment
    if (part.filename || part.body?.attachmentId) {
      const filename = part.filename || 'attachment';
      const contentType = part.mimeType || 'application/octet-stream';
      const size = part.body?.size || 0;
      const attachmentId = part.body?.attachmentId;
      
      // Only include actual attachments (not inline images in HTML)
      if (attachmentId || (filename && filename !== 'attachment')) {
        attachments.push({
          filename,
          contentType,
          size,
          attachmentId,
          gmailMessageId: messageId
        });
      }
    }
    
    // Recursively process nested parts
    if (part.parts && Array.isArray(part.parts)) {
      part.parts.forEach((nestedPart: any) => processPart(nestedPart));
    }
  };
  
  // Process main payload
  if (payload.parts && Array.isArray(payload.parts)) {
    payload.parts.forEach((part: any) => processPart(part));
  } else if (payload.filename || payload.body?.attachmentId) {
    // Single attachment
    processPart(payload);
  }
  
  return attachments;
}

// POST: Auto-sync emails from specific senders (for cron/webhook)
// If userId is provided, sync only that user. Otherwise, sync from ALL Gmail tokens in database
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const requestedUserId = body.userId; // Optional: if provided, sync only this user
    const allowedSenders: string[] = body.allowedSenders || []; // Array of sender emails to monitor (empty = all senders)
    // Note: We fetch 25 latest emails per Gmail account (MAX_EMAILS_PER_ACCOUNT)

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
    // Fetch 25 latest emails from EACH Gmail account (not a total cap)
    const MAX_EMAILS_PER_ACCOUNT = 25; // Cap: Fetch 25 latest emails per Gmail account
    
    // Process each Gmail token
    for (const tokenDoc of allTokens) {
      
      const currentUserId = tokenDoc.userId;
      console.log(`\n🔄 Processing Gmail account: ${currentUserId}`);
      
      try {
        const gmail = await getGmailClient(currentUserId);

        // Build query - fetch latest emails from Primary inbox (exclude Updates and Promotions)
        // Query excludes category:promotions and category:updates to only get Primary inbox emails
        // Fetch all emails (not just unread) to get the latest 25 emails per account
        // Gmail API returns messages in reverse chronological order (newest first) by default
        let gmailQuery = '-category:promotions -category:updates';
        
        // Note: We're not filtering by sender here - we want ALL incoming emails from Primary inbox
        // Only filter by allowedSenders if explicitly provided (for testing)
    if (allowedSenders.length > 0) {
      const senderQuery = allowedSenders.map((s: string) => `from:${s}`).join(' OR ');
          gmailQuery = `-category:promotions -category:updates (${senderQuery})`;
        }
        
        // Fetch 25 latest emails from this account
        const emailsToFetch = MAX_EMAILS_PER_ACCOUNT;
        
        console.log(`📧 Gmail sync query: ${gmailQuery}`);
        console.log(`📧 Syncing only Primary inbox emails (excluding Updates and Promotions)`);
        console.log(`📧 Fetching ${emailsToFetch} latest emails from this account`);

        // List messages - Gmail API returns messages in reverse chronological order (newest first) by default
        // This ensures we get the latest 25 emails from this account
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: gmailQuery,
          maxResults: emailsToFetch, // Fetch 25 latest emails per account
    });

    const messages = response.data.messages || [];
    const ingestedEmails = [];
        let emailsSavedForThisAccount = 0;

        // Process each email - Gmail API returns them in reverse chronological order (newest first)
        // Process up to 25 emails per account
    for (const message of messages) {
          // Stop if we've already saved 25 emails for this account
          if (emailsSavedForThisAccount >= MAX_EMAILS_PER_ACCOUNT) {
            console.log(`✅ Reached ${MAX_EMAILS_PER_ACCOUNT} email cap for this account. Moving to next account.`);
            break;
          }

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
            
            // Double-check: Skip if email is in Promotions or Updates category (safety check)
            // Even though the query excludes these, we verify with labels to be sure
            const labelIds = msg.labelIds || [];
            if (labelIds.includes('CATEGORY_PROMOTIONS') || labelIds.includes('CATEGORY_UPDATES')) {
              console.log(`⏭️ Skipping email (not in Primary inbox): ${message.id}`);
              continue;
            }
            
        // Extract attachments metadata
        const attachments = extractAttachments(msg.payload, message.id);
        
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
              // ALSO check if the email body/subject mentions the client's business name
              const emailTextForMatching = `${subject} ${emailBody}`.toLowerCase();
              
              const matchingClient = registeredClients.find((client: any) => {
                const businessNameLower = (client.businessName || '').toLowerCase().trim();
                const clientNameLower = (clientName || '').toLowerCase();
                const fromEmailPrefix = fromEmail.split('@')[0].toLowerCase();
                
                // Match if:
                // 1. Business name contains client name or vice versa
                // 2. Email prefix matches business name
                // 3. Email body/subject mentions the business name (for cases where email is from consultant/associate)
                const directMatch = businessNameLower.includes(clientNameLower) || 
                                   clientNameLower.includes(businessNameLower) ||
                                   businessNameLower.includes(fromEmailPrefix) ||
                                   fromEmailPrefix.includes(businessNameLower);
                
                // Check if email mentions the business name (handles cases like "email from more 8 about...")
                const mentionedInEmail = businessNameLower.length > 2 && 
                                         emailTextForMatching.includes(businessNameLower);
                
                return directMatch || mentionedInEmail;
              });
              
              if (matchingClient) {
                matchedClientId = matchingClient._id.toString();
                console.log(`✅ Matched email to client: ${fromEmail} -> ${matchingClient.businessName} (${matchedClientId})`);
              }
            }

            // Filter: Save emails that are either:
            // 1. From a registered client (matchedClientId exists), OR
            // 2. Contains permit-related keywords (permit, permits, licensing, licencing, license, licence)
            const requiredKeywords = ['permit', 'permits', 'licensing', 'licencing', 'license', 'licence'];
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

            // Try to match email to a specific permit - search ALL permits in database
            // This ensures we can match any permit name mentioned in the email, regardless of whether
            // the client already has that permit in their Permit Plan
            let matchedPermitId: string | undefined = undefined;
            let matchedPermitName: string | undefined = undefined;
            let matchedPermitManagementId: string | undefined = undefined; // Store PermitManagement _id for reference
            
            // Prepare text for matching (do this once, use everywhere)
            const subjectLower2 = subject.toLowerCase();
            const bodyLower2 = emailBody.toLowerCase();
            const combinedText = `${subjectLower2} ${bodyLower2}`;
            
            // First, try to match from client's existing permits (if client is matched)
            if (matchedClientId) {
              // Fetch all permits associated with this client
              const clientPermits = await PermitManagement.find({ clientId: matchedClientId }).lean();
              console.log(`🔍 Checking ${clientPermits.length} permits for client ${matchedClientId}`);
              
              // Improved matching: score each permit and pick the best match
              let bestMatch: { permit: any; score: number; permitId: string; managementId: string } | null = null;
              
              for (const permit of clientPermits) {
                const permitNameLower = (permit.name || '').toLowerCase();
                let matchScore = 0;
                
                // Normalize permit name for matching (handle British/American spelling variations)
                // e.g., "licence" vs "license", "licensing" vs "licencing"
                const normalizePermitName = (name: string) => {
                  return name
                    .replace(/licence/g, 'license') // Normalize British spelling to American
                    .replace(/licencing/g, 'licensing')
                    .toLowerCase();
                };
                const normalizedPermitName = normalizePermitName(permitNameLower);
                const normalizedCombinedText = normalizePermitName(combinedText);
                
                // Score 1: Exact permit name match in subject (highest priority)
                if (subjectLower2.includes(permitNameLower) && permitNameLower.length > 3) {
                  matchScore += 100;
                }
                // Also check normalized version for spelling variations (handles "licence" vs "license")
                if (normalizedCombinedText.includes(normalizedPermitName) && normalizedPermitName.length > 3) {
                  matchScore += 100;
                }
                // Check if subject contains key words from permit name (e.g., "Locksmith Licence" in subject)
                const permitKeyWords = permitNameLower.split(/\s+/).filter((w: string) => w.length >= 4);
                const subjectHasKeyWords = permitKeyWords.length > 0 && 
                                         permitKeyWords.every(word => subjectLower2.includes(word) || normalizedCombinedText.includes(normalizePermitName(word)));
                if (subjectHasKeyWords) {
                  matchScore += 80; // High score for key words match
                }
                
                // Score 2: Permit name in body
                if (bodyLower2.includes(permitNameLower) && permitNameLower.length > 5) {
                  matchScore += 50;
                }
                
                // Score 3: Significant words from permit name (3+ characters)
                const permitNameWords = permitNameLower.split(/\s+/).filter((w: string) => w.length >= 3);
                const matchingWords = permitNameWords.filter(word => 
                  combinedText.includes(word) || normalizedCombinedText.includes(normalizePermitName(word))
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
              
              // If we found a good match, use it
              // Lower threshold to 15 to catch more matches (e.g., "Locksmith Licence")
              // This ensures we catch permits even with partial matches
              if (bestMatch && bestMatch.score >= 15) {
                matchedPermitId = bestMatch.permitId;
                matchedPermitManagementId = bestMatch.managementId;
                matchedPermitName = bestMatch.permit.name;
                console.log(`✅ Matched email to permit: "${subject}" -> "${bestMatch.permit.name}" (score: ${bestMatch.score.toFixed(1)}, permitId: ${matchedPermitId}, managementId: ${matchedPermitManagementId})`);
              } else if (bestMatch) {
                console.log(`⚠️ Weak permit match found but score too low (${bestMatch.score.toFixed(1)}): "${subject}" -> "${bestMatch.permit.name}"`);
              } else {
                console.log(`⚠️ No permit match found in client's permits for email: "${subject}" from client ${matchedClientId}`);
              }
            }
            
            // If no match found in client's existing permits, OR if no client matched yet,
            // search the master Permit collection for ANY permit name mentioned in the email
            // This allows matching permits even if the client doesn't have them in their plan yet
            if (!matchedPermitId) {
              try {
                console.log(`🔍 Searching master Permit collection for permit names in email: "${subject}"`);
                // Search master Permit collection for permits matching email content
                // Normalize search terms to handle spelling variations (licence vs license)
                const normalizeSearchTerm = (term: string) => term.replace(/licence/g, 'license').replace(/licencing/g, 'licensing');
                const normalizedSubject = normalizeSearchTerm(subjectLower2);
                const normalizedBody = normalizeSearchTerm(bodyLower2.substring(0, 200)); // Search more of the body
                
                // Extract significant words from email that might be permit names
                // Look for capitalized phrases or important terms
                const significantWords: string[] = [];
                
                // Extract words from subject (likely to contain permit name)
                const subjectWords = subjectLower2.split(/\s+/).filter((w: string) => w.length >= 3);
                significantWords.push(...subjectWords.slice(0, 5));
                
                // Extract words from body (first 200 chars)
                const bodyWords = bodyLower2.substring(0, 200).split(/\s+/).filter((w: string) => w.length >= 3);
                significantWords.push(...bodyWords.slice(0, 10));
                
                // Build search queries
                const searchQueries: any[] = [];
                
                // Search for exact permit name patterns in subject
                if (subjectLower2.length > 5) {
                  // Remove common words and search for the rest
                  const cleanSubject = subjectLower2.replace(/\b(about|from|for|the|a|an|is|are|was|were|to|of|in|on|at|by)\b/g, '').trim();
                  if (cleanSubject.length > 3) {
                    searchQueries.push({ name: { $regex: new RegExp(cleanSubject.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } });
                    searchQueries.push({ name: { $regex: new RegExp(normalizeSearchTerm(cleanSubject).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } });
                  }
                }
                
                // Search for permit names in body
                if (bodyLower2.length > 10) {
                  const bodySnippet = bodyLower2.substring(0, 200);
                  searchQueries.push({ name: { $regex: new RegExp(bodySnippet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } });
                  searchQueries.push({ name: { $regex: new RegExp(normalizeSearchTerm(bodySnippet).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } });
                }
                
                // Search for significant words (likely permit name parts)
                const commonWords = ['the', 'and', 'for', 'from', 'about', 'with', 'this', 'that', 'permit', 'license', 'licence'];
                for (const word of significantWords) {
                  const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, '');
                  if (cleanWord.length >= 3 && !commonWords.includes(cleanWord)) {
                    searchQueries.push({ name: { $regex: new RegExp(cleanWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } });
                  }
                }
                
                const allPermits = searchQueries.length > 0 
                  ? await Permit.find({ $or: searchQueries }).limit(30).lean() // Increased limit to find more matches
                  : [];
                  
                if (allPermits.length > 0) {
                  // Score permits and find best match
                  let bestMasterMatch: { permit: any; score: number } | null = null;
                  
                  // Normalize function for spelling variations
                  const normalizePermitName = (name: string) => {
                    return name
                      .replace(/licence/g, 'license')
                      .replace(/licencing/g, 'licensing')
                      .toLowerCase();
                  };
                  
                  for (const permit of allPermits) {
                    const permitNameLower = (permit.name || '').toLowerCase();
                    const normalizedPermitName = normalizePermitName(permitNameLower);
                    const normalizedCombinedText = normalizePermitName(combinedText);
                    let matchScore = 0;
                    
                    // Score 1: Exact permit name match in subject (highest priority)
                    if (subjectLower2.includes(permitNameLower) && permitNameLower.length > 5) {
                      matchScore += 100;
                    }
                    // Also check normalized version for spelling variations
                    if (normalizedCombinedText.includes(normalizedPermitName) && normalizedPermitName.length > 5) {
                      matchScore += 100;
                    }
                    
                    // Score 2: Permit name in body
                    if (bodyLower2.includes(permitNameLower) && permitNameLower.length > 5) {
                      matchScore += 50;
                    }
                    
                    // Score 3: Significant words from permit name
                    const permitNameWords = permitNameLower.split(/\s+/).filter((w: string) => w.length >= 3);
                    const matchingWords = permitNameWords.filter(word => 
                      combinedText.includes(word) || normalizedCombinedText.includes(normalizePermitName(word))
                    );
                    if (matchingWords.length > 0) {
                      matchScore += (matchingWords.length / permitNameWords.length) * 30;
                    }
                    
                    // Score 4: Authority name match
                    if (permit.authority) {
                      const authorityLower = permit.authority.toLowerCase();
                      if (combinedText.includes(authorityLower)) {
                        matchScore += 20;
                      }
                    }
                    
                    if (matchScore > 0 && (!bestMasterMatch || matchScore > bestMasterMatch.score)) {
                      bestMasterMatch = { permit, score: matchScore };
                    }
                  }
                  
                  // If we found a good match, use it
                  // Lower threshold to 15 to catch more matches (e.g., "Locksmith Licence")
                  if (bestMasterMatch && bestMasterMatch.score >= 15) {
                    matchedPermitId = bestMasterMatch.permit._id.toString();
                    matchedPermitName = bestMasterMatch.permit.name;
                    console.log(`✅ Matched email to master permit: "${subject}" -> "${bestMasterMatch.permit.name}" (score: ${bestMasterMatch.score.toFixed(1)}, permitId: ${matchedPermitId})`);
                  } else if (bestMasterMatch) {
                    console.log(`⚠️ Weak master permit match (score: ${bestMasterMatch.score.toFixed(1)}): "${subject}" -> "${bestMasterMatch.permit.name}"`);
                  }
                }
              } catch (masterPermitError: any) {
                console.warn(`⚠️ Error searching master Permit collection:`, masterPermitError.message);
              }
            }

            // If we have a matched client and permit, but no PermitManagement entry exists,
            // create one so the permit shows up in the Permit Plan
            if (matchedClientId && matchedPermitId && !matchedPermitManagementId) {
              try {
                // Check if PermitManagement entry already exists for this client+permit combination
                const existingPermitManagement = await PermitManagement.findOne({
                  clientId: matchedClientId,
                  permitId: matchedPermitId.toString()
                }).lean();

                if (!existingPermitManagement) {
                  // Fetch the master Permit document to get full details
                  const masterPermit = await Permit.findById(matchedPermitId).lean();
                  
                  if (masterPermit) {
                    // Determine complexity based on permit level
                    const complexity = masterPermit.level === 'federal' ? 'high' : 
                                      masterPermit.level === 'provincial' ? 'medium' : 'low';
                    
                    // Determine category
                    const category = masterPermit.level === 'municipal' ? 'Municipal' :
                                    masterPermit.level === 'provincial' ? 'Provincial' : 'Federal';
                    
                    // Get description from activities or fullText
                    const description = masterPermit.activities && masterPermit.activities.length > 0
                      ? masterPermit.activities.join(', ')
                      : masterPermit.fullText?.substring(0, 200) || 'Permit application required';

                    // Get the highest order number for this client to set the new permit's order
                    const maxOrderDoc = await PermitManagement.findOne({ clientId: matchedClientId })
                      .sort({ order: -1 })
                      .select('order')
                      .lean();
                    const nextOrder = maxOrderDoc?.order ? maxOrderDoc.order + 1 : 1;

                    // Create PermitManagement entry
                    const permitManagementEntry = new PermitManagement({
                      clientId: matchedClientId,
                      permitId: matchedPermitId.toString(),
                      name: masterPermit.name,
                      authority: masterPermit.authority || 'Unknown',
                      municipality: masterPermit.jurisdiction?.city || masterPermit.jurisdiction?.province || undefined,
                      complexity,
                      estimatedTime: 'N/A',
                      description,
                      category,
                      status: 'not-started',
                      order: nextOrder,
                      lastActivity: 'Not Started',
                      lastActivityDate: new Date(),
                      requirements: masterPermit.activities || [],
                      howToApply: masterPermit.sourceUrl ? `Apply at: ${masterPermit.sourceUrl}` : 
                                 masterPermit.applyUrl ? `Apply at: ${masterPermit.applyUrl}` : 
                                 'Contact the issuing authority',
                      contactInfo: masterPermit.contactInfo ? {
                        phone: masterPermit.contactInfo.phone,
                        email: masterPermit.contactInfo.email,
                        website: masterPermit.moreInfoUrl,
                        address: masterPermit.contactInfo.address?.fullAddress,
                        officeHours: undefined
                      } : undefined
                    });

                    await permitManagementEntry.save();
                    matchedPermitManagementId = permitManagementEntry._id.toString();
                    
                    console.log(`✅ Created PermitManagement entry for client ${matchedClientId} and permit "${masterPermit.name}" (${matchedPermitManagementId})`);
                  } else {
                    console.warn(`⚠️ Master permit not found for permitId: ${matchedPermitId}`);
                  }
                } else {
                  // PermitManagement entry already exists, use its ID
                  matchedPermitManagementId = existingPermitManagement._id.toString();
                  console.log(`✅ PermitManagement entry already exists for client ${matchedClientId} and permit ${matchedPermitId}`);
                }
              } catch (permitManagementError: any) {
                // Non-critical error - log but continue processing email
                console.warn(`⚠️ Failed to create PermitManagement entry for client ${matchedClientId} and permit ${matchedPermitId}:`, permitManagementError.message);
              }
            }

            // Extract permit name from subject if no permit was matched
            let permitName = matchedPermitName || 'Email from Authority';
            if (!matchedPermitName) {
        const permitNameMatch = subject.match(/(permit|license|application|renewal)/i);
              permitName = permitNameMatch ? subject : 'Email from Authority';
            }

            // Try to save email record, handle duplicate key errors gracefully
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
          attachments: attachments.map(att => ({
            filename: att.filename,
            contentType: att.contentType,
            size: att.size,
            attachmentId: att.attachmentId, // Store attachmentId for fetching later
            gmailMessageId: att.gmailMessageId || message.id // Use message.id as fallback
          })),
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
            emailsSavedForThisAccount++; // Increment counter for this account
            
            const matchInfo = matchedClientId 
              ? (matchedPermitId ? `matched to client + permit` : `matched to client`)
              : (hasRequiredKeyword ? `has permit keywords` : `unknown`);
            
            console.log(`✅ Email saved immediately: ${subject} from ${fromEmail} (${matchInfo}${matchedPermitId ? ` - Permit: ${matchedPermitName}` : ''})`);

            // CREATE/UPDATE LEAD: Only for permit-related emails (not city/authority, not promotional)
            // Permit-related = has permit keywords, matched to a permit, or from a registered client
            const isPermitRelated = !!(hasRequiredKeyword || matchedPermitId || matchedClientId);
            
            console.log(`🔍 Lead creation check for email: ${fromEmail}`);
            console.log(`   - isCityEmail: ${isCityEmail}`);
            console.log(`   - isPromotionalEmail: ${isPromotionalEmail}`);
            console.log(`   - isPermitRelated: ${isPermitRelated} (keyword: ${!!hasRequiredKeyword}, permit: ${!!matchedPermitId}, client: ${!!matchedClientId})`);
            
            if (!isCityEmail && !isPromotionalEmail && fromEmail && isPermitRelated) {
              try {
                const receivedAt = headers.date ? new Date(headers.date) : new Date();
                const leadId = await ensureLeadForPermitEmail({
                  emailId: emailRecord._id.toString(),
                  fromEmail,
                  fromName: fromName || '',
                  subject,
                  receivedAt,
                });
                if (leadId) {
                  console.log(`✅ Lead created/updated for permit email: ${fromEmail} -> Lead ID: ${leadId}`);
                }
              } catch (leadError: any) {
                console.error(`❌ Failed to create/update lead from email ${fromEmail}:`, leadError.message);
                // Don't throw - continue processing other emails
              }
            } else {
              // Log why lead was not created
              if (isCityEmail) {
                console.log(`⏭️ Skipping lead creation: Email is from city/authority (${fromEmail})`);
              } else if (isPromotionalEmail) {
                console.log(`⏭️ Skipping lead creation: Email is promotional (${fromEmail})`);
              } else if (!fromEmail) {
                console.log(`⏭️ Skipping lead creation: No fromEmail found`);
              } else if (!isPermitRelated) {
                console.log(`⏭️ Skipping lead creation: Email is not permit-related (${fromEmail})`);
              }
            }

            // CREATE CITY FEEDBACK ITEM: If email is from a client AND mentions a permit, create a City Feedback item
            // Only create if not already synced (check by emailId)
            // IMPORTANT: Create City Feedback if we have BOTH client and permit matched
            // If we have a permit match but no client match, try to get clientId from the PermitManagement entry
            if (!matchedClientId && matchedPermitManagementId) {
              try {
                const permitManagement = await PermitManagement.findById(matchedPermitManagementId).lean();
                if (permitManagement && permitManagement.clientId) {
                  matchedClientId = permitManagement.clientId.toString();
                  console.log(`✅ Derived clientId from PermitManagement: ${matchedClientId} for permit ${matchedPermitManagementId}`);
                }
              } catch (error: any) {
                console.warn(`⚠️ Could not derive clientId from PermitManagement:`, error.message);
              }
            }
            
            if (matchedClientId && matchedPermitId && !isCityEmail) {
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
                  const subjectLower3 = subject.toLowerCase();
                  const bodyLower3 = emailBody.toLowerCase();
                  
                  if (subjectLower3.includes('revision') || subjectLower3.includes('revise') || bodyLower3.includes('revision required')) {
                    feedbackType = 'revision_required';
                  } else if (subjectLower3.includes('question') || bodyLower3.includes('?') || bodyLower3.includes('question')) {
                    feedbackType = 'question';
                  } else if (subjectLower3.includes('comment') || bodyLower3.includes('comment')) {
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
                  // This is the ID that should be used in PermitDetailView to show City Feedback for the specific permit
                  // If PermitManagement entry was just created or already existed, use its ID
                  // Otherwise, if we only have a master permit ID, use that (though this is less ideal)
                  // IMPORTANT: Convert to string to ensure consistent comparison
                  // matchedPermitManagementId is already a string from .toString() calls above
                  // matchedPermitId might be a string or ObjectId, so ensure it's a string
                  const feedbackPermitId = matchedPermitManagementId 
                    ? String(matchedPermitManagementId)
                    : (matchedPermitId ? String(matchedPermitId) : undefined);

                  // Create City Feedback item - this will automatically sync to the client's permit City Feedback page
                  const cityFeedbackItem = new CityFeedback({
                    clientId: matchedClientId,
                    permitId: feedbackPermitId, // Use PermitManagement ID when available (preferred) or master permit ID
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
                  
                  const permitInfo = feedbackPermitId 
                    ? (matchedPermitManagementId ? `PermitManagement ID: ${feedbackPermitId}` : `Master Permit ID: ${feedbackPermitId}`)
                    : 'No permit linked';
                  console.log(`✅ City Feedback item created and synced to City Feedback page - Client: ${matchedClientId}, ${permitInfo}, Subject: "${subject}" (CityFeedback ID: ${cityFeedbackItem._id}, permitId: ${cityFeedbackItem.permitId})`);
                  console.log(`📧 Email details - From: ${fromEmail}, Client: ${matchedClientId}, Permit: ${matchedPermitName || 'Unknown'}, PermitManagement ID: ${matchedPermitManagementId || 'N/A'}`);
                  
                  // Also log the query that should be used to fetch this feedback
                  if (feedbackPermitId) {
                    console.log(`📋 To fetch this City Feedback, use: /api/city-feedback?permitId=${feedbackPermitId}&clientId=${matchedClientId}`);
                  }
                  
                  // Log a warning if we're using master permit ID instead of PermitManagement ID
                  if (!matchedPermitManagementId && matchedPermitId) {
                    console.warn(`⚠️ Using master permit ID instead of PermitManagement ID. This may cause City Feedback to not appear correctly.`);
                  }
                }
              } catch (feedbackError: any) {
                // Non-critical error - log but continue
                console.warn(`⚠️ Failed to create City Feedback item for email ${emailRecord._id}:`, feedbackError.message);
              }
            }

            // Mark as read in Gmail after successful save (only if it was unread)
            // This prevents re-syncing the same email
            // Check if email was unread before marking as read
            const wasUnread = msg.labelIds?.includes('UNREAD');
            if (wasUnread) {
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
            }
      } catch (emailError: any) {
          // Handle duplicate key errors gracefully
          if (emailError.code === 11000 || emailError.message?.includes('duplicate key')) {
            console.log(`⚠️ Email already exists (duplicate key): ${message.id}`);
            continue; // Skip this email as it already exists
          }
          // Log and continue for other errors
          console.error(`Error processing email ${message.id} for ${currentUserId}:`, emailError);
          // Continue to next email even if this one fails
        }
      }

      // Add emails from this account to the overall list
      allIngestedEmails.push(...ingestedEmails);
      syncedAccounts.push(currentUserId);
      console.log(`✅ Synced ${ingestedEmails.length} emails from ${currentUserId} (up to ${MAX_EMAILS_PER_ACCOUNT} per account)`);
      
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
      query: 'Latest 25 emails per account (all accounts)',
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

