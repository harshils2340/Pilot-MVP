import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/app/lib/mongodb';
import mongoose from 'mongoose';

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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/?error=no_code', request.url)
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'https://pilot-mvp.vercel.app/api/auth/google/callback';

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL('/?error=oauth_not_configured', request.url)
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    if (!tokens.refresh_token) {
      console.warn('⚠️ No refresh token received. User may need to re-authenticate.');
    }

    // Store tokens in database
    await connectToDB();
    
    // Use a default userId for now (you can customize this based on your auth system)
    const userId = 'default-user'; // TODO: Get from session/auth
    
    await GmailToken.findOneAndUpdate(
      { userId },
      {
        userId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || '',
        tokenType: tokens.token_type || 'Bearer',
        expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
        scope: tokens.scope,
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    console.log('✅ Gmail OAuth tokens stored successfully');

    // Redirect to dashboard with success message
    return NextResponse.redirect(
      new URL('/?gmail=connected', request.url)
    );
  } catch (error: any) {
    console.error('Error in OAuth callback:', error);
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(error.message || 'oauth_failed')}`, request.url)
    );
  }
}

