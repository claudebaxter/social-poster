// Vercel serverless function for posting to Instagram
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

    // Get Instagram Business Account
    let instagramAccountId;

    if (pageId) {
      // Get Instagram account for specific page
      const pageUrl = `${GRAPH_API_BASE}/${pageId}?` +
        `access_token=${accessToken}&` +
        `fields=instagram_business_account`;

      const pageResponse = await fetch(pageUrl);
      const pageData = await pageResponse.json();

      if (!pageResponse.ok) {
        throw new Error(pageData.error?.message || 'Failed to get page info');
      }

      const ibAccount = pageData.instagram_business_account;
      instagramAccountId = ibAccount && ibAccount.id;
    } else {
      // Get first page with Instagram account
      const pagesUrl = `${GRAPH_API_BASE}/me/accounts?` +
        `access_token=${accessToken}&` +
        `fields=instagram_business_account`;

      const pagesResponse = await fetch(pagesUrl);
      const pagesData = await pagesResponse.json();

      if (!pagesResponse.ok) {
        throw new Error(pagesData.error?.message || 'Failed to get pages');
      }

      const pageWithInstagram = pagesData.data &&
        pagesData.data.find((page) => page.instagram_business_account);
      const ibAccount = pageWithInstagram &&
        pageWithInstagram.instagram_business_account;
      instagramAccountId = ibAccount && ibAccount.id;
    }

    if (!instagramAccountId) {
      return response.status(400).json({
        error: 'No Instagram Business account found'
      });
    }

    // Create media container (text-only post)
    const createUrl = `${GRAPH_API_BASE}/${instagramAccountId}/media`;
    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        caption: text,
        media_type: 'CAROUSEL',
        access_token: accessToken,
      }),
    });

    const createData = await createResponse.json();

    if (!createResponse.ok) {
      throw new Error(createData.error?.message || 'Failed to create Instagram post');
    }

    const creationId = createData.id;

    // Publish the media
    const publishUrl = `${GRAPH_API_BASE}/${instagramAccountId}/media_publish`;
    const publishResponse = await fetch(publishUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        creation_id: creationId,
        access_token: accessToken,
      }),
    });

    const publishData = await publishResponse.json();

    if (!publishResponse.ok) {
      throw new Error(publishData.error?.message || 'Failed to publish Instagram post');
    }

    response.json({
      success: true,
      postId: publishData.id,
      platform: 'instagram'
    });

  } catch (error) {
    console.error('Error posting to Instagram:', error);
    response.status(500).json({
      error: 'Failed to post to Instagram',
      details: error.message
    });
  }
} 