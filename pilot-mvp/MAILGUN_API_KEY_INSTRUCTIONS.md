# How to Get Your Mailgun API Key

## ⚠️ Important: Key ID vs API Key

**The Key ID (`42b8ce75-13887a73`) shown in your Mailgun dashboard is NOT the API key!**

You need to click on the key to reveal the actual secret API key.

## Step-by-Step Instructions

### Step 1: Go to Mailgun Dashboard
1. Visit https://app.mailgun.com/
2. Log in to your account

### Step 2: Navigate to API Keys
1. Click on your account/profile icon (top right)
2. Go to **Settings** → **API Keys**
3. You'll see a table with your keys

### Step 3: Reveal Your Private API Key
1. Find the key with description "Sending Email" (Key ID: `42b8ce75-13887a73`)
2. **Click on the key row** or look for a "Reveal" / "Show" button
3. The actual API key will be displayed - it should start with `key-` (e.g., `key-abc123def456...`)
4. **Copy the ENTIRE key** (it's long, make sure you get it all)

### Step 4: Update Your Environment Variables

Add this to your `.env.local` file:

```env
# Replace with your ACTUAL API key (starts with "key-")
MAILGUN_API_KEY=key-YOUR_ACTUAL_FULL_KEY_HERE

# Your Mailgun domain
MAILGUN_DOMAIN=sandbox.mailgun.org

# Email settings
FROM_EMAIL=postmaster@sandbox.mailgun.org
FROM_NAME=Pilot Permit Management
EMAIL_TEST_MODE=true
```

### Step 5: Restart Your Server
1. Stop your Next.js server (Ctrl+C)
2. Restart: `npm run dev`
3. Try sending an email again

## What Each Key in Your Dashboard Means

1. **Key ID (`42b8ce75-13887a73`)**: Just an identifier - NOT the API key
2. **HTTP Webhook Signing Key**: Used for verifying webhook requests (different purpose)
3. **Verification Public Key**: For email validation (deprecated, don't use)

**You need the PRIVATE API KEY** that starts with `key-`

## Troubleshooting

- **Still getting 401?** Make sure you copied the entire key (no truncation)
- **Key doesn't start with "key-"?** You might be looking at the wrong key
- **Can't find the key?** Look for "Reveal" or "Show" button next to the key

## For Sandbox Domain

Remember: With `sandbox.mailgun.org`, you can only send to:
- Authorized recipients (add them in Mailgun Dashboard → Sending → Authorized Recipients)
- Make sure to verify the recipient email address
