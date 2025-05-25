# Vercel + Meta OAuth Setup Guide (FREE Solution)

This guide will help you deploy your Meta OAuth integration using Vercel's free tier.

## Why Vercel?
- ✅ **Completely FREE** for personal projects
- ✅ **100 function invocations per day** (resets daily)
- ✅ **10-second execution time** per function
- ✅ **No credit card required**
- ✅ **Automatic HTTPS**
- ✅ **Easy GitHub integration**

## Step 1: Create a Meta Developer App

### 1.1 Create the App
1. Go to [developers.facebook.com](https://developers.facebook.com/)
2. Click **"My Apps"** > **"Create App"**
3. Choose **"Consumer"** (for personal use)
4. Fill in app details:
   - **App Name**: "Social Poster" (or your preferred name)
   - **App Contact Email**: Your email

### 1.2 Add Products
1. In your app dashboard, click **"Add Product"**
2. Add **"Facebook Login"**
3. Add **"Instagram Basic Display"** (if available)

### 1.3 Configure Basic Settings
1. Go to **Settings** > **Basic**
2. Note down your **App ID** and **App Secret** (keep these secret!)
3. Add App Domains: `your-vercel-domain.vercel.app` (you'll get this after deploying)

### 1.4 Configure Facebook Login
1. Go to **Facebook Login** > **Settings**
2. Add Valid OAuth Redirect URIs:
   ```
   https://your-vercel-domain.vercel.app/api/oauth-callback
   social-poster://oauth/callback
   ```

### 1.5 Request Permissions
1. Go to **App Review** > **Permissions and Features**
2. Request these permissions (explain they're for personal social media management):
   - `pages_manage_posts` - To post to your Facebook pages
   - `pages_read_engagement` - To read page information
   - `pages_show_list` - To list your pages
   - `instagram_basic` - Basic Instagram access
   - `instagram_content_publish` - To publish to Instagram
   - `business_management` - For business account access

**Note**: Some permissions may require app review by Meta, but basic posting should work immediately.

## Step 2: Deploy to Vercel

### 2.1 Create GitHub Repository
1. Create a new GitHub repository
2. Push your project code to GitHub:
   ```bash
   git add .
   git commit -m "Add Vercel Meta OAuth integration"
   git push origin main
   ```

### 2.2 Deploy to Vercel
1. Go to [vercel.com](https://vercel.com/)
2. Sign up with your GitHub account (FREE)
3. Click **"New Project"**
4. Import your repository
5. Leave all settings as default and click **"Deploy"**

### 2.3 Get Your Vercel Domain
After deployment, you'll get a URL like: `https://social-poster-abc123.vercel.app`

## Step 3: Configure Environment Variables

### 3.1 In Vercel Dashboard
1. Go to your project in Vercel dashboard
2. Click **"Settings"** > **"Environment Variables"**
3. Add these variables:
   ```
   META_APP_ID = your-meta-app-id-from-step-1
   META_APP_SECRET = your-meta-app-secret-from-step-1
   REDIRECT_URI = https://your-vercel-domain.vercel.app/api/oauth-callback
   ```

### 3.2 Redeploy
1. Go to **"Deployments"** tab
2. Click **"Redeploy"** to apply environment variables

## Step 4: Update Your App URLs

### 4.1 Update Meta App Settings
1. Go back to your Meta Developer app
2. Update **App Domains** with your actual Vercel domain
3. Update **OAuth Redirect URIs** with your actual Vercel domain

### 4.2 Update Your Electron App
1. In `main.js`, replace `your-vercel-domain.vercel.app` with your actual domain
2. In `src/components/ConfigForm.jsx`, the API calls will work automatically since they use relative paths

## Step 5: Set Up Instagram Business Account

For Instagram posting to work:

### 5.1 Create Facebook Business Account
1. Go to [business.facebook.com](https://business.facebook.com/)
2. Create a business account

### 5.2 Create Facebook Page
1. Create a Facebook page for your business/brand
2. This is required for Instagram Business integration

### 5.3 Convert Instagram to Business
1. In your Instagram app, go to **Settings** > **Account**
2. Switch to **Professional Account** > **Business**
3. Connect it to your Facebook page

### 5.4 Link Instagram to Meta App
1. In your Meta Developer console
2. Go to **Instagram Basic Display** (or Instagram Graph API)
3. Add your Instagram account for testing

## Step 6: Test the Integration

### 6.1 Test OAuth Flow
1. Build and run your Electron app
2. Go to Platform Configuration
3. Click **"Login with Meta"**
4. Complete OAuth in browser
5. Should see your connected account

### 6.2 Test Posting
1. Write a test post
2. Select Facebook and/or Instagram
3. Click **"Post to Selected Platforms"**
4. Check your accounts for the posts

## Troubleshooting

### Common Issues

**"Invalid OAuth Redirect URI"**
- Make sure your Vercel domain is correctly added to Meta app settings
- Check that the redirect URI exactly matches what's in your environment variables

**"App Not Live"**
- Your Meta app needs to be in "Live" mode for others to use it
- For personal use, "Development" mode is fine

**"No Facebook Pages Found"**
- Create at least one Facebook page
- Make sure you have the `pages_show_list` permission

**"No Instagram Business Account Found"**
- Ensure your Instagram is converted to Business account
- Make sure it's connected to a Facebook page
- Verify your Meta app has Instagram permissions

**Vercel Function Timeout**
- Functions have a 10-second limit on free tier
- If you hit this limit, the operation will fail

**Daily Limit Reached**
- Vercel free tier has 100 function invocations per day
- Limit resets every 24 hours
- For higher usage, consider upgrading Vercel plan (still much cheaper than other solutions)

## API Endpoints

Your deployed Vercel app will have these endpoints:
- `GET /api/meta-oauth-url` - Get OAuth URL
- `POST /api/exchange-meta-code` - Exchange auth code for token
- `POST /api/post-to-facebook` - Post to Facebook
- `POST /api/post-to-instagram` - Post to Instagram

## Security Notes

- Your Meta app secret is safely stored in Vercel environment variables
- Never commit `.env` files to your repository
- The OAuth flow is secure and follows Meta's best practices
- Tokens are stored locally in your Electron app (not on servers)

## Cost Breakdown

**Total Monthly Cost: $0**
- Vercel: FREE (up to 100 function calls/day)
- Meta Developer Account: FREE
- GitHub: FREE
- Domain: Use the free `.vercel.app` subdomain

This solution gives you professional-grade OAuth integration completely free! 