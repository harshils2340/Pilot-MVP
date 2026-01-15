import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/app/lib/mongodb';
import { PermitEmail } from '@/app/lib/emails/schema';
import FormData from 'form-data';
import Mailgun from 'mailgun.js';

// Mailgun configuration
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY || '6237f6ace56660138012944ee86bd354-42b8ce75-5a55294a';
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || 'sandboxc05a10505af141d5b6fc8a6abfb3d6de.mailgun.org';
// For sandbox domain, use postmaster@sandboxdomain.mailgun.org
const FROM_EMAIL = process.env.FROM_EMAIL || `postmaster@${MAILGUN_DOMAIN}`;
const FROM_NAME = process.env.FROM_NAME || 'Pilot Permit Management';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.FROM_EMAIL || FROM_EMAIL;

// POST: Public endpoint for clients to send emails
// This endpoint doesn't require permit information
export async function POST(request: NextRequest) {
  try {
    await connectToDB();

    const body = await request.json();
    const {
      name,
      email: clientEmail,
      subject,
      message,
      permitId, // Optional - if client mentions a permit
      permitName // Optional
    } = body;

    // Validate required fields
    if (!name || !clientEmail || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, message' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Format the email body
    const emailBody = `From: ${name} <${clientEmail}>\n\n${message}`;
    const emailSubject = subject || `Client Inquiry from ${name}`;

    // Send email via Mailgun to admin using mailgun.js library
    let mailgunMessageId: string | undefined;
    let sendError: string | undefined;
    
    try {
      // Initialize Mailgun client
      const mailgun = new Mailgun(FormData);
      const mg = mailgun.client({
        username: 'api',
        key: MAILGUN_API_KEY.trim(),
      });

      const emailData: any = {
        from: FROM_NAME ? `${FROM_NAME} <${FROM_EMAIL}>` : FROM_EMAIL,
        to: [ADMIN_EMAIL],
        subject: emailSubject,
        text: emailBody,
        'h:Reply-To': clientEmail, // So admin can reply directly to client
      };

      const data = await mg.messages.create(MAILGUN_DOMAIN, emailData);
      
      mailgunMessageId = data.id || data.message;
      console.log('Client email sent via Mailgun:', mailgunMessageId);
    } catch (error: any) {
      console.error('Error sending email via Mailgun:', error);
      sendError = error.message || 'Failed to send email via Mailgun';
    }

    // Save to database
    const email = new PermitEmail({
      permitId: permitId || undefined,
      permitName: permitName || undefined,
      clientName: name,
      subject: emailSubject,
      from: {
        email: clientEmail,
        name: name
      },
      to: {
        email: ADMIN_EMAIL,
        name: FROM_NAME
      },
      body: message,
      direction: 'inbound',
      status: 'unread',
      priority: 'medium',
      receivedAt: new Date(),
      metadata: {
        messageId: mailgunMessageId || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        mailgunId: mailgunMessageId,
        sendError: sendError,
        source: 'client-form'
      }
    });

    await email.save();

    return NextResponse.json({
      success: true,
      message: mailgunMessageId ? 'Your message has been sent successfully!' : 'Message received but email sending failed',
      emailId: email._id
    });
  } catch (error: any) {
    console.error('Error processing client email:', error);
    return NextResponse.json(
      { error: 'Failed to process your message', details: error.message },
      { status: 500 }
    );
  }
}
