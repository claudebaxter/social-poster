// Vercel serverless function for posting to Facebook
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
    const { text, accessToken, pageId } = request.body;

    if (!text || !accessToken) {
      return response.status(400).json({
        error: 'Text and access token are required'
      });
    }

    const GRAPH_API_VERSION = 'v18.0';
    const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

    let targetPageId = pageId;
    let pageAccessToken = accessToken;

    // If no specific page ID provided, get the first page
    if (!targetPageId) {
      const pagesUrl = `${GRAPH_API_BASE}/me/accounts?access_token=${accessToken}`;
      const pagesResponse = await fetch(pagesUrl);
      const pagesData = await pagesResponse.json();

      if (!pagesResponse.ok) {
        throw new Error(pagesData.error?.message || 'Failed to fetch pages');
      }

      if (!pagesData.data || pagesData.data.length === 0) {
        return response.status(400).json({
          error: 'No Facebook pages found'
        });
      }

      const page = pagesData.data[0];
      targetPageId = page.id;
      pageAccessToken = page.access_token;
    }

    // Post to Facebook page
    const postUrl = `${GRAPH_API_BASE}/${targetPageId}/feed`;
    const postResponse = await fetch(postUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: text,
        access_token: pageAccessToken,
      }),
    });

    const postData = await postResponse.json();

    if (!postResponse.ok) {
      throw new Error(postData.error?.message || 'Failed to post to Facebook');
    }

    response.json({
      success: true,
      postId: postData.id,
      platform: 'facebook'
    });

  } catch (error) {
    console.error('Error posting to Facebook:', error);
    response.status(500).json({
      error: 'Failed to post to Facebook',
      details: error.message
    });
  }
} 