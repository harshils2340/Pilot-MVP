# Email Setup Instructions

## Mailgun API Integration

The email sending functionality has been integrated with Mailgun using your API key.

### Environment Variables

Add these to your `.env.local` file:

```env
# Mailgun Configuration
MAILGUN_API_KEY=36f9636f3881296e8dfb2fa354a6af67-42b8ce75-13887a73
MAILGUN_DOMAIN=sandbox.mailgun.org  # Update with your actual Mailgun domain
FROM_EMAIL=noreply@pilot.com  # Update with your verified sender email
FROM_NAME=Pilot Permit Management

# Email Test Mode (optional)
EMAIL_TEST_MODE=true
```

### Important Notes

1. **Mailgun Domain**: 
   - If you're using Mailgun's sandbox domain (`sandbox.mailgun.org`), you can only send emails to authorized recipients (added in Mailgun dashboard)
   - For production, use your own verified domain

2. **Sender Email**:
   - The `FROM_EMAIL` must be a verified sender in your Mailgun account
   - For sandbox, use the format: `postmaster@sandbox.mailgun.org` or your verified email

3. **API Key**:
   - The API key is already configured in the code
   - For security, move it to environment variables in production

### How It Works

1. **Sending Emails**:
   - When you click "Send Reply" in the City Feedback section, the email is sent via Mailgun API
   - The email is also saved to the database for record-keeping
   - Mailgun message ID is stored for tracking

2. **Reply Functionality**:
   - Replies include proper email headers (`In-Reply-To`, `References`)
   - Original email is marked as "replied" after sending
   - Response text is cleared after successful send

3. **Error Handling**:
   - If Mailgun send fails, the email is still saved to database
   - Error details are stored in email metadata
   - User is notified of success/failure

### Testing

1. Make sure your Mailgun account is set up
2. Add recipient email to authorized recipients (if using sandbox)
3. Send a test email through the website
4. Check Mailgun dashboard for delivery status

### Troubleshooting

- **401 Unauthorized**: Check that your API key is correct
- **403 Forbidden**: Verify your domain is set up correctly in Mailgun
- **Email not received**: Check Mailgun logs and spam folder
- **Sandbox limitations**: Remember sandbox can only send to authorized recipients
