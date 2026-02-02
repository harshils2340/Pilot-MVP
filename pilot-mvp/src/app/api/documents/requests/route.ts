import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/app/lib/mongodb';
import { DocumentRequest } from '@/app/lib/documents/requestSchema';
import Mailgun from 'mailgun.js';
import FormData from 'form-data';

// Mailgun configuration
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY || '6237f6ace56660138012944ee86bd354-42b8ce75-5a55294a';
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || 'sandboxc05a10505af141d5b6fc8a6abfb3d6de.mailgun.org';
const FROM_EMAIL = process.env.FROM_EMAIL || `postmaster@${MAILGUN_DOMAIN}`;

export async function GET(request: NextRequest) {
  try {
    await connectToDB();
    const url = new URL(request.url);
    const clientId = url.searchParams.get('clientId');
    const permitId = url.searchParams.get('permitId');
    const status = url.searchParams.get('status') || 'pending';

    const query: Record<string, unknown> = {};
    if (clientId) query.clientId = clientId;
    if (permitId) query.permitId = permitId;
    if (status) query.status = status;
    
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    let queryBuilder = DocumentRequest.find(query).sort({ requestedAt: -1 });
    if (limit && limit > 0) {
      queryBuilder = queryBuilder.limit(limit);
    }
    
    const requests = await queryBuilder.lean();

    return NextResponse.json(
      requests.map((r: any) => ({
        id: r._id.toString(),
        _id: r._id.toString(),
        ...r,
      }))
    );
  } catch (error: any) {
    console.error('Failed to fetch document requests:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch document requests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDB();
    const body = await request.json();
    const { clientId, clientName, permitId, permitName, title, description, consultantId, consultantName, expiresAt } = body;

    if (!clientId || !title) {
      return NextResponse.json(
        { error: 'clientId and title are required' },
        { status: 400 }
      );
    }

    const doc = await DocumentRequest.create({
      clientId,
      clientName: clientName || undefined,
      permitId: permitId || undefined,
      permitName: permitName || undefined,
      title,
      description: description || undefined,
      consultantId: consultantId || undefined,
      consultantName: consultantName || undefined,
      status: 'pending',
      requestedAt: new Date(),
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    // Get client email from clientId
    let clientEmail = '';
    try {
      const { clientPromise } = await import('@/app/lib/mongodb');
      const { ObjectId } = await import('mongodb');
      const mongoClient = await clientPromise;
      const db = mongoClient.db('pilotClients');
      
      // Try ObjectId first, then try as string
      let client = null;
      if (ObjectId.isValid(clientId)) {
        client = await db.collection('clients').findOne({ _id: new ObjectId(clientId) });
      }
      if (!client) {
        client = await db.collection('clients').findOne({ businessName: clientId });
      }
      if (!client && ObjectId.isValid(clientId)) {
        client = await db.collection('clients').findOne({ _id: clientId });
      }
      
      if (client) {
        clientEmail = (client as any).contactInfo?.email || '';
      }
    } catch (error) {
      console.error('Failed to fetch client email:', error);
    }

    // Send email to client if email is available
    if (clientEmail) {
      try {
        const uploadUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://pilot-mvp.vercel.app'}/client-portal?requestId=${doc._id.toString()}`;
        
        const mailgun = new Mailgun(FormData);
        const mg = mailgun.client({
          username: 'api',
          key: MAILGUN_API_KEY.trim(),
        });

        const emailSubject = `Document Request: ${title}`;
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a1a;">Document Request</h2>
            <p>Hello ${clientName || 'there'},</p>
            <p>${consultantName || 'We'} have requested the following document${permitName ? ` for ${permitName}` : ''}:</p>
            <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1a1a1a;">${title}</h3>
              ${description ? `<p style="color: #666;">${description}</p>` : ''}
            </div>
            <p>Please upload the document using the link below:</p>
            <div style="margin: 24px 0;">
              <a href="${uploadUrl}" style="display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">Upload Document</a>
            </div>
            <p style="color: #666; font-size: 14px;">Or copy this link: <a href="${uploadUrl}">${uploadUrl}</a></p>
            ${expiresAt ? `<p style="color: #666; font-size: 14px;">Due date: ${new Date(expiresAt).toLocaleDateString()}</p>` : ''}
            <p style="color: #666; font-size: 14px; margin-top: 32px;">Thank you,<br>${consultantName || 'Pilot Team'}</p>
          </div>
        `;

        await mg.messages.create(MAILGUN_DOMAIN, {
          from: FROM_EMAIL,
          to: clientEmail,
          subject: emailSubject,
          html: emailHtml,
        });

        console.log('Document request email sent to:', clientEmail);
      } catch (emailError: any) {
        console.error('Failed to send document request email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json(
      { id: doc._id.toString(), ...doc.toObject() },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Failed to create document request:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create document request' },
      { status: 500 }
    );
  }
}
