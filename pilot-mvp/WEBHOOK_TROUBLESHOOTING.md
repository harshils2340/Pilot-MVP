# Webhook Troubleshooting Guide

## ❌ Problem: Email Not Appearing in Permit Inbox

You sent an email to `inbox@sandboxc05a10505af141d5b6fc8a6abfb3d6de.mailgun.org` but it's not showing up.

## 🔍 Step 1: Check Your Webhook URL

**The issue:** In your Mailgun route, the webhook URL is set to:
```
https://your-domain.com/api/emails/webhook
```

**This is a PLACEHOLDER!** You need to replace it with your actual URL.

### Option A: Using ngrok (For Local Development)

1. **Install ngrok** (if not already installed):
   - Download from: https://ngrok.com/download
   - Or use: `npm install -g ngrok`

2. **Start your Next.js server**:
   ```bash
   npm run dev
   ```
   Your server should be running on `http://localhost:3000`

3. **Start ngrok** in a new terminal:
   ```bash
   ngrok http 3000
   ```

4. **Copy your ngrok URL**:
   - You'll see something like: `https://abc123.ngrok-free.app`
   - Copy this URL

5. **Update Mailgun Route**:
   - Go to Mailgun Dashboard → Receiving → Routes
   - Click "Edit route" on your existing route
   - Change the Forward destination to:
     ```
     https://abc123.ngrok-free.app/api/emails/webhook
     ```
     (Replace `abc123.ngrok-free.app` with your actual ngrok URL)
   - Click "Save"

### Option B: Deploy to Production (Recommended)

1. **Deploy your app** to Vercel, Netlify, or your hosting provider
2. **Get your production URL** (e.g., `https://your-app.vercel.app`)
3. **Update Mailgun Route**:
   - Go to Mailgun Dashboard → Receiving → Routes
   - Click "Edit route"
   - Change Forward destination to:
     ```
     https://your-app.vercel.app/api/emails/webhook
     ```
   - Click "Save"

## 🔍 Step 2: Verify Webhook is Being Called

### Check Mailgun Logs:

1. Go to **Mailgun Dashboard** → **Receiving** → **Logs**
2. Find the email you sent
3. Look at the **Actions** column:
   - ✅ **Green checkmark** = Webhook called successfully
   - ❌ **Red X** = Webhook failed
   - ⚠️ **Yellow warning** = Webhook pending/retrying

### Check Webhook Response:

Click on the email in Mailgun logs and check:
- **Delivery Status**: Should show "200 OK" or "Success"
- **Error Message**: If failed, it will show why

### Common Errors:

1. **"Connection refused"** or **"Timeout"**:
   - Webhook URL is not accessible
   - Use ngrok for local testing
   - Or deploy to production

2. **"404 Not Found"**:
   - Webhook URL path is wrong
   - Should be: `/api/emails/webhook`
   - Check for typos in the URL

3. **"500 Internal Server Error"**:
   - Webhook endpoint has an error
   - Check your server logs
   - Check console for error messages

## 🔍 Step 3: Check Your Server Logs

When Mailgun calls your webhook, you should see logs in your console:

**Expected logs:**
```
📧 Webhook received - Email incoming...
📦 Form data received, parsing...
✅ Email data extracted: { from: '...', to: '...', ... }
✅ Email saved to database: { emailId: '...', ... }
```

**If you don't see these logs:**
- Webhook is not being called
- Check Mailgun route configuration
- Verify webhook URL is correct

**If you see error logs:**
- Check the error message
- Fix the issue
- Test again

## 🔍 Step 4: Test Your Webhook Directly

Test if your webhook endpoint works:

### Using curl (in terminal):

```bash
curl -X POST https://your-domain.com/api/emails/webhook \
  -F "sender=test@example.com" \
  -F "recipient=inbox@sandboxc05a10505af141d5b6fc8a6abfb3d6de.mailgun.org" \
  -F "subject=Test Email" \
  -F "body-plain=This is a test email body"
```

**Expected response:**
```json
{
  "success": true,
  "emailId": "...",
  "message": "Email received and saved"
}
```

**If you get an error:**
- Check the error message
- Verify the endpoint path is correct
- Check server is running

### Using Postman:

1. Create a new POST request
2. URL: `https://your-domain.com/api/emails/webhook`
3. Body type: `form-data`
4. Add fields:
   - `sender`: `test@example.com`
   - `recipient`: `inbox@sandboxc05a10505af141d5b6fc8a6abfb3d6de.mailgun.org`
   - `subject`: `Test Email`
   - `body-plain`: `This is a test email`
5. Send request
6. Check response

## 🔍 Step 5: Verify Route Configuration

In Mailgun Dashboard → Receiving → Routes:

1. **Expression should be**:
   ```
   *@sandboxc05a10505af141d5b6fc8a6abfb3d6de.mailgun.org
   ```
   Or use:
   ```
   match_recipient(".*@sandboxc05a10505af141d5b6fc8a6abfb3d6de.mailgun.org")
   ```

2. **Forward action should be ON** (blue toggle)

3. **Forward destination should be**:
   ```
   https://your-actual-domain.com/api/emails/webhook
   ```
   (NOT `https://your-domain.com/api/emails/webhook`)

4. **Priority should be 0** (or higher than other routes)

## 🔍 Step 6: Check Database

Even if webhook is called, email might not be saved. Check:

1. **Open MongoDB/your database**
2. **Check `PermitEmail` collection**
3. **Look for the email** you sent
4. **Verify it exists**

If email exists in database but not in UI:
- Check `test` mode setting
- Refresh the page
- Check if filtering is applied

## ✅ Quick Checklist

- [ ] Webhook URL is your actual domain (not placeholder)
- [ ] Webhook is publicly accessible (using ngrok or production URL)
- [ ] Mailgun route is active and correct
- [ ] Forward action is enabled in route
- [ ] Server is running and logs are visible
- [ ] Database connection is working
- [ ] Test mode is enabled (`EMAIL_TEST_MODE=true`)

## 🚀 Quick Fix Steps

1. **Get your actual webhook URL**:
   - If local: Use ngrok (`ngrok http 3000`)
   - If production: Use your deployed URL

2. **Update Mailgun route**:
   - Replace `https://your-domain.com/api/emails/webhook`
   - With your actual URL: `https://abc123.ngrok-free.app/api/emails/webhook`

3. **Test the webhook**:
   - Send test email using curl or Postman
   - Check server logs for confirmation

4. **Send real email**:
   - Send email to `inbox@sandboxc05a10505af141d5b6fc8a6abfb3d6de.mailgun.org`
   - Check Mailgun logs
   - Check server logs
   - Check Permit Inbox

## 📝 Notes

- **ngrok free tier**: URLs change every time you restart ngrok
- **Production URLs**: Are permanent and don't change
- **Webhook timeout**: Mailgun waits 30 seconds for response
- **Retries**: Mailgun will retry failed webhooks automatically

## 🆘 Still Not Working?

1. Check all steps above
2. Share your:
   - Webhook URL you're using
   - Mailgun logs screenshot
   - Server console logs
   - Any error messages
