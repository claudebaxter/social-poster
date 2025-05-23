module.exports = {
  packagerConfig: {
    asar: true,
    name: 'Social Poster',
    executableName: 'social-poster',
    out: 'release-builds',
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'social-poster',
        setupExe: 'Social-Poster-Setup.exe',
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