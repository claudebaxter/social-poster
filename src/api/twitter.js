class TwitterAPI {
  static post(text) {
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    // Open the URL in the default browser
    require('electron').shell.openExternal(tweetUrl);
    return { success: true };
  }
}

export default TwitterAPI; 