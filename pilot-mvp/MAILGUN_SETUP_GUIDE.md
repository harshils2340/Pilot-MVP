# Mailgun Setup Guide - Fixing 401 Authentication Error

## The Problem

You're getting a `401 Unauthorized` error when trying to send emails. This means Mailgun is rejecting your API key.

## Solution Steps

### Step 1: Get Your Correct Mailgun API Key

1. **Log into Mailgun Dashboard**: https://app.mailgun.com/
2. **Navigate to Settings**: Click on your account → Settings
3. **Go to API Keys**: Click on "API Keys" in the left sidebar
4. **Copy the PRIVATE API Key**: 
   - Look for "Private API key" (NOT Public Validation Key)
   - It should start with `key-` (e.g., `key-abc123...`)
   - Click "Reveal" or "Show" to see the full key
   - Copy the entire key

### Step 2: Update Your Environment Variables

Add or update these in your `.env.local` file:

```env
# Your Mailgun Private API Key (starts with "key-")
MAILGUN_API_KEY=key-YOUR_ACTUAL_KEY_HERE

# Your Mailgun domain
MAILGUN_DOMAIN=sandbox.mailgun.org
# OR use your custom domain if you have one verified

# Email settings
FROM_EMAIL=postmaster@sandbox.mailgun.org
# OR use your verified sender email

FROM_NAME=Pilot Permit Management
EMAIL_TEST_MODE=true
```

### Step 3: For Sandbox Domain (sandbox.mailgun.org)

If you're using the sandbox domain, you **must** add authorized recipients:

1. Go to Mailgun Dashboard → **Sending** → **Authorized Recipients**
2. Click **Add Recipient**
3. Enter the email address you want to send to (e.g., `shahmeet8210@gmail.com`)
4. Click **Save**
5. Check your email and click the verification link Mailgun sends

**Important**: With sandbox domain, you can ONLY send to verified authorized recipients!

### Step 4: Verify Your API Key Format

Your API key should:
- Start with `key-` (e.g., `key-abc123def456...`)
- Be the **Private API key**, not the Public Validation Key
- Be copied completely (no extra spaces or characters)

### Step 5: Test the Configuration

After updating your `.env.local`:

1. Restart your Next.js development server
2. Try sending an email again
3. Check the console logs for detailed error messages

## Common Issues

### Issue 1: API Key Doesn't Start with "key-"
- **Solution**: Make sure you're using the Private API key, not the Public Validation Key

### Issue 2: "Forbidden" Error
- **Solution**: Check that your domain is correct and matches your Mailgun account

### Issue 3: Sandbox Domain Restrictions
- **Solution**: Add recipients to Authorized Recipients list, or use your own verified domain

### Issue 4: API Key Not Working
- **Solution**: 
  1. Generate a new API key in Mailgun dashboard
  2. Make sure you copied the entire key (no truncation)
  3. Check for extra spaces in your `.env.local` file

## Alternative: Use Your Own Domain

For production, you should use your own verified domain:

1. In Mailgun Dashboard → **Sending** → **Domains**
2. Add your domain (e.g., `mail.yourdomain.com`)
3. Follow DNS setup instructions
4. Verify the domain
5. Update `MAILGUN_DOMAIN` in `.env.local` to your domain

## Testing

After setup, test by:
1. Sending a test email through your website
2. Checking Mailgun Dashboard → **Sending** → **Logs** for delivery status
3. Checking the recipient's inbox (and spam folder)

## Need Help?

If you're still getting 401 errors:
1. Double-check the API key in Mailgun dashboard
2. Verify the domain matches your account
3. Check Mailgun logs for more details
4. Ensure you're using the Private API key (starts with "key-")
