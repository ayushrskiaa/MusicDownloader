const path = require('path');
const fs = require('fs');
const Download = require('../models/Download');
const youtubeService = require('../services/youtubeService');
const zipService = require('../services/zipService');

/**
 * Start a download process
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const startDownload = async (req, res) => {
  try {
    const { downloadId } = req.body;
    const socketId = req.body.socketId;
    
    if (!downloadId) {
      return res.status(400).json({ success: false, message: 'Download ID is required' });
    }
    
    const download = await Download.findById(downloadId);
    
    if (!download) {
      return res.status(404).json({ success: false, message: 'Download not found' });
    }
    
    // Check if already downloading or completed
    if (download.status === 'downloading' || download.status === 'processing') {
      return res.status(400).json({ success: false, message: 'Download already in progress' });
    }
    
    if (download.status === 'completed' && download.downloadUrl) {
      return res.json({
        success: true,
        message: 'Download already completed',
        downloadUrl: download.downloadUrl
      });
    }
    
    // Update status to downloading
    download.status = 'downloading';
    download.progress = 0;
    await download.save();
    
    // If user is logged in, associate download with user
    if (req.user) {
      req.user.downloads.push(download._id);
      await req.user.save();
    }
    
    // Start the download process asynchronously
    processDownload(download, socketId, req.app.get('io'))
      .catch(err => console.error('Download process error:', err));
    
    res.json({
      success: true,
      message: 'Download started',
      downloadId: download._id
    });
  } catch (error) {
    console.error('Error starting download:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Process a download (runs asynchronously)
 * @param {object} download - Download document from MongoDB
 * @param {string} socketId - Socket.io socket ID
 * @param {object} io - Socket.io instance
 */
const processDownload = async (download, socketId, io) => {
  try {
    const downloadedFiles = [];
    const totalTracks = download.tracks.length;
    let completedTracks = 0;
    
    // Update overall progress periodically
    const updateOverallProgress = () => {
      const overallProgress = Math.round((completedTracks / totalTracks) * 100);
      
      if (io && socketId) {
        io.to(socketId).emit('overall-progress', {
          id: download._id,
          status: download.status,
          progress: overallProgress,
          completedTracks,
          totalTracks
        });
      }
    };
    
    // Initial progress update
    updateOverallProgress();
    
    // Download each track
    for (const track of download.tracks) {
      try {
        const options = {
          io,
          socketId,
          downloadId: download._id
        };
        
        const filePath = await youtubeService.downloadAndProcessTrack(track, options);
        downloadedFiles.push(filePath);
        completedTracks++;
        
        // Update progress
        updateOverallProgress();
      } catch (error) {
        console.error(`Error processing track ${track.title}:`, error);
        // Continue with next track
      }
    }
    
    // Create a ZIP file if there are downloaded files
    if (downloadedFiles.length > 0) {
      // Update status to processing
      download.status = 'processing';
      await download.save();
      
      if (io && socketId) {
        io.to(socketId).emit('overall-progress', {
          id: download._id,
          status: 'processing',
          message: 'Creating ZIP file',
          progress: 95
        });
      }
      
      // Generate zip name based on download type
      const zipName = download.type === 'playlist' 
        ? download.name 
        : `${download.tracks[0].artist} - ${download.tracks[0].title}`;
      
      const zipPath = await zipService.createZipFile(downloadedFiles, zipName);
      
      // Create public download URL
      const zipFileName = path.basename(zipPath);
      const downloadUrl = `/api/download/file/${zipFileName}`;
      
      // Update download status
      download.status = 'completed';
      download.progress = 100;
      download.downloadUrl = downloadUrl;
      download.zipPath = zipPath;
      await download.save();
      
      if (io && socketId) {
        io.to(socketId).emit('overall-progress', {
          id: download._id,
          status: 'completed',
          message: 'Download completed',
          progress: 100,
          downloadUrl
        });
      }
    } else {
      // No files were downloaded
      download.status = 'failed';
      download.progress = 0;
      await download.save();
      
      if (io && socketId) {
        io.to(socketId).emit('overall-progress', {
          id: download._id,
          status: 'failed',
          message: 'No tracks were downloaded',
          progress: 0
        });
      }
    }
  } catch (error) {
    console.error('Error in download process:', error);
    
    // Update download status to failed
    download.status = 'failed';
    download.progress = 0;
    await download.save();
    
    if (io && socketId) {
      io.to(socketId).emit('overall-progress', {
        id: download._id,
        status: 'failed',
        message: `Download failed: ${error.message}`,
        progress: 0
      });
    }
  }
};

/**
 * Get a file download
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const getDownloadFile = async (req, res) => {
  try {
    const { filename } = req.params;
    
    if (!filename) {
      return res.status(400).json({ success: false, message: 'Filename is required' });
    }
    
    const zipFilePath = path.join(__dirname, '../downloads/zip', filename);
    
    // Add file existence check
    if (!fs.existsSync(zipFilePath)) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    
    // Add error handling for file download
    res.download(zipFilePath, (err) => {
      if (err) {
        console.error('Error during file download:', err);
        // Only send error if headers haven't been sent
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: 'Error downloading file' });
        }
      }
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
/**
 * Get user's download history
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const getDownloadHistory = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    // Populate user's downloads
    await req.user.populate('downloads');
    
    // Format downloads for response
    const downloads = req.user.downloads.map(download => ({
      id: download._id,
      type: download.type,
      name: download.name,
      status: download.status,
      trackCount: download.tracks.length,
      downloadUrl: download.downloadUrl,
      createdAt: download.createdAt
    }));
    
    res.json({
      success: true,
      data: downloads
    });
  } catch (error) {
    console.error('Error getting download history:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  startDownload,
  getDownloadFile,
  getDownloadHistory
};