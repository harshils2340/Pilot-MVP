# Gmail API Integration Setup

This guide will help you set up Gmail API integration to automatically read and ingest emails into Pilot.

## ✅ What's Already Done

1. **OAuth Routes Created:**
   - `/api/auth/google` - Initiates OAuth flow
   - `/api/auth/google/callback` - Handles OAuth callback and stores tokens

2. **Email Reading Route:**
   - `/api/gmail/read` - Reads emails from Gmail and ingests them into Pilot database

3. **Token Storage:**
   - OAuth tokens are stored in MongoDB in the `GmailToken` collection
   - Tokens are automatically refreshed when expired

## 🔧 Setup Steps

### 1. Add Environment Variables in Vercel

Go to your Vercel project → Settings → Environment Variables and add:

```
GOOGLE_CLIENT_ID=928350246166-nc8foe8ucfdadpvhcg84s9ujjiq06880.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=https://pilot-mvp.vercel.app/api/auth/google/callback
```

**Important:** Make sure to add these for:
- ✅ Production
- ✅ Preview  
- ✅ Development

### 2. Redeploy Your Application

After adding environment variables, trigger a new deployment in Vercel.

### 3. Connect Gmail (First Time)

Visit this URL in your browser:
```
https://pilot-mvp.vercel.app/api/auth/google
```

This will:
1. Redirect you to Google's consent screen
2. Ask you to authorize Gmail access
3. Redirect back to your app
4. Store the OAuth tokens in your database

### 4. Test Email Reading

Once connected, you can read emails using:

**GET Request:**
```bash
curl https://pilot-mvp.vercel.app/api/gmail/read?maxResults=10&query=is:unread
```

**POST Request (Sync & Ingest):**
```bash
curl -X POST https://pilot-mvp.vercel.app/api/gmail/read \
  -H "Content-Type: application/json" \
  -d '{
    "maxResults": 50,
    "query": "is:unread",
    "markAsRead": true
  }'
```

## 📧 How It Works

### Email Reading Flow

1. **OAuth Authentication:**
   - User visits `/api/auth/google`
   - Redirects to Google consent screen
   - User authorizes access
   - Tokens stored in MongoDB

2. **Reading Emails:**
   - Call `/api/gmail/read` (GET) to read emails
   - Or POST to sync and ingest into database

3. **Email Ingestion:**
   - Emails are parsed and stored in `PermitEmail` collection
   - Duplicate emails (by `gmailId`) are skipped
   - Emails can be marked as read in Gmail (optional)

### Email Parsing

The system automatically:
- Extracts subject, from, to, body
- Tries to identify permit-related emails
- Stores metadata (labels, snippet, headers)
- Links emails to permits/clients (when matched)

## 🔍 Query Examples

Gmail query syntax (same as Gmail search):

```javascript
// Unread emails
query: "is:unread"

// From specific sender
query: "from:permits@city.gov"

// Subject contains
query: "subject:renewal"

// Date range
query: "after:2024/1/1 before:2024/1/31"

// Combined
query: "is:unread from:permits@city.gov subject:renewal"
```

## 🔄 Automatic Sync (Future)

To set up automatic email syncing, you can:

1. **Use Vercel Cron Jobs:**
   - Create `vercel.json` with cron schedule
   - Call `/api/gmail/read` (POST) periodically

2. **Use External Cron Service:**
   - Set up a cron job (e.g., cron-job.org)
   - Call your API endpoint every 15 minutes

3. **Use Gmail Push Notifications:**
   - Set up webhook for real-time email notifications
   - More complex but instant updates

## 🛠️ API Endpoints

### GET `/api/auth/google`
Initiates OAuth flow. Redirects to Google.

### GET `/api/auth/google/callback`
Handles OAuth callback. Stores tokens and redirects to dashboard.

### GET `/api/gmail/read`
Reads emails from Gmail.

**Query Parameters:**
- `maxResults` (optional, default: 10) - Number of emails to fetch
- `query` (optional, default: "is:unread") - Gmail search query

**Response:**
```json
{
  "success": true,
  "emails": [...],
  "count": 10
}
```

### POST `/api/gmail/read`
Syncs and ingests emails into Pilot database.

**Body:**
```json
{
  "maxResults": 50,
  "query": "is:unread",
  "markAsRead": true
}
```

**Response:**
```json
{
  "success": true,
  "ingested": 5,
  "emails": [...]
}
```

## 🔐 Security Notes

1. **OAuth Tokens:**
   - Stored securely in MongoDB
   - Automatically refreshed when expired
   - Never exposed to frontend

2. **Test Users:**
   - Currently in "test mode" - only added test users can connect
   - For production, you'll need to verify the app with Google

3. **Scopes:**
   - `gmail.readonly` - Read emails
   - `gmail.modify` - Mark emails as read

## 🐛 Troubleshooting

### "Gmail not connected"
- Visit `/api/auth/google` to connect
- Check that tokens are stored in MongoDB

### "Token expired"
- Tokens are automatically refreshed
- If refresh fails, re-authenticate via `/api/auth/google`

### "No emails found"
- Check your Gmail query
- Verify you have unread emails
- Check Gmail API quota limits

## 📝 Next Steps

1. **Add UI Button:**
   - Create a "Connect Gmail" button in your dashboard
   - Add email sync status indicator

2. **Smart Email Parsing:**
   - Extract permit numbers from emails
   - Match emails to existing permits/clients
   - Auto-categorize by email content

3. **Email Notifications:**
   - Set up Gmail push notifications
   - Real-time email ingestion

4. **PDF Processing:**
   - Extract attachments
   - OCR for permit documents
   - Parse structured data

