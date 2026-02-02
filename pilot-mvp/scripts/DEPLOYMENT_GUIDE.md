# Gmail Add-on Programmatic Deployment Guide

This guide explains how to programmatically deploy the Gmail add-on using the Google Apps Script API.

## Prerequisites

1. **Enable Apps Script API**
   - Go to https://script.google.com/home/usersettings
   - Enable "Google Apps Script API"
   - Click "Save"

2. **Create OAuth 2.0 Credentials**
   - Go to https://console.cloud.google.com/apis/credentials
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Desktop app" or "Web application"
   - Name: "Gmail Add-on Deployer"
   - Authorized redirect URIs: `http://localhost:3000/oauth2callback`
   - Click "Create"
   - Copy the **Client ID** and **Client Secret**

3. **Set Environment Variables**
   ```bash
   export GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
   export GOOGLE_CLIENT_SECRET="your-client-secret"
   # Optional: if updating existing project
   export GOOGLE_APPS_SCRIPT_ID="your-script-id"
   ```

   Or create a `.env.local` file:
   ```env
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   GOOGLE_APPS_SCRIPT_ID=your-script-id  # Optional
   ```

## Deployment Steps

### Option 1: Using npm script (Recommended)

```bash
npm run deploy:gmail-addon
```

### Option 2: Using ts-node directly

```bash
ts-node scripts/deploy-gmail-addon.ts
```

### What Happens

1. **First Time**: You'll be prompted to authorize the application
   - A URL will be displayed
   - Open it in your browser
   - Authorize the app
   - Copy the authorization code from the redirect URL
   - Paste it into the terminal
   - The token will be saved to `.gmail-addon-token.json`

2. **Subsequent Deployments**: The script will use the saved token
   - If the token expires, it will automatically refresh
   - If refresh fails, you'll be prompted to re-authorize

3. **Project Creation/Update**:
   - If `GOOGLE_APPS_SCRIPT_ID` is set, it updates the existing project
   - Otherwise, it creates a new project
   - Uploads `Code.gs` and `appsscript.json`

4. **Deployment**:
   - Creates a new deployment
   - Displays the Script ID and Deployment ID

## Post-Deployment Steps

After running the script, you still need to:

1. **Go to Google Apps Script**
   - Visit https://script.google.com
   - Open your project (use the Script ID from the output)

2. **Deploy as Add-on**
   - Click "Deploy" → "Deploy as add-on"
   - Fill in the add-on details:
     - **Name**: Pilot MVP
     - **Description**: Gmail add-on for permit management
     - **Logo**: (optional) Upload a logo
   - Click "Deploy"

3. **Install in Gmail**
   - The deployment will provide an installation link
   - Or go to Gmail → Settings → Add-ons → Install

## Troubleshooting

### "Missing OAuth credentials"
- Make sure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
- Check that the credentials are correct

### "Token refresh failed"
- Delete `.gmail-addon-token.json` and run again
- You'll be prompted to re-authorize

### "Script ID not found"
- The script ID might be incorrect
- Remove `GOOGLE_APPS_SCRIPT_ID` to create a new project
- Or verify the ID at https://script.google.com

### "Permission denied"
- Make sure Apps Script API is enabled
- Check that your OAuth credentials have the correct scopes
- Try re-authorizing

## Automation Tips

### CI/CD Integration

You can integrate this into CI/CD, but note:
- OAuth flow requires manual authorization the first time
- Use a service account for fully automated deployments (more complex setup)

### Updating Existing Deployment

1. Set `GOOGLE_APPS_SCRIPT_ID` to your existing script ID
2. Run `npm run deploy:gmail-addon`
3. The script will update the project and create a new deployment

### Version Management

Each deployment creates a new version. To manage versions:
- Go to https://script.google.com
- Open your project
- View → "Show manifest file" to see versions
- Deploy → "Manage deployments" to see all deployments

## Security Notes

- **Never commit** `.gmail-addon-token.json` to git (already in `.gitignore`)
- **Never commit** OAuth credentials to git
- Use environment variables or secure secret management
- Rotate credentials if compromised

## Next Steps

After successful deployment:
1. Test the add-on in Gmail
2. Monitor logs at https://script.google.com → Executions
3. Update the add-on by running the script again
4. Share the add-on with your team (if needed)

