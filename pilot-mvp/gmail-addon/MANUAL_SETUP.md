# Manual Gmail Add-on Setup (Alternative to Script)

If you prefer to set up the Gmail add-on manually instead of using the deployment script:

## Step 1: Create New Apps Script Project

1. Go to https://script.google.com
2. Click **"+ New project"**
3. Name it "Pilot MVP Gmail Add-on"

## Step 2: Add Code.gs

1. In the editor, you'll see `Code.gs` is already open
2. Delete the default code
3. Copy the entire contents of `/gmail-addon/Code.gs` from this repo
4. Paste it into the editor

## Step 3: Add appsscript.json (Manifest)

**Option A: View Existing Manifest**
1. Click **View** → **Show manifest file** (or **View** → **Manifest file**)
2. If `appsscript.json` appears, replace its contents with the manifest from `/gmail-addon/appsscript.json`

**Option B: Create New Manifest File**
1. Click the **"+"** button next to **Files** in the left sidebar
2. Select **"Script file"** (or **"JSON file"** if available)
3. Name it exactly: `appsscript.json`
4. Paste the entire contents of `/gmail-addon/appsscript.json` from this repo

## Step 4: Save

1. Click **File** → **Save** (or `Cmd+S` / `Ctrl+S`)
2. Give your project a name if prompted

## Step 5: Deploy as Add-on

1. Click **Deploy** → **Deploy as add-on**
2. Fill in the details:
   - **Name**: Pilot MVP
   - **Description**: Gmail add-on for permit management
   - **Logo**: (optional) Upload a logo from `/public/logo.png`
3. Click **Deploy**
4. Click **Install** when prompted

## Step 6: Test in Gmail

1. Open Gmail
2. Open any email
3. Look for the **Pilot MVP** sidebar on the right
4. The add-on should appear automatically

## Troubleshooting

### "Manifest file not found"
- Make sure the file is named exactly `appsscript.json` (case-sensitive)
- It should be in the root of your project files

### "Invalid manifest"
- Check that the JSON is valid (no trailing commas, proper quotes)
- Use a JSON validator if needed

### "Add-on doesn't appear in Gmail"
- Make sure you clicked **Deploy** → **Deploy as add-on** (not just "Deploy")
- Check that you installed it after deployment
- Refresh Gmail and try opening a different email

## File Locations Reference

```
Your Apps Script Project:
├── Code.gs              ← Paste from /gmail-addon/Code.gs
└── appsscript.json      ← Paste from /gmail-addon/appsscript.json
```

