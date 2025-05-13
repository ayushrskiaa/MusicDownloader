const spotifyService = require('../services/spotifyService');
const Download = require('../models/Download');

/**
 * Validate a Spotify URL
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const validateUrl = async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ success: false, message: 'URL is required' });
    }
    
    const urlInfo = spotifyService.validateSpotifyUrl(url);
    
    if (!urlInfo.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid Spotify URL. Please provide a valid Spotify track or playlist URL.'
      });
    }
    
    res.json({
      success: true,
      type: urlInfo.type,
      id: urlInfo.id
    });
  } catch (error) {
    console.error('Error validating URL:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get information about a track or playlist from Spotify
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const getSpotifyInfo = async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ success: false, message: 'URL is required' });
    }
    
    const urlInfo = spotifyService.validateSpotifyUrl(url);
    
    if (!urlInfo.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid Spotify URL. Please provide a valid Spotify track or playlist URL.'
      });
    }
    
    let result;
    
    if (urlInfo.type === 'track') {
      result = await spotifyService.getTrackInfo(urlInfo.id);
      
      // Create a download record
      const download = await spotifyService.createDownloadRecord({
        type: 'track',
        id: result.id,
        title: result.title,
        tracks: [result]
      });
      
      return res.json({
        success: true,
        type: 'track',
        downloadId: download._id,
        data: result
      });
    } else if (urlInfo.type === 'playlist') {
      result = await spotifyService.getPlaylistInfo(urlInfo.id);
      
      // Create a download record
      const download = await spotifyService.createDownloadRecord({
        type: 'playlist',
        id: result.id,
        name: result.name,
        tracks: result.tracks
      });
      
      return res.json({
        success: true,
        type: 'playlist',
        downloadId: download._id,
        data: result
      });
    }
    
    res.status(400).json({ success: false, message: 'Unsupported content type' });
  } catch (error) {
    console.error('Error getting Spotify info:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get status of a download
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const getDownloadStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    const download = await Download.findById(id);
    
    if (!download) {
      return res.status(404).json({ success: false, message: 'Download not found' });
    }
    
    res.json({
      success: true,
      data: download
    });
  } catch (error) {
    console.error('Error getting download status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  validateUrl,
  getSpotifyInfo,
  getDownloadStatus
};