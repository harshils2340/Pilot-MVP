import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/app/lib/mongodb';
import { PermitEmail } from '@/app/lib/emails/schema';
import FormData from 'form-data';
import Mailgun from 'mailgun.js';

// Backend configuration for test mode
const EMAIL_TEST_MODE = process.env.EMAIL_TEST_MODE === 'true' || false;

// Mailgun configuration
// IMPORTANT: Use your Mailgun Sending Key (not the API key)
// Get it from: Mailgun Dashboard → Settings → Sending Keys
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY || '6237f6ace56660138012944ee86bd354-42b8ce75-5a55294a';
// Your Mailgun sandbox domain
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || 'sandboxc05a10505af141d5b6fc8a6abfb3d6de.mailgun.org';

// Note: For sandbox.mailgun.org, you can only send to authorized recipients
// Go to Mailgun Dashboard → Sending → Authorized Recipients to add recipients

// POST: Send an email
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
    const {
      permitId,
      permitName,
      clientId,
      clientName,
      subject,
      to,
      body: emailBody,
      htmlBody,
      attachments,
      priority,
      threadId,
      inReplyTo
    } = body;

    // Validate required fields (permitId and permitName are optional)
    const toEmail = typeof to === 'string' ? to : (to?.email || '');
    
    if (!subject || subject.trim().length === 0) {
      return NextResponse.json(
        { error: 'Missing required field: subject' },
        { status: 400 }
      );
    }
    if (!toEmail || toEmail.trim().length === 0) {
      return NextResponse.json(
        { error: 'Missing required field: to (recipient email)' },
        { status: 400 }
      );
    }
    if (!emailBody || emailBody.trim().length === 0) {
      return NextResponse.json(
        { error: 'Missing required field: body (email message)' },
        { status: 400 }
      );
    }

    // For sandbox domain, use postmaster@sandboxdomain.mailgun.org
    // This is required by Mailgun for sandbox domains
    const fromEmail = process.env.FROM_EMAIL || `postmaster@${MAILGUN_DOMAIN}`;
    const fromName = process.env.FROM_NAME || 'Pilot Permit Management';

    // Send email via Mailgun using mailgun.js library
    let mailgunMessageId: string | undefined;
    let sendError: string | undefined;
    
    // Validate API key before attempting to send
    if (!MAILGUN_API_KEY || MAILGUN_API_KEY.trim().length === 0) {
      sendError = 'Mailgun API key is not configured. Please set MAILGUN_API_KEY in your environment variables.';
      console.error(sendError);
    } else {
      try {
        // Initialize Mailgun client (matching Mailgun's recommended approach)
        const mailgun = new Mailgun(FormData);
        const mg = mailgun.client({
          username: 'api',
          key: MAILGUN_API_KEY.trim(),
        });

        console.log('Attempting to send email via Mailgun:', {
          domain: MAILGUN_DOMAIN,
          from: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
          to: toEmail,
          subject: subject
        });

        // Prepare email data
        const emailData: any = {
          from: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
          to: [toEmail],
          subject: subject,
          text: emailBody,
        };

        // Add HTML body if provided
        if (htmlBody) {
          emailData.html = htmlBody;
        }

        // Add reply headers if replying
        if (inReplyTo) {
          emailData['h:In-Reply-To'] = inReplyTo;
          emailData['h:References'] = inReplyTo;
        }

        // Send email via Mailgun
        const data = await mg.messages.create(MAILGUN_DOMAIN, emailData);
        
        mailgunMessageId = data.id || data.message;
        console.log('Email sent via Mailgun successfully:', mailgunMessageId);
        console.log('Mailgun response:', data);
      } catch (error: any) {
        console.error('Error sending email via Mailgun:', error);
        
        // Parse error message
        let errorMessage = 'Failed to send email via Mailgun';
        if (error.message) {
          errorMessage = error.message;
        } else if (error.status) {
          errorMessage = `Mailgun API error: ${error.status}`;
        }
        
        // Check for specific error types
        if (error.status === 401) {
          errorMessage += ' - Authentication failed. Please check your API key.';
        } else if (error.status === 403) {
          errorMessage += ' - Forbidden. Check account activation and domain permissions.';
        }
        
        sendError = errorMessage;
        // Continue to save email to database even if sending fails
      }
    }

    // Create email document (permitId and permitName are optional)
    const emailData: any = {
      subject,
      from: {
        email: fromEmail,
        name: fromName
      },
      to: typeof to === 'string' ? { email: to } : to,
      body: emailBody,
      direction: 'outbound',
      status: mailgunMessageId ? 'read' : 'read',
      priority: priority || 'medium',
      sentAt: new Date(),
      metadata: {
        messageId: mailgunMessageId || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        mailgunId: mailgunMessageId,
        sendError: sendError
      }
    };

    // Add optional fields only if provided
    if (permitId) emailData.permitId = permitId;
    if (permitName) emailData.permitName = permitName;
    if (clientId) emailData.clientId = clientId;
    if (clientName) emailData.clientName = clientName;
    if (htmlBody) emailData.htmlBody = htmlBody;
    if (attachments && attachments.length > 0) emailData.attachments = attachments;
    if (threadId) emailData.threadId = threadId;
    if (inReplyTo) emailData.inReplyTo = inReplyTo;

    const email = new PermitEmail(emailData);

    await email.save();

    return NextResponse.json({
      success: true,
      email: email.toObject(),
      message: mailgunMessageId ? 'Email sent successfully' : (sendError ? `Email saved but sending failed: ${sendError}` : 'Email saved but sending failed'),
      mailgunMessageId,
      sendError: sendError,
      test: EMAIL_TEST_MODE
    });
  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error.message },
      { status: 500 }
    );
  }
}
