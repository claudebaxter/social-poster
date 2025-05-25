const { app, BrowserWindow, ipcMain, shell } = require('electron');
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

// Handle opening external URLs
ipcMain.handle('open-external', async (event, url) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    console.error('Error opening external URL:', error);
    return { error: error.message };
  }
});

// Handle Meta OAuth code exchange
ipcMain.handle('exchange-meta-code', async (event, code) => {
  try {
    // Call Vercel API to exchange code for token
    const response = await fetch('https://your-vercel-domain.vercel.app/api/exchange-meta-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to exchange code for token');
    }

    // Store the access token and user info
    const credentials = store.get('credentials') || {};
    credentials.facebook = {
      accessToken: data.accessToken,
      userInfo: data.user,
      pages: data.pages,
    };
    credentials.instagram = {
      accessToken: data.accessToken,
      userInfo: data.user,
      pages: data.pages,
    };
    
    store.set('credentials', credentials);

    return { success: true, user: data.user, pages: data.pages };
  } catch (error) {
    console.error('Error exchanging Meta code:', error);
    return { error: error.message };
  }
});

ipcMain.handle('post:social', async (event, { text, platforms }) => {
  const results = {};
  
  try {
    if (platforms.facebook) {
      try {
        const credentials = store.get('credentials');
        const accessToken = credentials?.facebook?.accessToken;
        
        if (!accessToken) {
          results.facebook = { error: 'Not authenticated' };
        } else {
          // Call Vercel API to post to Facebook
          const response = await fetch('https://your-vercel-domain.vercel.app/api/post-to-facebook', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text,
              accessToken,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to post to Facebook');
          }

          results.facebook = { success: true, postId: data.postId };
        }
      } catch (error) {
        console.error('Facebook posting error:', error);
        results.facebook = { error: error.message };
      }
    }

    if (platforms.instagram) {
      try {
        const credentials = store.get('credentials');
        const accessToken = credentials?.instagram?.accessToken;
        
        if (!accessToken) {
          results.instagram = { error: 'Not authenticated' };
        } else {
          // Call Vercel API to post to Instagram
          const response = await fetch('https://your-vercel-domain.vercel.app/api/post-to-instagram', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text,
              accessToken,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to post to Instagram');
          }

          results.instagram = { success: true, postId: data.postId };
        }
      } catch (error) {
        console.error('Instagram posting error:', error);
        results.instagram = { error: error.message };
      }
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
      
      shell.openExternal(tweetUrl);
      results.twitter = { success: true };
    }

    return results;
  } catch (error) {
    console.error('Error posting to social media:', error);
    return { error: error.message };
  }
});

// Handle OAuth callback URLs
app.setAsDefaultProtocolClient('social-poster');

app.on('open-url', (event, url) => {
  event.preventDefault();
  
  // Handle Meta OAuth callback
  if (url.includes('code=')) {
    const urlObj = new URL(url);
    const code = urlObj.searchParams.get('code');
    
    if (code) {
      // Send the code to the renderer process
      if (mainWindow) {
        mainWindow.webContents.send('meta-oauth-callback', { code });
      }
    }
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