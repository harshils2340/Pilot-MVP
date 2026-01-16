# Fix Path Mismatch - Mailgun Route vs API Route

## 🔴 The Problem

Your Mailgun route is forwarding to:
```
https://trypilot.vercel.app/api/emails/inbound
```

But your API route file is at:
```
src/app/api/emails/webhook/route.ts
```

**This is a PATH MISMATCH!** The route doesn't exist at `/api/emails/inbound`, so you get a 405 error.

## ✅ The Fix

I've created a new route file at the correct path that Mailgun expects:

**Created:** `src/app/api/emails/inbound/route.ts`

This file:
- ✅ Matches the Mailgun route path (`/api/emails/inbound`)
- ✅ Handles POST requests from Mailgun
- ✅ Parses form-data correctly
- ✅ Saves emails to MongoDB
- ✅ Has proper error handling

## 🚀 Next Steps

### Step 1: Deploy to Vercel

**Option A: If using Git (Recommended)**

1. **Commit the new file**:
   ```bash
   git add src/app/api/emails/inbound/route.ts
   git commit -m "Add /api/emails/inbound route for Mailgun webhook"
   git push
   ```

2. **Vercel will auto-deploy** - wait for deployment to complete

**Option B: Manual Deploy**

1. Go to **Vercel Dashboard** → Your Project
2. Click **"Redeploy"** or push to trigger deployment
3. Wait for deployment to complete

### Step 2: Test the Route

**After deployment:**

1. **In Mailgun Dashboard** → **Receiving** → **Routes**
2. Scroll to **"Send a sample POST"** section
3. **Endpoint** should be: `https://trypilot.vercel.app/api/emails/inbound`
4. Click **"Post"**
5. **Expected response**:
   ```json
   {
     "success": true,
     "emailId": "...",
     "message": "Email received and saved"
   }
   ```

### Step 3: Test with Real Email

1. **Send an email** from your email account to:
   ```
   permits@sandboxc05a10505af141d5b6fc8a6abfb3d6de.mailgun.org
   ```

2. **Check Vercel Logs**:
   - Go to **Vercel Dashboard** → Your Project → **Deployments**
   - Click latest deployment → **Functions** tab
   - Look for `/api/emails/inbound`
   - Check logs for webhook activity

3. **Check Database**:
   - Email should be saved in MongoDB
   - Check `permitemails` collection

4. **Check Permit Inbox**:
   - Go to your website
   - Click "Permit Inbox"
   - Email should appear!

## 🔍 Verify Everything

### Check 1: Route File Exists

The file should be at:
```
pilot-mvp/src/app/api/emails/inbound/route.ts
```

### Check 2: Deployment Includes Route

1. Go to **Vercel Dashboard** → Your Project → **Deployments**
2. Click latest deployment → **Functions** tab
3. Should see `/api/emails/inbound` listed

### Check 3: Test Locally First (Optional)

```bash
npm run dev
```

Then test:
```bash
curl -X POST http://localhost:3000/api/emails/inbound \
  -F "sender=test@example.com" \
  -F "recipient=permits@sandboxc05a10505af141d5b6fc8a6abfb3d6de.mailgun.org" \
  -F "subject=Test" \
  -F "body-plain=Test body"
```

Should return:
```json
{
  "success": true,
  "emailId": "...",
  "message": "Email received and saved"
}
```

## 📝 Summary

**What was wrong:**
- Mailgun route: `/api/emails/inbound`
- API route file: `/api/emails/webhook/route.ts`
- **Path mismatch!**

**What I fixed:**
- Created `/api/emails/inbound/route.ts` to match Mailgun's expected path
- Route handles POST requests correctly
- Parses Mailgun form-data properly

**What you need to do:**
1. Deploy to Vercel (commit & push, or manual redeploy)
2. Test the route in Mailgun
3. Send a real email and verify it works

Once deployed, the 405 error should be gone and emails should start working!
