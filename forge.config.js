module.exports = {
  packagerConfig: {
    asar: true,
    icon: './src/assets/icon.ico',
    name: 'Social Poster',
    executableName: 'social-poster',
    win32metadata: {
      CompanyName: 'Social Poster',
      FileDescription: 'Social Media Post Manager',
      OriginalFilename: 'social-poster.exe',
      ProductName: 'Social Poster',
      InternalName: 'social-poster',
    },
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'social-poster',
        authors: 'Your Name',
        exe: 'social-poster.exe',
        setupExe: 'Social-Poster-Setup.exe',
        setupIcon: './src/assets/icon.ico',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['win32'],
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-vite',
      config: {
        build: [
          {
            entry: 'src/main.js',
            config: 'vite.config.js',
          },
        ],
        renderer: [
          {
            name: 'main_window',
            config: 'vite.config.js',
          },
        ],
      },
    },
  ],
}; 