const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');
const store = new Store();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;

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
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools in development.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
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
      // Bluesky posting logic will go here
      const credentials = store.get('bluesky.credentials');
      if (!credentials) {
        results.bluesky = { error: 'Not authenticated' };
      }
      // TODO: Implement Bluesky posting
    }

    if (platforms.twitter) {
      // Open Twitter intent URL in default browser
      const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
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