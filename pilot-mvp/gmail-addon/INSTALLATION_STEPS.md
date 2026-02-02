# Installing Your Gmail Add-on After Deployment

## The Problem
After deploying, the add-on doesn't automatically appear in Gmail. You need to **install** it separately.

## Step-by-Step Installation

### Method 1: From Apps Script (Recommended)

1. **Go to Apps Script**
   - Open https://script.google.com
   - Open your "Pilot MVP Gmail Add-on" project

2. **Manage Deployments**
   - Click **Deploy** → **Manage deployments**
   - You should see your deployment listed

3. **Install**
   - Click the **three dots** (⋮) next to your deployment
   - Select **"Install"** or **"Install add-on"**
   - OR click on the deployment to open details, then click **"Install"**

4. **Authorize**
   - A popup will ask for permissions
   - Click **"Allow"** or **"Authorize"**
   - Review and accept all permissions

5. **Test in Gmail**
   - Go to Gmail
   - Refresh the page (Cmd+Shift+R / Ctrl+Shift+R)
   - Open any email
   - The "Pilot MVP" sidebar should appear on the right

### Method 2: From Gmail Settings

1. **Open Gmail Settings**
   - Click the gear icon (⚙️) in Gmail
   - Click **"See all settings"**

2. **Go to Add-ons**
   - Click the **"Add-ons"** tab
   - Look for "Pilot MVP" in the list
   - If it's there, make sure it's **enabled**

3. **Or Install New Add-on**
   - In the right sidebar, click the **"+"** button
   - Click **"Get add-ons"**
   - Search for "Pilot MVP"
   - Click **"Install"**

### Method 3: Direct Installation URL

1. **Get Installation Link**
   - In Apps Script → Deploy → Manage deployments
   - Click on your deployment
   - Look for an **"Installation URL"** or **"Install link"**
   - Copy it

2. **Install**
   - Paste the URL in a new browser tab
   - Click **"Install"**
   - Authorize permissions

## Troubleshooting

### Add-on Still Not Appearing

1. **Check Installation Status**
   - Go to Gmail → Settings → Add-ons
   - Verify "Pilot MVP" is listed and enabled

2. **Check Permissions**
   - Make sure you authorized ALL permissions
   - Go to Apps Script → Project settings → OAuth scopes
   - Verify all scopes are approved

3. **Hard Refresh Gmail**
   - Press `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
   - Or clear browser cache

4. **Check for Errors**
   - Go to Apps Script → **Executions** tab
   - Look for any failed executions
   - Check error messages

5. **Verify Deployment Type**
   - Make sure you deployed as **"Deploy as add-on"** (not just "Deploy")
   - Check Deploy → Manage deployments
   - The deployment should show as "Gmail add-on" type

### "Install" Button Not Available

If you don't see an "Install" option:
- The deployment might be for testing only
- Try creating a new deployment: **Deploy** → **Deploy as add-on**
- Make sure you're the owner of the Apps Script project

### Add-on Appears But Doesn't Work

1. **Check Executions**
   - Apps Script → Executions tab
   - Look for errors when opening emails

2. **Check API Endpoint**
   - Verify `https://pilot-mvp.vercel.app/api/crm/leads` is accessible
   - Test the endpoint in a browser

3. **Check Manifest**
   - Verify `appsscript.json` has correct `onTriggerFunction: "onGmailMessage"`
   - Verify `Code.gs` has the `onGmailMessage` function

## Quick Checklist

- [ ] Deployed as "Deploy as add-on" (not just "Deploy")
- [ ] Clicked "Install" after deployment
- [ ] Authorized all permissions
- [ ] Refreshed Gmail (hard refresh)
- [ ] Opened an email to test
- [ ] Checked Apps Script → Executions for errors
- [ ] Verified add-on is enabled in Gmail Settings → Add-ons

## Expected Result

After successful installation:
- Open any email in Gmail
- Right sidebar should show "Pilot MVP" header
- Form fields should be visible
- "Add to Leads" button should work

## Still Not Working?

1. **Re-deploy**
   - Deploy → Manage deployments
   - Delete old deployment
   - Deploy → Deploy as add-on (create new)

2. **Check Script ID**
   - The Script ID is in the Apps Script URL
   - Format: `https://script.google.com/home/projects/YOUR_SCRIPT_ID/edit`
   - Make sure you're working with the correct project

3. **Contact Support**
   - Check Apps Script → Executions for detailed error logs
   - Share error messages for debugging
