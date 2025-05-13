const express = require('express');
const router = express.Router();
const downloadController = require('../controllers/downloadController');
const { optionalAuth } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/download/start
 * @desc    Start a download process
 * @access  Public
 */
router.post('/start', optionalAuth, downloadController.startDownload);

/**
 * @route   GET /api/download/file/:filename
 * @desc    Download a file
 * @access  Public
 */
router.get('/file/:filename', downloadController.getDownloadFile);

/**
 * @route   GET /api/download/history
 * @desc    Get user's download history
 * @access  Private
 */
router.get('/history', optionalAuth, downloadController.getDownloadHistory);

module.exports = router;