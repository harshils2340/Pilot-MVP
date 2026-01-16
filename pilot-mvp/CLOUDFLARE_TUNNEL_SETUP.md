# Cloudflare Tunnel Webhook Setup

## ✅ Your Cloudflare Tunnel URL

Your tunnel URL is:
```
https://movements-behind-importantly-validation.trycloudflare.com
```

## ⚠️ The Problem

You're getting a 404 error because the URL is **missing the webhook path**!

**Current (Wrong):**
```
https://movements-behind-importantly-validation.trycloudflare.com
```

**Correct URL:**
```
https://movements-behind-importantly-validation.trycloudflare.com/api/emails/webhook
```

## 🔧 Step-by-Step Fix

### Step 1: Update Mailgun Route

1. Go to **Mailgun Dashboard** → **Receiving** → **Routes**
2. Click on your route to edit it
3. In the **Forward** destination field, update it to:
   ```
   https://movements-behind-importantly-validation.trycloudflare.com/api/emails/webhook
   ```
   **Make sure to add `/api/emails/webhook` at the end!**
4. Click **"Save"**

### Step 2: Test in Mailgun

1. In Mailgun Dashboard, go to **Receiving** → **Routes**
2. Scroll down to **"Send a sample POST"** section
3. In the **Endpoint** field, enter:
   ```
   https://movements-behind-importantly-validation.trycloudflare.com/api/emails/webhook
   ```
4. Click **"Post"**
5. You should now see a **success response** (status 200) with:
   ```json
   {
     "success": true,
     "emailId": "...",
     "message": "Email received and saved"
   }
   ```

### Step 3: Verify Server Logs

When the webhook is called, check your Next.js server console. You should see:
```
📧 Webhook received - Email incoming...
📦 Form data received, parsing...
✅ Email data extracted: ...
✅ Email saved to database: ...
```

### Step 4: Test with Real Email

Once the sample POST works:

1. Send an email from your email account to:
   ```
   inbox@sandboxc05a10505af141d5b6fc8a6abfb3d6de.mailgun.org
   ```
2. Check your server console for webhook logs
3. Check Mailgun logs (Receiving → Logs) for delivery status
4. Check Permit Inbox on your website

## 📝 Important Notes

### Cloudflare Tunnel URLs

- **Free tier**: URLs change every time you restart the tunnel
- **If you restart your tunnel**: The URL will change, and you'll need to update Mailgun route again
- **For production**: Consider deploying to Vercel/Netlify for a permanent URL

### Keep Tunnel Running

- Make sure your **Cloudflare tunnel is running** while testing
- Make sure your **Next.js server is running** (`npm run dev`)
- If either stops, the webhook won't work

### Testing Checklist

- [ ] Cloudflare tunnel is running
- [ ] Next.js server is running (`npm run dev`)
- [ ] Webhook URL includes `/api/emails/webhook` path
- [ ] Mailgun route is saved with correct URL
- [ ] Sample POST test returns success (200)
- [ ] Server console shows webhook logs

## 🚨 Common Issues

### Issue: Still Getting 404

**Check:**
1. URL includes `/api/emails/webhook` path
2. Next.js server is running
3. Cloudflare tunnel is running and connected
4. No typos in the URL

### Issue: Tunnel URL Changed

**Solution:**
- Update Mailgun route with new URL
- Or use Cloudflare's paid plan for static URLs
- Or deploy to production for permanent URL

### Issue: Webhook Works but Email Not in Database

**Check:**
1. Database connection in server logs
2. MongoDB connection string is correct
3. Server logs show "Email saved to database"
