# Pilot MVP – Gmail Add-on

Add-on for Gmail that shows **client and lead information** in an information pane when viewing emails, and lets you create permits, clients, and add email senders as Leads.

## 🚀 Quick Start

**For complete setup instructions, see [SETUP.md](./SETUP.md)** - it has step-by-step instructions with screenshots and troubleshooting.

## Features

- **Client & Lead Information Pane**: When you open an email in Gmail, the add-on automatically looks up the sender's email address and displays their client or lead information (if they exist in Pilot). Shows details like:
  - **For Clients**: Business name, jurisdiction, status, active permits, contact email
  - **For Leads**: Name, email, company, stage, probability, source, email activity
  - Includes "View Client in Pilot" or "View Lead in Pilot" buttons to open the full details page
- **Add to Leads**: Add the email sender as a lead in Pilot's Leads section. Name, email, and company are prefilled from the message; you can edit before submitting. The lead is created with source `email` and assigned to the first pipeline stage.
- **Create Permit** / **Create Client**: Quick intake forms for permits and clients (uses `/api/gmail/intake` when configured).
- **Open Pilot Dashboard** / **Link to existing** / **Mark as processed**: Links and actions to Pilot and Gmail.

## Quick Setup (Summary)

1. Open [Google Apps Script](https://script.google.com), create a new project.
2. Copy the contents of `Code.gs` (replace default code) and `appsscript.json` (replace default manifest).
3. Deploy as **Add-on** → **New deployment** → **Test deployment** (or **Deploy** for your domain).
4. Install the add-on in Gmail (it will appear in the sidebar when you open emails).
5. Ensure the Pilot app is deployed and reachable at `https://pilot-mvp.vercel.app` (or update the base URL in `Code.gs` and `appsscript.json`).

**📖 For detailed step-by-step instructions, see [SETUP.md](./SETUP.md)**

## How It Works

### Information Pane

When you open an email in Gmail:
1. The add-on extracts the sender's email address from the "From" field
2. It calls `GET /api/gmail/lookup?email=<sender-email>` to check if the sender is a client or lead
3. If found, it displays an information pane at the top of the sidebar showing:
   - Client details (business name, jurisdiction, status, permits, etc.)
   - Lead details (name, stage, probability, email activity, etc.)
   - Action buttons to view the full client/lead page in Pilot

### Add to Leads

- Open an email in Gmail; the add-on sidebar appears.
- In **Quick Intake Forms**, use the **Add to Leads** section.
- **Lead Name** and **Lead Email** are prefilled from the sender; **Company** is optional.
- Click **Add to Leads**. The add-on calls `POST /api/gmail/lead-intake`; on success it shows a notification and can open the Pilot dashboard.

Leads created from the add-on use `source: 'email'` and are assigned to the first pipeline stage.
