/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const axios = require("axios");
const cors = require("cors")({origin: true});

// Meta App Configuration - Replace these with your actual Meta app credentials
const META_APP_ID = process.env.META_APP_ID || "your-meta-app-id";
const META_APP_SECRET = process.env.META_APP_SECRET || "your-meta-app-secret";
const REDIRECT_URI = process.env.REDIRECT_URI || "https://your-project.web.app/auth/meta/callback";

// Graph API configuration
const GRAPH_API_VERSION = "v18.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * Generates the Meta OAuth URL for user authentication
 */
exports.getMetaOAuthURL = onRequest((request, response) => {
  cors(request, response, () => {
    try {
      const scopes = [
        "pages_manage_posts",
        "pages_read_engagement",
        "pages_show_list",
        "instagram_basic",
        "instagram_content_publish",
        "business_management",
      ].join(",");

      const oauthUrl = `https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth?` +
        `client_id=${META_APP_ID}&` +
        `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `response_type=code&` +
        `state=${Date.now()}`;

      response.json({oauthUrl});
    } catch (error) {
      logger.error("Error generating OAuth URL:", error);
      response.status(500).json({error: "Failed to generate OAuth URL"});
    }
  });
});

/**
 * Exchanges authorization code for long-lived access token
 */
exports.exchangeMetaCode = onRequest(async (request, response) => {
  cors(request, response, async () => {
    try {
      const {code} = request.body;

      if (!code) {
        return response.status(400).json({
          error: "Authorization code is required",
        });
      }

      // Step 1: Exchange code for short-lived token
      const tokenResponse = await axios.get(
          `${GRAPH_API_BASE}/oauth/access_token`,
          {
            params: {
              client_id: META_APP_ID,
              client_secret: META_APP_SECRET,
              code: code,
              redirect_uri: REDIRECT_URI,
            },
          });

      const shortLivedToken = tokenResponse.data.access_token;

      // Step 2: Exchange short-lived token for long-lived token
      const longLivedResponse = await axios.get(
          `${GRAPH_API_BASE}/oauth/access_token`,
          {
            params: {
              grant_type: "fb_exchange_token",
              client_id: META_APP_ID,
              client_secret: META_APP_SECRET,
              fb_exchange_token: shortLivedToken,
            },
          });

      const longLivedToken = longLivedResponse.data.access_token;

      // Step 3: Get user info and pages
      const userResponse = await axios.get(`${GRAPH_API_BASE}/me`, {
        params: {
          access_token: longLivedToken,
          fields: "id,name,email",
        },
      });

      const pagesResponse = await axios.get(`${GRAPH_API_BASE}/me/accounts`, {
        params: {
          access_token: longLivedToken,
          fields: "id,name,access_token,instagram_business_account",
        },
      });

      response.json({
        success: true,
        accessToken: longLivedToken,
        user: userResponse.data,
        pages: pagesResponse.data.data || [],
      });
    } catch (error) {
      logger.error("Error exchanging code for token:", error);
      response.status(500).json({
        error: "Failed to exchange code for token",
        details: error.response && error.response.data ?
          error.response.data : error.message,
      });
    }
  });
});

/**
 * Posts content to Facebook
 */
exports.postToFacebook = onRequest(async (request, response) => {
  cors(request, response, async () => {
    try {
      const {text, accessToken, pageId} = request.body;

      if (!text || !accessToken) {
        return response.status(400).json({
          error: "Text and access token are required",
        });
      }

      let targetPageId = pageId;
      let pageAccessToken = accessToken;

      // If no specific page ID provided, get the first page
      if (!targetPageId) {
        const pagesResponse = await axios.get(
            `${GRAPH_API_BASE}/me/accounts`,
            {
              params: {
                access_token: accessToken,
              },
            });

        if (!pagesResponse.data.data ||
            pagesResponse.data.data.length === 0) {
          return response.status(400).json({
            error: "No Facebook pages found",
          });
        }

        const page = pagesResponse.data.data[0];
        targetPageId = page.id;
        pageAccessToken = page.access_token;
      }

      // Post to Facebook page
      const postResponse = await axios.post(
          `${GRAPH_API_BASE}/${targetPageId}/feed`,
          {
            message: text,
            access_token: pageAccessToken,
          });

      response.json({
        success: true,
        postId: postResponse.data.id,
        platform: "facebook",
      });
    } catch (error) {
      logger.error("Error posting to Facebook:", error);
      response.status(500).json({
        error: "Failed to post to Facebook",
        details: error.response && error.response.data ?
          error.response.data : error.message,
      });
    }
  });
});

/**
 * Posts content to Instagram
 */
exports.postToInstagram = onRequest(async (request, response) => {
  cors(request, response, async () => {
    try {
      const {text, accessToken, pageId} = request.body;

      if (!text || !accessToken) {
        return response.status(400).json({
          error: "Text and access token are required",
        });
      }

      // Get Instagram Business Account
      let instagramAccountId;

      if (pageId) {
        // Get Instagram account for specific page
        const pageResponse = await axios.get(`${GRAPH_API_BASE}/${pageId}`, {
          params: {
            access_token: accessToken,
            fields: "instagram_business_account",
          },
        });
        const ibAccount = pageResponse.data.instagram_business_account;
        instagramAccountId = ibAccount && ibAccount.id;
      } else {
        // Get first page with Instagram account
        const pagesResponse = await axios.get(
            `${GRAPH_API_BASE}/me/accounts`,
            {
              params: {
                access_token: accessToken,
                fields: "instagram_business_account",
              },
            });

        const pageWithInstagram = pagesResponse.data.data &&
          pagesResponse.data.data.find((page) =>
            page.instagram_business_account);
        const ibAccount = pageWithInstagram &&
          pageWithInstagram.instagram_business_account;
        instagramAccountId = ibAccount && ibAccount.id;
      }

      if (!instagramAccountId) {
        return response.status(400).json({
          error: "No Instagram Business account found",
        });
      }

      // Create media container (text-only post)
      const createResponse = await axios.post(
          `${GRAPH_API_BASE}/${instagramAccountId}/media`,
          {
            caption: text,
            media_type: "CAROUSEL",
            access_token: accessToken,
          });

      const creationId = createResponse.data.id;

      // Publish the media
      const publishResponse = await axios.post(
          `${GRAPH_API_BASE}/${instagramAccountId}/media_publish`,
          {
            creation_id: creationId,
            access_token: accessToken,
          });

      response.json({
        success: true,
        postId: publishResponse.data.id,
        platform: "instagram",
      });
    } catch (error) {
      logger.error("Error posting to Instagram:", error);
      response.status(500).json({
        error: "Failed to post to Instagram",
        details: error.response && error.response.data ?
          error.response.data : error.message,
      });
    }
  });
});
