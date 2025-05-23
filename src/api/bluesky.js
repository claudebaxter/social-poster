import { BskyAgent } from '@atproto/api';

class BlueskyAPI {
  constructor(handle, appPassword) {
    this.agent = new BskyAgent({
      service: 'https://bsky.social',
    });
    this.handle = handle;
    this.appPassword = appPassword;
  }

  async login() {
    try {
      await this.agent.login({
        identifier: this.handle,
        password: this.appPassword,
      });
      return true;
    } catch (error) {
      console.error('Bluesky login error:', error);
      throw new Error('Failed to authenticate with Bluesky');
    }
  }

  async post(text) {
    try {
      if (!this.agent.session) {
        await this.login();
      }

      const response = await this.agent.post({
        text: text,
        // You can add rich text, images, etc. here
      });

      return {
        success: true,
        uri: response.uri,
        cid: response.cid,
      };
    } catch (error) {
      console.error('Bluesky posting error:', error);
      throw error;
    }
  }

  // Verify credentials without posting
  async verifyCredentials() {
    try {
      await this.login();
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default BlueskyAPI; 