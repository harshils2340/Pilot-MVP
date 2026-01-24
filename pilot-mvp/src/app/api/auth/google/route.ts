import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    // Determine redirect URI - use environment variable or fallback to request origin
    let redirectUri = process.env.GOOGLE_REDIRECT_URI;
    
    if (!redirectUri) {
      // Fallback: use request origin for localhost, or default to production
      const origin = request.nextUrl.origin;
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        redirectUri = `${origin}/api/auth/google/callback`;
      } else {
        redirectUri = 'https://pilot-mvp.vercel.app/api/auth/google/callback';
      }
    }

    console.log('🔗 Using redirect URI:', redirectUri);

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Google OAuth credentials not configured' },
        { status: 500 }
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent select_account', // Force login every time
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.modify', // For marking as read
      ],
    });

    return NextResponse.redirect(url);
  } catch (error: any) {
    console.error('Error generating OAuth URL:', error);
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow', details: error.message },
      { status: 500 }
    );
  }
}
