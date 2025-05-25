// Vercel serverless function for Meta OAuth token exchange
export default async function handler(request, response) {
  // Enable CORS
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code } = request.body;

    if (!code) {
      return response.status(400).json({
        error: 'Authorization code is required'
      });
    }

    // Meta App Configuration from environment variables
    const META_APP_ID = process.env.META_APP_ID;
    const META_APP_SECRET = process.env.META_APP_SECRET;
    const REDIRECT_URI = process.env.REDIRECT_URI;

    if (!META_APP_ID || !META_APP_SECRET || !REDIRECT_URI) {
      return response.status(500).json({
        error: 'Server configuration error: Missing Meta app credentials'
      });
    }

    const GRAPH_API_VERSION = 'v18.0';
    const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

    // Step 1: Exchange code for short-lived token
    const tokenUrl = `${GRAPH_API_BASE}/oauth/access_token?` +
      `client_id=${META_APP_ID}&` +
      `client_secret=${META_APP_SECRET}&` +
      `code=${code}&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(tokenData.error?.message || 'Failed to get access token');
    }

    const shortLivedToken = tokenData.access_token;

    // Step 2: Exchange short-lived token for long-lived token
    const longLivedUrl = `${GRAPH_API_BASE}/oauth/access_token?` +
      `grant_type=fb_exchange_token&` +
      `client_id=${META_APP_ID}&` +
      `client_secret=${META_APP_SECRET}&` +
      `fb_exchange_token=${shortLivedToken}`;

    const longLivedResponse = await fetch(longLivedUrl);
    const longLivedData = await longLivedResponse.json();

    if (!longLivedResponse.ok) {
      throw new Error(longLivedData.error?.message || 'Failed to get long-lived token');
    }

    const longLivedToken = longLivedData.access_token;

    // Step 3: Get user info and pages
    const userUrl = `${GRAPH_API_BASE}/me?` +
      `access_token=${longLivedToken}&` +
      `fields=id,name,email`;

    const userResponse = await fetch(userUrl);
    const userData = await userResponse.json();

    if (!userResponse.ok) {
      throw new Error(userData.error?.message || 'Failed to get user info');
    }

    const pagesUrl = `${GRAPH_API_BASE}/me/accounts?` +
      `access_token=${longLivedToken}&` +
      `fields=id,name,access_token,instagram_business_account`;

    const pagesResponse = await fetch(pagesUrl);
    const pagesData = await pagesResponse.json();

    if (!pagesResponse.ok) {
      throw new Error(pagesData.error?.message || 'Failed to get pages');
    }

    response.json({
      success: true,
      accessToken: longLivedToken,
      user: userData,
      pages: pagesData.data || []
    });

  } catch (error) {
    console.error('Error exchanging code for token:', error);
    response.status(500).json({
      error: 'Failed to exchange code for token',
      details: error.message
    });
  }
} 