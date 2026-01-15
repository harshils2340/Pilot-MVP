# Email Functionality for Permit Inbox

## Overview

The Permit Inbox now supports two modes:
1. **City Feedback Mode (test=false)**: Shows the traditional city feedback items
2. **Email Mode (test=true)**: Shows actual email functionality with ability to send and receive emails

## Configuration

The test mode is controlled by a backend environment variable:

```bash
EMAIL_TEST_MODE=true  # Enable email functionality
EMAIL_TEST_MODE=false # Use city feedback mode (default)
```

Set this in your `.env.local` file:

```env
EMAIL_TEST_MODE=true
FROM_EMAIL=noreply@pilot.com
FROM_NAME=Pilot Permit Management
NEXT_PUBLIC_EMAIL_APP_URL=https://mail.google.com  # Optional: URL for "Open Email App" button
```

## API Endpoints

### GET `/api/emails/config`
Returns the current test mode configuration.

### GET `/api/emails`
Fetch emails for the permit inbox.
Query parameters:
- `permitId` (optional): Filter by permit ID
- `clientId` (optional): Filter by client ID
- `status` (optional): Filter by status ('unread', 'read', 'all')
- `limit` (optional): Number of results (default: 50)
- `skip` (optional): Number to skip (default: 0)

### POST `/api/emails`
Create a new email (for sending or receiving).

### POST `/api/emails/send`
Send an email. Requires `EMAIL_TEST_MODE=true`.

### POST `/api/emails/webhook`
Webhook endpoint for receiving emails from your email service provider.
Requires `EMAIL_TEST_MODE=true`.

### GET `/api/emails/[id]`
Get a specific email by ID.

### PATCH `/api/emails/[id]`
Update an email (e.g., mark as read, archive).

## Database Schema

Emails are stored in MongoDB with the following schema:
- `permitId`: Reference to permit
- `permitName`: Name of the permit
- `subject`: Email subject
- `from`: Sender information
- `to`: Recipient information
- `body`: Email body text
- `htmlBody`: HTML version (optional)
- `attachments`: Array of attachments
- `direction`: 'inbound' or 'outbound'
- `status`: 'unread', 'read', 'replied', 'archived'
- `priority`: 'high', 'medium', 'low'
- `receivedAt`: Timestamp
- `threadId`: For grouping related emails
- `inReplyTo`: Reference to parent email

## Features

### When test=false (City Feedback Mode):
- Shows traditional city feedback items
- Displays permits requiring action
- Shows priority, wait times, and summaries

### When test=true (Email Mode):
- Displays emails sorted by most recent first
- Shows unread indicators
- Email detail modal with full content
- Email composer for sending emails
- "Open Email App" button to open external email client
- Reply functionality
- Attachment support

## Integration with Email Services

To actually send/receive emails, you'll need to integrate with an email service provider:

### SendGrid Example:
```typescript
// In /api/emails/send/route.ts
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
await sgMail.send({
  to: to.email,
  from: { email: fromEmail, name: fromName },
  subject,
  text: emailBody,
  html: htmlBody,
});
```

### AWS SES Example:
```typescript
// Similar integration with AWS SES SDK
```

### Webhook Setup:
Configure your email service provider to send webhooks to `/api/emails/webhook` when emails are received.

## Notes

- The test mode flag is checked on the backend, so you can change it without frontend changes
- Emails are automatically sorted by most recent first
- Unread emails are highlighted with a blue border
- The inbox refreshes every 30 seconds when in email mode
