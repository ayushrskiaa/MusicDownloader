const path = require('path');  
module.exports = {
  // Server configuration
  port: process.env.PORT || 5000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  
  // MongoDB configuration
  mongoURI: process.env.MONGODB_URI || 'mongodb://localhost:27017/spotify-downloader',
  
  // Spotify API configuration
  spotify: {
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:5000/callback'
  },
  
  // File paths
   paths: {
    temp: path.join(__dirname, '../downloads/temp'),
    output: path.join(__dirname, '../downloads/output'),
    zip: path.join(__dirname, '../downloads/zip')
  },
  
  // Download settings
  download: {
    zipExpiry: 24, // Hours before zip files are deleted
    audioBitrate: 320 // MP3 bitrate in kbps
  },
  
  // Socket.io settings
  socket: {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  }
};