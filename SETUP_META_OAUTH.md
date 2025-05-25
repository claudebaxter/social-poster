# Meta OAuth Setup Guide

This guide will help you set up Facebook and Instagram OAuth integration for the Social Poster app.

## Prerequisites

1. **Meta Developer Account**: Create an account at [developers.facebook.com](https://developers.facebook.com/)
2. **Firebase Project**: Your Firebase project should already be set up
3. **Facebook Business Account**: For Instagram posting, you'll need a Facebook Business account connected to an Instagram Business account

## Step 1: Create a Meta Developer App

1. Go to [developers.facebook.com](https://developers.facebook.com/)
2. Click "My Apps" > "Create App"
3. Choose "Consumer" or "Business" depending on your use case
4. Fill in the app details:
   - **App Name**: Choose a descriptive name (e.g., "Social Poster")
   - **App Contact Email**: Your email address
   - **App Purpose**: Choose appropriate purpose

## Step 2: Configure App Settings

### Basic Settings
1. In your app dashboard, go to **Settings** > **Basic**
2. Note down your **App ID** and **App Secret** (you'll need these later)
3. Add your app domains if applicable

### Products Configuration
1. Go to **App Review** > **Permissions and Features**
2. Request the following permissions:
   - `pages_manage_posts` - To post to Facebook pages
   - `pages_read_engagement` - To read page information  
   - `pages_show_list` - To list user's pages
   - `instagram_basic` - Basic Instagram access
   - `instagram_content_publish` - To publish Instagram content
   - `business_management` - For business account access

### OAuth Redirect URIs
1. Go to **Facebook Login** > **Settings**
2. Add your Firebase Functions URL as a valid OAuth redirect URI:
   ```
   https://your-project-id.cloudfunctions.net/auth/meta/callback
   ```
3. Also add your app's custom protocol for Electron:
   ```
   social-poster://oauth/callback
   ```

## Step 3: Configure Firebase Functions

### Environment Variables
1. In your Firebase project, set the following environment variables:
   ```bash
   firebase functions:config:set meta.app_id="YOUR_META_APP_ID"
   firebase functions:config:set meta.app_secret="YOUR_META_APP_SECRET"
   firebase functions:config:set meta.redirect_uri="https://your-project-id.web.app/auth/meta/callback"
   ```

### Deploy Functions
1. Navigate to the `firebase` directory
2. Deploy the functions:
   ```bash
   firebase deploy --only functions
   ```

## Step 4: Update Your App Configuration

1. Open `firebase/functions/index.js`
2. Replace the placeholder values with your actual:
   - Firebase Functions URL (replace `your-project-id`)
   - Meta app credentials (set via environment variables)

3. In your main application:
   - Update `src/components/ConfigForm.jsx` to use your actual Firebase Functions URL
   - Update `main.js` with your actual Firebase Functions URL

## Step 5: Test the Integration

### Testing OAuth Flow
1. Start your Electron app
2. Go to the Platform Configuration section
3. Click "Login with Meta" for Facebook & Instagram
4. Complete the OAuth flow in your browser
5. Return to the app - you should see your connected account

### Testing Posting
1. Go to the main posting interface
2. Enter some test content
3. Select Facebook and/or Instagram
4. Click "Post to Selected Platforms"
5. Check your Facebook page and Instagram account for the posts

## Instagram Business Account Setup

For Instagram posting to work, you need:

1. **Facebook Business Account**: Create one at [business.facebook.com](https://business.facebook.com/)
2. **Facebook Page**: Create a Facebook page for your business
3. **Instagram Business Account**: 
   - Convert your Instagram account to a Business account
   - Connect it to your Facebook page
4. **Instagram Graph API Access**: This is automatically included when you have the Facebook permissions

## Troubleshooting

### Common Issues

**"No Facebook pages found"**
- Make sure you have created at least one Facebook page
- Ensure your app has the `pages_show_list` permission

**"No Instagram Business account found"**
- Verify your Instagram account is converted to a Business account
- Ensure it's connected to a Facebook page
- Check that your Meta app has Instagram permissions

**OAuth callback not working**
- Verify your redirect URIs are correctly configured in Meta Developer settings
- Check that your Firebase Functions are deployed and accessible
- Ensure your Electron app is registered as the default handler for `social-poster://` protocol

**API Rate Limits**
- Meta APIs have rate limits - space out your posts
- Consider implementing retry logic with exponential backoff

### Debug Mode
- Enable debug logging in Firebase Functions
- Check the browser developer tools for network errors
- Use Meta's Graph API Explorer to test API calls manually

## Security Notes

- Never commit your Meta app secret to version control
- Use environment variables for all sensitive credentials
- Regularly rotate your app secret
- Monitor your app's usage in Meta Developer console
- Be aware of Meta's API usage policies and rate limits

## API Limitations

- **Instagram**: Text-only posts have limitations; consider adding image support
- **Facebook**: Posting to personal profiles requires additional permissions
- **Rate Limits**: Both platforms have posting rate limits
- **Content Policies**: All posts must comply with Meta's community standards 