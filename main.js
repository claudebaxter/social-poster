const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');
const store = new Store();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;

const isDev = process.env.NODE_ENV === 'development';

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Load the index.html file.
  try {
    if (isDev && process.env.MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      mainWindow.loadURL(process.env.MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
      // In production, load from the dist directory
      mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
    }
  } catch (error) {
    console.error('Error loading window:', error);
  }

  // Open the DevTools in development.
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
};

// IPC Handlers
ipcMain.handle('store:get', (event, key) => {
  return store.get(key);
});

ipcMain.handle('store:set', (event, { key, value }) => {
  store.set(key, value);
  return true;
});

ipcMain.handle('post:social', async (event, { text, platforms }) => {
  const results = {};
  
  try {
    if (platforms.facebook) {
      // Facebook posting logic will go here
      const token = store.get('facebook.token');
      if (!token) {
        results.facebook = { error: 'Not authenticated' };
      }
      // TODO: Implement Facebook posting
    }

    if (platforms.instagram) {
      // Instagram posting logic will go here
      const token = store.get('instagram.token');
      if (!token) {
        results.instagram = { error: 'Not authenticated' };
      }
      // TODO: Implement Instagram posting
    }

    if (platforms.bluesky) {
      let credentials;
      try {
        console.log('=== BLUESKY POSTING ATTEMPT ===');
        credentials = store.get('credentials');
        console.log('Retrieved credentials:', JSON.stringify(credentials, null, 2));
        console.log('Bluesky credentials:', credentials?.bluesky);
        
        if (!credentials?.bluesky?.handle || !credentials?.bluesky?.appPassword) {
          console.log('❌ Bluesky authentication failed: Missing credentials');
          results.bluesky = { error: 'Not authenticated' };
        } else {
          console.log('✅ Bluesky credentials found');
          console.log('Handle:', credentials.bluesky.handle);
          console.log('Password length:', credentials.bluesky.appPassword.length);
          
          // Clean the handle - remove unicode characters, @ symbols, and whitespace
          let cleanHandle = credentials.bluesky.handle
            .replace(/[\u200B-\u200D\uFEFF\u202A-\u202E]/g, '') // Remove zero-width and formatting characters
            .replace(/^@+/, '') // Remove @ symbols from beginning
            .trim(); // Remove whitespace
          
          console.log('Original handle:', JSON.stringify(credentials.bluesky.handle));
          console.log('Cleaned handle:', JSON.stringify(cleanHandle));
          console.log('Attempting Bluesky login with handle:', cleanHandle);
          
          // Import and use the Bluesky API
          const { BskyAgent } = require('@atproto/api');
          
          const agent = new BskyAgent({
            service: 'https://bsky.social',
          });
          
          console.log('🔐 Attempting login...');
          const loginResult = await agent.login({
            identifier: cleanHandle,
            password: credentials.bluesky.appPassword,
          });
          console.log('✅ Login successful!');
          console.log('Login response:', JSON.stringify(loginResult, null, 2));
          console.log('Agent session:', agent.session);
          
          console.log('📝 Attempting to post...');
          console.log('Post text:', text);
          const response = await agent.post({
            text: text,
          });
          console.log('✅ Post successful!');
          console.log('Post response:', JSON.stringify(response, null, 2));
          console.log('Post URI:', response.uri);
          console.log('Post CID:', response.cid);
          
          results.bluesky = { success: true, uri: response.uri, debug: `Posted! URI: ${response.uri}, CID: ${response.cid}` };
        }
      } catch (error) {
        console.error('❌ Bluesky posting error:', error);
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
          cause: error.cause
        });
        const debugInfo = `Handle: ${credentials?.bluesky?.handle || 'undefined'}, Password length: ${credentials?.bluesky?.appPassword?.length || 0}`;
        results.bluesky = { error: `${error.message} (Debug: ${debugInfo})` };
      }
    }

    if (platforms.twitter) {
      // Get the custom intent URL from credentials, or use default
      const credentials = store.get('credentials') || {};
      const intentBaseUrl = credentials.twitter?.intentUrl || 'https://twitter.com/intent/tweet';
      
      // Build the URL with proper parameter handling
      const urlParams = new URLSearchParams();
      
      // Add the text parameter
      urlParams.append('text', text);
      
      // If there are custom hashtags in the base URL, extract and add them
      const baseUrlObj = new URL(intentBaseUrl);
      const hashtags = baseUrlObj.searchParams.get('hashtags');
      if (hashtags) {
        urlParams.append('hashtags', hashtags);
      }
      
      // Construct the final URL
      const tweetUrl = `https://twitter.com/intent/tweet?${urlParams.toString()}`;
      
      require('electron').shell.openExternal(tweetUrl);
      results.twitter = { success: true };
    }

    return results;
  } catch (error) {
    console.error('Error posting to social media:', error);
    return { error: error.message };
  }
});

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
}); 