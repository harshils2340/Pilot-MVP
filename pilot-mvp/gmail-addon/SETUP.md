# Gmail Add-on Setup Guide - Complete Instructions

This guide will walk you through setting up the Pilot MVP Gmail Add-on from start to finish. Once set up, you'll be able to add leads directly from Gmail emails and see client/lead information in the sidebar.

## Prerequisites

- A Google account with access to Gmail
- Access to Google Apps Script (free with Google account)
- Your Pilot MVP application deployed at `https://pilot-mvp.vercel.app` (or your custom domain)

## Step-by-Step Setup

### Step 1: Open Google Apps Script

1. Go to [Google Apps Script](https://script.google.com)
2. Sign in with your Google account (the same one you use for Gmail)

### Step 2: Create a New Project

1. Click **"New Project"** (or the **"+"** button)
2. You'll see a blank project with default code (`Code.gs`)

### Step 3: Replace the Default Code

1. **Delete all the default code** in `Code.gs`
2. Open the file `pilot-mvp/gmail-addon/Code.gs` from this repository
3. **Copy the entire contents** of `Code.gs`
4. **Paste it** into the Google Apps Script editor (replacing the default code)

### Step 4: Update the Manifest File

1. In Google Apps Script, click on **"Project Settings"** (gear icon) in the left sidebar
2. Check the box **"Show 'appsscript.json' manifest file in editor"**
3. Go back to the **"Files"** tab (file icon)
4. You should now see `appsscript.json` in the file list
5. **Click on `appsscript.json`** to open it
6. **Delete all the default content**
7. Open the file `pilot-mvp/gmail-addon/appsscript.json` from this repository
8. **Copy the entire contents** of `appsscript.json`
9. **Paste it** into the Google Apps Script editor

### Step 5: Verify API URL (Optional)

If your Pilot MVP app is deployed at a different URL than `https://pilot-mvp.vercel.app`:

1. In `Code.gs`, search for `https://pilot-mvp.vercel.app`
2. Replace all occurrences with your actual deployment URL
3. In `appsscript.json`, update the `openLinkUrlPrefixes` array with your URL

### Step 6: Save the Project

1. Click **"File"** → **"Save"** (or press `Ctrl+S` / `Cmd+S`)
2. Give your project a name (e.g., "Pilot MVP Gmail Add-on")
3. Click **"OK"**

### Step 7: Deploy the Add-on

1. Click **"Deploy"** → **"New deployment"** (or the deploy icon)
2. Click the **"Select type"** dropdown and choose **"Add-on"**
3. Click **"Next"**
4. Fill in the deployment details:
   - **Description**: "Pilot MVP Gmail Add-on for lead management"
   - **Version**: "New version" (or leave as default)
5. Click **"Deploy"**
6. **Authorize the deployment:**
   - Click **"Authorize access"**
   - Choose your Google account
   - Click **"Advanced"** → **"Go to [Project Name] (unsafe)"**
   - Click **"Allow"** to grant permissions
7. **Copy the deployment ID** (you'll see it in the success message)

### Step 8: Install the Add-on in Gmail

1. Open [Gmail](https://mail.google.com)
2. Open any email (click on it to view)
3. Look for the **Pilot MVP** add-on in the right sidebar
4. If you don't see it:
   - Click the **"+"** icon in the Gmail sidebar
   - Search for "Pilot MVP"
   - Click **"Install"**

### Step 9: Test the Add-on

1. **Open any email** in Gmail
2. You should see the **Pilot MVP** sidebar on the right
3. The sidebar should show:
   - **Client & Lead Information** (if the sender is in your system)
   - **New Lead** form with pre-filled information
   - **Auto-Detected from Email** section
   - **Quick Intake Forms** section

## Using the Add-on

### Adding a Lead from an Email

1. **Open an email** in Gmail
2. The **"New Lead"** form will appear in the sidebar with:
   - **Name** (pre-filled from sender)
   - **Email** (pre-filled from sender)
   - **Company** (pre-filled if available)
   - **Phone** (optional - you can fill this in)
   - **Notes** (pre-filled with email subject)
3. **Review and edit** any fields as needed
4. Click **"Add to Leads"** button
5. You'll see a success notification
6. The lead will be added to your Pilot MVP Leads section

### Viewing Client/Lead Information

- When you open an email from someone who is already a client or lead in Pilot MVP, you'll see their information displayed at the top of the sidebar
- Click **"View Client in Pilot"** or **"View Lead in Pilot"** to open their full details page

## Troubleshooting

### Add-on Not Appearing in Gmail

1. **Check deployment**: Make sure you completed Step 7 and authorized the deployment
2. **Refresh Gmail**: Hard refresh (`Ctrl+Shift+R` or `Cmd+Shift+R`)
3. **Check permissions**: Ensure you granted all required permissions
4. **Wait a few minutes**: Sometimes it takes a few minutes for the add-on to appear

### "Error: Failed to add lead"

1. **Check API URL**: Verify your Pilot MVP app is accessible at the URL in `Code.gs`
2. **Check network**: Ensure you have internet connectivity
3. **Check logs**: In Google Apps Script, go to **"Executions"** to see error logs

### Form Fields Not Pre-filling

- This is normal for emails where the sender information can't be extracted
- You can manually fill in the fields before clicking "Add to Leads"

### API Errors

- Make sure your Pilot MVP backend is running and accessible
- Check that the `/api/gmail/lead-intake` endpoint is working
- Verify CORS settings if you're getting network errors

## Using from Notifications Section

You can also add leads directly from the **Notifications** section in Pilot MVP:

1. Go to the **Notifications** section in Pilot MVP
2. Find an email notification
3. Click the **"Add as lead"** button (UserPlus icon) next to the email
4. The lead will be created automatically and you'll be redirected to the Leads section

## Advanced Configuration

### Customizing the Add-on

- **Change colors/styling**: Edit the `CardService` widget styles in `Code.gs`
- **Add more fields**: Modify the `createAddToLeadsForm` function
- **Change API endpoints**: Update the URLs in `Code.gs`

### Multiple Deployments

- You can create multiple deployments for testing and production
- Use **"Test deployment"** for development
- Use **"Deploy"** for production use

## Support

If you encounter any issues:

1. Check the Google Apps Script **"Executions"** tab for error logs
2. Verify all API endpoints are accessible
3. Ensure your Google account has the necessary permissions
4. Review the `README.md` file for additional information

## Next Steps

Once the add-on is set up:

1. **Test with a few emails** to ensure everything works
2. **Add leads** from various email sources
3. **Check the Leads section** in Pilot MVP to verify leads are being created
4. **Customize** the add-on to fit your workflow

---

**That's it!** Your Gmail add-on is now fully functional. You can add leads directly from Gmail emails or from the Notifications section in Pilot MVP.
