# How to Send a Test Email

## Option 1: Send Test Email Through Your Website (Recommended)

Since your Mailgun account is activated, you can now send a test email through your website:

### Step 1: Update Your Environment Variables

Make sure your `.env.local` file has:

```env
MAILGUN_API_KEY=98fa7240afb9064487c5d5f2d5c8aaab-42b8ce75-169fccb2
MAILGUN_DOMAIN=sandboxc05a10505af141d5b6fc8a6abfb3d6de.mailgun.org
FROM_EMAIL=postmaster@sandboxc05a10505af141d5b6fc8a6abfb3d6de.mailgun.org
FROM_NAME=Pilot Permit Management
EMAIL_TEST_MODE=true
```

### Step 2: Add Authorized Recipient

**IMPORTANT**: For sandbox domain, you MUST add the recipient first:

1. Go to Mailgun Dashboard → **Sending** → **Authorized Recipients**
2. Click **Add Recipient**
3. Enter: `shahmeet8210@gmail.com`
4. Click **Save**
5. Check your email and click the verification link Mailgun sends

### Step 3: Restart Your Server

After updating `.env.local`:

1. Stop your server (Ctrl+C)
2. Start it again: `npm run dev`

### Step 4: Send Test Email

You can send a test email in two ways:

**Method A: Through Permit Inbox**
1. Go to your website
2. Click "Permit Inbox"
3. Click "Send First Email" or compose a new email
4. Send to: `shahmeet8210@gmail.com`

**Method B: Through City Feedback**
1. Open any permit
2. Go to "City Feedback" section
3. Reply to any city email or use "Send Reply"

## Option 2: Send Test Email via Mailgun Dashboard

You can also send a test email directly from Mailgun:

1. Go to Mailgun Dashboard
2. Click on **Sending** → **Send a test email** (or use the guide)
3. Fill in the form:
   - **To**: `shahmeet8210@gmail.com`
   - **Subject**: "Test Email"
   - **Message**: "This is a test email"
4. Click **Send**

## Important Notes

### From Email Address

For sandbox domains, Mailgun requires the "from" address to be:
```
postmaster@sandboxc05a10505af141d5b6fc8a6abfb3d6de.mailgun.org
```

I've updated the code to automatically use this format for sandbox domains.

### Authorized Recipients

With sandbox domain, you can **ONLY** send to:
- Email addresses you've added to "Authorized Recipients"
- Email addresses that have been verified

### After Sending

1. Check your inbox (`shahmeet8210@gmail.com`)
2. Check spam/junk folder if not in inbox
3. Check Mailgun Dashboard → **Sending** → **Logs** for delivery status

## Troubleshooting

### Email Not Received?

1. **Check Authorized Recipients**: Make sure `shahmeet8210@gmail.com` is added and verified
2. **Check Spam Folder**: Mailgun emails sometimes go to spam initially
3. **Check Mailgun Logs**: Go to Dashboard → Sending → Logs to see delivery status
4. **Wait a Few Minutes**: Sometimes there's a slight delay

### Still Getting Errors?

1. Make sure your account is activated (green checkmark in dashboard)
2. Verify the domain matches: `sandboxc05a10505af141d5b6fc8a6abfb3d6de.mailgun.org`
3. Check that API key is correct
4. Restart your server after updating environment variables

## Next Steps

Once the test email works:
- ✅ You can send emails through your website
- ✅ The "Send a test email" step in Mailgun guide will be complete
- ✅ You can proceed to set up a custom domain (optional)
