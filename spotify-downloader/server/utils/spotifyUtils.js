/**
 * Spotify utility functions
 */

/**
 * Extract track ID from Spotify URL
 * @param {string} url - Spotify URL
 * @returns {string|null} - Track ID or null if invalid
 */
const extractTrackId = (url) => {
  const trackRegex = /^(https?:\/\/)?(open\.spotify\.com|spotify)\/track\/([a-zA-Z0-9]+)(\?.*)?$/;
  const match = url.match(trackRegex);
  
  return match ? match[3] : null;
};

/**
 * Extract playlist ID from Spotify URL
 * @param {string} url - Spotify URL
 * @returns {string|null} - Playlist ID or null if invalid
 */
const extractPlaylistId = (url) => {
  const playlistRegex = /^(https?:\/\/)?(open\.spotify\.com|spotify)\/playlist\/([a-zA-Z0-9]+)(\?.*)?$/;
  const match = url.match(playlistRegex);
  
  return match ? match[3] : null;
};

/**
 * Format track object for consistent structure
 * @param {object} trackData - Raw track data from Spotify API
 * @returns {object} - Formatted track data
 */
const formatTrackData = (trackData) => {
  return {
    id: trackData.id,
    title: trackData.name,
    artist: trackData.artists.map(artist => artist.name).join(', '),
    primaryArtist: trackData.artists[0]?.name || '',
    album: trackData.album?.name || '',
    releaseDate: trackData.album?.release_date || '',
    albumArt: trackData.album?.images[0]?.url || '',
    duration: trackData.duration_ms,
    isrc: trackData.external_ids?.isrc || '',
    popularity: trackData.popularity || 0
  };
};

module.exports = {
  extractTrackId,
  extractPlaylistId,
  formatTrackData
};