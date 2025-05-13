const SpotifyWebApi = require('spotify-web-api-node');
const Download = require('../models/Download');

// Initialize Spotify API client
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:5000/callback'
});

// Refresh the access token periodically
const refreshSpotifyToken = async () => {
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body['access_token']);
    console.log('Spotify access token refreshed');
    
    // Set a timer to refresh before token expires
    setTimeout(refreshSpotifyToken, (data.body['expires_in'] - 60) * 1000);
  } catch (error) {
    console.error('Error refreshing Spotify token:', error);
    // Try again in 30 seconds
    setTimeout(refreshSpotifyToken, 30000);
  }
};

// Call once to start the refresh cycle
refreshSpotifyToken();

/**
 * Validates a Spotify URL
 * @param {string} url - The Spotify URL to validate
 * @returns {object} - Object containing validity and type
 */
const validateSpotifyUrl = (url) => {
  const trackRegex = /^(https?:\/\/)?(open\.spotify\.com|spotify)\/track\/([a-zA-Z0-9]+)(\?.*)?$/;
  const playlistRegex = /^(https?:\/\/)?(open\.spotify\.com|spotify)\/playlist\/([a-zA-Z0-9]+)(\?.*)?$/;
  
  if (trackRegex.test(url)) {
    return { isValid: true, type: 'track', id: url.match(trackRegex)[3] };
  } else if (playlistRegex.test(url)) {
    return { isValid: true, type: 'playlist', id: url.match(playlistRegex)[3] };
  }
  
  return { isValid: false };
};

/**
 * Get track information from Spotify
 * @param {string} trackId - Spotify track ID
 * @returns {object} - Track metadata
 */
const getTrackInfo = async (trackId) => {
  try {
    const track = await spotifyApi.getTrack(trackId);
    
    return {
      id: track.body.id,
      title: track.body.name,
      artist: track.body.artists.map(artist => artist.name).join(', '),
      primaryArtist: track.body.artists[0].name,
      album: track.body.album.name,
      releaseDate: track.body.album.release_date,
      albumArt: track.body.album.images[0]?.url,
      duration: track.body.duration_ms,
      isrc: track.body.external_ids?.isrc,
      popularity: track.body.popularity
    };
  } catch (error) {
    console.error(`Error fetching track ${trackId}:`, error);
    throw new Error(`Failed to fetch track: ${error.message}`);
  }
};

/**
 * Get playlist information including all tracks
 * @param {string} playlistId - Spotify playlist ID
 * @returns {object} - Playlist metadata with tracks
 */
const getPlaylistInfo = async (playlistId) => {
  try {
    const playlist = await spotifyApi.getPlaylist(playlistId);
    const tracks = [];
    
    // Get all tracks (handle pagination if needed)
    let items = playlist.body.tracks.items;
    let offset = 0;
    const limit = 100;  // Spotify API limit
    
    while (items.length > 0) {
      for (const item of items) {
        if (item.track) {
          tracks.push({
            id: item.track.id,
            title: item.track.name,
            artist: item.track.artists.map(artist => artist.name).join(', '),
            primaryArtist: item.track.artists[0].name,
            album: item.track.album.name,
            releaseDate: item.track.album.release_date,
            albumArt: item.track.album.images[0]?.url,
            duration: item.track.duration_ms,
            isrc: item.track.external_ids?.isrc,
            popularity: item.track.popularity
          });
        }
      }
      
      // Check if we need to fetch more tracks
      offset += limit;
      if (items.length < limit) break;
      
      const moreTracks = await spotifyApi.getPlaylistTracks(playlistId, {
        offset,
        limit
      });
      
      items = moreTracks.body.items;
    }
    
    return {
      id: playlist.body.id,
      name: playlist.body.name,
      description: playlist.body.description,
      owner: playlist.body.owner.display_name,
      imageUrl: playlist.body.images[0]?.url,
      tracksCount: tracks.length,
      tracks
    };
  } catch (error) {
    console.error(`Error fetching playlist ${playlistId}:`, error);
    throw new Error(`Failed to fetch playlist: ${error.message}`);
  }
};

/**
 * Create a new download entry in the database
 * @param {object} downloadData - Information about the download
 * @returns {object} - Created download document
 */
const createDownloadRecord = async (downloadData) => {
  try {
    const download = new Download({
      type: downloadData.type,
      spotifyId: downloadData.id,
      name: downloadData.name || downloadData.title,
      tracks: downloadData.tracks || [downloadData],
      status: 'pending',
      downloadUrl: null
    });
    
    await download.save();
    return download;
  } catch (error) {
    console.error('Error creating download record:', error);
    throw new Error(`Failed to create download record: ${error.message}`);
  }
};

module.exports = {
  validateSpotifyUrl,
  getTrackInfo,
  getPlaylistInfo,
  createDownloadRecord
};