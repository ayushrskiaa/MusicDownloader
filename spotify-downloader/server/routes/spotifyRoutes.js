const express = require('express');
const router = express.Router();
const spotifyController = require('../controllers/spotifyController');
const { optionalAuth } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/spotify/validate
 * @desc    Validate a Spotify URL
 * @access  Public
 */
router.post('/validate', spotifyController.validateUrl);

/**
 * @route   POST /api/spotify/info
 * @desc    Get information about a track or playlist
 * @access  Public
 */
router.post('/info', optionalAuth, spotifyController.getSpotifyInfo);

/**
 * @route   GET /api/spotify/download/:id
 * @desc    Get the status of a download
 * @access  Public
 */
router.get('/download/:id', spotifyController.getDownloadStatus);

module.exports = router;