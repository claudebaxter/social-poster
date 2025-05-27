const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
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
    const response = await fetch('https://social-poster-backend.vercel.app/api/exchange-meta-code', {
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

ipcMain.handle('post:social', async (event, { text, platforms, image }) => {
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
          const requestBody = {
            text,
            accessToken,
            ...(image && { image: image.base64, imageMimeType: image.mimeType })
          };

          const response = await fetch('https://social-poster-backend.vercel.app/api/post-to-facebook', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
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
        const pages = credentials?.instagram?.pages;
        
        if (!accessToken) {
          results.instagram = { error: 'Not authenticated' };
        } else if (!image) {
          results.instagram = { error: 'Instagram requires an image to be attached' };
        } else {
          console.log('=== INSTAGRAM POSTING ATTEMPT ===');
          console.log('Access token length:', accessToken.length);
          console.log('Text to post:', text);
          console.log('Image attached:', !!image);
          console.log('Available pages:', pages?.length || 0);
          
          // Find the first page with Instagram account
          const pageWithInstagram = pages?.find(page => page.instagram_business_account);
          const pageId = pageWithInstagram?.id;
          const instagramAccountId = pageWithInstagram?.instagram_business_account?.id;
          
          console.log('Selected page ID:', pageId);
          console.log('Instagram account ID:', instagramAccountId);
          
          // Call Vercel API to post to Instagram
          const requestBody = {
            text,
            accessToken,
            image: image.base64,
            imageMimeType: image.mimeType,
            ...(pageId && { pageId })
          };
          
          console.log('Request body prepared with image');
          
          const response = await fetch('https://social-poster-backend.vercel.app/api/post-to-instagram', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });

          const data = await response.json();
          console.log('Instagram API Response Status:', response.status);
          console.log('Instagram API Response Data:', JSON.stringify(data, null, 2));

          if (!response.ok) {
            console.error('❌ Instagram API Error Details:', data);
            throw new Error(data.error || 'Failed to post to Instagram');
          }

          console.log('✅ Instagram post successful!');
          results.instagram = { success: true, postId: data.postId };
        }
      } catch (error) {
        console.error('Instagram posting error:', error);
        console.error('Full error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        results.instagram = { error: error.message };
      }
    }

    if (platforms.bluesky) {
      let credentials;
      try {
        console.log('=== BLUESKY POSTING ATTEMPT ===');
        credentials = store.get('credentials');
        console.log('Bluesky credentials:', credentials?.bluesky);
        console.log('Image attached:', !!image);
        
        if (!credentials?.bluesky?.handle || !credentials?.bluesky?.appPassword) {
          console.log('❌ Bluesky authentication failed: Missing credentials');
          results.bluesky = { error: 'Not authenticated' };
        } else {
          console.log('✅ Bluesky credentials found');
          console.log('Handle:', credentials.bluesky.handle);
          
          // Clean the handle - remove unicode characters, @ symbols, and whitespace
          let cleanHandle = credentials.bluesky.handle
            .replace(/[\u200B-\u200D\uFEFF\u202A-\u202E]/g, '') // Remove zero-width and formatting characters
            .replace(/^@+/, '') // Remove @ symbols from beginning
            .trim(); // Remove whitespace
          
          console.log('Cleaned handle:', JSON.stringify(cleanHandle));
          
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
          
          let postData = {
            text: text,
          };

          // If image is attached, upload it first
          if (image) {
            console.log('📷 Uploading image to Bluesky...');
            let imageBuffer = Buffer.from(image.base64, 'base64');
            
            // Check Bluesky size limit (976.56KB)
            const blueskySizeLimit = 976 * 1024; // 976KB in bytes
            console.log(`Image size: ${(imageBuffer.length / 1024).toFixed(2)}KB, Limit: ${(blueskySizeLimit / 1024).toFixed(2)}KB`);
            
            if (imageBuffer.length > blueskySizeLimit) {
              console.log('⚠️ Image too large for Bluesky, attempting compression...');
              
              try {
                // Try to use sharp library for image compression if available
                let sharp;
                try {
                  sharp = require('sharp');
                } catch (sharpError) {
                  console.log('Sharp not available in built version, using fallback approach');
                  throw new Error(`Image is too large for Bluesky (${(imageBuffer.length / 1024).toFixed(2)}KB > ${(blueskySizeLimit / 1024).toFixed(0)}KB limit). Please use a smaller image or resize it manually before uploading.`);
                }
                
                let quality = 85; // Start with 85% quality
                let compressedBuffer;
                
                do {
                  compressedBuffer = await sharp(imageBuffer)
                    .jpeg({ quality })
                    .toBuffer();
                  
                  console.log(`🔄 Compressed to ${quality}% quality: ${(compressedBuffer.length / 1024).toFixed(2)}KB`);
                  
                  if (compressedBuffer.length <= blueskySizeLimit) {
                    imageBuffer = compressedBuffer;
                    console.log('✅ Image successfully compressed for Bluesky');
                    break;
                  }
                  
                  quality -= 10; // Reduce quality by 10%
                } while (quality > 30 && compressedBuffer.length > blueskySizeLimit);
                
                if (compressedBuffer.length > blueskySizeLimit) {
                  throw new Error(`Image is too large for Bluesky. Maximum size is ${(blueskySizeLimit / 1024).toFixed(0)}KB. Current size: ${(compressedBuffer.length / 1024).toFixed(2)}KB. Please use a smaller image.`);
                }
              } catch (compressionError) {
                if (compressionError.code === 'MODULE_NOT_FOUND' || compressionError.message.includes('Sharp not available')) {
                  // Sharp not available, suggest manual resize
                  throw new Error(`Image is too large for Bluesky (${(imageBuffer.length / 1024).toFixed(2)}KB > ${(blueskySizeLimit / 1024).toFixed(0)}KB limit). Image compression is not available in this build. Please resize your image manually and try again.`);
                } else {
                  throw compressionError;
                }
              }
            }
            
            const uploadResponse = await agent.uploadBlob(imageBuffer, {
              encoding: image.mimeType,
            });
            
            console.log('✅ Image uploaded successfully!');
            
            // Add image embed to post
            postData.embed = {
              $type: 'app.bsky.embed.images',
              images: [{
                image: uploadResponse.data.blob,
                alt: text.substring(0, 100), // Use post text as alt text (truncated)
              }],
            };
          }
          
          console.log('📝 Attempting to post...');
          const response = await agent.post(postData);
          console.log('✅ Post successful!');
          console.log('Post URI:', response.uri);
          
          results.bluesky = { success: true, uri: response.uri };
        }
      } catch (error) {
        console.error('❌ Bluesky posting error:', error);
        const debugInfo = `Handle: ${credentials?.bluesky?.handle || 'undefined'}`;
        results.bluesky = { error: `${error.message} (Debug: ${debugInfo})` };
      }
    }

    if (platforms.twitter) {
      // Note: Twitter intent URLs don't support image attachments
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
      
      if (image) {
        results.twitter = { 
          success: true, 
          note: 'Image cannot be automatically attached to Twitter posts. Please attach manually in the browser.' 
        };
      } else {
        results.twitter = { success: true };
      }
    }

    return results;
  } catch (error) {
    console.error('Error posting to social media:', error);
    return { error: error.message };
  }
});

// Handle image file selection
ipcMain.handle('select-image', async (event) => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select an image',
      properties: ['openFile'],
      filters: [
        {
          name: 'Images',
          extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']
        }
      ]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true };
    }

    const filePath = result.filePaths[0];
    const fileName = path.basename(filePath);
    const fileStats = fs.statSync(filePath);
    
    // Check file size (limit to 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (fileStats.size > maxSize) {
      return { 
        error: 'File size is too large. Please select an image smaller than 10MB.' 
      };
    }

    // Read file and convert to base64
    const fileBuffer = fs.readFileSync(filePath);
    const base64Data = fileBuffer.toString('base64');
    const mimeType = getMimeType(path.extname(fileName).toLowerCase());
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    return {
      name: fileName,
      path: filePath,
      size: fileStats.size,
      mimeType: mimeType,
      base64: base64Data,
      dataUrl: dataUrl
    };
  } catch (error) {
    console.error('Error selecting image:', error);
    return { error: error.message };
  }
});

// Helper function to get MIME type from file extension
function getMimeType(extension) {
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp'
  };
  return mimeTypes[extension] || 'image/jpeg';
}

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