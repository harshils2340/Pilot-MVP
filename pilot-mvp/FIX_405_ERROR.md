# Fix 405 Method Not Allowed Error

## 🔴 The Problem

You're getting a **405 Method Not Allowed** error with a blank body when calling:
```
https://trypilot.vercel.app/api/emails/webhook
```

This means:
- ❌ The route exists but isn't accepting POST requests
- ❌ The deployment might be cached or outdated
- ❌ The route might not be properly built

## ✅ Step-by-Step Fix

### Step 1: Verify Route File Exists

The route file should be at:
```
pilot-mvp/src/app/api/emails/webhook/route.ts
```

**Check:**
- ✅ File exists at this path
- ✅ File exports `export async function POST(...)`
- ✅ File has proper imports

### Step 2: Rebuild and Redeploy

**The 405 error often happens when:**
- The route was added after deployment
- The deployment is cached
- The build didn't include the route

**Fix:**

1. **Commit and push your changes** (if using Git):
   ```bash
   git add .
   git commit -m "Add webhook route"
   git push
   ```

2. **Redeploy on Vercel**:
   - Go to **Vercel Dashboard** → Your Project
   - Click **"Redeploy"** on the latest deployment
   - OR push to your Git repository (auto-deploys)

3. **Wait for deployment** to complete

4. **Test again** after deployment finishes

### Step 3: Check Vercel Function Logs

1. **Go to Vercel Dashboard** → Your Project → **Deployments**
2. **Click on the latest deployment**
3. **Go to "Functions" tab**
4. **Look for** `/api/emails/webhook`
5. **Check logs** for any errors

**If the function doesn't appear:**
- The route isn't being built
- Check build logs for errors
- Make sure the file path is correct

### Step 4: Test the Route Directly

**Test with curl:**

```bash
curl -X POST https://trypilot.vercel.app/api/emails/webhook \
  -F "sender=test@example.com" \
  -F "recipient=permits@sandboxc05a10505af141d5b6fc8a6abfb3d6de.mailgun.org" \
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

**If you still get 405:**
- The route isn't deployed
- Need to redeploy

### Step 5: Verify Build Configuration

**Check `next.config.ts`:**

Make sure it doesn't have any routing restrictions:

```typescript
const nextConfig: NextConfig = {
  // Should not have rewrites/redirects that block /api/emails/webhook
};
```

**Check `vercel.json`:**

Make sure it doesn't have routing rules that block the API:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

### Step 6: Check Vercel Build Logs

1. **Go to Vercel Dashboard** → Your Project → **Deployments**
2. **Click on a deployment**
3. **Check "Build Logs"**
4. **Look for errors** related to:
   - API routes
   - Build failures
   - TypeScript errors

**Common issues:**
- TypeScript compilation errors
- Missing dependencies
- Build timeouts

## 🔍 Alternative: Test Locally First

**Before deploying, test locally:**

1. **Run locally**:
   ```bash
   npm run dev
   ```

2. **Test webhook**:
   ```bash
   curl -X POST http://localhost:3000/api/emails/webhook \
     -F "sender=test@example.com" \
     -F "recipient=permits@sandboxc05a10505af141d5b6fc8a6abfb3d6de.mailgun.org" \
     -F "subject=Test" \
     -F "body-plain=Test body"
   ```

3. **If it works locally** but not on Vercel:
   - Deployment issue
   - Need to redeploy
   - Check Vercel logs

4. **If it doesn't work locally**:
   - Code issue
   - Check server console for errors
   - Fix the code first

## 🚨 Common Causes of 405

1. **Route not deployed**: File added after last deployment
2. **Cached deployment**: Vercel serving old version
3. **Build error**: Route not included in build
4. **Path mismatch**: URL doesn't match file structure
5. **Method not exported**: POST function not properly exported

## ✅ Quick Fix Checklist

- [ ] Route file exists at correct path
- [ ] Route exports `POST` function
- [ ] Changes committed and pushed (if using Git)
- [ ] Vercel deployment triggered/redeployed
- [ ] Deployment completed successfully
- [ ] Tested with curl after deployment
- [ ] Checked Vercel function logs
- [ ] Checked Vercel build logs for errors

## 🎯 Most Likely Solution

**The 405 error is usually because the route wasn't included in the deployment.**

**Fix:**
1. **Redeploy on Vercel** (or push to Git to trigger auto-deploy)
2. **Wait for deployment to complete**
3. **Test again**

The route code looks correct - it just needs to be properly deployed!
