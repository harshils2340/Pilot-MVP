# Client Email Setup Guide

## How Clients Can Send Emails to Your Website

There are two ways clients can send emails to your website:

### Option 1: Contact Form (Recommended for New Clients)

Create a contact form on your website that clients can fill out. This form will send emails directly to you.

**Frontend Form Example:**
```tsx
// Add this to your website (e.g., in a Contact page or Client Portal)
<form onSubmit={handleSubmit}>
  <input name="name" placeholder="Your name" required />
  <input name="email" type="email" placeholder="Your email" required />
  <input name="subject" placeholder="Subject" />
  <textarea name="message" placeholder="Your message" required />
  <button type="submit">Send Message</button>
</form>
```

**API Endpoint:** `POST /api/emails/client-send`

**Required Fields:**
- `name`: Client's name
- `email`: Client's email address
- `message`: The message content

**Optional Fields:**
- `subject`: Email subject (defaults to "Client Inquiry from [name]")
- `permitId`: If client mentions a specific permit
- `permitName`: If client mentions a permit name

### Option 2: Direct Email (For Existing Clients)

Clients can send emails directly to your email address, and Mailgun will forward them to your website via webhook.

**Setup Steps:**

1. **Configure Mailgun Webhook:**
   - Go to your Mailgun dashboard
   - Navigate to Settings → Webhooks
   - Add a new webhook for "Inbound Messages"
   - Set the webhook URL to: `https://yourdomain.com/api/emails/receive`
   - Save the webhook

2. **Configure Mailgun Route (Optional):**
   - In Mailgun dashboard, go to Receiving → Routes
   - Create a route that forwards emails to your webhook endpoint
   - Or use Mailgun's default forwarding

3. **Client Sends Email:**
   - Client sends email to your Mailgun email address (e.g., `inbox@yourdomain.com`)
   - Mailgun receives the email
   - Mailgun calls your webhook (`/api/emails/receive`)
   - Email is saved to your database
   - Email appears in Permit Inbox

## Mailgun Configuration

### Fixing 401 Forbidden Error

The 401 error usually means:
1. **Wrong API Key**: Make sure your API key is correct
2. **Wrong Domain**: Verify your Mailgun domain is correct
3. **API Key Permissions**: Ensure your API key has send permissions

**Check your Mailgun settings:**
1. Go to Mailgun Dashboard → Settings → API Keys
2. Verify your API key matches: `36f9636f3881296e8dfb2fa354a6af67-42b8ce75-13887a73`
3. Check your domain: Should be `sandbox.mailgun.org` (for testing) or your custom domain

**For Sandbox Domain:**
- You can only send to authorized recipients
- Go to Mailgun Dashboard → Sending → Authorized Recipients
- Add the email addresses you want to send to

**Environment Variables:**
```env
MAILGUN_API_KEY=36f9636f3881296e8dfb2fa354a6af67-42b8ce75-13887a73
MAILGUN_DOMAIN=sandbox.mailgun.org  # or your custom domain
FROM_EMAIL=postmaster@sandbox.mailgun.org  # or your verified email
FROM_NAME=Pilot Permit Management
ADMIN_EMAIL=your-email@example.com  # Where client emails should be sent
EMAIL_TEST_MODE=true
```

## Testing

1. **Test Sending Email:**
   - Use the "Send Reply" button in the City Feedback section
   - Check Mailgun logs for delivery status

2. **Test Receiving Email:**
   - Send an email to your Mailgun address
   - Check if it appears in Permit Inbox
   - Verify it's saved in the database

## Troubleshooting

- **401 Forbidden**: Check API key and domain
- **Email not received**: Check Mailgun logs and spam folder
- **Webhook not working**: Verify webhook URL is accessible and Mailgun can reach it
