# Fix Webhook URL - Step by Step

## ⚠️ Important: Your Webhook URL is Still a Placeholder!

In your Mailgun route, the Forward URL is:
```
https://your-domain.com/api/emails/webhook
```

**This will NOT work!** You need to replace it with your actual URL.

## 🔍 What That "Status 200" Means

The "status: 200" you see in the "Send a sample POST" section is:
- ✅ Just a **test/sample** response from Mailgun
- ❌ **NOT** from your actual server
- ❌ Does **NOT** mean your webhook is working
- It's just showing you what Mailgun would send

## ✅ Step-by-Step Fix

### Step 1: Determine Your Webhook URL

**Option A: Local Development (Using ngrok)**

1. Make sure your Next.js server is running:
   ```bash
   npm run dev
   ```
   Should be on `http://localhost:3000`

2. In a **new terminal**, install and run ngrok:
   ```bash
   # If ngrok is not installed:
   npm install -g ngrok
   # Or download from: https://ngrok.com/download
   
   # Start ngrok:
   ngrok http 3000
   ```

3. **Copy the HTTPS URL** ngrok gives you:
   ```
   Forwarding   https://abc123-def456.ngrok-free.app -> http://localhost:3000
   ```
   Copy: `https://abc123-def456.ngrok-free.app`

4. Your webhook URL will be:
   ```
   https://abc123-def456.ngrok-free.app/api/emails/webhook
   ```

**Option B: Production (If Deployed)**

1. If your app is deployed to Vercel/Netlify/etc.
2. Your webhook URL is:
   ```
   https://your-app.vercel.app/api/emails/webhook
   ```
   (Replace with your actual deployed URL)

### Step 2: Update Mailgun Route

1. Go to **Mailgun Dashboard** → **Receiving** → **Routes**
2. **Click on your route** (the one with `match_recipient`)
3. Click **"Edit route"** or the edit icon
4. In the **Forward** section:
   - Find the input field with: `https://your-domain.com/api/emails/webhook`
   - **Delete it completely**
   - **Paste your actual URL**:
     - For ngrok: `https://abc123-def456.ngrok-free.app/api/emails/webhook`
     - For production: `https://your-app.vercel.app/api/emails/webhook`
5. Click **"Save"**

### Step 3: Verify Webhook is Accessible

**Test your webhook URL directly:**

Open your browser or use curl:
```bash
curl -X POST https://your-actual-url/api/emails/webhook \
  -F "sender=test@example.com" \
  -F "recipient=inbox@sandboxc05a10505af141d5b6fc8a6abfb3d6de.mailgun.org" \
  -F "subject=Test Email" \
  -F "body-plain=This is a test"
```

**Expected response:**
```json
{
  "success": true,
  "emailId": "...",
  "message": "Email received and saved"
}
```

**Check your server console** - you should see:
```
📧 Webhook received - Email incoming...
📦 Form data received, parsing...
✅ Email data extracted: ...
✅ Email saved to database: ...
```

### Step 4: Test with Real Email

**Only after Step 3 works:**

1. Send an email from your email account to:
   ```
   inbox@sandboxc05a10505af141d5b6fc8a6abfb3d6de.mailgun.org
   ```

2. **Check your server console** - you should see webhook logs

3. **Check Mailgun Logs**:
   - Go to **Receiving** → **Logs**
   - Find your email
   - Look at "Actions" column
   - Should show ✅ (green checkmark) if webhook succeeded

4. **Check Permit Inbox**:
   - Go to your website
   - Click "Permit Inbox"
   - Email should appear there!

## 🚨 Common Issues

### Issue 1: ngrok URL Changes

**Problem**: Every time you restart ngrok, the URL changes.

**Solution**: 
- Use ngrok's reserved domains (paid plan)
- Or deploy to production (recommended)
- Or manually update Mailgun route each time

### Issue 2: Webhook Returns 404

**Problem**: URL path is wrong.

**Solution**: Make sure the path is exactly:
```
/api/emails/webhook
```
Not `/api/emails/webhook/` (no trailing slash)

### Issue 3: Webhook Timeout

**Problem**: Mailgun waits 30 seconds, then times out.

**Solution**: 
- Check your server is running
- Check database connection
- Look at server logs for errors

## ✅ Quick Checklist

Before sending a real email, make sure:

- [ ] Webhook URL is your **actual URL** (not `your-domain.com`)
- [ ] Webhook is **publicly accessible** (using ngrok or production)
- [ ] You've **tested the webhook directly** (curl test works)
- [ ] Server is **running** and showing logs
- [ ] Mailgun route is **saved** with correct URL
- [ ] Forward action is **enabled** (toggle is ON)

## 🎯 What to Do Right Now

**DO NOT send an email yet!**

1. **First, set up ngrok** (if local) or get your production URL
2. **Update Mailgun route** with the actual URL
3. **Test the webhook** using curl (Step 3 above)
4. **Only then** send a real email

If you send an email before fixing the URL, it will fail because Mailgun can't reach `your-domain.com`.
