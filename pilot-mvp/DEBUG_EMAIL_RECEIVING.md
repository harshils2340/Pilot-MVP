# Debug Email Receiving - Step by Step

## 🔍 Troubleshooting Steps

### Step 1: Check if Webhook is Being Called

**Check your Next.js server console** when you send an email. You should see:

```
📧 Webhook received - Email incoming...
📦 Form data received, parsing...
✅ Email data extracted: { from: '...', to: '...', ... }
✅ Email saved to database: { emailId: '...', ... }
📋 Full email details: { ... }
```

**If you DON'T see these logs:**
- ❌ Webhook is not being called
- Check Mailgun route configuration
- Verify webhook URL is correct
- Check Mailgun logs (Receiving → Logs)

### Step 2: Check Mailgun Logs

1. Go to **Mailgun Dashboard** → **Receiving** → **Logs**
2. Find the email you sent
3. Check the **Actions** column:
   - ✅ **Green checkmark** = Webhook called successfully
   - ❌ **Red X** = Webhook failed
   - ⚠️ **Yellow warning** = Webhook pending/retrying

4. **Click on the email** to see details:
   - Check **Delivery Status**
   - Check **Error Message** (if any)
   - Check **Webhook Response**

### Step 3: Check Database

**Verify email is saved in MongoDB:**

1. Connect to your MongoDB database
2. Check the `permitemails` collection
3. Look for the email you sent
4. Verify these fields:
   - `direction`: Should be `'inbound'`
   - `status`: Should be `'unread'`
   - `clientName`: Should have a value (your name or email prefix)
   - `from.email`: Should be your email address
   - `to.email`: Should be `permits@sandboxc05a10505af141d5b6fc8a6abfb3d6de.mailgun.org`

### Step 4: Check API Response

**Test the API directly:**

1. Open browser console or use curl:
   ```bash
   curl http://localhost:3000/api/emails?status=all&limit=100
   ```
   Or visit: `http://localhost:3000/api/emails?status=all&limit=100`

2. **Check the response:**
   - Should include your email in the `emails` array
   - Should have `test: true` (if EMAIL_TEST_MODE=true)
   - Should show all emails (not filtered)

### Step 5: Check Frontend

**Check browser console:**

1. Open your website
2. Open browser DevTools (F12)
3. Go to **Console** tab
4. Look for:
   - API calls to `/api/emails`
   - Any error messages
   - Email data being fetched

5. **Check Network tab:**
   - Find request to `/api/emails?status=all&limit=100`
   - Check response - should include your email
   - Check status code (should be 200)

### Step 6: Verify Test Mode

**Check environment variable:**

1. Make sure `.env.local` has:
   ```env
   EMAIL_TEST_MODE=true
   ```

2. **Restart your server** after changing `.env.local`:
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

3. **Verify test mode in API:**
   - Visit: `http://localhost:3000/api/emails/config`
   - Should return: `{ "test": true }`

## 🐛 Common Issues and Fixes

### Issue 1: Webhook Not Being Called

**Symptoms:**
- No logs in server console
- Mailgun logs show webhook not called

**Fixes:**
1. Check Mailgun route is active
2. Verify webhook URL is correct (includes `/api/emails/webhook`)
3. Make sure Cloudflare tunnel is running
4. Make sure Next.js server is running

### Issue 2: Email Saved But Not Showing

**Symptoms:**
- Server logs show email saved
- Database has the email
- But not in Permit Inbox

**Fixes:**
1. Check `EMAIL_TEST_MODE=true` in `.env.local`
2. Restart server after changing `.env.local`
3. Refresh the Permit Inbox page
4. Check browser console for errors
5. Check API response includes the email

### Issue 3: Email Missing clientName

**Symptoms:**
- Email saved but `clientName` is null/empty
- Email not showing in inbox

**Fixes:**
- The webhook now extracts client name from:
  - Email sender name (if provided)
  - Email prefix for personal emails (e.g., "john" from "john@gmail.com")
  - Domain name for company emails
- Check server logs to see what `clientName` was extracted

### Issue 4: Email Filtered Out

**Symptoms:**
- Email in database
- But not in API response

**Fixes:**
1. When `test=true`, API should return ALL emails
2. Check API query - should not filter by `clientName` when `test=true`
3. Verify `EMAIL_TEST_MODE=true` is set correctly

## ✅ Quick Debug Checklist

- [ ] Webhook logs appear in server console
- [ ] Mailgun logs show webhook called successfully
- [ ] Email exists in MongoDB database
- [ ] Email has `direction: 'inbound'` and `status: 'unread'`
- [ ] Email has `clientName` set (not null/empty)
- [ ] `EMAIL_TEST_MODE=true` in `.env.local`
- [ ] Server restarted after changing `.env.local`
- [ ] API endpoint `/api/emails?status=all` returns the email
- [ ] Frontend is fetching from `/api/emails?status=all&limit=100`
- [ ] Browser console shows no errors
- [ ] Permit Inbox page is refreshed

## 🔧 Manual Test

**Test the webhook directly:**

```bash
curl -X POST https://your-cloudflare-url/api/emails/webhook \
  -F "sender=your-email@gmail.com" \
  -F "recipient=permits@sandboxc05a10505af141d5b6fc8a6abfb3d6de.mailgun.org" \
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

**Check server console** - should see all the logs.

**Then check database** - email should be there.

**Then check API** - email should be in response.

**Then check frontend** - email should appear in Permit Inbox.
