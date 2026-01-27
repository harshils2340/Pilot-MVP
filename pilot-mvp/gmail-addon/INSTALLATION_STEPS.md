# Gmail Add-on Installation Steps - Complete Guide

Follow these steps to install and set up the Pilot MVP Gmail Add-on on your system.

## Prerequisites

- A Google account with access to Gmail
- Access to Google Apps Script (free with Google account)
- Your Pilot MVP application deployed and accessible

## Step-by-Step Installation

### Step 1: Open Google Apps Script

1. Open your web browser
2. Go to [https://script.google.com](https://script.google.com)
3. Sign in with your Google account (the same one you use for Gmail)

### Step 2: Create a New Project

1. Click the **"+"** button or **"New Project"** button
2. You'll see a blank project with default code (`Code.gs`)

### Step 3: Copy the Code File

1. **Delete all the default code** in the `Code.gs` file
2. Open the file `pilot-mvp/gmail-addon/Code.gs` from this repository
3. **Select all** the code (Ctrl+A / Cmd+A)
4. **Copy** the code (Ctrl+C / Cmd+C)
5. Go back to Google Apps Script
6. **Paste** the code into the `Code.gs` file (Ctrl+V / Cmd+V)

### Step 4: Enable and Update the Manifest File

1. In Google Apps Script, click on the **"Project Settings"** icon (gear icon) in the left sidebar
2. Scroll down and check the box **"Show 'appsscript.json' manifest file in editor"**
3. Click **"Editor"** tab (file icon) to go back to the code editor
4. You should now see `appsscript.json` in the file list on the left
5. **Click on `appsscript.json`** to open it
6. **Delete all the default content**
7. Open the file `pilot-mvp/gmail-addon/appsscript.json` from this repository
8. **Copy all the content** from `appsscript.json`
9. **Paste** it into the Google Apps Script `appsscript.json` file

### Step 5: Verify API URL (Important!)

1. In the `Code.gs` file, search for `https://pilot-mvp.vercel.app`
2. If your Pilot MVP app is deployed at a different URL, replace all occurrences with your actual URL
3. Also update the URL in `appsscript.json` under `openLinkUrlPrefixes`

### Step 6: Save the Project

1. Click **"File"** → **"Save"** (or press `Ctrl+S` / `Cmd+S`)
2. Give your project a name (e.g., "Pilot MVP Gmail Add-on")
3. Click **"OK"**

### Step 7: Deploy the Add-on

1. Click the **"Deploy"** button (or click **"Deploy"** → **"New deployment"**)
2. Click the **"Select type"** dropdown (gear icon)
3. Choose **"Add-on"**
4. Click **"Next"**
5. Fill in the deployment details:
   - **Description**: "Pilot MVP Gmail Add-on for lead management"
   - **Version**: Leave as "New version" (or create a new version)
6. Click **"Deploy"**

### Step 8: Authorize the Deployment

1. A popup will appear asking you to authorize
2. Click **"Authorize access"**
3. Choose your Google account
4. You may see a warning: **"This app isn't verified"**
5. Click **"Advanced"**
6. Click **"Go to [Project Name] (unsafe)"**
7. Click **"Allow"** to grant permissions
8. You'll see a success message with a **Deployment ID** - you can copy this for reference

### Step 9: Install in Gmail

1. Open [Gmail](https://mail.google.com) in a new tab
2. **Wait 2-3 minutes** for the add-on to be available
3. Open any email (click on it to view)
4. Look for the **"Pilot MVP"** add-on in the right sidebar
5. If you don't see it:
   - Click the **"+"** icon in the Gmail sidebar
   - Search for "Pilot MVP"
   - Click **"Install"** or **"Enable"**

### Step 10: Test the Add-on

1. **Open any email** in Gmail
2. The **"Pilot MVP"** sidebar should appear on the right
3. You should see:
   - **Client & Lead Information** (if sender is in your system)
   - **New Lead** panel with form fields:
     - Name (pre-filled)
     - Email (pre-filled)
     - Company (pre-filled if available)
     - Phone (empty)
     - Note (pre-filled with email subject)
   - **Three buttons at the bottom**:
     - **Close** - Closes the panel
     - **Save Changes** - Saves form data
     - **Add to Leads** - Creates lead in Pilot MVP

## How to Use

### Adding a Lead from Gmail

1. **Open an email** in Gmail
2. The **"New Lead"** panel appears automatically in the sidebar
3. **Review and edit** the pre-filled information:
   - Name, Email, Company, Phone, Note
4. Click one of the three buttons:
   - **Close** - Closes the panel without saving
   - **Save Changes** - Saves your edits (form data is preserved)
   - **Add to Leads** - Creates the lead in Pilot MVP with all the information

### What Happens When You Click "Add to Leads"

1. The add-on validates that Name and Email are filled
2. Sends all form data to Pilot MVP API
3. Creates a new lead in your Leads section
4. Shows a success notification
5. Optionally opens the Pilot MVP dashboard

## Troubleshooting

### Add-on Not Appearing in Gmail

**Solution:**
- Wait 5-10 minutes after deployment
- Hard refresh Gmail: Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Check that you authorized the deployment
- Verify the add-on is enabled in Gmail settings

### "Error: Failed to add lead"

**Solution:**
- Check that your Pilot MVP app is running and accessible
- Verify the API URL in `Code.gs` matches your deployment
- Check browser console for errors
- Ensure the `/api/gmail/lead-intake` endpoint is working

### Form Fields Not Pre-filling

**Solution:**
- This is normal for some email formats
- You can manually fill in the fields
- The email parsing extracts what it can from the "From" field

### Permission Errors

**Solution:**
- Make sure you clicked "Allow" during authorization
- Check that all required OAuth scopes are granted
- Try redeploying the add-on

## Verification Checklist

After installation, verify:

- [ ] Add-on appears in Gmail sidebar when opening emails
- [ ] "New Lead" panel shows with form fields
- [ ] Fields are pre-filled from email sender
- [ ] All three buttons (Close, Save Changes, Add to Leads) are visible
- [ ] "Add to Leads" button creates a lead successfully
- [ ] Lead appears in Pilot MVP Leads section
- [ ] Success notification appears after adding lead

## Next Steps

Once installed:

1. **Test with a few emails** to ensure everything works
2. **Add leads** from various email sources
3. **Check the Leads section** in Pilot MVP to verify leads are created
4. **Customize** the add-on if needed (change API URLs, styling, etc.)

## Support

If you encounter issues:

1. Check the Google Apps Script **"Executions"** tab for error logs
2. Verify all API endpoints are accessible
3. Ensure your Google account has necessary permissions
4. Review the `README.md` file for additional information

---

**That's it!** Your Gmail add-on is now installed and ready to use. Open any email in Gmail to see the "New Lead" information panel with the three action buttons.
