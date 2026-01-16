# Email Receiving Setup - Complete Guide

## 📧 Exact Email Address for Receiving Emails

**Your receiving email address is:**

```
inbox@sandboxc05a10505af141d5b6fc8a6abfb3d6de.mailgun.org
```

**Or ANY email address using your Mailgun domain:**

You can receive emails at **any address** ending with `@sandboxc05a10505af141d5b6fc8a6abfb3d6de.mailgun.org`, for example:
- `inbox@sandboxc05a10505af141d5b6fc8a6abfb3d6de.mailgun.org`
- `permits@sandboxc05a10505af141d5b6fc8a6abfb3d6de.mailgun.org`
- `support@sandboxc05a10505af141d5b6fc8a6abfb3d6de.mailgun.org`
- `anything@sandboxc05a10505af141d5b6fc8a6abfb3d6de.mailgun.org`

**All emails sent to any address at your Mailgun domain will be received!**

## 🔧 Setting Up Mailgun to Forward Emails to Your Webhook

### Step 1: Get Your Webhook URL

Your webhook endpoint is:
```
https://your-domain.com/api/emails/webhook
```

**For local development/testing:**
- You need to use a service like **ngrok** to expose your local server
- Or deploy to a publicly accessible URL (Vercel, etc.)

**For production:**
- Use your deployed URL: `https://your-domain.com/api/emails/webhook`

### Step 2: Configure Mailgun Routes

1. **Log into Mailgun Dashboard**: https://app.mailgun.com/
2. **Go to Routes**: Click on **Receiving** → **Routes** in the left sidebar
3. **Create a New Route**:
   - Click **"Create New Route"** button
   - **Filter Expression**: 
     ```
     match_recipient(".*@sandboxc05a10505af141d5b6fc8a6abfb3d6de.mailgun.org")
     ```
     (This matches ALL emails to your domain)
   
   - **Actions**: 
     - Click **"Store"** (to store in Mailgun)
     - Click **"Forward"** → Enter your webhook URL:
       ```
       https://your-domain.com/api/emails/webhook
       ```
   
   - **Description**: "Forward all incoming emails to webhook"
   - Click **"Create Route"**

### Step 3: Verify Your Webhook is Accessible

Your webhook endpoint must:
- ✅ Be publicly accessible (not just localhost)
- ✅ Accept POST requests
- ✅ Return HTTP 200 status
- ✅ Handle form-data (not JSON)

**Test your webhook:**
```bash
curl -X POST https://your-domain.com/api/emails/webhook \
  -F "sender=test@example.com" \
  -F "recipient=inbox@sandboxc05a10505af141d5b6fc8a6abfb3d6de.mailgun.org" \
  -F "subject=Test Email" \
  -F "body-plain=This is a test"
```

Expected response:
```json
{
  "success": true,
  "emailId": "...",
  "message": "Email received and saved"
}
```

## 📨 How It Works

1. **Client sends email** → `inbox@sandboxc05a10505af141d5b6fc8a6abfb3d6de.mailgun.org`
2. **Mailgun receives email** → Processes it through your route
3. **Mailgun forwards to webhook** → POSTs to `/api/emails/webhook`
4. **Your webhook processes email**:
   - Extracts permit ID from subject/body
   - Looks up permit details
   - Identifies client vs city email
   - Saves to database
5. **Email appears in Permit Inbox** → Shows up immediately!

## 🧪 Testing Email Receiving

### Test 1: Send from Any Email Address

1. From **any email address** (Gmail, Outlook, etc.), send an email to:
   ```
   inbox@sandboxc05a10505af141d5b6fc8a6abfb3d6de.mailgun.org
   ```

2. **Subject**: Include permit ID (optional):
   ```
   Question about [Permit: 1234567890abcdef12345678]
   ```
   Or just mention the permit name in the body.

3. **Body**: 
   ```
   Hello, I have a question about my permit application.
   [Permit: 1234567890abcdef12345678]
   
   When will my permit be approved?
   ```

4. **Check Permit Inbox**: The email should appear within seconds!

### Test 2: Send with Permit ID in Subject

Send an email with subject:
```
Re: Building Permit [Permit: 1234567890abcdef12345678]
```

The system will automatically:
- Extract permit ID
- Look up permit details
- Link email to the permit
- Show in Permit Inbox

### Test 3: Send Without Permit ID

Just send a regular email:
```
To: inbox@sandboxc05a10505af141d5b6fc8a6abfb3d6de.mailgun.org
Subject: Question about my permit
Body: I need help with my permit application.
```

The system will:
- Still receive the email
- Show in Permit Inbox
- Allow you to manually link to a permit if needed

## 🔍 Checking Received Emails

1. **In Permit Inbox**:
   - Go to your website
   - Click "Permit Inbox"
   - See all received emails (when `test=false`, shown as cards)
   - When `test=true`, shown in email format

2. **In Mailgun Dashboard**:
   - Go to **Receiving** → **Logs**
   - See all incoming emails
   - Check webhook delivery status

3. **In Database**:
   - All emails are saved to `PermitEmail` collection
   - Check MongoDB for stored emails

## ⚙️ Environment Variables

Make sure these are set in your `.env.local`:

```env
MAILGUN_API_KEY=6237f6ace56660138012944ee86bd354-42b8ce75-5a55294a
MAILGUN_DOMAIN=sandboxc05a10505af141d5b6fc8a6abfb3d6de.mailgun.org
FROM_EMAIL=postmaster@sandboxc05a10505af141d5b6fc8a6abfb3d6de.mailgun.org
FROM_NAME=Pilot Permit Management
EMAIL_TEST_MODE=true
```

## 🚨 Troubleshooting

### Email Not Appearing in Permit Inbox

1. **Check Mailgun Route**:
   - Go to Mailgun Dashboard → Receiving → Routes
   - Verify route is active
   - Check filter expression matches your domain
   - Verify webhook URL is correct

2. **Check Webhook Logs**:
   - Go to Mailgun Dashboard → Receiving → Logs
   - Find your email
   - Check "Actions" column - should show webhook delivery
   - If failed, check error message

3. **Check Your Server Logs**:
   - Look for webhook requests in console
   - Check for errors in processing
   - Verify database connection

4. **Test Webhook Directly**:
   - Use curl (as shown above)
   - Or use Postman to test webhook endpoint
   - Verify it returns success

### Webhook Not Receiving Requests

1. **Verify URL is Public**:
   - Webhook must be accessible from internet
   - Use ngrok for local testing
   - Or deploy to production

2. **Check Route Priority**:
   - Make sure your route is at the top
   - Mailgun processes routes in order
   - First matching route wins

3. **Verify Route Filter**:
   - Test filter expression in Mailgun
   - Make sure it matches your domain

### Permit Not Being Linked

1. **Include Permit ID in Email**:
   - Use format: `[Permit: ID]` in subject or body
   - Or include MongoDB ObjectId (24 hex chars)

2. **Check Permit Exists**:
   - Permit must exist in database
   - ID must be valid MongoDB ObjectId

3. **Check Webhook Logs**:
   - Look for permit lookup errors
   - Check console for extraction messages

## 📝 Important Notes

1. **Sandbox Domain Limitations**:
   - Sandbox domains work for receiving ALL emails
   - No restrictions on who can send TO your domain
   - Only restrictions on sending FROM your domain (must be to authorized recipients)

2. **Email Formatting**:
   - Plain text emails work perfectly
   - HTML emails are also supported
   - Attachments are preserved

3. **Automatic Extraction**:
   - Permit ID can be in subject or body
   - Supports formats: `[Permit: ID]`, `Permit ID: ID`, or MongoDB ObjectId
   - Client name extracted from email sender

4. **Production Setup**:
   - For production, use your own verified domain
   - Set up proper DNS records
   - Configure routes in Mailgun
   - Use production webhook URL

## ✅ Summary

**Receiving Email Address:**
```
inbox@sandboxc05a10505af141d5b6fc8a6abfb3d6de.mailgun.org
```

**Webhook Endpoint:**
```
https://your-domain.com/api/emails/webhook
```

**To receive emails:**
1. Set up Mailgun route to forward to webhook
2. Send email to any address at your Mailgun domain
3. Email automatically appears in Permit Inbox!
