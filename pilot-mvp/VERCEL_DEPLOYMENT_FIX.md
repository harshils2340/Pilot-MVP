# Fix Vercel 404 Error for Webhook

## 🔴 The Problem

You're getting a 404 error:
```
The deployment could not be found on Vercel.
DEPLOYMENT_NOT_FOUND
```

This means either:
1. ❌ The deployment doesn't exist at `https://trypilot.vercel.com`
2. ❌ The deployment was deleted
3. ❌ The project isn't deployed to that URL
4. ❌ The API route isn't being included in the build

## ✅ Step-by-Step Fix

### Step 1: Verify Your Vercel Deployment

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Check your projects**:
   - Look for a project that should be at `trypilot.vercel.com`
   - Check if it exists and is deployed
3. **If project doesn't exist**:
   - You need to deploy it first
   - See Step 2 below

### Step 2: Deploy to Vercel (If Not Already Deployed)

**Option A: Deploy via Vercel Dashboard**

1. Go to https://vercel.com/new
2. **Import your Git repository**:
   - Connect GitHub/GitLab/Bitbucket
   - Select your repository
   - Click "Import"
3. **Configure project**:
   - Framework Preset: **Next.js**
   - Root Directory: `pilot-mvp` (if your Next.js app is in a subfolder)
   - Build Command: `npm run build` (should be auto-detected)
   - Output Directory: `.next` (should be auto-detected)
4. **Add Environment Variables**:
   - Click "Environment Variables"
   - Add these:
     ```
     MAILGUN_API_KEY=6237f6ace56660138012944ee86bd354-42b8ce75-5a55294a
     MAILGUN_DOMAIN=sandboxc05a10505af141d5b6fc8a6abfb3d6de.mailgun.org
     FROM_EMAIL=postmaster@sandboxc05a10505af141d5b6fc8a6abfb3d6de.mailgun.org
     FROM_NAME=Pilot Permit Management
     EMAIL_TEST_MODE=true
     MONGODB_URI=your-mongodb-connection-string
     ```
5. **Click "Deploy"**
6. **Wait for deployment** to complete
7. **Get your deployment URL** (e.g., `https://your-project.vercel.app`)

**Option B: Deploy via Vercel CLI**

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Navigate to your project**:
   ```bash
   cd pilot-mvp
   ```

4. **Deploy**:
   ```bash
   vercel
   ```
   - Follow the prompts
   - Select your project or create new one
   - Add environment variables when prompted

5. **Get your deployment URL** from the output

### Step 3: Verify the Correct URL

**Check your Vercel project settings:**

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Domains**
2. Check what domains are configured:
   - Production domain (e.g., `your-project.vercel.app`)
   - Custom domain (if any, e.g., `trypilot.vercel.com`)

**If `trypilot.vercel.com` doesn't exist:**

You have two options:

**Option 1: Use the default Vercel URL**
- Your webhook URL will be: `https://your-project.vercel.app/api/emails/webhook`
- Update Mailgun route to use this URL

**Option 2: Add Custom Domain**
1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter: `trypilot.vercel.com` (or your desired domain)
4. Follow Vercel's instructions to configure DNS
5. Wait for domain to be verified

### Step 4: Update Mailgun Route

1. **Go to Mailgun Dashboard** → **Receiving** → **Routes**
2. **Click on your route** to edit it
3. **Update Forward destination** to your actual Vercel URL:
   ```
   https://your-project.vercel.app/api/emails/webhook
   ```
   OR if you have custom domain:
   ```
   https://trypilot.vercel.com/api/emails/webhook
   ```
4. **Click "Save"**

### Step 5: Test the Webhook

1. **In Mailgun Dashboard** → **Receiving** → **Routes**
2. Scroll to **"Send a sample POST"** section
3. **Enter your webhook URL**:
   ```
   https://your-project.vercel.app/api/emails/webhook
   ```
4. **Click "Post"**
5. **Expected response**:
   ```json
   {
     "success": true,
     "emailId": "...",
     "message": "Email received and saved"
   }
   ```

### Step 6: Check Vercel Logs

1. **Go to Vercel Dashboard** → Your Project → **Deployments**
2. **Click on the latest deployment**
3. **Go to "Functions" tab**
4. **Check logs** for `/api/emails/webhook`
5. **You should see**:
   ```
   📧 Webhook received - Email incoming...
   📦 Form data received, parsing...
   ✅ Email saved to database: ...
   ```

## 🔍 Troubleshooting

### Issue 1: Deployment Not Found

**Check:**
- Is the project actually deployed?
- Is the URL correct?
- Was the deployment deleted?

**Fix:**
- Deploy the project (see Step 2)
- Use the correct Vercel URL from your dashboard

### Issue 2: API Route Not Working

**Check:**
- Is the route file at `src/app/api/emails/webhook/route.ts`?
- Does it export a `POST` function?
- Is it included in the build?

**Fix:**
- Make sure the file exists and exports `POST`
- Check Vercel build logs for errors
- Redeploy if needed

### Issue 3: Environment Variables Missing

**Check:**
- Are environment variables set in Vercel?
- Is `MONGODB_URI` configured?

**Fix:**
- Go to Vercel Dashboard → Project → Settings → Environment Variables
- Add all required variables
- Redeploy after adding variables

### Issue 4: Database Connection Failing

**Check:**
- Is MongoDB connection string correct?
- Is MongoDB accessible from Vercel?

**Fix:**
- Verify `MONGODB_URI` in Vercel environment variables
- Check MongoDB allows connections from Vercel IPs
- Check Vercel function logs for connection errors

## ✅ Quick Checklist

- [ ] Project is deployed to Vercel
- [ ] Deployment URL is correct (check Vercel dashboard)
- [ ] Environment variables are set in Vercel
- [ ] Mailgun route uses correct Vercel URL
- [ ] Webhook URL includes `/api/emails/webhook` path
- [ ] Sample POST test works in Mailgun
- [ ] Vercel function logs show webhook being called
- [ ] Database connection is working

## 🎯 Summary

**The main issue:** The deployment at `https://trypilot.vercel.com` doesn't exist or was deleted.

**The fix:**
1. Deploy your project to Vercel (if not already)
2. Get the correct URL from Vercel dashboard
3. Update Mailgun route to use the correct URL
4. Test the webhook

**Most likely solution:** You need to either:
- Deploy the project to Vercel first, OR
- Use the correct Vercel URL (which might be different from `trypilot.vercel.com`)

Check your Vercel dashboard to see what your actual deployment URL is!
