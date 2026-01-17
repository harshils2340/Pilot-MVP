import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/app/lib/mongodb';
import { PermitEmail } from '@/app/lib/emails/schema';
import { Permit } from '@/app/lib/permits/schema';

// Backend configuration for test mode
const EMAIL_TEST_MODE = process.env.EMAIL_TEST_MODE === 'true' || false;

// POST: Webhook endpoint for receiving emails from Mailgun
// Mailgun sends form-data (application/x-www-form-urlencoded)
// This endpoint works regardless of test mode - emails should always be received

// Vercel runtime configuration
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Handle OPTIONS for CORS preflight (Mailgun might send this)
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log('📧 Webhook received - Email incoming...');
    console.log('🔗 Request URL:', request.url);
    console.log('📋 Request headers:', Object.fromEntries(request.headers.entries()));
    
    await connectToDB();

    // Mailgun sends form-data, so we need to parse it
    const formData = await request.formData();
    
    console.log('📦 Form data received, parsing...');
    
    // Extract email data from Mailgun webhook
    const from = formData.get('sender') as string;
    const to = formData.get('recipient') as string;
    const subject = formData.get('subject') as string;
    const bodyPlain = formData.get('body-plain') as string;
    const bodyHtml = formData.get('body-html') as string;
    const messageId = formData.get('Message-Id') as string;
    const timestamp = formData.get('timestamp') as string;
    const fromName = formData.get('From') as string; // Full "Name <email>" format

    if (!from || !to || !subject || !bodyPlain) {
      console.error('❌ Missing required email fields:', { from: !!from, to: !!to, subject: !!subject, bodyPlain: !!bodyPlain });
      return NextResponse.json(
        { error: 'Missing required email fields' },
        { status: 400 }
      );
    }

    console.log('✅ Email data extracted:', {
      from,
      to,
      subject: subject.substring(0, 50),
      bodyLength: bodyPlain.length
    });

    // Parse "Name <email>" format if present
    const fromMatch = fromName?.match(/^(.+?)\s*<(.+?)>$/);
    const parsedFromEmail = fromMatch ? fromMatch[2] : from;
    const parsedFromName = fromMatch ? fromMatch[1].trim() : undefined;

    // Try to extract permit information from subject or body
    let extractedPermitId: string | undefined;
    let extractedPermitName: string | undefined;
    let extractedClientName: string | undefined;

    // Pattern 1: Extract from subject like "Re: [Permit: 12345]" or "[Permit: ID]"
    const permitIdMatch = subject.match(/\[Permit[:\s]+([A-Za-z0-9\-_]+)\]/i) ||
                         bodyPlain.match(/\[Permit[:\s]+([A-Za-z0-9\-_]+)\]/i);
    
    // Pattern 2: MongoDB ObjectId format (24 hex characters)
    const objectIdMatch = subject.match(/\b([a-f0-9]{24})\b/i) ||
                         bodyPlain.match(/\b([a-f0-9]{24})\b/i);

    if (permitIdMatch) {
      extractedPermitId = permitIdMatch[1];
    } else if (objectIdMatch) {
      extractedPermitId = objectIdMatch[1];
    }

    // If we found a permit ID, try to look it up in the database
    if (extractedPermitId && extractedPermitId !== 'unknown') {
      try {
        const foundPermit = await Permit.findById(extractedPermitId).lean();
        if (foundPermit) {
          extractedPermitName = foundPermit.name;
        } else {
          // Try searching by name if ID lookup failed
          const searchText = (subject + ' ' + bodyPlain).substring(0, 100);
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

    // Extract client name from email
    if (parsedFromName) {
      extractedClientName = parsedFromName;
    } else {
      // Extract name from email domain (e.g., "john@company.com" -> "Company")
      // For personal emails like "john@gmail.com", use the email prefix as name
      const emailParts = parsedFromEmail.split('@');
      if (emailParts.length > 1) {
        const domain = emailParts[1].split('.')[0];
        // For common email providers, use the email prefix (before @) as name
        const commonProviders = ['gmail', 'yahoo', 'hotmail', 'outlook', 'icloud', 'mail'];
        if (commonProviders.includes(domain.toLowerCase())) {
          // Use the part before @ as the name (e.g., "john" from "john@gmail.com")
          extractedClientName = emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1);
        } else {
          // For company emails, use domain name
          extractedClientName = domain.charAt(0).toUpperCase() + domain.slice(1);
        }
      }
    }

    // Determine if email is from city/authority (not a client)
    const fromEmailLower = parsedFromEmail.toLowerCase();
    const isCityEmail = fromEmailLower.includes('@gov') ||
                        fromEmailLower.includes('@city') ||
                        fromEmailLower.includes('@department') ||
                        fromEmailLower.includes('department') ||
                        fromEmailLower.includes('@mailgun.org'); // Mailgun system emails

    // Filter to only save emails containing specific keywords: "permits", "licensing", "licencing"
    const requiredKeywords = ['permits', 'licensing', 'licencing'];

    const subjectLower = (subject || '').toLowerCase();
    const bodyLower = (bodyPlain || '').toLowerCase();
    
    // Check if email contains required keywords
    const hasRequiredKeyword = requiredKeywords.some(keyword => 
      subjectLower.includes(keyword.toLowerCase()) || bodyLower.includes(keyword.toLowerCase())
    );

    // Only save emails that have the required keywords
    if (!hasRequiredKeyword) {
      console.log(`⏭️ Skipping email (no required keywords: permits, licensing, licencing): ${parsedFromEmail} - Subject: "${subject}"`);
      return NextResponse.json({
        success: false,
        message: 'Email does not contain required keywords (permits, licensing, licencing), not saved'
      }, { status: 200 }); // Return 200 so Mailgun doesn't retry
    }

    // Create email document
    const email = new PermitEmail({
      permitId: extractedPermitId,
      permitName: extractedPermitName || subject,
      clientName: isCityEmail ? undefined : extractedClientName,
      subject,
      from: {
        email: parsedFromEmail,
        name: parsedFromName
      },
      to: {
        email: to
      },
      body: bodyPlain,
      htmlBody: bodyHtml || undefined,
      direction: 'inbound',
      status: 'unread',
      priority: subject.toLowerCase().includes('urgent') || 
                subject.toLowerCase().includes('important') ? 'high' : 'medium',
      receivedAt: timestamp ? new Date(parseInt(timestamp) * 1000) : new Date(),
      metadata: {
        messageId: messageId,
        headers: {
          'X-Mailgun-Received': 'true'
        }
      }
    });

    await email.save();

    console.log('✅ Email saved to database:', {
      emailId: email._id,
      permitId: extractedPermitId || 'none',
      permitName: extractedPermitName || 'none',
      clientName: extractedClientName || 'none',
      direction: 'inbound',
      status: 'unread',
      from: parsedFromEmail,
      to: to,
      subject: subject.substring(0, 50)
    });
    
    // Log full email details for debugging
    console.log('📋 Full email details:', JSON.stringify({
      _id: email._id.toString(),
      permitId: email.permitId,
      permitName: email.permitName,
      clientName: email.clientName,
      subject: email.subject,
      from: email.from,
      to: email.to,
      direction: email.direction,
      status: email.status
    }, null, 2));

    return NextResponse.json({
      success: true,
      emailId: email._id,
      message: 'Email received and saved'
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      }
    });
  } catch (error: any) {
    console.error('❌ Error processing email webhook:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: 'Failed to process email', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}
