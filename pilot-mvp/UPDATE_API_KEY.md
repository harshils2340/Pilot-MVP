# Update Your Mailgun API Key

## ✅ You've Created a New API Key!

Your new API key is:
```
98fa7240afb9064487c5d5f2d5c8aaab-42b8ce75-169fccb2
```

## Step 1: Update Your Environment Variables

Add or update this in your `.env.local` file:

```env
# Your new Mailgun API key
MAILGUN_API_KEY=98fa7240afb9064487c5d5f2d5c8aaab-42b8ce75-169fccb2

# Your Mailgun domain
MAILGUN_DOMAIN=sandbox.mailgun.org

# Email settings
FROM_EMAIL=postmaster@sandbox.mailgun.org
FROM_NAME=Pilot Permit Management
EMAIL_TEST_MODE=true
```

## Step 2: Restart Your Server

**IMPORTANT**: After updating the API key, you MUST restart your Next.js server:

1. Stop your server (press `Ctrl+C` in the terminal)
2. Start it again: `npm run dev`
3. Try sending an email again

## Step 3: Add Authorized Recipients (For Sandbox)

Since you're using `sandbox.mailgun.org`, you need to add authorized recipients:

1. Go to Mailgun Dashboard → **Sending** → **Authorized Recipients**
2. Click **Add Recipient**
3. Enter the email address you want to send to (e.g., `shahmeet8210@gmail.com`)
4. Click **Save**
5. Check your email and click the verification link Mailgun sends

**Note**: With sandbox domain, you can ONLY send to verified authorized recipients!

## Testing

After updating and restarting:

1. Try sending an email through your website
2. Check the console logs - you should see "Email sent via Mailgun" instead of 401 errors
3. Check Mailgun Dashboard → **Sending** → **Logs** for delivery status

## Important Notes

- ✅ The API key format you have is correct (doesn't need to start with "key-")
- ✅ Make sure you copied the ENTIRE key (no spaces or truncation)
- ✅ The key is shown only once - keep it safe!
- ✅ If you lose it, you can create a new one in Mailgun dashboard

## Troubleshooting

If you still get 401 errors:
1. Double-check the API key in `.env.local` matches exactly
2. Make sure you restarted the server
3. Check for extra spaces or line breaks in the API key
4. Verify the domain is correct (`sandbox.mailgun.org`)
