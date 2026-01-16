# Gmail Integration - Per-User Setup

## ✅ Updated Features

1. **Per-User OAuth:** Each user can connect their own Gmail account
2. **Sender Filtering:** Filter emails by specific sender addresses
3. **Auto-Sync Endpoint:** Dedicated endpoint for monitoring specific senders

## 🔧 How It Works

### 1. Per-User OAuth

When a user connects Gmail:
- OAuth tokens are stored with their email/userId
- Each user has their own Gmail connection
- Tokens are automatically refreshed per user

**Current Implementation:**
- Uses email from OAuth token as `userId`
- Falls back to `'default-user'` if email not available
- You can extend this to use your auth system's user ID

### 2. Reading Emails with Sender Filtering

**GET `/api/gmail/read`**

Query parameters:
- `maxResults` - Number of emails (default: 10)
- `query` - Gmail search query (default: "is:unread")
- `from` - Filter by specific sender email
- `userId` - Optional: specify which user's Gmail to read

**Examples:**

```bash
# Read unread emails from specific sender
GET /api/gmail/read?from=permits@city.gov&maxResults=20

# Read emails for specific user
GET /api/gmail/read?userId=user@example.com&from=permits@city.gov

# Custom query
GET /api/gmail/read?query=subject:renewal from:permits@city.gov
```

**POST `/api/gmail/read`**

Body:
```json
{
  "maxResults": 50,
  "query": "is:unread",
  "from": "permits@city.gov",  // Single sender
  "allowedSenders": [          // OR multiple senders
    "permits@city.gov",
    "licenses@state.gov",
    "notifications@county.gov"
  ],
  "userId": "user@example.com", // Optional
  "markAsRead": true
}
```

### 3. Auto-Sync Endpoint (For Cron/Webhooks)

**POST `/api/gmail/sync`**

This endpoint is designed for automatic syncing. It:
- Only processes emails from allowed senders
- Marks emails as high priority
- Automatically marks as read in Gmail
- Skips duplicates

**Body:**
```json
{
  "userId": "user@example.com",
  "allowedSenders": [
    "permits@city.gov",
    "licenses@state.gov"
  ],
  "maxResults": 50
}
```

**Use Cases:**
1. **Cron Job:** Set up a cron to call this every 15 minutes
2. **Webhook:** Call this when Gmail sends push notifications
3. **Manual Trigger:** Call from your dashboard

## 📧 Setting Up Auto-Sync

### Option 1: Vercel Cron Jobs

Create `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/gmail/sync",
    "schedule": "*/15 * * * *"
  }]
}
```

Then call it with:
```bash
POST /api/gmail/sync
{
  "userId": "user@example.com",
  "allowedSenders": ["permits@city.gov"]
}
```

### Option 2: External Cron Service

Use a service like cron-job.org or EasyCron:

1. Set URL: `https://pilot-mvp.vercel.app/api/gmail/sync`
2. Method: POST
3. Headers: `Content-Type: application/json`
4. Body:
```json
{
  "userId": "user@example.com",
  "allowedSenders": [
    "permits@city.gov",
    "licenses@state.gov"
  ]
}
```
5. Schedule: Every 15 minutes

### Option 3: Gmail Push Notifications (Advanced)

For real-time updates, set up Gmail push notifications:
- More complex setup
- Requires webhook endpoint
- Instant email ingestion

## 🎯 Example: Monitor Permit Emails

Let's say you want to monitor emails from these senders:
- `permits@sanfrancisco.gov`
- `licenses@california.gov`
- `notifications@sfdpw.org`

**Setup:**

1. **User connects Gmail:**
   ```
   Visit: /api/auth/google
   ```

2. **Set up auto-sync (cron):**
   ```bash
   POST /api/gmail/sync
   {
     "userId": "user@example.com",
     "allowedSenders": [
       "permits@sanfrancisco.gov",
       "licenses@california.gov",
       "notifications@sfdpw.org"
     ]
   }
   ```

3. **Emails will:**
   - Be automatically ingested into your database
   - Show up in your Permit Inbox
   - Be marked as high priority
   - Be marked as read in Gmail

## 🔍 Query Examples

Gmail query syntax:

```javascript
// From specific sender
from:permits@city.gov

// Multiple senders
from:(permits@city.gov OR licenses@state.gov)

// Subject contains
subject:renewal

// Date range
after:2024/1/1 before:2024/1/31

// Combined
is:unread from:permits@city.gov subject:renewal
```

## 🔐 User Management

**Current:** Uses email from OAuth token as userId

**To Extend:**
1. Get userId from your auth session
2. Store userId in cookie/header
3. Pass userId to API endpoints

**Example Extension:**
```typescript
// In your auth middleware
const session = await getSession(request);
const userId = session?.user?.email || session?.user?.id;

// Pass to Gmail API
const response = await fetch('/api/gmail/read', {
  method: 'POST',
  body: JSON.stringify({
    userId,
    allowedSenders: [...]
  })
});
```

## 📝 Next Steps

1. **Add UI:** Create a "Connect Gmail" button in dashboard
2. **Sender Management:** UI to add/remove monitored senders
3. **Email Matching:** Auto-match emails to permits/clients
4. **Notifications:** Alert when new permit emails arrive

