/**
 * Check OAuth Configuration
 * 
 * This endpoint helps debug OAuth setup issues
 * Visit: /api/auth/google/check
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/google/callback`;
  
  const config = {
    clientId: process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Missing',
    redirectUri: redirectUri,
    origin: origin,
    environment: process.env.NODE_ENV || 'development',
  };

  // Return HTML page with clear instructions
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Google OAuth Configuration Check</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .card {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 { color: #333; }
    .config {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
      font-family: monospace;
    }
    .redirect-uri {
      background: #fff3cd;
      border: 2px solid #ffc107;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
      font-size: 18px;
      font-weight: bold;
      word-break: break-all;
    }
    .steps {
      background: #e7f3ff;
      padding: 20px;
      border-radius: 4px;
      margin: 20px 0;
    }
    .steps ol {
      line-height: 2;
    }
    .button {
      display: inline-block;
      background: #4285f4;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 4px;
      margin: 10px 5px;
    }
    .button:hover {
      background: #357ae8;
    }
    .error {
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      color: #721c24;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
    }
    .success {
      background: #d4edda;
      border: 1px solid #c3e6cb;
      color: #155724;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
    }
    code {
      background: #f4f4f4;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>🔧 Google OAuth Configuration Check</h1>
    
    <div class="config">
      <strong>Current Configuration:</strong><br>
      Client ID: ${config.clientId}<br>
      Client Secret: ${config.clientSecret}<br>
      Origin: ${config.origin}<br>
      Environment: ${config.environment}
    </div>

    <div class="error">
      <strong>⚠️ ERROR: redirect_uri_mismatch</strong><br>
      Google doesn't recognize your redirect URI. You need to add it to Google Cloud Console.
    </div>

    <h2>📋 Copy This Redirect URI:</h2>
    <div class="redirect-uri">
      ${redirectUri}
    </div>

    <div class="steps">
      <h2>✅ Fix This in 3 Steps:</h2>
      <ol>
        <li>
          <strong>Go to Google Cloud Console:</strong><br>
          <a href="https://console.cloud.google.com/apis/credentials" target="_blank" class="button">
            Open Google Cloud Console
          </a>
        </li>
        <li>
          <strong>Add the Redirect URI:</strong>
          <ul>
            <li>Click on your <strong>OAuth 2.0 Client ID</strong></li>
            <li>Scroll down to <strong>"Authorized redirect URIs"</strong></li>
            <li>Click <strong>"+ ADD URI"</strong></li>
            <li>Paste this EXACT URI: <code>${redirectUri}</code></li>
            <li>Click <strong>"SAVE"</strong></li>
          </ul>
        </li>
        <li>
          <strong>Wait 2-3 minutes, then test:</strong><br>
          <a href="/api/auth/google" class="button">Test Google Login</a>
        </li>
      </ol>
    </div>

    <div class="success">
      <strong>💡 Tips:</strong>
      <ul>
        <li>The URI must match <strong>EXACTLY</strong> (including http://, port, and path)</li>
        <li>Wait 2-3 minutes after saving for Google to update</li>
        <li>Clear browser cache if you still see errors</li>
        <li>For production, also add: <code>https://pilot-mvp.vercel.app/api/auth/google/callback</code></li>
      </ul>
    </div>

    <h3>🔍 Still Not Working?</h3>
    <p>Make sure:</p>
    <ul>
      <li>You're editing the <strong>correct OAuth Client ID</strong> (check Client ID matches)</li>
      <li>The URI has <strong>no trailing slash</strong></li>
      <li>You're using <strong>http://</strong> (not https://) for localhost</li>
      <li>Port is <strong>3001</strong> (not 3000)</li>
    </ul>
  </div>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}
