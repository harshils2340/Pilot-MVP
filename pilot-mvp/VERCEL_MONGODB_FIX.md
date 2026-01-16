# Fix MongoDB Atlas Connection on Vercel

## Problem
You're getting `MongooseServerSelectionError: Could not connect to any servers` because Vercel's IP addresses aren't whitelisted in MongoDB Atlas.

## Solution: Allow All IPs in MongoDB Atlas

### Steps:

1. **Log in to MongoDB Atlas**
   - Go to https://cloud.mongodb.com/
   - Sign in to your account

2. **Navigate to Network Access**
   - Click on "Network Access" in the left sidebar
   - Or go directly to: https://cloud.mongodb.com/v2#/security/network/whitelist

3. **Add IP Address**
   - Click the green "ADD IP ADDRESS" button
   - Click "Allow Access from Anywhere" 
   - This will add `0.0.0.0/0` which allows all IPs
   - Add a comment: "Vercel deployment"
   - Click "Confirm"

4. **Wait for Changes to Apply**
   - It may take 1-2 minutes for the changes to propagate

5. **Verify in Vercel**
   - The next API request should work
   - Check Vercel logs to confirm connection is successful

## Alternative: Whitelist Vercel IP Ranges (Optional)

If you want to be more restrictive, you can add Vercel's IP ranges:
- Vercel publishes their IP ranges at: https://vercel.com/docs/rest-api/rate-limits#ip-addresses
- However, `0.0.0.0/0` is recommended for serverless deployments since IPs change frequently

## Security Note

While `0.0.0.0/0` allows all IPs, your database is still protected by:
- Username/password authentication (via MONGODB_URI)
- Database user permissions
- MongoDB Atlas firewall rules

Make sure your `MONGODB_URI` environment variable in Vercel is:
- Set correctly
- Uses a database user with limited permissions (not admin)
- Stored securely in Vercel environment variables

## Verify MONGODB_URI in Vercel

1. Go to your Vercel project dashboard
2. Settings → Environment Variables
3. Ensure `MONGODB_URI` is set for "Production", "Preview", and "Development"
4. The format should be: `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`

