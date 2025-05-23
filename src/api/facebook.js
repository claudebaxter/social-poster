// Facebook Graph API endpoints
const GRAPH_API_VERSION = 'v18.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

class FacebookAPI {
  constructor(accessToken) {
    this.accessToken = accessToken;
  }

  async post(text) {
    try {
      // Get user's pages first
      const response = await fetch(`${GRAPH_API_BASE}/me/accounts?access_token=${this.accessToken}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch pages');
      }

      if (!data.data || data.data.length === 0) {
        throw new Error('No Facebook pages found');
      }

      // Use the first page to post
      const page = data.data[0];
      const pageAccessToken = page.access_token;

      // Post to the page
      const postResponse = await fetch(
        `${GRAPH_API_BASE}/${page.id}/feed`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: text,
            access_token: pageAccessToken,
          }),
        }
      );

      const postData = await postResponse.json();

      if (!postResponse.ok) {
        throw new Error(postData.error?.message || 'Failed to post to Facebook');
      }

      return { success: true, postId: postData.id };
    } catch (error) {
      console.error('Facebook posting error:', error);
      throw error;
    }
  }

  // OAuth URL generator
  static getOAuthURL(clientId, redirectUri) {
    const scopes = [
      'pages_manage_posts',
      'pages_read_engagement',
      'pages_show_list',
    ].join(',');

    return `https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scopes)}`;
  }

  // Exchange code for access token
  static async getAccessToken(clientId, clientSecret, code, redirectUri) {
    try {
      const response = await fetch(
        `${GRAPH_API_BASE}/oauth/access_token?` +
        `client_id=${clientId}&` +
        `client_secret=${clientSecret}&` +
        `code=${code}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to get access token');
      }

      return data.access_token;
    } catch (error) {
      console.error('Error getting Facebook access token:', error);
      throw error;
    }
  }
}

export default FacebookAPI; 