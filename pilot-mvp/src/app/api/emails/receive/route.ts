import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/app/lib/mongodb';
import { PermitEmail } from '@/app/lib/emails/schema';
import { Permit } from '@/app/lib/permits/schema';

// POST: Webhook endpoint for receiving emails from Mailgun
// This endpoint is called by Mailgun when an email is received
export async function POST(request: NextRequest) {
  try {
    await connectToDB();

    // Mailgun sends form data, so we need to parse it
    const formData = await request.formData();
    
    // Extract email data from Mailgun webhook
    const from = formData.get('sender') as string;
    const to = formData.get('recipient') as string;
    const subject = formData.get('subject') as string;
    const bodyPlain = formData.get('body-plain') as string;
    const bodyHtml = formData.get('body-html') as string;
    const messageId = formData.get('Message-Id') as string;
    const timestamp = formData.get('timestamp') as string;

    if (!from || !to || !subject || !bodyPlain) {
      return NextResponse.json(
        { error: 'Missing required email fields' },
        { status: 400 }
      );
    }

    // Try to extract permit information from subject or body
    let extractedPermitId: string | undefined;
    let extractedPermitName: string | undefined;
    let extractedClientName: string | undefined;

    // Pattern 1: Extract from subject like "Re: [Permit: 12345]"
    const permitIdMatch = subject.match(/\[Permit[:\s]+([A-Za-z0-9\-_]+)\]/i) ||
                         bodyPlain.match(/\[Permit[:\s]+([A-Za-z0-9\-_]+)\]/i);
    
    // Pattern 2: MongoDB ObjectId format
    const objectIdMatch = subject.match(/\b([a-f0-9]{24})\b/i) ||
                         bodyPlain.match(/\b([a-f0-9]{24})\b/i);

    if (permitIdMatch) {
      extractedPermitId = permitIdMatch[1];
    } else if (objectIdMatch) {
      extractedPermitId = objectIdMatch[1];
    }

    // If we found a permit ID, try to look it up
    if (extractedPermitId && extractedPermitId !== 'unknown') {
      try {
        const foundPermit = await Permit.findById(extractedPermitId).lean();
        if (foundPermit) {
          extractedPermitName = foundPermit.name;
        }
      } catch (err) {
        console.error('Error looking up permit:', err);
      }
    }

    // Extract client name from email
    const fromMatch = from.match(/^(.+?)\s*<(.+?)>$/);
    if (fromMatch) {
      extractedClientName = fromMatch[1].trim();
    } else {
      // Extract from email domain
      const emailParts = from.split('@');
      if (emailParts.length > 1) {
        const domain = emailParts[1].split('.')[0];
        extractedClientName = domain.charAt(0).toUpperCase() + domain.slice(1);
      }
    }

    // Determine if this is from a city/authority or client
    const fromEmailLower = from.toLowerCase();
    const isCityEmail = 
      fromEmailLower.includes('.gov') || 
      fromEmailLower.includes('city') || 
      fromEmailLower.includes('municipal') ||
      fromEmailLower.includes('department');

    // Create email document
    const email = new PermitEmail({
      permitId: extractedPermitId,
      permitName: extractedPermitName || subject,
      clientName: isCityEmail ? undefined : extractedClientName,
      subject,
      from: {
        email: fromMatch ? fromMatch[2] : from,
        name: fromMatch ? fromMatch[1].trim() : undefined
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
