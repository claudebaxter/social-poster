// Instagram Business API endpoints (via Facebook Graph API)
const GRAPH_API_VERSION = 'v18.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

class InstagramAPI {
  constructor(accessToken) {
    this.accessToken = accessToken;
  }

  async post(text) {
    try {
      // First, get the Instagram Business Account ID
      const accountResponse = await fetch(
        `${GRAPH_API_BASE}/me/accounts?fields=instagram_business_account&access_token=${this.accessToken}`
      );
      const accountData = await accountResponse.json();

      if (!accountResponse.ok) {
        throw new Error(accountData.error?.message || 'Failed to fetch Instagram account');
      }

      if (!accountData.data?.[0]?.instagram_business_account?.id) {
        throw new Error('No Instagram Business account found');
      }

      const instagramAccountId = accountData.data[0].instagram_business_account.id;

      // Create a media container
      const createResponse = await fetch(
        `${GRAPH_API_BASE}/${instagramAccountId}/media`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            caption: text,
            media_type: 'CAROUSEL',
            access_token: this.accessToken,
          }),
        }
      );

      const createData = await createResponse.json();

      if (!createResponse.ok) {
        throw new Error(createData.error?.message || 'Failed to create Instagram post');
      }

      // Publish the container
      const publishResponse = await fetch(
        `${GRAPH_API_BASE}/${instagramAccountId}/media_publish`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            creation_id: createData.id,
            access_token: this.accessToken,
          }),
        }
      );

      const publishData = await publishResponse.json();

      if (!publishResponse.ok) {
        throw new Error(publishData.error?.message || 'Failed to publish Instagram post');
      }

      return { success: true, postId: publishData.id };
    } catch (error) {
      console.error('Instagram posting error:', error);
      throw error;
    }
  }

  // OAuth is handled through FacebookAPI since Instagram uses the same system
  static getOAuthURL(clientId, redirectUri) {
    const scopes = [
      'instagram_basic',
      'instagram_content_publish',
      'pages_read_engagement',
    ].join(',');

    return `https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scopes)}`;
  }
}

export default InstagramAPI; 