# Your Work Steps - Gmail Add-on Setup

## What You Need to Do on Your System

Follow these steps exactly to get the Gmail add-on working:

### ✅ Step 1: Prepare the Files

1. **Locate these files in your project:**
   - `pilot-mvp/gmail-addon/Code.gs`
   - `pilot-mvp/gmail-addon/appsscript.json`

2. **Keep them open** - you'll need to copy their contents

### ✅ Step 2: Go to Google Apps Script

1. Open your web browser
2. Navigate to: **https://script.google.com**
3. Sign in with your **Google account** (same one you use for Gmail)

### ✅ Step 3: Create New Project

1. Click the **"+"** button or **"New Project"**
2. You'll see a blank project with `Code.gs` file

### ✅ Step 4: Copy Code.gs

1. **Select all** the default code in `Code.gs` and **delete it**
2. Open `pilot-mvp/gmail-addon/Code.gs` from your project
3. **Select all** (Ctrl+A / Cmd+A) and **copy** (Ctrl+C / Cmd+C)
4. Go back to Google Apps Script
5. **Paste** into the `Code.gs` file (Ctrl+V / Cmd+V)

### ✅ Step 5: Enable Manifest File

1. Click **"Project Settings"** (gear icon) in left sidebar
2. Scroll down to **"Script properties"**
3. Check the box: **"Show 'appsscript.json' manifest file in editor"**
4. Click **"Editor"** tab to go back

### ✅ Step 6: Copy appsscript.json

1. You should now see `appsscript.json` in the file list
2. **Click on `appsscript.json`**
3. **Delete all** default content
4. Open `pilot-mvp/gmail-addon/appsscript.json` from your project
5. **Copy all** content
6. **Paste** into Google Apps Script `appsscript.json`

### ✅ Step 7: Update API URL (Important!)

1. In `Code.gs`, press **Ctrl+F** (or Cmd+F) to search
2. Search for: `https://pilot-mvp.vercel.app`
3. If your Pilot MVP app is at a **different URL**, replace all occurrences
4. Also check `appsscript.json` - update `openLinkUrlPrefixes` if needed

### ✅ Step 8: Save the Project

1. Click **"File"** → **"Save"** (or press Ctrl+S / Cmd+S)
2. Enter project name: **"Pilot MVP Gmail Add-on"**
3. Click **"OK"**

### ✅ Step 9: Change GCP Project Type (Required for Deployment)

**IMPORTANT:** Before deploying, you need to switch from Apps Script-managed to user-managed GCP project.

1. Click **"Deploy"** button (top right)
2. Click **"Select type"** dropdown (gear icon)
3. Choose **"Add-on"**
4. You'll see a dialog saying: *"This Apps Script project is using an Apps Script-managed Google Cloud Platform (GCP) project. To deploy an Add-on to the Google Workspace Marketplace, you'll need to switch this Apps Script project to use a user-managed Google Cloud Platform (GCP) project."*
5. Click **"Change project type"** button
6. A new dialog will appear - click **"Change project type"** again to confirm
7. You'll be redirected to Google Cloud Console
8. **If you don't have a Google Cloud Project yet:**
   - Click **"Create Project"**
   - Enter project name: **"Pilot MVP Gmail Add-on"**
   - Click **"Create"**
   - Wait for project creation (may take 30-60 seconds)
9. **If you already have a project:**
   - Select your existing project from the dropdown
10. Click **"Set project"** or **"Link project"**
11. You'll be redirected back to Apps Script
12. The dialog should now show your user-managed project
13. The **"Deploy"** button should now be **active** (no longer greyed out)

**Note:** If you see any errors during this process:
- Make sure you're signed in with the correct Google account
- Ensure you have permission to create/manage Google Cloud projects
- Try refreshing the page and starting again

### ✅ Step 10: Configure OAuth Consent Screen (IMPORTANT!)

**This step is required to avoid "Access blocked" errors!**

1. Go to **Google Cloud Console**: https://console.cloud.google.com
2. Make sure you have **"Pilot MVP Gmail Add-on"** project selected (top dropdown)
3. In the left sidebar, go to **"APIs & Services"** → **"OAuth consent screen"**
4. If you see a setup screen:
   - **User Type:** Select **"Internal"** (if you have Google Workspace) or **"External"** (if using personal Gmail)
   - Click **"Create"**
5. Fill in the required fields:
   - **App name:** `Pilot MVP`
   - **User support email:** Your email (`shahmeet8210@gmail.com`)
   - **Developer contact information:** Your email
   - Click **"Save and Continue"**
6. **Add Test Users (CRITICAL STEP):**
   - Scroll down to **"Test users"** section
   - Click **"+ ADD USERS"**
   - Enter your email: **`shahmeet8210@gmail.com`**
   - Click **"Add"**
   - Click **"Save and Continue"**
7. Review and click **"Back to Dashboard"**

**Note:** If you're using a personal Gmail account, the app will remain in "Testing" mode. This is fine for personal use.

### ✅ Step 11: Deploy as Add-on

1. Go back to **Google Apps Script**: https://script.google.com
2. Open your **"Pilot MVP Gmail Add-on"** project
3. Click **"Deploy"** → **"Select type"** → **"Add-on"**
4. In the deployment dialog, enter description: **"Pilot MVP Gmail Add-on for lead management"**
5. Click **"Deploy"**
6. You may see a warning about OAuth consent screen - click **"Continue"** or **"Authorize"**

### ✅ Step 12: Authorize Permissions

1. A popup appears - click **"Authorize access"**
2. Select your **Google account**
3. You may see: **"This app isn't verified"**
4. Click **"Advanced"**
5. Click **"Go to Pilot MVP Gmail Add-on (unsafe)"**
6. Click **"Allow"**
7. You'll see a success message with Deployment ID

### ✅ Step 13: Install in Gmail

1. Open **Gmail** in a new tab: 
2. **Wait 2-3 minutes** for the add-on to be available
3. **Open any email** (click on it to view)
4. Look for **"Pilot MVP"** in the **right sidebar**
5. If you don't see it:
   - Click the **"+"** icon in Gmail sidebar
   - Search for **"Pilot MVP"**
   - Click **"Install"** or **"Enable"**

### ✅ Step 14: Test It

1. **Open any email** in Gmail
2. You should see the **"Pilot MVP"** sidebar on the right
3. The **"New Lead"** panel should show with:
   - **Name** field (pre-filled)
   - **Email** field (pre-filled)
   - **Company** field (pre-filled if available)
   - **Phone** field (empty)
   - **Note** field (pre-filled with email subject)
4. **Three buttons at the bottom:**
   - **Close** - Closes/clears the form
   - **Save Changes** - Validates and saves form data
   - **Add to Leads** - Creates lead in Pilot MVP

## Testing the "Add to Leads" Button

1. **Fill in or edit** the form fields
2. Click **"Add to Leads"**
3. You should see a **success notification**
4. **Check your Pilot MVP website** → Go to **Leads section**
5. The new lead should appear with all the information you entered

## What Each Button Does

### Close Button
- Shows a notification that form is cleared
- Form data remains visible (you can continue editing)

### Save Changes Button
- Validates that Name and Email are filled
- Shows confirmation that form is ready
- Does NOT create the lead yet

### Add to Leads Button
- Validates Name and Email are required
- Sends all form data to Pilot MVP API
- Creates the lead in your Leads section
- Shows success notification
- Opens Pilot MVP dashboard (optional)

## Troubleshooting

### Add-on Not Appearing
- **Wait 5-10 minutes** after deployment
- **Hard refresh Gmail**: Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Check that you completed authorization
- Verify add-on is enabled in Gmail

### "Add to Leads" Not Working
- Check that your Pilot MVP app is **running and accessible**
- Verify the API URL in `Code.gs` is correct
- Check browser console (F12) for errors
- Ensure `/api/gmail/lead-intake` endpoint is working

### Form Not Pre-filling
- This is normal for some email formats
- You can **manually fill** the fields
- The add-on extracts what it can from the email

## Success Checklist

After setup, verify:

- [ ] Add-on appears in Gmail when opening emails
- [ ] "New Lead" panel shows with all form fields
- [ ] Fields are pre-filled from email sender
- [ ] All three buttons are visible and clickable
- [ ] "Add to Leads" creates lead successfully
- [ ] Lead appears in Pilot MVP Leads section
- [ ] All lead information (name, email, company, phone, notes) is saved

## Next Steps

Once everything is working:

1. **Test with different emails** to ensure it works consistently
2. **Add leads** from various email sources
3. **Customize** if needed (change API URLs, add more fields, etc.)

---

**That's all you need to do!** The Gmail add-on will now automatically show the "New Lead" information panel whenever you open an email, with three action buttons ready to use.
