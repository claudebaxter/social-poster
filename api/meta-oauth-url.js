// Vercel serverless function for Meta OAuth URL generation
export default async function handler(request, response) {
  // Enable CORS
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  try {
    // Meta App Configuration from environment variables
    const META_APP_ID = process.env.META_APP_ID;
    const REDIRECT_URI = process.env.REDIRECT_URI;

    if (!META_APP_ID || !REDIRECT_URI) {
      return response.status(500).json({
        error: 'Server configuration error: Missing Meta app credentials'
      });
    }

    const GRAPH_API_VERSION = 'v18.0';
    
    const scopes = [
      'pages_manage_posts',
      'pages_read_engagement',
      'pages_show_list',
      'instagram_basic',
      'instagram_content_publish',
      'business_management'
    ].join(',');

    const oauthUrl = `https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth?` +
      `client_id=${META_APP_ID}&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `response_type=code&` +
      `state=${Date.now()}`;

    response.json({ oauthUrl });
  } catch (error) {
    console.error('Error generating OAuth URL:', error);
    response.status(500).json({ error: 'Failed to generate OAuth URL' });
  }
} 