# Quick Setup Guide - Gmail Add-on

## What You Need to Do

Follow these steps to set up the Gmail add-on on your system:

### Step 1: Open Google Apps Script
- Go to: https://script.google.com
- Sign in with your Google account

### Step 2: Create New Project
- Click **"New Project"** or the **"+"** button
- Delete the default code in `Code.gs`

### Step 3: Copy Code Files

**Copy Code.gs:**
1. Open `pilot-mvp/gmail-addon/Code.gs` from this repository
2. Copy ALL the code
3. Paste into Google Apps Script `Code.gs` file

**Copy appsscript.json:**
1. In Google Apps Script, click **Project Settings** (gear icon)
2. Check **"Show 'appsscript.json' manifest file in editor"**
3. Go back to **Editor** tab
4. Click `appsscript.json` in file list
5. Open `pilot-mvp/gmail-addon/appsscript.json` from repository
6. Copy ALL content
7. Paste into Google Apps Script `appsscript.json` file

### Step 4: Update API URL (If Needed)
- In `Code.gs`, search for `https://pilot-mvp.vercel.app`
- If your app uses a different URL, replace it everywhere
- Also update in `appsscript.json` under `openLinkUrlPrefixes`

### Step 5: Save Project
- Click **File** → **Save**
- Name it: "Pilot MVP Gmail Add-on"

### Step 6: Deploy Add-on
1. Click **Deploy** → **New deployment**
2. Click **Select type** → Choose **"Add-on"**
3. Click **Next**
4. Description: "Pilot MVP Gmail Add-on"
5. Click **Deploy**

### Step 7: Authorize
1. Click **"Authorize access"**
2. Choose your Google account
3. Click **"Advanced"**
4. Click **"Go to [Project Name] (unsafe)"**
5. Click **"Allow"**

### Step 8: Install in Gmail
1. Open Gmail: https://mail.google.com
2. Wait 2-3 minutes
3. Open any email
4. Look for **"Pilot MVP"** in the right sidebar
5. If not visible, click **"+"** in sidebar → Search "Pilot MVP" → Install

## Done! ✅

Now when you open any email in Gmail:
- The **"New Lead"** panel appears automatically
- Form fields are pre-filled from the email
- Three buttons at bottom: **Close**, **Save Changes**, **Add to Leads**
- Click **"Add to Leads"** to create the lead in Pilot MVP

## Troubleshooting

**Add-on not showing?**
- Wait 5-10 minutes
- Hard refresh Gmail (Ctrl+Shift+R)
- Check authorization was completed

**"Add to Leads" not working?**
- Verify Pilot MVP app is running
- Check API URL in Code.gs matches your deployment
- Check browser console for errors

---

For detailed instructions, see `INSTALLATION_STEPS.md`
