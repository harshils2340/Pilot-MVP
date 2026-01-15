import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/app/lib/mongodb';
import { PermitEmail } from '@/app/lib/emails/schema';
import { Permit } from '@/app/lib/permits/schema';

// Backend configuration for test mode
const EMAIL_TEST_MODE = process.env.EMAIL_TEST_MODE === 'true' || false;

// POST: Webhook endpoint for receiving emails
// This would be called by your email service (SendGrid, AWS SES, etc.) when an email is received
export async function POST(request: NextRequest) {
  try {
    // Check if email functionality is enabled
    if (!EMAIL_TEST_MODE) {
      return NextResponse.json(
        { error: 'Email functionality is disabled. Test mode must be enabled.' },
        { status: 403 }
      );
    }

    await connectToDB();

    const body = await request.json();

    // Parse email from webhook payload
    // This structure depends on your email service provider
    // Example structure (adjust based on your provider):
    const {
      from,
      to,
      subject,
      text,
      html,
      attachments,
      headers,
      messageId,
      permitId, // If your email service can extract this from subject/body
      permitName,
      clientId,
      clientName
    } = body;

    if (!from || !to || !subject || !text) {
      return NextResponse.json(
        { error: 'Missing required email fields' },
        { status: 400 }
      );
    }

    // Try to extract permit info from subject or body if not provided
    // This is a simple example - you might want more sophisticated parsing
    let extractedPermitId = permitId;
    let extractedPermitName = permitName;
    let extractedClientId = clientId;
    let extractedClientName = clientName;
    
    if (!extractedPermitId) {
      // Try multiple patterns to extract permit ID
      // Pattern 1: "Permit ID: 12345" or "Permit: 12345"
      const permitIdMatch = subject.match(/Permit[:\s]+(?:ID[:\s]+)?([A-Za-z0-9\-_]+)/i) || 
                            text.match(/Permit[:\s]+(?:ID[:\s]+)?([A-Za-z0-9\-_]+)/i);
      
      // Pattern 2: "[Permit: 12345]" or "(Permit: 12345)"
      const bracketMatch = subject.match(/[\[\(]Permit[:\s]+([A-Za-z0-9\-_]+)[\]\)]/i) ||
                           text.match(/[\[\(]Permit[:\s]+([A-Za-z0-9\-_]+)[\]\)]/i);
      
      // Pattern 3: MongoDB ObjectId format (24 hex characters)
      const objectIdMatch = subject.match(/\b([a-f0-9]{24})\b/i) ||
                           text.match(/\b([a-f0-9]{24})\b/i);
      
      if (permitIdMatch) {
        extractedPermitId = permitIdMatch[1];
      } else if (bracketMatch) {
        extractedPermitId = bracketMatch[1];
      } else if (objectIdMatch) {
        extractedPermitId = objectIdMatch[1];
      }
      
      // If we found a permit ID, try to look it up in the database to get the permit name
      if (extractedPermitId && extractedPermitId !== 'unknown') {
        try {
          const foundPermit = await Permit.findById(extractedPermitId).lean();
          if (foundPermit) {
            extractedPermitName = foundPermit.name;
          } else {
            // Try searching by name if ID lookup failed
            const searchText = subject + ' ' + text;
            const permits = await Permit.find({
              $or: [
                { name: { $regex: searchText.substring(0, 50), $options: 'i' } },
                { authority: { $regex: searchText.substring(0, 50), $options: 'i' } }
              ]
            }).limit(1).lean();
            
            if (permits.length > 0) {
              extractedPermitId = permits[0]._id.toString();
              extractedPermitName = permits[0].name;
            }
          }
        } catch (err) {
          console.error('Error looking up permit:', err);
        }
      }
    }
    
    // Try to extract client info from email
    if (!extractedClientName && from) {
      const fromEmail = typeof from === 'string' ? from : from.email;
      const fromName = typeof from === 'string' ? undefined : from.name;
      
      // Try to extract client name from email address or name
      if (fromName) {
        extractedClientName = fromName;
      } else if (fromEmail) {
        // Extract name from email (e.g., "john.doe@company.com" -> "Company")
        const emailParts = fromEmail.split('@');
        if (emailParts.length > 1) {
          const domain = emailParts[1].split('.')[0];
          extractedClientName = domain.charAt(0).toUpperCase() + domain.slice(1);
        }
      }
    }

    // Create email document
    const email = new PermitEmail({
      permitId: extractedPermitId || 'unknown',
      permitName: extractedPermitName || subject,
      clientId,
      clientName,
      subject,
      from: typeof from === 'string' ? { email: from } : from,
      to: typeof to === 'string' ? { email: to } : to,
      body: text,
      htmlBody: html,
      attachments: attachments?.map((att: any) => ({
        filename: att.filename || att.name,
        contentType: att.contentType || att.type,
        size: att.size || 0,
        url: att.url
      })) || [],
      direction: 'inbound',
      status: 'unread',
      priority: subject.toLowerCase().includes('urgent') || 
                subject.toLowerCase().includes('important') ? 'high' : 'medium',
      receivedAt: new Date(),
      metadata: {
        messageId: messageId || headers?.['message-id'],
        headers: headers || {}
      }
    });

    await email.save();

    return NextResponse.json({
      success: true,
      emailId: email._id,
      message: 'Email received and saved'
    });
  } catch (error: any) {
    console.error('Error processing email webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process email', details: error.message },
      { status: 500 }
    );
  }
}
