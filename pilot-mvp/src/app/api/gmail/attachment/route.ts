import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import connectToDB from '@/app/lib/mongodb';
import { PermitEmail } from '@/app/lib/emails/schema';
import mongoose from 'mongoose';

// Schema for storing OAuth tokens (same as sync route)
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

// Helper function to get Gmail client
async function getGmailClient(userId?: string) {
  await connectToDB();
  
  // Get Gmail token from database
  const tokenDoc = userId 
    ? await GmailToken.findOne({ userId }).lean()
    : await GmailToken.findOne().lean();
  
  if (!tokenDoc) {
    throw new Error('No Gmail token found');
  }
  
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  
  oauth2Client.setCredentials({
    access_token: tokenDoc.accessToken,
    refresh_token: tokenDoc.refreshToken,
    expiry_date: tokenDoc.expiryDate?.getTime(),
  });
  
  // Refresh token if expired
  if (tokenDoc.expiryDate && tokenDoc.expiryDate.getTime() < Date.now()) {
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    // Update token in database
    await GmailToken.updateOne(
      { userId: tokenDoc.userId },
      {
        accessToken: credentials.access_token,
        refreshToken: credentials.refresh_token || tokenDoc.refreshToken,
        expiryDate: credentials.expiry_date ? new Date(credentials.expiry_date) : undefined,
        updatedAt: new Date(),
      }
    );
    
    oauth2Client.setCredentials(credentials);
  }
  
  return google.gmail({ version: 'v1', auth: oauth2Client });
}

// GET: Fetch attachment from Gmail
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const emailId = searchParams.get('emailId'); // Database email _id
    const attachmentIndex = parseInt(searchParams.get('index') || '0'); // Index of attachment in array
    const view = searchParams.get('view'); // 'download' or 'view' (default: download)
    
    if (!emailId) {
      return NextResponse.json(
        { error: 'Email ID is required' },
        { status: 400 }
      );
    }
    
    await connectToDB();
    
    // Find email in database
    const email = await PermitEmail.findById(emailId).lean();
    if (!email) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      );
    }
    
    // Get attachment
    if (!email.attachments || email.attachments.length === 0) {
      return NextResponse.json(
        { error: 'No attachments found' },
        { status: 404 }
      );
    }
    
    const attachment = email.attachments[attachmentIndex];
    if (!attachment) {
      return NextResponse.json(
        { error: 'Attachment not found' },
        { status: 404 }
      );
    }
    
    // Check if we have attachmentId and gmailMessageId
    const attachmentId = (attachment as any).attachmentId;
    const gmailMessageId = (attachment as any).gmailMessageId || email.gmailId;
    
    if (!attachmentId) {
      return NextResponse.json(
        { error: 'Attachment ID not available. This attachment may need to be re-synced from Gmail.' },
        { status: 400 }
      );
    }
    
    if (!gmailMessageId) {
      return NextResponse.json(
        { error: 'Gmail message ID not available. This email may need to be re-synced from Gmail.' },
        { status: 400 }
      );
    }
    
    // Get Gmail client - try to find userId from email metadata or use any available token
    let gmail;
    try {
      // Try to get userId from email metadata if available
      const userId = (email.metadata as any)?.userId;
      gmail = await getGmailClient(userId);
    } catch (error) {
      // Fallback to any available token
      gmail = await getGmailClient();
    }
    
    // Fetch attachment from Gmail
    const attachmentData = await gmail.users.messages.attachments.get({
      userId: 'me',
      messageId: gmailMessageId,
      id: attachmentId,
    });
    
    if (!attachmentData.data.data) {
      return NextResponse.json(
        { error: 'Failed to fetch attachment data' },
        { status: 500 }
      );
    }
    
    // Decode base64 data
    const fileBuffer = Buffer.from(attachmentData.data.data, 'base64');
    
    // Determine content type
    const contentType = attachment.contentType || 'application/octet-stream';
    
    // Set appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', 
      view === 'view' 
        ? `inline; filename="${attachment.filename}"`
        : `attachment; filename="${attachment.filename}"`
    );
    headers.set('Content-Length', fileBuffer.length.toString());
    
    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error('Error fetching attachment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attachment', details: error.message },
      { status: 500 }
    );
  }
}
