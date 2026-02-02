# Testing Your Gmail Add-on

## Quick Test Steps

### 1. Deploy the Add-on

In Google Apps Script:
1. Click **Deploy** → **Deploy as add-on**
2. Fill in:
   - **Name**: Pilot MVP
   - **Description**: Gmail add-on for permit management
   - **Logo**: (optional)
3. Click **Deploy**
4. Click **Install** when prompted
5. Authorize all permissions

### 2. Test in Gmail

1. **Open Gmail** (refresh if already open)
2. **Open any email** (click on an email to view it)
3. **Look for the sidebar** on the right side of the email
4. You should see **"Pilot MVP"** with:
   - Client/Lead information (if email matches existing client/lead)
   - New Lead form with fields:
     - Name
     - Email
     - Company
     - Phone
     - Note
   - Buttons: "Close", "Save Changes", "Add to Leads"

### 3. Test the Functionality

#### Test 1: View Existing Client/Lead
- Open an email from an email address that matches a client or lead in your system
- The add-on should show their information at the top
- Click "View Client in Pilot" or "View Lead in Pilot" to open in your app

#### Test 2: Create New Lead
- Open an email from a new sender
- Fill in the form:
  - **Name**: Required
  - **Email**: Required (auto-filled from sender)
  - **Company**: Optional
  - **Phone**: Optional
  - **Note**: Optional
- Click **"Add to Leads"**
- You should see a success notification
- The lead should appear in your Pilot MVP dashboard

#### Test 3: Save Changes
- Fill in the form fields
- Click **"Save Changes"**
- You should see a confirmation notification
- The form data is saved (ready to add later)

### 4. Troubleshooting

#### Add-on doesn't appear
- ✅ Make sure you clicked **"Deploy as add-on"** (not just "Deploy")
- ✅ Make sure you **installed** it after deployment
- ✅ **Refresh Gmail** (hard refresh: Cmd+Shift+R or Ctrl+Shift+R)
- ✅ Try opening a **different email**
- ✅ Check Gmail Settings → Add-ons → Manage add-ons

#### "Error loading add-on"
- ✅ Check Apps Script → **Executions** tab for errors
- ✅ Make sure `onGmailMessage` function exists in `Code.gs`
- ✅ Verify `appsscript.json` has correct `onTriggerFunction: "onGmailMessage"`

#### "Permission denied" or "Unable to access email"
- ✅ Make sure you authorized all permissions during installation
- ✅ Check Apps Script → **Project settings** → OAuth scopes
- ✅ Re-install the add-on if needed

#### "Failed to add lead" error
- ✅ Check that your API is running: `https://pilot-mvp.vercel.app/api/crm/leads`
- ✅ Check Apps Script → **Executions** tab for API errors
- ✅ Verify the API endpoint is accessible and returns correct format

### 5. View Logs

To debug issues:
1. Go to Apps Script → **Executions** tab
2. Click on any execution to see logs
3. Check for errors or console.log outputs

### 6. Test Different Email Scenarios

- ✅ Email from existing client
- ✅ Email from existing lead
- ✅ Email from new sender
- ✅ Email with company name in "From" field
- ✅ Email with just email address (no name)

## Expected Behavior

### When Email Matches Existing Client
```
┌─────────────────────────┐
│ Pilot MVP               │
│ Client & Lead Info      │
├─────────────────────────┤
│ Type: Client            │
│ Business: [Name]        │
│ Jurisdiction: [Location]│
│ [View Client in Pilot]  │
├─────────────────────────┤
│ New Lead                │
│ [Form fields...]        │
│ [Add to Leads button]   │
└─────────────────────────┘
```

### When Email is New
```
┌─────────────────────────┐
│ Pilot MVP               │
│ Client & Lead Info      │
├─────────────────────────┤
│ New Lead                │
│ Name: [auto-filled]     │
│ Email: [auto-filled]    │
│ Company: [optional]     │
│ Phone: [optional]       │
│ Note: [optional]        │
│ [Add to Leads button]   │
└─────────────────────────┘
```

## Quick Checklist

- [ ] Deployed as add-on (not just "Deploy")
- [ ] Installed in Gmail
- [ ] Authorized all permissions
- [ ] Refreshed Gmail
- [ ] Opened an email
- [ ] Sidebar appears on the right
- [ ] Can see "Pilot MVP" header
- [ ] Form fields are visible
- [ ] "Add to Leads" button works
- [ ] Lead appears in dashboard after adding

## Need Help?

If something doesn't work:
1. Check **Apps Script → Executions** for errors
2. Check **Apps Script → Project settings** for OAuth scopes
3. Verify your API is running and accessible
4. Try re-deploying the add-on

