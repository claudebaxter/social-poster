# Social Poster

A desktop application for posting to multiple social media platforms simultaneously. Write once, post everywhere!

## Features

- Post to multiple platforms with a single click
- Supported platforms:
  - Facebook
  - Instagram
  - Bluesky
  - X (Twitter)
- Secure local credential storage
- Modern, easy-to-use interface

## Installation

### Windows Users

1. Download the latest `Social-Poster-Setup.exe` from the [Releases](https://github.com/yourusername/social-poster/releases) page
2. Run the installer
3. Launch "Social Poster" from your Start menu or desktop shortcut

### Alternative Installation (Portable Version)

1. Download the `social-poster-win32-x64.zip` from the [Releases](https://github.com/yourusername/social-poster/releases) page
2. Extract the ZIP file to any location on your computer
3. Run `social-poster.exe` from the extracted folder

## First-Time Setup

1. Launch Social Poster
2. Click the "Config" option in the right menu
3. Configure your social media credentials:
   - For Facebook/Instagram: Enter your App ID and App Secret
   - For Bluesky: Enter your handle and app password
4. Click "Save Credentials"
5. Switch to "Post" to start sharing content

## Usage

1. Write your post in the text area
2. Select which platforms to post to using the checkboxes
3. Click "Post" to share your content
4. Check the notification for posting status

## System Requirements

- Windows 10 or later
- 4GB RAM minimum
- 500MB free disk space

## Development

To build from source:

1. Clone the repository
```bash
git clone https://github.com/yourusername/social-poster.git
cd social-poster
```

2. Install dependencies
```bash
npm install
```

3. Run in development mode
```bash
npm run dev
```

4. Build distributable
```bash
npm run make
```

## Privacy & Security

- All credentials are stored locally on your device
- No data is sent to external servers except the official platform APIs
- Credentials are stored securely using electron-store

## License

MIT 